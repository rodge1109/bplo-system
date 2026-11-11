import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  Eye, 
  Printer, 
  DollarSign, 
  Award, 
  Check, 
  X, 
  XCircle,
  RefreshCw, 
  Building2, 
  User, 
  MapPin, 
  Calendar,
  FileCheck2,
  FileSpreadsheet,
  BadgeAlert,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Upload,
  Copy,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  CheckSquare,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Calculator,
  Sparkles,
  Save
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { TENANTS } from '../../constants/tenants';
import BusinessPermitViewModal from './BusinessPermitViewModal';
import { getArtaRequirements } from '../documents/ArtaDocumentUpload';

export const DEFAULT_ASSESSMENT_CHARGES = [
  { id: 'lbt', description: 'Local Business Tax (LBT)', category: 'Local Tax', amount: 1250.00, isRegulatory: false },
  { id: 'mayors_fee', description: "Mayor's Permit Fee", category: 'Regulatory Fee', amount: 500.00, isRegulatory: true },
  { id: 'garbage_fee', description: 'Garbage & Environmental Management Fee', category: 'Regulatory Fee', amount: 300.00, isRegulatory: true },
  { id: 'sanitary_fee', description: 'Sanitary Inspection Fee', category: 'Regulatory Fee', amount: 250.00, isRegulatory: true },
  { id: 'fsic_fee', description: 'Fire Safety Inspection Fee (FSIC 15% to BFP)', category: 'Regulatory Fee', amount: 345.00, isRegulatory: false, isFsic: true },
  { id: 'plate_fee', description: 'Business Plate & QR Sticker Fee', category: 'Regulatory Fee', amount: 200.00, isRegulatory: true }
];

export default function AdminEvaluationDashboard({
  currentUser,
  activeTenant,
  onSwitchToApplicantView
}) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('ALL');
  
  // Review Drawer state
  const [selectedApp, setSelectedApp] = useState(null);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents', 'clearances', 'assessment', 'release'
  const [checklistFilter, setChecklistFilter] = useState('all'); // 'all', 'lacking', 'attached'
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [rejectionDrafts, setRejectionDrafts] = useState({});

  // Payment & Assessment Form State
  const [orNumberInput, setOrNumberInput] = useState('');
  const [assessmentCharges, setAssessmentCharges] = useState(DEFAULT_ASSESSMENT_CHARGES);
  const [editingChargeId, setEditingChargeId] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', category: 'Regulatory Fee', amount: '' });
  const [isAddingCharge, setIsAddingCharge] = useState(false);
  const [newChargeForm, setNewChargeForm] = useState({
    description: '',
    category: 'Regulatory Fee',
    amount: ''
  });

  // Released Permit View Modal
  const [releasedPermit, setReleasedPermit] = useState(null);

  // Fetch applications from Supabase + localStorage cache
  const fetchApplications = async () => {
    setIsLoading(true);
    let loaded = [];

    try {
      // 1. Fetch from Supabase
      const { data, error } = await supabase
        .from('bplo_application')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        loaded = data.map(app => {
          let docs = Array.isArray(app.uploaded_documents) && app.uploaded_documents.length > 0 
            ? app.uploaded_documents 
            : [];
          
          if (docs.length === 0 && app.reference_no) {
            try {
              const directDocs = localStorage.getItem(`bplo_docs_${app.reference_no}`);
              if (directDocs) docs = JSON.parse(directDocs);
            } catch (e) {}
          }

          return {
            ...app,
            referenceNo: app.reference_no,
            applicantName: `${app.taxpayer_first_name || ''} ${app.taxpayer_last_name || ''}`.trim() || app.applicant_signature_name || 'Applicant',
            businessName: app.business_name,
            applicationType: app.application_type || 'New',
            typeOfOrganization: app.org_type || app.type_of_organization || 'Single',
            businessAddress: `${app.bus_house_bldg_no || ''} ${app.bus_street || ''} Brgy. ${app.bus_barangay || ''}, ${app.bus_city_municipality || 'City of Bogo'}`.trim(),
            isRented: Boolean(app.is_rented || app.place_of_business_rented),
            isMarketStall: Boolean(app.is_market_stall),
            isFranchisee: Boolean(app.is_franchisee),
            isRepresentative: Boolean(app.is_representative),
            specialBusinessTypes: app.special_business_types || [],
            documents: docs,
            submittedAt: app.created_at || app.date_of_application,
            status: app.status || 'Pending'
          };
        });
      }
    } catch (err) {
      console.warn('Supabase fetch notice:', err);
    }

    // 2. Merge with recent local submissions & hydrate documents and metadata
    try {
      const stored = localStorage.getItem('bplo_recent_applications');
      if (stored) {
        const localItems = JSON.parse(stored);
        localItems.forEach(local => {
          const existing = loaded.find(item => (item.referenceNo || '').toLowerCase() === (local.referenceNo || '').toLowerCase());
          if (existing) {
            if (local.businessName) existing.businessName = local.businessName;
            if (local.applicantName) existing.applicantName = local.applicantName;
            if (local.businessAddress) existing.businessAddress = local.businessAddress;
            if (local.documents && local.documents.length > 0) existing.documents = local.documents;
            if (local.isRented !== undefined) existing.isRented = local.isRented;
            if (local.isMarketStall !== undefined) existing.isMarketStall = local.isMarketStall;
            if (local.isFranchisee !== undefined) existing.isFranchisee = local.isFranchisee;
            if (local.isRepresentative !== undefined) existing.isRepresentative = local.isRepresentative;
            if (local.specialBusinessTypes) existing.specialBusinessTypes = local.specialBusinessTypes;
            if (local.typeOfOrganization) existing.typeOfOrganization = local.typeOfOrganization;
            if (local.business_activities) existing.business_activities = local.business_activities;
            if (local.businessActivities) existing.businessActivities = local.businessActivities;
          } else {
            loaded.unshift(local);
          }
        });
      }
    } catch (e) {
      console.warn(e);
    }

    // 3. Fallback dummy applications if no submissions exist yet (for demo review)
    if (loaded.length === 0) {
      loaded = [
        {
          id: 'demo-1',
          referenceNo: 'BOGO-DEMO-0192',
          tenant_code: 'BOGO',
          businessName: 'Bogo Harbor Fresh Seafoods',
          applicantName: 'Kiara Martinez',
          applicationType: 'New',
          typeOfOrganization: 'Single',
          businessAddress: 'Brgy. Sto. Rosario, City of Bogo, Cebu',
          status: 'Under BPLO Evaluation',
          submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          documents: [
            { id: 'dti', title: 'DTI Certificate of Registration', fileName: 'dti_bogo_harbor.pdf', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
            { id: 'lease', title: 'Notarized Contract of Lease', fileName: 'lease_agreement.pdf', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
            { id: 'sketch', title: 'Vicinity & Location Map', fileName: 'sketch_map.png', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' }
          ]
        },
        {
          id: 'demo-2',
          referenceNo: 'BOGO-DEMO-0188',
          tenant_code: 'BOGO',
          businessName: 'Northern Cebu Logistics Hub',
          applicantName: 'Antonio Silva',
          applicationType: 'Renewal',
          typeOfOrganization: 'Corporation',
          businessAddress: 'Brgy. Gairan, City of Bogo, Cebu',
          status: 'Payment Pending',
          submittedAt: new Date(Date.now() - 3600000 * 26).toISOString(),
          documents: [
            { id: 'afs', title: 'Audited Financial Statements (BIR)', fileName: 'bir_afs_2025.pdf', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
            { id: 'permit', title: 'Previous Mayor’s Permit (2025)', fileName: 'mayor_permit_2025.pdf', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' }
          ]
        }
      ];
    }

    setApplications(loaded);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Update status handler
  const handleUpdateStatus = async (newStatus, extraData = {}) => {
    if (!selectedApp) return;
    setIsUpdating(true);

    const updatedApp = {
      ...selectedApp,
      status: newStatus,
      ...extraData,
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Update in Supabase (with fallback if custom columns are missing)
      if (selectedApp.id && !String(selectedApp.id).startsWith('demo')) {
        const payload = { status: newStatus, ...extraData };
        const { error: updateErr } = await supabase
          .from('bplo_application')
          .update(payload)
          .eq('id', selectedApp.id);

        if (updateErr) {
          console.warn('Initial update warning, retrying with fallback:', updateErr);
          const fallbackData = { ...payload };
          delete fallbackData.assessment_items;
          const { error: retryErr } = await supabase
            .from('bplo_application')
            .update(fallbackData)
            .eq('id', selectedApp.id);

          if (retryErr) {
            await supabase.from('bplo_application').update({ status: newStatus }).eq('id', selectedApp.id);
          }
        }
      }

      // 2. Update local state
      setApplications(prev => prev.map(a => 
        a.referenceNo === selectedApp.referenceNo ? updatedApp : a
      ));
      setSelectedApp(updatedApp);

      // 3. Update localStorage recent applications
      try {
        const stored = JSON.parse(localStorage.getItem('bplo_recent_applications') || '[]');
        const updatedStored = stored.map(a => 
          a.referenceNo === selectedApp.referenceNo ? { ...a, status: newStatus, ...extraData } : a
        );
        localStorage.setItem('bplo_recent_applications', JSON.stringify(updatedStored));
      } catch (e) {
        console.warn(e);
      }

      setToastMessage(`Application status updated to "${newStatus}"!`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Issue Official Mayor's Permit
  const handleIssuePermit = async () => {
    const permitNumber = `BP-${selectedApp.tenant_code || 'BOGO'}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const plateNumber = `PL-${selectedApp.tenant_code || 'BOGO'}-${Math.floor(10000 + Math.random() * 90000)}`;
    const orNumber = orNumberInput.trim() || `OR-${Math.floor(100000 + Math.random() * 900000)}`;

    const permitPayload = {
      ...selectedApp,
      permitNumber,
      plateNumber,
      orNumber,
      status: 'Permit Issued',
      issuedAtFormatted: new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })
    };

    await handleUpdateStatus('Permit Issued', {
      permit_no: permitNumber,
      plate_no: plateNumber,
      or_no: orNumber
    });

    setReleasedPermit(permitPayload);
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      (app.referenceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.applicantName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTenant = tenantFilter === 'ALL' || (app.tenant_code || 'BOGO') === tenantFilter;

    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = (app.status || '').toLowerCase().includes('evaluation') || (app.status || '').toLowerCase() === 'pending';
    else if (statusFilter === 'verified') matchesStatus = (app.status || '').toLowerCase().includes('verified');
    else if (statusFilter === 'assessed') matchesStatus = (app.status || '').toLowerCase().includes('payment') || (app.status || '').toLowerCase().includes('assessed');
    else if (statusFilter === 'released') matchesStatus = (app.status || '').toLowerCase().includes('permit') || (app.status || '').toLowerCase().includes('approved');

    return matchesSearch && matchesTenant && matchesStatus;
  });

  // Calculate statistics
  const totalCount = applications.length;
  const pendingCount = applications.filter(a => (a.status || '').toLowerCase().includes('evaluation') || (a.status || '').toLowerCase() === 'pending').length;
  const assessedCount = applications.filter(a => (a.status || '').toLowerCase().includes('payment') || (a.status || '').toLowerCase().includes('assessed')).length;
  const releasedCount = applications.filter(a => (a.status || '').toLowerCase().includes('permit') || (a.status || '').toLowerCase().includes('approved')).length;

  // Total assessment calculation
  const totalAssessmentAmount = assessmentCharges.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // Load & hydrate assessment charges whenever selectedApp changes
  useEffect(() => {
    if (!selectedApp) return;

    // 1. Check if application object has assessment_items or assessmentItems
    const saved = selectedApp.assessment_items || selectedApp.assessmentItems;
    if (Array.isArray(saved) && saved.length > 0) {
      setAssessmentCharges(saved);
      return;
    }

    // 2. Check localStorage
    try {
      const cached = localStorage.getItem(`bplo_assessment_${selectedApp.referenceNo}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssessmentCharges(parsed);
          return;
        }
      }
    } catch (e) {}

    // 3. Dynamic baseline based on application's declared activities & capitalization
    let items = DEFAULT_ASSESSMENT_CHARGES.map(c => ({ ...c }));
    const activities = selectedApp.business_activities || selectedApp.businessActivities || [];
    const totalCap = activities.reduce((sum, a) => sum + (parseFloat(a.capitalization) || 0), 0);
    const totalGross = activities.reduce((sum, a) => sum + (parseFloat(a.gross_essential || a.grossEssential) || 0) + (parseFloat(a.gross_non_essential || a.grossNonEssential) || 0), 0);

    if ((selectedApp.applicationType === 'New' || selectedApp.application_type === 'New') && totalCap > 0) {
      const calculatedLbt = Math.max(500, Math.round(totalCap * 0.0125));
      items = items.map(c => c.id === 'lbt' ? { 
        ...c, 
        amount: calculatedLbt, 
        description: `Local Business Tax (LBT - 1.25% on ₱${totalCap.toLocaleString()} Capital)` 
      } : c);
    } else if ((selectedApp.applicationType === 'Renewal' || selectedApp.application_type === 'Renewal') && totalGross > 0) {
      const calculatedLbt = Math.max(750, Math.round(totalGross * 0.015));
      items = items.map(c => c.id === 'lbt' ? { 
        ...c, 
        amount: calculatedLbt, 
        description: `Local Business Tax (LBT - on ₱${totalGross.toLocaleString()} Gross)` 
      } : c);
    }

    // 15% FSIC calculation
    const nonFsic = items.filter(c => !c.isFsic).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const calculatedFsic = Math.round(nonFsic * 0.15 * 100) / 100;
    items = items.map(c => c.id === 'fsic_fee' ? { ...c, amount: calculatedFsic } : c);

    setAssessmentCharges(items);
  }, [selectedApp?.referenceNo]);

  // Requirements checklist & completeness calculation for the currently selected application
  const expectedRequirements = selectedApp ? getArtaRequirements(selectedApp) : [];

  // Match an expected requirement to an attached document
  const getAttachedDoc = (req) => {
    if (!selectedApp || !selectedApp.documents || selectedApp.documents.length === 0) return null;
    const docs = selectedApp.documents;
    
    // 1. Direct ID / Code match
    let match = docs.find(d => 
      (d.docId && (d.docId === req.id || d.docId === req.code)) ||
      (d.id && (d.id === req.id || d.id === req.code))
    );
    if (match) return match;

    // 2. Title / keyword matching
    const reqTitle = (req.title || '').toLowerCase().trim();
    match = docs.find(d => {
      const docTitle = (d.title || '').toLowerCase().trim();
      const fileName = (d.fileName || '').toLowerCase().trim();
      if (!docTitle && !fileName) return false;

      if (docTitle === reqTitle) return true;
      if (docTitle && (docTitle.includes(reqTitle) || reqTitle.includes(docTitle))) return true;

      // Common item heuristics
      if (req.id === 'app_form' && (docTitle.includes('form') || docTitle.includes('unified') || fileName.includes('form') || fileName.includes('soa'))) return true;
      if (req.id === 'business_registration' && (docTitle.includes('dti') || docTitle.includes('sec') || docTitle.includes('cda') || fileName.includes('dti') || fileName.includes('sec'))) return true;
      if (req.id === 'zoning_clearance' && (docTitle.includes('zoning') || fileName.includes('zoning'))) return true;
      if (req.id === 'locational_clearance' && (docTitle.includes('locat') || fileName.includes('locat'))) return true;
      if (req.id === 'occupancy_permit' && (docTitle.includes('occupan') || fileName.includes('occupan'))) return true;
      if (req.id === 'cenro_clearance' && (docTitle.includes('cenro') || docTitle.includes('environ') || fileName.includes('cenro'))) return true;
      if (req.id === 'rpt_clearance' && (docTitle.includes('rpt') || docTitle.includes('real property') || fileName.includes('rpt'))) return true;
      if (req.id === 'cedula' && (docTitle.includes('cedula') || docTitle.includes('ctc') || fileName.includes('cedula'))) return true;
      if (req.id === 'barangay_clearance' && (docTitle.includes('barangay') || docTitle.includes('brgy') || fileName.includes('brgy') || fileName.includes('barangay'))) return true;
      if (req.id === 'lease_contract' && (docTitle.includes('lease') || fileName.includes('lease'))) return true;
      if (req.id === 'lessor_permit' && (docTitle.includes('lessor') || fileName.includes('lessor'))) return true;
      if (req.id === 'stall_clearance' && (docTitle.includes('stall') || fileName.includes('stall'))) return true;
      if (req.id === 'sanitary_permit' && (docTitle.includes('sanitary') || docTitle.includes('health') || fileName.includes('sanitary'))) return true;
      if (req.id === 'bplo_inspection' && (docTitle.includes('inspection') || fileName.includes('inspection'))) return true;
      if (req.id === 'fsic' && (docTitle.includes('fsic') || docTitle.includes('fire') || fileName.includes('fsic'))) return true;
      if (req.id === 'gross_sales_basis' && (docTitle.includes('gross') || docTitle.includes('itr') || docTitle.includes('afs') || fileName.includes('itr'))) return true;
      if (req.id === 'previous_permit' && (docTitle.includes('previous') || docTitle.includes('permit') || fileName.includes('permit'))) return true;

      return false;
    });

    return match || null;
  };

  // Find extra documents that don't match any standard requirement in expectedRequirements
  const unassignedDocuments = (selectedApp?.documents || []).filter(doc => {
    return !expectedRequirements.some(req => {
      const match = getAttachedDoc(req);
      return match && (match === doc || (match.docId && match.docId === doc.docId) || (match.fileName && match.fileName === doc.fileName));
    });
  });

  // Metrics
  const mandatoryRequirements = expectedRequirements.filter(r => r.isMandatory);
  const totalMandatory = mandatoryRequirements.length;
  const attachedMandatory = mandatoryRequirements.filter(r => {
    const doc = getAttachedDoc(r);
    return doc && doc.status !== 'rejected';
  });
  const lackingMandatory = mandatoryRequirements.filter(r => {
    const doc = getAttachedDoc(r);
    return !doc || doc.status === 'rejected';
  });
  const attachedAll = expectedRequirements.filter(r => {
    const doc = getAttachedDoc(r);
    return doc && doc.status !== 'rejected';
  });
  const lackingAll = expectedRequirements.filter(r => {
    const doc = getAttachedDoc(r);
    return !doc || doc.status === 'rejected';
  });

  const completenessPercentage = totalMandatory > 0
    ? Math.round((attachedMandatory.length / totalMandatory) * 100)
    : 100;
  const isSubmissionComplete = lackingMandatory.length === 0;

  // Filtered requirements to display in list
  const displayedRequirements = expectedRequirements.filter(req => {
    const doc = getAttachedDoc(req);
    const isAttached = Boolean(doc && doc.status !== 'rejected');
    if (checklistFilter === 'attached') return isAttached;
    if (checklistFilter === 'lacking') return !isAttached;
    return true; // 'all'
  });

  // Copy Deficiency Notice for SMS / Email to Applicant
  const handleCopyDeficiencyNotice = () => {
    if (!selectedApp) return;
    const rejectedDocsList = (selectedApp.documents || []).filter(d => d.status === 'rejected');
    if (lackingAll.length === 0 && rejectedDocsList.length === 0) {
      setToastMessage('All requirements are complete! No deficiencies to report.');
      setTimeout(() => setToastMessage(''), 2500);
      return;
    }

    const rejectedSection = rejectedDocsList.length > 0 ? `
REJECTED DOCUMENTS (RE-UPLOAD REQUIRED):
${rejectedDocsList.map((d, idx) => `${idx + 1}. ${d.title || d.fileName}
   - Reason for Rejection: ${d.rejectionReason || 'Did not meet compliance standards'}
   - Required Action: Upload corrected / valid document via Applicant Portal`).join('\n\n')}
` : '';

    const text = `[CITY OF BOGO BPLO - DOCUMENTARY DEFICIENCY NOTICE]
Application Ref: ${selectedApp.referenceNo}
Business Name: ${selectedApp.businessName}
Applicant: ${selectedApp.applicantName}
Evaluation Date: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}

COMPLETENESS SUMMARY:
Status: INCOMPLETE (${attachedMandatory.length} of ${totalMandatory} Mandatory Requirements Complied - ${completenessPercentage}%)
Total Deficiencies: ${lackingAll.length} item(s) lacking or rejected
${rejectedSection}
LIST OF LACKING / DEFICIENT DOCUMENTS TO BE SUBMITTED:
${lackingAll.map((item, idx) => {
  const doc = getAttachedDoc(item);
  const isRej = doc && doc.status === 'rejected';
  return `${idx + 1}. Item ${item.itemNo}: ${item.title}
   - Issuing Agency: ${item.issuingOfficeShort || item.issuingOffice}
   - Required Copy: ${item.copyType}${item.isMandatory ? ' [MANDATORY]' : ' [TO FOLLOW]'}${isRej ? ` [REJECTED: ${doc.rejectionReason || 'Please replace'}]` : ''}`;
}).join('\n\n')}

INSTRUCTIONS FOR APPLICANT:
1. Online Submission: Log in to the BPLO Portal, open Application Tracker, search Ref No "${selectedApp.referenceNo}", view the rejected/lacking documents and reason, and click "Re-upload / Replace" or "Upload / Update Document".
2. In-Person Submission: You may also present physical copies directly to the BPLO eBOSS Counter at Bogo City Hall.`;

    navigator.clipboard.writeText(text);
    setToastMessage('Deficiency notice copied to clipboard! Ready to send via SMS or Email.');
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Staff upload for a specific requirement
  const handleAttachRequirementDoc = (req, file) => {
    if (!file || !selectedApp) return;
    const newDoc = {
      docId: req.id,
      id: req.id,
      code: req.code,
      itemNo: req.itemNo,
      title: req.title,
      fileName: file.name,
      fileSize: file.size,
      cloudinaryUrl: URL.createObjectURL(file),
      isLocalPreview: true,
      isVerified: true,
      uploadedAt: new Date().toISOString()
    };

    const existingDocs = selectedApp.documents || [];
    const updatedDocs = [
      ...existingDocs.filter(d => (d.docId !== req.id && d.id !== req.id && d.code !== req.code)),
      newDoc
    ];

    const updatedApp = { ...selectedApp, documents: updatedDocs };
    setSelectedApp(updatedApp);
    setApplications(prev => prev.map(a => a.referenceNo === selectedApp.referenceNo ? updatedApp : a));
    try {
      localStorage.setItem(`bplo_docs_${selectedApp.referenceNo}`, JSON.stringify(updatedDocs));
      const recents = JSON.parse(localStorage.getItem('bplo_recent_applications') || '[]');
      const updatedRecents = recents.map(r => r.referenceNo === selectedApp.referenceNo ? { ...r, documents: updatedDocs } : r);
      localStorage.setItem('bplo_recent_applications', JSON.stringify(updatedRecents));
    } catch(err) {}

    setToastMessage(`Attached file for "${req.title}" and stamped as verified!`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Mark physical copy verified over the counter
  const handleMarkPhysicalReceived = (req) => {
    if (!selectedApp) return;
    const newDoc = {
      docId: req.id,
      id: req.id,
      code: req.code,
      itemNo: req.itemNo,
      title: req.title,
      fileName: `Physical Hardcopy Verified at Counter (${req.copyType})`,
      fileSize: 0,
      cloudinaryUrl: '',
      isPhysicalCopy: true,
      isLocalPreview: true,
      isVerified: true,
      uploadedAt: new Date().toISOString()
    };

    const existingDocs = selectedApp.documents || [];
    const updatedDocs = [
      ...existingDocs.filter(d => (d.docId !== req.id && d.id !== req.id && d.code !== req.code)),
      newDoc
    ];

    const updatedApp = { ...selectedApp, documents: updatedDocs };
    setSelectedApp(updatedApp);
    setApplications(prev => prev.map(a => a.referenceNo === selectedApp.referenceNo ? updatedApp : a));
    try {
      localStorage.setItem(`bplo_docs_${selectedApp.referenceNo}`, JSON.stringify(updatedDocs));
      const recents = JSON.parse(localStorage.getItem('bplo_recent_applications') || '[]');
      const updatedRecents = recents.map(r => r.referenceNo === selectedApp.referenceNo ? { ...r, documents: updatedDocs } : r);
      localStorage.setItem('bplo_recent_applications', JSON.stringify(updatedRecents));
    } catch(err) {}

    setToastMessage(`Marked "${req.title}" as physically received over the counter!`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Helper to persist document updates
  const saveUpdatedDocuments = (updatedDocs) => {
    if (!selectedApp) return;
    const updatedApp = { ...selectedApp, documents: updatedDocs };
    setSelectedApp(updatedApp);
    setApplications(prev => prev.map(a => a.referenceNo === selectedApp.referenceNo ? updatedApp : a));
    try {
      localStorage.setItem(`bplo_docs_${selectedApp.referenceNo}`, JSON.stringify(updatedDocs));
      const recents = JSON.parse(localStorage.getItem('bplo_recent_applications') || '[]');
      const updatedRecents = recents.map(r => r.referenceNo === selectedApp.referenceNo ? { ...r, documents: updatedDocs } : r);
      localStorage.setItem('bplo_recent_applications', JSON.stringify(updatedRecents));
    } catch(err) {
      console.warn('Document storage error:', err);
    }
  };

  // Accept a single document
  const handleAcceptDoc = (doc) => {
    if (!selectedApp || !doc) return;
    const updatedDocs = (selectedApp.documents || []).map(d => {
      const isMatch = d === doc || (d.docId && d.docId === doc.docId) || (d.fileName && d.fileName === doc.fileName);
      if (isMatch) {
        return { 
          ...d, 
          status: 'accepted',
          isVerified: true, 
          rejectionReason: '',
          evaluatedAt: new Date().toISOString()
        };
      }
      return d;
    });

    saveUpdatedDocuments(updatedDocs);
    setToastMessage(`Document "${doc.title || doc.fileName}" marked as ACCEPTED!`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Reject a single document
  const handleRejectDoc = (doc, initialReason = '') => {
    if (!selectedApp || !doc) return;
    const docKey = doc.docId || doc.id || doc.fileName;
    const existingReason = initialReason !== undefined ? initialReason : (doc.rejectionReason || '');

    const updatedDocs = (selectedApp.documents || []).map(d => {
      const isMatch = d === doc || (d.docId && d.docId === doc.docId) || (d.fileName && d.fileName === doc.fileName);
      if (isMatch) {
        return { 
          ...d, 
          status: 'rejected',
          isVerified: false, 
          rejectionReason: existingReason,
          evaluatedAt: new Date().toISOString()
        };
      }
      return d;
    });

    saveUpdatedDocuments(updatedDocs);
    if (docKey) {
      setRejectionDrafts(prev => ({ ...prev, [docKey]: existingReason }));
    }
    setToastMessage(`Document marked as REJECTED. Please enter rejection reason and click Save.`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Save rejection reason for a document
  const handleSaveRejectionReason = (doc, reason, docKey) => {
    if (!selectedApp || !doc) return;
    const finalReason = (reason !== undefined ? reason : (rejectionDrafts[docKey] || '')).trim();
    if (!finalReason) {
      alert('Please enter or select a rejection reason before saving.');
      return;
    }

    const updatedDocs = (selectedApp.documents || []).map(d => {
      const isMatch = d === doc || (d.docId && d.docId === doc.docId) || (d.fileName && d.fileName === doc.fileName);
      if (isMatch) {
        return { 
          ...d, 
          status: 'rejected',
          isVerified: false, 
          rejectionReason: finalReason,
          evaluatedAt: new Date().toISOString()
        };
      }
      return d;
    });

    saveUpdatedDocuments(updatedDocs);
    if (docKey) {
      setRejectionDrafts(prev => ({ ...prev, [docKey]: finalReason }));
    }
    setToastMessage(`✓ Rejection reason saved: "${finalReason}"!`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Update rejection reason for a document directly
  const handleUpdateRejectionReason = (doc, reason) => {
    if (!selectedApp || !doc) return;
    const updatedDocs = (selectedApp.documents || []).map(d => {
      const isMatch = d === doc || (d.docId && d.docId === doc.docId) || (d.fileName && d.fileName === doc.fileName);
      if (isMatch) {
        return { 
          ...d, 
          status: 'rejected',
          isVerified: false, 
          rejectionReason: reason 
        };
      }
      return d;
    });

    saveUpdatedDocuments(updatedDocs);
  };

  // Reset document evaluation back to pending
  const handleResetDocStatus = (doc) => {
    if (!selectedApp || !doc) return;
    const updatedDocs = (selectedApp.documents || []).map(d => {
      const isMatch = d === doc || (d.docId && d.docId === doc.docId) || (d.fileName && d.fileName === doc.fileName);
      if (isMatch) {
        return { 
          ...d, 
          status: 'pending',
          isVerified: false, 
          rejectionReason: '' 
        };
      }
      return d;
    });

    saveUpdatedDocuments(updatedDocs);
    setToastMessage(`Document "${doc.title || doc.fileName}" reset to Pending Review.`);
    setTimeout(() => setToastMessage(''), 2000);
  };

  // Accept all documents at once
  const handleAcceptAllDocs = () => {
    if (lackingMandatory.length > 0) {
      const confirmMsg = `WARNING: ${lackingMandatory.length} mandatory document(s) are still lacking or rejected for this application:\n\n` +
        lackingMandatory.map(m => `• Item ${m.itemNo}: ${m.title}`).join('\n') +
        `\n\nUnder RA 11032, incomplete submissions should not be cleared without justification. Do you still want to proceed and accept all attached documents?`;
      if (!window.confirm(confirmMsg)) return;
    }

    const updatedDocs = (selectedApp.documents || []).map(d => ({ 
      ...d, 
      status: 'accepted',
      isVerified: true,
      rejectionReason: '',
      evaluatedAt: new Date().toISOString()
    }));
    saveUpdatedDocuments(updatedDocs);
    handleUpdateStatus('Documents Verified', { documents: updatedDocs });
    setToastMessage('All submitted documents accepted!');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleStampAllVerified = handleAcceptAllDocs;

  // Assessment Charges Management Handlers (Add, Edit, Delete, Recalculate, Reset)
  const persistCharges = (updatedCharges) => {
    setAssessmentCharges(updatedCharges);
    if (selectedApp) {
      const newTotal = updatedCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
      const updatedApp = { 
        ...selectedApp, 
        assessment_items: updatedCharges,
        assessmentItems: updatedCharges,
        total_assessed: newTotal
      };
      setSelectedApp(updatedApp);
      setApplications(prev => prev.map(a => a.referenceNo === selectedApp.referenceNo ? updatedApp : a));
      try {
        localStorage.setItem(`bplo_assessment_${selectedApp.referenceNo}`, JSON.stringify(updatedCharges));
        const recents = JSON.parse(localStorage.getItem('bplo_recent_applications') || '[]');
        const updatedRecents = recents.map(r => r.referenceNo === selectedApp.referenceNo ? { 
          ...r, 
          assessment_items: updatedCharges,
          assessmentItems: updatedCharges,
          total_assessed: newTotal
        } : r);
        localStorage.setItem('bplo_recent_applications', JSON.stringify(updatedRecents));
      } catch (e) {}
    }
  };

  const handleAddCharge = (e) => {
    e?.preventDefault();
    if (!newChargeForm.description.trim()) {
      alert('Please enter a fee description.');
      return;
    }
    const amt = parseFloat(newChargeForm.amount);
    if (isNaN(amt) || amt < 0) {
      alert('Please enter a valid non-negative amount.');
      return;
    }

    const newCharge = {
      id: `charge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      description: newChargeForm.description.trim(),
      category: newChargeForm.category || 'Regulatory Fee',
      amount: amt,
      isRegulatory: newChargeForm.category === 'Regulatory Fee'
    };

    const updated = [...assessmentCharges, newCharge];
    persistCharges(updated);
    setNewChargeForm({ description: '', category: 'Regulatory Fee', amount: '' });
    setIsAddingCharge(false);
    setToastMessage(`Added charge "${newCharge.description}"!`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleStartEdit = (charge) => {
    setEditingChargeId(charge.id);
    setEditForm({
      description: charge.description,
      category: charge.category || 'Regulatory Fee',
      amount: String(charge.amount)
    });
  };

  const handleSaveEdit = (chargeId) => {
    if (!editForm.description.trim()) {
      alert('Fee description cannot be empty.');
      return;
    }
    const amt = parseFloat(editForm.amount);
    if (isNaN(amt) || amt < 0) {
      alert('Please enter a valid non-negative amount.');
      return;
    }

    const updated = assessmentCharges.map(c => {
      if (c.id === chargeId) {
        return {
          ...c,
          description: editForm.description.trim(),
          category: editForm.category,
          amount: amt
        };
      }
      return c;
    });

    persistCharges(updated);
    setEditingChargeId(null);
    setToastMessage('Charge updated successfully!');
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleCancelEdit = () => {
    setEditingChargeId(null);
  };

  const handleDeleteCharge = (chargeId, description) => {
    if (!window.confirm(`Are you sure you want to remove the charge "${description}" from this assessment?`)) {
      return;
    }
    const updated = assessmentCharges.filter(c => c.id !== chargeId);
    persistCharges(updated);
    setToastMessage(`Removed "${description}" from assessment.`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleRecalculateFsic = () => {
    const otherSum = assessmentCharges.filter(c => !c.isFsic).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const calculatedFsic = Math.round(otherSum * 0.15 * 100) / 100;

    const existingFsic = assessmentCharges.find(c => c.isFsic || c.id === 'fsic_fee');
    let updated;
    if (existingFsic) {
      updated = assessmentCharges.map(c => (c.isFsic || c.id === 'fsic_fee') ? { ...c, amount: calculatedFsic } : c);
    } else {
      updated = [
        ...assessmentCharges,
        {
          id: 'fsic_fee',
          description: 'Fire Safety Inspection Fee (FSIC 15% to BFP)',
          category: 'Regulatory Fee',
          amount: calculatedFsic,
          isFsic: true
        }
      ];
    }

    persistCharges(updated);
    setToastMessage(`FSIC auto-recalculated to ₱${calculatedFsic.toFixed(2)} (15% of other fees)!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleResetCharges = () => {
    if (!window.confirm('Reset this assessment back to the standard baseline fee schedule? Custom modifications will be replaced.')) {
      return;
    }
    persistCharges(DEFAULT_ASSESSMENT_CHARGES.map(c => ({ ...c })));
    setToastMessage('Assessment reset to standard baseline schedule!');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const FEE_PRESETS = [
    { title: 'Signboard / Billboard Fee', category: 'Regulatory Fee', amount: 150 },
    { title: 'Weights & Measures Sealing', category: 'Regulatory Fee', amount: 200 },
    { title: 'Zoning & Land Use Inspection', category: 'Regulatory Fee', amount: 300 },
    { title: 'Engineering Building Inspection', category: 'Regulatory Fee', amount: 250 },
    { title: 'Late Filing Surcharge (25%)', category: 'Penalty / Surcharge', amount: Math.round((assessmentCharges.find(c => c.id === 'lbt')?.amount || 1250) * 0.25) },
    { title: 'Health Card / ID Fee', category: 'Regulatory Fee', amount: 100 }
  ];

  const getDocumentDaysLapsed = (doc, app) => {
    const rawDate = 
      doc?.uploadedAt || 
      doc?.uploaded_at || 
      doc?.created_at || 
      doc?.timestamp || 
      doc?.date || 
      app?.submittedAt || 
      app?.created_at || 
      app?.date_of_application || 
      app?.updated_at;

    if (!rawDate) return '1 day';

    const uploadTime = new Date(rawDate).getTime();
    if (isNaN(uploadTime)) return '1 day';

    const now = Date.now();
    const diffMs = now - uploadTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return '1 day';
    }
    return `${diffDays} days`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 font-['Poppins',sans-serif] text-slate-800">
      
      {!selectedApp ? (
        <>
          {/* Top Banner & ARTA Compliance Badge */}
      <div className="bg-gradient-to-r from-[#0F7535] via-[#159847] to-[#106B32] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg sm:text-xl tracking-tight">
              BPLO Evaluation & eBOSS Administrative Portal
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>RA 11032 Compliant</span>
            </span>
          </div>
          <p className="text-xs text-emerald-100 font-normal">
            Multi-Tenant Business One-Stop Shop (BOSS) Document Verification, Joint Agency Clearances, Tax Assessment & Permit Issuance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchApplications}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/25 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Refresh Applications Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          {onSwitchToApplicantView && (
            <button
              type="button"
              onClick={onSwitchToApplicantView}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-emerald-50 text-[#1B4332] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>+ New Permit Application</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block">Total Queue</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">All Tenants</span>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wide block">Under Evaluation</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-amber-700">{pendingCount}</span>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Step 1 & 2</span>
          </div>
        </div>

        <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-sky-800 uppercase tracking-wide block">Payment Pending</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-sky-700">{assessedCount}</span>
            <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">Step 3 (TOP)</span>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wide block">Permits Released</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700">{releasedCount}</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Completed</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Filings' },
              { id: 'pending', label: 'Under Review' },
              { id: 'verified', label: 'Verified Docs' },
              { id: 'assessed', label: 'Payment Ready' },
              { id: 'released', label: 'Permit Issued' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#159847] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Tenant Filter + Search Bar */}
          <div className="flex items-center gap-2">
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="!w-auto px-4 py-2 border border-slate-300 rounded-full text-xs font-semibold bg-white text-gray-700 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            >
              <option value="ALL">🏛️ All Cities (Multi-Tenant)</option>
              {TENANTS.map(t => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Ref, Business, Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-full text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Main Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#159847] text-white">
              <tr className="text-white font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Ref No.</th>
                <th className="p-3.5">Business / Trade Name</th>
                <th className="p-3.5">Applicant Name</th>
                <th className="p-3.5">City / LGU</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">ARTA Attachments</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app, idx) => {
                  const docsCount = app.documents?.length || 0;
                  const isPermitIssued = (app.status || '').toLowerCase().includes('permit');
                  const isPaymentReady = (app.status || '').toLowerCase().includes('payment');

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-emerald-950">
                        {app.referenceNo}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {app.businessName}
                        <span className="block text-[10px] text-gray-500 font-normal truncate max-w-[180px]">
                          {app.businessAddress}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {app.applicantName}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {app.tenant_code || 'BOGO'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-gray-600">
                          {app.applicationType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <FileCheck2 className="w-3 h-3 text-emerald-600" />
                          <span>{docsCount} Files</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isPermitIssued
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isPaymentReady
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {app.status || 'Under Evaluation'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            let appToReview = { ...app };
                            try {
                              const stored = localStorage.getItem('bplo_recent_applications');
                              if (stored) {
                                const recents = JSON.parse(stored);
                                const match = recents.find(r => r.referenceNo === appToReview.referenceNo);
                                if (match) {
                                  if ((!appToReview.documents || appToReview.documents.length === 0) && match.documents && match.documents.length > 0) {
                                    appToReview.documents = match.documents;
                                  }
                                  if (match.isRented !== undefined) appToReview.isRented = match.isRented;
                                  if (match.isMarketStall !== undefined) appToReview.isMarketStall = match.isMarketStall;
                                  if (match.isFranchisee !== undefined) appToReview.isFranchisee = match.isFranchisee;
                                  if (match.isRepresentative !== undefined) appToReview.isRepresentative = match.isRepresentative;
                                  if (match.specialBusinessTypes) appToReview.specialBusinessTypes = match.specialBusinessTypes;
                                  if (match.typeOfOrganization) appToReview.typeOfOrganization = match.typeOfOrganization;
                                }
                              }
                              if (!appToReview.documents || appToReview.documents.length === 0) {
                                const direct = localStorage.getItem(`bplo_docs_${appToReview.referenceNo}`);
                                if (direct) appToReview.documents = JSON.parse(direct);
                              }
                            } catch (e) {}
                            setSelectedApp(appToReview);
                            setActiveTab('documents');
                            setChecklistFilter('all');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-4 py-1.5 rounded-full bg-[#159847] hover:bg-[#12823c] text-white font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs hover:shadow hover:scale-105"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-xs">No permit applications match your search filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedApp(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-full border border-slate-300 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700" />
            <span>Back to Applications Queue</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>/</span>
            <span>Applications Queue</span>
            <span>/</span>
            <span className="font-mono font-bold text-slate-800">{selectedApp.referenceNo}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
            selectedApp.status === 'Approved' || selectedApp.status === 'Permit Released'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : selectedApp.status === 'Payment Ready' || selectedApp.status === 'Payment Pending'
              ? 'bg-sky-100 text-sky-800 border border-sky-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {selectedApp.status || 'Under Evaluation'}
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedApp(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Close Review"
          >
            Close
          </button>
        </div>
      </div>

      {/* 2. Executive Hero Banner */}
      <div className="bg-gradient-to-r from-[#0F7535] via-[#159847] to-[#106B32] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Soft ambient decorative glow */}
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-lg sm:text-2xl tracking-wide">
              Application Review: {selectedApp.businessName}
            </span>
            <span className="font-mono text-xs sm:text-sm text-emerald-100 font-bold bg-white/15 px-3.5 py-1 rounded-full border border-white/20 backdrop-blur-xs">
              {selectedApp.referenceNo}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-emerald-50 flex-wrap">
            <span>Applicant: <strong className="text-white">{selectedApp.applicantName}</strong></span>
            <span>•</span>
            <span>City / LGU: <strong className="text-white">{selectedApp.tenant_code || activeTenant?.code || 'BOGO'}</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-white">{selectedApp.status}</strong></span>
            <span>•</span>
            <span>Type: <strong className="text-white">{selectedApp.applicationType || 'New'} Application</strong></span>
            <span>•</span>
            <span>Org: <strong className="text-white">{selectedApp.typeOfOrganization || 'Single Proprietorship'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <div className="text-right hidden lg:block bg-black/15 backdrop-blur-xs px-5 py-3 rounded-2xl border border-white/20">
            <span className="text-[10px] text-emerald-100 block uppercase font-bold tracking-wider">Completeness Status</span>
            <span className="text-sm font-extrabold text-white">
              {attachedMandatory.length}/{totalMandatory} Mandatory Complete
            </span>
            <span className="text-[11px] text-amber-200 block font-semibold mt-0.5">
              ({lackingMandatory.length} lacking)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Workflow Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs flex items-center gap-2 text-xs font-semibold overflow-x-auto sticky top-2 z-20 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`py-2.5 px-5 rounded-full flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeTab === 'documents'
              ? 'bg-gradient-to-r from-[#159847] to-[#12823c] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>1. ARTA Documents ({attachedMandatory.length}/{totalMandatory} Complete)</span>
          {!isSubmissionComplete ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 uppercase leading-none shadow-2xs">
              {lackingMandatory.length} Lacking
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase leading-none flex items-center gap-0.5 shadow-2xs">
              <Check className="w-2.5 h-2.5" /> 100%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clearances')}
          className={`py-2.5 px-5 rounded-full flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeTab === 'clearances'
              ? 'bg-gradient-to-r from-[#159847] to-[#12823c] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>2. Joint Clearances (eBOSS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assessment')}
          className={`py-2.5 px-5 rounded-full flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeTab === 'assessment'
              ? 'bg-gradient-to-r from-[#159847] to-[#12823c] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>3. Tax Order of Payment (TOP)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('release')}
          className={`py-2.5 px-5 rounded-full flex items-center gap-2 transition-all cursor-pointer font-bold ${
            activeTab === 'release'
              ? 'bg-gradient-to-r from-[#159847] to-[#12823c] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>4. Permit Issuance</span>
        </button>
      </div>

      {/* 4. Tab Body in Full-Page White Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6 text-xs">
              
              {toastMessage && (
                <div className="p-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-2 animate-fadeIn px-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* TAB 1: ARTA DOCUMENTS & COMPLETENESS CHECKLIST */}
              {activeTab === 'documents' && (
                <div className="space-y-5">
                  
                  {/* Top Action Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">ARTA Documentary Completeness & Verification</h4>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {selectedApp.applicationType || 'New'} Application
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500">
                        City of Bogo BPLO Standard Checklist (RA 11032 eBOSS Compliant).
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyDeficiencyNotice}
                        className="px-4 py-2.5 rounded-full border border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-2 cursor-pointer bg-white transition-all shadow-2xs hover:shadow-xs active:scale-95"
                        title="Copy lacking documents formatted for SMS/Email"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copy Deficiency Notice</span>
                      </button>

                      <label className="px-4 py-2.5 rounded-full border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-2 cursor-pointer bg-white shadow-2xs hover:shadow-xs transition-all active:scale-95">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Attach Any Doc</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const newDoc = {
                                docId: 'evaluator_' + Date.now(),
                                title: file.name.replace(/\.[^/.]+$/, ''),
                                fileName: file.name,
                                fileSize: file.size,
                                cloudinaryUrl: URL.createObjectURL(file),
                                isLocalPreview: true,
                                isVerified: true,
                                uploadedAt: new Date().toISOString()
                              };
                              const updatedDocs = [...(selectedApp.documents || []), newDoc];
                              const updatedApp = { ...selectedApp, documents: updatedDocs };
                              setSelectedApp(updatedApp);
                              setApplications(prev => prev.map(a => a.referenceNo === selectedApp.referenceNo ? updatedApp : a));
                              try {
                                localStorage.setItem(`bplo_docs_${selectedApp.referenceNo}`, JSON.stringify(updatedDocs));
                              } catch(err) {}
                              setToastMessage(`Document "${file.name}" attached successfully!`);
                              setTimeout(() => setToastMessage(''), 2500);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={handleAcceptAllDocs}
                        className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#159847] to-[#12823c] hover:from-[#12823c] hover:to-[#0f6c32] text-white font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md text-xs active:scale-95"
                        title="Accept all attached documents"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Accept All Documents</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. ATTACHED DOCUMENTS CARD (WITH ACCEPT / REJECT & REJECTION REASON) */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-50/90 px-6 sm:px-7 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between text-xs sm:text-[13px] font-bold text-slate-700 tracking-wider">
                      <span>ATTACHED DOCUMENTS (RA 11032 COMPLIANT)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-[13px] text-emerald-700 font-bold">
                          {(selectedApp.documents || []).length} attached
                        </span>
                        {(selectedApp.documents || []).some(d => d.status === 'rejected') && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                            {(selectedApp.documents || []).filter(d => d.status === 'rejected').length} rejected
                          </span>
                        )}
                        {(selectedApp.documents || []).some(d => d.status === 'accepted' || (d.isVerified && d.status !== 'rejected')) && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                            {(selectedApp.documents || []).filter(d => d.status === 'accepted' || (d.isVerified && d.status !== 'rejected')).length} accepted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3.5">
                      {selectedApp.documents && selectedApp.documents.length > 0 ? (
                        selectedApp.documents.map((doc, idx) => {
                          const isAccepted = doc.status === 'accepted' || (doc.isVerified && doc.status !== 'rejected');
                          const isRejected = doc.status === 'rejected';
                          const isPending = !isAccepted && !isRejected;

                          return (
                            <div 
                              key={idx} 
                              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                                isRejected 
                                  ? 'border-rose-300 bg-rose-50/30 shadow-2xs' 
                                  : isAccepted 
                                    ? 'border-emerald-200 bg-emerald-50/20' 
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    isRejected ? 'bg-rose-100 text-rose-600' : isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-800 text-sm truncate">
                                        {doc.title || doc.fileName || 'Attached Document'}
                                      </span>
                                      {isAccepted && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          <Check className="w-2.5 h-2.5 text-emerald-700" /> Accepted
                                        </span>
                                      )}
                                      {isRejected && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                          <X className="w-2.5 h-2.5 text-rose-700" /> Rejected
                                        </span>
                                      )}
                                      {isPending && (
                                        <span 
                                          className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"
                                          title={`Uploaded ${getDocumentDaysLapsed(doc, selectedApp)} ago`}
                                        >
                                          <Clock className="w-2.5 h-2.5 text-amber-700" />
                                          <span>Pending Review ({getDocumentDaysLapsed(doc, selectedApp)})</span>
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-slate-500 block truncate mt-0.5">
                                      File: {doc.fileName || 'Scanned Copy'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                  {doc.cloudinaryUrl ? (
                                    <a
                                      href={doc.cloudinaryUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-emerald-50 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors mr-1"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic mr-1">Hardcopy</span>
                                  )}

                                  {/* Accept Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptDoc(doc)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                      isAccepted 
                                        ? 'bg-gradient-to-r from-[#159847] to-[#12823c] text-white shadow-2xs' 
                                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-500 shadow-2xs'
                                    }`}
                                    title="Accept this document"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>{isAccepted ? 'Accepted' : 'Accept'}</span>
                                  </button>

                                  {/* Reject Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isRejected) {
                                        handleRejectDoc(doc);
                                      } else {
                                        if (window.confirm(`Reset "${doc.title || doc.fileName}" status back to Pending Review?`)) {
                                          handleResetDocStatus(doc);
                                        }
                                      }
                                    }}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                      isRejected 
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs' 
                                        : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 hover:border-rose-500 shadow-2xs'
                                    }`}
                                    title={isRejected ? 'Click to reset status' : 'Reject this document and provide reason'}
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* If Rejected: Small Input Box for Reason for Rejection */}
                              {isRejected && (
                                <div className="mt-3 pt-3 border-t border-rose-200 animate-fadeIn">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                    <label className="text-[11px] font-bold text-rose-900 flex items-center gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Reason for Rejection (Visible to Applicant in Portal):</span>
                                    </label>
                                    <span className="text-[10px] text-rose-700 font-medium">
                                      Applicant will be notified to re-upload
                                    </span>
                                  </div>

                                  {(() => {
                                    const docKey = doc.docId || doc.id || doc.fileName || `doc_${idx}`;
                                    const draftVal = rejectionDrafts[docKey];
                                    const currentReason = draftVal !== undefined ? draftVal : (doc.rejectionReason || '');
                                    const hasReason = Boolean(currentReason && currentReason.trim().length > 0);
                                    const isSaved = Boolean(doc.rejectionReason && doc.rejectionReason.trim() === currentReason.trim());

                                    return (
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={currentReason}
                                            onChange={(e) => {
                                              setRejectionDrafts(prev => ({ ...prev, [docKey]: e.target.value }));
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (hasReason) {
                                                  handleSaveRejectionReason(doc, currentReason.trim(), docKey);
                                                }
                                              }
                                            }}
                                            placeholder="State reason, e.g. Blurry/unreadable scan, expired certificate, missing notary seal..."
                                            className="flex-1 px-3.5 py-2 text-xs bg-white border border-rose-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 shadow-2xs font-medium"
                                          />

                                          {/* Save Button: Disabled when empty, Active and clickable once reason is added */}
                                          <button
                                            type="button"
                                            disabled={!hasReason}
                                            onClick={() => handleSaveRejectionReason(doc, currentReason.trim(), docKey)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 select-none ${
                                              !hasReason
                                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                                : !isSaved
                                                  ? 'bg-[#159847] hover:bg-[#12823c] text-white shadow-xs cursor-pointer ring-2 ring-emerald-500/40 active:scale-95'
                                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs cursor-pointer'
                                            }`}
                                            title={
                                              !hasReason
                                                ? 'Enter or select a reason below to enable save'
                                                : !isSaved
                                                  ? 'Click to save rejection reason'
                                                  : 'Reason saved (click to re-save if modified)'
                                            }
                                          >
                                            {isSaved ? (
                                              <>
                                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                                <span>Saved</span>
                                              </>
                                            ) : (
                                              <>
                                                <Save className="w-3.5 h-3.5 text-white" />
                                                <span>Save</span>
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        {/* Quick Reason Chips */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                          <span className="text-[10px] text-slate-500 font-semibold">Quick picks:</span>
                                          {[
                                            'Expired document',
                                            'Blurry / unreadable scan',
                                            'Missing notary seal / signature',
                                            'Wrong document type',
                                            'Incomplete pages / cut off'
                                          ].map((quickReason, qIdx) => (
                                            <button
                                              key={qIdx}
                                              type="button"
                                              onClick={() => {
                                                setRejectionDrafts(prev => ({ ...prev, [docKey]: quickReason }));
                                              }}
                                              className="text-[10px] px-2.5 py-1 rounded-md bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 transition-colors cursor-pointer font-medium hover:border-rose-300"
                                            >
                                              + {quickReason}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-500 italic text-xs">
                          No electronic documents have been attached yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. LACKING / REQUIRED DOCUMENTS (FOR COMPLETENESS) IN THE SAME CLEAN CARD STYLE */}
                  <div className="border border-amber-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-amber-50/70 px-6 sm:px-7 py-3.5 sm:py-4 border-b border-amber-200 flex items-center justify-between text-xs sm:text-[13px] font-bold text-amber-900 tracking-wider">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        <span>LACKING / REQUIRED DOCUMENTS (FOR COMPLETENESS)</span>
                      </div>
                      <span className="text-xs sm:text-[13px] text-amber-800 font-bold">
                        {lackingMandatory.length} lacking
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 space-y-3.5">
                      {lackingAll.length > 0 ? (
                        lackingAll.map((req) => {
                          const matchedDoc = getAttachedDoc(req);
                          const isRejected = matchedDoc && matchedDoc.status === 'rejected';
                          return (
                          <div 
                            key={req.id} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-colors gap-3 ${
                              isRejected 
                                ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300' 
                                : 'border-slate-200 bg-slate-50/50 hover:border-amber-300'
                            }`}
                          >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className={`w-6 h-6 shrink-0 ${isRejected ? 'text-rose-500' : 'text-amber-500'}`} />
                                <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-800 text-sm">
                                    Item {req.itemNo} • {req.title}
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                    req.isMandatory
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-sky-100 text-sky-800 border border-sky-200'
                                  }`}>
                                    {req.isMandatory ? 'Mandatory' : 'To Follow'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 block truncate mt-0.5">
                                  Required by {req.issuingOfficeShort || req.issuingOffice} • {req.copyType}
                                </span>
                                {isRejected && matchedDoc.rejectionReason && (
                                  <span className="text-xs text-rose-700 font-semibold block mt-1">
                                    Rejection reason: {matchedDoc.rejectionReason}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                isRejected 
                                  ? 'text-rose-700 bg-rose-100 border-rose-300' 
                                  : 'text-amber-800 bg-amber-50 border-amber-200'
                              }`}>
                                {isRejected ? 'Rejected (Re-upload Needed)' : 'Lacking'}
                              </span>

                              <label className="px-3.5 py-1.5 rounded-full bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-800 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-95">
                                <Upload className="w-3 h-3 text-emerald-600" />
                                <span>+ Attach</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleAttachRequirementDoc(req, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => handleMarkPhysicalReceived(req)}
                                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-xs cursor-pointer transition-all active:scale-95 shadow-2xs"
                                title="Mark walk-in paper copy handed over at counter"
                              >
                                <span>Received Walk-in</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                      ) : (
                        <div className="p-4 text-center text-emerald-700 font-medium text-xs flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>All required documentary attachments are complete.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. STATUTORY ARTA NOTICE CARD (MATCHING USER SCREENSHOT EXACTLY) */}
                  <div className="p-5 sm:p-6 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs text-gray-600 space-y-1.5 leading-relaxed">
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

                </div>
              )}

              {/* TAB 2: JOINT CLEARANCES (eBOSS) */}
              {activeTab === 'clearances' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Joint Inter-Department Clearances</h4>
                    <p className="text-[11px] text-gray-500">Sign off departmental clearances as required under eBOSS.</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">1. Locational & Zoning Clearance</span>
                        <span className="text-[10px] text-gray-500">City Planning & Development Office (CPDO) • Items 3 & 4</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Zoning Approved</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">2. Occupancy Permit Clearance</span>
                        <span className="text-[10px] text-gray-500">Office of the Building Official (OBO) • Item 5</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Building Cleared</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">3. CENRO Business Clearance</span>
                        <span className="text-[10px] text-gray-500">City Environment & Natural Resources Office (CENRO) • Item 6</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Eco Compliant</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">4. Real Property Tax (RPT) Clearance</span>
                        <span className="text-[10px] text-gray-500">City Treasurer's Office • Item 7</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Taxes Paid</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">5. Barangay Business Clearance</span>
                        <span className="text-[10px] text-gray-500">Host Barangay Council • Item 9</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Barangay Cleared</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">6. Sanitary Permit</span>
                        <span className="text-[10px] text-gray-500">City Health Office (CHO) • Item 13</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>CHO Approved</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">7. BPLO Physical Inspection Report</span>
                        <span className="text-[10px] text-gray-500">Business Permit and Licensing Office • Item 14</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Inspected</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-200 flex items-center justify-between bg-amber-50/50">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">8. Fire Safety Inspection Certificate (FSIC)</span>
                        <span className="text-[10px] text-amber-700">Bureau of Fire Protection (BFP) • Item 15 (To follow upon completion)</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-700" />
                        <span>Endorsed to BFP</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('assessment')}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#159847] to-[#12823c] hover:from-[#12823c] hover:to-[#0f6c32] text-white font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <span>Proceed to Tax Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: TAX ORDER OF PAYMENT (TOP) */}
              {activeTab === 'assessment' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Top Header & Action Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">Tax Order of Payment (Assessment)</h4>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {assessmentCharges.length} Charges
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Consolidated assessment under City Revenue Code and RA 11032 eBOSS single billing framework.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsAddingCharge(!isAddingCharge)}
                        className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                          isAddingCharge 
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAddingCharge ? 'Close Form' : 'Add Charge'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRecalculateFsic}
                        className="px-4 py-2.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="Auto-compute FSIC as 15% of other assessed fees (RA 9514)"
                      >
                        <Calculator className="w-3.5 h-3.5 text-amber-700" />
                        <span>Recalculate FSIC (15%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetCharges}
                        className="px-3.5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        title="Reset to default baseline fee schedule"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Reset</span>
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus('Payment Pending', { 
                          total_assessed: totalAssessmentAmount,
                          assessment_items: assessmentCharges
                        })}
                        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#159847] to-[#12823c] hover:from-[#12823c] hover:to-[#0f6c32] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Issue Tax Order of Payment</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Charge Drawer / Form */}
                  {isAddingCharge && (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-slate-900">Add New Charge / Regulatory Fee</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddingCharge(false)}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                          Quick Preset Suggestions:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {FEE_PRESETS.map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setNewChargeForm({
                                  description: p.title,
                                  category: p.category,
                                  amount: String(p.amount)
                                });
                              }}
                              className="px-2.5 py-1 rounded-full bg-white border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-800 text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
                            >
                              + {p.title} (₱{p.amount})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Form Inputs */}
                      <form onSubmit={handleAddCharge} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                        <div className="sm:col-span-6">
                          <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                            Fee Description:
                          </label>
                          <input
                            type="text"
                            value={newChargeForm.description}
                            onChange={(e) => setNewChargeForm({ ...newChargeForm, description: e.target.value })}
                            placeholder="e.g. Signboard & Billboard Fee"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                            Category:
                          </label>
                          <select
                            value={newChargeForm.category}
                            onChange={(e) => setNewChargeForm({ ...newChargeForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="Regulatory Fee">Regulatory Fee</option>
                            <option value="Local Tax">Local Tax</option>
                            <option value="Clearance Fee">Clearance Fee</option>
                            <option value="Penalty / Surcharge">Penalty / Surcharge</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                            Amount (PHP):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={newChargeForm.amount}
                              onChange={(e) => setNewChargeForm({ ...newChargeForm, amount: e.target.value })}
                              placeholder="0.00"
                              required
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#159847] hover:bg-[#12823c] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Fee Breakdown Interactive Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#159847] text-white font-semibold">
                        <tr>
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3">Fee Description</th>
                          <th className="p-3 w-36">Category</th>
                          <th className="p-3 w-36 text-right">Amount (PHP)</th>
                          <th className="p-3 w-28 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assessmentCharges.length > 0 ? (
                          assessmentCharges.map((charge, idx) => {
                            const isEditing = editingChargeId === charge.id;

                            return (
                              <tr 
                                key={charge.id || idx}
                                className={`transition-colors ${isEditing ? 'bg-amber-50/70' : 'hover:bg-slate-50/70'}`}
                              >
                                {/* # */}
                                <td className="p-3 text-center text-gray-400 font-mono text-[11px]">
                                  {idx + 1}
                                </td>

                                {/* Description */}
                                <td className="p-3">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.description}
                                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-800">{charge.description}</span>
                                      {charge.isFsic && (
                                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                                          15% to BFP
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Category */}
                                <td className="p-3">
                                  {isEditing ? (
                                    <select
                                      value={editForm.category}
                                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                      className="w-full px-2 py-1.5 border border-amber-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    >
                                      <option value="Regulatory Fee">Regulatory Fee</option>
                                      <option value="Local Tax">Local Tax</option>
                                      <option value="Clearance Fee">Clearance Fee</option>
                                      <option value="Penalty / Surcharge">Penalty / Surcharge</option>
                                    </select>
                                  ) : (
                                    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                      charge.category === 'Local Tax'
                                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                        : charge.category === 'Penalty / Surcharge'
                                        ? 'bg-red-50 text-red-800 border border-red-200'
                                        : charge.category === 'Clearance Fee'
                                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {charge.category || 'Regulatory Fee'}
                                    </span>
                                  )}
                                </td>

                                {/* Amount */}
                                <td className="p-3 text-right font-mono">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editForm.amount}
                                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                      className="w-28 px-2 py-1.5 border border-amber-300 rounded-lg bg-white text-xs font-mono font-bold text-right focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    />
                                  ) : (
                                    <span className="font-bold text-slate-800">
                                      Php {Number(charge.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="p-3 text-center">
                                  {isEditing ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEdit(charge.id)}
                                        className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                                        title="Save Changes"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                                        title="Cancel Edit"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(charge)}
                                        className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 transition-all cursor-pointer"
                                        title="Edit Charge"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCharge(charge.id, charge.description)}
                                        className="p-1.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-700 transition-all cursor-pointer"
                                        title="Delete Charge"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400">
                              <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p className="font-semibold text-xs text-slate-600">No charges assessed yet.</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Click "Add Charge" or "Reset" to populate standard fees.</p>
                            </td>
                          </tr>
                        )}

                        {/* TOTAL AMOUNT DUE */}
                        <tr className="bg-emerald-50/90 font-bold text-slate-900 border-t-2 border-emerald-300">
                          <td colSpan={3} className="p-4 text-xs sm:text-sm text-slate-800">
                            <span className="font-extrabold uppercase tracking-wide">TOTAL AMOUNT DUE</span>
                            <span className="text-[11px] text-emerald-800 font-normal block mt-0.5">
                              Consolidated local taxes, regulatory fees & BFP fire safety inspection fee
                            </span>
                          </td>
                          <td className="p-4 text-right text-base sm:text-lg text-[#1B4332] font-mono font-extrabold">
                            Php {totalAssessmentAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Informational Guidance Notice */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        Official Tax Order of Payment (RA 11032 eBOSS Standard)
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Issuing this Tax Order of Payment will transition the application status to <strong>Payment Pending</strong>, allowing the applicant or cashier to view the single consolidated bill and settle fees over the counter or online.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: PERMIT ISSUANCE */}
              {activeTab === 'release' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Payment Settlement & Mayor's Permit Release</h4>
                    <p className="text-[11px] text-gray-500">Record cashier payment and issue the official permit.</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3.5">
                    
                    {/* TOP Billing Summary */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-gray-500 block text-[11px]">Total Assessed Bill (Tax Order of Payment):</span>
                        <span className="font-extrabold font-mono text-base text-emerald-950">
                          Php {totalAssessmentAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                        {assessmentCharges.length} Assessed Line Items
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-gray-800 block mb-1">
                        Treasury Official Receipt (OR) Number:
                      </label>
                      <input
                        type="text"
                        value={orNumberInput}
                        onChange={(e) => setOrNumberInput(e.target.value)}
                        placeholder="e.g. OR-8819203"
                        className="w-full sm:w-80 px-4 py-2.5 border border-slate-300 rounded-full bg-white font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Leave empty to auto-generate official receipt number.</p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={handleIssuePermit}
                        className="px-6 py-3 rounded-full bg-[#159847] hover:bg-[#12823c] text-white font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg text-xs"
                      >
                        <Award className="w-4 h-4" />
                        <span>Issue & Release Mayor’s Business Permit</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

      </div>

      {/* 5. Page Bottom Footer */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>BPLO Admin System • City of Bogo eBOSS Standard Evaluation Portal (RA 11032)</span>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedApp(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-6 py-2.5 rounded-full border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications Queue</span>
        </button>
      </div>

    </div>
  )}

      {/* Render Generated Mayor's Permit Modal */}
      {releasedPermit && (
        <BusinessPermitViewModal
          permitData={releasedPermit}
          onClose={() => setReleasedPermit(null)}
          activeTenant={activeTenant}
        />
      )}

    </div>
  );
}
