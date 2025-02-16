// Import necessary modules from next and your db file
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust this import path based on your project structure
import { categories } from '@/lib/db'; // This should point to your categories table schema in db.ts

// Function to handle the API request
export async function GET() {
  try {
    // Fetch all categories from the database
    const fetchedCategories = await db.select().from(categories);

    // Return the categories in JSON format
    return NextResponse.json(fetchedCategories, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch categories', error);
    // Return an error response if something goes wrong
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
