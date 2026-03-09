import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductDetails from '../components/product/ProductDetails';
import OrderModal from '../components/order/OrderModal';
import Loader from '../components/common/Loader';
import { MOCK_PRODUCTS } from '../constants';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showOrderModal, setShowOrderModal] = useState(false);

  const product = MOCK_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="section-padding page-padding text-center">
        <p className="text-6xl mb-4">😕</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">This product may have been removed or doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="section-padding page-padding">
      <ProductDetails
        product={product}
        onOrder={() => setShowOrderModal(true)}
        onBack={() => navigate('/')}
      />
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        product={product}
      />
    </div>
  );
}
