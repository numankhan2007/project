import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Lock, User, MapPin, ArrowRight, Mail, Phone, ShieldCheck, RotateCcw } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { CAMPUSES } from '../constants';
import { TAMILNADU_UNIVERSITIES } from '../constants/universities';

export default function Register() {
  const { register } = useAuth();
  const { error: showError, success: showSuccess } = useNotifications();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '',
    username: '',
    email: '',
    phone: '',
    university: '',
    college: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // OTP State
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP selection & verification
  const [otpMethod, setOtpMethod] = useState(''); // '' | 'phone' | 'email'
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpSending, setOtpSending] = useState(false);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const validateForm = () => {
    const errs = {};
    if (!formData.studentId.trim()) errs.studentId = 'Student ID Number is required';
    if (!formData.username.trim()) errs.username = 'Username is required';
    else if (formData.username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) errs.phone = 'Enter a valid 10-digit Indian phone number';
    if (!formData.university) errs.university = 'Please select your university';
    if (!formData.college) errs.college = 'Please select your college';
    if (!formData.department) errs.department = 'Please select your department';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) errs.agreeTerms = 'You must agree to the Terms & Conditions';
    return errs;
  };

  const generateOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  const handleProceedToVerify = (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep(2);
    setOtpSent(false); // Reset to selection screen
    setEnteredOtp('');
    setOtpError('');
  };

  const handleSendOtpCode = async (method) => {
    setOtpMethod(method);
    setOtpSending(true);
    // Simulate sending OTP (mock delay)
    await new Promise((r) => setTimeout(r, 1000));
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setOtpTimer(60);
    setEnteredOtp('');
    setOtpError('');
    setOtpSent(true);
    setOtpSending(false);
    
    const destination = method === 'phone' ? `+91 ${formData.phone}` : formData.email;
    showSuccess(`📱 Your OTP is: ${otp} (sent to ${destination})`);
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setOtpSending(true);
    await new Promise((r) => setTimeout(r, 800));
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setOtpTimer(60);
    setEnteredOtp('');
    setOtpError('');
    setOtpSending(false);
    
    const destination = otpMethod === 'phone' ? `+91 ${formData.phone}` : formData.email;
    showSuccess(`📱 New OTP: ${otp} (resent to ${destination})`);
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!enteredOtp.trim()) {
      setOtpError('Please enter the OTP');
      return;
    }
    if (enteredOtp !== generatedOtp) {
      setOtpError('Invalid OTP. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      showSuccess('🎉 Account created successfully!');
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

  const handleUniversityChange = (e) => {
    const university = e.target.value;
    setFormData({
      ...formData,
      university,
      college: '',
      department: ''
    });
    setErrors({ ...errors, university: '', college: '', department: '' });
  };

  const handleCollegeChange = (e) => {
    const college = e.target.value;
    setFormData({
      ...formData,
      college,
      department: ''
    });
    setErrors({ ...errors, college: '', department: '' });
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
            {['ID Number verified accounts', 'Phone OTP verification', 'Secure OTP delivery', 'Campus-wide marketplace'].map((feature, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {step === 1 ? 'Create Account' : 'Verify OTP'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {step === 1
                ? 'Verify with your Student ID Number to get started'
                : !otpSent 
                  ? 'Choose how you want to receive your OTP'
                  : `Enter the 6-digit OTP sent to ${otpMethod === 'phone' ? '+91 ' + formData.phone : formData.email}`
              }
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              step === 1 ? 'gradient-bg text-white' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {step === 1 ? '1' : '✓'} Details
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full gradient-bg"
                initial={{ width: '0%' }}
                animate={{ width: step === 2 ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              step === 2 ? 'gradient-bg text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              2 OTP
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* ═══════════ STEP 1: Registration Form ═══════════ */
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleProceedToVerify}
                className="space-y-3.5"
              >
                {/* Primary Verification - Student ID Number */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800/30">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1">
                    <GraduationCap size={14} /> Primary Verification
                  </p>
                  <Input
                    label="Student ID Number"
                    name="studentId"
                    placeholder="e.g. STU2024001"
                    value={formData.studentId}
                    onChange={(e) => updateField('studentId', e.target.value)}
                    error={errors.studentId}
                    icon={GraduationCap}
                    required
                  />
                </div>
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
                  placeholder="your.email@gmail.com"
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
                    University <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={formData.university}
                      onChange={handleUniversityChange}
                      className="input-field pl-10 appearance-none"
                    >
                      <option value="">Select your university</option>
                      {Object.keys(TAMILNADU_UNIVERSITIES).map((uni) => (
                        <option key={uni} value={uni}>{uni}</option>
                      ))}
                    </select>
                  </div>
                  {errors.university && <p className="text-sm text-rose-500">⚠ {errors.university}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    College / Campus <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={formData.college}
                      onChange={handleCollegeChange}
                      disabled={!formData.university}
                      className="input-field pl-10 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select your college</option>
                      {formData.university && Object.keys(TAMILNADU_UNIVERSITIES[formData.university] || {}).map((college) => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </div>
                  {errors.college && <p className="text-sm text-rose-500">⚠ {errors.college}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={formData.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      disabled={!formData.college}
                      className="input-field pl-10 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select your department</option>
                      {formData.university && formData.college && 
                        (TAMILNADU_UNIVERSITIES[formData.university]?.[formData.college] || []).map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  {errors.department && <p className="text-sm text-rose-500">⚠ {errors.department}</p>}
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

                {/* Terms & Conditions */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => { setAgreeTerms(e.target.checked); setErrors({ ...errors, agreeTerms: '' }); }}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      I agree to the{' '}
                      <Link to="/terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        Terms & Conditions
                      </Link>
                      {' '}and understand the prohibited items policy.
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-sm text-rose-500 ml-7">⚠ {errors.agreeTerms}</p>}
                </div>

                <Button type="submit" variant="primary" size="lg" fullWidth icon={ArrowRight} iconPosition="right">
                  Continue Verification
                </Button>
              </motion.form>
            ) : (
              /* ═══════════ STEP 2: OTP Verification ═══════════ */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                {!otpSent ? (
                  /* --- Sub-step: Choose Method --- */
                  <div className="space-y-4">
                     <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                       We need to verify your account. Please select where you would like to receive your One-Time Password (OTP).
                     </p>
                    <button
                      onClick={() => handleSendOtpCode('phone')}
                      disabled={otpSending}
                      className="w-full relative group p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left flex items-center gap-4 shadow-sm hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Phone size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Via SMS</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">+91 {formData.phone}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSendOtpCode('email')}
                      disabled={otpSending}
                      className="w-full relative group p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left flex items-center gap-4 shadow-sm hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Mail size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Via Email</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setStep(1)}
                      className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mt-4"
                    >
                      ← Back to details
                    </button>
                  </div>
                ) : (
                  /* --- Sub-step: Verify OTP --- */
                  <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                    {/* OTP Info Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/30">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">OTP Sent Successfully</p>
                      </div>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                        A 6-digit verification code has been sent to <strong>{otpMethod === 'phone' ? `+91 ${formData.phone}` : formData.email}</strong>. 
                        Check your {otpMethod === 'phone' ? 'messages' : 'inbox'} for your OTP.
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enter 6-digit OTP <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2 justify-center">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={enteredOtp[i] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/, '');
                              const newOtp = enteredOtp.split('');
                              newOtp[i] = val;
                              setEnteredOtp(newOtp.join(''));
                              setOtpError('');
                              // Auto-focus next input
                              if (val && i < 5) {
                                document.getElementById(`otp-${i + 1}`)?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !enteredOtp[i] && i > 0) {
                                document.getElementById(`otp-${i - 1}`)?.focus();
                              }
                            }}
                            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                              ${otpError
                                ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/10'
                                : enteredOtp[i]
                                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                              } text-gray-900 dark:text-white`}
                            autoFocus={i === 0}
                          />
                        ))}
                      </div>
                      {otpError && (
                        <p className="text-sm text-rose-500 text-center">⚠ {otpError}</p>
                      )}
                    </div>

                    {/* Timer & Resend */}
                    <div className="flex items-center justify-center gap-2 text-sm">
                      {otpTimer > 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                          Resend OTP in <span className="font-bold text-indigo-600 dark:text-indigo-400">{otpTimer}s</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={otpSending}
                          className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline disabled:opacity-50"
                        >
                          <RotateCcw size={14} />
                          Resend OTP
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} icon={ShieldCheck}>
                        Verify & Create Account
                      </Button>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setEnteredOtp(''); setOtpError(''); }}
                        className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      >
                        ← Change verification method
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
