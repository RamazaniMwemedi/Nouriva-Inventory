// components/ui/EditProductForm.tsx
'use client';

import { SelectProduct } from '@/lib/db';
import { User } from 'next-auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import dynamic from 'next/dynamic';
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false
});
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';

export default function EditProductComponent({
  user,
  product,
  images
}: {
  user: User;
  product: SelectProduct;
  images: string[];
}) {
  const mdParser = new MarkdownIt(/* Markdown-it options */);

  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState<number>(parseFloat(product.price));
  const [stock, setStock] = useState(product.stock);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [productDescription, setProductDescription] = useState(
    product.description
  );
  const [status, setStatus] = useState(product.status);
  const [availableAt, setAvailableAt] = useState(
    new Date(product.availableAt).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state
  const router = useRouter();

  function handleEditorChange({ html, text }: { html: string; text: string }) {
    setProductDescription(text);
  }
  const handleImageUpload = (file: File) => {
    return new Promise(async (resolve) => {
      const reader = new FileReader();

      reader.onload = async (data) => {
        if (data.target) {
          const base64DataURL = data.target.result as string;
          let postImageUrl;

          if (file) {
            const newImageRef = ref(storage, `products/${file.name}`);

            await uploadBytes(newImageRef, file);
            postImageUrl = await getDownloadURL(newImageRef);
          }

          if (postImageUrl) {
            resolve(postImageUrl);
          } else {
            resolve(base64DataURL);
          }
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true); // Set loading state to true when submitting

    const data = {
      name,
      description: productDescription,
      price,
      stock,
      categoryId,
      status,
      availableAt,
      sellerId: user.id, // from session
      images // assuming you're updating images too
    };

    try {
      const response = await fetch(`/api/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, productId: product.id })
      });

      if (!response.ok) {
        console.error('Error updating product:', await response.json());
        setIsSubmitting(false); // Reset loading state on error
        return;
      }

      router.push(`/products/${product.id}`);
    } catch (error) {
      console.error('Failed to submit form', error);
    } finally {
      setIsSubmitting(false); // Reset loading state after submission
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Product Details Form */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
        <p className="text-gray-600 mb-6">Update your product information</p>

        <form onSubmit={handleSubmit} method="POST">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Category
              </label>
              <input
                type="number"
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Status
              </label>
              <select
                name="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as 'active' | 'inactive' | 'archived'
                  )
                }
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <MdEditor
              className="mt-1 block w-full min-h-96 rounded-md border-gray-300 shadow-sm"
              renderHTML={(text) => mdParser.render(text)}
              onChange={handleEditorChange}
              onImageUpload={handleImageUpload}
              linkUrl={''}
              allowPasteImage
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-500">
              Available At
            </label>
            <input
              type="date"
              name="availableAt"
              value={availableAt}
              onChange={(e) => setAvailableAt(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div className="mt-6">
            <SubmitButton isSubmitting={isSubmitting} />
          </div>
        </form>
      </div>

      {/* Product Images */}
      <div className="md:w-1/3">
        <h2 className="text-lg font-semibold mb-4">Product Images</h2>
        <div className="grid grid-cols-2 gap-4">
          {images && images.length > 0 ? (
            images.map((imageUrl, index) => (
              <div key={index} className="relative">
                <img
                  src={imageUrl}
                  alt={`Product Image KES {index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            ))
          ) : (
            <p>No images available for this product.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" size="lg" variant="default" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}
