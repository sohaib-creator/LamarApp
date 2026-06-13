import mysql from 'mysql2/promise'
import fs from 'fs'

const c = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'lamar_db' })
const [tables] = await c.query('SHOW TABLES')
let sql = '-- Lamar DB Export\nCREATE DATABASE IF NOT EXISTS lamar_db;\nUSE lamar_db;\n\n'

for (const t of tables) {
  const tname = t[Object.keys(t)[0]]
  const [create] = await c.query(`SHOW CREATE TABLE \`${tname}\``)
  sql += create[0]['Create Table'] + ';\n\n'
  const [rows] = await c.query(`SELECT * FROM \`${tname}\``)
  for (const r of rows) {
    const cols = Object.keys(r).map(k => '`' + k + '`').join(',')
    const vals = Object.values(r).map(v => v === null ? 'NULL' : typeof v === 'string' ? "'" + v.replace(/'/g, "\\'") + "'" : v).join(',')
    sql += `INSERT INTO \`${tname}\` (${cols}) VALUES (${vals});\n`
  }
  sql += '\n'
}

fs.writeFileSync('C:\\Users\\sohaib\\Desktop\\lamar App\\lamar_db.sql', sql)
console.log(`Exported ${tables.length} tables`)
await c.end()
