import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle, Edit, Trash } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { getProductByIdAndVerifySeller } from '@/lib/db';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default async function ProductsPage({
  params
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const productId = parseInt(params.id);

  const { images, product } = await getProductByIdAndVerifySeller(
    productId,
    parseInt(session.user?.id!)
  );

  if (!product) {
    return <p>Product not found or you don't have access to it.</p>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Product Details */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-2">Product Details</h1>
        <p className="text-gray-600 mb-6">
          View and manage product information
        </p>

        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Price:</p>
                  <p className="text-xl font-semibold">KES {product.price}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Stock:</p>
                  <p className="text-xl font-semibold">{product.stock} units</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category:</p>
                  <p className="text-lg font-semibold">{product.categoryId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status:</p>
                  <p className="text-lg font-semibold">{product.status}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">
                  Description:
                </p>
                <div className="markdown-container">
                  <ReactMarkdown>{product.description}</ReactMarkdown>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500">
                  Available At:
                </p>
                <p className="text-lg font-semibold">
                  {new Date(product.availableAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images">
            <div className="grid grid-cols-3 gap-4">
              {images && images.length > 0 ? (
                images.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imageUrl}
                      alt={`Product Image ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                ))
              ) : (
                <p>No images available for this product.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions */}
      <div className="w-full md:w-1/3">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <p className="text-gray-600 mb-6">Manage your product</p>
          <div className="flex flex-col gap-4">
            <Link href={`/products/edit/${product.id}`}>
              <Button
                size="lg"
                variant="default"
                className="w-full flex items-center gap-2"
              >
                <Edit className="h-5 w-5" /> Edit Product
              </Button>
            </Link>
            <Button
              size="lg"
              variant="destructive"
              className="w-full flex items-center gap-2"
            >
              <Trash className="h-5 w-5" /> Delete Product
            </Button>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            Last updated: {new Date(product.updatedAt || '').toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
