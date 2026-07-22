import { resolve } from 'node:path';
import { readManifest, isInstalled } from '../core/manifest.js';

export async function status(projectPath) {
  const resolvedPath = resolve(projectPath);

  if (!(await isInstalled(resolvedPath))) {
    console.log('🌱 Seed is not planted in this project.');
    return;
  }

  const manifest = await readManifest(resolvedPath);

  const plantedDate = new Date(manifest.plantedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  console.log(`\n🌱 ${manifest.name}\n`);
  console.log(`📊 State        ${manifest.state || 'alive'}`);
  console.log(`🌿 Stage        ${manifest.stage}`);
  console.log(`📅 Planted      ${plantedDate}`);
  if (manifest.diedAt) {
    console.log(`🪦 Died         ${new Date(manifest.diedAt).toLocaleDateString('en-GB')}`);
  }
  console.log(`🌐 Environment  ${manifest.environment}`);
  console.log(`\n💻 Runtime data  available in browser`);
}
