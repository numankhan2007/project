import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center px-6 max-w-2xl"
      >
        {/* Logo / Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <span className="text-6xl sm:text-7xl font-extrabold gradient-text tracking-tight">
            🎓 UNIMART
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl text-gray-300 mb-4 leading-relaxed"
        >
          The <span className="text-indigo-400 font-semibold">Secure Student-to-Student</span> Marketplace
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-gray-400 mb-12 max-w-lg mx-auto"
        >
          Buy and sell textbooks, electronics, notes, and more — exclusively within your university community. 
          Verified students only. Safe transactions with OTP-secured deliveries.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/login')}
            className="btn-primary text-lg px-10 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
          >
            🔐 USER LOGIN
          </button>

          <button
            onClick={() => navigate('/admin-login')}
            className="btn-secondary text-lg px-10 py-4 rounded-2xl border-gray-600 text-gray-200 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
          >
            ⚙️ ADMIN LOGIN
          </button>
        </motion.div>

        {/* Features row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
        >
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-2xl mb-2 block">✅</span>
            <span className="text-gray-300 text-sm font-medium">Verified Students Only</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-2xl mb-2 block">🔒</span>
            <span className="text-gray-300 text-sm font-medium">OTP-Secured Deliveries</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <span className="text-2xl mb-2 block">💬</span>
            <span className="text-gray-300 text-sm font-medium">In-App Chat</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 text-gray-500 text-xs"
      >
        © 2024 Unimart — Built for students, by students.
      </motion.p>
    </div>
  );
}
