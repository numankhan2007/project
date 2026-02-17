import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, KeyRound } from 'lucide-react';
import OrderStatusBadge from '../order/OrderStatusBadge';
import Button from '../common/Button';
import { formatPrice, formatDate } from '../../utils/helpers';
import { ORDER_STATUS } from '../../constants';

export default function SellHistory({ orders, onVerifyOTP }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">💰</p>
        <p className="text-gray-500 dark:text-gray-400">You haven't sold anything yet.</p>
        <Link to="/sell" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
          Sell a product →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card p-4"
        >
          <div className="flex gap-4">
            <img
              src={order.product.images[0]}
              alt={order.product.title}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {order.product.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Buyer: {order.buyer.username} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-lg font-bold gradient-text mt-1">{formatPrice(order.product.price)}</p>
              <div className="flex gap-2 mt-3">
                {order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.DELIVERED && (
                  <Link to={`/chat/${order.id}`}>
                    <Button variant="secondary" size="sm" icon={MessageCircle}>Chat</Button>
                  </Link>
                )}
                {order.status === ORDER_STATUS.OTP_GENERATED && (
                  <Button variant="primary" size="sm" icon={KeyRound} onClick={() => onVerifyOTP(order)}>
                    Enter OTP
                  </Button>
                )}
                {order.status === ORDER_STATUS.DELIVERED && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    ✅ Delivered on {formatDate(order.deliveredAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
