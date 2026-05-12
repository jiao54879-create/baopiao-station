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
    
    const cases = await client.query('SELECT id, title, author, platform, source, url, "likesCount", "commentsCount", "sharesCount" FROM "viral_cases" ORDER BY id LIMIT 20');
    console.log('爆款案例数据检查:\n');
    cases.rows.forEach(r => {
      console.log('ID=' + r.id);
      console.log('  标题: ' + r.title.substring(0, 50));
      console.log('  作者: ' + r.author);
      console.log('  来源: ' + r.platform + ' / ' + r.source);
      console.log('  URL: ' + (r.url || '无').substring(0, 60));
      console.log('  点赞: ' + r.likesCount + ' 评论: ' + r.commentsCount + ' 分享: ' + r.sharesCount);
      console.log('');
    });

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

check();
