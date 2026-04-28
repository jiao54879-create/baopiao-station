const http = require('http');

const options = {
  hostname: 'authentic-youthfulness-production-fff4.up.railway.app',
  port: 443,
  path: '/api/cases/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token-for-check'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data);
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
});

// 测试请求
req.write(JSON.stringify({
  title: "达尔文12号测评：保费只要6000多",
  content: "达尔文12号是最新上线的重疾险产品",
  metrics: { likes: 100, favorites: 50, comments: 20 }
}));
req.end();
