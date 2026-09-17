const net = require('net');
const { exec } = require('child_process');
const { promisify } = require('util');
const inquirer = require('inquirer').default;
const chalk = require('chalk').default;
const ora = require('ora').default;
const Table = require('cli-table3');
const { getPlatform, getServiceName } = require('../utils/helpers');
const { log } = require('../core/logger');

const execAsync = promisify(exec);
const BATCH = 100;

async function getPid(port) {
  try {
    if (getPlatform() === 'darwin') {
      const { stdout } = await execAsync(`lsof -i :${port} -t 2>/dev/null`);
      return stdout.trim().split('\n').filter(Boolean)[0] || '-';
    }
    const { stdout } = await execAsync(`ss -tlnp | grep ':${port}' 2>/dev/null`);
    const m = stdout.match(/pid=(\d+)/);
    return m ? m[1] : '-';
  } catch { return '-'; }
}

function scanOne(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => { s.destroy(); resolve({ port, open: true }); });
    s.setTimeout(300);
    s.on('timeout', () => { s.destroy(); resolve({ port, open: false }); });
    s.on('error', () => resolve({ port, open: false }));
  });
}

async function scanBatch(ports) {
  const out = [];
  for (let i = 0; i < ports.length; i += BATCH) {
    out.push(...(await Promise.all(ports.slice(i, i + BATCH).map(scanOne))));
  }
  return out;
}

async function scanPorts() {
  const { range } = await inquirer.prompt([{
    type: 'rawlist', name: 'range', message: chalk.hex('#ff6a00')(' Select scan range'),
    choices: [
      { name: 'Common Ports (1-1024)', value: 'common' },
      { name: 'All Ports (1-65535)', value: 'all' },
      { name: 'Custom Range', value: 'custom' },
    ],
  }]);

  let sp, ep;
  if (range === 'common') { sp = 1; ep = 1024; }
  else if (range === 'all') { sp = 1; ep = 65535; }
  else {
    const { startPort, endPort } = await inquirer.prompt([
      { type: 'input', name: 'startPort', message: chalk.hex('#ff6a00')(' Start port:'), validate: (v) => /^[0-9]+$/.test(v) && +v >= 1 && +v <= 65535 ? true : 'Enter 1-65535' },
      { type: 'input', name: 'endPort', message: chalk.hex('#ff6a00')(' End port:'), validate: (v, a) => /^[0-9]+$/.test(v) && +v >= +a.startPort && +v <= 65535 ? true : 'Must be >= start' },
    ]);
    sp = +startPort; ep = +endPort;
  }

  const spinner = ora(` Scanning ${sp}\u2013${ep}...`).start();
  const results = await scanBatch(Array.from({ length: ep - sp + 1 }, (_, i) => sp + i));
  spinner.stop();

  const open = results.filter((r) => r.open);
  for (const p of open) p.pid = await getPid(p.port);

  const table = new Table({
    head: [chalk.hex('#ff6a00')('PORT'), chalk.hex('#ff6a00')('STATUS'), chalk.hex('#ff6a00')('SERVICE'), chalk.hex('#ff6a00')('PID')],
    style: { head: [], border: ['dim'] },
  });
  for (const r of results) {
    if (r.open) table.push([String(r.port), chalk.green('OPEN'), getServiceName(r.port), r.pid || '-']);
  }

  console.log();
  console.log(table.toString());
  console.log(chalk.dim(`  ${open.length} open port(s) in ${sp}\u2013${ep}\n`));

  const portList = open.map((p) => p.port).join(', ');
  log('SCAN', `Range: ${sp}\u2013${ep} | Open: ${open.length} | Ports: ${portList || 'none'}`);

  if (open.length > 0) {
    const { wantKill } = await inquirer.prompt([{
      type: 'confirm', name: 'wantKill', message: chalk.hex('#ff6a00')(' Kill a process on an open port?'), default: false,
    }]);
    if (wantKill) {
      const { killPort } = await inquirer.prompt([{
        type: 'input', name: 'killPort', message: chalk.hex('#ff6a00')(' Port to kill:'), validate: (v) => /^[0-9]+$/.test(v) ? true : 'Enter a port number',
      }]);
      const t = open.find((p) => p.port === +killPort);
      if (t && t.pid && t.pid !== '-') {
        try {
          process.kill(+t.pid, 'SIGKILL');
          console.log(chalk.green(`  \u2714  Killed port:${killPort} (PID: ${t.pid})`));
          log('KILL', `Killed port:${killPort} PID:${t.pid}`);
        } catch {
          console.log(chalk.red(`  \u2718  Failed. Permission denied or process not found.`));
          log('ERROR', `Failed to kill port:${killPort} PID:${t.pid}`);
        }
      } else {
        console.log(chalk.yellow('  No PID found for that port.'));
      }
    }
  }

  console.log(chalk.dim('  Press Enter to return to main menu...'));
  await inquirer.prompt([{ type: 'input', name: '_', message: '' }]);
}

module.exports = { scanPorts };
