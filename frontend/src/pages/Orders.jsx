import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, MessageCircle, KeyRound, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import OrderStatusBadge from '../components/order/OrderStatusBadge';
import OTPModal from '../components/order/OTPModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { formatPrice, formatDate } from '../utils/helpers';
import { ORDER_STATUS } from '../constants';

export default function Orders() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [statusFilter, setStatusFilter] = useState('all');
  const [otpModal, setOtpModal] = useState({ open: false, order: null, mode: 'buyer' });

  const userOrders = orders.filter(
    (o) => o.buyer.username === user?.username || o.seller.username === user?.username
  );

  const filteredOrders = statusFilter === 'all'
    ? userOrders
    : userOrders.filter((o) => o.status === statusFilter);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: ORDER_STATUS.PENDING, label: 'Pending' },
    { value: ORDER_STATUS.ACCEPTED, label: 'Accepted' },
    { value: ORDER_STATUS.OTP_GENERATED, label: 'OTP Sent' },
    { value: ORDER_STATUS.DELIVERED, label: 'Delivered' },
    { value: ORDER_STATUS.CANCELLED, label: 'Cancelled' },
  ];

  return (
    <div className="section-padding page-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {userOrders.length} total orders
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${statusFilter === option.value
                  ? 'gradient-bg text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {statusFilter === 'all' ? "You haven't placed or received any orders yet." : "No orders with this status."}
            </p>
            <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Browse products →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, i) => {
              const isBuyer = order.buyer.username === user?.username;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={order.product.images[0]}
                      alt={order.product.title}
                      className="w-full sm:w-28 h-28 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{order.product.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {isBuyer ? `Seller: ${order.seller.username}` : `Buyer: ${order.buyer.username}`}
                            {' · '}{formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color={isBuyer ? 'cyan' : 'purple'}>
                            {isBuyer ? 'Buying' : 'Selling'}
                          </Badge>
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </div>
                      <p className="text-xl font-bold gradient-text mt-2">{formatPrice(order.product.price)}</p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {order.status !== ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.DELIVERED && (
                          <Link to={`/chat/${order.id}`}>
                            <Button variant="secondary" size="sm" icon={MessageCircle}>Chat</Button>
                          </Link>
                        )}
                        {isBuyer && (order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.ACCEPTED) && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={KeyRound}
                            onClick={() => setOtpModal({ open: true, order, mode: 'buyer' })}
                          >
                            Generate OTP
                          </Button>
                        )}
                        {!isBuyer && order.status === ORDER_STATUS.OTP_GENERATED && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={KeyRound}
                            onClick={() => setOtpModal({ open: true, order, mode: 'seller' })}
                          >
                            Enter OTP
                          </Button>
                        )}
                        {order.status === ORDER_STATUS.DELIVERED && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-3 py-1.5">
                            ✅ Delivered on {formatDate(order.deliveredAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <OTPModal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ open: false, order: null, mode: 'buyer' })}
        order={otpModal.order}
        mode={otpModal.mode}
      />
    </div>
  );
}
