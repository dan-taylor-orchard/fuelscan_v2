import { NextRequest, NextResponse } from 'next/server';
import { FuelApiResponse, StationWithPrice, FuelSearchResult } from '@/app/types';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// Server-side token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const basicAuth = process.env.NSW_FUEL_BASIC_AUTH;
  if (!basicAuth) throw new Error('Missing NSW_FUEL_BASIC_AUTH');

  const res = await fetch(
    'https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken?grant_type=client_credentials',
    { method: 'GET', headers: { 'Authorization': basicAuth }, cache: 'no-store' }
  );

  if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await res.text()}`);

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 11 * 60 * 60 * 1000;
  return cachedToken as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postcode, fuelType } = body;

    // Validate inputs
    if (!/^\d{4}$/.test(postcode)) {
      return NextResponse.json({ error: 'Invalid postcode' }, { status: 400 });
    }
    const validFuelTypes = ['E10','U91','P95','P98','DL','PDL','LPG','B20','E85'];
    if (!validFuelTypes.includes(fuelType)) {
      return NextResponse.json({ error: 'Invalid fuel type' }, { status: 400 });
    }

    const apiKey = process.env.NSW_FUEL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing NSW_FUEL_API_KEY' }, { status: 500 });
    }

    const token = await getToken();

    const fuelRes = await fetch('https://api.onegov.nsw.gov.au/FuelPriceCheck/v1/fuel/prices/location', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json; charset=utf-8',
        'Authorization':    `Bearer ${token}`,
        'apikey':            apiKey,
        'transactionid':     uuid(),
        'requesttimestamp':  new Date().toISOString().replace('T', ' ').slice(0, 19),
      },
      body: JSON.stringify({
        fueltype:      fuelType,
        namedlocation: postcode,
        sortby:        'Price',
        ascending:     'true',
      }),
      cache: 'no-store',
    });

    if (!fuelRes.ok) {
      const errText = await fuelRes.text();
      return NextResponse.json(
        { error: `Fuel API error (${fuelRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const data: FuelApiResponse = await fuelRes.json();

    // Build station map
    const stationMap: Record<string, FuelApiResponse['stations'][0]> = {};
    (data.stations || []).forEach(s => { stationMap[s.code] = s; });

    // Merge prices with station info, filter by fuel type, sort by price
    const stations: StationWithPrice[] = (data.prices || [])
      .filter(p => p.fueltype === fuelType && p.price > 0)
      .map(p => {
        const s = stationMap[p.stationcode] || { name: 'Unknown', brand: '', address: '', location: '' };
        return {
          code:        p.stationcode,
          name:        s.name    || 'Unknown Station',
          brand:       s.brand   || '',
          address:     s.address || '',
          suburb:      s.location|| '',
          price:       parseFloat(String(p.price)),
          lastupdated: p.lastupdated || '',
        };
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 10);

    if (!stations.length) {
      return NextResponse.json(
        { error: `No ${fuelType} prices found near postcode ${postcode}.` },
        { status: 404 }
      );
    }

    const prices   = stations.map(s => s.price);
    const average  = prices.reduce((a, b) => a + b, 0) / prices.length;
    const cheapest = Math.min(...prices);
    const mostExp  = Math.max(...prices);

    const result: FuelSearchResult = {
      stations,
      average:       Math.round(average * 10) / 10,
      cheapest,
      mostExpensive: mostExp,
      maxSaving:     Math.round((mostExp - cheapest) * 10) / 10,
      fuelType,
      postcode,
      fetchedAt:     new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Fuel prices error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
