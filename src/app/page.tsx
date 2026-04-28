import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPanel from '@/components/AdminPanel';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'asc' }
  });

  // Auto-detect the app's URL so the setup guide shows the correct webhook/script URLs
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || 'http';
  const appUrl = `${proto}://${host}`;

  return (
    <div className="container">
      <div className="header">
        <div className="header-left">
          <h1>🔄 Store Rotator</h1>
          <p>Revenue-based Shopify traffic distribution</p>
        </div>
        <div className="status-pill">
          <span className="status-dot"></span>
          Online
        </div>
      </div>

      <AdminPanel stores={stores} appUrl={appUrl} />
    </div>
  );
}
