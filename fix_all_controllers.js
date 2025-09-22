const fs = require('fs');
const path = require('path');

const controllersDir = 'src/controllers';
const files = fs.readdirSync(controllersDir).filter(file => file.endsWith('.js'));

console.log('🔄 Fixing PostgreSQL conversion issues in all controllers...\n');

files.forEach(filename => {
  const filePath = path.join(controllersDir, filename);
  console.log(`Processing: ${filename}`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Track variable names to avoid duplicates
  let resultCount = 0;

  // Replace duplicate result variables with unique names
  content = content.replace(/const result = await pool\.query\(/g, () => {
    const varName = resultCount === 0 ? 'result' : `result${resultCount}`;
    resultCount++;
    return `const ${varName} = await pool.query(`;
  });

  // Reset counter for each file
  resultCount = 0;

  // Fix PostgreSQL specific issues
  content = content.replace(/result\.affectedRows/g, 'result.rowCount');
  content = content.replace(/result\.insertId/g, 'result.rows[0].id');

  // Fix result array access patterns
  content = content.replace(/const \[(\w+)\] = await pool\.query/g, 'const result = await pool.query');
  content = content.replace(/if \((\w+)\.length === 0\)/g, 'const $1 = result.rows;\n  if ($1.length === 0)');

  // Write the fixed content back
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filename}`);
});

console.log('\n🎉 All controllers fixed!');