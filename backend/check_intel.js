const pg = require('pg');
const { Client } = pg;

const RAILWAY_DB_URL = 'postgresql://neondb_owner:npg_32kMCOGrszgB@ep-long-bread-am5jr566.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function check() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 检查 intelligence 表结构
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'intelligence'");
    console.log('intelligence 表列名:');
    cols.rows.forEach(r => console.log('  ' + r.column_name));

    // 检查情报数据
    const intel = await client.query('SELECT id, title FROM "intelligence" LIMIT 5');
    console.log('\n情报数据示例:');
    intel.rows.forEach(r => console.log('  ID=' + r.id + ' title=' + r.title.substring(0, 30)));

    // 检查爆款案例表的 URL 列
    const caseCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'viral_cases'");
    console.log('\nviral_cases 表列名:');
    caseCols.rows.forEach(r => console.log('  ' + r.column_name));

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

check();
