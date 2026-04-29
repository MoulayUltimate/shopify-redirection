import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncAllRevenue } from '@/app/actions';

export const dynamic = 'force-dynamic';

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

    // BACKGROUND AUTO-SYNC: 
    // We don't "await" this so it doesn't slow down the redirection.
    // It will sync orders for the next customer visit.
    syncAllRevenue(userId).catch(e => console.error('BG Sync failed:', e));

    if (!activeStore) {
      return NextResponse.json({ domain: null }, { headers: corsHeaders });
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
