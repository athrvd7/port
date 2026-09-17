const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer').default;
const chalk = require('chalk').default;
const { timestamp } = require('../utils/helpers');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'portx.log');
const PAGE_SIZE = 20;

function ensureLog() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');
}

function log(action, message) {
  try {
    ensureLog();
    fs.appendFileSync(LOG_FILE, `[${timestamp()}] [${action}] ${message}\n`);
  } catch { /* never crash */ }
}

function readLog() {
  ensureLog();
  return fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter((l) => l.trim());
}

function colorLine(line) {
  if (line.includes('[SCAN]')) return chalk.hex('#00d4ff')(line);
  if (line.includes('[KILL]')) return chalk.red(line);
  if (line.includes('[ERROR]')) return chalk.red(line);
  if (line.includes('[INFO]')) return chalk.gray(line);
  return chalk.white(line);
}

async function showLogs() {
  const lines = readLog();
  if (!lines.length) {
    console.log(chalk.yellow('  No logs found.'));
    return;
  }

  let page = 0;
  const totalPages = Math.ceil(lines.length / PAGE_SIZE);

  while (true) {
    const start = page * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, lines.length);
    const chunk = lines.slice(start, end);

    console.log();
    console.log(chalk.dim('  ' + '\u2500'.repeat(60)));
    console.log(chalk.hex('#ff6a00')(`  Logs (page ${page + 1}/${totalPages}, ${lines.length} entries)`));
    console.log(chalk.dim('  ' + '\u2500'.repeat(60)));
    chunk.forEach((l) => console.log(colorLine(l)));
    console.log(chalk.dim('  ' + '\u2500'.repeat(60)));
    console.log();

    const { action } = await inquirer.prompt([{
      type: 'rawlist', name: 'action', message: chalk.hex('#ff6a00')(' Action'),
      choices: [
        ...(page > 0 ? [{ name: 'Previous Page', value: 'prev' }] : []),
        ...(page < totalPages - 1 ? [{ name: 'Next Page', value: 'next' }] : []),
        { name: 'Clear Logs', value: 'clear' },
        { name: 'Export to .txt', value: 'export' },
        { name: 'Back to Menu', value: 'back' },
      ],
    }]);

    if (action === 'prev') { page--; continue; }
    if (action === 'next') { page++; continue; }
    if (action === 'back') return;

    if (action === 'clear') {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm', name: 'confirm', message: chalk.red(' Clear all logs?'), default: false,
      }]);
      if (confirm) {
        fs.writeFileSync(LOG_FILE, '');
        console.log(chalk.green('  Logs cleared.'));
        return;
      }
      continue;
    }

    if (action === 'export') {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = path.join(LOG_DIR, `portx-export-${ts}.txt`);
      fs.writeFileSync(exportFile, lines.join('\n'));
      console.log(chalk.green(`  Exported to ${exportFile}`));
      continue;
    }
  }
}

module.exports = { log, readLog, showLogs, LOG_FILE };
