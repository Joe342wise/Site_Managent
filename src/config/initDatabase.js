const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./database');

const initializeDatabase = async () => {
  try {
    console.log('📋 Initializing database schema...');

    // Check if this is a fresh installation
    const client = await pool.connect();

    try {
      // Check if users table exists
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);

      const usersTableExists = tableCheckResult.rows[0].exists;

      if (usersTableExists) {
        console.log('🔄 Existing database detected, schema already initialized');
      } else {
        console.log('🆕 Fresh installation detected, creating schema...');

        // Run PostgreSQL schema
        const schemaPath = path.join(__dirname, 'postgresql_schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');

        // Execute the entire schema
        await client.query(schema);

        console.log('✅ Database schema initialized successfully');
      }

      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

const createDatabase = async () => {
  try {
    // PostgreSQL databases are usually created externally or via Supabase
    console.log('✅ Using existing PostgreSQL database');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  createDatabase
};