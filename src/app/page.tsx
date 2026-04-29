import { prisma } from '@/lib/prisma';
import AdminPanel from '@/components/AdminPanel';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

  return (
    <AdminPanel stores={stores} session={session} />
  );
}
