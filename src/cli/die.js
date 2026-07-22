import { access, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createLegacy, renderMemorial } from '../core/legacy.js';
import { isInstalled, readManifest, writeManifest } from '../core/manifest.js';

export async function die(projectPath, { reason, note = '' }) {
  const resolvedPath = resolve(projectPath);

  if (!(await isInstalled(resolvedPath))) {
    throw new Error('Seed is not planted in this project.');
  }
  if (!reason?.trim()) {
    throw new Error('A reason is required. Use --reason "...".');
  }

  const manifest = await readManifest(resolvedPath);
  if (manifest.state === 'dead') {
    throw new Error('This project is already dead.');
  }

  const memorialPath = join(resolvedPath, 'memorial.html');
  try {
    await access(memorialPath);
    throw new Error('memorial.html already exists. Move it before ending this project.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const legacy = createLegacy(manifest, { reason: reason.trim(), note: note.trim() });
  await mkdir(join(resolvedPath, '.seed'), { recursive: true });
  await writeFile(join(resolvedPath, '.seed', 'legacy.json'), `${JSON.stringify(legacy, null, 2)}\n`);
  await writeFile(memorialPath, renderMemorial(legacy));
  await writeManifest(resolvedPath, {
    ...manifest,
    state: 'dead',
    diedAt: legacy.diedAt,
    reason: legacy.reason,
  });

  console.log(`\n🪦 ${manifest.name}\n`);
  console.log('💓 Heartbeat     stopped');
  console.log(`📅 Died          ${legacy.diedAt}`);
  console.log(`📝 Reason        ${legacy.reason}`);
  console.log('\n📄 Created:');
  console.log('  .seed/legacy.json');
  console.log('  memorial.html');
  console.log('\nThe project is gone, but it did not disappear without a trace.');

  return { legacy, memorialPath };
}
