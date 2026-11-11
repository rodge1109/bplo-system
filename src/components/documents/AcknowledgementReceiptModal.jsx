import React from 'react';
import { 
  Printer, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  ExternalLink, 
  FileCheck2, 
  Copy, 
  Check, 
  Clock, 
  Search, 
  QrCode,
  Building2,
  Calendar,
  AlertTriangle,
  Edit3
} from 'lucide-react';

export default function AcknowledgementReceiptModal({
  receiptData,
  onClose,
  onOpenTracker,
  onEditApplication,
  activeTenant
}) {
  const [copied, setCopied] = React.useState(false);

  if (!receiptData) return null;

  const handleCopyRef = () => {
    if (receiptData.referenceNo) {
      navigator.clipboard.writeText(receiptData.referenceNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const tenant = activeTenant || {
    name: 'City of Bogo',
    province: 'Cebu',
    logo: '/assets/images/bogo_city_logo.png',
    documentCode: 'QF-BPLO-01',
    officeName: 'Business Permit and Licensing Office'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-['Poppins',sans-serif]">
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-ear, #printable-ear * {
            visibility: visible;
          }
          #printable-ear {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Modal Top Bar (No Print) */}
        <div className="no-print bg-[#1B4332] text-white px-5 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span className="font-semibold tracking-wide">
              Official ARTA Electronic Acknowledgement Receipt (e-AR)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-full bg-[#159847] hover:bg-[#12823c] text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print Receipt or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-ear" className="p-6 sm:p-8 space-y-6 text-slate-800">
          
          {/* Official Letterhead */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <img
                src={tenant.logo}
                alt={`${tenant.name} Seal`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xs"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/images/bogo_city_logo.png';
                }}
              />
              <div className="text-left">
                <p className="text-[11px] font-medium uppercase text-gray-500 tracking-wide">Republic of the Philippines</p>
                <p className="text-[11px] font-medium uppercase text-gray-500 tracking-wide">Province of {tenant.province}</p>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 uppercase tracking-normal">{tenant.name}</h2>
                <h3 className="text-xs font-medium text-emerald-700 uppercase tracking-wide">{tenant.officeName || 'Business Permit and Licensing Office'}</h3>
              </div>
            </div>

            <div className="text-right text-[11px] text-gray-600 space-y-0.5 bg-slate-50 border border-slate-200 p-2.5 rounded-xl hidden sm:block">
              <p><span className="font-semibold text-gray-800">Doc Code:</span> {tenant.documentCode || 'QF-BPLO-01'}</p>
              <p><span className="font-semibold text-gray-800">System:</span> eBOSS Portal</p>
              <p><span className="font-semibold text-gray-800">EODB Standard:</span> RA 11032</p>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-2.5 px-4 bg-emerald-700 text-white rounded-xl">
            <h1 className="text-xs sm:text-sm font-semibold tracking-wider uppercase">
              ELECTRONIC ACKNOWLEDGEMENT RECEIPT (e-AR)
            </h1>
            <p className="text-[10px] text-emerald-100 font-normal">
              Unified Business Permit and Licensing Application • Citizen’s Charter Compliant
            </p>
          </div>

          {/* Reference Number & Submission Timestamp Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl items-center">
            
            <div className="sm:col-span-2">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                Official Application Reference Number
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-950 tracking-wide select-all">
                  {receiptData.referenceNo}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="no-print p-1 text-emerald-700 hover:text-emerald-900 rounded transition-colors"
                  title="Copy Reference Number"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-1 flex items-center gap-1.5 font-normal">
                <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Date & Time Submitted: <strong>{receiptData.submittedAtFormatted || new Date().toLocaleString()}</strong></span>
              </p>
            </div>

            {/* Verification QR / Status Badge */}
            <div className="flex flex-col items-start sm:items-end justify-center border-t sm:border-t-0 sm:border-l border-emerald-200 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Status:</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full mt-0.5">
                <span>Under BPLO Evaluation</span>
              </span>
              <span className="text-[10px] text-emerald-700 mt-1">
                ARTA Clock: <strong>Day 1 of 3</strong>
              </span>
            </div>

          </div>

          {/* Key Application Summary */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Application Summary Details
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              <div>
                <span className="text-gray-500 block font-normal">Applicant / Taxpayer:</span>
                <span className="font-semibold text-slate-900">{receiptData.applicantName || 'Applicant'}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-normal">Business Name:</span>
                <span className="font-semibold text-slate-900">{receiptData.businessName || 'Business Establishment'}</span>
              </div>
              <div>
                <span className="text-gray-500 block font-normal">Application Type:</span>
                <span className="font-semibold text-slate-900">{receiptData.applicationType} Application</span>
              </div>
              <div>
                <span className="text-gray-500 block font-normal">Organization Type:</span>
                <span className="font-semibold text-slate-900">{receiptData.typeOfOrganization || 'Single'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 block font-normal">Declared Business Address:</span>
                <span className="font-semibold text-slate-900">{receiptData.businessAddress || 'Declared Address'}</span>
              </div>
            </div>
          </div>

          {/* Uploaded ARTA Documents Checklist */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <span>Attached Documents (RA 11032 Compliant)</span>
              <span className="text-[11px] text-emerald-700 font-bold lowercase">
                {receiptData.documents?.length || 0} attached
              </span>
            </div>
            
            <div className="p-4 space-y-2">
              {receiptData.documents && receiptData.documents.length > 0 ? (
                receiptData.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">{doc.title}</span>
                        <span className="text-[11px] text-gray-500 block">File: {doc.fileName}</span>
                      </div>
                    </div>
                    {doc.cloudinaryUrl && (
                      <a
                        href={doc.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No electronic documents were attached.</p>
              )}
            </div>
          </div>

          {/* Legal Notice under ARTA RA 11032 */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-gray-600 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Statutory ARTA Processing Time (Republic Act No. 11032):</span>
            </div>
            <p>
              In compliance with Section 8 of the Ease of Doing Business Act, your permit application has officially commenced evaluation. 
              The City of Bogo Business One-Stop Shop (BOSS) will complete document verification, zoning clearance, and fire safety inspection within 
              <strong> 3 working days</strong>. You will receive SMS/Email notifications as your application progresses.
            </p>
          </div>

          {/* Next Steps Guide */}
          <div className="border-t border-slate-200 pt-4 text-xs space-y-2">
            <h4 className="font-semibold text-slate-800 uppercase tracking-wide text-[11px]">
              Next Steps for Applicant:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">Step 1: Evaluation</span>
                <span className="text-gray-500">BPLO & BFP review your attachments</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">Step 2: Order of Payment</span>
                <span className="text-gray-500">Tax assessment bill will be issued</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">Step 3: Permit Issuance</span>
                <span className="text-gray-500">Electronic permit released upon payment</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions (No Print) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (onOpenTracker) {
                  onOpenTracker(receiptData.referenceNo);
                }
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>Track Status</span>
            </button>

            {onEditApplication && (
              <button
                type="button"
                onClick={() => {
                  onEditApplication(receiptData);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Re-open application form to edit information"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit Form Info</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print e-AR</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#159847] hover:bg-[#12823c] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Done / Close
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
