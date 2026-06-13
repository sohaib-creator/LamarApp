const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({host:'127.0.0.1',user:'root',password:'',database:'lamar_db'});

  // DB charset
  const [db] = await conn.execute("SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'lamar_db'");
  console.log('DB:', JSON.stringify(db[0]));

  // Table collations
  const [tables] = await conn.execute("SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'lamar_db'");
  tables.forEach(t => console.log('Table:', t.TABLE_NAME, '->', t.TABLE_COLLATION));

  // Column charsets for name columns
  const [cols] = await conn.execute("SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'lamar_db' AND (COLUMN_NAME LIKE '%name%' OR COLUMN_NAME = 'description')");
  cols.forEach(c => console.log(`Col: ${c.TABLE_NAME}.${c.COLUMN_NAME} charset=${c.CHARACTER_SET_NAME} collation=${c.COLLATION_NAME}`));

  // Categories data
  const [cats] = await conn.execute('SELECT id, name_ar, name_en FROM categories LIMIT 10');
  console.log('\nCategories:', JSON.stringify(cats));

  // Products data
  const [prods] = await conn.execute('SELECT id, name_ar, name_en FROM products LIMIT 10');
  console.log('Products:', JSON.stringify(prods));

  await conn.end();
})();
