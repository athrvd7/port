#!/usr/bin/env node

'use strict';

const { showBanner } = require('../src/ui/banner');
const { showMenu } = require('../src/ui/menu');
const { scanPorts } = require('../src/core/ports');
const { inspectProcess, killProcess } = require('../src/core/processes');
const { startMonitor } = require('../src/ui/monitor');
const { showLogs } = require('../src/core/logger');
const chalk = require('chalk').default;

const VERSION = 'v1.0.0';

const HELP = `
Portx \u2014 Port & Process Manager

Usage:
  portx                  Launch interactive menu
  portx scan             Open port scanner
  portx kill <pid>       Kill process by PID
  portx monitor          Open live monitor
  portx logs             View activity logs

Flags:
  --help                 Show this help
  --version              Show version
`;

async function safeRun(fn, name) {
  try { await fn(); }
  catch (err) {
    if (err.code === 'EACCES') console.error(chalk.red('  Permission denied. Try running with sudo.'));
    else if (err.code === 'ENOENT') console.error(chalk.yellow('  Process or port not found.'));
    else console.error(chalk.red(`  Error in ${name}: ${err.message}`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd) { await showBanner(); await showMenu(); return; }

  switch (cmd) {
    case '--help':
      console.log(HELP.trim());
      break;
    case '--version':
      console.log(VERSION);
      break;
    case 'scan':
      await showBanner();
      await safeRun(scanPorts, 'scan');
      break;
    case 'kill': {
      const pid = args[1];
      if (!pid || !/^\d+$/.test(pid)) {
        console.log(chalk.yellow('  Usage: portx kill <pid>'));
        break;
      }
      await showBanner();
      await safeRun(async () => killProcess(pid, 'manual', '-'), 'kill');
      break;
    }
    case 'monitor':
      await showBanner();
      await safeRun(startMonitor, 'monitor');
      break;
    case 'logs':
      await showBanner();
      await safeRun(showLogs, 'logs');
      break;
    default:
      console.log(chalk.red(`  Unknown command: ${cmd}`));
      console.log(chalk.yellow('  Run "portx --help" for usage.'));
  }
}

main();
