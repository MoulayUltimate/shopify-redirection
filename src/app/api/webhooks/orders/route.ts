import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const shopDomain = request.headers.get('x-shopify-shop-domain');
    const hmac = request.headers.get('x-shopify-hmac-sha256');

    if (!shopDomain) {
      return NextResponse.json({ error: 'Missing shop domain' }, { status: 400 });
    }

    // Parse the order data to get the total price
    const orderData = JSON.parse(rawBody);
    const orderTotal = parseFloat(orderData.total_price || '0');

    if (orderTotal > 0) {
      // Find the store and increment revenue
      const store = await prisma.store.findUnique({
        where: { domain: shopDomain }
      });

      if (store) {
        await prisma.store.update({
          where: { id: store.id },
          data: {
            currentRevenue: store.currentRevenue + orderTotal
          }
        });
        console.log(`Updated revenue for ${shopDomain} by $${orderTotal}`);
      }
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
