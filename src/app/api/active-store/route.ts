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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('uid');

    if (!userId) {
      return NextResponse.json({ error: 'Missing User ID' }, { status: 400, headers: corsHeaders });
    }

    // Fetch all active stores for THIS specific user, ordered oldest first
    const stores = await prisma.store.findMany({
      where: { 
        isActive: true,
        userId: userId
      },
      orderBy: { createdAt: 'asc' }
    });

    // Find the first store whose revenue hasn't hit its limit
    const activeStore = stores.find(s => s.currentRevenue < s.revenueLimit);

    if (!activeStore) {
      return NextResponse.json({ error: 'No active stores available under their limits' }, { status: 404, headers: corsHeaders });
    }

    // Return the custom domain (primaryDomain) if set, otherwise fallback to the .myshopify.com domain
    const targetDomain = activeStore.primaryDomain || activeStore.domain;
  
    return NextResponse.json({ 
      domain: targetDomain,
      internalDomain: activeStore.domain 
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching active store:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
