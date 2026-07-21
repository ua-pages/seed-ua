import { access } from 'node:fs/promises';
import { join } from 'node:path';

export async function buildPlan(projectPath, { runtimeDir, entryFile }) {
  const createdDirs = ['.seed'];
  const createdFiles = [
    '.seed/seed.json',
    join(runtimeDir, 'index.js'),
    join(runtimeDir, 'life.js'),
    join(runtimeDir, 'memory.js'),
  ];
  const modifiedFiles = [];

  if (entryFile) {
    modifiedFiles.push(entryFile);
  }

  if (runtimeDir.startsWith('src/')) {
    createdDirs.push('src');
    createdDirs.push(runtimeDir);
  } else {
    createdDirs.push(runtimeDir);
  }

  const conflicts = [];
  for (const file of createdFiles) {
    try {
      await access(join(projectPath, file));
      conflicts.push(file);
    } catch {
      // file does not exist, no conflict
    }
  }

  return { createdDirs, createdFiles, modifiedFiles, conflicts };
}
