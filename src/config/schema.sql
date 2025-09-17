-- Construction Site Manager Database Schema
-- Based on the original SQLite schema with MySQL optimizations

-- Create database (run separately if needed)
-- CREATE DATABASE construction_manager;
-- USE construction_manager;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100),
    role ENUM('admin', 'manager', 'supervisor', 'accountant') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Sites table for construction projects
CREATE TABLE IF NOT EXISTS sites (
    site_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
    budget_limit DECIMAL(15,2),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by)
);

-- Estimates table for project estimates
CREATE TABLE IF NOT EXISTS estimates (
    estimate_id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date_created DATE NOT NULL,
    version INT DEFAULT 1,
    status ENUM('draft', 'submitted', 'approved', 'rejected', 'archived') DEFAULT 'draft',
    total_estimated DECIMAL(15,2) DEFAULT 0.00,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_site_id (site_id),
    INDEX idx_status (status),
    INDEX idx_date_created (date_created)
);

-- Construction categories for estimate items
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories based on the original application
INSERT INTO categories (name, description, sort_order) VALUES
('Material', 'Basic construction materials', 1),
('Labor', 'Worker payments and contractor fees', 2),
('Masonry', 'Brick work, concrete, foundations', 3),
('Steel Works', 'Reinforcement, structural steel', 4),
('Plumbing', 'Pipes, fixtures, installation', 5),
('Carpentry', 'Wood work, formwork, finishing', 6),
('Electrical Works', 'Wiring, fixtures, installations', 7),
('Air Conditioning Works', 'HVAC systems', 8),
('Utilities', 'Water, electricity connections', 9),
('Glass Glazing', 'Windows, glass installations', 10),
('Metal Works', 'Gates, railings, metal fixtures', 11),
('POP/Aesthetics Works', 'Finishing, decorative elements', 12)
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Estimate items table for detailed estimate breakdown
CREATE TABLE IF NOT EXISTS estimate_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    estimate_id INT NOT NULL,
    description TEXT NOT NULL,
    category_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1.000,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_estimated DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (estimate_id) REFERENCES estimates(estimate_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    INDEX idx_estimate_id (estimate_id),
    INDEX idx_category_id (category_id),
    INDEX idx_description (description(255))
);

-- Actuals table for tracking actual costs vs estimates
CREATE TABLE IF NOT EXISTS actuals (
    actual_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    actual_unit_price DECIMAL(12,2) NOT NULL,
    actual_quantity DECIMAL(10,3),
    total_actual DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    variance_amount DECIMAL(15,2),
    variance_percentage DECIMAL(5,2),
    date_recorded DATE NOT NULL,
    notes TEXT,
    recorded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES estimate_items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_item_id (item_id),
    INDEX idx_date_recorded (date_recorded),
    INDEX idx_recorded_by (recorded_by)
);

-- Inventory table for Phase 2 (inventory management)
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    current_stock DECIMAL(10,3) DEFAULT 0.000,
    min_stock_level DECIMAL(10,3) DEFAULT 0.000,
    unit_cost DECIMAL(12,2) DEFAULT 0.00,
    location VARCHAR(100),
    supplier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item_name (item_name),
    INDEX idx_category (category),
    INDEX idx_current_stock (current_stock)
);

-- Inventory transactions for tracking stock movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    transaction_type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    reference_type ENUM('purchase', 'usage', 'adjustment', 'return') NOT NULL,
    reference_id INT,
    site_id INT,
    notes TEXT,
    transaction_date DATE NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_inventory_id (inventory_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_date (transaction_date)
);

-- Note: Triggers should be created manually using the fixed_triggers.sql file
-- The following triggers calculate total_actual and variance automatically:
-- 1. calculate_actuals_insert - Before INSERT on actuals
-- 2. calculate_actuals_update - Before UPDATE on actuals
--
-- To create triggers manually, run:
-- mysql -u root -p construction_manager < src/config/fixed_triggers.sql

-- Create default admin user (password: admin123)
INSERT INTO users (username, password, email, full_name, role) VALUES
('admin', '$2a$10$8K1p/a0dQ3R/4A9H.uw8suOIj3/mEz8.LJC7/y5H5w5H5w5H5w5H5u', 'admin@deaioncontractors.com', 'System Administrator', 'admin')
ON DUPLICATE KEY UPDATE updated_at=CURRENT_TIMESTAMP;