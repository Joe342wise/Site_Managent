-- Migration script to fix the actuals table generated column issue
-- Run this if you already have a database with the problematic generated column

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS calculate_variance_insert;
DROP TRIGGER IF EXISTS calculate_variance_update;
DROP TRIGGER IF EXISTS calculate_actuals_insert;
DROP TRIGGER IF EXISTS calculate_actuals_update;

-- Check if actuals table exists and has the problematic generated column
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_schema = DATABASE() AND table_name = 'actuals');

-- If table exists, we need to modify it
SET @sql = '';
SET @sql = IF(@table_exists > 0,
    'ALTER TABLE actuals DROP COLUMN IF EXISTS total_actual;
     ALTER TABLE actuals ADD COLUMN total_actual DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER actual_quantity;',
    '');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: Triggers should be created separately using fixed_triggers.sql
-- This migration script handles table structure only

-- Update existing records if any exist
UPDATE actuals a
JOIN estimate_items ei ON a.item_id = ei.item_id
SET
    a.total_actual = COALESCE(a.actual_quantity, ei.quantity) * a.actual_unit_price,
    a.variance_amount = (COALESCE(a.actual_quantity, ei.quantity) * a.actual_unit_price) - ei.total_estimated,
    a.variance_percentage = CASE
        WHEN ei.total_estimated > 0 THEN
            (((COALESCE(a.actual_quantity, ei.quantity) * a.actual_unit_price) - ei.total_estimated) / ei.total_estimated) * 100
        ELSE 0
    END
WHERE a.total_actual = 0 OR a.variance_amount IS NULL;