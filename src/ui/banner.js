const figlet = require('figlet');
const chalk = require('chalk').default;

const VERSION = 'v1.0.0';

/**
 * Renders the Portx ASCII art banner with styling
 * @returns {Promise<void>}
 */
function showBanner() {
  return new Promise((resolve, reject) => {
    figlet.text(
      'Portx',
      {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const lines = data.split('\n');
        const colors = [
          chalk.hex('#ff4500'),
          chalk.hex('#ff6a00'),
          chalk.hex('#ff8c00'),
          chalk.hex('#e63900'),
          chalk.hex('#cc2a00'),
          chalk.hex('#b31f00'),
        ];

        const artLines = lines.map((line, i) => {
          const color = colors[i % colors.length];
          return color(line);
        }).join('\n');

        console.log();
        console.log(artLines);
        console.log(chalk.dim.gray('  Port & Process Manager') + '  ' + chalk.hex('#ff6a00')(VERSION));
        console.log(chalk.dim('  ' + '\u2500'.repeat(50)));
        console.log();

        resolve();
      }
    );
  });
}

module.exports = { showBanner };
