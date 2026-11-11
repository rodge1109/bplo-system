import React from 'react';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  Building2, 
  Calendar,
  FileBadge,
  Award
} from 'lucide-react';

export default function BusinessPermitViewModal({
  permitData,
  onClose,
  activeTenant
}) {
  if (!permitData) return null;

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

  const permitNumber = permitData.permitNumber || `BP-${tenant.code || 'BOGO'}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const plateNumber = permitData.plateNumber || `PL-${tenant.code || 'BOGO'}-${Math.floor(10000 + Math.random() * 90000)}`;
  const orNumber = permitData.orNumber || `OR-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateIssued = permitData.issuedAtFormatted || new Date().toLocaleDateString('en-PH', { dateStyle: 'long' });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-['Poppins',sans-serif]">
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-permit, #printable-permit * {
            visibility: visible;
          }
          #printable-permit {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 30px;
            background: white !important;
            box-shadow: none !important;
            border: 4px double #159847 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Top Control Bar (No Print) */}
        <div className="no-print bg-[#1B4332] text-white px-5 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-300" />
            <span className="font-semibold tracking-wide">
              Official Electronic Mayor's / Business Permit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-full bg-[#159847] hover:bg-[#12823c] text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print Official Permit"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Permit</span>
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

        {/* Printable Official Permit Body */}
        <div id="printable-permit" className="p-8 sm:p-12 text-slate-800 space-y-6 relative border-8 border-double border-emerald-800/80 m-4 rounded-xl bg-gradient-to-b from-white via-emerald-50/10 to-white">
          
          {/* Watermark Seal Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
            <img
              src={tenant.logo}
              alt="Watermark"
              className="w-96 h-96 object-contain"
              onError={(e) => { e.target.src = '/assets/images/bogo_city_logo.png'; }}
            />
          </div>

          {/* Header */}
          <div className="text-center space-y-1 relative z-10 border-b-2 border-emerald-800 pb-5">
            <div className="w-20 h-20 mx-auto mb-2">
              <img
                src={tenant.logo}
                alt={`${tenant.name} Seal`}
                className="w-full h-full object-contain drop-shadow-sm"
                onError={(e) => { e.target.src = '/assets/images/bogo_city_logo.png'; }}
              />
            </div>
            <p className="text-xs uppercase font-medium text-gray-600 tracking-widest">Republic of the Philippines</p>
            <p className="text-xs uppercase font-medium text-gray-600 tracking-widest">Province of {tenant.province}</p>
            <h2 className="text-xl sm:text-2xl font-bold uppercase text-slate-900 tracking-wider">{tenant.name}</h2>
            <h3 className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">Office of the City Mayor</h3>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Business Permits & Licensing Office (BPLO)</p>
          </div>

          {/* Title Box */}
          <div className="text-center py-3 bg-emerald-800 text-white rounded-lg shadow-sm relative z-10">
            <h1 className="text-base sm:text-lg font-bold tracking-widest uppercase">
              BUSINESS / MAYOR’S PERMIT
            </h1>
            <p className="text-[11px] text-emerald-200 uppercase tracking-wider">
              Calendar Year 2026
            </p>
          </div>

          {/* Permit Meta Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 bg-slate-50 border border-slate-300 rounded-lg relative z-10">
            <div>
              <span className="text-gray-500 block">Permit Number:</span>
              <span className="font-bold font-mono text-emerald-950 text-xs">{permitNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Business Plate / Sticker:</span>
              <span className="font-bold font-mono text-slate-900 text-xs">{plateNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Official Receipt (OR):</span>
              <span className="font-bold font-mono text-slate-900 text-xs">{orNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Date Issued:</span>
              <span className="font-bold text-slate-900 text-xs">{dateIssued}</span>
            </div>
          </div>

          {/* Main Declaration */}
          <div className="text-center space-y-4 py-2 relative z-10 text-xs sm:text-sm leading-relaxed">
            <p className="text-gray-700 italic">
              PERMISSION IS HEREBY GRANTED pursuant to the provisions of the Local Government Code of 1991 (RA 7160), 
              the City Revenue Code, and existing ordinances to:
            </p>

            <div className="py-2 border-y border-dashed border-emerald-300/80 bg-emerald-50/30">
              <span className="text-xs text-gray-500 uppercase tracking-wider block font-medium">Permittee / Owner</span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase">
                {permitData.applicantName || 'Juan Dela Cruz'}
              </h3>
            </div>

            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block font-medium">Business Trade Name</span>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-900 uppercase">
                {permitData.businessName || 'Business Establishment'}
              </h2>
            </div>

            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block font-medium">Business Location</span>
              <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                {permitData.businessAddress || 'City of Bogo, Cebu'}
              </p>
            </div>

            {/* Line of Business */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left max-w-xl mx-auto">
              <span className="text-[11px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                Authorized Line(s) of Business:
              </span>
              <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5">
                {permitData.activities && permitData.activities.length > 0 ? (
                  permitData.activities.map((act, i) => (
                    <li key={i} className="font-medium">
                      {act.lineOfBusiness || act.line_of_business}
                    </li>
                  ))
                ) : (
                  <li className="font-medium">General Commercial & Retail Services</li>
                )}
              </ul>
            </div>
          </div>

          {/* Conditions & Expiry */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[10px] sm:text-[11px] text-amber-900 leading-snug relative z-10 text-justify">
            <strong>CONDITIONS:</strong> This permit must be posted conspicuously at the place of business and surrendered upon cessation or closure. 
            Subject to continuous inspection and compliance with Environmental, Health, Zoning, and Bureau of Fire Protection standards. 
            Valid until <strong>December 31, 2026</strong> unless sooner revoked or suspended for cause.
          </div>

          {/* Signatures & Seal */}
          <div className="pt-6 grid grid-cols-2 gap-8 items-end relative z-10">
            
            {/* Left: BPLO Head & QR Code */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 border-2 border-emerald-700 p-1 rounded-lg bg-white flex flex-col items-center justify-center flex-shrink-0">
                <QrCode className="w-10 h-10 text-emerald-900" />
                <span className="text-[8px] font-bold text-emerald-800 uppercase">Verified</span>
              </div>
              <div className="text-left text-[11px]">
                <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">ATTY. MARVIN D. SUAREZ</p>
                <p className="text-gray-500 font-medium">BPLO Department Head</p>
                <p className="text-[9px] text-gray-400 font-mono">Ref: {permitData.referenceNo}</p>
              </div>
            </div>

            {/* Right: City Mayor */}
            <div className="text-center text-[11px]">
              <div className="w-36 mx-auto border-b border-slate-800 pb-1">
                <p className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                  HON. CARLO J. MARTINEZ
                </p>
              </div>
              <p className="text-gray-600 font-medium mt-0.5">City Mayor</p>
              <p className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider">City of Bogo, Cebu</p>
            </div>

          </div>

        </div>

        {/* Modal Bottom Actions (No Print) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-full bg-[#159847] hover:bg-[#12823c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Permit</span>
          </button>
        </div>

      </div>

    </div>
  );
}
