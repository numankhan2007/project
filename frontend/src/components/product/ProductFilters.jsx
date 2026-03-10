import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, SlidersHorizontal, IndianRupee, MapPin, Gift, Calendar, BadgeCheck, Tag } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { CATEGORIES, CONDITION_OPTIONS, SORT_OPTIONS, CAMPUSES } from '../../constants';

const PRICE_PRESETS = [
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 – ₹2K', min: '500', max: '2000' },
  { label: '₹2K – ₹5K', min: '2000', max: '5000' },
  { label: 'Above ₹5K', min: '5000', max: '' },
];

const DATE_POSTED_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
];

export default function ProductFilters({ filters, onFilterChange, onClear, totalResults = 0 }) {
  const [showFilters, setShowFilters] = useState(false);

  const handleCategoryToggle = (categoryId) => {
    onFilterChange({
      ...filters,
      category: filters.category === categoryId ? '' : categoryId,
    });
  };

  const handleConditionToggle = (condition) => {
    onFilterChange({
      ...filters,
      condition: filters.condition === condition ? '' : condition,
    });
  };

  const handleSortChange = (value) => {
    onFilterChange({ ...filters, sort: value });
  };

  const handlePriceChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handlePricePreset = (min, max) => {
    const isActive = filters.priceMin === min && filters.priceMax === max;
    onFilterChange({
      ...filters,
      priceMin: isActive ? '' : min,
      priceMax: isActive ? '' : max,
    });
  };

  const handleCampusChange = (value) => {
    onFilterChange({ ...filters, campus: value });
  };

  const handleFreeToggle = () => {
    onFilterChange({ ...filters, freeOnly: !filters.freeOnly });
  };

  const handleDatePostedChange = (value) => {
    onFilterChange({
      ...filters,
      datePosted: filters.datePosted === value ? '' : value,
    });
  };

  const handleVerifiedToggle = () => {
    onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const activeFilterCount = [
    filters.category,
    filters.condition,
    filters.sort !== 'newest' ? filters.sort : '',
    filters.priceMin,
    filters.priceMax,
    filters.campus,
    filters.freeOnly ? 'free' : '',
    filters.datePosted,
    filters.verifiedOnly ? 'verified' : '',
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
              ${showFilters
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{totalResults}</span> products
          </p>
        </div>

        {/* Sort */}
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expandable Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="card p-5 space-y-5">
              {/* Categories */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border
                        ${filters.category === cat.id
                          ? 'gradient-bg text-white border-transparent shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                        }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Condition</h4>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((condition) => (
                    <button
                      key={condition}
                      onClick={() => handleConditionToggle(condition)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border
                        ${filters.condition === condition
                          ? 'gradient-bg text-white border-transparent shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                        }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Price Presets */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <Tag size={14} /> Quick Budget
                </h4>
                <div className="flex flex-wrap gap-2">
                  {PRICE_PRESETS.map((preset) => {
                    const isActive = filters.priceMin === preset.min && filters.priceMax === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => handlePricePreset(preset.min, preset.max)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border
                          ${isActive
                            ? 'bg-indigo-500 text-white border-transparent shadow-md shadow-indigo-500/20'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Price Range */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <IndianRupee size={14} /> Custom Budget Range
                </h4>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin || ''}
                      onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <span className="text-gray-400 text-sm font-medium">to</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax || ''}
                      onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Date Posted */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <Calendar size={14} /> Date Posted
                </h4>
                <div className="flex flex-wrap gap-2">
                  {DATE_POSTED_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleDatePostedChange(option.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border
                        ${filters.datePosted === option.value
                          ? 'bg-purple-500 text-white border-transparent shadow-md shadow-purple-500/20'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campus Filter */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <MapPin size={14} /> Campus / Location
                </h4>
                <select
                  value={filters.campus || ''}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="">All Campuses</option>
                  {CAMPUSES.map((campus) => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
              </div>

              {/* Toggle Filters Row */}
              <div className="flex flex-wrap gap-3">
                {/* Free Only Toggle */}
                <button
                  onClick={handleFreeToggle}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                    ${filters.freeOnly
                      ? 'bg-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/20'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                    }`}
                >
                  <Gift size={16} />
                  Free Items Only
                </button>

                {/* Verified Seller Toggle */}
                <button
                  onClick={handleVerifiedToggle}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                    ${filters.verifiedOnly
                      ? 'bg-blue-500 text-white border-transparent shadow-md shadow-blue-500/20'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                >
                  <BadgeCheck size={16} />
                  Verified Sellers Only
                </button>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={onClear} icon={X}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.category && (
            <Badge color="indigo" className="cursor-pointer" onClick={() => handleCategoryToggle(filters.category)}>
              {CATEGORIES.find((c) => c.id === filters.category)?.name}
              <X size={12} className="ml-1" />
            </Badge>
          )}
          {filters.condition && (
            <Badge color="purple" className="cursor-pointer" onClick={() => handleConditionToggle(filters.condition)}>
              {filters.condition}
              <X size={12} className="ml-1" />
            </Badge>
          )}
          {(filters.priceMin || filters.priceMax) && (
            <Badge color="cyan" className="cursor-pointer" onClick={() => onFilterChange({ ...filters, priceMin: '', priceMax: '' })}>
              ₹{filters.priceMin || '0'} – ₹{filters.priceMax || '∞'}
              <X size={12} className="ml-1" />
            </Badge>
          )}
          {filters.datePosted && (
            <Badge color="purple" className="cursor-pointer" onClick={() => handleDatePostedChange(filters.datePosted)}>
              {DATE_POSTED_OPTIONS.find((o) => o.value === filters.datePosted)?.label}
              <X size={12} className="ml-1" />
            </Badge>
          )}
          {filters.campus && (
            <Badge color="amber" className="cursor-pointer" onClick={() => handleCampusChange('')}>
              {filters.campus}
              <X size={12} className="ml-1" />
            </Badge>
          )}
          {filters.freeOnly && (
            <Badge color="emerald" className="cursor-pointer" onClick={handleFreeToggle}>
              Free Only
              <X size={12} className="ml-1" />
            </Badge>
          )}
          {filters.verifiedOnly && (
            <Badge color="blue" className="cursor-pointer" onClick={handleVerifiedToggle}>
              Verified Sellers
              <X size={12} className="ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

