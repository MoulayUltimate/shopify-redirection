'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── Store CRUD ─────────────────────────────────────────

export async function addStore(formData: FormData) {
  const name = formData.get('name') as string;
  let domain = formData.get('domain') as string;
  const accessToken = (formData.get('accessToken') as string || '').trim();
  const clientId = (formData.get('clientId') as string || '').trim();
  const clientSecret = (formData.get('clientSecret') as string || '').trim();
  const revenueLimit = parseFloat(formData.get('revenueLimit') as string);

  if (!name || !domain) return { error: 'Name and domain are required' };
  if (!accessToken && (!clientId || !clientSecret)) return { error: 'Provide either an Access Token (shpat_) OR Client ID + Secret' };

  domain = domain.toLowerCase().trim().replace('https://', '').replace('http://', '').replace(/\/$/, '');
  
  if (!domain.includes('.')) {
    domain = `${domain}.myshopify.com`;
  }

  try {
    await prisma.store.create({
      data: { 
        name, 
        domain, 
        accessToken: accessToken || null, 
        clientId: clientId || null, 
        clientSecret: clientSecret || null, 
        revenueLimit, 
        currentRevenue: 0 
      }
    });
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error('Add store error:', e);
    return { error: 'Failed to add store. Domain might already exist.' };
  }
}

export async function deleteStore(id: string) {
  try {
    await prisma.store.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to delete' };
  }
}

export async function toggleStoreStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.store.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to toggle status' };
  }
}

// ─── Sync Revenue from Shopify Orders API ───────────────

async function getAccessToken(store: any) {
  if (store.accessToken) return store.accessToken;
  
  if (!store.clientId || !store.clientSecret) {
    throw new Error('No credentials found for this store');
  }

  // Token exchange for Unified Dashboard / Partners App
  const res = await fetch(`https://${store.domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: store.clientId,
      client_secret: store.clientSecret,
      grant_type: 'client_credentials'
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Auth response:', errText);
    throw new Error(`Auth failed (${res.status}): ${errText.substring(0, 100)}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ─── Sync Revenue from Shopify Orders API ───────────────

export async function syncRevenue(storeId: string) {
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return { error: 'Store not found' };

    const token = await getAccessToken(store);

    // Fetch all orders from the Shopify Admin API
    let totalRevenue = 0;
    let orderCount = 0;
    let nextUrl: string | null = `https://${store.domain}/admin/api/2024-04/orders.json?status=any&financial_status=paid,authorized,partially_paid&limit=250`;

    while (nextUrl) {
      const res: Response = await fetch(nextUrl, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'User-Agent': 'Shopify-Store-Rotator/1.0',
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Shopify API error:', errText);
        return { error: `Shopify API error (${res.status}). Check your scopes.` };
      }

      const data = await res.json();
      const orders = data.orders || [];
      orderCount += orders.length;

      for (const order of orders) {
        totalRevenue += parseFloat(order.total_price || '0');
      }

      const linkHeader = res.headers.get('link');
      const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = nextMatch ? nextMatch[1] : null;
    }

    // --- ALSO FETCH PRIMARY DOMAIN ---
    let primaryDomain = store.primaryDomain;
    try {
      const shopRes = await fetch(`https://${store.domain}/admin/api/2024-04/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'User-Agent': 'Shopify-Store-Rotator/1.0',
        },
      });
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        primaryDomain = shopData.shop?.domain || store.domain;
      }
    } catch (e) {
      console.error('Failed to fetch primary domain:', e);
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { currentRevenue: totalRevenue, primaryDomain }
    });

    revalidatePath('/');
    return { success: true, revenue: totalRevenue, count: orderCount };
  } catch (e: any) {
    console.error('Sync error:', e);
    return { error: e.message || 'Failed to sync revenue' };
  }
}

// ─── Sync All Stores ────────────────────────────────────

export async function syncAllRevenue() {
  const stores = await prisma.store.findMany();
  const results = [];
  for (const store of stores) {
    if (store.accessToken) {
      const result = await syncRevenue(store.id);
      results.push({ store: store.name, ...result });
    }
  }
  revalidatePath('/');
  return results;
}

// ─── Install Redirect Script via Shopify API ────────────

const SCRIPT_MARKER_START = '<!-- STORE-ROTATOR-START -->';
const SCRIPT_MARKER_END = '<!-- STORE-ROTATOR-END -->';

export async function installScript(storeId: string, appUrl: string) {
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return { error: 'Store not found' };

    const token = await getAccessToken(store);

    const apiBase = `https://${store.domain}/admin/api/2024-04`;
    const headers = {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      'User-Agent': 'Shopify-Store-Rotator/1.0',
    };

    // 1. Get the main published theme
    const themesRes = await fetch(`${apiBase}/themes.json`, { headers });
    if (!themesRes.ok) return { error: `Cannot access themes (${themesRes.status}). Make sure your app has "read_themes" and "write_themes" access.` };

    const themesData = await themesRes.json();
    const mainTheme = themesData.themes?.find((t: any) => t.role === 'main');
    if (!mainTheme) return { error: 'No main theme found' };

    // 2. Get current theme.liquid
    const assetRes = await fetch(`${apiBase}/themes/${mainTheme.id}/assets.json?asset[key]=layout/theme.liquid`, { headers });
    if (!assetRes.ok) return { error: `Cannot read theme.liquid (${assetRes.status})` };

    const assetData = await assetRes.json();
    let themeContent = assetData.asset?.value || '';

    // 3. Remove old script if exists
    const markerRegex = new RegExp(`${SCRIPT_MARKER_START}[\\s\\S]*?${SCRIPT_MARKER_END}`, 'g');
    themeContent = themeContent.replace(markerRegex, '');

    // 4. Build the script snippet
    const snippet = `${SCRIPT_MARKER_START}
{% if template == 'product' %}
<script>
  fetch('${appUrl}/api/active-store')
    .then(function(r){return r.json()})
    .then(function(d){
      const curr = window.location.hostname;
      // Only redirect if we aren't already on the target domain OR the internal .myshopify domain
      if(d.domain && curr !== d.domain && curr !== d.internalDomain){
        window.location.href='https://'+d.domain+'/products/{{product.handle}}';
      }
    })
    .catch(function(e){console.error('Rotator:',e)});
</script>
{% endif %}
${SCRIPT_MARKER_END}`;

    // 5. Inject before </head>
    themeContent = themeContent.replace('</head>', snippet + '\n</head>');

    // 6. Upload updated theme.liquid
    const updateRes = await fetch(`${apiBase}/themes/${mainTheme.id}/assets.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        asset: { key: 'layout/theme.liquid', value: themeContent }
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return { error: `Failed to update theme: ${errText}` };
    }

    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error('Install script error:', e);
    return { error: e.message || 'Failed to install script' };
  }
}

// ─── Uninstall Redirect Script ──────────────────────────

export async function uninstallScript(storeId: string) {
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return { error: 'Store not found' };

    const token = await getAccessToken(store);

    const apiBase = `https://${store.domain}/admin/api/2024-04`;
    const headers = {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      'User-Agent': 'Shopify-Store-Rotator/1.0',
    };

    const themesRes = await fetch(`${apiBase}/themes.json`, { headers });
    const themesData = await themesRes.json();
    const mainTheme = themesData.themes?.find((t: any) => t.role === 'main');
    if (!mainTheme) return { error: 'No main theme found' };

    const assetRes = await fetch(`${apiBase}/themes/${mainTheme.id}/assets.json?asset[key]=layout/theme.liquid`, { headers });
    const assetData = await assetRes.json();
    let themeContent = assetData.asset?.value || '';

    const markerRegex = new RegExp(`${SCRIPT_MARKER_START}[\\s\\S]*?${SCRIPT_MARKER_END}\\n?`, 'g');
    themeContent = themeContent.replace(markerRegex, '');

    await fetch(`${apiBase}/themes/${mainTheme.id}/assets.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        asset: { key: 'layout/theme.liquid', value: themeContent }
      })
    });

    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to uninstall script' };
  }
}
