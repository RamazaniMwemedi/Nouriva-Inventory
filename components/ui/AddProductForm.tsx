'use client';

import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  Fragment,
  useRef
} from 'react';
import { useRouter } from 'next/navigation';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseApp, { storage } from '@/lib/firebase/index'; // Your Firebase setup file
import { User } from 'next-auth';
import dynamic from 'next/dynamic';
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false
});
import 'react-markdown-editor-lite/lib/index.css';
import MarkdownIt from 'markdown-it';

import { MDXEditorMethods } from '@mdxeditor/editor';

// Types for Product Attributes
type ProductAttributes = {
  size?: string;
  [key: string]: string | undefined; // To handle dynamic attributes
};

// Category type
interface Category {
  id: number;
  categoryName: string;
}

export default function AddProductForm({ user }: { user: User }) {
  const router = useRouter();
  const mdParser = new MarkdownIt(/* Markdown-it options */);

  // Form state
  const [productName, setProductName] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [productCategory, setProductCategory] = useState<Category | null>(null);
  const [productAttributes, setProductAttributes] = useState<ProductAttributes>(
    {}
  );
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]); // For Firebase URLs
  const [productImages, setProductImages] = useState<File[]>([]); // For multiple images
  const [productPrice, setProductPrice] = useState<string>('');
  const [productStock, setProductStock] = useState<string>('');
  const [productDiscount, setProductDiscount] = useState<string>('');
  const [discountType, setDiscountType] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const editorRef = useRef<MDXEditorMethods | null>(null);

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
  // Fetch available categories dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data); // Assume API returns categories in the form of { id, categoryName }
    };
    fetchCategories();
  }, []);

  // Handle attribute changes dynamically
  const handleAttributesChange = (key: string, value: string) => {
    setProductAttributes((prev) => ({ ...prev, [key]: value }));
  };

  // Handle file input change for multiple images
  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setProductImages((prevImages) => [...prevImages, ...selectedFiles]);
    }
  };

  // Remove an image from the preview
  const handleRemoveImage = (index: number) => {
    setProductImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Handle category filtering
  const handleCategoryChange = (value: string) => {
    const filtered = categories.filter((category) =>
      category.categoryName.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  // Upload images to Firebase and get URLs
  const uploadImagesToFirebase = async () => {
    const urls: string[] = [];

    for (const file of productImages) {
      const storageRef = ref(storage, `products/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      urls.push(downloadURL);
    }

    setUploadedImageUrls(urls);
    return urls;
  };

  // Submit form
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    // Validate numeric fields
    if (isNaN(parseFloat(productPrice)) || isNaN(parseInt(productStock, 10))) {
      alert('Please enter valid numbers for price and stock.');
      return;
    }

    // Upload images to Firebase
    const imageUrls = await uploadImagesToFirebase();

    const productData = {
      name: productName,
      description: productDescription,
      categoryId: productCategory?.id!, // Use categoryId instead of name
      sellerId: user.id!, // Use sellerId
      attributes: productAttributes,
      price: parseFloat(productPrice),
      stock: parseInt(productStock, 10),
      discount: parseFloat(productDiscount),
      discountType: discountType,
      images: imageUrls, // Send uploaded image URLs
      availableAt: new Date(), // Set availableAt to current date
      status: 'active' // Set status to active by default
    };

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      router.push('/');
    } else {
      console.error('Failed to add product');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Information Section */}
        <div className="col-span-1">
          <h2 className="text-xl font-semibold mb-4">General Information</h2>

          <div className="mb-4">
            <label
              htmlFor="productName"
              className="block text-sm font-medium text-gray-700"
            >
              Product Name
            </label>
            <input
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Dynamic Product Attributes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Product Attributes
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {/* Example attribute input for Size */}
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium">Size:</label>
                <input
                  type="text"
                  value={productAttributes.size || ''}
                  onChange={(e) =>
                    handleAttributesChange('size', e.target.value)
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter size (optional)"
                />
              </div>
              {/* You can add more attribute inputs based on the category or product type */}
            </div>
          </div>

          {/* Category Selection with HeadlessUI Combobox */}
          <div className="mb-4">
            <label
              htmlFor="productCategory"
              className="block text-sm font-medium text-gray-700"
            >
              Product Category
            </label>
            <Combobox value={productCategory} onChange={setProductCategory}>
              <div className="relative mt-1">
                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
                  <Combobox.Input
                    className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                    displayValue={(category: Category | null) =>
                      category?.categoryName ?? ''
                    }
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    placeholder="Search category"
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </Combobox.Button>
                </div>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  afterLeave={() => setFilteredCategories([])} // Clear the filtered list after the Combobox closes
                >
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredCategories.length === 0 && (
                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                        No categories found.
                      </div>
                    )}
                    {filteredCategories.map((category) => (
                      <Combobox.Option
                        key={category.id}
                        value={category}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                            >
                              {category.categoryName}
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-indigo-600'
                                }`}
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="col-span-1">
          <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-4 w-full text-sm text-gray-500"
              onChange={handleImagesChange}
            />
            <div className="grid grid-cols-3 gap-2 mt-4">
              {productImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Product Image ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Pricing and Stock Section */}
        <div className="col-span-1">
          <h2 className="text-xl font-semibold mb-4">Pricing and Stock</h2>

          <div className="mb-4">
            <label
              htmlFor="productPrice"
              className="block text-sm font-medium text-gray-700"
            >
              Base Pricing
            </label>
            <input
              type="number"
              id="productPrice"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              placeholder="KES 0.00"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="productStock"
            className="block text-sm font-medium text-gray-700"
          >
            Stock
          </label>
          <input
            type="number"
            id="productStock"
            value={productStock}
            onChange={(e) => setProductStock(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Enter stock quantity"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="productDiscount"
            className="block text-sm font-medium text-gray-700"
          >
            Discount
          </label>
          <input
            type="number"
            id="productDiscount"
            value={productDiscount}
            onChange={(e) => setProductDiscount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Discount percentage"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="discountType"
            className="block text-sm font-medium text-gray-700"
          >
            Discount Type
          </label>
          <select
            id="discountType"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">None</option>
            <option value="newYear">Chinese New Year Discount</option>
            {/* Add more discount types as needed */}
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label
          htmlFor="productDescription"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <MdEditor
          className="mt-1 block w-full min-h-96 rounded-md border-gray-300 shadow-sm"
          renderHTML={(text) => mdParser.render(text)}
          onChange={handleEditorChange}
          onImageUpload={handleImageUpload}
          linkUrl={''}
          allowPasteImage
        />
      </div>
      {/* Submit Button */}
      <div className="col-span-1 flex items-end justify-end">
        <button
          disabled={submitting}
          type="submit"
          className={`w-36 mt-4 bg-green-500 ${
            submitting
              ? 'cursor-not-allowed bg-green-400'
              : 'hover:bg-green-600'
          } text-white rounded-md py-2 hover:bg-green-600 transition duration-300 ease-in-out`}
        >
          {submitting ? 'Adding New Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
}
