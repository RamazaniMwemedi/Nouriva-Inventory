import AddProductForm from '@/components/ui/AddProductForm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Add Product'
};

export default async function AddProductPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  return (
    <div className="container m-auto">
      <h3 className="text-4xl font-medium leading-6 text-gray-900 mb-4 pt-8 pb-8">
        Add New Product
      </h3>
      <AddProductForm user={session.user!} />
    </div>
  );
}
