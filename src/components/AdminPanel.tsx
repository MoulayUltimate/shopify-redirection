'use client';

import React, { useRef, useState, useTransition } from 'react';
import { addStore, deleteStore, toggleStoreStatus } from '@/app/actions';

export default function AdminPanel({ stores, appUrl }: { stores: any[]; appUrl: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stores' | 'setup'>('stores');

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await addStore(formData);
    if (result.error) {
      setError(result.error);
    } else {
      formRef.current?.reset();
    }
  };

  const totalRevenue = stores.reduce((sum: number, s: any) => sum + s.currentRevenue, 0);
  const activeCount = stores.filter((s: any) => s.isActive && s.currentRevenue < s.revenueLimit).length;

  const scriptCode = `{% if template == 'product' %}
<script>
  fetch('${appUrl}/api/active-store')
    .then(r => r.json())
    .then(d => {
      if (d.domain && d.domain !== window.location.hostname) {
        window.location.href = 'https://' + d.domain + '/products/{{ product.handle }}';
      }
    })
    .catch(e => console.error('Rotator:', e));
</script>
{% endif %}`;

  const webhookUrl = `${appUrl}/api/webhooks/orders`;

  return (
    <>
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
              <form ref={formRef} action={handleSubmit} className="add-store-form">
                <div className="form-group">
                  <label>Store Name</label>
                  <input type="text" name="name" placeholder="Store A" required className="input" />
                </div>
                <div className="form-group">
                  <label>Shopify Domain</label>
                  <input type="text" name="domain" placeholder="my-store.myshopify.com" required className="input" />
                </div>
                <div className="form-group">
                  <label>Limit ($)</label>
                  <input type="number" name="revenueLimit" placeholder="500" defaultValue="500" required className="input" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? '...' : 'Add'}
                </button>
              </form>
              {error && <p className="error-msg">{error}</p>}
            </div>
          </div>

          {/* Store List */}
          <div className="section">
            <div className="section-header">
              <h2>🏪 Your Stores</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stores.length} total</span>
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
                            <button
                              onClick={() => startTransition(() => { toggleStoreStatus(store.id, store.isActive); })}
                              className="btn btn-ghost btn-sm"
                              disabled={isPending}
                            >
                              {store.isActive ? 'Pause' : 'Resume'}
                            </button>
                            <button
                              onClick={() => startTransition(() => { deleteStore(store.id); })}
                              className="btn btn-danger btn-sm"
                              disabled={isPending}
                            >
                              Delete
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
                <div className={`step-number ${stores.length > 0 ? 'done' : ''}`}>1</div>
                <div className="step-content">
                  <h3>Add Your Stores Above</h3>
                  <p>
                    Go to the <strong>Stores</strong> tab and add each Shopify store you want in the rotation.
                    Enter the store name, its <code>.myshopify.com</code> domain, and the revenue limit (e.g. $500).
                  </p>
                  {stores.length > 0 ? (
                    <div className="info-box">✅ Done! You have {stores.length} store(s) configured.</div>
                  ) : (
                    <div className="warning-box">⚠️ You haven't added any stores yet. Go to the Stores tab first.</div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Add the Redirect Script to Your Shopify Theme</h3>
                  <p>
                    In <strong>each store</strong> that receives ad traffic, go to:<br />
                    <strong>Online Store → Themes → Edit Code → theme.liquid</strong><br />
                    Paste this script right before the closing <code>&lt;/head&gt;</code> tag:
                  </p>
                  <div className="code-block">
                    <CopyButton text={scriptCode} />
                    {scriptCode}
                  </div>
                  <br />
                  <div className="info-box">
                    💡 This script checks which store is under its revenue limit and redirects the customer to the right one — keeping the same product page.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Set Up Revenue Tracking (Webhooks)</h3>
                  <p>
                    For <strong>each store</strong>, go to:<br />
                    <strong>Settings → Notifications → Webhooks → Create webhook</strong>
                  </p>
                  <table className="store-table" style={{ marginBottom: '1rem' }}>
                    <tbody>
                      <tr><td style={{ fontWeight: 600, width: '120px' }}>Event</td><td>Order creation</td></tr>
                      <tr><td style={{ fontWeight: 600 }}>Format</td><td>JSON</td></tr>
                      <tr><td style={{ fontWeight: 600 }}>URL</td><td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{webhookUrl}</td></tr>
                    </tbody>
                  </table>
                  <div className="code-block">
                    <CopyButton text={webhookUrl} />
                    {webhookUrl}
                  </div>
                  <br />
                  <div className="info-box">
                    💡 Every time an order is placed, Shopify sends the order total to this app, which updates the store's revenue automatically.
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>You're Done! 🎉</h3>
                  <p>
                    Your stores will now automatically rotate traffic. When Store A hits its revenue limit,
                    all new visitors will be redirected to Store B (and so on). Monitor everything from the <strong>Stores</strong> tab.
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-btn" onClick={handleCopy} type="button">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}
