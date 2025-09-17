# Database Triggers Setup Guide

If you're experiencing issues with trigger creation during automated setup, follow this manual guide to create the triggers correctly.

## Issue Description

MySQL trigger creation can fail when using automated scripts due to delimiter handling issues. The error typically appears as:
```
Error Code: 1064. You have an error in your SQL syntax
```

## Solution: Manual Trigger Creation

### Step 1: Connect to MySQL
```bash
mysql -u root -p
USE construction_manager;
```

### Step 2: Drop Existing Triggers (if any)
```sql
DROP TRIGGER IF EXISTS calculate_actuals_insert;
DROP TRIGGER IF EXISTS calculate_actuals_update;
```

### Step 3: Create INSERT Trigger
Copy and paste this entire block:

```sql
DELIMITER $$

CREATE TRIGGER calculate_actuals_insert
BEFORE INSERT ON actuals
FOR EACH ROW
BEGIN
    DECLARE est_total DECIMAL(15,2);
    DECLARE est_quantity DECIMAL(10,3);
    DECLARE est_unit_price DECIMAL(12,2);
    DECLARE actual_qty DECIMAL(10,3);

    SELECT quantity, unit_price, total_estimated
    INTO est_quantity, est_unit_price, est_total
    FROM estimate_items
    WHERE item_id = NEW.item_id;

    SET actual_qty = COALESCE(NEW.actual_quantity, est_quantity);
    SET NEW.total_actual = actual_qty * NEW.actual_unit_price;
    SET NEW.variance_amount = NEW.total_actual - est_total;
    SET NEW.variance_percentage = CASE
        WHEN est_total > 0 THEN ((NEW.total_actual - est_total) / est_total) * 100
        ELSE 0
    END;
END$$

DELIMITER ;
```

### Step 4: Create UPDATE Trigger
Copy and paste this entire block:

```sql
DELIMITER $$

CREATE TRIGGER calculate_actuals_update
BEFORE UPDATE ON actuals
FOR EACH ROW
BEGIN
    DECLARE est_total DECIMAL(15,2);
    DECLARE est_quantity DECIMAL(10,3);
    DECLARE est_unit_price DECIMAL(12,2);
    DECLARE actual_qty DECIMAL(10,3);

    SELECT quantity, unit_price, total_estimated
    INTO est_quantity, est_unit_price, est_total
    FROM estimate_items
    WHERE item_id = NEW.item_id;

    SET actual_qty = COALESCE(NEW.actual_quantity, est_quantity);
    SET NEW.total_actual = actual_qty * NEW.actual_unit_price;
    SET NEW.variance_amount = NEW.total_actual - est_total;
    SET NEW.variance_percentage = CASE
        WHEN est_total > 0 THEN ((NEW.total_actual - est_total) / est_total) * 100
        ELSE 0
    END;
END$$

DELIMITER ;
```

### Step 5: Verify Triggers
```sql
SHOW TRIGGERS;
```

You should see both triggers listed:
- `calculate_actuals_insert`
- `calculate_actuals_update`

### Step 6: Test the Setup
```sql
-- Check if actuals table exists and has the right structure
DESCRIBE actuals;

-- Verify estimate_items table exists
DESCRIBE estimate_items;
```

## Alternative: Use SQL File
If the above method doesn't work, you can use the pre-created SQL file:

```bash
mysql -u root -p construction_manager < src/config/fixed_triggers.sql
```

## Common Issues and Solutions

### Issue: "Trigger already exists"
**Solution:** Drop the trigger first:
```sql
DROP TRIGGER IF EXISTS trigger_name;
```

### Issue: "Table doesn't exist"
**Solution:** Make sure the main schema is created first:
```bash
# Run the main application to create tables
pnpm start
# Then create triggers manually
```

### Issue: "Syntax error near delimiter"
**Solution:**
1. Make sure you copy the entire block including `DELIMITER $$` and `DELIMITER ;`
2. Execute each trigger creation as a single block
3. Don't mix delimiter commands with other SQL statements

## Verification

After creating the triggers, you can test them by:

1. **Creating a site and estimate** via the API
2. **Adding estimate items**
3. **Recording actual costs** - the triggers should automatically calculate `total_actual`, `variance_amount`, and `variance_percentage`

The triggers ensure that:
- `total_actual` = (actual_quantity OR estimated_quantity) × actual_unit_price
- `variance_amount` = total_actual - estimated_total
- `variance_percentage` = (variance_amount / estimated_total) × 100

## Need Help?

If you continue to experience issues:
1. Check the MySQL version compatibility
2. Ensure proper permissions for trigger creation
3. Contact support with the exact error message