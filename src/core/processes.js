const { exec } = require('child_process');
const { promisify } = require('util');
const inquirer = require('inquirer').default;
const chalk = require('chalk').default;
const ora = require('ora').default;
const psList = require('ps-list');
const { getPlatform } = require('../utils/helpers');
const { log } = require('../core/logger');

const execAsync = promisify(exec);
const runPs = async (cmd) => { try { const { stdout } = await execAsync(cmd); return stdout.trim(); } catch { return ''; } };

// ── Detail Card ──

function detailCard(i) {
  const w = 35;
  const L = (l, v) => '│  ' + chalk.hex('#ff6a00')(l.padEnd(10)) + chalk.white(': ' + String(v).padEnd(w - 15 - 2)) + '│';
  return ['┌' + '─'.repeat(w) + '┐', L('PID', i.pid), L('Name', i.name), L('Port', i.port || '-'), L('CPU', i.cpu + '%'), L('Memory', i.memory), L('Started', i.started), L('User', i.user), '└' + '─'.repeat(w) + '┘'].join('\n');
}

// ── Search Modes ──

async function searchByPid(pid) {
  const out = await runPs(`ps -p ${pid} -o pid=,comm=,pcpu=,pmem=,etime=,user=`);
  if (!out) return null;
  const p = out.trim().split(/\s+/);
  if (p.length < 6) return null;
  return { pid: p[0], name: p[1], port: '-', cpu: p[2], memory: p[3] + '%', started: p[4], user: p[5] };
}

async function searchByName(name) {
  const spinner = ora(' Searching processes...').start();
  const procs = await psList();
  spinner.stop();
  const matches = procs.filter((p) => p.name.toLowerCase().includes(name.toLowerCase())).slice(0, 15);
  if (!matches.length) return null;
  if (matches.length === 1) return matches[0];
  const { chosen } = await inquirer.prompt([{
    type: 'list', name: 'chosen', message: chalk.hex('#ff6a00')(' Select process'),
    choices: matches.map((p) => ({ name: `${p.pid}  ${p.name}`, value: p })),
  }]);
  return chosen;
}

async function searchByPort(port) {
  const platform = getPlatform();
  const cmd = platform === 'darwin' ? `lsof -i :${port} -P 2>/dev/null` : `ss -tlnp | grep ':${port}' 2>/dev/null`;
  const out = await runPs(cmd);
  if (!out) return null;
  const lines = out.split('\n').filter(Boolean).slice(1);
  if (!lines.length) return null;
  const parts = lines[0].split(/\s+/);
  return { pid: parts[1] || '-', name: parts[0] || 'Unknown', port: String(port), cpu: '-', memory: '-', started: '-', user: parts[2] || '-' };
}

// ── Kill ──

async function killProcess(pid, name) {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm', name: 'confirm',
    message: chalk.red(` ⚠  Kill ${name} (PID: ${pid})? Cannot be undone.`), default: false,
  }]);
  if (!confirm) { console.log(chalk.yellow('  Cancelled.')); return; }
  try {
    process.kill(+pid, 'SIGKILL');
    console.log(chalk.green(`  \u2714  Process ${name} (PID: ${pid}) killed.`));
    log('KILL', `Killed '${name}' PID:${pid}`);
  } catch {
    try {
      await execAsync(`kill -9 ${pid}`);
      console.log(chalk.green(`  \u2714  Process ${name} (PID: ${pid}) killed.`));
      log('KILL', `Killed '${name}' PID:${pid}`);
    } catch {
      console.log(chalk.red(`  \u2718  Failed. Permission denied or process not found.`));
      log('ERROR', `Failed to kill '${name}' PID:${pid}`);
    }
  }
}

// ── Main Inspect Flow ──

async function inspectProcess() {
  const { mode } = await inquirer.prompt([{
    type: 'rawlist', name: 'mode', message: chalk.hex('#ff6a00')(' Search by'),
    choices: [{ name: 'PID', value: 'pid' }, { name: 'Name', value: 'name' }, { name: 'Port', value: 'port' }],
  }]);

  let info;
  if (mode === 'pid') {
    const { pid } = await inquirer.prompt([{
      type: 'input', name: 'pid', message: chalk.hex('#ff6a00')(' PID:'),
      validate: (v) => /^[0-9]+$/.test(v) ? true : 'Enter a number',
    }]);
    info = await searchByPid(pid);
  } else if (mode === 'name') {
    const { name } = await inquirer.prompt([{
      type: 'input', name: 'name', message: chalk.hex('#ff6a00')(' Process name:'),
    }]);
    info = await searchByName(name);
  } else {
    const { port } = await inquirer.prompt([{
      type: 'input', name: 'port', message: chalk.hex('#ff6a00')(' Port:'),
      validate: (v) => /^[0-9]+$/.test(v) ? true : 'Enter a number',
    }]);
    info = await searchByPort(port);
  }

  if (!info) {
    console.log(chalk.yellow('  No process found.'));
  } else {
    console.log();
    console.log(detailCard(info));
    console.log();
    const { action } = await inquirer.prompt([{
      type: 'rawlist', name: 'action', message: chalk.hex('#ff6a00')(' Action'),
      choices: [{ name: 'Kill Process', value: 'kill' }, { name: 'Back to Menu', value: 'back' }],
    }]);
    if (action === 'kill') await killProcess(info.pid, info.name);
  }

  console.log(chalk.dim('  Press Enter to return to main menu...'));
  await inquirer.prompt([{ type: 'input', name: '_', message: '' }]);
}

module.exports = { inspectProcess, killProcess };
