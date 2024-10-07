import React, { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';

const Order = () => {
  const fetch = useAuthenticatedFetch();
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetchboxcollectionsData();
  }, []);
  async function fetchboxcollectionsData() {
    try {
      let request = await fetch('/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      let response = await request.json();
      if (response.success == true) {
        setOrders(response.response);
        // console.log(orders);
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
    }
  }
  orders.forEach((order, index) => {
    if (order.line_items && order.line_items.length > 0) {
      console.log(`Order ${index + 1} - Product ID: ${order.line_items[0].product_id}`);
    } else {
      console.log(`Order ${index + 1} has no line items.`);
    }
  });

  return (
    <div>
      <h1>Order Notifications</h1>
      <ul>
        {orders.map((order, index) => (
          <li key={index}>{JSON.stringify(order)}</li>
        ))}
      </ul>
    </div>
  );
};

export default Order;
