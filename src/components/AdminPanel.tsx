'use client';

import React, { useRef, useState, useTransition } from 'react';
import { addStore, deleteStore, toggleStoreStatus, syncRevenue, syncAllRevenue, installScript, uninstallScript } from '@/app/actions';

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
      else setMessage(`Revenue synced: $${result.revenue?.toFixed(2)}`);
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
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Admin API Access Token</label>
                    <input type="password" name="accessToken" placeholder="shpat_xxxxxxxxxxxxx" required className="input" />
                  </div>
                  <div className="form-group" style={{ flex: 0.5 }}>
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
                            <div className="revenue-text" style={{ color: limitHit ? 'var(--red)' : 'var(--text-primary)' }}>
                              ${store.currentRevenue.toFixed(2)} / ${store.revenueLimit.toFixed(2)}
                            </div>
                            <div className="revenue-bar">
                              <div
                                className="revenue-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: limitHit ? 'var(--red)' : pct > 75 ? 'var(--yellow)' : 'var(--green)',
                                }}
                              />
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
                            <button onClick={() => handleSync(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Sync revenue from Shopify">
                              🔄
                            </button>
                            <button onClick={() => handleInstallScript(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Install redirect script">
                              📥
                            </button>
                            <button onClick={() => handleUninstallScript(store.id)} className="btn btn-ghost btn-sm" disabled={isPending} title="Remove redirect script">
                              📤
                            </button>
                            <button
                              onClick={() => startTransition(() => { toggleStoreStatus(store.id, store.isActive); })}
                              className="btn btn-ghost btn-sm"
                              disabled={isPending}
                            >
                              {store.isActive ? '⏸' : '▶️'}
                            </button>
                            <button
                              onClick={() => startTransition(() => { deleteStore(store.id); })}
                              className="btn btn-danger btn-sm"
                              disabled={isPending}
                            >
                              🗑
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
                  <h3>Create a Custom App in Shopify</h3>
                  <p>For <strong>each store</strong> you want to add:</p>
                  <ol style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: '1.2rem' }}>
                    <li>Go to <strong>Settings → Apps and sales channels → Develop apps</strong></li>
                    <li>Click <strong>"Create an app"</strong>, name it <em>"Store Rotator"</em></li>
                    <li>Go to <strong>Configuration</strong> tab and add these scopes:
                      <ul style={{ marginTop: '0.25rem' }}>
                        <li><code>read_orders</code> — to track revenue</li>
                        <li><code>read_themes</code> + <code>write_themes</code> — to auto-install the redirect script</li>
                      </ul>
                    </li>
                    <li>Click <strong>Install app</strong></li>
                    <li>Go to <strong>API credentials</strong> and copy the <strong>Admin API access token</strong></li>
                  </ol>
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
