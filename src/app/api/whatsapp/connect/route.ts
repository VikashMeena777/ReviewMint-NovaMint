// ============================================
// WhatsApp Connect — Embedded Signup Token Exchange
// Adapted from AssistMint for ReviewMint
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { submitReviewTemplates } from '@/lib/whatsapp/client';

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const GRAPH_API = 'https://graph.facebook.com/v25.0';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, waba_id, phone_number_id } = body;

    if (!waba_id || !phone_number_id) {
      return NextResponse.json(
        { error: 'Missing waba_id or phone_number_id' },
        { status: 400 }
      );
    }

    let accessToken = '';

    // Exchange code for access token
    if (code) {
      try {
        const tokenUrl = new URL(`${GRAPH_API}/oauth/access_token`);
        tokenUrl.searchParams.set('client_id', META_APP_ID);
        tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
        tokenUrl.searchParams.set('code', code);

        const tokenResp = await fetch(tokenUrl.toString(), { method: 'GET' });
        const tokenData = await tokenResp.json();

        if (tokenData.error) {
          console.error('[WhatsApp Connect] Token exchange failed:', tokenData.error);
          return NextResponse.json(
            { error: `Token exchange failed: ${tokenData.error.message || 'Unknown error'}` },
            { status: 400 }
          );
        }

        accessToken = tokenData.access_token;
      } catch (err) {
        console.error('[WhatsApp Connect] Token exchange error:', err);
        return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 500 });
      }
    } else if (body.access_token) {
      accessToken = body.access_token;
    } else {
      return NextResponse.json({ error: 'Either code or access_token is required' }, { status: 400 });
    }

    // Subscribe app to WABA
    try {
      const subResp = await fetch(`${GRAPH_API}/${waba_id}/subscribed_apps`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const subData = await subResp.json();
      if (subData.error) {
        console.error('[WhatsApp Connect] WABA subscription failed:', subData.error);
      }
    } catch (err) {
      console.error('[WhatsApp Connect] WABA subscription error:', err);
    }

    // Register phone number for Cloud API
    try {
      const regResp = await fetch(`${GRAPH_API}/${phone_number_id}/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', pin: '000000' }),
      });
      const regData = await regResp.json();
      if (regData.error && regData.error.code !== 133005) {
        console.error('[WhatsApp Connect] Phone registration failed:', regData.error);
      }
    } catch (err) {
      console.error('[WhatsApp Connect] Phone registration error:', err);
    }

    // Get phone number display info
    let displayPhone = '';
    try {
      const phoneResp = await fetch(`${GRAPH_API}/${phone_number_id}?fields=display_phone_number,verified_name`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const phoneData = await phoneResp.json();
      displayPhone = phoneData.display_phone_number || '';
    } catch {
      // Non-critical
    }

    // Submit review request templates (EN + HI)
    let templateStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    let templateEnId = '';
    let templateHiId = '';
    
    try {
      const templates = await submitReviewTemplates(waba_id, accessToken);
      templateEnId = templates.en?.id || '';
      templateHiId = templates.hi?.id || '';
      // Templates start as PENDING until Meta approves them
    } catch (err) {
      console.error('[WhatsApp Connect] Template submission error:', err);
    }

    // Upsert WhatsApp connection
    const { error: dbError } = await supabaseAdmin
      .from('whatsapp_connections')
      .upsert({
        user_id: user.id,
        waba_id,
        phone_number_id,
        access_token: accessToken,
        display_phone: displayPhone,
        template_status: templateStatus,
        template_en_id: templateEnId,
        template_hi_id: templateHiId,
        is_active: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('[WhatsApp Connect] DB upsert failed:', dbError);
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
    }

    console.log(`[WhatsApp Connect] User ${user.id} connected WABA ${waba_id}`);

    return NextResponse.json({
      success: true,
      phone_number_id,
      waba_id,
      display_phone: displayPhone,
      template_status: templateStatus,
    });

  } catch (error) {
    console.error('[WhatsApp Connect] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
