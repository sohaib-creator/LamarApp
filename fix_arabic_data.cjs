const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host:'127.0.0.1', user:'root', password:'', database:'lamar_db',
    charset: 'utf8mb4',
  });

  // Fix categories
  const catFixes = [
    { id: 1, name_ar: 'مياه معدنية', name_en: 'Mineral Water' },
    { id: 2, name_ar: 'مياه قليلة الصوديوم', name_en: 'Low Sodium Water' },
  ];
  for (const c of catFixes) {
    await conn.execute('UPDATE categories SET name_ar = ?, name_en = ? WHERE id = ?', [c.name_ar, c.name_en, c.id]);
    console.log(`Category ${c.id}: ${c.name_ar}`);
  }

  // Fix products
  const prodFixes = [
    { id: 1, name_ar: 'مياه شرب 1.5 لتر', name_en: 'Drinking Water 1.5L' },
    { id: 2, name_ar: 'مياه 330 مل', name_en: 'Water 330ml' },
    { id: 3, name_ar: 'مياه 6 لتر', name_en: 'Water 6L' },
  ];
  for (const p of prodFixes) {
    await conn.execute('UPDATE products SET name_ar = ?, name_en = ? WHERE id = ?', [p.name_ar, p.name_en, p.id]);
    console.log(`Product ${p.id}: ${p.name_ar}`);
  }

  // Verify
  const [cats] = await conn.execute('SELECT id, name_ar FROM categories');
  console.log('\nCategories after fix:', cats.map(c => `${c.id}: ${c.name_ar}`));
  const [prods] = await conn.execute('SELECT id, name_ar FROM products');
  console.log('Products after fix:', prods.map(p => `${p.id}: ${p.name_ar}`));

  await conn.end();
})();
