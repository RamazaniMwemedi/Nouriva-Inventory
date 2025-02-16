import { getProductByIdAndVerifySeller, updateProduct } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { handleSubmit } from 'services';
import EditProductComponent from '@/components/ui/EditProductForm';

export default async function EditProductPage({
  params
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const productId = parseInt(params.id);
  const sellerId = parseInt(session.user?.id!);

  // Fetch product and verify that the seller owns it
  const { images, product } = await getProductByIdAndVerifySeller(
    productId,
    sellerId
  );

  if (!product) {
    notFound();
  }

  // Use useActionState hook to manage form state

  return (
    <EditProductComponent
      user={session.user!}
      images={images!}
      product={product}
    />
  );
}
