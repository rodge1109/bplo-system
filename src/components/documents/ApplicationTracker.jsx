import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  Calendar, 
  Building2, 
  User, 
  RefreshCw,
  Printer,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Check,
  FileCheck2,
  Trash2,
  Edit3
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { TENANTS } from '../../constants/tenants';
import { uploadToCloudinary } from '../../services/cloudinaryService';

export default function ApplicationTracker({
  initialReferenceNo = '',
  isOpen = true,
  onClose,
  onViewReceipt,
  onEditApplication,
  activeTenant,
  isEvaluationAdmin = false
}) {
  const [refInput, setRefInput] = useState(initialReferenceNo);
  const [isSearching, setIsSearching] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentApplications, setRecentApplications] = useState([]);
  
  // Additional Document Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [selectedDocTitle, setSelectedDocTitle] = useState('Contract of Lease');
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [replacingDoc, setReplacingDoc] = useState(null);

  // Load recent applications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bplo_recent_applications');
      if (stored) {
        setRecentApplications(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load recent applications:', e);
    }
  }, []);

  // Sync initial reference number if passed
  useEffect(() => {
    if (initialReferenceNo) {
      setRefInput(initialReferenceNo);
      handleSearch(initialReferenceNo);
    }
  }, [initialReferenceNo]);

  const handleSearch = async (queryRef) => {
    const targetRef = (queryRef || refInput || '').trim();
    if (!targetRef) {
      setErrorMessage('Please enter an application reference number.');
      return;
    }

    setIsSearching(true);
    setErrorMessage('');
    setApplicationData(null);
    setUploadSuccess('');
    setUploadError('');

    try {
      // 1. Search in Supabase
      const { data, error } = await supabase
        .from('bplo_application')
        .select('*')
        .ilike('reference_no', targetRef)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase query error:', error);
      }

      if (data) {
        let docs = [];

        // 1. Check direct localStorage copy first (contains latest evaluator accept/reject status and reasons)
        if (data.reference_no) {
          try {
            const direct = localStorage.getItem(`bplo_docs_${data.reference_no}`);
            if (direct) {
              const parsed = JSON.parse(direct);
              if (Array.isArray(parsed) && parsed.length > 0) docs = parsed;
            }
          } catch(e) {}
        }

        // 2. Fallback to Supabase uploaded_documents
        if (docs.length === 0 && Array.isArray(data.uploaded_documents) && data.uploaded_documents.length > 0) {
          docs = data.uploaded_documents;
        }

        // 3. Fallback to recentApplications
        if (docs.length === 0) {
          const local = recentApplications.find(a => 
            a.referenceNo?.toLowerCase() === targetRef.toLowerCase()
          );
          if (local && local.documents && local.documents.length > 0) {
            docs = local.documents;
          }
        }

        let activities = [];
        if (data.id) {
          try {
            const { data: acts } = await supabase
              .from('bplo_business_activities')
              .select('*')
              .eq('application_id', data.id);
            if (acts && acts.length > 0) {
              activities = acts;
            }
          } catch (e) {
            console.warn('Activities fetch notice:', e);
          }
        }

        let assessmentItems = data.assessment_items || null;
        let totalAssessed = data.total_assessed || null;
        if (!assessmentItems && data.reference_no) {
          try {
            const cachedAssessment = localStorage.getItem(`bplo_assessment_${data.reference_no}`);
            if (cachedAssessment) {
              assessmentItems = JSON.parse(cachedAssessment);
              if (!totalAssessed && Array.isArray(assessmentItems)) {
                totalAssessed = assessmentItems.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
              }
            }
          } catch(e) {}
        }

        setApplicationData({
          ...data,
          referenceNo: data.reference_no,
          applicantName: `${data.taxpayer_first_name || ''} ${data.taxpayer_last_name || ''}`.trim() || data.applicant_signature_name || 'Applicant',
          businessName: data.business_name,
          applicationType: data.application_type,
          businessAddress: `${data.bus_house_bldg_no || ''} ${data.bus_street || ''} Brgy. ${data.bus_barangay || ''}, ${data.bus_city_municipality || 'City of Bogo'}`.trim(),
          documents: docs,
          business_activities: activities,
          assessment_items: assessmentItems,
          total_assessed: totalAssessed,
          submittedAt: data.created_at || data.date_of_application,
          status: data.status || 'Pending'
        });
      } else {
        // Fallback: Check localStorage recent submissions
        const local = recentApplications.find(a => 
          a.referenceNo?.toLowerCase() === targetRef.toLowerCase()
        );

        if (local) {
          let localDocs = local.documents || [];
          try {
            const direct = localStorage.getItem(`bplo_docs_${local.referenceNo}`);
            if (direct) {
              const parsed = JSON.parse(direct);
              if (Array.isArray(parsed) && parsed.length > 0) localDocs = parsed;
            }
          } catch(e) {}
          setApplicationData({ ...local, documents: localDocs });
        } else {
          setErrorMessage(`No permit application found matching reference number "${targetRef}". Please verify the code.`);
        }
      }
    } catch (err) {
      console.error('Tracker search error:', err);
      setErrorMessage('Failed to search application. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Upload additional / corrected document
  const handleUploadAdditionalDoc = async (file) => {
    if (!file || !applicationData?.referenceNo) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB maximum limit.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const docTitle = selectedDocTitle === 'Other' ? (customDocTitle.trim() || 'Additional Requirement') : selectedDocTitle;

    try {
      const result = await uploadToCloudinary(file, {
        docType: 'applicant_supplement',
        tenantCode: applicationData.tenant_code || 'BOGO'
      });

      const newDoc = {
        docId: (replacingDoc?.docId || ('supp_' + Date.now())),
        title: docTitle,
        fileName: result.original_filename || file.name,
        fileSize: result.bytes || file.size,
        cloudinaryUrl: result.secure_url || result.url,
        isLocalPreview: result.isLocalPreview || false,
        status: 'pending',
        isVerified: false,
        rejectionReason: '',
        uploadedAt: new Date().toISOString()
      };

      const existingDocs = applicationData.documents || [];
      let updatedDocs;

      if (replacingDoc) {
        // Replace the specific rejected document
        updatedDocs = existingDocs.map(d => {
          const isMatch = d === replacingDoc || 
            (d.docId && d.docId === replacingDoc.docId) || 
            (d.fileName && d.fileName === replacingDoc.fileName) ||
            (d.title && d.title === replacingDoc.title);
          if (isMatch) {
            return {
              ...d,
              ...newDoc,
              status: 'pending',
              isVerified: false,
              rejectionReason: '',
              previousRejectionReason: d.rejectionReason || '',
              replacedAt: new Date().toISOString()
            };
          }
          return d;
        });
      } else {
        // If there's an existing document with the same title that was rejected, replace it
        const rejectedMatchIdx = existingDocs.findIndex(d => 
          d.status === 'rejected' && d.title && d.title.toLowerCase() === docTitle.toLowerCase()
        );
        if (rejectedMatchIdx !== -1) {
          updatedDocs = [...existingDocs];
          updatedDocs[rejectedMatchIdx] = {
            ...existingDocs[rejectedMatchIdx],
            ...newDoc,
            status: 'pending',
            isVerified: false,
            rejectionReason: '',
            replacedAt: new Date().toISOString()
          };
        } else {
          updatedDocs = [...existingDocs, newDoc];
        }
      }

      const updatedApp = { ...applicationData, documents: updatedDocs };
      
      // 1. Update state
      setApplicationData(updatedApp);
      setReplacingDoc(null);

      // 2. Update localStorage bplo_docs_{ref}
      try {
        localStorage.setItem(`bplo_docs_${applicationData.referenceNo}`, JSON.stringify(updatedDocs));
        const stored = localStorage.getItem('bplo_recent_applications');
        if (stored) {
          const recents = JSON.parse(stored);
          const idx = recents.findIndex(r => r.referenceNo === applicationData.referenceNo);
          if (idx !== -1) {
            recents[idx].documents = updatedDocs;
            localStorage.setItem('bplo_recent_applications', JSON.stringify(recents));
          }
        }
      } catch (e) {
        console.warn(e);
      }

      // 3. Update Supabase if available
      try {
        await supabase
          .from('bplo_application')
          .update({ uploaded_documents: updatedDocs })
          .eq('reference_no', applicationData.referenceNo);
      } catch (err) {
        console.warn('Supabase update notice:', err);
      }

      setUploadSuccess(replacingDoc ? `Replacement file for "${docTitle}" uploaded and submitted to BPLO evaluators!` : `Document "${docTitle}" uploaded and submitted to BPLO evaluators!`);
      setShowUploadDrawer(false);
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Upload failed. Please check network and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  // Determine stage progression
  const getStageInfo = (status = 'Pending') => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'released') {
      return { step: 4, label: 'Mayor’s Permit Released', color: 'emerald' };
    }
    if (s === 'assessed' || s === 'payment_ready' || s === 'payment pending') {
      return { step: 3, label: 'Tax Assessment Ready (Payment Pending)', color: 'blue' };
    }
    if (s === 'verified' || s === 'evaluation') {
      return { step: 2, label: 'Under Joint Department Review', color: 'indigo' };
    }
    return { step: 1, label: 'Application Received & Stamped', color: 'amber' };
  };

  const currentStage = applicationData ? getStageInfo(applicationData.status) : null;

  return (
    <div className="w-full max-w-5xl mx-auto py-3 sm:py-6 px-2 sm:px-4 font-['Poppins',sans-serif] animate-fadeIn">
      {/* Top Navigation & Breadcrumbs */}
      {onClose && (
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700" />
            <span>
              {isEvaluationAdmin ? 'Back to Evaluator Dashboard' : 'Back to Application Form'}
            </span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Republic of the Philippines • RA 11032 eBOSS Citizen Tracking</span>
          </div>
        </div>
      )}

      {/* Main Page Card */}
      <div className="bg-white rounded-2xl w-full shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Page Hero Header */}
        <div className="bg-[#1B4332] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                eBOSS Application Status Tracker
              </h2>
              <p className="text-xs text-emerald-200/80">
                Real-time tracking, evaluation deficiency compliance, and ARTA stage monitoring
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Tracker Search Box */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                placeholder="Enter Reference No. (e.g. BOGO-MVPFS18M-GX8K)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 rounded-xl bg-[#159847] hover:bg-[#12823c] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Track Application</span>
            </button>
          </form>

          {/* Quick Select Recent Applications */}
          {recentApplications.length > 0 && !applicationData && (
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Recently filed:</span>
              {recentApplications.slice(0, 4).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setRefInput(item.referenceNo);
                    handleSearch(item.referenceNo);
                  }}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-emerald-800 font-mono text-xs hover:border-emerald-400 hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
                >
                  {item.referenceNo}
                </button>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn max-w-2xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Search Result & Content (Page view - no inner scrollbar) */}
        <div className="p-5 sm:p-7 space-y-6">
          {applicationData ? (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    Reference Number
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-950">
                    {applicationData.referenceNo}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Current Status</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                    {applicationData.status || 'Under Evaluation'}
                  </span>
                </div>
              </div>

              {/* ARTA Progress Stepper Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Processing Timeline (RA 11032 Citizen's Charter)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Current Step: <strong className="text-emerald-700">{currentStage.step} of 4</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Step 1 */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    currentStage.step >= 1 
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' 
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-900">1. Received & Logged</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Application form and requirements stamped in eBOSS database.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    currentStage.step >= 2 
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' 
                      : currentStage.step === 1 
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/50' 
                        : 'bg-white border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        currentStage.step >= 2 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {currentStage.step >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-bold text-slate-900">2. Joint Evaluation</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      BPLO, Zoning, and BFP evaluate attachments & clearances.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    currentStage.step >= 3 
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' 
                      : 'bg-white border-slate-200 opacity-80'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        currentStage.step >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {currentStage.step >= 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px]">3</span>}
                      </div>
                      <span className="text-[11px] font-bold text-slate-900">3. Tax Assessment</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {applicationData.total_assessed 
                        ? `Official billing: Php ${Number(applicationData.total_assessed).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` 
                        : 'Treasury computes regulatory fees & local taxes.'}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    currentStage.step >= 4 
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' 
                      : 'bg-white border-slate-200 opacity-80'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        currentStage.step >= 4 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {currentStage.step >= 4 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px]">4</span>}
                      </div>
                      <span className="text-[11px] font-bold text-slate-900">4. Permit Release</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Mayor&apos;s Permit and digital QR Plate issued for release.
                    </p>
                  </div>

                </div>
              </div>

              {/* Business Summary Card (4 Columns) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Name</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate" title={applicationData.businessName}>
                      {applicationData.businessName || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Applicant / Owner</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate" title={applicationData.applicantName}>
                      {applicationData.applicantName || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Address</span>
                    <span className="font-medium text-slate-800 text-xs block truncate" title={applicationData.businessAddress}>
                      {applicationData.businessAddress || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Application Type</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] mt-0.5 border border-emerald-300">
                      {applicationData.applicationType || '1.1 New Application'}
                    </span>
                  </div>
                </div>

                {/* Upload / Submit Additional Document Section */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  {(() => {
                    const docsList = applicationData.documents || [];
                    const acceptedCount = docsList.filter(d => d.status === 'accepted' || (d.isVerified && d.status !== 'rejected')).length;
                    const rejectedCount = docsList.filter(d => d.status === 'rejected').length;
                    const pendingCount = docsList.filter(d => d.status !== 'accepted' && d.status !== 'rejected' && !d.isVerified).length;

                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-800 text-xs">Submitted Documents ({docsList.length})</span>
                            {acceptedCount > 0 && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                {acceptedCount} Accepted
                              </span>
                            )}
                            {rejectedCount > 0 && (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                                {rejectedCount} Rejected
                              </span>
                            )}
                            {pendingCount > 0 && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                {pendingCount} Under Review
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReplacingDoc(null);
                              setShowUploadDrawer(!showUploadDrawer);
                            }}
                            className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all self-start sm:self-auto shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{showUploadDrawer ? 'Cancel' : 'Upload / Update Document'}</span>
                          </button>
                        </div>

                        {uploadSuccess && (
                          <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{uploadSuccess}</span>
                          </div>
                        )}

                        {uploadError && (
                          <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-medium flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                            <span>{uploadError}</span>
                          </div>
                        )}

                        {/* Rejected Documents Warning Banner */}
                        {rejectedCount > 0 && (
                          <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-bold block text-rose-900">
                                Action Required: {rejectedCount} document{rejectedCount > 1 ? 's were' : ' was'} rejected by the BPLO evaluator
                              </span>
                              <span className="text-[11px] text-rose-700 block mt-0.5">
                                Please review the evaluator&apos;s reason(s) below and click &quot;Re-upload / Replace&quot; to submit a corrected copy.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Drawer / Upload Form */}
                        {showUploadDrawer && (
                          <div className="mt-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-800 block uppercase tracking-wide">
                                {replacingDoc ? 'Replace Rejected Document:' : 'Submit Document for Evaluation Compliance:'}
                              </span>
                              {replacingDoc && (
                                <button
                                  type="button"
                                  onClick={() => setReplacingDoc(null)}
                                  className="text-[10px] text-amber-700 underline font-semibold cursor-pointer"
                                >
                                  Cancel Replacement
                                </button>
                              )}
                            </div>

                            {replacingDoc && (
                              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                                <span className="font-bold">Replacing: </span>
                                <span>{replacingDoc.title || replacingDoc.fileName}</span>
                                {replacingDoc.rejectionReason && (
                                  <span className="block text-[11px] text-amber-800 italic mt-0.5">
                                    Rejection reason: &quot;{replacingDoc.rejectionReason}&quot;
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-1">Select Document Type:</label>
                                <select
                                  value={selectedDocTitle}
                                  onChange={(e) => setSelectedDocTitle(e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="DTI Certificate of Registration">DTI Registration Certificate</option>
                                  <option value="SEC Registration Certificate">SEC Registration & Articles</option>
                                  <option value="CDA Registration Certificate">CDA Certificate for Cooperatives</option>
                                  <option value="Notarized Contract of Lease">Notarized Contract of Lease (Item 10)</option>
                                  <option value="Lessor's Business Permit">Lessor's Business Permit (Item 11)</option>
                                  <option value="Barangay Business Clearance">Barangay Clearance (Item 9)</option>
                                  <option value="Real Property Tax Clearance">Real Property Tax Clearance (Item 7)</option>
                                  <option value="Community Tax Certificate (Cedula)">Community Tax Certificate / Cedula (Item 8)</option>
                                  <option value="Zoning Clearance">Zoning Clearance (Item 3)</option>
                                  <option value="Locational Clearance">Locational Clearance (Item 4)</option>
                                  <option value="Occupancy Permit">Occupancy Permit (Item 5)</option>
                                  <option value="CENRO Business Clearance">CENRO Business Clearance (Item 6)</option>
                                  <option value="Sanitary Permit">Sanitary Permit (Item 13)</option>
                                  <option value="Stall Clearance">Public Market Stall Clearance (Item 12)</option>
                                  <option value="Representative Authorization & IDs">Representative Authorization & IDs</option>
                                  <option value="Other">Other / Specific Clearance</option>
                                </select>
                              </div>

                              {selectedDocTitle === 'Other' && (
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-500 block mb-1">Document Description:</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Water District Clearance"
                                    value={customDocTitle}
                                    onChange={(e) => setCustomDocTitle(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                                  />
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-emerald-400 bg-white hover:bg-emerald-50 cursor-pointer transition-all">
                                <Upload className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-semibold text-emerald-800">
                                  {isUploading 
                                    ? 'Uploading to BPLO Portal...' 
                                    : replacingDoc 
                                      ? `Select Replacement File for "${selectedDocTitle}" (PDF, JPG, PNG)`
                                      : 'Select File to Upload (PDF, JPG, PNG)'}
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleUploadAdditionalDoc(e.target.files[0]);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Existing Documents List (Cards with Accept / Reject status and reason) */}
                        {docsList.length > 0 ? (
                          <div className="space-y-2 mt-3">
                            {docsList.map((doc, i) => {
                              const isAccepted = doc.status === 'accepted' || (doc.isVerified && doc.status !== 'rejected');
                              const isRejected = doc.status === 'rejected';
                              const isPending = !isAccepted && !isRejected;

                              return (
                                <div 
                                  key={i}
                                  className={`p-3 rounded-xl border transition-all ${
                                    isRejected 
                                      ? 'border-rose-300 bg-rose-50/40 shadow-2xs' 
                                      : isAccepted 
                                        ? 'border-emerald-200 bg-emerald-50/20' 
                                        : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        isRejected 
                                          ? 'bg-rose-100 text-rose-600' 
                                          : isAccepted 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        <FileText className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-slate-800 text-xs truncate">
                                            {doc.title || doc.fileName || 'Attached Document'}
                                          </span>
                                        </div>
                                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                                          File: {doc.fileName || 'Scanned File'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                      {doc.cloudinaryUrl ? (
                                        <a
                                          href={doc.cloudinaryUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors mr-1"
                                        >
                                          <span>View</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ) : (
                                        <span className="text-[11px] text-gray-400 italic mr-1">Hardcopy</span>
                                      )}

                                      {isAccepted && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          <Check className="w-2.5 h-2.5 text-emerald-700" />
                                          <span>Accepted</span>
                                        </span>
                                      )}

                                      {isRejected && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                          <X className="w-2.5 h-2.5 text-rose-700" />
                                          <span>Rejected</span>
                                        </span>
                                      )}

                                      {isPending && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                          <Clock className="w-2.5 h-2.5 text-amber-700" />
                                          <span>Under Evaluation</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* If Rejected: Show Evaluator's Reason for Rejection and Re-upload Action */}
                                  {isRejected && (
                                    <div className="mt-2.5 pt-2.5 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-rose-100/40 -mx-3 -mb-3 p-3 rounded-b-xl">
                                      <div className="text-xs text-rose-950 flex-1">
                                        <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800">
                                          Evaluator Rejection Reason:
                                        </span>
                                        <p className="mt-0.5 text-xs text-rose-900 font-medium">
                                          {doc.rejectionReason || 'Document did not meet BPLO compliance standards. Please provide a clear and valid copy.'}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplacingDoc(doc);
                                          const standardTitles = [
                                            'DTI Certificate of Registration',
                                            'SEC Registration Certificate',
                                            'CDA Registration Certificate',
                                            'Notarized Contract of Lease',
                                            "Lessor's Business Permit",
                                            'Barangay Business Clearance',
                                            'Real Property Tax Clearance',
                                            'Community Tax Certificate (Cedula)',
                                            'Zoning Clearance',
                                            'Locational Clearance',
                                            'Occupancy Permit',
                                            'CENRO Business Clearance',
                                            'Sanitary Permit',
                                            'Stall Clearance',
                                            'Representative Authorization & IDs'
                                          ];
                                          if (standardTitles.includes(doc.title)) {
                                            setSelectedDocTitle(doc.title);
                                          } else {
                                            setSelectedDocTitle('Other');
                                            setCustomDocTitle(doc.title || '');
                                          }
                                          setShowUploadDrawer(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
                                      >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Re-upload / Replace</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic mt-2">No documents attached yet. Click &apos;Upload / Update Document&apos; above to submit your requirements.</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons: Edit Application Form & View Receipt */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-200">
                {onEditApplication && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditApplication(applicationData);
                      if (onClose) onClose();
                    }}
                    className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                    title="Open back form to edit information"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Application Form</span>
                  </button>
                )}

                {onViewReceipt && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewReceipt(applicationData);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-full border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View / Print Acknowledgement Receipt</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs">Enter your application reference number above to check real-time processing status.</p>
            </div>
          )}
        </div>

        {/* Page Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Anti-Red Tape Authority • RA 11032 eBOSS Citizen Tracking Portal</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              {isEvaluationAdmin ? 'Back to Dashboard' : 'Back to Application Form'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
