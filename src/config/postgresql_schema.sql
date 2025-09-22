-- Construction Site Manager Database Schema for PostgreSQL
-- Converted from MySQL schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'supervisor', 'accountant')),
    is_active BOOLEAN DEFAULT TRUE,
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sites table for construction projects
CREATE TABLE IF NOT EXISTS sites (
    site_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    budget_limit DECIMAL(15,2),
    notes TEXT,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on sites
CREATE INDEX IF NOT EXISTS idx_sites_name ON sites(name);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_sites_created_by ON sites(created_by);

-- Estimates table for project estimates
CREATE TABLE IF NOT EXISTS estimates (
    estimate_id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(site_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date_created DATE NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
    total_estimated DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on estimates
CREATE INDEX IF NOT EXISTS idx_estimates_site_id ON estimates(site_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimates_created_by ON estimates(created_by);

-- Categories table for item categorization
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on categories
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Estimate items table
CREATE TABLE IF NOT EXISTS estimate_items (
    item_id SERIAL PRIMARY KEY,
    estimate_id INTEGER NOT NULL REFERENCES estimates(estimate_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(10,2) NOT NULL,
    total_estimated DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on estimate_items
CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate_id ON estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_items_category_id ON estimate_items(category_id);

-- Actual expenses table
CREATE TABLE IF NOT EXISTS actuals (
    actual_id SERIAL PRIMARY KEY,
    estimate_id INTEGER NOT NULL REFERENCES estimates(estimate_id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES estimate_items(item_id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    unit_price DECIMAL(10,2) NOT NULL,
    total_actual DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    purchase_date DATE NOT NULL,
    vendor VARCHAR(100),
    receipt_number VARCHAR(50),
    notes TEXT,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on actuals
CREATE INDEX IF NOT EXISTS idx_actuals_estimate_id ON actuals(estimate_id);
CREATE INDEX IF NOT EXISTS idx_actuals_item_id ON actuals(item_id);
CREATE INDEX IF NOT EXISTS idx_actuals_purchase_date ON actuals(purchase_date);
CREATE INDEX IF NOT EXISTS idx_actuals_created_by ON actuals(created_by);

-- Verification codes table for email verification
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('password_reset', 'email_change', 'account_verification')),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on verification_codes
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
    ('Materials', 'Construction materials and supplies'),
    ('Labor', 'Labor costs and wages'),
    ('Equipment', 'Equipment rental and purchase'),
    ('Transportation', 'Transportation and logistics'),
    ('Miscellaneous', 'Other expenses')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, email, full_name, role) VALUES
    ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdaGOP.u5wCCnqm', 'admin@deaioncontractors.com', 'System Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimate_items_updated_at BEFORE UPDATE ON estimate_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actuals_updated_at BEFORE UPDATE ON actuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();