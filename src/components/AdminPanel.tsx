'use client';

import React, { useRef, useState, useTransition } from 'react';
import { addStore, deleteStore, toggleStoreStatus, updateStoreLimit, syncRevenue, syncAllRevenue, installScript, uninstallScript } from '@/app/actions';

export default function AdminPanel({ stores, appUrl }: { stores: any[]; appUrl: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stores' | 'setup'>('stores');

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
                        <td>
                          <div className="revenue-bar-wrap">
                            <div className="revenue-text" style={{ color: limitHit ? 'var(--red)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              ${store.currentRevenue.toFixed(2)} / $
                              <input 
                                type="number" 
                                defaultValue={store.revenueLimit} 
                                onBlur={(e) => handleUpdateLimit(store.id, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateLimit(store.id, (e.target as HTMLInputElement).value)}
                                className="limit-input"
                                title="Click to edit limit"
                              />
                              <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>✏️</span>
                            </div>
                            <div className="revenue-bar">
                              <div
                                  className="revenue-fill"
                                  style={{
                                    width: `${Math.min(100, (store.currentRevenue / store.revenueLimit) * 100)}%`,
                                    background: 'linear-gradient(90deg, #1273eb 0%, #582df2 100%)',
                                    boxShadow: '0 0 10px rgba(18, 115, 235, 0.4)'
                                  }}
                                ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${isLive ? 'badge-green' : limitHit ? 'badge-red' : 'badge-yellow'}`}>
                            {isLive ? '● Live' : limitHit ? '● Limit Hit' : '● Paused'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button onClick={() => handleSync(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Sync revenue and domains from Shopify">
                              🔄 <span className="btn-text">Sync</span>
                            </button>
                            <button onClick={() => handleInstallScript(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Auto-insert the redirect script into your Shopify theme">
                              📥 <span className="btn-text">Install</span>
                            </button>
                            <button onClick={() => handleUninstallScript(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Remove the redirect script from your Shopify theme">
                              📤 <span className="btn-text">Remove</span>
                            </button>
                            <button
                              onClick={() => startTransition(() => { toggleStoreStatus(store.id, store.isActive); })}
                              className="btn btn-ghost btn-sm"
                              disabled={isPending}
                              title={store.isActive ? "Pause traffic to this store" : "Resume traffic to this store"}
                            >
                              {store.isActive ? '⏸' : '▶️'} <span className="btn-text">{store.isActive ? 'Pause' : 'Resume'}</span>
                            </button>
                            <button
                              onClick={() => startTransition(() => { deleteStore(store.id); })}
                              className="btn btn-danger btn-sm"
                              disabled={isPending}
                              title="Delete this store from the rotator"
                            >
                              🗑 <span className="btn-text">Delete</span>
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
            <div className="setup-guide">

              {/* Step 1 */}
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Get Your API Credentials</h3>
                  <p>Choose the method that matches your Shopify Dashboard:</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px' }}>
                      <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>NEW: UNIFIED DASHBOARD</p>
                      <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1rem', lineHeight: '1.5' }}>
                        <li>Go to <strong>dev.shopify.com</strong></li>
                        <li>Open your <strong>App</strong> → <strong>Configuration</strong></li>
                        <li>Copy the <strong>Client ID</strong></li>
                        <li>Click <strong>Manage</strong> to find the <strong>Client Secret</strong> (starts with <code>shpss_</code>)</li>
                      </ul>
                    </div>
                    
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px' }}>
                      <p style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>LEGACY: CUSTOM APP</p>
                      <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1rem', lineHeight: '1.5' }}>
                        <li>Go to <strong>Store Settings → Apps</strong></li>
                        <li>Click <strong>Develop Apps</strong> → <strong>Create App</strong></li>
                        <li>Configure Admin API scopes</li>
                        <li>Install & Copy <strong>Access Token</strong> (starts with <code>shpat_</code>)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step">
                <div className={`step-number ${stores.length > 0 ? 'done' : ''}`}>2</div>
                <div className="step-content">
                  <h3>Add the Store in the Stores Tab</h3>
                  <p>
                    Go to the <strong>⚡ Stores</strong> tab above and fill in the store name, its
                    <code>.myshopify.com</code> domain, the access token you just copied, and the revenue limit.
                  </p>
                  {stores.length > 0 ? (
                    <div className="info-box">✅ You have {stores.length} store(s) configured.</div>
                  ) : (
                    <div className="warning-box">⚠️ No stores added yet.</div>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Click the Action Buttons</h3>
                  <p>In the Stores tab, each store has icon buttons:</p>
                  <table className="store-table" style={{ marginBottom: '0.75rem' }}>
                    <tbody>
                      <tr><td style={{ fontSize: '1.1rem', width: '40px' }}>🔄</td><td><strong>Sync Revenue</strong> — Reads all paid orders from Shopify and updates the revenue total</td></tr>
                      <tr><td style={{ fontSize: '1.1rem' }}>📥</td><td><strong>Install Script</strong> — Automatically injects the redirect code into the store's theme (no manual editing!)</td></tr>
                      <tr><td style={{ fontSize: '1.1rem' }}>📤</td><td><strong>Uninstall Script</strong> — Removes the redirect code from the theme</td></tr>
                      <tr><td style={{ fontSize: '1.1rem' }}>⏸</td><td><strong>Pause/Resume</strong> — Temporarily stop or resume traffic to a store</td></tr>
                      <tr><td style={{ fontSize: '1.1rem' }}>🗑</td><td><strong>Delete</strong> — Remove a store from the rotator</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 4 */}
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>You're Done! 🎉</h3>
                  <p>
                    Once you've added your stores, synced their revenue, and installed the script —
                    everything is automatic. When a store hits its limit, traffic redirects to the next
                    available store. Come back here anytime to monitor or adjust.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
