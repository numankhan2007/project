import { createContext, useContext, useState } from 'react';
import { MOCK_ORDERS, ORDER_STATUS } from '../constants';
import { generateOTP, generateId } from '../utils/helpers';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const createOrder = (product, buyer) => {
    const newOrder = {
      id: generateId('order'),
      product,
      buyer: { username: buyer.username, campus: buyer.campus },
      seller: product.seller,
      status: ORDER_STATUS.PENDING,
      otp: null,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const acceptOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: ORDER_STATUS.ACCEPTED }
          : order
      )
    );
  };

  const generateOrderOTP = (orderId) => {
    const otp = generateOTP();
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: ORDER_STATUS.OTP_GENERATED, otp }
          : order
      )
    );
    return otp;
  };

  const verifyOTP = (orderId, enteredOTP) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && order.otp === enteredOTP) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: ORDER_STATUS.DELIVERED, deliveredAt: new Date().toISOString() }
            : o
        )
      );
      return true;
    }
    return false;
  };

  const cancelOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: ORDER_STATUS.CANCELLED }
          : order
      )
    );
  };

  const getOrdersByBuyer = (username) => {
    return orders.filter((o) => o.buyer.username === username);
  };

  const getOrdersBySeller = (username) => {
    return orders.filter((o) => o.seller.username === username);
  };

  const getOrderById = (orderId) => {
    return orders.find((o) => o.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        acceptOrder,
        generateOrderOTP,
        verifyOTP,
        cancelOrder,
        getOrdersByBuyer,
        getOrdersBySeller,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

export default OrderContext;
