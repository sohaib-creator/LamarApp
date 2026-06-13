import { spawnSync } from 'child_process'
import fs from 'fs'

const root = 'C:\\xampp\\mysql\\bin\\mysql.exe'

function run(cmd) {
  const r = spawnSync(root, ['-u', 'root', 'lamar_db', '--batch', '--silent', '-e', cmd], { encoding: 'utf8', timeout: 5000 })
  return r.stdout?.trim() || ''
}

let sql = '-- Lamar DB Export\nCREATE DATABASE IF NOT EXISTS lamar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE lamar_db;\n\n'

const tables = run('SHOW TABLES').split('\n').filter(Boolean)

for (const t of tables) {
  const createOut = run(`SHOW CREATE TABLE \`${t}\``)
  const createSQL = createOut.split('\n')[0]?.split('\t')?.[1] || createOut
  sql += createSQL + ';\n\n'

  const cols = run(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${t}' AND TABLE_SCHEMA='lamar_db' ORDER BY ORDINAL_POSITION`)
    .split('\n').filter(Boolean).map(c => '`' + c + '`').join(',')

  const rows = run(`SELECT * FROM \`${t}\``).split('\n').filter(Boolean)
  for (const row of rows) {
    const vals = row.split('\t').map(v => v === 'NULL' || v === '' ? 'NULL' : "'" + v.replace(/'/g, "\\'") + "'").join(',')
    sql += `INSERT INTO \`${t}\` (${cols}) VALUES (${vals});\n`
  }
  sql += '\n'
}

const outPath = 'C:\\Users\\sohaib\\Desktop\\lamar App\\lamar_db.sql'
fs.writeFileSync(outPath, sql, 'utf8')
console.log(`Exported ${tables.length} tables to ${outPath}`)
