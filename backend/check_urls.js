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
    
    // 检查情报 sourceUrl
    const intel = await client.query('SELECT id, title, "sourceUrl" FROM "intelligence" LIMIT 10');
    console.log('情报 sourceUrl:');
    intel.rows.forEach(r => {
      console.log('  ID=' + r.id + ' URL=' + (r.sourceUrl || '空'));
    });

    // 检查爆款案例 url
    const cases = await client.query('SELECT id, title, url FROM "viral_cases" LIMIT 10');
    console.log('\n爆款案例 url:');
    cases.rows.forEach(r => {
      console.log('  ID=' + r.id + ' URL=' + (r.url || '空'));
    });

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

check();
