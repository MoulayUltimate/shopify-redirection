import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default async function AdminMasterPage() {
  const session = await auth();

  // ONLY ALLOW YOU (The Owner) TO ACCESS THIS PAGE
  const ADMIN_EMAIL = 'remoymak@gmail.com';
  
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    redirect('/');
  }

  // Fetch ALL stores from ALL users
  const allStores = await prisma.store.findMany({
    include: {
      user: true, // Join with user to see who owns the store
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="container">
      <Header user={session.user} />
      
      <div className="section">
        <div className="section-header" style={{ background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-purple) 100%)', color: 'white' }}>
          <h2 style={{ color: 'white' }}>👑 Master Control Panel (All Team Stores)</h2>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
            Back to My Stores
          </Link>
        </div>
        
        <div className="section-body" style={{ padding: 0 }}>
          <table className="store-table">
            <thead>
              <tr>
                <th>Store Details</th>
                <th>Added By</th>
                <th>Performance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allStores.map((store: any) => {
                const limitHit = store.currentRevenue >= store.revenueLimit;
                return (
                  <tr key={store.id}>
                    <td>
                      <div className="store-name">{store.name}</div>
                      <div className="store-domain" style={{ fontSize: '0.7rem' }}>{store.domain}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px' }}>ID: {store.id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{store.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{store.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: limitHit ? 'var(--red)' : 'var(--accent)' }}>
                        ${store.currentRevenue.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Limit: ${store.revenueLimit}</div>
                    </td>
                    <td>
                      <span className={`badge ${store.isActive && !limitHit ? 'badge-green' : limitHit ? 'badge-red' : 'badge-yellow'}`}>
                        {store.isActive && !limitHit ? 'Live' : limitHit ? 'Full' : 'Paused'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {allStores.length === 0 && (
            <div className="empty-state">
              <p>No stores have been added by the team yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Total stores managed by AmksaSwitchify: <strong>{allStores.length}</strong>
      </div>
    </main>
  );
}
