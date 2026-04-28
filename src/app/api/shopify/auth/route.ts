import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  const clientId = searchParams.get('clientId');

  if (!shop || !clientId) {
    return new NextResponse('Missing shop or clientId', { status: 400 });
  }

  const scopes = 'read_orders,read_themes,write_themes';
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/shopify/callback`;
  
  // Create a state to store the storeId if we have it, or just a random string
  const state = searchParams.get('storeId') || 'no-id';

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
