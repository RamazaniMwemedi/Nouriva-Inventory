// Import the necessary modules from next for request handling and response generation
import { NextResponse, NextRequest } from 'next/server';
import { addProduct } from '@/lib/db';
// app/api/products/[id]/route.ts
import { updateProduct, getProductByIdAndVerifySeller } from '@/lib/db';
import { auth } from '@/lib/auth';
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();

    console.log('body', body);

    const {
      name,
      description,
      categoryId,
      sellerId,
      status,
      price,
      stock,
      availableAt,
      images // Accept multiple image URLs as an array
    } = body;

    // Validate the input data and collect missing fields
    const missingFields = [];

    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!categoryId) missingFields.push('categoryId');
    if (!sellerId) missingFields.push('sellerId');
    if (!status) missingFields.push('status');
    if (!price) missingFields.push('price');
    if (!stock) missingFields.push('stock');
    if (!availableAt) missingFields.push('availableAt');
    if (!images || !Array.isArray(images) || images.length === 0) {
      missingFields.push('images');
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Call the addProduct function to add the new product to the database
    await addProduct({
      name,
      description,
      categoryId: parseInt(categoryId, 10),
      sellerId: parseInt(sellerId, 10),
      status,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      availableAt: new Date(availableAt),
      imageUrls: images
    });

    // Send a success response
    return NextResponse.json({ message: 'Product added successfully' });
  } catch (error) {
    console.error('Failed to add product', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sellerId = parseInt(session.user?.id!);

    const body = await req.json();
    const {
      name,
      description,
      categoryId,
      status,
      price,
      stock,
      availableAt,
      images,
      productId
    } = body;

    // Verify product ownership
    const { product } = await getProductByIdAndVerifySeller(
      productId,
      sellerId
    );
    if (!product) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!categoryId) missingFields.push('categoryId');
    if (!status) missingFields.push('status');
    if (!price) missingFields.push('price');
    if (!stock) missingFields.push('stock');
    if (!availableAt) missingFields.push('availableAt');
    if (!images || !Array.isArray(images) || images.length === 0)
      missingFields.push('images');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the product in the database
    await updateProduct({
      id: productId,
      name,
      description,
      categoryId: parseInt(categoryId, 10),
      sellerId,
      status,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      availableAt: new Date(availableAt)
      // image: images
    });

    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
