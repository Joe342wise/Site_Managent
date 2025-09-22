const fs = require('fs');
const path = require('path');

// Function to convert MySQL queries to PostgreSQL
function convertQuery(content) {
  // Replace pool.execute with pool.query
  content = content.replace(/pool\.execute\(/g, 'pool.query(');

  // Replace MySQL placeholders with PostgreSQL placeholders
  let placeholderIndex = 1;
  content = content.replace(/\?/g, () => `$${placeholderIndex++}`);

  // Reset placeholder index for each new query
  const lines = content.split('\n');
  let result = [];

  for (let line of lines) {
    // Reset counter for each new query line
    if (line.includes('pool.query(') || line.includes('await pool.query(')) {
      placeholderIndex = 1;
      // Re-process this line with proper numbering
      line = line.replace(/\$\d+/g, () => `$${placeholderIndex++}`);
    } else if (line.includes('$')) {
      // Continue numbering for multi-line queries
      line = line.replace(/\$\d+/g, () => `$${placeholderIndex++}`);
    }

    result.push(line);
  }

  content = result.join('\n');

  // Handle array destructuring for PostgreSQL results
  content = content.replace(/const \[(\w+)\] = await pool\.query\(/g,
    'const result = await pool.query(');

  content = content.replace(/const result = await pool\.query\(([\s\S]*?)\);\s*\n\s*if \((\w+)\.length === 0\)/g,
    'const result = await pool.query($1);\n  const $2 = result.rows;\n  if ($2.length === 0)');

  return content;
}

// Files to convert
const filesToConvert = [
  'src/controllers/authController.js',
  'src/controllers/siteController.js',
  'src/controllers/estimateController.js',
  'src/controllers/categoryController.js',
  'src/controllers/actualController.js',
  'src/controllers/reportController.js',
  'src/controllers/userController.js',
  'src/middleware/auth.js'
];

console.log('🔄 Converting MySQL queries to PostgreSQL...\n');

filesToConvert.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (fs.existsSync(fullPath)) {
    console.log(`Converting: ${filePath}`);

    let content = fs.readFileSync(fullPath, 'utf8');
    const convertedContent = convertQuery(content);

    // Backup original file
    fs.writeFileSync(`${fullPath}.mysql_backup`, content);
    fs.writeFileSync(fullPath, convertedContent);

    console.log(`✅ Converted: ${filePath}`);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n🎉 Conversion complete! Original files backed up with .mysql_backup extension');
console.log('\nNOTE: You may need to manually adjust some complex queries.');

module.exports = { convertQuery };