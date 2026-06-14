import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

const OUT = 'C:\\Users\\sohaib\\Desktop\\lamar App\\lamar_db_clean.sql'
const DB = 'if0_42015380_lamarwaterapp'

function fmtDate(v) {
  if (!v) return 'NULL'
  const d = new Date(v)
  if (isNaN(d.getTime())) return "'" + String(v).replace(/'/g, "\\'") + "'"
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `'${Y}-${M}-${D} ${h}:${m}:${s}'`
}

function fmtVal(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'number') return v.toString()
  const s = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return "'" + s + "'"
}

const c = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'lamar_db', charset: 'utf8mb4' })

let sql = `-- Lamar DB Export for InfinityFree
CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${DB}\`;

`

const [tables] = await c.query('SHOW TABLES')
for (const t of tables) {
  const tname = t[Object.keys(t)[0]]
  // Get CREATE TABLE
  const [ddlRows] = await c.query(`SHOW CREATE TABLE \`${tname}\``)
  let ddl = ddlRows[0]['Create Table']
  // Replace lamar_db with target db in FK references
  ddl = ddl.replace(/`lamar_db`\./g, '')
  sql += ddl + ';\n\n'

  // Get data
  const [rows] = await c.query(`SELECT * FROM \`${tname}\``)
  if (rows.length === 0) continue

  const cols = Object.keys(rows[0]).map(k => '`' + k + '`').join(',')
  for (const r of rows) {
    const vals = Object.values(r).map(v => {
      if (v instanceof Date || (v && typeof v === 'object' && typeof v.getMonth === 'function')) {
        return fmtDate(v)
      }
      return fmtVal(v)
    }).join(',')
    sql += `INSERT INTO \`${tname}\` (${cols}) VALUES (${vals});\n`
  }
  sql += '\n'
}

fs.writeFileSync(OUT, sql, 'utf8')
console.log('Written to', OUT)
await c.end()
