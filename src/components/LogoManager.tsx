import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Sparkles,
  Camera,
  Eye,
  AlertCircle,
  FileCheck,
  Trash2,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { processLogoFile } from '../utils/imageCompressor';
import { getInitialLogoSync } from '../utils/branding';

interface LogoManagerProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const LogoManager: React.FC<LogoManagerProps> = ({ onClose, isModal = false }) => {
  const { customLogo, activeLogo, updateLogo, resetLogo, isAdminLoggedIn, loginAdmin } = useStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(activeLogo || getInitialLogoSync());
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sync preview when activeLogo changes in store
  React.useEffect(() => {
    if (activeLogo) {
      setPreviewSrc(activeLogo);
    }
  }, [activeLogo]);

  // Quick unlock for non-logged-in admin
  const [adminPinAttempt, setAdminPinAttempt] = useState('');
  const [pinUnlockError, setPinUnlockError] = useState(false);

  const handleAdminUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await loginAdmin(adminPinAttempt);
    if (success) {
      setPinUnlockError(false);
      setAdminPinAttempt('');
      setMessage({
        type: 'success',
        text: 'Admin identity verified! Ab aap logo upload kar sakte hain.',
      });
    } else {
      setPinUnlockError(true);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!isAdminLoggedIn) {
      setMessage({
        type: 'error',
        text: 'Access Denied: Logo badalne ke liye Admin login (PIN verification) anivarya hai.',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: 'Kripya ek valid photo/image file chunein (JPG, PNG, WEBP, SVG)',
      });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const dataUrl = await processLogoFile(file);
      setPreviewSrc(dataUrl);
      const success = updateLogo(dataUrl);
      if (success) {
        setMessage({
          type: 'success',
          text: 'Aapka photo logo successfully set ho gaya hai! Puri website par turant update ho chuka hai.',
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Admin permission required. Kripya Admin PIN se login karein.',
        });
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setMessage({
        type: 'error',
        text: 'Photo process karne me samasya aayi. Kripya koi dusri photo upload karein.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn) {
      setMessage({
        type: 'error',
        text: 'Access Denied: Logo badalne ke liye Admin login anivarya hai.',
      });
      return;
    }

    if (!urlInput.trim()) return;

    setIsProcessing(true);
    const trimmed = urlInput.trim();
    setPreviewSrc(trimmed);
    const success = updateLogo(trimmed);
    setUrlInput('');
    setIsProcessing(false);
    if (success) {
      setMessage({
        type: 'success',
        text: 'Image link se logo successfully set ho gaya hai!',
      });
    } else {
      setMessage({
        type: 'error',
        text: 'Logo update failed: Admin permission required.',
      });
    }
  };

  const handleResetToDefault = () => {
    if (!isAdminLoggedIn) {
      setMessage({
        type: 'error',
        text: 'Access Denied: Logo reset karne ke liye Admin login anivarya hai.',
      });
      return;
    }

    resetLogo();
    setPreviewSrc(getInitialLogoSync());
    setMessage({
      type: 'info',
      text: 'Original VC MART official logo restore kar diya gaya hai.',
    });
  };

  const content = (
    <div className="space-y-6">
      {/* Status banner with Admin Security Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#965215]/10 text-[#965215] flex items-center justify-center">
            <Camera size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">Custom Logo Uploader</h3>
              {customLogo ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Custom Logo Active
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Official VC MART Logo
                </span>
              )}
              {isAdminLoggedIn ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                  <ShieldCheck size={11} /> Admin Verified
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <Lock size={11} /> Admin Only Access
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Logo badalna sirf store Admin ke liye surakshit (protected) hai.
            </p>
          </div>
        </div>

        {customLogo && isAdminLoggedIn && (
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            Original Logo Restore Karein
          </button>
        )}
      </div>

      {/* If NOT Admin logged in, show PIN unlock gate */}
      {!isAdminLoggedIn && (
        <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-300/90 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Lock size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-stone-900">
                Admin Authentication Anivarya Hai
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Keval authorised store owner / admin hi website ka logo badal sakte hain. Kripya apna Admin PIN enter karein:
              </p>

              <form onSubmit={handleAdminUnlock} className="mt-3 flex flex-wrap sm:flex-nowrap gap-2 max-w-sm">
                <input
                  type="password"
                  placeholder="Enter 4-Digit Admin PIN"
                  maxLength={6}
                  value={adminPinAttempt}
                  onChange={(e) => {
                    setAdminPinAttempt(e.target.value);
                    setPinUnlockError(false);
                  }}
                  className="flex-1 px-3 py-2 text-xs border border-amber-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#965215]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#965215] hover:bg-[#7D4311] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Verify & Unlock
                </button>
              </form>

              {pinUnlockError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1.5">
                  Galat PIN! Kripya sahi Admin PIN enter karein (Default: 9355).
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : message.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <FileCheck size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-stone-400 hover:text-stone-700 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main 2-column layout: Upload area vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Upload Options (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Direct File Dropzone */}
          <div
            onDragOver={isAdminLoggedIn ? handleDragOver : undefined}
            onDragLeave={isAdminLoggedIn ? handleDragLeave : undefined}
            onDrop={isAdminLoggedIn ? handleDrop : undefined}
            onClick={() => {
              if (isAdminLoggedIn) {
                fileInputRef.current?.click();
              } else {
                setMessage({
                  type: 'error',
                  text: 'Pehle upar apna Admin PIN daal kar Unlock karein.',
                });
              }
            }}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              !isAdminLoggedIn
                ? 'border-stone-200 bg-stone-50/70 opacity-60 cursor-not-allowed'
                : dragActive
                ? 'border-[#965215] bg-[#965215]/5 scale-[1.01] cursor-pointer'
                : 'border-stone-300 hover:border-[#965215] bg-white hover:bg-amber-50/20 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              disabled={!isAdminLoggedIn}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#965215]/10 text-[#965215] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload size={26} />
            </div>

            <h4 className="text-sm font-bold text-stone-900 mb-1">
              {isProcessing ? 'Photo Process ho rahi hai...' : 'Photo ya Document Upload Karein'}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-3">
              Click karke gallery / folder se chunein ya yahan drag & drop karein.
              (JPG, PNG, WEBP, SVG supported)
            </p>

            <button
              type="button"
              disabled={isProcessing || !isAdminLoggedIn}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isAdminLoggedIn
                  ? 'bg-[#965215] text-white hover:bg-[#7D4311] cursor-pointer'
                  : 'bg-stone-300 text-stone-600 cursor-not-allowed'
              }`}
            >
              <Camera size={14} />
              <span>{isProcessing ? 'Saving...' : isAdminLoggedIn ? 'Browse Documents / Photos' : 'Locked (Enter PIN Above)'}</span>
            </button>
          </div>

          {/* Alternative: Image URL */}
          <div className={`p-4 rounded-2xl bg-white border border-stone-200 transition-opacity ${!isAdminLoggedIn ? 'opacity-60' : ''}`}>
            <h5 className="text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-[#965215]" />
              Ya Image Link (URL) se lgana chahte hain:
            </h5>
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                disabled={!isAdminLoggedIn}
                placeholder={isAdminLoggedIn ? "https://example.com/my-logo.png" : "Admin unlock required"}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#965215] disabled:bg-stone-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!isAdminLoggedIn}
                className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed shrink-0"
              >
                Apply Link
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Live Interactive Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Eye size={14} className="text-[#965215]" />
                Live Preview
              </span>
              <span className="text-[10px] text-stone-400 font-medium">Automatic scale</span>
            </div>

            {/* Preview 1: In Light Header bar */}
            <div>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                1. Light Header (Store Navigation)
              </span>
              <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] p-0.5 border border-[#E8DEC8] overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={previewSrc || activeLogo || ''}
                      alt="Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-['Marcellus'] font-bold text-sm text-[#3E1D0C]">
                        VC MART
                      </span>
                      <span className="text-[8px] font-bold px-1 rounded bg-[#965215]/10 text-[#965215]">
                        OFFICIAL
                      </span>
                    </div>
                    <span className="text-[8px] text-stone-500 tracking-wider block">
                      YOUR TRUST • OUR QUALITY
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Visible
                </span>
              </div>
            </div>

            {/* Preview 2: In Dark Footer */}
            <div>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                2. Dark Theme (Footer / Mobile Header)
              </span>
              <div className="p-3 rounded-xl bg-[#2A160C] text-white flex items-center justify-between border border-[#3E2519]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] p-0.5 border border-[#DFB062]/40 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={previewSrc || activeLogo || ''}
                      alt="Logo Dark Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-['Marcellus'] font-bold text-xs text-amber-100 block">
                      VC MART
                    </span>
                    <span className="text-[8px] text-[#D89B47] tracking-wider block">
                      YOUR TRUST • OUR QUALITY
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-amber-300 bg-[#3E2519] px-2 py-0.5 rounded-full">
                  Dark Mode
                </span>
              </div>
            </div>

            {/* Preview 3: Isolated Emblem Icon */}
            <div>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                3. Icon / Emblem Only (Mobile View)
              </span>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E8DEC8] p-1 flex items-center justify-center shadow-xs">
                  <img
                    src={previewSrc || activeLogo || ''}
                    alt="Logo Icon Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs text-stone-600">
                  <p className="font-bold text-stone-800">Compact Icon</p>
                  <p className="text-[11px] text-stone-500">
                    Mobile header aur popups me yahi icon dikhega.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#965215]" />
              <h2 className="text-lg font-bold font-['Marcellus'] text-stone-900">
                Change Store Logo (Photo / Document)
              </h2>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {content}

          <div className="mt-6 pt-4 border-t border-stone-200 flex justify-end gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Done / Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return content;
};
