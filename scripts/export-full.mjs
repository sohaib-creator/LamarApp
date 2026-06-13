import mysql from 'mysql2/promise'
import fs from 'fs'

const c = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'lamar_db', connectTimeout: 5000 })

const [tables] = await c.query('SHOW TABLES')
let sql = fs.readFileSync('C:\\Users\\sohaib\\Desktop\\lamar App\\lamar_db_full.sql', 'utf8')
sql = sql.split('\n').filter(l => !l.startsWith('-- ')).join('\n') + '\n'

for (const t of tables) {
  const tname = t[Object.keys(t)[0]]
  try {
    const [rows] = await c.query(`SELECT * FROM \`${tname}\``)
    if (rows.length === 0) continue
    const cols = Object.keys(rows[0]).map(k => '`' + k + '`').join(',')
    for (const r of rows) {
      const vals = Object.values(r).map(v => {
        if (v === null || v === undefined) return 'NULL'
        if (typeof v === 'string' || typeof v === 'object') {
          const s = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
          return "'" + s + "'"
        }
        return v
      }).join(',')
      sql += `INSERT INTO \`${tname}\` (${cols}) VALUES (${vals});\n`
    }
  } catch (e) { console.error(`Error on ${tname}:`, e.message) }
  sql += '\n'
}

fs.writeFileSync('C:\\Users\\sohaib\\Desktop\\lamar App\\lamar_db_export.sql', sql, 'utf8')
console.log('Done')
await c.end()
