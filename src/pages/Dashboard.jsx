import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, Calendar, ShoppingCart, Package, BadgeCheck, Pencil, Camera, Mail, Phone, GraduationCap, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import HistoryTabs from '../components/dashboard/HistoryTabs';
import BuyHistory from '../components/dashboard/BuyHistory';
import SellHistory from '../components/dashboard/SellHistory';
import MyProducts from '../components/dashboard/MyProducts';
import OTPModal from '../components/order/OTPModal';
import Badge from '../components/common/Badge';
import { getInitials, formatDate } from '../utils/helpers';

export default function Dashboard() {
  const { user, updateProfile } = useAuth();
  const { getOrdersByBuyer, getOrdersBySeller } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'buy');
  const [otpModal, setOtpModal] = useState({ open: false, order: null, mode: 'buyer' });

  // Edit username
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');

  // Profile picture
  const fileInputRef = useRef(null);

  const buyOrders = getOrdersByBuyer(user?.username);
  const sellOrders = getOrdersBySeller(user?.username);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveUsername = () => {
    if (newUsername.trim() && newUsername.trim().length >= 3) {
      updateProfile({ username: newUsername.trim() });
      setEditingUsername(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="section-padding page-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Profile Header */}
        <div className="card p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar with upload */}
            <div className="relative group">
              <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/20 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.username || 'U')
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              {/* Username with edit and verified badge */}
              <div className="flex items-center gap-2">
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="text-xl font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button onClick={handleSaveUsername} className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 transition-colors">
                      <Check size={16} />
                    </button>
                    <button onClick={() => { setEditingUsername(false); setNewUsername(user?.username); }} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.username}</h1>
                    {user?.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        <BadgeCheck size={14} />
                        Verified
                      </span>
                    )}
                    <button onClick={() => setEditingUsername(true)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-all">
                      <Pencil size={14} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <GraduationCap size={14} />
                  {user?.university}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {user?.college}
                </span>
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {user?.department}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Joined {formatDate(user?.createdAt)}
                </span>
              </div>

              {/* Contact & ID Info */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                {user?.email && (
                  <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    <Mail size={12} className="text-gray-400" />
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    <Phone size={12} className="text-gray-400" />
                    +91 {user.phone}
                  </span>
                )}
                {user?.studentId && (
                  <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                    <GraduationCap size={12} className="text-gray-400" />
                    {user.studentId}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Badge color="indigo">{user?.studentId}</Badge>
              </div>
            </div>
          </div>

          {/* Stats - 2 column now (removed 100% verified) */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-2">
                <ShoppingCart size={18} className="text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{buyOrders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Purchases</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-2">
                <Package size={18} className="text-purple-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{sellOrders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sales</p>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <HistoryTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            buyCount={buyOrders.length}
            sellCount={sellOrders.length}
          />
          <div className="mt-4">
            {activeTab === 'buy' ? (
              <BuyHistory
                orders={buyOrders}
                onGenerateOTP={(order) => setOtpModal({ open: true, order, mode: 'buyer' })}
              />
            ) : activeTab === 'sell' ? (
              <SellHistory
                orders={sellOrders}
                onVerifyOTP={(order) => setOtpModal({ open: true, order, mode: 'seller' })}
              />
            ) : (
              <MyProducts />
            )}
          </div>
        </div>
      </motion.div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ open: false, order: null, mode: 'buyer' })}
        order={otpModal.order}
        mode={otpModal.mode}
      />
    </div>
  );
}
