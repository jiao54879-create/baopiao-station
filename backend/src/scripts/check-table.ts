import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'ep-long-bread-am5jr566.c-5.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_32kMCOGrszgB',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const result = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'intelligence\' ORDER BY ordinal_position');
  console.log('intelligence 表字段:');
  result.rows.forEach(r => console.log(' -', r.column_name));
  await client.end();
}
main();