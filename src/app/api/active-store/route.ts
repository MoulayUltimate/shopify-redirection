import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Enable CORS for Shopify storefronts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Fetch all active stores, ordered oldest first
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    // Find the first store whose revenue hasn't hit its limit
    const activeStore = stores.find(s => s.currentRevenue < s.revenueLimit);

    if (!activeStore) {
      return NextResponse.json({ error: 'No active stores available under their limits' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ domain: activeStore.domain }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching active store:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
