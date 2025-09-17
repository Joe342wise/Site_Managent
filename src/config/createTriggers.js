const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./database');

const createTriggers = async () => {
  try {
    console.log('🔧 Creating database triggers...');

    const connection = await pool.getConnection();

    try {
      // Drop existing triggers if they exist
      await connection.execute('DROP TRIGGER IF EXISTS calculate_actuals_insert');
      await connection.execute('DROP TRIGGER IF EXISTS calculate_actuals_update');

      // Create INSERT trigger
      const insertTrigger = `
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
        END
      `;

      // Create UPDATE trigger
      const updateTrigger = `
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
        END
      `;

      await connection.execute(insertTrigger);
      await connection.execute(updateTrigger);

      console.log('✅ Database triggers created successfully');
      return true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Trigger creation failed:', error.message);
    throw error;
  }
};

module.exports = { createTriggers };