const { Pool } = require('pg');
require('dotenv').config();

// Support both DATABASE_URL (for Supabase/Render) and individual env vars
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout
      // Force IPv4 for Render/Supabase compatibility
      options: process.env.NODE_ENV === 'production' ? '-c search_path=public' : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'construction_manager',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(dbConfig);

const testConnection = async () => {
  try {
    console.log('🔌 Testing database connection...');

    // Log connection details for debugging (without password)
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      console.log(`📍 Connecting to: ${url.hostname}:${url.port}/${url.pathname.slice(1)}`);
      console.log(`👤 User: ${url.username}`);
    } else {
      console.log(`📍 Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
      console.log(`👤 User: ${process.env.DB_USER}`);
    }

    const client = await pool.connect();
    console.log('✅ Database connected successfully');

    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`⏰ Database time: ${result.rows[0].current_time}`);

    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      errno: error.errno,
      address: error.address,
      port: error.port,
      syscall: error.syscall
    });
    return false;
  }
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  pool,
  testConnection
};