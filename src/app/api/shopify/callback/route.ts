import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This is our storeId

  if (!shop || !code || !state || state === 'no-id') {
    return new NextResponse('Invalid callback parameters', { status: 400 });
  }

  try {
    // 1. Find the store in our DB to get the clientSecret
    const store = await prisma.store.findUnique({
      where: { id: state }
    });

    if (!store || !store.clientId || !store.clientSecret) {
      return new NextResponse('Store config not found', { status: 404 });
    }

    // 2. Exchange code for permanent access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: store.clientId,
        client_secret: store.clientSecret,
        code
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return new NextResponse(`Token exchange failed: ${errText}`, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 3. Update the store with the new token
    await prisma.store.update({
      where: { id: state },
      data: { accessToken }
    });

    // 4. Redirect back to the dashboard
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?success=Store Connected!`);
  } catch (error: any) {
    console.error('Callback error:', error);
    return new NextResponse(`Internal error: ${error.message}`, { status: 500 });
  }
}
