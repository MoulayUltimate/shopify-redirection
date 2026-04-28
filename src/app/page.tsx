import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPanel from '@/components/AdminPanel';

export default async function Home() {
  const rules = await prisma.redirectRule.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container">
      <div className="hero">
        <h1>Shopify Redirection Engine</h1>
        <p>Manage your edge-native redirects and sync them directly to Shopify.</p>
      </div>

      <div className="dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Active Redirects</h3>
            <div className="value">{rules.length}</div>
          </div>
          <div className="stat-card">
            <h3>Traffic Processed</h3>
            <div className="value">45.2K</div>
          </div>
          <div className="stat-card">
            <h3>Avg Latency</h3>
            <div className="value">12ms</div>
          </div>
        </div>

        {/* The interactive client component for CRUD operations */}
        <AdminPanel rules={rules} />
      </div>
    </div>
  );
}
