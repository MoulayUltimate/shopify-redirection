'use client';

import React, { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  addStore,
  deleteStore,
  syncRevenue,
  syncAllRevenue,
  toggleStoreStatus,
  updateStoreLimit,
  installScript,
  uninstallScript,
} from '@/app/actions';

type Tone = 'blue' | 'amber' | 'red' | 'green-solid';

const toneClasses: Record<Tone, string> = {
  blue: 'text-slate-500 hover:text-secondary hover:bg-blue-50',
  amber: 'text-slate-500 hover:text-amber-600 hover:bg-amber-50',
  red: 'text-slate-500 hover:text-red-600 hover:bg-red-50',
  'green-solid': 'bg-green-600 text-white hover:bg-green-700 px-3',
};

interface ActionBtnProps {
  icon: string;
  label: string;
  hint: string;
  tone: Tone;
  disabled?: boolean;
  onClick?: () => void;
  as?: 'button' | 'a';
  href?: string;
}

function ActionBtn({ icon, label, hint, tone, disabled, onClick, as = 'button', href }: ActionBtnProps) {
  const base = `relative inline-flex items-center justify-center gap-1 h-8 min-w-8 rounded-lg border border-transparent transition-colors disabled:opacity-50 disabled:pointer-events-none ${toneClasses[tone]}`;
  const tooltip = (
    <span
      role="tooltip"
      className="pointer-events-none absolute top-full right-0 mt-2 z-30 hidden group-hover/btn:block whitespace-nowrap bg-slate-900 text-white text-[11px] leading-tight px-2.5 py-1.5 rounded-md shadow-lg"
    >
      <span className="block font-bold">{label}</span>
      <span className="block text-slate-300 font-normal text-[10px] mt-0.5">{hint}</span>
      <span className="absolute -top-1 right-3 w-2 h-2 bg-slate-900 rotate-45"></span>
    </span>
  );

  if (as === 'a' && href) {
    return (
      <span className="relative group/btn">
        <a href={href} className={`${base} px-3 text-[11px] font-bold uppercase tracking-wider`} aria-label={label}>
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
          <span>Connect</span>
        </a>
        {tooltip}
      </span>
    );
  }

  return (
    <span className="relative group/btn">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={base + ' px-1.5'}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </button>
      {tooltip}
    </span>
  );
}

export default function AdminPanel({ stores, session }: { stores: any[]; session: any }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stores' | 'setup'>('stores');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // BACKGROUND AUTO-REFRESH: keep the dashboard updated every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const totalRevenue = stores.reduce((sum, s) => sum + s.currentRevenue, 0);
  const liveStores = stores.filter(s => s.isActive && s.currentRevenue < s.revenueLimit).length;
  const hitStores = stores.filter(s => s.isActive && s.currentRevenue >= s.revenueLimit).length;
  const pausedStores = stores.length - liveStores - hitStores;

  // The first live store (lowest createdAt) is the one currently receiving traffic
  const receivingStore = stores.find(s => s.isActive && s.currentRevenue < s.revenueLimit);

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
    setTimeout(() => { setMessage(null); setError(null); }, 4000);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setMessage('Connecting to Shopify...');
    const result = await addStore(formData);
    if (result?.error) {
      flash(result.error, true);
    } else {
      formRef.current?.reset();
      flash('Store added!');
    }
  };

  const handleSync = (storeId: string) => {
    startTransition(async () => {
      setMessage('Syncing revenue...');
      const result = await syncRevenue(storeId);
      if (result?.error) flash(result.error, true);
      else flash(`Revenue synced: $${result.revenue?.toFixed(2)} (${result.count} orders)`);
    });
  };

  const handleSyncAll = () => {
    startTransition(async () => {
      setMessage('Syncing all stores...');
      await syncAllRevenue();
      flash('All stores synced!');
    });
  };

  const handleInstallScript = (storeId: string) => {
    startTransition(async () => {
      setMessage('Installing script...');
      const result = await installScript(storeId);
      if (result?.error) flash(result.error, true);
      else flash('Redirect script installed!');
    });
  };

  const handleUninstallScript = (storeId: string) => {
    startTransition(async () => {
      setMessage('Removing script...');
      const result = await uninstallScript(storeId);
      if (result?.error) flash(result.error, true);
      else flash('Script removed from theme');
    });
  };

  const handleUpdateLimit = (id: string, val: string) => {
    const limit = parseFloat(val);
    if (isNaN(limit)) return;
    startTransition(async () => {
      await updateStoreLimit(id, limit);
    });
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
            <span className="font-medium text-sm">Setup Guide</span>
          </button>
          {session.user?.email === 'remoymak@gmail.com' && (
            <a
              href="/admin"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-amber-700 hover:bg-amber-50 mt-4 border border-amber-200 bg-amber-50/40"
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              <span className="font-medium text-sm">Master View</span>
            </a>
          )}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-none truncate w-32">{session.user?.name || session.user?.email}</p>
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
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors" title="Settings">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-none">{session.user?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-medium">Administrator</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                {(session.user?.name || session.user?.email || '?').charAt(0).toUpperCase()}
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
                {stores.length > 0 && (
                  <button
                    onClick={handleSyncAll}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-secondary/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                    {isPending ? 'Syncing...' : 'Sync All Revenue'}
                  </button>
                )}
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
                        <input name="domain" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="my-store.myshopify.com" required />
                      </div>
                      <div className="col-span-2">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Admin API Token (shpat_)</label>
                        <input name="accessToken" type="password" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="If using legacy custom app" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">OR Client ID</label>
                        <input name="clientId" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="New Dashboard ID" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Client Secret (shpss_)</label>
                        <input name="clientSecret" type="password" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" placeholder="New Dashboard Secret" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Daily Revenue Limit ($)</label>
                        <input name="revenueLimit" type="number" defaultValue="500" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all" required />
                      </div>
                      <div className="col-span-2 md:col-span-1 flex items-end justify-end">
                        <button disabled={isPending} className="bg-slate-900 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50">
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
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">{pausedStores}</div>
                      </div>
                      <span className="text-body-sm font-medium text-slate-700">
                        {receivingStore ? `Routing to ${receivingStore.name}` : 'No traffic destination'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Stores Table Section */}
              <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                <div className="px-lg py-md border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <h3 className="font-h2 text-[18px] text-on-surface">Your Stores</h3>
                  <button onClick={() => router.refresh()} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1.5 hover:bg-white transition-colors">
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Refresh
                  </button>
                </div>
                {stores.length === 0 ? (
                  <div className="p-xl text-center">
                    <p className="text-body-md text-on-surface font-semibold">No stores yet</p>
                    <p className="text-body-sm text-on-surface-variant mt-xs">Add your first Shopify store above to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Store Name</th>
                          <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Revenue (24H)</th>
                          <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Status</th>
                          <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase text-center">Limit / Progress</th>
                          <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 text-right uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stores.map((store: any) => {
                          const limitHit = store.currentRevenue >= store.revenueLimit;
                          const pct = Math.min(100, (store.currentRevenue / store.revenueLimit) * 100);
                          const isLive = store.isActive && !limitHit;
                          const isReceiving = receivingStore?.id === store.id;
                          const needsConnect = store.clientId && !store.accessToken;

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
                                <span className={`font-mono-data text-mono-data ${limitHit ? 'text-red-600' : 'text-slate-900'}`}>
                                  ${store.currentRevenue.toFixed(2)}
                                </span>
                                {!limitHit && store.isActive && (
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    ${Math.max(0, store.revenueLimit - store.currentRevenue).toFixed(2)} remaining
                                  </p>
                                )}
                              </td>
                              <td className="px-lg py-4">
                                <div className="flex flex-col gap-1">
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
                                  {isReceiving && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                      Receiving Traffic
                                    </div>
                                  )}
                                  {limitHit && store.isActive && receivingStore && (
                                    <div className="text-[10px] font-semibold text-secondary">
                                      → Forwarding to {receivingStore.name}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-lg py-4">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${limitHit ? 'bg-red-500' : 'bg-secondary'}`}
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span>${store.currentRevenue.toFixed(0)} / $</span>
                                    <input
                                      type="number"
                                      defaultValue={store.revenueLimit}
                                      onBlur={(e) => handleUpdateLimit(store.id, e.target.value)}
                                      className="w-14 bg-transparent border-b border-dashed border-slate-300 text-[10px] text-slate-700 font-semibold text-center focus:outline-none focus:border-secondary"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-lg py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {needsConnect ? (
                                    <ActionBtn
                                      as="a"
                                      href={`/api/shopify/auth?shop=${store.domain}&clientId=${store.clientId}&storeId=${store.id}`}
                                      icon="link"
                                      label="Connect Store"
                                      hint="Authorize via Shopify OAuth flow"
                                      tone="green-solid"
                                      disabled={false}
                                    />
                                  ) : (
                                    <>
                                      <ActionBtn
                                        onClick={() => handleSync(store.id)}
                                        disabled={isPending}
                                        icon="sync"
                                        label="Sync Revenue"
                                        hint="Pull latest paid orders from Shopify"
                                        tone="blue"
                                      />
                                      <ActionBtn
                                        onClick={() => handleInstallScript(store.id)}
                                        disabled={isPending}
                                        icon="download"
                                        label="Install Script"
                                        hint="Inject redirect snippet into all themes"
                                        tone="blue"
                                      />
                                      <ActionBtn
                                        onClick={() => handleUninstallScript(store.id)}
                                        disabled={isPending}
                                        icon="delete_sweep"
                                        label="Remove Script"
                                        hint="Strip redirect snippet from all themes"
                                        tone="amber"
                                      />
                                    </>
                                  )}
                                  <ActionBtn
                                    onClick={() => startTransition(async () => { await toggleStoreStatus(store.id, store.isActive); })}
                                    disabled={isPending}
                                    icon={store.isActive ? 'pause' : 'play_arrow'}
                                    label={store.isActive ? 'Pause Traffic' : 'Resume Traffic'}
                                    hint={store.isActive ? 'Stop sending visitors here' : 'Start sending visitors here'}
                                    tone="amber"
                                  />
                                  <ActionBtn
                                    onClick={() => { if (confirm('Delete store? This cannot be undone.')) startTransition(async () => { await deleteStore(store.id); }); }}
                                    disabled={isPending}
                                    icon="delete"
                                    label="Delete Store"
                                    hint="Permanently remove from rotator"
                                    tone="red"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'setup' && (
            <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-lg space-y-lg">
              <div>
                <h2 className="font-h2 text-h2 text-on-surface">Setup Guide</h2>
                <p className="text-body-md text-on-surface-variant">Follow these 3 steps to activate revenue-based rotation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="border border-outline-variant rounded-xl p-lg bg-surface-container-low">
                  <div className="flex items-center gap-3 mb-md">
                    <span className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold">1</span>
                    <h3 className="font-h2 text-[16px] text-on-surface">Create Shopify App</h3>
                  </div>
                  <ol className="text-body-sm text-on-surface-variant space-y-1 list-decimal pl-4">
                    <li>Shopify Admin → <strong>Settings</strong></li>
                    <li>Click <strong>Apps and sales channels</strong></li>
                    <li>Click <strong>Develop apps</strong></li>
                    <li>Click <strong>Create an app</strong></li>
                    <li>Name it <code className="bg-slate-100 px-1 rounded">Amksa Rotator</code></li>
                  </ol>
                </div>

                <div className="border border-outline-variant rounded-xl p-lg bg-surface-container-low">
                  <div className="flex items-center gap-3 mb-md">
                    <span className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold">2</span>
                    <h3 className="font-h2 text-[16px] text-on-surface">Configure Access</h3>
                  </div>
                  <ol className="text-body-sm text-on-surface-variant space-y-1 list-decimal pl-4">
                    <li>Click <strong>Configure Admin API scopes</strong></li>
                    <li>Select: <code className="bg-slate-100 px-1 rounded">read_orders</code>, <code className="bg-slate-100 px-1 rounded">read_themes</code>, <code className="bg-slate-100 px-1 rounded">write_themes</code></li>
                    <li>Add Redirect URL: <code className="bg-slate-100 px-1 rounded text-[11px] block mt-1">https://amksaswitchify.com/api/shopify/callback</code></li>
                    <li>Save and <strong>Install App</strong></li>
                  </ol>
                </div>
              </div>

              <div className="border border-outline-variant rounded-xl p-lg bg-surface-container-low">
                <div className="flex items-center gap-3 mb-md">
                  <span className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold">3</span>
                  <h3 className="font-h2 text-[16px] text-on-surface">Connect & Activate</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md text-body-sm text-on-surface-variant">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Copy your <strong>Client ID</strong> and <strong>Secret</strong> from the API Credentials tab.</li>
                    <li>Open <strong>Store Management</strong> here and click <strong>Connect</strong>.</li>
                  </ul>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Once connected, click the <strong>Install</strong> icon on your store row.</li>
                    <li>Our engine will <strong>automatically</strong> handle redirect logic across all themes.</li>
                  </ul>
                </div>
              </div>

              <div className="border border-outline-variant rounded-xl p-lg">
                <h3 className="font-h2 text-[16px] text-on-surface mb-md">Action Icon Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md text-body-sm text-on-surface-variant">
                  <p className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-[18px]">sync</span><strong>Sync</strong> — Pulls revenue & primary domain</p>
                  <p className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-[18px]">download</span><strong>Install</strong> — Injects redirect script</p>
                  <p className="flex items-center gap-2"><span className="material-symbols-outlined text-amber-600 text-[18px]">delete_sweep</span><strong>Remove</strong> — Uninstalls the script</p>
                  <p className="flex items-center gap-2"><span className="material-symbols-outlined text-amber-600 text-[18px]">pause</span><strong>Pause</strong> — Stop traffic to store</p>
                  <p className="flex items-center gap-2"><span className="material-symbols-outlined text-error text-[18px]">delete</span><strong>Delete</strong> — Remove from rotator</p>
                </div>
              </div>

              {/* How it works */}
              <div className="border border-outline-variant rounded-xl p-lg bg-gradient-to-br from-blue-50/40 to-white">
                <div className="flex items-center gap-3 mb-md">
                  <span className="material-symbols-outlined text-secondary text-[22px]">auto_awesome</span>
                  <h3 className="font-h2 text-[16px] text-on-surface">How AmksaSwitchify Works</h3>
                </div>
                <p className="text-body-md text-on-surface-variant mb-md">
                  Think of AmksaSwitchify as a smart traffic conductor for your Shopify portfolio. The plugin keeps an eye
                  on every store you connect and quietly steps in the moment one of them is ready for a break — so your
                  customers always land somewhere that&apos;s open for business.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  <div className="rounded-lg border border-outline-variant bg-white p-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-secondary text-[20px]">monitoring</span>
                      <h4 className="font-h2 text-[14px] text-on-surface">1. We watch your stores</h4>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">
                      Every connected store reports back in real time. You set a comfort level for each one — we keep score.
                    </p>
                  </div>
                  <div className="rounded-lg border border-outline-variant bg-white p-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-amber-600 text-[20px]">timer</span>
                      <h4 className="font-h2 text-[14px] text-on-surface">2. A store fills up</h4>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">
                      When a store reaches the threshold you set, AmksaSwitchify marks it as <strong>Full</strong> and
                      gracefully takes it out of rotation — no manual work from your team.
                    </p>
                  </div>
                  <div className="rounded-lg border border-outline-variant bg-white p-md">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-green-600 text-[20px]">forward</span>
                      <h4 className="font-h2 text-[14px] text-on-surface">3. Traffic keeps flowing</h4>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">
                      Visitors that would have hit the full store are forwarded to the next available one in your portfolio.
                      Zero downtime, zero lost sessions.
                    </p>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-md italic">
                  In short: you focus on growing the catalogue, AmksaSwitchify keeps the doors open.
                </p>
              </div>

              {/* FAQ */}
              <div className="border border-outline-variant rounded-xl p-lg">
                <div className="flex items-center gap-3 mb-md">
                  <span className="material-symbols-outlined text-secondary text-[22px]">quiz</span>
                  <h3 className="font-h2 text-[16px] text-on-surface">Frequently Asked Questions</h3>
                </div>
                <div className="space-y-3">
                  <details className="group rounded-lg border border-outline-variant bg-white p-md hover:border-secondary/40 transition-colors">
                    <summary className="cursor-pointer flex items-center justify-between text-body-md font-semibold text-on-surface">
                      Do I need to touch my Shopify theme code?
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      No. Once a store is connected, AmksaSwitchify handles everything for you — installation, updates,
                      and removal — across every theme on the storefront.
                    </p>
                  </details>
                  <details className="group rounded-lg border border-outline-variant bg-white p-md hover:border-secondary/40 transition-colors">
                    <summary className="cursor-pointer flex items-center justify-between text-body-md font-semibold text-on-surface">
                      What happens when a store hits its limit?
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      It&apos;s flipped to <strong>Full</strong> and visitors are seamlessly forwarded to the next available
                      store in your rotation. You&apos;ll see a <em>Forwarding to</em> indicator on the row so you always know
                      where traffic is going.
                    </p>
                  </details>
                  <details className="group rounded-lg border border-outline-variant bg-white p-md hover:border-secondary/40 transition-colors">
                    <summary className="cursor-pointer flex items-center justify-between text-body-md font-semibold text-on-surface">
                      Can I change a store&apos;s limit later?
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      Anytime. The limit field on each row is editable — type the new value, hit save, and the change is
                      live immediately.
                    </p>
                  </details>
                  <details className="group rounded-lg border border-outline-variant bg-white p-md hover:border-secondary/40 transition-colors">
                    <summary className="cursor-pointer flex items-center justify-between text-body-md font-semibold text-on-surface">
                      Will my customers notice anything?
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      The forwarding is fast and unobtrusive. From the visitor&apos;s perspective they simply land on a
                      working store and shop normally.
                    </p>
                  </details>
                  <details className="group rounded-lg border border-outline-variant bg-white p-md hover:border-secondary/40 transition-colors">
                    <summary className="cursor-pointer flex items-center justify-between text-body-md font-semibold text-on-surface">
                      How do I add a teammate?
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      Each team member signs up with their own email. As the owner you keep visibility across the whole
                      portfolio from your <strong>Master View</strong>.
                    </p>
                  </details>
                  <details className="group rounded-lg border border-outline-variant bg-white p-md hover:border-secondary/40 transition-colors">
                    <summary className="cursor-pointer flex items-center justify-between text-body-md font-semibold text-on-surface">
                      How quickly does the dashboard refresh?
                      <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      Automatically every 30 seconds. You can also click <strong>Sync All</strong> for an instant pull
                      from every connected store.
                    </p>
                  </details>
                </div>
              </div>

              {/* Contact */}
              <div className="border border-outline-variant rounded-xl p-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-amber-300 text-[24px]">support_agent</span>
                      <h3 className="font-h2 text-[18px]">Need a hand?</h3>
                    </div>
                    <p className="text-body-md text-slate-300 max-w-[28rem]">
                      Our team is one email away. Whether it&apos;s a setup question, a billing query, or feedback — we
                      usually reply within a few hours on business days.
                    </p>
                  </div>
                  <a
                    href="mailto:support@amksaswitchify.com"
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-5 py-3 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                    support@amksaswitchify.com
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
