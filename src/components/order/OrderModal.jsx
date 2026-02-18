import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatPrice } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useNotifications } from '../../context/NotificationContext';

export default function OrderModal({ isOpen, onClose, product }) {
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { success } = useNotifications();
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleOrder = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      createOrder(product, user);
      success(`Order placed for "${product.title}"! You can now chat with the seller.`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Order" size="md">
      <div className="space-y-6">
        {/* Product Summary */}
        <div className="flex gap-4">
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
          />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{product.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.condition} · {product.seller.campus}</p>
            <p className="text-xl font-bold gradient-text mt-2">{formatPrice(product.price)}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-xl p-4 space-y-2">
          <h5 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">What happens next?</h5>
          <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
              Your order request will be sent to the seller
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
              You'll be able to chat with the seller to arrange delivery
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
              An OTP will be generated to confirm delivery
            </li>
          </ul>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Payment is handled offline between buyer and seller. UNIMART only facilitates the connection.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            onClick={handleOrder}
            icon={ShoppingCart}
          >
            Confirm Order
          </Button>
        </div>
      </div>
    </Modal>
  );
}
