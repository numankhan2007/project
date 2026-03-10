import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Send, CheckCircle, KeyRound } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useOrders } from '../../context/OrderContext';
import { useNotifications } from '../../context/NotificationContext';

export default function OTPModal({ isOpen, onClose, order, mode = 'buyer' }) {
  const { generateOrderOTP, verifyOTP } = useOrders();
  const { success, error: showError } = useNotifications();
  const [otp, setOtp] = useState(order?.otp || '');
  const [enteredOTP, setEnteredOTP] = useState(['', '', '', '', '', '']);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleGenerateOTP = () => {
    const newOTP = generateOrderOTP(order.id);
    setOtp(newOTP);
    success('OTP generated successfully! Share it with the seller upon delivery.');
  };

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(otp);
    success('OTP copied to clipboard!');
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOTP = [...enteredOTP];
    newOTP[index] = value.slice(-1);
    setEnteredOTP(newOTP);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !enteredOTP[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    const code = enteredOTP.join('');
    await new Promise((r) => setTimeout(r, 800));
    const result = verifyOTP(order.id, code);
    setLoading(false);

    if (result) {
      setVerified(true);
      success('🎉 Delivery confirmed! Product has been marked as sold.');
    } else {
      showError('Invalid OTP. Please try again.');
      setEnteredOTP(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'buyer' ? 'Generate OTP' : 'Verify Delivery'} size="sm">
      <div className="space-y-6">
        {mode === 'buyer' ? (
          <>
            {/* Buyer: Generate OTP */}
            {!otp ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <KeyRound size={28} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Generate Delivery OTP</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Create a 6-digit OTP and share it with the seller when you receive the product.
                  </p>
                </div>
                <Button variant="primary" fullWidth onClick={handleGenerateOTP}>
                  Generate OTP
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center"
                >
                  <CheckCircle size={28} className="text-emerald-500" />
                </motion.div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Your OTP</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share this code with the seller upon delivery</p>
                </div>
                <div className="flex items-center justify-center gap-2 py-4">
                  {otp.split('').map((digit, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-11 h-14 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-2xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                    >
                      {digit}
                    </motion.span>
                  ))}
                </div>
                <Button variant="secondary" fullWidth onClick={handleCopyOTP} icon={Copy}>
                  Copy OTP
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Seller: Verify OTP */}
            {!verified ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <KeyRound size={28} className="text-purple-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Enter Delivery OTP</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Enter the 6-digit OTP provided by the buyer to confirm delivery.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 py-2">
                  {enteredOTP.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-11 h-14 text-center bg-gray-100 dark:bg-gray-800 rounded-xl text-2xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                  ))}
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  loading={loading}
                  onClick={handleVerifyOTP}
                  disabled={enteredOTP.some((d) => !d)}
                >
                  Verify & Confirm Delivery
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center"
                >
                  <CheckCircle size={40} className="text-emerald-500" />
                </motion.div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Delivery Confirmed!</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  The product has been marked as sold and moved to your sell history.
                </p>
                <Button variant="success" fullWidth onClick={onClose}>
                  Done
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
