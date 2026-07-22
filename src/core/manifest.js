import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export function createManifest({ name, environment, origin }) {
  return {
    schema: 'seed/v1',
    name,
    species: 'application',
    environment,
    origin,
    plantedAt: new Date().toISOString(),
    state: 'alive',
    stage: 'seed',
    principles: ['local-first', 'lightweight-first', 'privacy-first'],
  };
}

export async function readManifest(projectPath) {
  const content = await readFile(join(projectPath, '.seed', 'seed.json'), 'utf-8');
  return JSON.parse(content);
}

export async function writeManifest(projectPath, manifest) {
  await writeFile(
    join(projectPath, '.seed', 'seed.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
}

export async function isInstalled(projectPath) {
  try {
    await access(join(projectPath, '.seed', 'seed.json'));
    return true;
  } catch {
    return false;
  }
}
