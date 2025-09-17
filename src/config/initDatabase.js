const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./database');
const { createTriggers } = require('./createTriggers');

const initializeDatabase = async () => {
  try {
    console.log('📋 Initializing database schema...');

    // Check if this is a fresh installation or migration needed
    const connection = await pool.getConnection();

    try {
      // Check if actuals table exists and might need migration
      const [tableCheck] = await connection.execute(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'actuals'"
      );

      const actualsTableExists = tableCheck[0].count > 0;

      if (actualsTableExists) {
        console.log('🔄 Existing database detected, running migration...');

        // Run migration script
        const migrationPath = path.join(__dirname, 'migration_fix_actuals.sql');
        const migration = await fs.readFile(migrationPath, 'utf8');

        const migrationStatements = migration
          .split('DELIMITER //')
          .map(part => part.split('DELIMITER ;'))
          .flat()
          .map(stmt => stmt.trim())
          .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.match(/^(DELIMITER|USE|SET)/));

        for (const statement of migrationStatements) {
          if (statement.trim()) {
            try {
              await connection.execute(statement);
            } catch (error) {
              console.warn('⚠️  Migration statement warning:', error.message);
            }
          }
        }

        console.log('✅ Database migration completed');
      } else {
        console.log('🆕 Fresh installation detected, creating schema...');

        // Run full schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');

        const statements = schema
          .split('DELIMITER //')
          .map(part => part.split('DELIMITER ;'))
          .flat()
          .map(stmt => stmt.trim())
          .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.match(/^(DELIMITER|USE)/));

        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement);
          }
        }

        console.log('✅ Database schema initialized successfully');
      }

      // Create triggers separately to avoid delimiter issues
      await createTriggers();

      return true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

const createDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    try {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'construction_manager'}`);
      await connection.execute(`USE ${process.env.DB_NAME || 'construction_manager'}`);
      console.log('✅ Database created/selected successfully');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  createDatabase
};