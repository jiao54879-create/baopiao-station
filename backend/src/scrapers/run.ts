// 爬虫运行脚本 - 可独立执行
import scheduler from './scheduler.js';

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'all':
      // 执行所有任务
      await scheduler.runAll();
      break;

    case 'status':
      // 查看任务状态
      const status = scheduler.getStatus();
      console.log('\n📊 采集任务状态:\n');
      status.forEach(job => {
        console.log(`  ${job.name}`);
        console.log(`    状态: ${job.enabled ? '✅ 启用' : '⛔ 禁用'}`);
        console.log(`    计划: ${job.schedule}`);
        console.log(`    上次: ${job.lastRun ? job.lastRun.toLocaleString() : '从未执行'}`);
        console.log();
      });
      break;

    case 'start':
      // 启动调度器
      scheduler.start();
      break;

    case 'stop':
      // 停止调度器
      scheduler.stop();
      break;

    case undefined:
    case 'run':
      // 单次运行所有任务
      await scheduler.runAll();
      break;

    default:
      // 运行指定任务
      await scheduler.runOne(command);
  }

  process.exit(0);
}

main().catch(console.error);
