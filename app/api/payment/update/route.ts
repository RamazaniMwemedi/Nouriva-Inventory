import { NextResponse } from 'next/server';
import { db, paymentDetails } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const body = await request.json();
  const { user_type, user_id, methodType } = body;

  if (!user_type || !user_id || !methodType) {
    return NextResponse.json(
      { error: 'Missing required fields.' },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(paymentDetails)
    .where(
      and(
        eq(paymentDetails.userType, 'seller'),
        eq(paymentDetails.userId, Number(user_id))
      )
    )
    .limit(1);

  let updateValues: {
    userType: string;
    userId: number;
    methodType: 'card' | 'mpesa';
    cardHolderName?: string | null;
    cardNumberLast4?: string | null;
    cardToken?: string | null;
    mpesaPhoneNumber?: string | null;
    mpesaFullName?: string | null;
  } = {
    userType: user_type,
    userId: Number(user_id),
    methodType
  };

  if (methodType === 'card') {
    updateValues.cardHolderName = body.cardHolderName || null;
    updateValues.cardNumberLast4 = body.cardNumberLast4 || null;
    updateValues.cardToken = body.cardToken || null;
    updateValues.mpesaPhoneNumber = null;
    updateValues.mpesaFullName = null;
  } else if (methodType === 'mpesa') {
    updateValues.mpesaPhoneNumber = body.mpesaPhoneNumber || null;
    updateValues.mpesaFullName = body.mpesaFullName || null;
    updateValues.cardHolderName = null;
    updateValues.cardNumberLast4 = null;
    updateValues.cardToken = null;
  }

  if (existing.length > 0) {
    await db
      .update(paymentDetails)
      .set(updateValues)
      .where(eq(paymentDetails.id, existing[0].id));
  } else {
    await db.insert(paymentDetails).values(updateValues);
  }

  return NextResponse.json({ success: true });
}
