'use client';

import React, { useState, useRef, useTransition } from 'react';
import { 
  addStore, 
  deleteStore, 
  syncRevenue, 
  toggleStoreStatus, 
  updateStoreLimit,
  installScript,
  uninstallScript
} from '@/app/actions';

export default function AdminPanel({ stores, session }: { stores: any[], session: any }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('stores');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const totalRevenue = stores.reduce((sum, s) => sum + s.currentRevenue, 0);
  const liveStores = stores.filter(s => s.isActive && s.currentRevenue < s.revenueLimit).length;
  const hitStores = stores.filter(s => s.isActive && s.currentRevenue >= s.revenueLimit).length;

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setMessage('Connecting to Shopify...');
    const result = await addStore(formData);
    if (result?.error) {
      setError(result.error);
      setMessage(null);
    } else {
      setMessage('Store connected successfully!');
      formRef.current?.reset();
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSync = async (id: string) => {
    setMessage('Syncing revenue...');
    const result = await syncRevenue(id);
    if (result?.error) setError(result.error);
    else setMessage('Revenue synced!');
    setTimeout(() => setMessage(null), 2000);
  };

  const handleUpdateLimit = (id: string, val: string) => {
    const limit = parseFloat(val);
    if (isNaN(limit)) return;
    startTransition(async () => {
      await updateStoreLimit(id, limit);
    });
  };

  const handleInstallScript = async (id: string) => {
    setMessage('Installing script on all themes...');
    const result = await installScript(id);
    if (result.error) setError(result.error);
    else setMessage('Script installed successfully!');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUninstallScript = async (id: string) => {
    setMessage('Removing script...');
    const result = await uninstallScript(id);
    if (result.error) setError(result.error);
    else setMessage('Script removed!');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 border-r border-slate-200 bg-white flex flex-col py-6 px-4 gap-2 z-50">
        <div className="px-2 mb-8">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AmksaSwitchify</h1>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Enterprise Control</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('stores')}
            className={`sidebar-link w-full text-left ${activeTab === 'stores' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            <span className="font-medium text-sm">Store Management</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('setup')}
            className={`sidebar-link w-full text-left ${activeTab === 'setup' ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="font-medium text-sm">Setup Guide</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-1">
          <div className="px-3 py-2 text-xs text-slate-400 font-medium uppercase tracking-wider">Account</div>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-none truncate w-32">{session.user.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">Enterprise Tier</p>
            </div>
          </div>
          <a href="/api/auth/signout" className="sidebar-link text-red-500 hover:bg-red-50">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-medium text-sm">Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold text-sm">
              {activeTab === 'stores' ? 'Store Management' : 'Setup Guide'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {message && (
              <div className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full animate-pulse border border-blue-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">info</span>
                {message}
              </div>
            )}
            {error && (
              <div className="px-4 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[1400px] w-full mx-auto space-y-8">
          
          {activeTab === 'stores' && (
            <>
              {/* Bento Row: Stats & Add Store */}
              <div className="grid grid-cols-12 gap-6">
                {/* Add Store Card */}
                <div className="col-span-12 lg:col-span-8 card">
                  <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-h2 text-[18px] text-slate-900">Add New Store</h3>
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">Direct Integration</span>
                  </div>
                  <div className="p-6">
                    <form ref={formRef} action={handleSubmit} className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 tracking-wider uppercase">Store Name</label>
                        <input name="name" className="input-enterprise" placeholder="e.g. Urban Threads" required />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 tracking-wider uppercase">Shopify Domain</label>
                        <div className="relative">
                          <input name="domain" className="input-enterprise pr-28" placeholder="my-store" required />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">.myshopify.com</span>
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 tracking-wider uppercase">Admin API Access Token (shpat_)</label>
                        <input name="accessToken" type="password" className="input-enterprise" placeholder="••••••••••••••••" required />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1 tracking-wider uppercase">Daily Revenue Limit ($)</label>
                        <input name="revenueLimit" type="number" className="input-enterprise" placeholder="500" required />
                      </div>
                      <div className="col-span-2 flex justify-end mt-2">
                        <button disabled={isPending} className="btn-enterprise">
                          {isPending ? 'Connecting...' : 'Verify & Add Store'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Quick Stats Card */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Network Revenue</span>
                      <span className="material-symbols-outlined text-blue-600 text-[20px]">payments</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900">${totalRevenue.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Across {stores.length} connected stores</p>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System Health</span>
                      <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-green-700" title="Live">{liveStores}</div>
                        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-red-700" title="Limit Hit">{hitStores}</div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400" title="Paused">{stores.length - liveStores - hitStores}</div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">All gateways operational</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Stores Table */}
              <div className="card shadow-lg">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <h3 className="font-h2 text-[18px] text-slate-900">Connected Stores</h3>
                  <div className="flex gap-2">
                    <button onClick={() => window.location.reload()} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1.5 hover:bg-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Refresh
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Store Details</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Revenue Progress</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Status</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stores.map((store: any) => {
                        const limitHit = store.currentRevenue >= store.revenueLimit;
                        const pct = Math.min(100, (store.currentRevenue / store.revenueLimit) * 100);
                        const isActiveRotation = store.isActive && !limitHit && stores.findIndex(s => s.isActive && s.currentRevenue < s.revenueLimit) === stores.indexOf(store);

                        return (
                          <tr key={store.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                  <span className="material-symbols-outlined">shopping_bag</span>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">{store.name}</p>
                                  <p className="text-[11px] text-slate-400 font-mono">{store.domain}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-xs font-bold text-slate-900">${store.currentRevenue.toFixed(2)}</span>
                                <span className="text-[10px] text-slate-400 font-medium">/ ${store.revenueLimit}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${limitHit ? 'bg-red-500' : 'bg-blue-600'}`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className={`badge-enterprise ${store.isActive && !limitHit ? 'badge-live' : limitHit ? 'badge-hit' : 'badge-paused'}`}>
                                  <div className={`pulse-dot-enterprise ${store.isActive && !limitHit ? 'animate-pulse' : ''}`}></div>
                                  {store.isActive && !limitHit ? 'Live' : limitHit ? 'Limit Hit' : 'Paused'}
                                </div>
                                {isActiveRotation && (
                                  <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">sensors</span>
                                    Receiving Traffic
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!store.accessToken && (
                                  <a 
                                    href={`/api/shopify/auth?shop=${store.domain}`} 
                                    className="px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded uppercase hover:bg-green-700 transition-colors flex items-center gap-1 no-underline"
                                    title="Authorize App"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">link</span>
                                    Connect
                                  </a>
                                )}
                                <button onClick={() => handleSync(store.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Sync Revenue">
                                  <span className="material-symbols-outlined text-[20px]">sync</span>
                                </button>
                                <button onClick={() => handleInstallScript(store.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Install Script">
                                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                </button>
                                <button 
                                  onClick={() => startTransition(async () => { await toggleStoreStatus(store.id, store.isActive); })}
                                  className={`p-1.5 rounded transition-colors ${store.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} 
                                  title={store.isActive ? "Pause" : "Resume"}
                                >
                                  <span className="material-symbols-outlined text-[20px]">{store.isActive ? 'pause' : 'play_arrow'}</span>
                                </button>
                                <button 
                                  onClick={() => { 
                                    if(confirm('Delete store?')) {
                                      startTransition(async () => {
                                        await deleteStore(store.id);
                                      });
                                    }
                                  }} 
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'setup' && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="card p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Setup Guide</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Create Shopify Custom App</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Go to your Shopify Admin → <strong>Settings</strong> → <strong>Apps and sales channels</strong> → <strong>Develop apps</strong>. 
                        Create a new app and click "Configure Admin API scopes".
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Configure Permissions</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Select: <code>read_orders</code>, <code>read_themes</code>, <code>write_themes</code>. 
                        In <strong>Configuration</strong>, add the Redirect URL: 
                        <code className="block bg-slate-50 p-2 mt-2 rounded border border-slate-200 text-blue-600 text-xs">https://amksaswitchify.com/api/shopify/callback</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Add Store Credentials</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Copy the <strong>Client ID</strong> and <strong>Secret</strong> from Shopify. 
                        Paste them into the "Add Store" form above and click <strong>Verify & Add Store</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">4</div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900">Connect & Install</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Find your store in the table and click the green <strong>Connect</strong> button. 
                        Once authorized, click <strong>📥 Install</strong> to activate the rotator!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
