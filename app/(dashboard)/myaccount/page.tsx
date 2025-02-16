import { db, sellers, paymentDetails } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import EditableSellerInfo from '@/components/ui/editable-seller-info';

async function getCurrentSeller() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const sellerData = await db
    .select()
    .from(sellers)
    .where(eq(sellers.email, session.user.email))
    .limit(1);

  return sellerData[0] || null;
}

async function getPaymentDetailsForSeller(sellerId: number) {
  const detailsData = await db
    .select()
    .from(paymentDetails)
    .where(
      and(
        eq(paymentDetails.userType, 'seller'),
        eq(paymentDetails.userId, sellerId)
      )
    )
    .limit(1);

  return detailsData[0] || null;
}

export default async function MyAccountPage() {
  const seller = await getCurrentSeller();
  if (!seller) {
    return <div className="max-w-md mx-auto my-8 p-4">Not logged in.</div>;
  }

  const paymentMethod = await getPaymentDetailsForSeller(seller.id);

  return (
    <EditableSellerInfo
      seller={seller}
      //@ts-ignore
      paymentMethod={paymentMethod}
    />
  );
}
