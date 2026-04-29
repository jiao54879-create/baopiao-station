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
    
    // 检查所有爆款案例的 url
    const cases = await client.query('SELECT id, title, url FROM "viral_cases" ORDER BY id');
    console.log('爆款案例 URL 检查:');
    console.log('总数: ' + cases.rows.length);
    
    let withUrl = 0;
    let withExample = 0;
    let withEmpty = 0;
    
    cases.rows.forEach(r => {
      if (!r.url) withEmpty++;
      else if (r.url.includes('example')) withExample++;
      else {
        withUrl++;
        console.log('  ID=' + r.id + ' 有真实URL: ' + r.url.substring(0, 60));
      }
    });
    
    console.log('\n统计:');
    console.log('  有真实URL: ' + withUrl);
    console.log('  示例URL: ' + withExample);
    console.log('  空URL: ' + withEmpty);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

check();
