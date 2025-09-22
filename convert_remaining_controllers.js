const fs = require('fs');
const path = require('path');

// Simple conversion function for remaining controllers
function convertController(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Only convert if it still has pool.execute
  if (content.includes('pool.execute')) {
    console.log(`Converting ${filePath}...`);

    // Replace pool.execute with pool.query
    content = content.replace(/pool\.execute\(/g, 'pool.query(');

    // Replace MySQL array destructuring with PostgreSQL
    content = content.replace(/const \[(\w+)\] = await pool\.query\(/g, 'const $1Result = await pool.query(');

    // Add .rows access where needed
    content = content.replace(/(\w+Result) = await pool\.query\(([\s\S]*?)\);\s*\n\s*if \((\w+)\.length === 0\)/g,
      '$1 = await pool.query($2);\n  const $3 = $1.rows;\n  if ($3.length === 0)');

    content = content.replace(/(\w+Result) = await pool\.query\(([\s\S]*?)\);\s*\n\s*const total = (\w+)\[0\]\.total;/g,
      '$1 = await pool.query($2);\n  const $3 = $1.rows;\n  const total = $3[0].total;');

    content = content.replace(/(\w+Result) = await pool\.query\(([\s\S]*?)\);\s*\n\s*res\.json\(/g,
      '$1 = await pool.query($2);\n  const $1Data = $1.rows;\n  res.json(');

    // Replace MySQL placeholders with PostgreSQL
    let placeholderIndex = 1;
    const lines = content.split('\n');
    const convertedLines = lines.map(line => {
      if (line.includes('pool.query(')) {
        placeholderIndex = 1; // Reset for each query
      }
      return line.replace(/\?/g, () => `$${placeholderIndex++}`);
    });
    content = convertedLines.join('\n');

    // Fix PostgreSQL specific properties
    content = content.replace(/result\.affectedRows/g, 'result.rowCount');
    content = content.replace(/result\.insertId/g, 'result.rows[0].id');

    // Fix common variable reference issues
    content = content.replace(/if \((\w+)\.length === 0\)/g, (match, varName) => {
      if (content.includes(`const ${varName} = ${varName}Result.rows;`)) {
        return match;
      }
      return `const ${varName} = ${varName}Result.rows;\n  if (${varName}.length === 0)`;
    });

    fs.writeFileSync(filePath, content);
    console.log(`✅ Converted ${filePath}`);
    return true;
  }
  return false;
}

// Convert all remaining controllers
const controllersToConvert = [
  'src/controllers/siteController.js',
  'src/controllers/estimateController.js',
  'src/controllers/actualController.js',
  'src/controllers/varianceController.js',
  'src/controllers/userController.js',
  'src/controllers/estimateItemController.js',
  'src/middleware/auth.js'
];

console.log('🔄 Converting remaining controllers to PostgreSQL...\n');

let converted = 0;
controllersToConvert.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (convertController(filePath)) {
      converted++;
    } else {
      console.log(`⚠️  ${filePath} already converted or not found`);
    }
  } else {
    console.log(`⚠️  ${filePath} not found`);
  }
});

console.log(`\n🎉 Converted ${converted} controllers to PostgreSQL!`);
console.log('📝 Manual fixes may be needed for complex queries');

module.exports = { convertController };