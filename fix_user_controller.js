const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/controllers/userController.js', 'utf8');

// Fix all the duplicate result variables and PostgreSQL specific issues
const fixes = [
  // Fix duplicate result variables
  ['const result = await pool.query(\n    `UPDATE users SET ${updates.join(\', \')} WHERE user_id = $1`,\n    params\n  );\n\n  if (result.affectedRows === 0) {\n    return res.status(404).json({\n      success: false,\n      message: \'User not found\'\n    });\n  }\n\n  const result = await pool.query(\n    \'SELECT user_id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE user_id = $1\',\n    [id]\n  );\n\n  res.json({\n    success: true,\n    message: \'User updated successfully\',\n    data: updatedUser[0]\n  });',
   'const updateResult = await pool.query(\n    `UPDATE users SET ${updates.join(\', \')} WHERE user_id = $1`,\n    params\n  );\n\n  if (updateResult.rowCount === 0) {\n    return res.status(404).json({\n      success: false,\n      message: \'User not found\'\n    });\n  }\n\n  const userResult = await pool.query(\n    \'SELECT user_id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE user_id = $1\',\n    [id]\n  );\n\n  res.json({\n    success: true,\n    message: \'User updated successfully\',\n    data: userResult.rows[0]\n  });'],

  // Fix other duplicate results
  ['const result = await pool.query(\n    \'UPDATE users SET is_active = FALSE WHERE user_id = $1\',\n    [id]\n  );\n\n  if (result.affectedRows === 0) {\n    return res.status(404).json({\n      success: false,\n      message: \'User not found\'\n    });\n  }\n\n  const result = await pool.query(\n    \'SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = $1\',\n    [id]\n  );',
   'const deleteResult = await pool.query(\n    \'UPDATE users SET is_active = FALSE WHERE user_id = $1\',\n    [id]\n  );\n\n  if (deleteResult.rowCount === 0) {\n    return res.status(404).json({\n      success: false,\n      message: \'User not found\'\n    });\n  }\n\n  const userResult = await pool.query(\n    \'SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = $1\',\n    [id]\n  );'],

  ['data: deletedUser[0]', 'data: userResult.rows[0]'],

  // Fix the last duplicate result
  ['const result = await pool.query(\n    \'UPDATE users SET is_active = TRUE WHERE user_id = $1\',\n    [id]\n  );\n\n  if (result.affectedRows === 0) {\n    return res.status(404).json({\n      success: false,\n      message: \'User not found\'\n    });\n  }\n\n  const result = await pool.query(\n    \'SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = $1\',\n    [id]\n  );',
   'const activateResult = await pool.query(\n    \'UPDATE users SET is_active = TRUE WHERE user_id = $1\',\n    [id]\n  );\n\n  if (activateResult.rowCount === 0) {\n    return res.status(404).json({\n      success: false,\n      message: \'User not found\'\n    });\n  }\n\n  const userResult2 = await pool.query(\n    \'SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = $1\',\n    [id]\n  );'],

  ['data: activatedUser[0]', 'data: userResult2.rows[0]']
];

// Apply all fixes
for (const [search, replace] of fixes) {
  content = content.replace(search, replace);
}

// Write back the fixed content
fs.writeFileSync('src/controllers/userController.js', content);
console.log('✅ Fixed userController.js');