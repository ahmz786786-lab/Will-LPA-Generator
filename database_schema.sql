-- =============================================
-- ISLAMIC WILL GENERATOR - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ISLAMIC WILLS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS islamic_wills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Testator Information
    testator_name TEXT,
    testator_email TEXT,
    testator_phone TEXT,
    testator_address TEXT,
    testator_dob DATE,

    -- Will Details
    will_type TEXT DEFAULT 'simple', -- simple, comprehensive
    reference_number TEXT,

    -- Family Information
    marital_status TEXT,
    spouse_name TEXT,
    mahr_status TEXT,
    mahr_amount NUMERIC DEFAULT 0,
    has_children BOOLEAN DEFAULT false,

    -- Executors
    executor1_name TEXT,
    executor1_address TEXT,
    executor1_relationship TEXT,
    executor2_name TEXT,
    executor2_address TEXT,
    executor2_relationship TEXT,

    -- Funeral Wishes
    burial_location TEXT DEFAULT 'uk',
    repatriation_country TEXT,
    preferred_cemetery TEXT,
    preferred_mosque TEXT,
    funeral_instructions TEXT,

    -- Special Preferences
    organ_donation TEXT DEFAULT 'defer',
    make_wasiyyah BOOLEAN DEFAULT false,

    -- Guardianship
    guardian_name TEXT,
    guardian_address TEXT,
    guardian_relationship TEXT,

    -- Full Form Data (JSON)
    will_data JSONB DEFAULT '{}',

    -- Generated Will Content
    will_html TEXT,

    -- Status
    status TEXT DEFAULT 'draft', -- draft, pending_review, approved, signed

    -- Signatures
    testator_signed_at TIMESTAMPTZ,
    witness1_name TEXT,
    witness1_signed_at TIMESTAMPTZ,
    witness2_name TEXT,
    witness2_signed_at TIMESTAMPTZ,

    -- Solicitor Certification
    solicitor_name TEXT,
    solicitor_firm TEXT,
    solicitor_sra_number TEXT,
    solicitor_signed_at TIMESTAMPTZ,
    solicitor_certified BOOLEAN DEFAULT false,

    -- Mufti/Imam Certification
    mufti_name TEXT,
    mufti_institution TEXT,
    mufti_signed_at TIMESTAMPTZ,
    mufti_certified BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CHILDREN TABLE (linked to wills)
-- =============================================
CREATE TABLE IF NOT EXISTS will_children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    will_id UUID REFERENCES islamic_wills(id) ON DELETE CASCADE,
    name TEXT,
    gender TEXT,
    date_of_birth DATE,
    mother_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BENEFICIARIES TABLE (Wasiyyah recipients)
-- =============================================
CREATE TABLE IF NOT EXISTS will_beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    will_id UUID REFERENCES islamic_wills(id) ON DELETE CASCADE,
    beneficiary_type TEXT, -- charity, non_heir, adopted
    name TEXT,
    relationship TEXT,
    percentage NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    purpose TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ASSETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS will_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    will_id UUID REFERENCES islamic_wills(id) ON DELETE CASCADE,
    asset_type TEXT, -- property, bank_account, investment, business, vehicle, valuable, crypto
    description TEXT,
    location TEXT,
    ownership_type TEXT,
    estimated_value NUMERIC DEFAULT 0,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DEBTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS will_debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    will_id UUID REFERENCES islamic_wills(id) ON DELETE CASCADE,
    debt_type TEXT, -- owed_by_testator, owed_to_testator, religious
    creditor_debtor TEXT,
    amount NUMERIC DEFAULT 0,
    description TEXT,
    forgiven BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_islamic_wills_email ON islamic_wills(testator_email);
CREATE INDEX IF NOT EXISTS idx_islamic_wills_status ON islamic_wills(status);
CREATE INDEX IF NOT EXISTS idx_islamic_wills_created ON islamic_wills(created_at);
CREATE INDEX IF NOT EXISTS idx_will_children_will ON will_children(will_id);
CREATE INDEX IF NOT EXISTS idx_will_beneficiaries_will ON will_beneficiaries(will_id);
CREATE INDEX IF NOT EXISTS idx_will_assets_will ON will_assets(will_id);
CREATE INDEX IF NOT EXISTS idx_will_debts_will ON will_debts(will_id);

-- =============================================
-- AUTO-GENERATE REFERENCE NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_will_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'IW-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_will_reference
    BEFORE INSERT ON islamic_wills
    FOR EACH ROW
    EXECUTE FUNCTION generate_will_reference();

-- =============================================
-- UPDATE TIMESTAMP TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_islamic_wills_timestamp
    BEFORE UPDATE ON islamic_wills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (Optional - enable if needed)
-- =============================================
-- ALTER TABLE islamic_wills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE will_children ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE will_beneficiaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE will_assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE will_debts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DONE!
-- =============================================
