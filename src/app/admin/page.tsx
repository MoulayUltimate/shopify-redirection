import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminMasterPage() {
  const session = await auth();

  // ONLY ALLOW THE OWNER TO ACCESS THIS PAGE
  const ADMIN_EMAIL = 'remoymak@gmail.com';

  if (!session || session.user?.email !== ADMIN_EMAIL) {
    redirect('/');
  }

  // Fetch ALL stores from ALL users
  const allStores = await prisma.store.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalRevenue = allStores.reduce((sum, s) => sum + s.currentRevenue, 0);
  const liveCount = allStores.filter(s => s.isActive && s.currentRevenue < s.revenueLimit).length;

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="AmksaSwitchify" className="w-9 h-9 rounded-lg" />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Master Control Panel</h1>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">All Team Stores</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to My Stores
          </Link>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-container-padding py-xl space-y-xl">
        <div>
          <h2 className="font-h2 text-h2 text-on-surface">Network Overview</h2>
          <p className="text-body-md text-on-surface-variant">Every store across every user account.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Stores</span>
            <p className="font-stats-lg text-stats-lg text-on-surface mt-xs">{allStores.length}</p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Live Right Now</span>
            <p className="font-stats-lg text-stats-lg text-green-600 mt-xs">{liveCount}</p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Revenue</span>
            <p className="font-stats-lg text-stats-lg text-on-surface mt-xs">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-slate-100 bg-slate-50/30">
            <h3 className="font-h2 text-[18px] text-on-surface">All Team Stores</h3>
          </div>

          {allStores.length === 0 ? (
            <div className="p-xl text-center">
              <p className="text-body-md text-on-surface font-semibold">No stores yet</p>
              <p className="text-body-sm text-on-surface-variant mt-xs">No team member has added a store.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Store Details</th>
                    <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Owner</th>
                    <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Performance</th>
                    <th className="px-lg py-4 font-label-caps text-label-caps text-slate-500 border-b border-slate-100 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allStores.map((store: any) => {
                    const limitHit = store.currentRevenue >= store.revenueLimit;
                    return (
                      <tr key={store.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-lg py-4">
                          <p className="font-semibold text-slate-900 text-sm">{store.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{store.domain}</p>
                          <p className="text-[10px] text-slate-300 font-mono mt-1">ID: {store.id}</p>
                        </td>
                        <td className="px-lg py-4">
                          <p className="font-semibold text-slate-900 text-sm">{store.user?.name || 'Unknown'}</p>
                          <p className="text-[11px] text-slate-400">{store.user?.email}</p>
                        </td>
                        <td className="px-lg py-4">
                          <p className={`font-mono-data text-mono-data ${limitHit ? 'text-red-600' : 'text-slate-900'}`}>
                            ${store.currentRevenue.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">Limit: ${store.revenueLimit}</p>
                        </td>
                        <td className="px-lg py-4">
                          {store.isActive && !limitHit ? (
                            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-50 text-green-700 w-fit">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="text-[11px] font-bold uppercase tracking-tight">Live</span>
                            </div>
                          ) : limitHit ? (
                            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-50 text-red-700 w-fit border border-red-100">
                              <div className="w-2 h-2 rounded-full bg-red-600"></div>
                              <span className="text-[11px] font-bold uppercase tracking-tight">Full</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 text-slate-600 w-fit">
                              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                              <span className="text-[11px] font-bold uppercase tracking-tight">Paused</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-body-sm text-slate-500">
          Total stores managed by AmksaSwitchify: <strong className="text-slate-900">{allStores.length}</strong>
        </p>
      </div>
    </div>
  );
}
