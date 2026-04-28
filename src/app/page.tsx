import { prisma } from '@/lib/prisma';
import AdminPanel from '@/components/AdminPanel';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Only fetch stores belonging to the logged-in user
  const stores = await prisma.store.findMany({
    where: { userId: session.user?.id },
    orderBy: { createdAt: 'asc' },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <main className="container">
      <Header user={session.user} />
      <AdminPanel stores={stores} appUrl={appUrl} />
    </main>
  );
}
