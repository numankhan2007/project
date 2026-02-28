import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, KeyRound, Mail, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useNotifications } from '../../context/NotificationContext';
import otpService from '../../services/otpService';

export default function OTPModal({ isOpen, onClose, order, mode = 'generate' }) {
  const { success, error: showError } = useNotifications();
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOTP, setEnteredOTP] = useState(['', '', '', '']);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // ============================================================
  // SELLER: Initiate Delivery → Backend generates OTP & emails buyer
  // ============================================================

  const handleInitiateDelivery = async () => {
    setLoading(true);
    try {
      // Step 1: Generate OTP on the backend
      const genResponse = await otpService.generate(order.id);

      // Step 2: Send the OTP to buyer's email via backend
      await otpService.sendViaEmail(order.id, order.buyer?.email || order.buyer?.personalMailId);

      setOtpSent(true);
      success('✅ OTP generated and sent to buyer\'s email!');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to send OTP. Please try again.';
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SELLER: Enter OTP from Buyer → Verify via backend
  // ============================================================

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOTP = [...enteredOTP];
    newOTP[index] = value.slice(-1);
    setEnteredOTP(newOTP);

    if (value && index < 3) {
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
    try {
      await otpService.verify(order.id, code);
      setVerified(true);
      success('🎉 Delivery confirmed! Product has been marked as sold.');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid OTP. Please try again.';
      showError(msg);
      setEnteredOTP(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOtpSent(false);
    setVerified(false);
    setEnteredOTP(['', '', '', '']);
    onClose();
  };

  if (!order) return null;

  const titleMap = {
    generate: 'Initiate Delivery',
    verify: 'Verify Delivery',
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={titleMap[mode] || 'Delivery'} size="sm">
      <div className="space-y-5">

        {/* ============================================================ */}
        {/* MODE: GENERATE — Seller initiates delivery, OTP sent to buyer */}
        {/* ============================================================ */}
        {mode === 'generate' && (
          <>
            {!otpSent ? (
              <div className="text-center space-y-4 px-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Send size={24} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">Initiate Delivery</h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    A 4-digit verification code will be sent to the buyer's registered email.
                    The buyer will share this code with you after inspecting the product.
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ⚠️ Only initiate delivery when you are ready to meet the buyer in person.
                  </p>
                </div>
                <Button variant="primary" fullWidth loading={loading} onClick={handleInitiateDelivery} icon={Mail}>
                  Send OTP to Buyer's Email
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 px-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center"
                >
                  <CheckCircle size={24} className="text-emerald-500" />
                </motion.div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">OTP Sent via Email!</h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    The verification code has been sent to the buyer's registered email.
                    Meet the buyer, let them inspect the product, and ask them for the 4-digit code.
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3">
                  <p className="text-xs text-indigo-700 dark:text-indigo-400">
                    💡 Once you have the code, go to your Orders page and click <strong>"Enter OTP"</strong> to complete the transaction.
                  </p>
                </div>
                <Button variant="secondary" fullWidth onClick={handleClose}>
                  Done
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* MODE: VERIFY — Seller enters OTP from buyer to confirm */}
        {/* ============================================================ */}
        {mode === 'verify' && (
          <>
            {!verified ? (
              <div className="text-center space-y-4 px-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <KeyRound size={24} className="text-purple-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">Enter Buyer's OTP</h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Enter the 4-digit code the buyer shared with you after inspecting the product.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
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
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center bg-gray-100 dark:bg-gray-800 rounded-xl text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
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
                className="text-center space-y-4 py-4 px-2"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center"
                >
                  <CheckCircle size={36} className="text-emerald-500" />
                </motion.div>
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Delivery Confirmed!</h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  The product has been marked as sold. A confirmation email has been sent to you.
                </p>
                <Button variant="success" fullWidth onClick={handleClose}>
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
