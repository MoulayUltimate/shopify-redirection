'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addStore(formData: FormData) {
  const name = formData.get('name') as string;
  let domain = formData.get('domain') as string;
  const revenueLimit = parseFloat(formData.get('revenueLimit') as string);
  const currentRevenue = parseFloat(formData.get('currentRevenue') as string || '0');

  if (!name || !domain) return { error: 'Missing fields' };
  
  // Clean domain input
  domain = domain.replace('https://', '').replace('http://', '').replace(/\/$/, '');

  try {
    await prisma.store.create({
      data: { name, domain, revenueLimit, currentRevenue }
    });
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
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
