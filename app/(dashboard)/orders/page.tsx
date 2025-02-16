import { db, orders, orderItems, customers, addresses } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import OrderList from '@/components/ui/order-list';

async function getOrdersForSeller(sellerId: number) {
  // Fetch orders belonging to this seller
  const ordersData = await db
    .select({
      id: orders.id,
      orderDate: orders.orderDate,
      orderStatus: orders.orderStatus,
      totalAmount: orders.totalAmount
    })
    .from(orders)
    .where(eq(orders.customerId, sellerId)) // Assuming `customerId` links the seller
    .limit(10);

  return ordersData;
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.email) {
    return <div className="max-w-md mx-auto my-8 p-4">Not logged in.</div>;
  }

  // Fetch the current seller's ID
  const seller = await db
    .select()
    .from(customers)
    .where(eq(customers.email, session.user.email))
    .limit(1);

  if (!seller[0]) {
    return (
      <div className="max-w-md mx-auto my-8 p-4">No orders available.</div>
    );
  }

  const orders = await getOrdersForSeller(seller[0].id);

  return (
    <OrderList
      //@ts-ignore
      orders={orders}
    />
  );
}
