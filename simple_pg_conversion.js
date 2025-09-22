const fs = require('fs');

// Simple, targeted conversion for PostgreSQL
function convertToPostgreSQL(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace MySQL specific calls with PostgreSQL equivalents
  content = content.replace(/pool\.execute\(/g, 'pool.query(');

  // Convert MySQL result destructuring to PostgreSQL
  content = content.replace(/const \[(\w+)\] = await pool\.query\(/g, 'const $1Result = await pool.query(');
  content = content.replace(/const (\w+)Result = await pool\.query\(([\s\S]*?)\);[\s\n]*if \((\w+)\.length === 0\)/g,
    'const $1Result = await pool.query($2);\n  const $3 = $1Result.rows;\n  if ($3.length === 0)');

  // Fix MySQL placeholders to PostgreSQL
  let placeholderIndex = 1;
  const lines = content.split('\n');
  const convertedLines = lines.map(line => {
    if (line.includes('pool.query(')) {
      placeholderIndex = 1; // Reset for each query
    }
    return line.replace(/\?/g, () => `$${placeholderIndex++}`);
  });

  content = convertedLines.join('\n');

  // Fix specific PostgreSQL differences
  content = content.replace(/result\.affectedRows/g, 'result.rowCount');
  content = content.replace(/result\.insertId/g, 'result.rows[0].id');

  // Fix transaction handling for PostgreSQL
  content = content.replace(/const connection = await pool\.getConnection\(\);/g, 'const client = await pool.connect();');
  content = content.replace(/connection\.beginTransaction\(\)/g, 'client.query(\'BEGIN\')');
  content = content.replace(/connection\.execute\(/g, 'client.query(');
  content = content.replace(/connection\.commit\(\)/g, 'client.query(\'COMMIT\')');
  content = content.replace(/connection\.rollback\(\)/g, 'client.query(\'ROLLBACK\')');
  content = content.replace(/connection\.release\(\)/g, 'client.release()');

  return content;
}

// Convert auth controller only for now
const filePath = 'src/controllers/authController.js';
console.log(`Converting ${filePath} to PostgreSQL...`);

const convertedContent = convertToPostgreSQL(filePath);
fs.writeFileSync(filePath, convertedContent);

console.log('✅ Converted authController.js to PostgreSQL');
console.log('📝 Manual fixes may be needed for complex queries');

module.exports = { convertToPostgreSQL };