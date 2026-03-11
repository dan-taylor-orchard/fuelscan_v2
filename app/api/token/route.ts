import { NextResponse } from 'next/server';

// Simple in-memory token cache (server-side only)
let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function GET() {
  try {
    // Return cached token if still valid
    if (cachedToken && Date.now() < tokenExpiry) {
      return NextResponse.json({ token: cachedToken });
    }

    const basicAuth = process.env.NSW_FUEL_BASIC_AUTH;
    if (!basicAuth) {
      return NextResponse.json({ error: 'Missing NSW_FUEL_BASIC_AUTH env var' }, { status: 500 });
    }

    const res = await fetch(
      'https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken?grant_type=client_credentials',
      {
        method: 'GET',
        headers: { 'Authorization': basicAuth },
        // Don't cache this fetch
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Auth failed (${res.status}): ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    cachedToken = data.access_token;
    // Cache for 11 hours (tokens last ~12 hrs)
    tokenExpiry = Date.now() + 11 * 60 * 60 * 1000;

    return NextResponse.json({ token: cachedToken });
  } catch (err) {
    console.error('Token error:', err);
    return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 500 });
  }
}
