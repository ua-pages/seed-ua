import { access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readManifest, isInstalled } from '../core/manifest.js';

const exec = promisify(execFile);

export async function inspect(projectPath) {
  const resolvedPath = resolve(projectPath);

  if (!(await isInstalled(resolvedPath))) {
    console.log('🌱 Seed is not planted in this project.');
    return;
  }

  const manifest = await readManifest(resolvedPath);

  console.log(`\n🌱 Seed Inspection: ${manifest.name}\n`);

  console.log('🪪  Identity:');
  console.log(`  📛 Name          ${manifest.name}`);
  console.log(`  🧬 Species       ${manifest.species}`);
  console.log(`  🌐 Environment   ${manifest.environment}`);
  console.log(`  📍 Origin        ${manifest.origin}`);
  console.log(`  📅 Planted       ${manifest.plantedAt}`);
  console.log(`  🌿 Stage         ${manifest.stage}`);
  console.log();

  let runtimePrefix;
  try {
    await access(join(resolvedPath, 'src/seed/index.js'));
    runtimePrefix = 'src/seed';
  } catch {
    runtimePrefix = 'seed';
  }

  const runtimeFiles = ['index.js', 'life.js', 'memory.js'].map(f => `${runtimePrefix}/${f}`);

  console.log('📁 Files:');
  const seedFiles = ['.seed/seed.json', ...runtimeFiles];

  let integrationOk = true;
  for (const f of seedFiles) {
    try {
      await access(join(resolvedPath, f));
      console.log(`  ✅ ${f}`);
    } catch {
      console.log(`  ❌ ${f} (missing)`);
      integrationOk = false;
    }
  }

  console.log();

  const entryCandidates = ['index.html'];
  let entryFound = null;
  for (const ec of entryCandidates) {
    try {
      await access(join(resolvedPath, ec));
      entryFound = ec;
      break;
    } catch {
      // not found
    }
  }

  if (entryFound) {
    console.log(`📄 Entry point    ${entryFound}`);
    const { stdout } = await exec('grep', ['-l', 'seed/index.js', join(resolvedPath, entryFound)], { cwd: resolvedPath }).catch(() => ({ stdout: '' }));
    if (stdout.trim()) {
      console.log('🔗 Integration    script tag found');
    } else {
      console.log('🔗 Integration    script tag missing');
      integrationOk = false;
    }
  } else {
    console.log('📄 Entry point    not detected');
  }

  console.log();

  try {
    const { stdout } = await exec('git', ['status', '--porcelain'], { cwd: resolvedPath });
    console.log(`🔀 Git status     ${stdout.trim() || 'clean'}`);
    const { stdout: log } = await exec('git', ['log', '--oneline', '-1'], { cwd: resolvedPath }).catch(() => ({ stdout: '' }));
    if (log.trim()) {
      console.log(`🔖 Last commit    ${log.trim()}`);
    }
  } catch {
    console.log('🔀 Git            not a repository');
  }

  console.log();
  console.log(`🔗 Integration    ${integrationOk ? '✅ looks healthy' : '❌ issues detected'}`);
}
