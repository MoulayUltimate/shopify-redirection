import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPanel from '@/components/AdminPanel';

export default async function Home() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const totalRevenue = stores.reduce((sum, store) => sum + store.currentRevenue, 0);

  return (
    <div className="container">
      <div className="hero">
        <h1>Revenue-Based Store Rotator</h1>
        <p>Manage your multiple Shopify stores and dynamically route traffic to maximize limits.</p>
      </div>

      <div className="dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Active Stores</h3>
            <div className="value">{stores.filter(s => s.isActive).length}</div>
          </div>
          <div className="stat-card">
            <h3>Total Revenue Tracked</h3>
            <div className="value">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <h3>Rotator Status</h3>
            <div className="value" style={{color: '#34d399'}}>Online</div>
          </div>
        </div>

        {/* The interactive client component for CRUD operations */}
        <AdminPanel stores={stores} />
      </div>
    </div>
  );
}
