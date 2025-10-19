const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./database');

const ensureCategories = async () => {
  try {
    const client = await pool.connect();

    try {
      // Check if categories exist
      const countResult = await client.query('SELECT COUNT(*) as count FROM categories');
      const categoryCount = parseInt(countResult.rows[0].count);

      if (categoryCount === 0) {
        console.log('📦 Populating categories...');

        // Insert default categories
        await client.query(`
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
          ON CONFLICT (name) DO NOTHING
        `);

        console.log('✅ Categories populated successfully');
      } else {
        console.log(`✅ ${categoryCount} categories already exist`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Failed to ensure categories:', error.message);
    // Don't throw - categories might already exist
  }
};

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

      // Always ensure categories exist
      await ensureCategories();

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
  createDatabase,
  ensureCategories
};