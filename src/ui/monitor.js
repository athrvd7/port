const blessed = require('blessed');
const chalk = require('chalk').default;
const psList = require('ps-list');
const inquirer = require('inquirer').default;
const { exec } = require('child_process');
const { promisify } = require('util');
const { getPlatform, getServiceName } = require('../utils/helpers');
const { log, readLog } = require('../core/logger');

const execAsync = promisify(exec);
const run = async (cmd) => { try { const { stdout } = await execAsync(cmd); return stdout.trim(); } catch { return ''; } };

async function getActivePorts() {
  const p = getPlatform();
  const out = await run(p === 'darwin' ? 'lsof -i -P -n 2>/dev/null | grep LISTEN' : 'ss -tlnp 2>/dev/null');
  if (!out) return [];
  const ports = [];
  for (const line of out.split('\n').filter(Boolean).slice(1)) {
    const parts = line.split(/\s+/);
    let port, pid, name;
    if (p === 'darwin') {
      const m = (parts[8] || '').match(/:([\d]+)$/);
      port = m ? m[1] : '-'; pid = parts[1] || '-'; name = parts[0] || '-';
    } else {
      const m = (parts[3] || '').match(/:([\d]+)$/);
      port = m ? m[1] : '-';
      const pm = line.match(/pid=(\d+)/), nm = line.match(/users:\(\("([^"]+)"/);
      pid = pm ? pm[1] : '-'; name = nm ? nm[1] : '-';
    }
    if (port && port !== '-') ports.push({ port, pid: pid || '-', name: name || getServiceName(+port) || '-' });
  }
  return ports;
}

async function getTopProcs(n = 10) {
  const procs = await psList();
  return procs.sort((a, b) => b.cpu - a.cpu).slice(0, n);
}

function fmtPorts(ports) {
  if (!ports.length) return '  No active ports';
  return ports.map((p) => chalk.green(`  ● ${String(p.port).padEnd(6)} ${String(p.pid).padEnd(7)} ${p.name}`)).join('\n');
}

function fmtProcs(procs) {
  if (!procs.length) return '  No processes';
  const h = chalk.hex('#ff6a00')(`  ${'PID'.padEnd(8)}${'NAME'.padEnd(20)}${'CPU%'.padEnd(7)}MEM%`);
  return h + '\n' + procs.map((p) => `  ${String(p.pid).padEnd(8)}${p.name.padEnd(20)}${String(p.cpu.toFixed(1)).padEnd(7)}${p.memory.toFixed(1)}`).join('\n');
}

function fmtLogs(lines) {
  if (!lines.length) return '  No activity yet';
  return lines.slice(-20).map((l) => {
    const c = l.includes('[SCAN]') ? chalk.hex('#00d4ff') : l.includes('[KILL]') ? chalk.red : chalk.gray;
    return c('  ' + l);
  }).join('\n');
}

async function startMonitor() {
  const screen = blessed.screen({ smartCSR: true, fullUnicode: true, title: 'Portx Monitor' });

  const portBox = blessed.box({ parent: screen, top: 0, left: 0, width: '50%', height: '50%', border: 'line', style: { border: { fg: '#ff6a00' } }, label: ' Active Ports ' });
  const procBox = blessed.box({ parent: screen, top: 0, left: '50%', width: '50%', height: '50%', border: 'line', style: { border: { fg: '#ff6a00' } }, label: ' Top Processes ' });
  const logBox = blessed.scrollabletext({ parent: screen, top: '50%', left: 0, width: '100%', height: '50%-1', border: 'line', style: { border: { fg: '#ff6a00' } }, label: ' Activity Log ', alwaysScroll: true });
  const statusBar = blessed.box({ parent: screen, bottom: 0, left: 0, width: '100%', height: 1 });

  let lastRefresh = '';
  const refresh = async () => {
    try {
      const [ports, procs, logs] = await Promise.all([getActivePorts(), getTopProcs(), Promise.resolve(readLog())]);
      portBox.setContent(fmtPorts(ports)); procBox.setContent(fmtProcs(procs)); logBox.setContent(fmtLogs(logs));
      lastRefresh = new Date().toLocaleTimeString();
      statusBar.setContent(chalk.hex('#ff6a00')(` Portx Monitor  |  k: kill  r: refresh  q: exit  |  ${lastRefresh}`));
      screen.render();
    } catch { screen.render(); }
  };

  const iv = setInterval(refresh, 2000);
  await refresh();

  screen.key(['q', 'C-c'], () => { clearInterval(iv); screen.destroy(); });
  screen.key(['r'], refresh);

  screen.key(['k'], async () => {
    const { port } = await inquirer.prompt([{ type: 'input', name: 'port', message: chalk.hex('#ff6a00')(' Port:'), validate: (v) => /^[0-9]+$/.test(v) ? true : 'Number required' }]);
    let pid = '-';
    try {
      if (getPlatform() === 'darwin') { const { stdout } = await execAsync(`lsof -i :${port} -t 2>/dev/null`); pid = stdout.trim().split('\n').filter(Boolean)[0] || '-'; }
      else { const { stdout } = await execAsync(`ss -tlnp | grep ':${port}' 2>/dev/null`); const m = stdout.match(/pid=(\d+)/); pid = m ? m[1] : '-'; }
    } catch { /* */ }
    if (pid && pid !== '-') {
      const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: chalk.red(` ⚠  Kill port ${port} (PID: ${pid})?`), default: false }]);
      if (confirm) { try { process.kill(+pid, 'SIGKILL'); log('KILL', `Monitor killed port:${port} PID:${pid}`); } catch { log('ERROR', `Monitor kill failed port:${port}`); } }
    } else { log('INFO', `Monitor: no PID for port ${port}`); }
    await refresh();
  });

  screen.render();
}

module.exports = { startMonitor };
