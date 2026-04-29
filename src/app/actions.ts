'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth, signIn } from '@/auth';
import bcrypt from 'bcryptjs';

// ─── Auth Actions ───────────────────────────────────────

export async function signup(formData: FormData) {
  const email = (formData.get('email') as string || '').toLowerCase().trim();
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password) return { error: 'Email and password are required' };

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: 'Email already exists' };

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    return { success: true };
  } catch (e) {
    return { error: 'Failed to create account' };
  }
}

// ─── Store CRUD ─────────────────────────────────────────

async function getUserId() {
  const session = await auth();
  return session?.user?.id;
}

export async function addStore(formData: FormData) {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated' };

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
        userId,
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
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated' };

  try {
    await prisma.store.delete({ where: { id, userId } });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to delete' };
  }
}

export async function toggleStoreStatus(id: string, currentStatus: boolean) {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated' };

  try {
    await prisma.store.update({
      where: { id, userId },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to toggle status' };
  }
}

export async function updateStoreLimit(id: string, newLimit: number) {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated' };

  try {
    await prisma.store.update({
      where: { id, userId },
      data: { revenueLimit: newLimit }
    });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to update limit' };
  }
}

// ─── Sync Revenue from Shopify Orders API ───────────────

async function getAccessToken(store: any) {
  if (store.accessToken) return store.accessToken;
  
  if (!store.clientId || !store.clientSecret) {
    throw new Error('No credentials found. Please provide an Access Token (shpat_) or Client ID/Secret.');
  }

  // The Client Credentials flow for Unified Apps requires the app to be installed first.
  // If it's not installed, Shopify returns "app_not_found".
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
    if (errText.includes('app_not_found') || errText.includes('app_not_installed')) {
      throw new Error(`Auth failed: App not installed on ${store.domain}. We recommend using the "Custom App (shpat_)" method instead.`);
    }
    throw new Error(`Shopify Auth Error (${res.status}): Please check your Client ID and Secret.`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function syncRevenue(storeId: string) {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated' };

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId, userId } });
    if (!store) return { error: 'Store not found' };

    const token = await getAccessToken(store);

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
    } catch (e) {}

    await prisma.store.update({
      where: { id: storeId, userId },
      data: { currentRevenue: totalRevenue, primaryDomain }
    });

    revalidatePath('/');
    return { success: true, revenue: totalRevenue, count: orderCount };
  } catch (e: any) {
    return { error: e.message || 'Failed to sync revenue' };
  }
}

export async function syncAllRevenue(providedUserId?: string) {
  const userId = providedUserId || await getUserId();
  if (!userId) return [];

  const stores = await prisma.store.findMany({ where: { userId } });
  const results = [];
  for (const store of stores) {
    const result = await syncRevenue(store.id);
    results.push({ store: store.name, ...result });
  }
  revalidatePath('/');
  return results;
}

// ─── Install Redirect Script ────────────────────────────

const SCRIPT_MARKER_START = '<!-- STORE-ROTATOR-START -->';
const SCRIPT_MARKER_END = '<!-- STORE-ROTATOR-END -->';

export async function installScript(storeId: string, appUrl: string) {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated' };

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId, userId } });
    if (!store) return { error: 'Store not found' };

    const token = await getAccessToken(store);
    const apiBase = `https://${store.domain}/admin/api/2024-04`;
    const headers = {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      'User-Agent': 'Shopify-Store-Rotator/1.0',
    };

    const themesRes = await fetch(`${apiBase}/themes.json`, { headers });
    if (!themesRes.ok) return { error: `Cannot access themes` };

    const themesData = await themesRes.json();
    const themes = themesData.themes || [];
    if (themes.length === 0) return { error: 'No themes found' };

    let successCount = 0;
    for (const theme of themes) {
      try {
        const assetRes = await fetch(`${apiBase}/themes/${theme.id}/assets.json?asset[key]=layout/theme.liquid`, { headers });
        if (!assetRes.ok) continue;

        const assetData = await assetRes.json();
        let themeContent = assetData.asset?.value || '';

        const markerRegex = new RegExp(`${SCRIPT_MARKER_START}[\\s\\S]*?${SCRIPT_MARKER_END}`, 'g');
        themeContent = themeContent.replace(markerRegex, '');

        const snippet = `${SCRIPT_MARKER_START}
<script>
  function amksaRotate(d) {
    if (!d.domain) return;
    var clean = function(h) { return h.replace(/^www\\./, "").replace(/^https?:\\/\\//, "").toLowerCase().trim(); };
    var curr = clean(window.location.hostname);
    var target = clean(d.domain);
    var internal = clean(d.internalDomain || "");
    if(target && curr !== target && curr !== internal){
      window.location.href = 'https://' + d.domain + window.location.pathname + window.location.search;
    }
  }
</script>
<script src="https://amksaswitchify.com/api/active-store?uid=${userId}&callback=amksaRotate&t=${Date.now()}"></script>
${SCRIPT_MARKER_END}`;

        const headRegex = /<\/head>/i;
        if (headRegex.test(themeContent)) {
          themeContent = themeContent.replace(headRegex, snippet + '\n</head>');
        } else {
          themeContent += '\n' + snippet;
        }

        await fetch(`${apiBase}/themes/${theme.id}/assets.json`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            asset: { key: 'layout/theme.liquid', value: themeContent }
          })
        });
        successCount++;
      } catch (e) {}
    }

    if (successCount === 0) return { error: 'Failed to update any themes' };

    revalidatePath('/');
    return { success: true };

    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    return { error: 'Failed to install script' };
  }
}

export async function uninstallScript(storeId: string) {
  const userId = await getUserId();
  if (!userId) return { error: 'Not authenticated' };

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId, userId } });
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
    return { error: 'Failed to uninstall script' };
  }
}
