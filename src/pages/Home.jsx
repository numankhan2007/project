import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, BadgeCheck, Users } from 'lucide-react';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
import { MOCK_PRODUCTS, CATEGORIES } from '../constants';

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    condition: '',
    sort: 'newest',
    priceMin: '',
    priceMax: '',
    campus: '',
    freeOnly: false,
  });

  const filteredProducts = useMemo(() => {
    let result = [...MOCK_PRODUCTS];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Category
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    // Condition
    if (filters.condition) {
      result = result.filter((p) => p.condition === filters.condition);
    }

    // Price Range
    if (filters.priceMin !== '') {
      result = result.filter((p) => p.price >= Number(filters.priceMin));
    }
    if (filters.priceMax !== '') {
      result = result.filter((p) => p.price <= Number(filters.priceMax));
    }

    // Campus
    if (filters.campus) {
      result = result.filter((p) => p.seller?.campus === filters.campus);
    }

    // Free Only
    if (filters.freeOnly) {
      result = result.filter((p) => p.price === 0);
    }

    // Sort
    switch (filters.sort) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [filters, searchQuery]);

  const clearFilters = () => {
    setFilters({ category: '', condition: '', sort: 'newest', priceMin: '', priceMax: '', campus: '', freeOnly: false });
  };

  const stats = [
    { icon: Users, label: 'Registered Students', value: '1,250+', color: 'indigo' },
    { icon: TrendingUp, label: 'Categories', value: CATEGORIES.length, color: 'purple' },
    { icon: Zap, label: 'Quick Deals', value: '24h', color: 'pink' },
    { icon: BadgeCheck, label: 'Students', value: 'Verified', color: 'emerald' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-16 lg:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="section-padding relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white/80 mb-6"
            >
              <Sparkles size={14} className="text-yellow-400" />
              Student-Only Marketplace
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Buy & Sell with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Campus Students
              </span>
            </h1>
            <p className="text-lg text-gray-300 mt-6 max-w-xl mx-auto">
              The trusted marketplace for university students. Trade textbooks, electronics, notes, and more — safely and privately.
            </p>

          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"
              >
                <stat.icon size={22} className="mx-auto mb-2 text-indigo-400" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Quick Access */}
      <section className="section-padding py-8 -mt-6 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/?category=${cat.id}`}
              onClick={() => setFilters({ ...filters, category: cat.id })}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all border shadow-sm
                ${filters.category === cat.id
                  ? 'gradient-bg text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-md'
                }`}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="section-padding pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {searchQuery ? `Results for "${searchQuery}"` : 'Latest Listings'}
          </h2>
        </div>

        <ProductFilters
          filters={filters}
          onFilterChange={setFilters}
          onClear={clearFilters}
          totalResults={filteredProducts.length}
        />

        <div className="mt-6">
          <ProductGrid products={filteredProducts} />
        </div>
      </section>
    </div>
  );
}
