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
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('uid');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing User ID' }), {
        status: 400,
        headers: corsHeaders,
      });
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
    syncAllRevenue(userId).catch(e => console.error('BG Sync failed:', e));

    const responseData = activeStore ? { 
      domain: activeStore.primaryDomain || activeStore.domain,
      internalDomain: activeStore.domain 
    } : { domain: null };

    // Check if JSONP callback is requested
    const callback = searchParams.get('callback');
    if (callback) {
      return new Response(`${callback}(${JSON.stringify(responseData)})`, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript',
        },
      });
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching active store:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
