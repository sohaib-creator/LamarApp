import { execSync } from 'child_process'
import fs from 'fs'

const mysql = (cmd) => execSync(`"C:\\xampp\\mysql\\bin\\mysql.exe" -u root lamar_db -e "${cmd.replace(/"/g, '\\"')}" --batch --silent 2>&1`, { encoding: 'utf8' })

const tables = mysql('SHOW TABLES').trim().split('\n').filter(Boolean)
let sql = '-- Lamar DB Export\nCREATE DATABASE IF NOT EXISTS lamar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE lamar_db;\n\n'

for (const t of tables) {
  const createSQL = mysql(`SHOW CREATE TABLE \`${t}\``).trim().split('\n').slice(1).join(' ').replace(/.*\t/, '')
  sql += createSQL + ';\n\n'
  const rowsRaw = mysql(`SELECT * FROM \`${t}\``)
  const lines = rowsRaw.trim().split('\n')
  if (lines.length > 0 && lines[0] !== '') {
    const colLine = mysql(`SHOW COLUMNS FROM \`${t}\``)
    const cols = colLine.trim().split('\n').filter(Boolean).map(l => l.split('\t')[0])
    const colNames = cols.map(c => '`' + c + '`').join(',')
    for (const row of lines) {
      const vals = row.split('\t').map(v => v === 'NULL' ? 'NULL' : "'" + v.replace(/'/g, "\\'") + "'").join(',')
      sql += `INSERT INTO \`${t}\` (${colNames}) VALUES (${vals});\n`
    }
  }
  sql += '\n'
}

fs.writeFileSync('C:\\Users\\sohaib\\Desktop\\lamar App\\lamar_db.sql', sql)
console.log(`Exported ${tables.length} tables successfully`)
