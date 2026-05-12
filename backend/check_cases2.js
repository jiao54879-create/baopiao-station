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
    
    // 先检查列名
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'viral_cases'");
    console.log('viral_cases 表列名:');
    cols.rows.forEach(r => console.log('  ' + r.column_name));

    // 检查数据
    const cases = await client.query('SELECT id, title, author, platform, url, "likesCount", "commentsCount", "sharesCount" FROM "viral_cases" ORDER BY id LIMIT 10');
    console.log('\n爆款案例数据:');
    cases.rows.forEach(r => {
      console.log('ID=' + r.id + ' 标题: ' + r.title.substring(0, 40));
      console.log('  作者: ' + r.author + ' 平台: ' + r.platform);
      console.log('  点赞: ' + r.likesCount + ' 评论: ' + r.commentsCount + ' 分享: ' + r.sharesCount);
      console.log('  URL: ' + (r.url || '').substring(0, 70));
    });

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

check();
