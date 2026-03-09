import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Calendar, Shield, Tag, ArrowLeft, ShoppingCart } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import SoldRibbon from './SoldRibbon';
import { formatPrice, formatDate } from '../../utils/helpers';
import { CATEGORIES, CONDITION_OPTIONS } from '../../constants';

export default function ProductDetails({ product, onOrder, onBack }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const isSold = product.status === 'sold';
  const category = CATEGORIES.find((c) => c.id === product.category);

  const conditionColorMap = {
    'New': 'emerald',
    'Like New': 'cyan',
    'Excellent': 'indigo',
    'Good': 'amber',
    'Acceptable': 'orange',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to browse</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="relative card overflow-hidden">
            <div className="aspect-square">
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {isSold && <SoldRibbon />}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all
                    ${i === selectedImage ? 'border-indigo-500 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge color={category?.color || 'indigo'}>
                <span className="mr-1">{category?.icon}</span>
                {category?.name}
              </Badge>
              <Badge color={conditionColorMap[product.condition] || 'gray'}>
                {product.condition}
              </Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {product.title}
            </h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold gradient-text">
              {formatPrice(product.price)}
            </span>
            {isSold && (
              <Badge color="rose">SOLD OUT</Badge>
            )}
          </div>

          {/* Description */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <User size={18} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Seller</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.seller.username}</p>
              </div>
            </div>
            <div className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <MapPin size={18} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Campus</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.seller.campus}</p>
              </div>
            </div>
            <div className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
                <Calendar size={18} className="text-pink-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Listed</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(product.createdAt)}</p>
              </div>
            </div>
            <div className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Shield size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Condition</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{product.condition}</p>
              </div>
            </div>
          </div>


          {/* Order Button */}
          <Button
            variant={isSold ? 'secondary' : 'primary'}
            size="xl"
            fullWidth
            disabled={isSold}
            onClick={onOrder}
            icon={ShoppingCart}
          >
            {isSold ? 'This item has been sold' : 'Place Order'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
