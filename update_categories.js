const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'construction_manager',
  password: process.env.DB_PASSWORD || '0987654321',
  database: process.env.DB_NAME || 'site_management',
});

async function addCategories() {
  try {
    // Add the new categories
    await pool.query(`
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

    // Show all categories
    const result = await pool.query('SELECT * FROM categories ORDER BY sort_order, name');
    console.log('Categories in database:');
    result.rows.forEach(cat => {
      console.log(`${cat.category_id}: ${cat.name} - ${cat.description}`);
    });

    console.log(`\nTotal categories: ${result.rows.length}`);
    console.log('Categories updated successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addCategories();