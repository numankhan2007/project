import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Eye, Loader2, RefreshCw } from 'lucide-react';
import Badge from '../common/Badge';
import { formatPrice } from '../../utils/helpers';
import { CATEGORIES } from '../../constants';
import api from '../../services/api';

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products/my');
      setProducts(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-3">{error}</p>
        <button
          onClick={fetchMyProducts}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-500 dark:text-gray-400">You haven't listed any products yet.</p>
        <Link to="/sell" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
          Sell a product →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product, i) => {
        const category = CATEGORIES.find((c) => c.id === product.category);
        const isSold = product.product_status === 'sold';
        const imageUrl = product.image_urls?.[0] || product.image_url || '/placeholder.png';

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4"
          >
            <div className="flex gap-4">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-800"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {product.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {category && (
                        <Badge color={category?.color || 'gray'}>
                          {category?.icon} {category?.name}
                        </Badge>
                      )}
                      <Badge color={isSold ? 'rose' : 'emerald'}>
                        {isSold ? 'Sold' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-bold gradient-text mt-1">{formatPrice(product.price)}</p>
                <div className="flex gap-2 mt-3">
                  {!isSold && (
                    <Link
                      to={`/product/${product.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <Eye size={14} />
                      View Listing
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
