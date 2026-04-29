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

  const handleInstallScript = async (id: string) => {
    setMessage('Installing script...');
    const result = await installScript(id);
    if (result.error) setError(result.error);
    else setMessage('Script installed!');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="bg-background font-body-md text-on-background antialiased min-h-screen flex">
      {/* SideNavBar Shell */}
      <aside className="h-screen w-64 fixed left-0 top-0 border-r border-slate-200 bg-white flex flex-col py-6 px-4 gap-2 z-50">
        <div className="px-2 mb-8">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AmksaSwitchify</h1>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Enterprise Control</p>
        </div>
        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-slate-50 text-slate-900 border-r-2 border-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="font-medium text-sm">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('stores')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'stores' ? 'bg-slate-50 text-slate-900 border-r-2 border-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            <span className="font-medium text-sm">Store Management</span>
          </button>
          <button 
            onClick={() => setActiveTab('setup')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'setup' ? 'bg-slate-50 text-slate-900 border-r-2 border-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="font-medium text-sm">Help Center</span>
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-none truncate w-32">{session.user.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">Enterprise Tier</p>
            </div>
          </div>
          <a href="/api/auth/signout" className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-200">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-medium text-sm">Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* TopAppBar Shell */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 flex justify-between items-center w-full px-6 py-3">
          <div className="flex items-center gap-4 flex-1">
            {message && <div className="text-xs font-bold text-secondary animate-pulse">● {message}</div>}
            {error && <div className="text-xs font-bold text-error">✕ {error}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">notifications</span></button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><span className="material-symbols-outlined">settings</span></button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-none">{session.user.name?.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-500 font-medium">Admin</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                {session.user.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="max-w-[1280px] mx-auto px-container-padding py-xl space-y-xl">
          
          {(activeTab === 'dashboard' || activeTab === 'stores') && (
            <>
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="font-h2 text-h2 text-on-surface">Store Management</h2>
                  <p className="text-body-md text-on-surface-variant">Configure and monitor your Shopify store integrations.</p>
                </div>
              </div>

              {/* Bento Layout: Add Store & Stats */}
              <div className="grid grid-cols-12 gap-gutter">
                {/* Add New Store Card */}
                <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                  <div className="px-lg py-md border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-h2 text-[18px] text-on-surface">Add New Store</h3>
                    <span className="px-2 py-1 bg-surface-container text-secondary text-[10px] font-bold rounded uppercase tracking-wider">Direct Integration</span>
                  </div>
                  <div className="p-lg">
                    <form ref={formRef} action={handleSubmit} className="grid grid-cols-2 gap-md">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Store Name</label>
                        <input name="name" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="e.g. Urban Threads Global" required />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Shopify Domain</label>
                        <div className="relative">
                          <input name="domain" className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-28 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="urban-threads" required />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">.myshopify.com</span>
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Admin API Token (shpat_)</label>
                        <input name="accessToken" type="password" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="••••••••••••••••" required />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Daily Revenue Limit ($)</label>
                        <input name="revenueLimit" type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="500" required />
                      </div>
                      <div className="col-span-2 flex justify-end mt-sm">
                        <button disabled={isPending} className="bg-slate-900 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.98]">
                          {isPending ? 'Connecting...' : 'Verify & Add Store'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Quick Stats Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-gutter">
                  <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
                    <div className="flex items-center justify-between mb-sm">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">TOTAL NETWORK REVENUE</span>
                      <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-stats-lg text-stats-lg text-on-surface">${totalRevenue.toFixed(2)}</span>
                    </div>
                    <p className="text-body-sm text-slate-500 mt-xs">Across {stores.length} connected stores</p>
                  </div>
                  <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
                    <div className="flex items-center justify-between mb-sm">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">SYSTEM HEALTH</span>
                      <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-green-700">{liveStores}</div>
                        <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-700">{hitStores}</div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">{stores.length - liveStores - hitStores}</div>
                      </div>
                      <span className="text-body-sm font-medium text-slate-700">All gateways operational</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Stores Table Section */}
              <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                <div className="px-lg py-md border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <h3 className="font-h2 text-[18px] text-on-surface">Your Stores</h3>
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
                        <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Store Name</th>
                        <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Revenue (24H)</th>
                        <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Status</th>
                        <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase text-center">Progress</th>
                        <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 text-right uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stores.map((store: any) => {
                        const limitHit = store.currentRevenue >= store.revenueLimit;
                        const pct = Math.min(100, (store.currentRevenue / store.revenueLimit) * 100);
                        const isLive = store.isActive && !limitHit;

                        return (
                          <tr key={store.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-lg py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                  <span className="material-symbols-outlined">shopping_bag</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{store.name}</p>
                                  <p className="text-[11px] text-slate-400 font-mono">{store.domain}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-lg py-4">
                              <span className="font-mono-data text-mono-data text-slate-900">${store.currentRevenue.toFixed(2)}</span>
                            </td>
                            <td className="px-lg py-4">
                              {isLive ? (
                                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-50 text-green-700 w-fit">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                  <span className="text-[11px] font-bold uppercase tracking-tight">Live</span>
                                </div>
                              ) : limitHit ? (
                                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-50 text-red-700 w-fit border border-red-100">
                                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                  <span className="text-[11px] font-bold uppercase tracking-tight">Limit Hit</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 text-slate-600 w-fit">
                                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                  <span className="text-[11px] font-bold uppercase tracking-tight">Paused</span>
                                </div>
                              )}
                            </td>
                            <td className="px-lg py-4">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ${limitHit ? 'bg-red-500' : 'bg-secondary'}`} 
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                                <p className={`text-[10px] font-medium ${limitHit ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                  ${store.currentRevenue.toFixed(0)} / ${store.revenueLimit}
                                </p>
                              </div>
                            </td>
                            <td className="px-lg py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!store.accessToken && (
                                  <a href={`/api/shopify/auth?shop=${store.domain}`} className="px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded uppercase mr-2 no-underline">Connect</a>
                                )}
                                <button onClick={() => handleSync(store.id)} className="p-1.5 text-slate-400 hover:text-secondary hover:bg-blue-50 rounded" title="Sync"><span className="material-symbols-outlined text-[18px]">sync</span></button>
                                <button onClick={() => handleInstallScript(store.id)} className="p-1.5 text-slate-400 hover:text-secondary hover:bg-blue-50 rounded" title="Install"><span className="material-symbols-outlined text-[18px]">add_circle</span></button>
                                <button onClick={() => startTransition(async () => { await toggleStoreStatus(store.id, store.isActive); })} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title={store.isActive ? "Pause" : "Resume"}><span className="material-symbols-outlined text-[18px]">{store.isActive ? 'pause' : 'play_arrow'}</span></button>
                                <button onClick={() => { if(confirm('Delete store?')) startTransition(() => deleteStore(store.id)); }} className="p-1.5 text-slate-400 hover:text-error hover:bg-red-50 rounded" title="Delete"><span className="material-symbols-outlined text-[18px]">delete</span></button>
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
            <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-lg space-y-lg">
              <h3 className="font-h2 text-h2 text-on-surface">Setup Instructions</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">1</div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Create Shopify App</p>
                    <p className="text-sm text-slate-500">Go to Settings → Apps → Develop apps → Create an app.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">2</div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Set Scopes</p>
                    <p className="text-sm text-slate-500">Select read_orders, read_themes, write_themes.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">3</div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Connect & Install</p>
                    <p className="text-sm text-slate-500">Paste your token, click "Connect", then click "Install" icon in the table.</p>
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
