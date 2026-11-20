import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  Upload,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Search,
  Eye,
  Trash2,
  Settings,
  Check,
  X,
  Smartphone,
  Building2,
  Copy
} from 'lucide-react';
import { uploadToCloudinary } from '../../services/cloudinaryService';

const QR_CONFIG_STORAGE_KEY = 'bplo_platform_fee_qr_config';

export function getPlatformQrConfig() {
  try {
    const saved = localStorage.getItem(QR_CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read QR config:', e);
  }
  return {
    accountName: 'BPLO - City of Bogo',
    accountNumber: '0917-888-BOGO (2646)',
    amount: 200,
    customQrUrl: ''
  };
}

export default function PlatformFeeGate({
  currentUser,
  activeTenant,
  onPaymentConfirmed,
  onOpenTracker,
  onLogout
}) {
  const [qrConfig, setQrConfig] = useState(getPlatformQrConfig);
  const [selectedChannel, setSelectedChannel] = useState('GCash');
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [senderName, setSenderName] = useState(currentUser?.fullName || '');
  const [receiptDoc, setReceiptDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedAcct, setCopiedAcct] = useState(false);

  // Admin QR customization modal state
  const [showQrSettings, setShowQrSettings] = useState(false);
  const [tempAccountName, setTempAccountName] = useState(qrConfig.accountName);
  const [tempAccountNumber, setTempAccountNumber] = useState(qrConfig.accountNumber);
  const [tempCustomQrUrl, setTempCustomQrUrl] = useState(qrConfig.customQrUrl);
  const [isUploadingQrImage, setIsUploadingQrImage] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(qrConfig.accountNumber);
    setCopiedAcct(true);
    setTimeout(() => setCopiedAcct(false), 2000);
  };

  // Upload payment screenshot
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const result = await uploadToCloudinary(file, {
        docType: 'platform_fee_receipt',
        tenantCode: activeTenant?.code || 'BOGO',
        onProgress: (pct) => setUploadProgress(pct)
      });

      setReceiptDoc({
        url: result.secure_url || result.url,
        fileName: result.original_filename || file.name,
        fileSize: result.bytes || file.size,
        format: result.format || file.name.split('.').pop(),
        uploadedAt: new Date().toISOString()
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to upload payment screenshot.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Upload custom QR code image for the portal
  const handleQrImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQrImage(true);
    try {
      const result = await uploadToCloudinary(file, {
        docType: 'official_qr_code',
        tenantCode: activeTenant?.code || 'BOGO'
      });
      setTempCustomQrUrl(result.secure_url || result.url);
    } catch (err) {
      alert('Failed to process QR image: ' + err.message);
    } finally {
      setIsUploadingQrImage(false);
    }
  };

  const handleSaveQrSettings = (e) => {
    e.preventDefault();
    const updated = {
      accountName: tempAccountName.trim() || 'BPLO - City of Bogo',
      accountNumber: tempAccountNumber.trim() || '0917-888-BOGO (2646)',
      amount: 200,
      customQrUrl: tempCustomQrUrl.trim()
    };
    setQrConfig(updated);
    try {
      localStorage.setItem(QR_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    setShowQrSettings(false);
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanRef = paymentRefNo.trim();
    if (!cleanRef || cleanRef.length < 4) {
      setErrorMessage('Please enter a valid Payment Reference Number from your QR payment receipt.');
      return;
    }

    if (!receiptDoc) {
      setErrorMessage('Please upload a screenshot or photo of your ₱200.00 payment receipt for verification.');
      return;
    }

    const paymentPayload = {
      amount: 200.00,
      currency: 'PHP',
      channel: selectedChannel,
      referenceNo: cleanRef.toUpperCase(),
      senderName: senderName.trim() || currentUser?.fullName || 'Applicant',
      paidAt: new Date().toISOString(),
      paidAtFormatted: new Date().toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      receiptUrl: receiptDoc.url,
      receiptFileName: receiptDoc.fileName,
      receiptFileSize: receiptDoc.fileSize,
      receiptFormat: receiptDoc.format
    };

    onPaymentConfirmed(paymentPayload);
  };

  // Dynamic QR code fallback URL using official QR generator API if no custom image uploaded
  const qrDataString = encodeURIComponent(
    `BPLO-CITY-OF-BOGO|PLATFORM-FEE|PHP:200.00|CHANNEL:${selectedChannel}|ACCT:${qrConfig.accountNumber}`
  );
  const displayQrUrl =
    qrConfig.customQrUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&color=111827&data=${qrDataString}`;

  return (
    <div className="min-h-[82vh] w-full flex flex-col justify-center items-center py-6 px-3 sm:px-4 font-['Poppins',sans-serif]">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 relative">

        {/* Top Right QR Settings button (for Admin/Setup convenience) */}
        <button
          type="button"
          onClick={() => setShowQrSettings(true)}
          title="Configure Official Payment QR Code"
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 mb-3 flex items-center justify-center">
            <img
              src="/assets/images/bogo_city_logo.png"
              alt="City of Bogo Seal"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1B4332] text-[11px] font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Step 1 of 2 • Pre-Application Requirement</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Platform Processing Fee
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md">
            Scan the QR code below to pay the <strong className="text-gray-800">₱200.00</strong> online platform fee before proceeding to the Unified Business Permit Application Form.
          </p>
        </div>

        {/* Amount Banner */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F2F5F0] border border-emerald-200/80 mb-5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
              Amount Due
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#1B4332]">
              ₱200.00
            </span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-800">
              <QrCode className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Instant QR Ph</span>
            </span>
            <span className="block text-[11px] text-gray-500 mt-1">
              One-time per new application
            </span>
          </div>
        </div>

        {/* Channel Selector Tabs */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
            1. Select Payment Channel & Scan QR Code
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['GCash', 'Maya', 'QR Ph / Bank'].map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => setSelectedChannel(channel)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedChannel === channel
                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{channel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code Card */}
        <div className="rounded-2xl border border-gray-200 bg-slate-50/60 p-5 flex flex-col items-center text-center mb-6">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 mb-3 relative">
            <img
              src={displayQrUrl}
              alt="Payment QR Code"
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
            />
          </div>

          <p className="text-xs font-bold text-gray-900">
            {qrConfig.accountName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-mono text-gray-600">
              {qrConfig.accountNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              title="Copy Account Number"
            >
              {copiedAcct ? (
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Open your {selectedChannel} app, scan the QR code, and pay exactly <strong>₱200.00</strong>.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
              2. Enter Payment Reference Number *
            </label>
            <input
              type="text"
              required
              value={paymentRefNo}
              onChange={(e) => setPaymentRefNo(e.target.value)}
              placeholder={`Enter ${selectedChannel} Reference / Transaction No.`}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F5F0] border border-gray-200 text-gray-900 text-sm font-mono font-semibold focus:ring-2 focus:ring-[#16A34A] focus:bg-white outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
              Sender Account Name / Mobile No.
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz / 0917xxxxxxx"
              className="w-full px-4 py-3 rounded-xl bg-[#F2F5F0] border border-gray-200 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-[#16A34A] focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Proof of Payment Upload */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
              3. Upload Payment Receipt Screenshot *
            </label>

            {!receiptDoc ? (
              <label className="w-full border-2 border-dashed border-gray-300 hover:border-[#16A34A] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleReceiptUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="py-2 flex flex-col items-center">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-[#16A34A] rounded-full animate-spin mb-1.5" />
                    <span className="text-xs font-semibold text-gray-600">
                      Uploading receipt... {uploadProgress}%
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[#16A34A] mb-1.5" />
                    <span className="text-xs font-bold text-gray-800">
                      Click to upload payment screenshot
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      PNG, JPG, or PDF receipt from {selectedChannel}
                    </span>
                  </>
                )}
              </label>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {receiptDoc.fileName}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Receipt attached & ready for verification
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={receiptDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-[#16A34A] transition-colors"
                    title="Preview Receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setReceiptDoc(null)}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Receipt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Confirm Button */}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3.5 px-5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>Confirm ₱200.00 Payment & Proceed to Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Track Existing Application Button */}
          {onOpenTracker && (
            <button
              type="button"
              onClick={onOpenTracker}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs border border-gray-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Already submitted? Track Existing Application (Free)</span>
            </button>
          )}
        </form>
      </div>

      {/* Modal to Customize Official QR Code Image & Account Details */}
      {showQrSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#16A34A]" />
                <h3 className="font-bold text-gray-900 text-base">
                  Official QR Code Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrSettings(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQrSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Merchant / Account Name
                </label>
                <input
                  type="text"
                  value={tempAccountName}
                  onChange={(e) => setTempAccountName(e.target.value)}
                  placeholder="BPLO - City of Bogo"
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Account / Mobile Number
                </label>
                <input
                  type="text"
                  value={tempAccountNumber}
                  onChange={(e) => setTempAccountNumber(e.target.value)}
                  placeholder="0917-xxx-xxxx"
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Upload Official GCash / Maya / QR Ph Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrImageUpload}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#16A34A] hover:file:bg-emerald-100 cursor-pointer"
                />
                {isUploadingQrImage && (
                  <p className="text-[11px] text-emerald-700 mt-1">Processing QR image...</p>
                )}
                {tempCustomQrUrl && (
                  <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-gray-200">
                    <span className="text-[11px] text-emerald-700 font-semibold truncate">
                      Custom QR image loaded
                    </span>
                    <button
                      type="button"
                      onClick={() => setTempCustomQrUrl('')}
                      className="text-[11px] text-red-600 font-bold hover:underline ml-2 cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrSettings(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold cursor-pointer"
                >
                  Save QR Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

