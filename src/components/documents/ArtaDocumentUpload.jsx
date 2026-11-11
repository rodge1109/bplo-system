import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Settings, 
  Cloud, 
  Eye, 
  Info,
  Check, 
  X, 
  RefreshCw, 
  FolderUp, 
  FileCheck2, 
  FileBadge,
  Building2,
  Store,
  Users,
  Printer,
  ChevronDown,
  ChevronUp,
  MapPin,
  Flame,
  Activity,
  Trees,
  Award,
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';
import { 
  uploadToCloudinary, 
  getCloudinaryConfig, 
  saveCloudinaryConfig 
} from '../../services/cloudinaryService';

/**
 * Official Bogo City BPLO Special Business Types catalog (Items a to m from slip)
 */
export const SPECIAL_BUSINESS_TYPES_CONFIG = [
  {
    id: 'spec_gasoline',
    letter: 'a',
    label: 'Gasoline Stations',
    code: 'SPEC-A',
    agency: 'DENR-EMB / DOE',
    agencyShort: 'DENR / DOE',
    title: 'Gasoline Stations Clearances',
    subtitle: 'Environmental Compliance Certificate (ECC), Certificate of Compliance (COC), Special Use Permit',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['gasoline', 'gas station', 'petron', 'shell', 'caltex', 'fuel', 'petroleum']
  },
  {
    id: 'spec_junkshop',
    letter: 'b',
    label: 'Junkshops',
    code: 'SPEC-B',
    agency: 'Host Barangay Council',
    agencyShort: 'Barangay',
    title: 'Junkshops Clearance',
    subtitle: 'Barangay Resolution endorsing junkshop operations and scrap storage compliance',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['junkshop', 'scrap', 'recycling', 'metal scrap']
  },
  {
    id: 'spec_quarry',
    letter: 'c',
    label: 'Quarry Operations',
    code: 'SPEC-C',
    agency: 'Provincial Government of Cebu',
    agencyShort: 'Province (Gov)',
    title: "Quarry Operations Governor's Permit",
    subtitle: "Official Governor's Permit for commercial extraction and quarry operations",
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['quarry', 'extraction', 'sand and gravel', 'aggregates', 'mining']
  },
  {
    id: 'spec_piggery_poultry',
    letter: 'd',
    label: 'Piggery and Poultry Farms',
    code: 'SPEC-D',
    agency: 'City Council / DENR-EMB',
    agencyShort: 'Council / DENR',
    title: 'Piggery and Poultry Farms Clearances',
    subtitle: 'Council Resolution and Environmental Compliance Certificate (ECC)',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['piggery', 'poultry', 'farm', 'livestock', 'swine', 'broiler', 'hog']
  },
  {
    id: 'spec_water_refilling',
    letter: 'e',
    label: 'Water Refilling Stations',
    code: 'SPEC-E',
    agency: 'Bogo Water District (BWD)',
    agencyShort: 'Bogo Water Dist.',
    title: 'Water Refilling Stations Clearance',
    subtitle: 'Bogo Water District Clearance (Water Source & Microbial Potability Clearance)',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['water refilling', 'purified water', 'mineral water', 'refilling station']
  },
  {
    id: 'spec_subdivisions',
    letter: 'f',
    label: 'Subdivisions',
    code: 'SPEC-F',
    agency: 'Sangguniang Panlungsod',
    agencyShort: 'City Council',
    title: 'Subdivisions Clearance',
    subtitle: 'Council Resolution approving subdivision development / development permit',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['subdivision', 'real estate development', 'housing development']
  },
  {
    id: 'spec_online_sabong',
    letter: 'g',
    label: 'Online Sabong',
    code: 'SPEC-G',
    agency: 'Sangguniang Panlungsod / PAGCOR',
    agencyShort: 'Council / PAGCOR',
    title: 'Online Sabong Clearance',
    subtitle: 'City Council Resolution / Regulatory Endorsement',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['online sabong', 'e-sabong', 'cockfighting online']
  },
  {
    id: 'spec_tourism',
    letter: 'h',
    label: 'Restaurants, Beach Resorts & Accommodations',
    code: 'SPEC-H',
    agency: 'Department of Tourism / City Tourism',
    agencyShort: 'DOT / Tourism',
    title: 'Tourism Accreditation',
    subtitle: 'Tourism Accreditation Certificate from Department of Tourism / City Tourism Office',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['restaurant', 'beach resort', 'resort', 'hotel', 'accommodation', 'inn', 'cafe', 'eatery']
  },
  {
    id: 'spec_meat_poultry',
    letter: 'i',
    label: 'Meat and Poultry Products',
    code: 'SPEC-I',
    agency: 'City Veterinary Office / NMIS',
    agencyShort: 'City Vet / NMIS',
    title: 'Meat and Poultry Vet Certificate',
    subtitle: 'Veterinary Health Certificate / NMIS Meat Inspection Certificate',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['meat', 'poultry', 'butcher', 'slaughter', 'pork', 'beef', 'chicken products']
  },
  {
    id: 'spec_amlc',
    letter: 'j',
    label: 'AMLC Covered Institutions',
    code: 'SPEC-J',
    agency: 'Anti-Money Laundering Council (AMLC)',
    agencyShort: 'AMLC',
    title: 'AMLC Registration Certificate',
    subtitle: 'AMLC Registration Certificate for Pawnshops, Money Remittance, Lending, Jewelry & Forex',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['pawnshop', 'money remittance', 'lending', 'foreign exchange', 'forex', 'jewelry']
  },
  {
    id: 'spec_mnrc',
    letter: 'k',
    label: 'MNRC Registration',
    code: 'SPEC-K',
    agency: 'National Regulatory Commission / Board',
    agencyShort: 'Regulatory Comm.',
    title: 'MNRC Registration Certificate',
    subtitle: 'Official Registration Certificate from the appropriate regulatory commission',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['mnrc', 'mineral resources', 'mining']
  },
  {
    id: 'spec_ptr',
    letter: 'l',
    label: 'Professional Practice (PTR)',
    code: 'SPEC-L',
    agency: "City Treasurer's Office",
    agencyShort: 'City Treasurer',
    title: 'Professional Tax Receipt (PTR)',
    subtitle: 'Current Year Professional Tax Receipt for licensed professionals practicing business',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['clinic', 'law office', 'accounting firm', 'dental clinic', 'veterinary clinic', 'engineering office', 'architectural']
  },
  {
    id: 'spec_special_use',
    letter: 'm',
    label: 'Bars, Night Clubs, Cockpits & Regulated Establishments',
    code: 'SPEC-M',
    agency: 'Sangguniang Panlungsod / Mayor’s Office',
    agencyShort: 'Council / Mayor',
    title: 'Special Use Permit',
    subtitle: 'Special Use Permit for Radio Stations, Private Landing Strips, Abattoir/Slaughterhouse, Cockpits, Landfill, Night Clubs, Cabarets, Bars, Videoke Bar and Pub Houses',
    copyType: '1 original copy / 1 photocopy copy',
    keywords: ['bar', 'videoke', 'night club', 'pub', 'cockpit', 'slaughterhouse', 'abattoir', 'radio station', 'landfill']
  }
];

/**
 * Get active requirements based on the official Bogo City BPLO Documentary Requirements list
 */
export const getArtaRequirements = (formData = {}) => {
  const isNew = formData.applicationType !== 'Renewal';
  const orgType = formData.typeOfOrganization || 'Single';
  const isRented = Boolean(formData.isRented);
  const isMarketStall = Boolean(formData.isMarketStall);
  const isFranchisee = Boolean(formData.isFranchisee);
  const isRepresentative = Boolean(formData.isRepresentative);
  const selectedSpecialKeys = formData.specialBusinessTypes || [];

  if (isNew) {
    const list = [];

    // 1. Filled up Unified Business Permit Application Form
    list.push({
      id: 'app_form',
      itemNo: 1,
      code: 'BPLO-01',
      title: 'Filled up Unified Business Permit Application Form',
      subtitle: 'Accomplished and signed official Unified Application Form for Business Permit',
      issuingOffice: 'Business Permit & Licensing Office (BPLO)',
      issuingOfficeShort: 'BPLO',
      legalBasis: 'RA 11032 / BPLS Unified Form',
      isMandatory: true,
      category: 'core',
      copyType: 'Original signed copy',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 2. Proof of Business Registration
    if (orgType === 'Single') {
      list.push({
        id: 'business_registration',
        itemNo: 2,
        code: 'REG-02',
        title: 'DTI Registration Certificate for Single Proprietorship',
        subtitle: 'Certificate of Business Name Registration issued by Department of Trade and Industry',
        issuingOffice: 'Department of Trade and Industry (DTI)',
        issuingOfficeShort: 'DTI',
        legalBasis: 'RA 11032 / DTI BNER',
        isMandatory: true,
        category: 'core',
        copyType: 'Original / Certified true copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });
    } else if (orgType === 'Corporation' || orgType === 'Partnership') {
      list.push({
        id: 'business_registration',
        itemNo: 2,
        code: 'REG-02',
        title: 'SEC Certificate for Partnership, Corporation & One Person Corporation',
        subtitle: 'SEC Registration Certificate together with Articles of Incorporation and By-Laws',
        issuingOffice: 'Securities and Exchange Commission (SEC)',
        issuingOfficeShort: 'SEC',
        legalBasis: 'Revised Corporation Code / SEC Rules',
        isMandatory: true,
        category: 'core',
        copyType: 'Original / Certified true copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });
    } else if (orgType === 'Cooperative') {
      list.push({
        id: 'business_registration',
        itemNo: 2,
        code: 'REG-02',
        title: 'CDA Registration for Cooperatives',
        subtitle: 'Certificate of Registration issued by Cooperative Development Authority',
        issuingOffice: 'Cooperative Development Authority (CDA)',
        issuingOfficeShort: 'CDA',
        legalBasis: 'RA 9520 CDA Charter',
        isMandatory: true,
        category: 'core',
        copyType: 'Original / Certified true copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });
    }

    // Franchise Agreement (if franchisee)
    if (isFranchisee) {
      list.push({
        id: 'franchise_agreement',
        itemNo: 2.1,
        code: 'REG-02B',
        title: 'Franchise Agreement (if franchisee)',
        subtitle: 'Valid Franchise Agreement executed with the master franchisor / principal brand',
        issuingOffice: 'Franchisor / Principal Entity',
        issuingOfficeShort: 'Franchisor',
        legalBasis: 'BPLO New Permit Requirements Item 2',
        isMandatory: true,
        category: 'core',
        copyType: 'Notarized copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });
    }

    // 3. Zoning Clearance
    list.push({
      id: 'zoning_clearance',
      itemNo: 3,
      code: 'CPDO-01',
      title: 'Zoning Clearance',
      subtitle: 'Clearance certifying business location conforms to Bogo City Zoning Ordinance',
      issuingOffice: 'City Planning & Development Office (CPDO)',
      issuingOfficeShort: 'CPDO',
      legalBasis: 'City Planning & Development Office',
      isMandatory: true,
      category: 'core',
      copyType: 'Official clearance',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 4. Locational Clearance
    list.push({
      id: 'locational_clearance',
      itemNo: 4,
      code: 'CPDO-02',
      title: 'Locational Clearance',
      subtitle: 'Locational evaluation verifying land use alignment and site plan approval',
      issuingOffice: 'City Planning & Development Office (CPDO)',
      issuingOfficeShort: 'CPDO',
      legalBasis: 'City Planning & Development Office',
      isMandatory: true,
      category: 'core',
      copyType: 'Official clearance',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 5. Occupancy Permit
    list.push({
      id: 'occupancy_permit',
      itemNo: 5,
      code: 'OBO-01',
      title: 'Occupancy Permit',
      subtitle: 'Certificate of Occupancy certifying structural safety of commercial space',
      issuingOffice: 'Office of the Building Official (OBO)',
      issuingOfficeShort: 'OBO',
      legalBasis: 'PD 1096 National Building Code',
      isMandatory: true,
      category: 'core',
      copyType: 'Official permit',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 6. CENRO Business Clearance
    list.push({
      id: 'cenro_clearance',
      itemNo: 6,
      code: 'CENRO-01',
      title: 'CENRO Business Clearance',
      subtitle: 'Environmental compliance certificate, solid waste management and sanitation inspection',
      issuingOffice: 'City Environment & Natural Resources Office (CENRO)',
      issuingOfficeShort: 'CENRO',
      legalBasis: 'RA 9003 / City Environmental Code',
      isMandatory: true,
      category: 'core',
      copyType: 'Official clearance',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 7. Real Property Tax Clearance
    list.push({
      id: 'rpt_clearance',
      itemNo: 7,
      code: 'CTO-01',
      title: 'Real Property Tax Clearance',
      subtitle: 'Current year Real Property Tax (RPT) clearance or payment receipt from City Treasurer',
      issuingOffice: "Treasurer's Office",
      issuingOfficeShort: 'City Treasurer',
      legalBasis: 'Local Government Code / City Treasurer',
      isMandatory: true,
      category: 'core',
      copyType: 'Official receipt / Clearance',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 8. Residence Certificate / Corporate Cedula (original copy)
    list.push({
      id: 'cedula',
      itemNo: 8,
      code: 'CTO-02',
      title: 'Residence Certificate / Corporate Cedula',
      subtitle: 'Community Tax Certificate (CTC) of owner for sole proprietorship, or Corporate Cedula for entity',
      issuingOffice: "Treasurer's Office / Barangay",
      issuingOfficeShort: 'Treasurer / Brgy',
      legalBasis: 'Local Government Code (Sec. 156)',
      isMandatory: true,
      category: 'core',
      copyType: 'Original copy',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 9. Barangay Clearance (original copy)
    list.push({
      id: 'barangay_clearance',
      itemNo: 9,
      code: 'BRGY-01',
      title: 'Barangay Clearance',
      subtitle: 'Barangay Business Clearance from host barangay where the business is situated',
      issuingOffice: 'Host Barangay Council',
      issuingOfficeShort: 'Barangay',
      legalBasis: 'LGC Sec. 152(c)',
      isMandatory: true,
      category: 'core',
      copyType: 'Original copy',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 10. Notarized Contract of Lease (if rented)
    if (isRented) {
      list.push({
        id: 'lease_contract',
        itemNo: 10,
        code: 'LSE-01',
        title: 'Notarized Contract of Lease',
        subtitle: 'Duly notarized agreement between property lessor and business owner (if place of business is rented)',
        issuingOffice: 'Notary Public / Lessor',
        issuingOfficeShort: 'Notary / Lessor',
        legalBasis: 'Required if place of business is rented',
        isMandatory: true,
        category: 'lease',
        copyType: 'Notarized copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });

      // 11. Lessor's Business Permit (if renting)
      list.push({
        id: 'lessor_permit',
        itemNo: 11,
        code: 'LSE-02',
        title: "Lessor's Business Permit",
        subtitle: "Valid Business / Mayor's Permit of the property lessor for commercial leasing operations",
        issuingOffice: "BPLO (Lessor's Jurisdiction)",
        issuingOfficeShort: 'BPLO',
        legalBasis: 'Required if renting',
        isMandatory: true,
        category: 'lease',
        copyType: 'Photocopy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });
    }

    // 12. Stall Clearance (if business is located at Bogo City Public Market)
    if (isMarketStall) {
      list.push({
        id: 'stall_clearance',
        itemNo: 12,
        code: 'MKT-01',
        title: 'Stall Clearance (Bogo City Public Market)',
        subtitle: 'Official Stallholder Clearance issued by Bogo City Public Market Administration',
        issuingOffice: 'Bogo City Public Market Office',
        issuingOfficeShort: 'Public Market',
        legalBasis: 'Required if located at Bogo City Public Market',
        isMandatory: true,
        category: 'market',
        copyType: 'Original copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });
    }

    // 13. Sanitary Permit (City Health Office)
    list.push({
      id: 'sanitary_permit',
      itemNo: 13,
      code: 'CHO-01',
      title: 'Sanitary Permit',
      subtitle: 'Health & Sanitation clearance and food/non-food handlers medical cards',
      issuingOffice: 'City Health Office (CHO)',
      issuingOfficeShort: 'City Health',
      legalBasis: 'PD 856 Sanitation Code of the Philippines',
      isMandatory: true,
      category: 'core',
      copyType: 'Official permit',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 14. Inspection Report from BPLO
    list.push({
      id: 'bplo_inspection',
      itemNo: 14,
      code: 'BPLO-02',
      title: 'Inspection Report from BPLO',
      subtitle: 'On-site physical inspection and verification report conducted by BPLO personnel',
      issuingOffice: 'Business Permit and Licensing Office (BPLO)',
      issuingOfficeShort: 'BPLO',
      legalBasis: 'City Tax Ordinance / BPLS Inspection',
      isMandatory: true,
      category: 'core',
      copyType: 'Inspection Report',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // 15. Fire Safety Inspection Certificate (to follow after all requirements above are completed)
    list.push({
      id: 'fsic',
      itemNo: 15,
      code: 'BFP-01',
      title: 'Fire Safety Inspection Certificate (FSIC)',
      subtitle: 'Bureau of Fire Protection clearance (to follow after all requirements above are completed)',
      issuingOffice: 'Bureau of Fire Protection (BFP)',
      issuingOfficeShort: 'BFP',
      legalBasis: 'RA 9514 Revised Fire Code',
      isMandatory: false,
      isToFollow: true,
      category: 'core',
      copyType: 'BFP Certificate',
      accept: '.pdf,.jpg,.jpeg,.png',
      formats: 'PDF, JPG, PNG (Max 10MB)'
    });

    // Additional Requirements for Specific Types of Business (Items a to m)
    SPECIAL_BUSINESS_TYPES_CONFIG.forEach(item => {
      if (selectedSpecialKeys.includes(item.id) || selectedSpecialKeys.includes(item.letter)) {
        list.push({
          id: item.id,
          itemNo: `Spec-${item.letter.toUpperCase()}`,
          code: item.code,
          title: `${item.title} (${item.label})`,
          subtitle: item.subtitle,
          issuingOffice: item.agency,
          issuingOfficeShort: item.agencyShort,
          legalBasis: `Specific Type Requirement (${item.letter})`,
          isMandatory: true,
          category: 'specific',
          copyType: item.copyType,
          accept: '.pdf,.jpg,.jpeg,.png',
          formats: 'PDF, JPG, PNG (Max 10MB)'
        });
      }
    });

    // If Transacting Through a Representative
    if (isRepresentative) {
      list.push({
        id: 'rep_authorization',
        itemNo: 'Rep-1',
        code: 'REP-01',
        title: "Authorization Letter or Secretary's Certificate",
        subtitle: "Authorization letter executed by the Business Owner OR Secretary's Certificate indicating specific transaction",
        issuingOffice: 'Business Owner / Board of Directors',
        issuingOfficeShort: 'Owner / Board',
        legalBasis: 'Required if transacting through representative (Item 1)',
        isMandatory: true,
        category: 'representative',
        copyType: 'Original signed copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });

      list.push({
        id: 'rep_valid_ids',
        itemNo: 'Rep-2',
        code: 'REP-02',
        title: 'Valid Government IDs (Owner & Representative)',
        subtitle: 'Any valid ID of Business Owner/Corporate Secretary AND Authorized Representative (1 photocopy each)',
        issuingOffice: 'Government Agency (Passport, UMID, Driver’s License, PhilID, etc.)',
        issuingOfficeShort: 'Government ID',
        legalBasis: 'Required if transacting through representative (Item 2)',
        isMandatory: true,
        category: 'representative',
        copyType: '1 photocopy each',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      });
    }

    return list;
  } else {
    // RENEWAL Requirements
    return [
      {
        id: 'gross_sales_basis',
        itemNo: 1,
        code: 'FIN-01',
        title: 'Basis for Gross Sales (BIR ITR / AFS / Sworn Statement)',
        subtitle: 'Previous year Audited Financial Statements, BIR Form 1701/1702 Annual ITR, or Sworn Statement of Gross Receipts',
        issuingOffice: 'BIR / CPA Certified',
        issuingOfficeShort: 'BIR / CPA',
        legalBasis: 'RA 11032 / Unified Tax Assessment',
        isMandatory: true,
        category: 'renewal',
        copyType: 'Official ITR / AFS',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      },
      {
        id: 'previous_permit',
        itemNo: 2,
        code: 'PERM-01',
        title: "Previous Year Mayor's Permit & Official Receipt (OR)",
        subtitle: 'Preceding calendar year Business Permit plate/certificate and proof of full local tax payment',
        issuingOffice: 'BPLO / City Treasurer',
        issuingOfficeShort: 'BPLO / Treasurer',
        legalBasis: 'BPLS Standard Renewal Check',
        isMandatory: true,
        category: 'renewal',
        copyType: 'Photocopy of Permit & OR',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      },
      {
        id: 'barangay_clearance',
        itemNo: 3,
        code: 'BRGY-01',
        title: 'Current Year Barangay Business Clearance',
        subtitle: 'Barangay clearance from host barangay where the establishment is located',
        issuingOffice: 'Host Barangay Council',
        issuingOfficeShort: 'Barangay',
        legalBasis: 'LGC Sec. 152(c)',
        isMandatory: true,
        category: 'renewal',
        copyType: 'Original copy',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      },
      {
        id: 'sanitary_permit',
        itemNo: 4,
        code: 'CHO-01',
        title: 'Annual Sanitary Permit Renewal',
        subtitle: 'Health inspection clearance and valid health cards for current calendar year',
        issuingOffice: 'City Health Office (CHO)',
        issuingOfficeShort: 'City Health',
        legalBasis: 'PD 856 Sanitation Code',
        isMandatory: true,
        category: 'renewal',
        copyType: 'Official permit',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      },
      {
        id: 'fsic',
        itemNo: 5,
        code: 'BFP-01',
        title: 'Fire Safety Inspection Certificate (FSIC) for Renewal',
        subtitle: 'Bureau of Fire Protection certification for calendar year operations',
        issuingOffice: 'Bureau of Fire Protection (BFP)',
        issuingOfficeShort: 'BFP',
        legalBasis: 'Revised Fire Code RA 9514',
        isMandatory: false,
        isToFollow: true,
        category: 'renewal',
        copyType: 'BFP Certificate',
        accept: '.pdf,.jpg,.jpeg,.png',
        formats: 'PDF, JPG, PNG (Max 10MB)'
      }
    ];
  }
};

export default function ArtaDocumentUpload({
  formData = {},
  uploadedDocuments = {},
  onDocumentsChange,
  onConditionToggle,
  tenantCode = 'BOGO'
}) {
  const requirements = getArtaRequirements(formData);
  const [activeFilter, setActiveFilter] = useState('all'); // all, core, lease, specific, representative
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showOfficialSlipModal, setShowOfficialSlipModal] = useState(false);
  const [showSpecialSelector, setShowSpecialSelector] = useState(false);
  const [config, setConfig] = useState(getCloudinaryConfig());
  const [tempCloudName, setTempCloudName] = useState('');
  const [tempPreset, setTempPreset] = useState('');
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  useEffect(() => {
    const currentCfg = getCloudinaryConfig();
    setConfig(currentCfg);
    setTempCloudName(currentCfg.cloudName || '');
    setTempPreset(currentCfg.uploadPreset || '');
  }, []);

  // Compute ARTA Mandatory Compliance
  const mandatoryDocs = requirements.filter(r => r.isMandatory);
  const uploadedMandatoryCount = mandatoryDocs.filter(r => Boolean(uploadedDocuments[r.id])).length;
  const isFullyCompliant = mandatoryDocs.length > 0 && uploadedMandatoryCount === mandatoryDocs.length;
  const compliancePercentage = mandatoryDocs.length > 0 
    ? Math.round((uploadedMandatoryCount / mandatoryDocs.length) * 100) 
    : 100;

  // Total uploaded count (including optional / to follow)
  const totalUploadedCount = requirements.filter(r => Boolean(uploadedDocuments[r.id])).length;

  // Filter requirements for active tab
  const filteredRequirements = requirements.filter(req => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'core') return req.category === 'core';
    if (activeFilter === 'lease') return req.category === 'lease' || req.category === 'market';
    if (activeFilter === 'specific') return req.category === 'specific';
    if (activeFilter === 'representative') return req.category === 'representative';
    return true;
  });

  // Handle condition toggle
  const handleToggle = (field, value) => {
    if (onConditionToggle) {
      onConditionToggle(field, value);
    }
  };

  const handleToggleSpecialType = (typeId) => {
    const current = formData.specialBusinessTypes || [];
    const next = current.includes(typeId)
      ? current.filter(k => k !== typeId)
      : [...current, typeId];
    handleToggle('specialBusinessTypes', next);
  };

  // Upload handler
  const handleFileSelect = async (requirement, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadErrors(prev => ({
        ...prev,
        [requirement.id]: 'File exceeds 10MB limit. Please compress and retry.'
      }));
      return;
    }

    setUploadErrors(prev => ({ ...prev, [requirement.id]: null }));
    setUploadProgress(prev => ({ ...prev, [requirement.id]: 10 }));

    try {
      const result = await uploadToCloudinary(file, {
        docType: requirement.id,
        tenantCode: tenantCode,
        onProgress: (percent) => {
          setUploadProgress(prev => ({ ...prev, [requirement.id]: percent }));
        }
      });

      const updatedDocs = {
        ...uploadedDocuments,
        [requirement.id]: {
          docId: requirement.id,
          itemNo: requirement.itemNo,
          code: requirement.code,
          title: requirement.title,
          issuingOffice: requirement.issuingOffice,
          cloudinaryUrl: result.secure_url || result.url,
          fileName: result.original_filename || file.name,
          fileSize: result.bytes || file.size,
          format: result.format || file.name.split('.').pop(),
          publicId: result.public_id,
          isLocalPreview: result.isLocalPreview || false,
          uploadedAt: new Date().toISOString()
        }
      };

      if (onDocumentsChange) {
        onDocumentsChange(updatedDocs);
      }
      setUploadProgress(prev => ({ ...prev, [requirement.id]: null }));
    } catch (err) {
      console.error('Document upload error:', err);
      setUploadErrors(prev => ({
        ...prev,
        [requirement.id]: err.message || 'Upload failed. Please check connection.'
      }));
      setUploadProgress(prev => ({ ...prev, [requirement.id]: null }));
    }
  };

  const handleRemoveDocument = (requirementId) => {
    const updatedDocs = { ...uploadedDocuments };
    delete updatedDocs[requirementId];
    if (onDocumentsChange) {
      onDocumentsChange(updatedDocs);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const newCfg = {
      cloudName: tempCloudName.trim() || 'demo',
      uploadPreset: tempPreset.trim(),
      folder: 'bplo_arta_documents',
      isCustom: Boolean(tempCloudName.trim() && tempPreset.trim())
    };

    saveCloudinaryConfig(newCfg);
    setConfig(newCfg);
    setConfigSavedToast(true);
    setTimeout(() => {
      setConfigSavedToast(false);
      setShowConfigModal(false);
    }, 1200);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getOfficeBadgeColor = (short) => {
    switch (short) {
      case 'CPDO': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'OBO': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'CENRO': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'City Treasurer':
      case 'Treasurer / Brgy': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'City Health': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'BPLO': return 'bg-green-100 text-green-800 border-green-300';
      case 'BFP': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Barangay': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DTI':
      case 'SEC':
      case 'CDA': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 bg-white space-y-5 shadow-xs font-['Poppins',sans-serif]">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-[#159847]" />
              <span>Documentary Requirements for New Business Permit</span>
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>City of Bogo Official Checklist</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 font-normal mt-1">
            Standard checklist based on City of Bogo BPLO guidelines, Ease of Doing Business Act (RA 11032), and inter-agency clearances.
          </p>
        </div>

        {/* Action Buttons: Official Requirements Slip & Cloudinary Config */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowOfficialSlipModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            title="View exact paper slip of requirements"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Official Slip Format</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
            <Cloud className="w-3.5 h-3.5 text-sky-600" />
            <span>Cloudinary: <strong className="font-semibold">{config.cloudName || 'demo'}</strong></span>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-full border border-slate-200 text-gray-600 hover:text-gray-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Configure Cloudinary Credentials"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Condition Switches Bar */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-[#159847]" />
            <span>Application Conditions & Specific Triggers:</span>
          </div>
          <span className="text-[11px] text-gray-500">
            Checkboxes dynamically add or adjust required documentary clearances below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Org Type Indicator */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-gray-400 block uppercase font-semibold">Entity Type:</span>
              <span className="font-bold text-slate-800 truncate block">
                {formData.typeOfOrganization || 'Single Proprietorship'}
              </span>
            </div>
          </div>

          {/* Rented Premise Toggle */}
          <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all shadow-2xs ${
            formData.isRented 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold' 
              : 'bg-white border-slate-200 text-gray-700 hover:border-slate-300'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(formData.isRented)}
              onChange={(e) => handleToggle('isRented', e.target.checked)}
              className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847]"
            />
            <div className="min-w-0">
              <span className="text-xs block truncate">Place is Rented</span>
              <span className="text-[10px] text-gray-400 block font-normal">Adds Lease & Lessor Permit</span>
            </div>
          </label>

          {/* Public Market Stall Toggle */}
          <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all shadow-2xs ${
            formData.isMarketStall 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold' 
              : 'bg-white border-slate-200 text-gray-700 hover:border-slate-300'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(formData.isMarketStall)}
              onChange={(e) => handleToggle('isMarketStall', e.target.checked)}
              className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847]"
            />
            <div className="min-w-0">
              <span className="text-xs block truncate">Bogo Public Market Stall</span>
              <span className="text-[10px] text-gray-400 block font-normal">Adds Stall Clearance (Item 12)</span>
            </div>
          </label>

          {/* Transacting via Representative Toggle */}
          <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all shadow-2xs ${
            formData.isRepresentative 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold' 
              : 'bg-white border-slate-200 text-gray-700 hover:border-slate-300'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(formData.isRepresentative)}
              onChange={(e) => handleToggle('isRepresentative', e.target.checked)}
              className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847]"
            />
            <div className="min-w-0">
              <span className="text-xs block truncate">Through Representative</span>
              <span className="text-[10px] text-gray-400 block font-normal">Adds Auth Letter & IDs</span>
            </div>
          </label>
        </div>

        {/* Specific Industry Clearances Selector Trigger */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-700">Specific Business Clearances (Items a–m):</span>
            {(formData.specialBusinessTypes || []).length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#159847] text-white">
                {(formData.specialBusinessTypes || []).length} Selected
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 italic">None selected (Standard retail/service)</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSpecialSelector(!showSpecialSelector)}
            className="text-xs text-[#159847] hover:text-[#12823c] font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{showSpecialSelector ? 'Hide Industry Selector' : 'Configure Specific Line of Business (a–m)'}</span>
            {showSpecialSelector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Specific Business Type Drawer */}
        {showSpecialSelector && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 mt-2">
            <p className="text-[11px] text-gray-500 font-normal">
              Check all classifications that apply to this establishment. Each requires 1 original copy and 1 photocopy:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {SPECIAL_BUSINESS_TYPES_CONFIG.map(spec => {
                const isSelected = (formData.specialBusinessTypes || []).includes(spec.id);
                return (
                  <label
                    key={spec.id}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium' 
                        : 'bg-slate-50/50 border-slate-200 text-gray-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSpecialType(spec.id)}
                      className="w-3.5 h-3.5 rounded text-[#159847] focus:ring-[#159847] mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold uppercase text-[10px] px-1 rounded bg-slate-200 text-slate-800">
                          {spec.letter}
                        </span>
                        <span className="font-semibold text-slate-900">{spec.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">
                        {spec.subtitle}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. ARTA Compliance Progress Tracker */}
      <div className={`p-4 rounded-xl border transition-all ${
        isFullyCompliant 
          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
          : 'bg-amber-50/60 border-amber-300 text-amber-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2">
          <div className="flex items-center gap-2 font-medium">
            {isFullyCompliant ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-bold text-sm text-emerald-900">
                  All Mandatory Requirements Uploaded ({uploadedMandatoryCount} of {mandatoryDocs.length})
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="font-bold text-sm text-amber-900">
                  Mandatory Requirements: {uploadedMandatoryCount} of {mandatoryDocs.length} Attached ({compliancePercentage}%)
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-gray-600">
              Total Files Attached: <strong>{totalUploadedCount} / {requirements.length}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-white border border-slate-300 text-slate-800">
              {isFullyCompliant ? 'Ready for BPLO Verification' : 'Incomplete Uploads'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200/90 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              isFullyCompliant ? 'bg-[#159847]' : 'bg-amber-500'
            }`}
            style={{ width: `${compliancePercentage}%` }}
          />
        </div>

        <p className="text-[11px] text-gray-600 mt-2 flex items-center gap-1.5 font-normal">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>
            <strong>Note on Fire Safety Inspection Certificate (FSIC - Item 15):</strong> Bureau of Fire Protection clearance is marked <em>to follow after all other requirements are completed</em> per standard BPLO workflow.
          </span>
        </p>
      </div>

      {/* 4. Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-[#159847] text-white shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
          }`}
        >
          <span>All Applicable</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
            {requirements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('core')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'core'
              ? 'bg-[#159847] text-white shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
          }`}
        >
          <span>General Clearances (1–15)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {requirements.filter(r => r.category === 'core').length}
          </span>
        </button>

        {(formData.isRented || formData.isMarketStall) && (
          <button
            type="button"
            onClick={() => setActiveFilter('lease')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'lease'
                ? 'bg-[#159847] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
            }`}
          >
            <span>Lease & Location (10–12)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
              {requirements.filter(r => r.category === 'lease' || r.category === 'market').length}
            </span>
          </button>
        )}

        {(formData.specialBusinessTypes || []).length > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilter('specific')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'specific'
                ? 'bg-[#159847] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
            }`}
          >
            <span>Industry Specific (a–m)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
              {requirements.filter(r => r.category === 'specific').length}
            </span>
          </button>
        )}

        {formData.isRepresentative && (
          <button
            type="button"
            onClick={() => setActiveFilter('representative')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'representative'
                ? 'bg-[#159847] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-slate-100'
            }`}
          >
            <span>Representative (1 & 2)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
              {requirements.filter(r => r.category === 'representative').length}
            </span>
          </button>
        )}
      </div>

      {/* 5. Requirements Cards List (Single Column) */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredRequirements.map((req) => {
          const doc = uploadedDocuments[req.id];
          const isUploading = Boolean(uploadProgress[req.id]);
          const progressVal = uploadProgress[req.id] || 0;
          const errorMsg = uploadErrors[req.id];

          return (
            <div 
              key={req.id} 
              className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                doc 
                  ? 'border-emerald-300 bg-emerald-50/30 shadow-2xs' 
                  : req.isMandatory 
                    ? 'border-slate-300 bg-slate-50/50 hover:border-slate-400' 
                    : req.isToFollow
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/20'
              }`}
            >
              {/* Document Meta Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Item Number Badge */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                      Item {req.itemNo}
                    </span>

                    {/* Department / Issuing Office Badge */}
                    <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded ${getOfficeBadgeColor(req.issuingOfficeShort)}`}>
                      {req.issuingOfficeShort || req.issuingOffice}
                    </span>

                    {/* Mandatory vs To Follow */}
                    {req.isMandatory ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        Mandatory
                      </span>
                    ) : req.isToFollow ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        To Follow (BFP)
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        Optional / Integrated
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-medium text-gray-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {req.copyType || 'Original copy'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1">
                  {req.title}
                </h4>
                <p className="text-[11px] text-gray-600 font-normal mt-1 leading-relaxed">
                  {req.subtitle}
                </p>

                <div className="mt-2 text-[10px] text-gray-400 font-medium flex items-center gap-1">
                  <span>Issuing Office:</span>
                  <span className="text-gray-600 font-semibold">{req.issuingOffice}</span>
                </div>
              </div>

              {/* Upload Body / Uploaded State */}
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                {doc ? (
                  /* Attached Document Card */
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">Cloudinary Stored</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <a
                        href={doc.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-600 hover:text-sky-700 hover:bg-slate-50 rounded-md transition-colors"
                        title="Open Cloudinary Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(req.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Upload Zone */
                  <div>
                    {isUploading ? (
                      <div className="p-3 bg-white rounded-lg border border-sky-200 text-center space-y-2">
                        <div className="flex items-center justify-between text-xs text-sky-800 font-medium">
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                            Uploading to Cloudinary...
                          </span>
                          <span className="font-bold">{progressVal}%</span>
                        </div>
                        <div className="w-full bg-sky-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-sky-500 h-full transition-all duration-200"
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <label className="group flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-emerald-50/50 hover:border-[#159847] cursor-pointer transition-all">
                        <FolderUp className="w-4 h-4 text-gray-400 group-hover:text-[#159847] transition-colors" />
                        <span className="text-xs font-semibold text-gray-600 group-hover:text-[#159847]">
                          Upload Document ({req.copyType || 'PDF or Image'})
                        </span>
                        <input
                          type="file"
                          accept={req.accept || '.pdf,.jpg,.jpeg,.png'}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelect(req, e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    )}

                    {errorMsg && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Official Requirements Slip Printable Modal */}
      {showOfficialSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#159847]" />
                <span className="font-bold text-slate-800 text-sm">
                  Official Requirements Slip - City of Bogo BPLO
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-full bg-[#159847] hover:bg-[#12823c] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfficialSlipModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Content formatted exactly like the physical paper slip */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono text-slate-900 leading-relaxed bg-[#FFFDF9]">
              <div className="text-center border-b border-slate-300 pb-3">
                <h3 className="font-bold text-sm tracking-wide uppercase">
                  Documentary Requirements for New Business Permit
                </h3>
                <p className="text-[11px] text-gray-600 mt-0.5">City of Bogo • Business Permit and Licensing Office</p>
              </div>

              {/* Items 1 to 15 */}
              <div className="space-y-1.5 text-[11px]">
                <p>1) Filled up Unified Business Permit Application Form;</p>
                <p>2) DTI Registration for Single Proprietorship; SEC Certificate for Partnership, Corporation, and One Person Corporation; CDA Registration for Cooperatives; and Franchise Agreement, if franchisee;</p>
                <p>3) Zoning Clearance; (City Planning & Development Office)</p>
                <p>4) Locational Clearance; (City Planning & Development Office)</p>
                <p>5) Occupancy Permit; (OBO)</p>
                <p>6) CENRO Business Clearance; (CENRO)</p>
                <p>7) Real Property Tax Clearance; (Treasurer's Office)</p>
                <p>8) Residence Certificate / Corporate Cedula (original copy);</p>
                <p>9) Barangay Clearance (original copy);</p>
                <p>10) Notarized Contract of Lease, if place of business is rented;</p>
                <p>11) Lessor's Business Permit, if renting;</p>
                <p>12) Stall Clearance (if business is located at the Bogo City Public Market);</p>
                <p>13) Sanitary Permit; (City Health Office)</p>
                <p>14) Inspection Report from BPLO;</p>
                <p>15) Fire Safety Inspection Certificate (to follow after all requirements above are completed);</p>
              </div>

              {/* Specific Type of Business */}
              <div className="pt-2 border-t border-slate-200">
                <p className="font-bold text-[11px] mb-1">
                  Additional Requirements for Specific Type of Business: (1 original copy / 1 photocopy copy)
                </p>
                <div className="space-y-1 text-[10.5px] pl-2 text-slate-800">
                  <p>a. Gasoline Stations – Environmental Compliance Certificate (ECC), COC (Certificate of Compliance), Special Use Permit</p>
                  <p>b. Junkshops – Barangay Resolution</p>
                  <p>c. Quarry – Governor's Permit</p>
                  <p>d. Piggery and Poultry Farms – Council Resolution and Environmental Compliance Certificate (ECC)</p>
                  <p>e. Water Refilling Stations – Bogo Water District Clearance</p>
                  <p>f. Subdivisions – Council Resolution</p>
                  <p>g. Online Sabong – Council Resolution</p>
                  <p>h. Restaurants, Beach Resorts and Accommodations – Tourism Accreditation</p>
                  <p>i. Meat and Poultry Products – Vet Certificate</p>
                  <p>j. AMLC Registration</p>
                  <p>k. MNRC Registration</p>
                  <p>l. PTR</p>
                  <p>m. Radio Stations, Private Landing Strips, Abattoir/Slaughterhouse, Cockpits, Landfill, Night Clubs, Cabarets, Bars, Videoke Bar and Pub Houses – Special Use Permit</p>
                </div>
              </div>

              {/* Representative */}
              <div className="pt-2 border-t border-slate-200 text-[10.5px]">
                <p className="font-bold text-[11px] mb-1">If transacting through a representative:</p>
                <div className="space-y-1 pl-2 text-slate-800">
                  <p>1) Authorization letter executed by the Business Owner or Secretary's Certificate indicating specific transaction;</p>
                  <p>2) Any valid ID of the Business Owner or Corporate Secretary and Authorized Representative (1 photocopy each).</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOfficialSlipModal(false)}
                className="px-4 py-1.5 rounded-full border border-slate-300 text-gray-700 hover:bg-slate-100 font-medium text-xs cursor-pointer"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Cloudinary Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                <Cloud className="w-5 h-5 text-sky-600" />
                <span>Cloudinary Setup (Direct Upload)</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed font-normal">
                Uploads are sent directly from the browser to Cloudinary via Unsigned Upload Preset.
              </p>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Cloud Name *
                </label>
                <input
                  type="text"
                  value={tempCloudName}
                  onChange={(e) => setTempCloudName(e.target.value)}
                  placeholder="e.g. bogo-city-bplo or demo"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-normal focus:ring-2 focus:ring-[#159847] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Unsigned Upload Preset *
                </label>
                <input
                  type="text"
                  value={tempPreset}
                  onChange={(e) => setTempPreset(e.target.value)}
                  placeholder="e.g. bplo_arta_uploads"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-normal focus:ring-2 focus:ring-[#159847] focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  In Cloudinary Console &gt; Settings &gt; Upload &gt; Add upload preset &gt; set Signing Mode to <strong>Unsigned</strong>.
                  Leave empty to test with instant local preview mode.
                </p>
              </div>

              {configSavedToast && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Cloudinary credentials saved successfully!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-gray-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#159847] hover:bg-[#12823c] text-white font-medium shadow-xs cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Document Quick Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-[#159847]" />
                <span className="font-semibold text-slate-800 text-sm truncate max-w-sm">
                  {previewDoc.title || previewDoc.fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-50 flex items-center justify-center">
              {previewDoc.format?.toLowerCase() === 'pdf' ? (
                <iframe
                  src={previewDoc.cloudinaryUrl}
                  title="PDF Preview"
                  className="w-full h-96 rounded-lg border border-slate-200"
                />
              ) : (
                <img
                  src={previewDoc.cloudinaryUrl}
                  alt="Document Preview"
                  className="max-h-96 max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
              <span className="text-gray-500 font-normal">
                {previewDoc.fileName} • {formatFileSize(previewDoc.fileSize)}
              </span>
              <a
                href={previewDoc.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#159847] hover:text-[#12823c] font-medium"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
