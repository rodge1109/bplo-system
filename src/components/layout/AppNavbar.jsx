import React, { useState } from 'react';
import { 
  LogOut, 
  User, 
  Building2, 
  ShieldCheck, 
  Search, 
  Menu, 
  X, 
  Smartphone, 
  QrCode, 
  ExternalLink,
  ChevronDown,
  Info,
  HelpCircle,
  Lock,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { TENANTS } from '../../constants/tenants';

export default function AppNavbar({
  activeTenant,
  selectedTenantCode,
  onTenantChange,
  currentUser,
  onLogout,
  onOpenLogin,
  onOpenTracker,
  isTrackerActive = false,
  viewMode = 'applicant',
  onToggleViewMode,
  onQuickStaffLogin
}) {
  const currentTenant = activeTenant || TENANTS.find(t => t.code === selectedTenantCode) || TENANTS[0];
  
  // Navigation Modals
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-white border-b border-slate-150 sticky top-0 z-50 select-none font-['Poppins',sans-serif] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] sm:h-[72px] flex items-center justify-between">
          
          {/* Left: Brand Logo (eGov PH style matching sample) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (isTrackerActive && onOpenTracker) onOpenTracker();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 focus:outline-none cursor-pointer group shrink-0"
              title="eGov PH - Republic of the Philippines"
            >
              {/* eGovPH Typographic Vector Logo */}
              <div className="flex items-center text-xl sm:text-2xl font-black text-[#005CE6] tracking-tight">
                <span>eG</span>
                
                {/* Official Philippine Roundel Emblem for 'O' */}
                <div className="mx-0.5 relative w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] rounded-full overflow-hidden shadow-2xs border border-blue-200/60 inline-flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 28 28" className="w-full h-full">
                    <defs>
                      <clipPath id="ph-roundel-clip">
                        <circle cx="14" cy="14" r="14" />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#ph-roundel-clip)">
                      {/* Royal Blue Top Half */}
                      <rect x="0" y="0" width="28" height="14" fill="#0038A8" />
                      {/* Scarlet Red Bottom Half */}
                      <rect x="0" y="14" width="28" height="14" fill="#CE1126" />
                      {/* White Chevron on Left */}
                      <polygon points="0,0 15,14 0,28" fill="#FFFFFF" />
                      {/* Golden Sun */}
                      <circle cx="5.5" cy="14" r="3" fill="#FCD116" stroke="#E5B20D" strokeWidth="0.5" />
                      {/* Sun Rays */}
                      <line x1="5.5" y1="9.5" x2="5.5" y2="8" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      <line x1="5.5" y1="18.5" x2="5.5" y2="20" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      <line x1="1" y1="14" x2="2.5" y2="14" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      <line x1="10" y1="14" x2="8.5" y2="14" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      <line x1="2.3" y1="10.8" x2="3.4" y2="11.9" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      <line x1="8.7" y1="17.2" x2="7.6" y2="16.1" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      <line x1="2.3" y1="17.2" x2="3.4" y2="16.1" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      <line x1="8.7" y1="10.8" x2="7.6" y2="11.9" stroke="#FCD116" strokeWidth="1" strokeLinecap="round" />
                      {/* 3 Yellow Stars */}
                      <circle cx="2" cy="4.5" r="0.8" fill="#FCD116" />
                      <circle cx="2" cy="23.5" r="0.8" fill="#FCD116" />
                      <circle cx="12" cy="14" r="0.8" fill="#FCD116" />
                    </g>
                  </svg>
                </div>

                <span>V</span>
                <span className="text-[12px] sm:text-[13px] font-black text-[#005CE6] tracking-normal self-start mt-0.5 ml-0.5">
                  PH
                </span>
              </div>
            </button>

            {/* Subtle Vertical Divider */}
            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0"></div>

            {/* Local Government City Seal & Title */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <img
                src={currentTenant.logo}
                alt={`${currentTenant.name} Seal`}
                className="w-7 h-7 object-contain rounded-full shadow-2xs border border-slate-100 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/images/bogo_city_logo.png';
                }}
              />
              <div className="flex flex-col text-left leading-tight shrink-0">
                <span className="text-[12px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                  {currentTenant.name}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase whitespace-nowrap">
                  EBPLS
                </span>
              </div>
            </div>
          </div>

          {/* Center: Navigation Links (Clean, subtle gray typography matching sample) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[13.5px] lg:text-[14px] font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                if (isTrackerActive && onOpenTracker) onOpenTracker();
                const el = document.getElementById('bplo-form-top') || document.querySelector('form');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#005CE6] transition-colors cursor-pointer"
            >
              Features
            </button>

            <button
              type="button"
              onClick={() => setShowHowItWorksModal(true)}
              className="hover:text-[#005CE6] transition-colors cursor-pointer"
            >
              How It Works
            </button>

            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="hover:text-[#005CE6] transition-colors cursor-pointer"
            >
              Security
            </button>

            <button
              type="button"
              onClick={() => setShowNewsModal(true)}
              className="hover:text-[#005CE6] transition-colors cursor-pointer"
            >
              News
            </button>

            <button
              type="button"
              onClick={() => setShowFaqModal(true)}
              className="hover:text-[#005CE6] transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right: Auth/Portal, and Iconic Blue 'Download App' Pill Button */}
          <div className="flex items-center gap-2 sm:gap-3.5">

            {/* Track Permit Status Text Link */}
            {onOpenTracker && (
              <button
                type="button"
                onClick={onOpenTracker}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isTrackerActive
                    ? 'text-[#005CE6] bg-blue-50 font-bold'
                    : 'text-slate-600 hover:text-[#005CE6]'
                }`}
                title="Track Permit Status"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isTrackerActive ? 'Tracking View' : 'Track Status'}</span>
              </button>
            )}

            {/* Authenticated User / Staff Controls */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {onToggleViewMode && (
                  <button
                    type="button"
                    onClick={onToggleViewMode}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'admin'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{viewMode === 'admin' ? 'Applicant Form' : 'Staff Evaluator'}</span>
                  </button>
                )}

                {/* Profile Pill with Sign Out */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#005CE6] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-fadeIn">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <span className="font-bold text-slate-800 block truncate">{currentUser.fullName || currentUser.email}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{currentUser.role || 'Citizen'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Unauthenticated: Staff Demo Shortcut if available */
              onQuickStaffLogin && (
                <button
                  type="button"
                  onClick={onQuickStaffLogin}
                  className="hidden md:inline-flex text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 transition-colors cursor-pointer"
                  title="Direct Staff Demo Access"
                >
                  Staff Demo
                </button>
              )
            )}

            {/* The Iconic Royal Blue 'Download App' Pill Button (Exactly matching the photo sample) */}
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#005CE6] hover:bg-[#0048B3] text-white text-[13px] sm:text-[14px] font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <span>Download App</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 md:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-150 bg-white px-4 py-3 space-y-2 animate-fadeIn">
            <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isTrackerActive && onOpenTracker) onOpenTracker();
                }}
                className="text-left py-1.5 hover:text-[#005CE6]"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowHowItWorksModal(true);
                }}
                className="text-left py-1.5 hover:text-[#005CE6]"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSecurityModal(true);
                }}
                className="text-left py-1.5 hover:text-[#005CE6]"
              >
                Security
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowNewsModal(true);
                }}
                className="text-left py-1.5 hover:text-[#005CE6]"
              >
                News
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowFaqModal(true);
                }}
                className="text-left py-1.5 hover:text-[#005CE6]"
              >
                FAQ
              </button>
              {onOpenTracker && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTracker();
                  }}
                  className="text-left py-1.5 font-bold text-[#005CE6] flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Application Status</span>
                </button>
              )}
            </div>

          </div>
        )}
      </header>

      {/* 1. Download App Modal (Clean official eGov PH app card) */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-['Poppins',sans-serif]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
            <button
              type="button"
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#005CE6] shadow-2xs">
                <Smartphone className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Download eGov PH App
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  The Official Republic of the Philippines Super App. Access your Business Permits, Local Clearances, and over 500+ National Agency Services on your smartphone.
                </p>
              </div>

              {/* QR Code Demo Frame */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
                <QrCode className="w-32 h-32 mx-auto text-slate-800" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-2">
                  Scan to Download
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href="https://apps.apple.com/ph/app/egov-ph/id1644781444"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <span>App Store</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="https://play.google.com/store/apps/details?id=egov.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#005CE6] hover:bg-[#0048B3] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <span>Google Play</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                </a>
              </div>

              <p className="text-[11px] text-slate-400">
                Department of Information and Communications Technology (DICT) • Republic of the Philippines
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. How It Works Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-['Poppins',sans-serif]">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-150 overflow-hidden relative">
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005CE6] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">How eBOSS Business Permitting Works</h3>
                  <p className="text-xs text-slate-500">RA 11032 Ease of Doing Business Standard</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#005CE6] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Fill Unified Form & Upload Attachments</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">Submit the single unified electronic application form and required clearances via Cloudinary secure vault.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#005CE6] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Joint Back-End Evaluation</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">BPLO, City Planning (Zoning), and Bureau of Fire Protection evaluate your attachments concurrently in 3 working days.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#005CE6] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">One Assessment & Digital Permit Release</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">Receive single consolidated billing (Tax Order of Payment), settle payment, and print the official Mayor's Permit with verifiable QR plate.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#005CE6] text-white text-xs font-bold cursor-pointer hover:bg-[#0048B3] transition-colors mt-2"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-['Poppins',sans-serif]">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-150 overflow-hidden relative">
            <button
              type="button"
              onClick={() => setShowSecurityModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Security & Privacy Standards</h3>
                  <p className="text-xs text-slate-500">Government Security Architecture</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-0.5">Republic Act No. 10173 (Data Privacy Act)</h4>
                  <p className="text-[11px]">All personal information and taxpayer documents are encrypted in transit (TLS 1.3) and at rest with role-based evaluation access.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-0.5">Anti-Red Tape Authority (ARTA) Certified</h4>
                  <p className="text-[11px]">Strict compliance with RA 11032 Ease of Doing Business and Efficient Government Service Delivery Act of 2018.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-0.5">Cryptographic QR Verification</h4>
                  <p className="text-[11px]">Issued Mayor&apos;s Permits and Acknowledgement Receipts feature unique tamper-proof digital signatures verifiable by law enforcement.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-['Poppins',sans-serif]">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-150 overflow-hidden relative max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#005CE6]" />
                <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">What is the standard processing time for a new business permit?</span>
                <span className="text-[11px] text-slate-600 block">Under RA 11032, applications submitted through the eBOSS portal are processed within 3 working days from complete attachment submission.</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">How can I track the real-time status of my application?</span>
                <span className="text-[11px] text-slate-600 block">Click &quot;Track Status&quot; on the navigation bar, input your Reference Number (e.g. BOGO-XXXXX), and view your step-by-step progress.</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">What happens if one of my uploaded documents is rejected?</span>
                <span className="text-[11px] text-slate-600 block">The evaluator provides an exact reason (e.g. blurry scan, expired). You can open the Application Tracker, view the reason, and click &quot;Re-upload / Replace&quot;.</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Where do I settle the Tax Order of Payment?</span>
                <span className="text-[11px] text-slate-600 block">You may pay over the counter at the City Treasurer&apos;s Office in City Hall or through accredited online banking/e-wallet channels.</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="px-5 py-2 rounded-xl bg-[#005CE6] text-white text-xs font-bold cursor-pointer"
              >
                Close FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. News Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-['Poppins',sans-serif]">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-150 overflow-hidden relative">
            <button
              type="button"
              onClick={() => setShowNewsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005CE6] flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Latest eBOSS & BPLO News</h3>
                  <p className="text-xs text-slate-500">City of Bogo Official Announcements</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-[#005CE6] block uppercase tracking-wider">Announcement • October 2026</span>
                  <h4 className="font-bold text-slate-900 mt-0.5">Online Business Permit Renewal & New Registrations Active</h4>
                  <p className="text-[11px] text-slate-600 mt-1">All business establishments can now submit digital copies of clearances directly on the BPLO web portal with real-time tracking.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-700 block uppercase tracking-wider">Compliance • RA 11032</span>
                  <h4 className="font-bold text-slate-900 mt-0.5">Zero Red Tape Guarantee</h4>
                  <p className="text-[11px] text-slate-600 mt-1">Under Joint Memorandum Circular No. 2021-01, inspections for low-risk businesses are conducted post-issuance.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewsModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#005CE6] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
