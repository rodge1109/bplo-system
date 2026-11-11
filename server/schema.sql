-- =================================================================
-- MULTI-TENANT SUPABASE / POSTGRESQL SCHEMA FOR BPLO SYSTEM
-- Supports dynamic Cities/Municipalities via tenant_code distinction
-- =================================================================

-- 1. Tenants Table (City / Municipality Registry)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'BOGO', 'CEBU', 'MANDAUE'
    city_name VARCHAR(100) NOT NULL, -- e.g. 'City of Bogo'
    province_name VARCHAR(100) NOT NULL, -- e.g. 'Cebu'
    logo_url TEXT,
    document_code VARCHAR(50) DEFAULT 'QF-BPLO-01',
    primary_color VARCHAR(20) DEFAULT '#159847',
    website_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Tenants
INSERT INTO tenants (tenant_code, city_name, province_name, logo_url, document_code, primary_color, website_url)
VALUES 
  ('BOGO', 'City of Bogo', 'Cebu', 'https://res.cloudinary.com/demo/image/upload/v1790442410/brxtdbopzqncgyzclwxe.png', 'QF-BPLO-01', '#159847', 'www.cityofbogocebu.gov.ph'),
  ('CEBU', 'Cebu City', 'Cebu', 'https://res.cloudinary.com/demo/image/upload/v1790442410/brxtdbopzqncgyzclwxe.png', 'QF-BPLO-CEB-01', '#1E3A8A', 'www.cebucity.gov.ph'),
  ('MANDAUE', 'Mandaue City', 'Cebu', 'https://res.cloudinary.com/demo/image/upload/v1790442410/brxtdbopzqncgyzclwxe.png', 'QF-BPLO-MND-01', '#065F46', 'www.mandauecity.gov.ph')
ON CONFLICT (tenant_code) DO NOTHING;

-- 2. Main BPLO Application Table (Multi-tenant)
CREATE TABLE IF NOT EXISTS bplo_application (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) DEFAULT 'BOGO' NOT NULL, -- Multi-tenant distinction
    
    -- 1. Application Type & Basic Details
    application_type VARCHAR(20) NOT NULL, -- 'New', 'Renewal'
    amendment_type VARCHAR(100),
    mode_of_payment VARCHAR(20) NOT NULL, -- 'Annually', 'Quarterly'
    transfer_location BOOLEAN DEFAULT FALSE,
    business_start_date DATE,
    date_of_application DATE DEFAULT CURRENT_DATE,
    reference_no VARCHAR(100) UNIQUE,

    -- 2. Registration & Tax Details
    dti_sec_cda_reg_no VARCHAR(100),
    dti_sec_cda_reg_date DATE,
    type_of_organization VARCHAR(50),
    tin_no VARCHAR(50),
    has_tax_incentive BOOLEAN DEFAULT FALSE,
    tax_incentive_entity VARCHAR(255),
    ctc_no VARCHAR(50),

    -- 3. Taxpayer & Business Information
    taxpayer_last_name VARCHAR(100) NOT NULL,
    taxpayer_first_name VARCHAR(100) NOT NULL,
    taxpayer_middle_name VARCHAR(100),
    business_name VARCHAR(255) NOT NULL,
    trade_name_franchise VARCHAR(255),
    corp_president_treasurer_last_name VARCHAR(100),
    corp_president_treasurer_first_name VARCHAR(100),
    corp_president_treasurer_middle_name VARCHAR(100),

    -- 4. Business Address (Items 17.1 - 17.9)
    bus_house_bldg_no VARCHAR(100),
    bus_building_name VARCHAR(255),
    bus_street VARCHAR(255),
    bus_barangay VARCHAR(100) NOT NULL,
    bus_subdivision_landmark VARCHAR(255),
    bus_city_municipality VARCHAR(100) DEFAULT 'City of Bogo',
    bus_province VARCHAR(100) DEFAULT 'Cebu',
    bus_telephone_no VARCHAR(50),
    bus_email_address VARCHAR(255),

    -- 5. Owner's Address (Items 18.1 - 18.9)
    owner_house_bldg_no VARCHAR(100),
    owner_building_name VARCHAR(255),
    owner_street VARCHAR(255),
    owner_barangay VARCHAR(100),
    owner_subdivision_landmark VARCHAR(255),
    owner_city_municipality VARCHAR(100),
    owner_province VARCHAR(100),
    owner_telephone_no VARCHAR(50),
    owner_email_address VARCHAR(255),

    -- 6. Employees & Business Premises Details (Items 19 & 20)
    num_employees_male INT DEFAULT 0,
    num_employees_female INT DEFAULT 0,
    num_employees_bogo_residing INT DEFAULT 0,
    is_rented BOOLEAN DEFAULT FALSE,
    lessor_name VARCHAR(255),
    monthly_rental NUMERIC(12, 2),
    lessor_address TEXT,
    lessor_contact_no VARCHAR(50),
    lessor_email_address VARCHAR(255),

    -- 7. Emergency Contact (Items 21.1 - 21.3)
    emergency_contact_person VARCHAR(255),
    emergency_contact_no VARCHAR(50),
    emergency_email_address VARCHAR(255),

    -- 8. Business Activity / Financial Details (JSON array)
    business_activities JSONB,

    -- 9. Declaration & Audit
    applicant_signature_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure tenant_code and uploaded_documents columns exist if table was created previously
ALTER TABLE bplo_application ADD COLUMN IF NOT EXISTS tenant_code VARCHAR(50) DEFAULT 'BOGO';
ALTER TABLE bplo_application ADD COLUMN IF NOT EXISTS uploaded_documents JSONB;

-- 3. Business Activities Child Table (Multi-tenant)
CREATE TABLE IF NOT EXISTS bplo_business_activities (
    id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) DEFAULT 'BOGO',
    application_id INT REFERENCES bplo_application(id) ON DELETE CASCADE,
    code VARCHAR(50),
    line_of_business VARCHAR(255) NOT NULL,
    no_of_units INT DEFAULT 0,
    capitalization NUMERIC(12, 2) DEFAULT 0.00,
    gross_essential NUMERIC(12, 2) DEFAULT 0.00,
    gross_non_essential NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bplo_business_activities ADD COLUMN IF NOT EXISTS tenant_code VARCHAR(50) DEFAULT 'BOGO';

-- Performance & Multi-tenant Indexes
CREATE INDEX IF NOT EXISTS idx_bplo_app_tenant ON bplo_application(tenant_code);
CREATE INDEX IF NOT EXISTS idx_bplo_app_type ON bplo_application(application_type);
CREATE INDEX IF NOT EXISTS idx_bplo_app_status ON bplo_application(status);
CREATE INDEX IF NOT EXISTS idx_bplo_app_ref ON bplo_application(reference_no);
CREATE INDEX IF NOT EXISTS idx_bplo_app_taxpayer ON bplo_application(taxpayer_last_name, taxpayer_first_name);

-- Permissions for Supabase API access
GRANT ALL ON TABLE public.tenants TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.bplo_application TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.bplo_business_activities TO anon, authenticated, service_role, postgres;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;

ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bplo_application DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bplo_business_activities DISABLE ROW LEVEL SECURITY;
