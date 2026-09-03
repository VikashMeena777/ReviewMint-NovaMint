// ============================================
// Bulk CSV Import — Parse and queue review requests
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { csv_data, review_link, channel = 'whatsapp', send_mode = 'manual', language = 'en', connection_id } = body;

    if (!csv_data || !review_link) {
      return NextResponse.json({ error: 'CSV data and review link are required' }, { status: 400 });
    }

    const rows = parseCSV(csv_data);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV' }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 });
    }

    // Get business name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_name')
      .eq('id', user.id)
      .single();
    const businessName = (profile as Record<string, unknown>)?.company_name as string || 'our business';

    // Get template
    const { data: settings } = await supabaseAdmin
      .from('campaign_settings')
      .select('templates')
      .eq('user_id', user.id)
      .maybeSingle();

    const templates = (settings as Record<string, unknown>)?.templates as Record<string, Record<string, string>> | undefined;
    const langTemplates = templates?.[language] || templates?.['en'];
    const waTemplate = langTemplates?.whatsapp ||
      (language === 'hi'
        ? 'नमस्ते {name} जी, {business} में आने के लिए धन्यवाद! 🙏\n\nक्या आप हमें Google पर एक review दे सकते हैं?\n\n👉 {review_link}\n\nधन्यवाद!\n- {business}'
        : 'Hi {name}, thank you for visiting {business}! 🙏\n\nCould you take a moment to leave us a Google review?\n\n👉 {review_link}\n\nThank you!\n- {business}');

    // Map CSV rows to review_requests
    const requests = rows.map(row => {
      const customerName = row.name || row.customer_name || row.customer || 'Customer';
      const customerPhone = row.phone || row.mobile || row.whatsapp || row.phone_number || '';
      const customerEmail = row.email || row.mail || '';

      const messageText = waTemplate
        .replace(/\{name\}/g, customerName)
        .replace(/\{business\}/g, businessName)
        .replace(/\{review_link\}/g, review_link);

      return {
        user_id: user.id,
        connection_id: connection_id || null,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        channel,
        send_mode,
        language,
        message_text: messageText,
        review_link,
        status: 'pending' as const,
      };
    });

    // Validate: WhatsApp requires phone, email requires email
    const valid = requests.filter(r => {
      if ((channel === 'whatsapp' || channel === 'both') && !r.customer_phone) return false;
      if ((channel === 'email' || channel === 'both') && !r.customer_email) return false;
      return true;
    });

    const skipped = requests.length - valid.length;

    if (valid.length === 0) {
      return NextResponse.json({
        error: 'No valid rows. Ensure CSV has "name" and "phone"/"email" columns.',
      }, { status: 400 });
    }

    // Insert all at once
    const { error: insertError } = await supabaseAdmin
      .from('review_requests')
      .insert(valid);

    if (insertError) {
      console.error('[Bulk Import] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to import' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: valid.length,
      skipped,
      total: rows.length,
    });
  } catch (error) {
    console.error('[Bulk Import] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
