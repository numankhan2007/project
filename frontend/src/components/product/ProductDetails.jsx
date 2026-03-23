import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Shield, Tag, ArrowLeft, ShoppingCart, Eye, Heart, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import SoldRibbon from './SoldRibbon';
import { formatPrice, formatDate } from '../../utils/helpers';
import { CATEGORIES } from '../../constants';

export default function ProductDetails({ product, onOrder, onBack }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const isSold = product.status === 'sold';
  const category = CATEGORIES.find((c) => c.id === product.category);

  const conditionColorMap = {
    'New': 'emerald',
    'Like New': 'cyan',
    'Excellent': 'indigo',
    'Good': 'amber',
    'Acceptable': 'orange',
  };

  const conditionPercent = {
    'New': 100,
    'Like New': 90,
    'Excellent': 80,
    'Good': 65,
    'Acceptable': 50,
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
          <div className="relative card overflow-hidden shadow-md">
            <div className="aspect-square bg-white">
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
            {isSold && <SoldRibbon />}
            {/* Wishlist button */}
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all
                ${isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-rose-500'}`}
            >
              <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
            </button>
            {/* Category badge */}
            <div className="absolute top-3 left-3">
              <Badge color={category?.color || 'indigo'}>
                <span className="mr-1">{category?.icon}</span>
                {category?.name}
              </Badge>
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 bg-white transition-all
                    ${i === selectedImage ? 'border-indigo-500 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Shield, label: 'Safe Trade', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { icon: CheckCircle2, label: 'Verified Seller', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { icon: Eye, label: 'OTP Protected', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${bg}`}>
                <Icon size={16} className={color} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge color={conditionColorMap[product.condition] || 'gray'}>
                {product.condition}
              </Badge>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Listed on {formatDate(product.createdAt)}
            </p>
          </div>

          {/* Price Block */}
          <div className={`rounded-2xl p-4 flex items-center justify-between ${isSold ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30'}`}>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Price</p>
              <span className="text-3xl font-bold gradient-text">
                {formatPrice(product.price)}
              </span>
            </div>
            {isSold ? (
              <Badge color="rose">SOLD OUT</Badge>
            ) : (
              <div className="text-right">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Negotiable?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chat with seller</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Tag size={14} className="text-indigo-500" /> Description
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Condition Bar */}
          <div className="card p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-500" /> Condition
              </h3>
              <Badge color={conditionColorMap[product.condition] || 'gray'}>{product.condition}</Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${conditionPercent[product.condition] ?? 70}%` }}
              />
            </div>
          </div>

          {/* About the Seller */}
          <div className="card p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <User size={14} className="text-indigo-500" /> About the Seller
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
                {product.seller.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{product.seller.username}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-purple-400 shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.seller.campus}</span>
                </div>
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

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            🔒 Your transaction is protected by UniMart's safe trade system.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
