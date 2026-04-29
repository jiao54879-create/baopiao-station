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
    
    // 检查情报 sourceUrl 是否为空
    const empty = await client.query('SELECT id, title, "sourceUrl" FROM "intelligence" WHERE "sourceUrl" IS NULL OR "sourceUrl" = \'\'');
    console.log('sourceUrl 为空的情报数量: ' + empty.rows.length);
    
    if (empty.rows.length > 0) {
      console.log('\n空 URL 情报示例:');
      empty.rows.slice(0, 5).forEach(r => {
        console.log('  ID=' + r.id + ' 标题=' + r.title.substring(0, 30));
      });
    }
    
    // 统计
    const total = await client.query('SELECT COUNT(*) FROM "intelligence"');
    const hasUrl = await client.query('SELECT COUNT(*) FROM "intelligence" WHERE "sourceUrl" IS NOT NULL AND "sourceUrl" != \'\'');
    console.log('\n情报统计:');
    console.log('  总数: ' + total.rows[0].count);
    console.log('  有 URL: ' + hasUrl.rows[0].count);
    console.log('  无 URL: ' + (parseInt(total.rows[0].count) - parseInt(hasUrl.rows[0].count)));

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

check();
