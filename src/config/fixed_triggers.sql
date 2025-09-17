-- Fixed triggers for MySQL - Execute these statements one by one

-- First, drop existing triggers if they exist
DROP TRIGGER IF EXISTS calculate_actuals_insert;
DROP TRIGGER IF EXISTS calculate_actuals_update;

-- Create the insert trigger
DELIMITER $$

CREATE TRIGGER calculate_actuals_insert
BEFORE INSERT ON actuals
FOR EACH ROW
BEGIN
    DECLARE est_total DECIMAL(15,2);
    DECLARE est_quantity DECIMAL(10,3);
    DECLARE est_unit_price DECIMAL(12,2);
    DECLARE actual_qty DECIMAL(10,3);

    -- Get the estimated values from estimate_items
    SELECT quantity, unit_price, total_estimated
    INTO est_quantity, est_unit_price, est_total
    FROM estimate_items
    WHERE item_id = NEW.item_id;

    -- Calculate actual quantity (use provided or default to estimated)
    SET actual_qty = COALESCE(NEW.actual_quantity, est_quantity);

    -- Calculate total_actual
    SET NEW.total_actual = actual_qty * NEW.actual_unit_price;

    -- Calculate variance_amount
    SET NEW.variance_amount = NEW.total_actual - est_total;

    -- Calculate variance_percentage
    SET NEW.variance_percentage = CASE
        WHEN est_total > 0 THEN ((NEW.total_actual - est_total) / est_total) * 100
        ELSE 0
    END;
END$$

DELIMITER ;

-- Create the update trigger
DELIMITER $$

CREATE TRIGGER calculate_actuals_update
BEFORE UPDATE ON actuals
FOR EACH ROW
BEGIN
    DECLARE est_total DECIMAL(15,2);
    DECLARE est_quantity DECIMAL(10,3);
    DECLARE est_unit_price DECIMAL(12,2);
    DECLARE actual_qty DECIMAL(10,3);

    -- Get the estimated values from estimate_items
    SELECT quantity, unit_price, total_estimated
    INTO est_quantity, est_unit_price, est_total
    FROM estimate_items
    WHERE item_id = NEW.item_id;

    -- Calculate actual quantity (use provided or default to estimated)
    SET actual_qty = COALESCE(NEW.actual_quantity, est_quantity);

    -- Calculate total_actual
    SET NEW.total_actual = actual_qty * NEW.actual_unit_price;

    -- Calculate variance_amount
    SET NEW.variance_amount = NEW.total_actual - est_total;

    -- Calculate variance_percentage
    SET NEW.variance_percentage = CASE
        WHEN est_total > 0 THEN ((NEW.total_actual - est_total) / est_total) * 100
        ELSE 0
    END;
END$$

DELIMITER ;