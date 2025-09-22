const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runProfileImageMigration() {
  try {
    const migrationPath = path.join(__dirname, '../migrations/add_profile_image_column.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL statements by semicolon and execute them one by one
    const statements = sql.split(';').filter(statement => statement.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
        console.log('✅ Executed SQL statement successfully');
      }
    }

    console.log('🎉 Profile image column migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runProfileImageMigration();