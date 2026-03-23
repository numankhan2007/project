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
  const isSold = product.product_status === 'sold' || product.status === 'sold';
  const category = CATEGORIES.find((c) => c.id === product.category);

  // Handle both API format and mock format for images
  const images = product.image_urls?.length > 0
    ? product.image_urls
    : product.images?.length > 0
      ? product.images
      : [product.image_url || '/placeholder.png'];

  // Extract condition from description if embedded
  let condition = product.condition;
  if (!condition && product.description) {
    const match = product.description.match(/\[Condition: ([^\]]+)\]/);
    if (match) {
      condition = match[1];
    }
  }

  // Clean description by removing condition tag
  const cleanDescription = product.description?.replace(/\[Condition: [^\]]+\]\n\n?/, '') || '';

  // Handle both API format and mock format for seller info
  const sellerUsername = product.seller_username || product.seller?.username || 'Unknown';
  const sellerCampus = product.seller_college || product.seller?.campus || 'Campus';

  // Handle both API format and mock format for dates
  const createdAt = product.created_at || product.createdAt;

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
          <div className="relative card overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="aspect-square">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-contain p-6"
              />
            </div>
            {isSold && <SoldRibbon />}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all bg-white dark:bg-gray-800
                    ${i === selectedImage ? 'border-indigo-500 shadow-lg' : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {category && (
                <Badge color={category?.color || 'indigo'}>
                  <span className="mr-1">{category?.icon}</span>
                  {category?.name}
                </Badge>
              )}
              {condition && (
                <Badge color={conditionColorMap[condition] || 'gray'}>
                  {condition}
                </Badge>
              )}
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
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {cleanDescription || 'No description provided.'}
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{sellerUsername}</p>
              </div>
            </div>
            <div className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <MapPin size={18} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Campus</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{sellerCampus}</p>
              </div>
            </div>
            {createdAt && (
              <div className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
                  <Calendar size={18} className="text-pink-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Listed</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(createdAt)}</p>
                </div>
              </div>
            )}
            {condition && (
              <div className="card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Shield size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Condition</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{condition}</p>
                </div>
              </div>
            )}
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
