import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
export default async function IndexPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }
  redirect('/orders');
}
