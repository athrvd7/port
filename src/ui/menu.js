const inquirer = require('inquirer').default;
const chalk = require('chalk').default;
const { showBanner } = require('./banner');
const { scanPorts } = require('../core/ports');
const { inspectProcess } = require('../core/processes');
const { startMonitor } = require('./monitor');
const { showLogs } = require('../core/logger');

const MENU_ITEMS = [
  { num: '1', label: 'Scan Ports', value: 'scan' },
  { num: '2', label: 'Inspect Process', value: 'inspect' },
  { num: '3', label: 'Kill Process', value: 'kill' },
  { num: '4', label: 'Live Monitor', value: 'monitor' },
  { num: '5', label: 'View Logs', value: 'logs' },
  { num: '6', label: 'Exit', value: 'exit' },
];

/**
 * Renders the styled menu
 */
function renderMenu() {
  MENU_ITEMS.forEach((item) => {
    const key = chalk.hex('#ff6a00')(`[${item.num}]`);
    const label = item.num === '6' ? chalk.red(item.label) : chalk.white(item.label);
    console.log(`  ${key}  ${label}`);
  });
  console.log();
}

/**
 * Clears the terminal screen
 */
function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Displays the main menu and handles user selection
 * @returns {Promise<void>}
 */
async function showMenu() {
  let firstRun = true;

  while (true) {
    if (!firstRun) {
      clearScreen();
      await showBanner();
    }
    firstRun = false;

    renderMenu();

    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'action',
        message: chalk.hex('#ff4500')(' >'),
        validate: (val) => {
          if (['1', '2', '3', '4', '5', '6'].includes(val.trim())) return true;
          return chalk.red('Enter 1-6');
        },
      },
    ]);

    const map = { '1': 'scan', '2': 'inspect', '3': 'kill', '4': 'monitor', '5': 'logs', '6': 'exit' };
    answer.action = map[answer.action.trim()];

    clearScreen();
    await showBanner();

    switch (answer.action) {
      case 'scan':
        await scanPorts();
        break;

      case 'inspect':
        await inspectProcess();
        break;

      case 'kill':
        await inspectProcess();
        break;

      case 'monitor':
        await startMonitor();
        break;

      case 'logs':
        await showLogs();
        break;

      case 'exit':
        console.log(chalk.green('  Goodbye!'));
        console.log();
        process.exit(0);

      default:
        console.log(chalk.red('  Unknown option. Try again.'));
    }

    console.log();
  }
}

module.exports = { showMenu };
