// 测试 DeepSeek API
import 'dotenv/config';
import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log('❌ DEEPSEEK_API_KEY 未配置');
    console.log('当前环境变量:', Object.keys(process.env).filter(k => k.includes('DEEP') || k.includes('API')));
    return;
  }
  
  console.log('✅ DEEPSEEK_API_KEY 已配置，长度:', process.env.DEEPSEEK_API_KEY.length);
  
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: '你好' }],
      max_tokens: 10,
    });
    console.log('✅ DeepSeek API 调用成功:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ DeepSeek API 调用失败:', error.message);
  }
}

main();