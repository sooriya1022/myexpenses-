const fs = require('fs');
require('dotenv').config();

const u = new URL(process.env.DATABASE_URL);
let pass = decodeURIComponent(u.password);
if (pass.startsWith('[') && pass.endsWith(']')) {
  pass = pass.slice(1, -1);
}

const cleanEncodedPass = encodeURIComponent(pass);
const newUrl = `postgresql://${u.username}:${cleanEncodedPass}@${u.hostname}:${u.port || '5432'}${u.pathname}?sslmode=require`;

let content = fs.readFileSync('.env', 'utf8');
content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${newUrl}"`);
fs.writeFileSync('.env', content, 'utf8');
console.log('ENV_UPDATED_SUCCESS');
