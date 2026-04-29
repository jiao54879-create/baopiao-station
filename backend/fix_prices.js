const pg = require('pg');
const { Client } = pg;

const RAILWAY_DB_URL = 'postgresql://neondb_owner:npg_32kMCOGrszgB@ep-long-bread-am5jr566.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function fix() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('已连接 Railway 数据库');

    // 更新每个产品的价格
    const updates = [
      { name: '达尔文12号', adult: 4026, child: 0 },
      { name: '超级玛丽16号', adult: 5220, child: 0 },
      { name: '青云卫6号', adult: 0, child: 3510 },
      { name: '大黄蜂16号旗舰版', adult: 0, child: 3025 },
      { name: '大黄蜂17号全能版', adult: 0, child: 3145 },
      { name: '蓝医保长期医疗险', adult: 247, child: 368 },
      { name: '好医保长期医疗20年版', adult: 262, child: 385 },
      { name: '大麦定寿4.0', adult: 325, child: 0 },
      { name: '小蜜蜂6号', adult: 156, child: 116 }
    ];

    for (const p of updates) {
      const sql = 'UPDATE "insurance_products" SET "priceAdult30" = $1, "priceChild0" = $2 WHERE name = $3';
      await client.query(sql, [p.adult, p.child, p.name]);
      console.log('已更新: ' + p.name + ' 成人=' + p.adult + ' 儿童=' + p.child);
    }

    // 验证
    const verify = await client.query('SELECT name, "priceAdult30", "priceChild0" FROM "insurance_products" ORDER BY "priceAdult30" DESC NULLS LAST');
    console.log('\n价格验证:');
    verify.rows.forEach(row => {
      const adult = row.priceAdult30 || '-';
      const child = row.priceChild0 || '-';
      console.log(row.name + ': 成人=¥' + adult + ' 儿童=¥' + child);
    });

    // 检查情报 sourceUrl
    const intel = await client.query('SELECT id, title, sourceUrl FROM intelligence LIMIT 10');
    console.log('\n情报 sourceUrl 检查:');
    intel.rows.forEach(row => {
      console.log('ID=' + row.id + ' URL=' + (row.sourceUrl || '空'));
    });

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await client.end();
  }
}

fix();
