'use client';

import { useState } from 'react';

interface Order {
  id: number;
  orderDate: string;
  orderStatus: string;
  totalAmount: string;
}

interface OrderDetails {
  id: number;
  orderDate: string;
  orderStatus: string;
  totalAmount: string;
  customerName: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: string;
  }>;
}

interface OrderListProps {
  orders: Order[];
}

export default function OrderList({ orders }: OrderListProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);

  async function fetchOrderDetails(orderId: number) {
    const response = await fetch(`/api/orders/${orderId}`);
    const data: OrderDetails = await response.json();
    setSelectedOrder(data);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
      </header>

      <main className="p-6">
        <table className="w-full bg-white rounded-lg shadow-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-4">Order ID</th>
              <th className="text-left py-2 px-4">Order Date</th>
              <th className="text-left py-2 px-4">Status</th>
              <th className="text-left py-2 px-4">Total</th>
              <th className="text-left py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-2 px-4">{order.id}</td>
                <td className="py-2 px-4">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td className="py-2 px-4">{order.orderStatus}</td>
                <td className="py-2 px-4">KES{order.totalAmount}</td>
                <td className="py-2 px-4">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => fetchOrderDetails(order.id)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedOrder && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">Order Details</h2>
            <p>
              <strong>Order ID:</strong> {selectedOrder.id}
            </p>
            <p>
              <strong>Status:</strong> {selectedOrder.orderStatus}
            </p>
            <p>
              <strong>Total Amount:</strong> KES{selectedOrder.totalAmount}
            </p>
            <p>
              <strong>Customer Name:</strong> {selectedOrder.customerName}
            </p>
            <h3 className="mt-4 text-lg font-semibold">Items</h3>
            <ul className="list-disc pl-5">
              {selectedOrder.items.map((item, index) => (
                <li key={index}>
                  Product ID: {item.productId}, Quantity: {item.quantity},
                  Price: KES{item.price}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
