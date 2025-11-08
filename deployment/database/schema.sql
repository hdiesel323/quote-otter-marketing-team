-- QuoteOtter Lead Generation System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  
  service_category VARCHAR(100) NOT NULL,
  service_details TEXT,
  project_timeline VARCHAR(50),
  budget VARCHAR(100),
  notes TEXT,
  
  source VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  intent VARCHAR(20) CHECK (intent IN ('hot', 'warm', 'cool')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'distributed')),
  flag_reason TEXT,
  
  phone_validation JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_leads_status (status),
  INDEX idx_leads_service_category (service_category),
  INDEX idx_leads_zip_code (zip_code),
  INDEX idx_leads_score (score),
  INDEX idx_leads_created_at (created_at)
);

-- Providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  business_name VARCHAR(150) NOT NULL,
  
  service_categories TEXT[] NOT NULL,
  service_zip_codes TEXT[] NOT NULL,
  
  max_leads_per_day INTEGER DEFAULT 10 CHECK (max_leads_per_day > 0),
  leads_today INTEGER DEFAULT 0,
  lead_price DECIMAL(10, 2) NOT NULL CHECK (lead_price >= 0),
  quality_threshold INTEGER DEFAULT 50 CHECK (quality_threshold >= 0 AND quality_threshold <= 100),
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended')),
  
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  response_time_avg INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_providers_status (status),
  INDEX idx_providers_service_categories USING GIN (service_categories),
  INDEX idx_providers_service_zip_codes USING GIN (service_zip_codes)
);

-- Lead assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  
  assigned_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'converted', 'expired')),
  
  response_time_seconds INTEGER,
  accepted_at TIMESTAMP,
  converted_at TIMESTAMP,
  time_to_convert_hours DECIMAL(10, 2),
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_lead_assignments_lead_id (lead_id),
  INDEX idx_lead_assignments_provider_id (provider_id),
  INDEX idx_lead_assignments_status (status),
  INDEX idx_lead_assignments_assigned_at (assigned_at)
);

-- Phone validation cache table
CREATE TABLE IF NOT EXISTS phone_validation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  
  is_valid BOOLEAN,
  is_voip BOOLEAN,
  carrier VARCHAR(100),
  line_type VARCHAR(50),
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  
  validation_result JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  INDEX idx_phone_cache_phone (phone),
  INDEX idx_phone_cache_expires_at (expires_at)
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) NOT NULL UNIQUE,
  
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  
  permissions TEXT[] DEFAULT ARRAY['read'],
  rate_limit INTEGER DEFAULT 1000,
  
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  INDEX idx_api_keys_api_key (api_key),
  INDEX idx_api_keys_provider_id (provider_id)
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('lead', 'provider', 'assignment', 'api_key')),
  entity_id UUID NOT NULL,
  
  action VARCHAR(50) NOT NULL,
  actor_type VARCHAR(50),
  actor_id UUID,
  
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_activity_logs_entity (entity_type, entity_id),
  INDEX idx_activity_logs_created_at (created_at)
);

-- Reset daily lead counters (to be run daily via cron)
CREATE OR REPLACE FUNCTION reset_daily_lead_counters()
RETURNS void AS $$
BEGIN
  UPDATE providers SET leads_today = 0;
END;
$$ LANGUAGE plpgsql;

-- Update provider stats trigger
CREATE OR REPLACE FUNCTION update_provider_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'converted' THEN
    UPDATE providers
    SET conversion_rate = (
      SELECT (COUNT(CASE WHEN la.status = 'converted' THEN 1 END)::DECIMAL / 
              NULLIF(COUNT(CASE WHEN la.status IN ('accepted', 'converted') THEN 1 END), 0)) * 100
      FROM lead_assignments la
      WHERE la.provider_id = NEW.provider_id
    )
    WHERE id = NEW.provider_id;
  END IF;
  
  IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL THEN
    NEW.response_time_seconds = EXTRACT(EPOCH FROM (NEW.accepted_at - NEW.assigned_at))::INTEGER;
    
    UPDATE providers
    SET response_time_avg = (
      SELECT AVG(response_time_seconds)::INTEGER
      FROM lead_assignments
      WHERE provider_id = NEW.provider_id AND response_time_seconds IS NOT NULL
    )
    WHERE id = NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_stats_trigger
BEFORE UPDATE ON lead_assignments
FOR EACH ROW
EXECUTE FUNCTION update_provider_stats();

-- Update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_assignments_updated_at BEFORE UPDATE ON lead_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional, for development)
INSERT INTO providers (name, email, phone, business_name, service_categories, service_zip_codes, lead_price, max_leads_per_day)
VALUES 
  ('John Smith', 'john@example-roofing.com', '+15551234567', 'Example Roofing Co', ARRAY['roofing', 'siding'], ARRAY['90210', '90211'], 50.00, 20),
  ('Jane Doe', 'jane@example-hvac.com', '+15559876543', 'Example HVAC Services', ARRAY['hvac'], ARRAY['90210', '90212'], 40.00, 15)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE leads IS 'Stores all incoming lead submissions';
COMMENT ON TABLE providers IS 'Service providers who receive leads';
COMMENT ON TABLE lead_assignments IS 'Tracks which leads are assigned to which providers';
COMMENT ON TABLE phone_validation_cache IS 'Caches PhoneRevealr validation results';
COMMENT ON TABLE api_keys IS 'API keys for authentication';
COMMENT ON TABLE activity_logs IS 'Audit trail of all system activities';
