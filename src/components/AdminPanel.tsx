'use client';

import React, { useRef, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addStore, deleteStore, toggleStoreStatus, updateStoreLimit, syncRevenue, syncAllRevenue, installScript, uninstallScript } from '@/app/actions';

export default function AdminPanel({ stores, appUrl }: { stores: any[]; appUrl: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stores' | 'setup'>('stores');
  const router = useRouter();

  // BACKGROUND AUTO-REFRESH: Keep the dashboard updated every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [router]);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setMessage(null);
    const result = await addStore(formData);
    if (result.error) {
      setError(result.error);
    } else {
      formRef.current?.reset();
      setMessage('Store added!');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSync = (storeId: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await syncRevenue(storeId);
      if (result.error) setError(result.error);
      else setMessage(`Revenue synced: $${result.revenue?.toFixed(2)} (${result.count} orders found)`);
      setTimeout(() => { setMessage(null); setError(null); }, 4000);
    });
  };

  const handleSyncAll = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      await syncAllRevenue();
      setMessage('All stores synced!');
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleInstallScript = (storeId: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await installScript(storeId, appUrl);
      if (result.error) setError(result.error);
      else setMessage('Redirect script installed!');
      setTimeout(() => { setMessage(null); setError(null); }, 4000);
    });
  };

  const handleUninstallScript = (storeId: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await uninstallScript(storeId);
      if (result.error) setError(result.error);
      else setMessage('Script removed from theme');
      setTimeout(() => { setMessage(null); setError(null); }, 4000);
    });
  };
  
  const handleUpdateLimit = (id: string, val: string) => {
    const limit = parseFloat(val);
    if (isNaN(limit)) return;
    startTransition(async () => {
      await updateStoreLimit(id, limit);
    });
  };

  const totalRevenue = stores.reduce((sum: number, s: any) => sum + s.currentRevenue, 0);
  const activeCount = stores.filter((s: any) => s.isActive && s.currentRevenue < s.revenueLimit).length;

  return (
    <>
      {/* Toast messages */}
      {message && <div className="info-box" style={{ marginBottom: '1rem' }}>✅ {message}</div>}
      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="label">Stores</div>
          <div className="value">{stores.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Receiving Traffic</div>
          <div className="value" style={{ color: activeCount > 0 ? 'var(--green)' : 'var(--red)' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Revenue</div>
          <div className="value">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'stores' ? 'active' : ''}`} onClick={() => setActiveTab('stores')}>
          ⚡ Stores
        </button>
        <button className={`tab ${activeTab === 'setup' ? 'active' : ''}`} onClick={() => setActiveTab('setup')}>
          📖 Setup Guide
        </button>
      </div>

      {/* ===== STORES TAB ===== */}
      {activeTab === 'stores' && (
        <>
          {/* Add Store */}
          <div className="section">
            <div className="section-header">
              <h2>➕ Add Store</h2>
            </div>
            <div className="section-body">
              <form ref={formRef} action={handleSubmit} className="add-store-form-v2">
                <div className="form-row">
                  <div className="form-group">
                    <label>Store Name</label>
                    <input type="text" name="name" placeholder="Store A" required className="input" />
                  </div>
                  <div className="form-group">
                    <label>Shopify Domain</label>
                    <input type="text" name="domain" placeholder="my-store.myshopify.com" required className="input" />
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: '0.5rem' }}>
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label>Access Token (shpat_)</label>
                    <input type="password" name="accessToken" placeholder="If using legacy custom app" className="input" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>OR Client ID</label>
                    <input type="text" name="clientId" placeholder="New Dashboard ID" className="input" />
                  </div>
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label>Client Secret (shpss_)</label>
                    <input type="password" name="clientSecret" placeholder="New Dashboard Secret" className="input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Limit ($)</label>
                    <input type="number" name="revenueLimit" defaultValue="500" required className="input" />
                  </div>
                  <div className="form-group" style={{ flex: 0, alignSelf: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                      {isPending ? '...' : 'Add Store'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Store List */}
          <div className="section">
            <div className="section-header">
              <h2>🏪 Your Stores</h2>
              {stores.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={handleSyncAll} disabled={isPending}>
                  {isPending ? 'Syncing...' : '🔄 Sync All Revenue'}
                </button>
              )}
            </div>
            {stores.length === 0 ? (
              <div className="empty-state">
                <p>No stores yet</p>
                <span>Add your first Shopify store above to get started</span>
              </div>
            ) : (
              <table className="store-table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store: any) => {
                    const pct = Math.min((store.currentRevenue / store.revenueLimit) * 100, 100);
                    const limitHit = store.currentRevenue >= store.revenueLimit;
                    const isLive = store.isActive && !limitHit;

                    return (
                      <tr key={store.id}>
                        <td>
                          <div className="store-name">{store.name}</div>
                          <div className="store-domain">{store.domain}</div>
                        </td>
                        <td style={{ minWidth: '180px' }}>
                          <div className="revenue-container">
                            <div className="revenue-header">
                              <span className={`revenue-amount ${limitHit ? 'text-red' : ''}`}>
                                ${store.currentRevenue.toFixed(2)}
                              </span>
                              <span className="revenue-limit">
                                / $
                                <input 
                                  type="number" 
                                  defaultValue={store.revenueLimit} 
                                  onBlur={(e) => handleUpdateLimit(store.id, e.target.value)}
                                  className="limit-input"
                                />
                              </span>
                            </div>
                            <div className="progress-bg">
                              <div 
                                className={`progress-bar ${limitHit ? 'bg-red' : 'bg-blue'}`} 
                                style={{ width: `${Math.min(100, (store.currentRevenue / store.revenueLimit) * 100)}%` }}
                              ></div>
                            </div>
                            {!limitHit && store.isActive && (
                              <div style={{ fontSize: '0.6rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                                💰 ${Math.max(0, store.revenueLimit - store.currentRevenue).toFixed(2)} remaining
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={`badge ${store.isActive && !limitHit ? 'badge-green' : limitHit ? 'badge-red' : 'badge-yellow'}`}>
                              {store.isActive && !limitHit ? '● Live' : limitHit ? '● Limit Hit' : '● Paused'}
                            </span>
                            
                            {/* Traffic Flow Indicators */}
                            {store.isActive && !limitHit && stores.findIndex(s => s.isActive && s.currentRevenue < s.revenueLimit) === stores.indexOf(store) && (
                              <div style={{ fontSize: '0.65rem', color: '#008060', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                <span className="pulse-dot"></span> 📡 Receiving Traffic
                              </div>
                            )}
                            
                            {limitHit && store.isActive && stores.find(s => s.isActive && s.currentRevenue < s.revenueLimit) && (
                              <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600 }}>
                                ➡️ Forwarding to: {stores.find(s => s.isActive && s.currentRevenue < s.revenueLimit)?.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell">
                            {store.clientId && !store.accessToken ? (
                              <a 
                                href={`/api/shopify/auth?shop=${store.domain}&clientId=${store.clientId}&storeId=${store.id}`}
                                className="btn btn-primary btn-sm"
                                style={{ 
                                  background: '#008060', 
                                  color: 'white', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  textDecoration: 'none',
                                  boxShadow: '0 2px 4px rgba(0,128,96,0.2)'
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M22.9 8.2l-3.3-1.1c-.2-.1-.5-.1-.7.1L15 10.1l-3.9-2.9c-.2-.1-.5-.1-.7.1L7.1 8.2c-.3.1-.5.4-.5.7v12.2c0 .3.2.6.5.7l1.4.5 3.3-2.5 3.3 2.5 1.4-.5c.3-.1.5-.4.5-.7V8.9c0-.3-.2-.6-.5-.7z" fill="white"/>
                                  <path d="M15 27.5c6.9 0 12.5-5.6 12.5-12.5S21.9 2.5 15 2.5 2.5 8.1 2.5 15s5.6 12.5 12.5 12.5zm0-23.5c6.1 0 11 4.9 11 11s-4.9 11-11 11-11-4.9-11-11 4.9-11 11-11z" fill="white"/>
                                </svg>
                                Connect
                              </a>
                            ) : (
                              <>
                                <button onClick={() => handleSync(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Sync revenue">
                                  🔄 <span className="btn-text">Sync</span>
                                </button>
                                <button onClick={() => handleInstallScript(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Install script">
                                  📥 <span className="btn-text">Install</span>
                                </button>
                                <button onClick={() => handleUninstallScript(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Remove script">
                                  📤 <span className="btn-text">Remove</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                startTransition(async () => {
                                  await toggleStoreStatus(store.id, store.isActive);
                                });
                              }}
                              className="btn btn-ghost btn-sm"
                              disabled={isPending}
                              title={store.isActive ? "Pause" : "Resume"}
                              style={{ color: store.isActive ? '#ff4b4b' : '#008060' }}
                            >
                              {store.isActive ? '⏸' : '▶️'} <span className="btn-text">{store.isActive ? 'Pause' : 'Resume'}</span>
                            </button>
                            <button 
                              onClick={() => { 
                                if(confirm('Delete store?')) {
                                  startTransition(async () => {
                                    await deleteStore(store.id);
                                  });
                                }
                              }} 
                              className="btn btn-ghost btn-sm btn-delete" 
                              disabled={isPending}
                            >
                              🗑️ <span className="btn-text">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ===== SETUP GUIDE TAB ===== */}
      {activeTab === 'setup' && (
        <div className="section">
          <div className="section-header">
            <h2>📖 How to Connect Your Shopify Stores</h2>
          </div>
          <div className="section-body">
            <div className="setup-guide" style={{ padding: '1rem' }}>
              
              <div className="info-box" style={{ background: 'rgba(0,128,96,0.1)', color: '#008060', border: '1px solid #008060', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.9rem' }}>Follow these 3 simple steps to activate your revenue-based rotation.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                    <span style={{ background: 'var(--accent)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>1</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>CREATE SHOPIFY APP</h3>
                  </div>
                  <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '2' }}>
                    <li>Go to Shopify Admin → <strong>Settings</strong></li>
                    <li>Click <strong>Apps and sales channels</strong></li>
                    <li>Click <strong>Develop apps</strong></li>
                    <li>Click <strong>Create an app</strong></li>
                    <li>Name it <code>Amksa Rotator</code></li>
                  </ol>
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                    <span style={{ background: 'var(--accent)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>2</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>CONFIGURE ACCESS</h3>
                  </div>
                  <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '2' }}>
                    <li>Click <strong>Configure Admin API scopes</strong></li>
                    <li>Select: <code>read_orders</code>, <code>read_themes</code>, <code>write_themes</code></li>
                    <li>In <strong>Configuration</strong>, add Redirect URL:<br/><code style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', display: 'inline-block', marginTop: '4px', color: 'var(--accent)' }}>https://amksaswitchify.com/api/shopify/callback</code></li>
                    <li>Click <strong>Save</strong> and then <strong>Install App</strong></li>
                  </ol>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                  <span style={{ background: 'var(--accent)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>3</span>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>CONNECT & ACTIVATE</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.8' }}>
                    <li>Copy your <strong>Client ID</strong> and <strong>Secret</strong> from the "API Credentials" tab in Shopify.</li>
                    <li>Go to the <strong>⚡ Stores</strong> tab here and click <strong>Connect</strong>.</li>
                  </ul>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.8' }}>
                    <li>Once connected, click <strong>📥 Install</strong> on your store.</li>
                    <li>Our engine will <strong>Automatically</strong> handle the redirection logic for all your themes.</li>
                  </ul>
                </div>
              </div>

              <div className="step">
                <div className="step-content">
                  <h3 style={{ color: 'var(--accent)' }}>Quick Icon Reference:</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <p>🔄 <strong>Sync</strong> — Updates revenue and domains</p>
                      <p>📥 <strong>Install</strong> — Automatic script injection</p>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <p>⏸ <strong>Pause</strong> — Stop traffic to this store</p>
                      <p>🗑 <strong>Delete</strong> — Remove from rotator</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
