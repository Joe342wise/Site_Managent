const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'construction_manager',
  password: process.env.DB_PASSWORD || '0987654321',
  database: process.env.DB_NAME || 'site_management',
});

async function cleanupCategories() {
  try {
    // Check if any estimate items are using the old basic categories
    const itemsCheck = await pool.query(`
      SELECT c.name, COUNT(ei.item_id) as item_count
      FROM categories c
      LEFT JOIN estimate_items ei ON c.category_id = ei.category_id
      WHERE c.name IN ('Materials', 'Equipment', 'Transportation', 'Miscellaneous')
      GROUP BY c.category_id, c.name
    `);

    console.log('Old basic categories usage:');
    itemsCheck.rows.forEach(row => {
      console.log(`${row.name}: ${row.item_count} items`);
    });

    // If no items are using them, we can remove the old basic categories
    const totalUsage = itemsCheck.rows.reduce((sum, row) => sum + parseInt(row.item_count), 0);

    if (totalUsage === 0) {
      console.log('\nNo items using old basic categories. Removing them...');

      await pool.query(`
        DELETE FROM categories
        WHERE name IN ('Materials', 'Equipment', 'Transportation', 'Miscellaneous')
      `);

      console.log('Old basic categories removed successfully!');
    } else {
      console.log(`\n${totalUsage} items are still using old categories. Keeping them for now.`);
    }

    // Show final categories list
    const result = await pool.query('SELECT * FROM categories ORDER BY sort_order, name');
    console.log('\nFinal categories in database:');
    result.rows.forEach(cat => {
      console.log(`${cat.category_id}: ${cat.name} - ${cat.description}`);
    });

    console.log(`\nTotal categories: ${result.rows.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupCategories();