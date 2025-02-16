import { NextResponse } from 'next/server';
import { db, sellers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    sellerName,
    contactPhone,
    companyName,
    websiteUrl,
    address,
    country,
    profileUrl
  } = body;

  // Validate input if necessary

  // Update the seller record
  await db
    .update(sellers)
    .set({
      sellerName,
      contactPhone,
      companyName,
      websiteUrl,
      address,
      country,
      profileUrl
    })
    .where(eq(sellers.email, session.user.email));

  return NextResponse.json({ success: true });
}
