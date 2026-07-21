import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline';

const exec = promisify(execFile);

export async function isClean(projectPath) {
  try {
    const { stdout } = await exec('git', ['status', '--porcelain'], { cwd: projectPath });
    return stdout.trim().length === 0;
  } catch {
    return false;
  }
}

export async function hasGitRepo(projectPath) {
  try {
    await exec('git', ['rev-parse', '--git-dir'], { cwd: projectPath });
    return true;
  } catch {
    return false;
  }
}

export async function gitCommit(projectPath, files) {
  const addArgs = ['add', '--', ...files];
  await exec('git', addArgs, { cwd: projectPath });

  const commitArgs = ['commit', '-m', 'chore(seed): plant digital seed'];
  await exec('git', commitArgs, { cwd: projectPath });
}

export async function gitPush(projectPath, options) {
  const { stdout: branch } = await exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: projectPath,
  });
  const currentBranch = branch.trim();

  let hasRemote = false;
  try {
    const { stdout: remote } = await exec('git', ['remote'], { cwd: projectPath });
    hasRemote = remote.trim().length > 0;
  } catch {
    hasRemote = false;
  }

  if (!hasRemote) {
    throw new Error('No git remote configured.');
  }

  if (!options.yes) {
    const answer = await ask(
      `Seed will create a commit and push to origin/${currentBranch}.\nContinue? [y/N] `
    );
    if (answer !== 'y' && answer !== 'yes') {
      console.log('Push cancelled.');
      return;
    }
  }

  try {
    await exec('git', ['push'], { cwd: projectPath });
  } catch {
    await exec('git', ['push', '--set-upstream', 'origin', currentBranch], {
      cwd: projectPath,
    });
  }
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}
