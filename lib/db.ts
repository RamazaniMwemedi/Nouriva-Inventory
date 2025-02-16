import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  pgEnum,
  serial,
  foreignKey,
  varchar
} from 'drizzle-orm/pg-core';
import { count, eq, ilike, inArray } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { create } from 'domain';

export const db = drizzle(neon(process.env.NEXT_PUBLIC_POSTGRES_URL!));

export const statusEnum = pgEnum('status', ['active', 'inactive', 'archived']);
export const methodTypeEnum = pgEnum('method_type', ['card', 'mpesa']);

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  categoryName: text('category_name').notNull(),
  slug: text('slug').notNull()
});

// Sellers table
export const sellers = pgTable('sellers', {
  id: serial('id').primaryKey(),
  sellerName: text('seller_name').notNull(),
  email: text('email').notNull(),
  contactPhone: text('contact_phone').notNull(),
  passwordHash: text('password_hash').notNull(),
  companyName: text('company_name'),
  websiteUrl: text('website_url'),
  profileUrl: text('profile_url'),
  address: text('address'),
  country: text('country'),
  role: text('role').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Add description field
  categoryId: integer('category_id')
    .references(() => categories.id) // Foreign key to categories
    .notNull(),
  sellerId: integer('seller_id').references(() => sellers.id),
  status: statusEnum('status').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull(),
  availableAt: timestamp('available_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  slug: text('slug').notNull()
});

// Product Images table
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(), // Foreign key to products
  imageUrl: text('image_url').notNull() // Each image URL for the product
});
// Product Variants table
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'cascade'
  }), // Foreign key to products
  variantName: text('variant_name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull(),
  imageUrl: text('image_url')
});

// Shipping Details table
export const shippingDetails = pgTable('shipping_details', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'cascade'
  }),
  weight: numeric('weight', { precision: 10, scale: 2 }),
  length: numeric('length', { precision: 10, scale: 2 }),
  width: numeric('width', { precision: 10, scale: 2 }),
  height: numeric('height', { precision: 10, scale: 2 }),
  shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 })
});

export const paymentDetails = pgTable('payment_details', {
  id: serial('id').primaryKey(),
  userType: text('user_type').notNull(),
  userId: integer('user_id').notNull(),
  methodType: methodTypeEnum('method_type').notNull(),
  cardHolderName: varchar('card_holder_name', { length: 100 }),
  cardNumberLast4: varchar('card_number_last4', { length: 4 }),
  cardToken: varchar('card_token', { length: 255 }),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  mpesaPhoneNumber: varchar('mpesa_phone_number', { length: 20 }),
  mpesaFullName: varchar('mpesa_full_name', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phoneNumber: text('phone_number'),
  username: text('username'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Addresses table
export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  addressType: text('address_type'),
  addressLine: text('address_line').notNull(),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  createdAt: timestamp('created_at').defaultNow()
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id),
  orderDate: timestamp('order_date').defaultNow(),
  orderStatus: text('order_status'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  shippingAddressId: integer('shipping_address_id').references(
    () => addresses.id
  ),
  billingAddressId: integer('billing_address_id').references(() => addresses.id)
});

// Order Items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull()
});

export type SelectProduct = typeof products.$inferSelect;
export const insertProductSchema = createInsertSchema(products);

// Assuming 'productImages' is the correct name of the images table
export async function getProducts(
  search: string,
  offset: number,
  sellerID: number
): Promise<{
  products: SelectProduct[];
  newOffset: number | null;
  totalProducts: number;
}> {
  // Step 1: Fetch Products (and their related fields)
  let productsQuery = db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      status: products.status,
      availableAt: products.availableAt,
      categoryId: products.categoryId,
      sellerId: products.sellerId,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      slug: products.slug
    })
    .from(products)
    .where(eq(products.sellerId, sellerID)); // Filter products by the logged-in seller's ID

  // Fetch products with pagination
  const fetchedProducts = await productsQuery.limit(5).offset(offset || 0);

  // If no products are found
  if (fetchedProducts.length === 0) {
    return { products: [], newOffset: null, totalProducts: 0 };
  }

  // Step 2: Count total number of products (for pagination purposes)
  const totalProductsResult = await db
    .select({ count: count() })
    .from(products);
  const totalProducts = totalProductsResult[0]?.count || 0;

  // Step 3: Fetch Images for Each Product (this is assuming you store images in a separate table)
  const productIds = fetchedProducts.map((product) => product.id);

  // Fetch images related to the fetched products
  const images = await db
    .select({
      productId: productImages.productId,
      imageUrl: productImages.imageUrl
    })
    .from(productImages)
    .where(inArray(productImages.productId, productIds));

  // Step 4: Combine Product Data with Images
  const productsWithImages = fetchedProducts.map((product) => {
    const productImages = images
      .filter((img) => img.productId === product.id)
      .map((img) => img.imageUrl);
    return {
      ...product,
      images: productImages // Attach the images to the product
    };
  });

  // Step 5: Determine New Offset for Pagination
  const newOffset = fetchedProducts.length >= 5 ? (offset || 0) + 5 : null;

  return {
    products: productsWithImages,
    newOffset,
    totalProducts
  };
}

export async function addProduct({
  name,
  description,
  categoryId,
  sellerId,
  status,
  price,
  stock,
  availableAt,
  imageUrls // Expecting an array of image URLs
}: {
  name: string;
  description: string;
  categoryId: number;
  sellerId: number;
  status: 'active' | 'inactive' | 'archived';
  price: number;
  stock: number;
  availableAt: Date;
  imageUrls: string[]; // Array of image URLs
}) {
  // Insert the product into the products table
  const product = await db
    .insert(products)
    .values({
      name,
      description,
      categoryId,
      sellerId,
      status,
      price: price.toString(),
      stock,
      availableAt,
      slug: name.toLowerCase().replace(/\s/g, '-') + Math.random().toString(36).substring(7)
    })
    .returning({ id: products.id }); // Return the newly created product ID

  const productId: number = product[0].id;

  // Insert each image URL into the productImages table
  if (imageUrls.length > 0) {
    const imageRecords = imageUrls.map((imageUrl) => ({
      productId, // Link each image to the new product ID
      imageUrl
    }));

    await db
      .insert(productImages)
      .values(imageRecords as { productId: number; imageUrl: string }[]);
  }
}

export async function deleteProductById(id: number) {
  await db.delete(products).where(eq(products.id, id));
}

export async function getProductByIdAndVerifySeller(
  productId: number,
  sellerId: number
): Promise<{
  product: SelectProduct | null;
  images: string[] | null;
}> {
  // Step 1: Fetch the product by its ID and include 'categoryId' to avoid the error
  const productResult = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      status: products.status,
      availableAt: products.availableAt,
      categoryId: products.categoryId, // Include categoryId here
      sellerId: products.sellerId, // Include sellerId to verify ownership
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      slug: products.slug
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  // If no product is found, return null
  if (productResult.length === 0) {
    return { product: null, images: null };
  }

  const product = productResult[0];

  // Step 2: Verify if the seller is the owner of the product
  if (product.sellerId !== sellerId) {
    // If the seller does not own the product, return null or throw an error
    throw new Error('Unauthorized access to the product.');
  }

  // Step 3: Fetch images for the product from the productImages table
  const imageResults = await db
    .select({
      imageUrl: productImages.imageUrl
    })
    .from(productImages)
    .where(eq(productImages.productId, productId));

  // Extract image URLs into an array
  const images = imageResults.map((img) => img.imageUrl);

  return {
    product, // Return the product details, now including categoryId
    images // Return the associated images
  };
}

export async function updateProduct(product: {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  sellerId: number;
  status: 'active' | 'inactive' | 'archived';
  price: number;
  stock: number;
  availableAt: Date;
}) {
  await db
    .update(products)
    .set({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      categoryId: product.categoryId,
      status: product.status,
      availableAt: product.availableAt
    })
    .where(eq(products.id, product.id));
}
