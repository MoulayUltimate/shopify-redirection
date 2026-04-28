'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addRedirect(formData: FormData) {
  const sourcePath = formData.get('sourcePath') as string;
  const destination = formData.get('destination') as string;

  if (!sourcePath || !destination) return { error: 'Missing fields' };

  try {
    // 1. Save to local database
    const rule = await prisma.redirectRule.create({
      data: { sourcePath, destination }
    });

    // 2. Sync to Shopify if configured
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (shopDomain && accessToken) {
      const response = await fetch(`https://${shopDomain}/admin/api/2024-01/redirects.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          redirect: {
            path: sourcePath,
            target: destination
          }
        })
      });
      
      if (!response.ok) {
        console.error('Failed to sync to Shopify:', await response.text());
        // Depending on your requirements, you could delete the local rule here or just warn.
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    return { error: e.message || 'Failed to add redirect. Maybe it already exists?' };
  }
}

export async function deleteRedirect(id: string) {
  try {
    // Note: If you want to delete from Shopify too, you'd need the Shopify redirect ID.
    // For this boilerplate, we're just deleting locally.
    await prisma.redirectRule.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to delete' };
  }
}
