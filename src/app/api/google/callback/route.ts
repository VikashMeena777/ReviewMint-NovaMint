import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/google/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const origin = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(`${origin}/connections?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/connections?error=no_code`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${origin}/connections?error=not_configured`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("[Google OAuth] Token error:", tokens);
      return NextResponse.redirect(`${origin}/connections?error=token_exchange_failed`);
    }

    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    // Get GBP accounts
    let accountName = "Google Business Profile";
    let locationId = null;
    let locationName = null;
    let locationAddress = null;

    try {
      const accountsResponse = await fetch(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const account = accountsData.accounts?.[0];

        if (account) {
          accountName = account.accountName || account.name;

          // Try to get locations
          const locationsResponse = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress`,
            { headers: { Authorization: `Bearer ${tokens.access_token}` } }
          );

          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            const location = locationsData.locations?.[0];
            if (location) {
              locationId = location.name;
              locationName = location.title;
              const addr = location.storefrontAddress;
              if (addr) {
                locationAddress = [addr.addressLines?.[0], addr.locality, addr.administrativeArea]
                  .filter(Boolean)
                  .join(", ");
              }
            }
          }
        }
      }
    } catch (gbpError) {
      console.error("[Google OAuth] GBP API error (non-fatal):", gbpError);
      // Non-fatal — tokens are still valid, just GBP data not available
    }

    // Save to Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const { error: insertError } = await supabase.from("google_connections").insert({
      user_id: user.id,
      google_account_id: userInfo.id,
      google_email: userInfo.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      account_name: accountName,
      location_id: locationId,
      location_name: locationName,
      location_address: locationAddress,
      is_active: true,
    });

    if (insertError) {
      console.error("[Google OAuth] DB insert error:", insertError);
      return NextResponse.redirect(`${origin}/connections?error=save_failed`);
    }

    return NextResponse.redirect(`${origin}/connections?success=connected`);
  } catch (err) {
    console.error("[Google OAuth] Unexpected error:", err);
    return NextResponse.redirect(`${origin}/connections?error=unexpected`);
  }
}
