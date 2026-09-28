import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Logo } from './Logo';
import { PRIMARY_ADMIN_EMAIL, isAuthorizedAdminEmail, ShoppingMode } from '../types';
import { resetCustomerPassword } from '../lib/firebaseRepository';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalReason,
    authModalInitialTab,
    loginCustomer,
    registerCustomer,
    loginAdminWithEmail,
    cartCount,
    shoppingMode,
    setShoppingMode,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'admin'>(
    authModalInitialTab === 'admin' ? 'admin' : 'signin'
  );

  // Selected Shopping Mode for Customer Session
  const [selectedShoppingMode, setSelectedShoppingMode] = useState<ShoppingMode>(shoppingMode || 'retail');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPincode, setRegPincode] = useState('');

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState(PRIMARY_ADMIN_EMAIL);
  const [adminPin, setAdminPin] = useState('');

  // The dialog remains mounted while closed. Sync its visible tab when a caller
  // explicitly requests the secure owner/admin sign-in flow.
  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalInitialTab === 'admin' ? 'admin' : 'signin');
    }
  }, [authModalInitialTab, isAuthModalOpen]);

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAuthModalOpen(false);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = signInEmail.trim().toLowerCase();
    if (!emailClean || !/^\S+@\S+\.\S+$/.test(emailClean)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Customer sign in with selected Shopping Mode
    const res = await loginCustomer(
      emailClean,
      signInPassword,
      undefined,
      undefined,
      selectedShoppingMode
    );
    if (!res.success) {
      setErrorMessage(res.message || 'Unable to sign in.');
    }
  };

  const handlePasswordReset = async () => {
    const email = signInEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Enter your account email first to receive a password reset link.');
      return;
    }
    setErrorMessage(null);
    try {
      await resetCustomerPassword(email);
      setSuccessMessage('Password reset link sent. Check your email inbox.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send password reset email.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = regEmail.trim().toLowerCase();
    if (!regFullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regMobile.trim() || regMobile.replace(/[^0-9]/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!emailClean || !/^\S+@\S+\.\S+$/.test(emailClean)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const res = await registerCustomer({
      fullName: regFullName,
      email: emailClean,
      mobile: regMobile,
      password: regPassword,
      address: regAddress,
      city: regCity,
      state: regState,
      pincode: regPincode,
      mode: selectedShoppingMode,
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Registration failed.');
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = adminEmail.trim().toLowerCase();
    if (!isAuthorizedAdminEmail(emailClean)) {
      setErrorMessage(
        `Access Denied: Administrative rights are strictly restricted to ${PRIMARY_ADMIN_EMAIL}.`
      );
      return;
    }

    const res = await loginAdminWithEmail(emailClean, adminPin);
    if (!res.success) {
      setErrorMessage(res.message || 'Admin authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8DEC8] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="bg-[#FAF7F2] p-6 pb-4 border-b border-[#E8DEC8] text-center">
          <div className="flex justify-center mb-2">
            <Logo size="md" variant="image-only" />
          </div>
          <h2 className="text-xl font-bold font-['Marcellus'] text-stone-900">
            {activeTab === 'admin'
              ? 'Owner Security Clearance'
              : activeTab === 'register'
              ? 'Create Customer Account'
              : 'Customer Sign In'}
          </h2>

          {/* Checkout notification message if triggered during purchase */}
          {authModalReason ? (
            <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-[#7A3F0E] font-medium flex items-center gap-2">
              <ShoppingBag size={15} className="shrink-0 text-[#965215]" />
              <span>{authModalReason}</span>
            </div>
          ) : (
            <p className="text-xs text-stone-500 mt-1">
              {activeTab === 'admin'
                ? 'Store management login for authorized administrator only.'
                : 'Sign in to complete your checkout and track your delivery.'}
            </p>
          )}

          {/* Tab Switcher (Customer vs Register) */}
          {activeTab !== 'admin' && (
            <div className="mt-4 grid grid-cols-2 p-1 bg-stone-200/70 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white text-[#965215] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-[#965215] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                New Customer? Register
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Customer Sign In */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              {/* Shopping Mode Selector (Retail vs Wholesale) */}
              <div className="p-3 bg-[#FAF7F2] border border-[#E8DEC8] rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800">
                    Select Shopping Mode *
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">Switch anytime</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedShoppingMode('retail')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedShoppingMode === 'retail'
                        ? 'bg-white border-[#965215] shadow-xs ring-2 ring-[#965215]/20'
                        : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">A. RETAIL</span>
                      {selectedShoppingMode === 'retail' && (
                        <span className="w-2 h-2 rounded-full bg-[#965215]" />
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      Individual pieces & regular retail pricing
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedShoppingMode('wholesale')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedShoppingMode === 'wholesale'
                        ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-600/20'
                        : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-900">B. WHOLESALE</span>
                      {selectedShoppingMode === 'wholesale' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      Complete set system (min 1 set) & wholesale rates
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 transition-all outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="password"
                    placeholder="Enter password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 transition-all outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer mt-4"
              >
                <span>SIGN IN & CONTINUE</span>
                <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => void handlePasswordReset()} className="w-full text-xs font-semibold text-[#965215] hover:underline">
                Forgot password?
              </button>

            </form>
          )}

          {/* TAB 2: Customer Register */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Shopping Mode Selector (Retail vs Wholesale) */}
              <div className="p-3 bg-[#FAF7F2] border border-[#E8DEC8] rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800">
                    Select Account Shopping Mode *
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">Switch anytime</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedShoppingMode('retail')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedShoppingMode === 'retail'
                        ? 'bg-white border-[#965215] shadow-xs ring-2 ring-[#965215]/20'
                        : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">A. RETAIL</span>
                      {selectedShoppingMode === 'retail' && (
                        <span className="w-2 h-2 rounded-full bg-[#965215]" />
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      Individual pieces & regular retail pricing
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedShoppingMode('wholesale')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedShoppingMode === 'wholesale'
                        ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-600/20'
                        : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-900">B. WHOLESALE</span>
                      {selectedShoppingMode === 'wholesale' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      Complete set system (min 1 set) & wholesale rates
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 transition-all outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 transition-all outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  PASSWORD *
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    id="register-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Enter password (minimum 6 characters)"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (e.target.value.length >= 6 && errorMessage === 'Password must contain at least 6 characters.') {
                        setErrorMessage(null);
                      }
                    }}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 transition-all outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 cursor-pointer"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Delivery Address (Optional)
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-3 text-stone-400"
                  />
                  <textarea
                    rows={2}
                    placeholder="House/Street, Landmark"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] focus:ring-2 focus:ring-[#B47226]/20 transition-all outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="State"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] outline-hidden"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="City"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] outline-hidden"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="PIN Code"
                    value={regPincode}
                    onChange={(e) => setRegPincode(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-[#965215] outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#965215] hover:bg-[#7A3F0E] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer mt-3"
              >
                <span>CREATE ACCOUNT & PROCEED</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* TAB 3: Store Owner Administration Login */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-[#7A3F0E]">
                <ShieldCheck size={18} className="text-[#965215] shrink-0 mt-0.5" />
                <span>
                  Admin clearance is restricted exclusively to <strong>{PRIMARY_ADMIN_EMAIL}</strong>.
                  Customer accounts cannot access store management controls.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Authorized Owner Email *
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:bg-white focus:border-[#965215] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Firebase Account Password *
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Enter Firebase password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono tracking-widest text-stone-900 focus:bg-white focus:border-[#965215] outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#2A1810] hover:bg-black text-[#DFB062] rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>VERIFY OWNER CREDENTIALS</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  Return to Customer Sign In
                </button>
              </div>
            </form>
          )}

          {/* Discreet Footer Link for Owner Login */}
          {activeTab !== 'admin' && (
            <div className="mt-6 pt-4 border-t border-stone-200 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setErrorMessage(null);
                }}
                className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <ShieldCheck size={13} />
                <span>Store Owner & Staff Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
