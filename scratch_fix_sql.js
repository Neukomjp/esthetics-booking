const fs = require('fs');
let sql = fs.readFileSync('supabase_rls_complete_fix.sql', 'utf8');

// Prepend DROP POLICY IF EXISTS before every CREATE POLICY
sql = sql.replace(/CREATE POLICY "([^"]+)" ON ([a-zA-Z0-9_]+) FOR/g, 'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1" ON $2 FOR');

fs.writeFileSync('supabase_rls_complete_fix.sql', sql);
console.log('Fixed SQL file idempotency');
