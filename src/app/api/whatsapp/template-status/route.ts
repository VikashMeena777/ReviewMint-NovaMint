// ============================================
// WhatsApp Template Status Check
// ============================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getTemplateStatus } from '@/lib/whatsapp/client';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: waConn } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!waConn) {
      return NextResponse.json({ connected: false });
    }

    const conn = waConn as Record<string, unknown>;
    const wabaId = conn.waba_id as string;
    const accessToken = conn.access_token as string;

    // Check EN template
    const enStatus = await getTemplateStatus(wabaId, accessToken, 'reviewmint_review_request_en');
    const hiStatus = await getTemplateStatus(wabaId, accessToken, 'reviewmint_review_request_hi');

    // Determine overall status
    let templateStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (enStatus?.status === 'APPROVED' && hiStatus?.status === 'APPROVED') {
      templateStatus = 'approved';
    } else if (enStatus?.status === 'REJECTED' || hiStatus?.status === 'REJECTED') {
      templateStatus = 'rejected';
    }

    // Update DB if status changed
    if (templateStatus !== conn.template_status) {
      await supabaseAdmin
        .from('whatsapp_connections')
        .update({
          template_status: templateStatus,
          template_en_id: enStatus?.id || conn.template_en_id,
          template_hi_id: hiStatus?.id || conn.template_hi_id,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      connected: true,
      display_phone: conn.display_phone,
      template_status: templateStatus,
      en: enStatus,
      hi: hiStatus,
    });
  } catch (error) {
    console.error('[Template Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
