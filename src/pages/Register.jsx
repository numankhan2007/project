import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, User, MapPin, ArrowRight, Mail, Phone, CreditCard } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { CAMPUSES } from '../constants';

export default function Register() {
  const { register } = useAuth();
  const { error: showError } = useNotifications();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentIdCard: '',
    studentId: '',
    username: '',
    email: '',
    phone: '',
    campus: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.studentIdCard.trim()) errs.studentIdCard = 'Student ID Card Number is required';
    if (!formData.studentId.trim()) errs.studentId = 'Student ID is required';
    if (!formData.username.trim()) errs.username = 'Username is required';
    else if (formData.username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) errs.phone = 'Enter a valid 10-digit Indian phone number';
    if (!formData.campus) errs.campus = 'Please select your campus';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      showError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative text-center text-white p-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-8"
          >
            🚀
          </motion.div>
          <h2 className="text-4xl font-bold mb-4">Join the Community</h2>
          <p className="text-white/80 text-lg max-w-sm mx-auto">
            Create your account and start trading with students on your campus today.
          </p>
          <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
            {['ID Card verified accounts', 'Email & Phone OTP verification', 'Secure OTP delivery', 'Campus-wide marketplace'].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-white/80"
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                <span className="text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap size={22} className="text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">UNIMART</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Verify with your Student ID Card to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Primary Verification - Student ID Card Number */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800/30">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1">
                <CreditCard size={14} /> Primary Verification
              </p>
              <Input
                label="Student ID Card Number"
                name="studentIdCard"
                placeholder="Enter your college ID card number"
                value={formData.studentIdCard}
                onChange={(e) => updateField('studentIdCard', e.target.value)}
                error={errors.studentIdCard}
                icon={CreditCard}
                required
              />
            </div>

            <Input
              label="Student ID"
              name="studentId"
              placeholder="e.g. STU2024001"
              value={formData.studentId}
              onChange={(e) => updateField('studentId', e.target.value)}
              error={errors.studentId}
              icon={GraduationCap}
              required
            />
            <Input
              label="Username"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
              error={errors.username}
              icon={User}
              required
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="your.email@college.edu"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
              icon={Mail}
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              error={errors.phone}
              icon={Phone}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Campus <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={formData.campus}
                  onChange={(e) => updateField('campus', e.target.value)}
                  className="input-field pl-10 appearance-none"
                >
                  <option value="">Select your campus</option>
                  {CAMPUSES.map((campus) => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
              </div>
              {errors.campus && <p className="text-sm text-rose-500">⚠ {errors.campus}</p>}
            </div>
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              error={errors.password}
              icon={Lock}
              required
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              icon={Lock}
              required
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} icon={ArrowRight} iconPosition="right">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
