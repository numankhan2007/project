import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';
import Badge from '../common/Badge';
import SoldRibbon from './SoldRibbon';
import { formatPrice, formatRelativeTime } from '../../utils/helpers';
import { CATEGORIES } from '../../constants';

export default function ProductCard({ product, index = 0 }) {
  const isSold = product.product_status === 'sold' || product.status === 'sold';
  const category = CATEGORIES.find((c) => c.id === product.category);
  const isFree = product.price === 0;

  // Handle both API format and mock format for images
  const imageUrl = product.image_urls?.[0] || product.image_url || product.images?.[0] || '/placeholder.png';

  // Handle both API format and mock format for seller info
  const sellerLocation = product.seller_college || product.seller?.campus || 'Campus';

  // Handle both API format and mock format for dates
  const createdAt = product.created_at || product.createdAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={isSold ? '#' : `/product/${product.id}`}
        className={`block card card-hover overflow-hidden group ${isSold ? 'opacity-60 pointer-events-auto cursor-not-allowed' : ''}`}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          {/* Desktop: aspect-video, Mobile: aspect-[3/4] */}
          <div className="aspect-[3/4] md:aspect-video">
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 bg-gray-100 dark:bg-gray-800"
            />
          </div>

          {/* Category Badge */}
          {category && (
            <div className="absolute top-3 left-3">
              <Badge color={category?.color || 'indigo'}>
                <span className="mr-1">{category?.icon}</span>
                {category?.name || product.category}
              </Badge>
            </div>
          )}

          {/* Sold Ribbon */}
          {isSold && <SoldRibbon />}

          {/* Price Tag */}
          <div className="absolute bottom-3 right-3">
            <span className={`backdrop-blur-sm font-bold text-sm px-3 py-1.5 rounded-xl shadow-lg ${
              isFree
                ? 'bg-emerald-500/90 text-white'
                : 'bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white'
            }`}>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {product.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <MapPin size={12} />
              <span className="truncate max-w-[100px]">{sellerLocation}</span>
            </div>
            {createdAt && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                <span>{formatRelativeTime(createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
