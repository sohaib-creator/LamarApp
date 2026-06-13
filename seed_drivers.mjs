import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'lamar_db',
  charset: 'utf8mb4',
});

async function seed() {
  const [existing] = await pool.execute("SELECT id, name, email, role FROM users WHERE role = 'driver'");
  if (existing.length > 0) {
    console.log(`Drivers already exist (${existing.length}), skipping.`);
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash('123456', 12);
  const drivers = [
    ['خالد الأحمدي', 'khalid@test.com', '0551111111'],
    ['فيصل القرني', 'faisal@test.com', '0552222222'],
    ['ناصر الدوسري', 'nasser@test.com', '0553333333'],
  ];

  for (const [name, email, phone] of drivers) {
    await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, "driver", "active")',
      [name, email, phone, hash]
    );
  }

  console.log(`✅ Added ${drivers.length} drivers`);
  await pool.end();
}

seed().catch(console.error);
