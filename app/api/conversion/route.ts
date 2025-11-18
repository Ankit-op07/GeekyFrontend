import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { event_name, user_data, custom_data } = await request.json();
    
    const PIXEL_ID = process.env.PIXEL_ID;
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const API_VERSION = process.env.API_VERSION || 'v22.0';

    if (!PIXEL_ID || !META_ACCESS_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Missing Meta credentials' },
        { status: 500 }
      );
    }

    // Hash email if provided (server-side hashing is more secure)
    const hashedUserData = {
      ...user_data,
      em: user_data.em ? [crypto.createHash('sha256').update(user_data.em.toLowerCase()).digest('hex')] : undefined,
      ph: user_data.ph ? [crypto.createHash('sha256').update(user_data.ph).digest('hex')] : undefined,
    };

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            {
              event_name,
              event_time: Math.floor(Date.now() / 1000),
              user_data: hashedUserData,
              custom_data,
              action_source: 'website',
            },
          ],
          access_token: META_ACCESS_TOKEN,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Meta API error');
    }

    return NextResponse.json({ success: true, fb_response: data });
  } catch (err: any) {
    console.error('Conversion API error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
