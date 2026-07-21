#!/usr/bin/env node
import { argv, cwd, exit } from 'node:process';
import { plant } from '../src/cli/plant.js';
import { status } from '../src/cli/status.js';
import { inspect } from '../src/cli/inspect.js';

const args = argv.slice(2);

function showHelp() {
  console.log(`Usage:
  seed <project-path>              Plant seed into project
  seed status <project-path>       Show seed status
  seed inspect <project-path>      Inspect seed installation
  seed <project-path> --commit     Plant and commit with git
  seed <project-path> --push       Plant, commit and push
  seed --help                      Show this help`);
}

async function main() {
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === 'status') {
    await status(args[1] || cwd());
    return;
  }

  if (command === 'inspect') {
    await inspect(args[1] || cwd());
    return;
  }

  await plant(command, {
    commit: args.includes('--commit') || args.includes('--push'),
    push: args.includes('--push'),
    yes: args.includes('--yes'),
  });
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  exit(1);
});
