const chalk = require("chalk");

const major = parseInt(process.versions.node.split('.')[0], 10);

if (major < 20) {
  console.log(
    chalk.redBright("✖ Node.js version too low.") + "\n" +
    chalk.white(`  Required : `) + chalk.green("Node.js 20+") + "\n" +
    chalk.white(`  Current  : `) + chalk.yellow(process.versions.node) + "\n" +
    chalk.white("  Please upgrade Node.js to continue.\n")
  );
  process.exit(1);
}