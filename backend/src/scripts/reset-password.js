const pg = require('pg');
const client = new pg.Client({
  connectionString: 'postgresql://neondb_owner:npg_32kMCOGrszgB@ep-long-bread-am5jr566.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  // 密码 123456 的 bcrypt hash
  const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.HsP.X6i.VP3S8a';
  
  await client.query('UPDATE "users" SET "passwordHash" = $1 WHERE email = $2', [hash, 'test999@test.com']);
  console.log('✅ 已设置 test999@test.com 密码为: 123456');
  
  await client.end();
}

main();
