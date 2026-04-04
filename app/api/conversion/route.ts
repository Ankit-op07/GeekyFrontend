import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_name, event_id, user_data, custom_data } = body;

    const PIXEL_ID = process.env.PIXEL_ID;
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const API_VERSION = process.env.API_VERSION || 'v22.0';

    if (!PIXEL_ID || !META_ACCESS_TOKEN) {
      console.error('[CAPI] Missing env vars — PIXEL_ID:', !!PIXEL_ID, 'TOKEN:', !!META_ACCESS_TOKEN);
      return NextResponse.json(
        { success: false, error: 'Missing Meta credentials' },
        { status: 500 }
      );
    }

    // Helper: hash a value with SHA-256 (Meta requires lowercase + trimmed before hashing)
    const hash = (value: string) =>
      crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

    // Build hashed user data with all matching parameters
    const hashedUserData: Record<string, any> = {
      // Hashed PII — Meta requires SHA-256 hashing for all PII fields
      ...(user_data.em ? { em: [hash(user_data.em)] } : {}),
      ...(user_data.ph ? { ph: [hash(user_data.ph)] } : {}),
      ...(user_data.fn ? { fn: [hash(user_data.fn)] } : {}),
      ...(user_data.ln ? { ln: [hash(user_data.ln)] } : {}),

      // Non-hashed fields — critical for event matching
      client_ip_address:
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '',
      client_user_agent: request.headers.get('user-agent') || '',

      // Meta cookie identifiers — NOT hashed, passed as-is
      ...(user_data.fbc ? { fbc: user_data.fbc } : {}),
      ...(user_data.fbp ? { fbp: user_data.fbp } : {}),
    };

    const eventPayload = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: request.headers.get('referer') || user_data.source_url || '',
      action_source: 'website',
      user_data: hashedUserData,
      custom_data,
      // event_id MUST be present for deduplication with browser pixel
      event_id: event_id || undefined,
    };

    // Log for debugging (remove in production once confirmed working)
    console.log('[CAPI] Sending event:', {
      event_name,
      event_id,
      has_em: !!user_data.em,
      has_ph: !!user_data.ph,
      has_fbc: !!user_data.fbc,
      has_fbp: !!user_data.fbp,
      has_ip: !!hashedUserData.client_ip_address,
      has_ua: !!hashedUserData.client_user_agent,
      event_source_url: eventPayload.event_source_url,
    });

    const url = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [eventPayload],
        access_token: META_ACCESS_TOKEN,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[CAPI] ❌ Meta API error:', JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || 'Meta API error');
    }

    console.log('[CAPI] ✅ Success:', JSON.stringify(data));
    return NextResponse.json({ success: true, fb_response: data });
  } catch (err: any) {
    console.error('[CAPI] ❌ Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}