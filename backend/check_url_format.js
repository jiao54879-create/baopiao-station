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
    
    const cases = await client.query('SELECT id, title, url FROM "viral_cases"');
    console.log('URL 格式检查:');
    
    cases.rows.forEach(r => {
      console.log('ID=' + r.id);
      console.log('  标题: ' + r.title);
      console.log('  URL: ' + r.url);
      console.log('  URL长度: ' + r.url.length);
      console.log('  是否包含example: ' + r.url.includes('example'));
      console.log('  是否包含http: ' + r.url.includes('http'));
      console.log('');
    });

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

check();
