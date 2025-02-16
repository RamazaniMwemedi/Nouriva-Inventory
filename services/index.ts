import { updateProduct } from '@/lib/db';
import { redirect } from 'next/navigation';

// Server-side form handling logic
export async function handleSubmit(
  state: { message: string },
  formData: FormData
) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string, 10);
  const categoryId = parseInt(formData.get('categoryId') as string, 10);
  const status = formData.get('status') as 'active' | 'inactive' | 'archived';
  const availableAt = new Date(formData.get('availableAt') as string);
  const productId = parseInt(formData.get('productId') as string, 10); // Adding the productId
  const sellerId = parseInt(formData.get('sellerId') as string, 10); // Adding the sellerId

  const updatedProduct = {
    id: productId,
    name,
    description,
    price,
    stock,
    categoryId,
    status,
    availableAt,
    sellerId // Adding the missing sellerId
  };

  await updateProduct(updatedProduct);
  redirect(`/products/${productId}`);
  return {
    message: 'Product updated successfully!'
  };
}
