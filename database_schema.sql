-- =============================================
-- ISLAMIC WILL GENERATOR - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if exists (for fresh start)
DROP TABLE IF EXISTS islamic_wills CASCADE;

-- =============================================
-- MAIN ISLAMIC WILLS TABLE
-- =============================================
CREATE TABLE islamic_wills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT,

    -- Testator Personal Information
    testator_title TEXT,
    testator_name TEXT,
    testator_aka TEXT,
    testator_email TEXT,
    testator_phone TEXT,
    testator_address TEXT,
    testator_dob DATE,
    testator_pob TEXT,
    testator_gender TEXT,
    testator_ni TEXT,
    testator_passport TEXT,
    testator_country TEXT,

    -- Will Type
    will_type TEXT DEFAULT 'simple',

    -- Executor 1
    executor1_name TEXT,
    executor1_address TEXT,
    executor1_relationship TEXT,
    executor1_phone TEXT,
    executor1_email TEXT,

    -- Executor 2
    executor2_name TEXT,
    executor2_address TEXT,
    executor2_relationship TEXT,
    executor2_phone TEXT,
    executor2_email TEXT,

    -- Funeral Arrangements
    burial_location TEXT DEFAULT 'uk',
    repatriation_country TEXT,
    preferred_cemetery TEXT,
    preferred_mosque TEXT,
    funeral_instructions TEXT,
    funeral_budget NUMERIC DEFAULT 0,

    -- Family - Marital
    marital_status TEXT,
    spouse_name TEXT,
    marriage_date DATE,
    mahr_status TEXT,
    mahr_amount NUMERIC DEFAULT 0,

    -- Family - Children
    has_children BOOLEAN DEFAULT false,

    -- Family - Parents
    father_status TEXT,
    father_name TEXT,
    mother_status TEXT,
    mother_name TEXT,

    -- Religious Obligations
    unpaid_zakat NUMERIC DEFAULT 0,
    fidyah_days INTEGER DEFAULT 0,
    kaffarah NUMERIC DEFAULT 0,
    hajj_status TEXT,
    hajj_badal BOOLEAN DEFAULT false,
    forgiven_debts TEXT,

    -- Wasiyyah
    make_wasiyyah BOOLEAN DEFAULT false,

    -- Guardianship
    has_minor_children BOOLEAN DEFAULT false,
    guardian1_name TEXT,
    guardian1_address TEXT,
    guardian1_relationship TEXT,
    guardian1_phone TEXT,
    guardian1_religion TEXT,
    guardian2_name TEXT,
    guardian2_address TEXT,
    guardian2_relationship TEXT,
    upbringing_wishes TEXT,

    -- Special Circumstances
    organ_donation TEXT DEFAULT 'defer',
    has_non_muslim_relatives BOOLEAN DEFAULT false,
    non_muslim_relatives TEXT,
    preferred_scholar TEXT,
    madhab TEXT,
    additional_wishes TEXT,
    people_forgiven TEXT,

    -- JSON Data (stores all form data)
    will_data JSONB DEFAULT '{}',
    children_data JSONB DEFAULT '[]',
    debts_data JSONB DEFAULT '[]',
    debts_owed_data JSONB DEFAULT '[]',
    assets_data JSONB DEFAULT '{}',
    wasiyyah_data JSONB DEFAULT '{}',

    -- Generated Will
    will_html TEXT,

    -- Status & Workflow
    status TEXT DEFAULT 'draft',

    -- Testator Signature
    testator_signed BOOLEAN DEFAULT false,
    testator_signed_at TIMESTAMPTZ,

    -- Witness 1
    witness1_name TEXT,
    witness1_address TEXT,
    witness1_occupation TEXT,
    witness1_signed BOOLEAN DEFAULT false,
    witness1_signed_at TIMESTAMPTZ,

    -- Witness 2
    witness2_name TEXT,
    witness2_address TEXT,
    witness2_occupation TEXT,
    witness2_signed BOOLEAN DEFAULT false,
    witness2_signed_at TIMESTAMPTZ,

    -- Solicitor Certification
    solicitor_name TEXT,
    solicitor_firm TEXT,
    solicitor_sra TEXT,
    solicitor_certified BOOLEAN DEFAULT false,
    solicitor_signed_at TIMESTAMPTZ,

    -- Mufti/Imam Certification
    mufti_name TEXT,
    mufti_institution TEXT,
    mufti_contact TEXT,
    mufti_certified BOOLEAN DEFAULT false,
    mufti_signed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUTO-GENERATE REFERENCE NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_will_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'IW-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_will_reference ON islamic_wills;
CREATE TRIGGER set_will_reference
    BEFORE INSERT ON islamic_wills
    FOR EACH ROW
    EXECUTE FUNCTION generate_will_reference();

-- =============================================
-- AUTO-UPDATE TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_will_timestamp ON islamic_wills;
CREATE TRIGGER update_will_timestamp
    BEFORE UPDATE ON islamic_wills
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- =============================================
-- INDEXES FOR FASTER QUERIES
-- =============================================
CREATE INDEX idx_wills_testator_name ON islamic_wills(testator_name);
CREATE INDEX idx_wills_testator_email ON islamic_wills(testator_email);
CREATE INDEX idx_wills_reference ON islamic_wills(reference_number);
CREATE INDEX idx_wills_status ON islamic_wills(status);
CREATE INDEX idx_wills_created ON islamic_wills(created_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY (Optional)
-- Uncomment if you want to restrict access
-- =============================================
-- ALTER TABLE islamic_wills ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the web form)
-- CREATE POLICY "Allow anonymous insert" ON islamic_wills FOR INSERT WITH CHECK (true);

-- Allow anonymous select (for loading saved wills)
-- CREATE POLICY "Allow anonymous select" ON islamic_wills FOR SELECT USING (true);

-- Allow anonymous update
-- CREATE POLICY "Allow anonymous update" ON islamic_wills FOR UPDATE USING (true);

-- Allow anonymous delete
-- CREATE POLICY "Allow anonymous delete" ON islamic_wills FOR DELETE USING (true);

-- =============================================
-- ISLAMIC LPA (LASTING POWER OF ATTORNEY) TABLE
-- =============================================
DROP TABLE IF EXISTS islamic_lpas CASCADE;

CREATE TABLE islamic_lpas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT,

    -- LPA Type
    lpa_type TEXT NOT NULL DEFAULT 'property', -- 'property' or 'health'

    -- Donor Information (Section 1)
    donor_title TEXT,
    donor_first_names TEXT,
    donor_last_name TEXT,
    donor_name TEXT, -- concatenated display name
    donor_aka TEXT,
    donor_dob DATE,
    donor_address TEXT,
    donor_email TEXT,
    donor_phone TEXT,
    donor_ni TEXT,

    -- Attorney Decision Type
    attorney_decision_type TEXT DEFAULT 'jointly', -- 'jointly', 'jointly-severally', 'mixed'
    joint_decisions_detail TEXT,

    -- Section 3 (type-specific)
    -- LP1F: when attorneys can act
    attorneys_can_act TEXT DEFAULT 'registered', -- 'registered' or 'lack-capacity'
    -- LP1H: life-sustaining treatment
    life_sustaining_authority TEXT DEFAULT 'give', -- 'give' or 'do-not-give'

    -- Certificate Provider (Section 8)
    certificate_provider_title TEXT,
    certificate_provider_first_names TEXT,
    certificate_provider_last_name TEXT,
    certificate_provider_name TEXT, -- concatenated display name
    certificate_provider_address TEXT,
    certificate_provider_type TEXT, -- 'knowledge' or 'professional'
    certificate_provider_relationship TEXT,

    -- Islamic Instructions (Property & Financial)
    instruct_no_riba BOOLEAN DEFAULT true,
    instruct_halal_investments BOOLEAN DEFAULT true,
    instruct_zakat BOOLEAN DEFAULT true,
    instruct_consult_scholar BOOLEAN DEFAULT false,
    instruct_property_mgmt BOOLEAN DEFAULT false,
    additional_instructions TEXT,
    preferred_islamic_bank TEXT,
    shariah_advisor TEXT,
    additional_preferences TEXT,
    zakat_date TEXT,
    consult_threshold TEXT,

    -- Islamic Preferences (Property & Financial)
    pref_islamic_banking BOOLEAN DEFAULT false,
    pref_sadaqah BOOLEAN DEFAULT false,
    pref_debt_priority BOOLEAN DEFAULT false,
    sadaqah_details TEXT,

    -- Islamic Instructions (Health & Welfare)
    instruct_halal_food BOOLEAN DEFAULT true,
    instruct_modesty BOOLEAN DEFAULT true,
    instruct_medical_decisions BOOLEAN DEFAULT true,
    instruct_prayer BOOLEAN DEFAULT true,
    instruct_mental_health BOOLEAN DEFAULT false,
    instruct_scholar_consult BOOLEAN DEFAULT false,
    organ_donation TEXT,
    named_scholar TEXT,
    health_additional_instructions TEXT,
    living_preferences TEXT,
    preferred_mosque_lpa TEXT,
    health_additional_preferences TEXT,

    -- Islamic Preferences (Health & Welfare)
    pref_home_care BOOLEAN DEFAULT false,
    pref_islamic_care_home BOOLEAN DEFAULT false,
    pref_muslim_carers BOOLEAN DEFAULT false,
    pref_quran_recitation BOOLEAN DEFAULT false,
    pref_ruqyah BOOLEAN DEFAULT false,
    pref_mosque_visitors BOOLEAN DEFAULT false,

    -- Burial Wishes (Health & Welfare)
    pref_islamic_burial BOOLEAN DEFAULT false,
    pref_no_embalming BOOLEAN DEFAULT false,
    pref_janazah BOOLEAN DEFAULT false,
    burial_contact TEXT,

    -- Attorneys confirmation
    attorneys_are_muslim BOOLEAN DEFAULT false,

    -- JSON data
    lpa_data JSONB DEFAULT '{}',
    attorneys_data JSONB DEFAULT '[]',
    replacement_attorneys_data JSONB DEFAULT '[]',
    notify_persons_data JSONB DEFAULT '[]',

    -- Generated documents
    lpa_html TEXT,
    gov_form_html TEXT,

    -- Status
    status TEXT DEFAULT 'draft',

    -- Donor signature
    donor_signed BOOLEAN DEFAULT false,
    donor_signed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate LPA reference number
CREATE OR REPLACE FUNCTION generate_lpa_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'LPA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_lpa_reference ON islamic_lpas;
CREATE TRIGGER set_lpa_reference
    BEFORE INSERT ON islamic_lpas
    FOR EACH ROW
    EXECUTE FUNCTION generate_lpa_reference();

-- Auto-update timestamp for LPAs
DROP TRIGGER IF EXISTS update_lpa_timestamp ON islamic_lpas;
CREATE TRIGGER update_lpa_timestamp
    BEFORE UPDATE ON islamic_lpas
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Indexes for LPAs
CREATE INDEX idx_lpas_donor_name ON islamic_lpas(donor_name);
CREATE INDEX idx_lpas_donor_email ON islamic_lpas(donor_email);
CREATE INDEX idx_lpas_reference ON islamic_lpas(reference_number);
CREATE INDEX idx_lpas_status ON islamic_lpas(status);
CREATE INDEX idx_lpas_type ON islamic_lpas(lpa_type);
CREATE INDEX idx_lpas_created ON islamic_lpas(created_at DESC);

-- =============================================
-- MIGRATION: Update islamic_lpas for new Islamic guidance fields
-- Run this if you already have the islamic_lpas table
-- =============================================

-- Add debts_owed_data column to islamic_wills
ALTER TABLE islamic_wills ADD COLUMN IF NOT EXISTS debts_owed_data JSONB DEFAULT '[]';

-- Remove old columns that have been replaced
ALTER TABLE islamic_lpas DROP COLUMN IF EXISTS instruct_islamic_banking;
ALTER TABLE islamic_lpas DROP COLUMN IF EXISTS instruct_islamic_care;
ALTER TABLE islamic_lpas DROP COLUMN IF EXISTS instruct_end_of_life;
ALTER TABLE islamic_lpas DROP COLUMN IF EXISTS instruct_no_post_mortem;
ALTER TABLE islamic_lpas DROP COLUMN IF EXISTS instruct_muslim_carers;

-- Add new Property & Financial instruction fields
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS instruct_property_mgmt BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS zakat_date TEXT;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS consult_threshold TEXT;

-- Add new Property & Financial preference fields
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_islamic_banking BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_sadaqah BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_debt_priority BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS sadaqah_details TEXT;

-- Add new Health & Welfare instruction fields
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS instruct_modesty BOOLEAN DEFAULT true;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS instruct_medical_decisions BOOLEAN DEFAULT true;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS instruct_mental_health BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS organ_donation TEXT;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS named_scholar TEXT;

-- Add new Health & Welfare preference fields
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_home_care BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_islamic_care_home BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_muslim_carers BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_quran_recitation BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_ruqyah BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_mosque_visitors BOOLEAN DEFAULT false;

-- Add Burial Wishes fields
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_islamic_burial BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_no_embalming BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS pref_janazah BOOLEAN DEFAULT false;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS burial_contact TEXT;

-- =============================================
-- STANDARD WILLS TABLE
-- =============================================
DROP TABLE IF EXISTS standard_wills CASCADE;

CREATE TABLE standard_wills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT,

    -- Testator Personal Information
    testator_title TEXT,
    testator_name TEXT,
    testator_aka TEXT,
    testator_email TEXT,
    testator_phone TEXT,
    testator_address TEXT,
    testator_dob DATE,
    testator_pob TEXT,
    testator_gender TEXT,
    testator_ni TEXT,
    testator_passport TEXT,
    testator_country TEXT,

    -- Will Type
    will_type TEXT DEFAULT 'simple',

    -- Executor 1
    executor1_name TEXT,
    executor1_address TEXT,
    executor1_relationship TEXT,
    executor1_phone TEXT,
    executor1_email TEXT,

    -- Executor 2
    executor2_name TEXT,
    executor2_address TEXT,
    executor2_relationship TEXT,
    executor2_phone TEXT,
    executor2_email TEXT,

    -- Funeral Arrangements
    funeral_type TEXT DEFAULT 'burial',
    funeral_style TEXT,
    funeral_location TEXT,
    cremation_ashes TEXT,
    funeral_instructions TEXT,
    funeral_budget NUMERIC DEFAULT 0,

    -- Family - Marital
    marital_status TEXT,
    spouse_name TEXT,
    marriage_date DATE,

    -- Family - Children
    has_children BOOLEAN DEFAULT false,

    -- Family - Parents
    father_status TEXT,
    father_name TEXT,
    mother_status TEXT,
    mother_name TEXT,

    -- Guardianship
    has_minor_children BOOLEAN DEFAULT false,
    guardian1_name TEXT,
    guardian1_address TEXT,
    guardian1_relationship TEXT,
    guardian1_phone TEXT,
    guardian2_name TEXT,
    guardian2_address TEXT,
    guardian2_relationship TEXT,
    upbringing_wishes TEXT,

    -- Special Circumstances
    organ_donation TEXT DEFAULT 'defer',
    additional_wishes TEXT,

    -- JSON Data
    will_data JSONB DEFAULT '{}',
    children_data JSONB DEFAULT '[]',
    debts_data JSONB DEFAULT '[]',
    debts_owed_data JSONB DEFAULT '[]',
    assets_data JSONB DEFAULT '{}',
    beneficiaries_data JSONB DEFAULT '{}',

    -- Generated Will
    will_html TEXT,

    -- Status & Workflow
    status TEXT DEFAULT 'draft',

    -- Testator Signature
    testator_signed BOOLEAN DEFAULT false,
    testator_signed_at TIMESTAMPTZ,

    -- Witness 1
    witness1_name TEXT,
    witness1_address TEXT,
    witness1_occupation TEXT,
    witness1_signed BOOLEAN DEFAULT false,
    witness1_signed_at TIMESTAMPTZ,

    -- Witness 2
    witness2_name TEXT,
    witness2_address TEXT,
    witness2_occupation TEXT,
    witness2_signed BOOLEAN DEFAULT false,
    witness2_signed_at TIMESTAMPTZ,

    -- Solicitor Certification
    solicitor_name TEXT,
    solicitor_firm TEXT,
    solicitor_sra TEXT,
    solicitor_certified BOOLEAN DEFAULT false,
    solicitor_signed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate Standard Will reference number
CREATE OR REPLACE FUNCTION generate_standard_will_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'SW-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_standard_will_reference ON standard_wills;
CREATE TRIGGER set_standard_will_reference
    BEFORE INSERT ON standard_wills
    FOR EACH ROW
    EXECUTE FUNCTION generate_standard_will_reference();

DROP TRIGGER IF EXISTS update_standard_will_timestamp ON standard_wills;
CREATE TRIGGER update_standard_will_timestamp
    BEFORE UPDATE ON standard_wills
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Indexes for Standard Wills
CREATE INDEX idx_std_wills_testator_name ON standard_wills(testator_name);
CREATE INDEX idx_std_wills_testator_email ON standard_wills(testator_email);
CREATE INDEX idx_std_wills_reference ON standard_wills(reference_number);
CREATE INDEX idx_std_wills_status ON standard_wills(status);
CREATE INDEX idx_std_wills_created ON standard_wills(created_at DESC);

-- =============================================
-- STANDARD LPAS TABLE
-- =============================================
DROP TABLE IF EXISTS standard_lpas CASCADE;

CREATE TABLE standard_lpas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT,

    -- LPA Type
    lpa_type TEXT NOT NULL DEFAULT 'property',

    -- Donor Information
    donor_title TEXT,
    donor_first_names TEXT,
    donor_last_name TEXT,
    donor_name TEXT, -- concatenated display name
    donor_aka TEXT,
    donor_dob DATE,
    donor_address TEXT,
    donor_email TEXT,
    donor_phone TEXT,
    donor_ni TEXT,

    -- Attorney Decision Type
    attorney_decision_type TEXT DEFAULT 'jointly',
    joint_decisions_detail TEXT,

    -- Type-specific
    attorneys_can_act TEXT DEFAULT 'registered',
    life_sustaining_authority TEXT DEFAULT 'give',

    -- Certificate Provider
    certificate_provider_title TEXT,
    certificate_provider_first_names TEXT,
    certificate_provider_last_name TEXT,
    certificate_provider_name TEXT, -- concatenated display name
    certificate_provider_address TEXT,
    certificate_provider_type TEXT,
    certificate_provider_relationship TEXT,

    -- Standard Preferences (not Islamic)
    financial_preferences TEXT,
    care_preferences TEXT,
    dietary_requirements TEXT,
    organ_donation TEXT,
    additional_instructions TEXT,
    additional_preferences TEXT,

    -- JSON data
    lpa_data JSONB DEFAULT '{}',
    attorneys_data JSONB DEFAULT '[]',
    replacement_attorneys_data JSONB DEFAULT '[]',
    notify_persons_data JSONB DEFAULT '[]',

    -- Generated documents
    lpa_html TEXT,
    gov_form_html TEXT,

    -- Status
    status TEXT DEFAULT 'draft',

    -- Donor signature
    donor_signed BOOLEAN DEFAULT false,
    donor_signed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate Standard LPA reference number
CREATE OR REPLACE FUNCTION generate_standard_lpa_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'SLPA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_standard_lpa_reference ON standard_lpas;
CREATE TRIGGER set_standard_lpa_reference
    BEFORE INSERT ON standard_lpas
    FOR EACH ROW
    EXECUTE FUNCTION generate_standard_lpa_reference();

DROP TRIGGER IF EXISTS update_standard_lpa_timestamp ON standard_lpas;
CREATE TRIGGER update_standard_lpa_timestamp
    BEFORE UPDATE ON standard_lpas
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Indexes for Standard LPAs
CREATE INDEX idx_std_lpas_donor_name ON standard_lpas(donor_name);
CREATE INDEX idx_std_lpas_donor_email ON standard_lpas(donor_email);
CREATE INDEX idx_std_lpas_reference ON standard_lpas(reference_number);
CREATE INDEX idx_std_lpas_status ON standard_lpas(status);
CREATE INDEX idx_std_lpas_type ON standard_lpas(lpa_type);
CREATE INDEX idx_std_lpas_created ON standard_lpas(created_at DESC);

-- =============================================
-- BUSINESS CONFIG TABLE (White-Label)
-- =============================================
DROP TABLE IF EXISTS business_config CASCADE;

CREATE TABLE business_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),

    -- Branding
    business_name TEXT DEFAULT 'Will & LPA Generator',
    business_logo_url TEXT,
    primary_color TEXT DEFAULT '#1e3a5f',
    secondary_color TEXT DEFAULT '#d4af37',
    accent_color TEXT DEFAULT '#1b7340',

    -- Feature Toggles
    enable_islamic_will BOOLEAN DEFAULT true,
    enable_islamic_lpa BOOLEAN DEFAULT true,
    enable_standard_will BOOLEAN DEFAULT true,
    enable_standard_lpa BOOLEAN DEFAULT true,

    -- Contact Info
    contact_email TEXT,
    contact_phone TEXT,
    website_url TEXT,

    -- Footer
    footer_text TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_business_config_timestamp ON business_config;
CREATE TRIGGER update_business_config_timestamp
    BEFORE UPDATE ON business_config
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- =============================================
-- MIGRATION: Add Title/Name split columns to LPA tables
-- Run this if you already have the islamic_lpas/standard_lpas tables
-- =============================================

-- Islamic LPAs: donor name split
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS donor_title TEXT;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS donor_first_names TEXT;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS donor_last_name TEXT;

-- Islamic LPAs: certificate provider name split
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS certificate_provider_title TEXT;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS certificate_provider_first_names TEXT;
ALTER TABLE islamic_lpas ADD COLUMN IF NOT EXISTS certificate_provider_last_name TEXT;

-- Standard LPAs: donor name split
ALTER TABLE standard_lpas ADD COLUMN IF NOT EXISTS donor_title TEXT;
ALTER TABLE standard_lpas ADD COLUMN IF NOT EXISTS donor_first_names TEXT;
ALTER TABLE standard_lpas ADD COLUMN IF NOT EXISTS donor_last_name TEXT;

-- Standard LPAs: certificate provider name split
ALTER TABLE standard_lpas ADD COLUMN IF NOT EXISTS certificate_provider_title TEXT;
ALTER TABLE standard_lpas ADD COLUMN IF NOT EXISTS certificate_provider_first_names TEXT;
ALTER TABLE standard_lpas ADD COLUMN IF NOT EXISTS certificate_provider_last_name TEXT;

-- =============================================
-- MIGRATION: Add testator_title to Will tables
-- Run this if you already have the islamic_wills/standard_wills tables
-- =============================================

ALTER TABLE islamic_wills ADD COLUMN IF NOT EXISTS testator_title TEXT;
ALTER TABLE standard_wills ADD COLUMN IF NOT EXISTS testator_title TEXT;

-- =============================================
-- DONE! Your database is ready.
-- =============================================
