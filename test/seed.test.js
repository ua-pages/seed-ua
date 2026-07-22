import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createManifest, writeManifest, readManifest, isInstalled } from '../src/core/manifest.js';
import { buildPlan } from '../src/core/plan.js';
import { isClean } from '../src/git/integration.js';
import { createLegacy, renderMemorial } from '../src/core/legacy.js';

function tmpDir() {
  return mkdtempSync(join(tmpdir(), 'seed-test-'));
}

describe('manifest', () => {
  it('creates valid manifest', () => {
    const manifest = createManifest({
      name: 'test-project',
      environment: 'vanilla',
      origin: 'tests',
    });
    assert.equal(manifest.schema, 'seed/v1');
    assert.equal(manifest.name, 'test-project');
    assert.equal(manifest.species, 'application');
    assert.equal(manifest.environment, 'vanilla');
    assert.equal(manifest.origin, 'tests');
    assert.equal(manifest.stage, 'seed');
    assert.equal(manifest.state, 'alive');
    assert.ok(manifest.plantedAt);
    assert.deepEqual(manifest.principles, [
      'local-first',
      'lightweight-first',
      'privacy-first',
    ]);
  });

  it('writes and reads manifest', async () => {
    const dir = tmpDir();
    mkdirSync(join(dir, '.seed'));
    const manifest = createManifest({
      name: 'test',
      environment: 'vanilla',
      origin: 'tests',
    });
    await writeManifest(dir, manifest);
    const read = await readManifest(dir);
    assert.equal(read.name, 'test');
    assert.equal(read.schema, 'seed/v1');
    rmSync(dir, { recursive: true });
  });

  it('detects installation', async () => {
    const dir = tmpDir();
    assert.equal(await isInstalled(dir), false);
    mkdirSync(join(dir, '.seed'));
    writeFileSync(join(dir, '.seed', 'seed.json'), '{}');
    assert.equal(await isInstalled(dir), true);
    rmSync(dir, { recursive: true });
  });
});

describe('legacy', () => {
  it('creates a final immutable record', () => {
    const legacy = createLegacy({
      name: 'seed-demo',
      species: 'application',
      plantedAt: '2026-01-01T00:00:00.000Z',
    }, {
      reason: 'Project completed',
      note: 'Its work is done',
      diedAt: '2026-02-01T00:00:00.000Z',
    });
    assert.equal(legacy.schema, 'seed/legacy/v1');
    assert.equal(legacy.reason, 'Project completed');
    assert.equal(legacy.note, 'Its work is done');
  });

  it('escapes memorial content', () => {
    const html = renderMemorial({
      name: '<Seed>',
      bornAt: '2026-01-01T00:00:00.000Z',
      diedAt: '2026-01-02T00:00:00.000Z',
      reason: '<script>alert(1)</script>',
      note: '',
    });
    assert.ok(html.includes('&lt;Seed&gt;'));
    assert.ok(!html.includes('<script>alert(1)</script>'));
  });
});

describe('plan', () => {
  it('builds operation plan for project with src dir', async () => {
    const dir = tmpDir();
    mkdirSync(join(dir, 'src'));
    const plan = await buildPlan(dir, {
      runtimeDir: 'src/seed',
      entryFile: 'index.html',
    });
    assert.ok(plan.createdDirs.includes('.seed'));
    assert.ok(plan.createdDirs.includes('src/seed'));
    assert.ok(plan.createdFiles.includes('src/seed/index.js'));
    assert.ok(plan.createdFiles.includes('.seed/seed.json'));
    assert.ok(plan.modifiedFiles.includes('index.html'));
    assert.equal(plan.conflicts.length, 0);
    rmSync(dir, { recursive: true });
  });

  it('detects conflicts with existing files', async () => {
    const dir = tmpDir();
    mkdirSync(join(dir, '.seed'), { recursive: true });
    writeFileSync(join(dir, '.seed', 'seed.json'), '{}');
    const plan = await buildPlan(dir, {
      runtimeDir: 'seed',
      entryFile: null,
    });
    assert.ok(plan.conflicts.includes('.seed/seed.json'));
    rmSync(dir, { recursive: true });
  });
});

describe('git integration', () => {
  it('detects dirty working tree', async () => {
    const dir = tmpDir();
    execFileSync('git', ['init'], { cwd: dir });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: dir });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
    writeFileSync(join(dir, 'test.txt'), 'initial');
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync('git', ['commit', '-m', 'init'], { cwd: dir });
    assert.equal(await isClean(dir), true);
    writeFileSync(join(dir, 'test.txt'), 'modified');
    assert.equal(await isClean(dir), false);
    rmSync(dir, { recursive: true });
  });
});

describe('runtime logic', () => {
  it('limits memory to 100 entries', () => {
    const MAX = 100;
    const memories = [];
    function remember(entry) {
      memories.push(entry);
      if (memories.length > MAX) {
        memories.splice(0, memories.length - MAX);
      }
    }
    for (let i = 0; i < 110; i++) {
      remember({ id: i });
    }
    assert.equal(memories.length, 100);
    assert.equal(memories[0].id, 10);
    assert.equal(memories[99].id, 109);
  });

  it('prevents duplicate component registration', () => {
    const list = [];
    function born(name) {
      if (list.some(c => c.name === name)) return null;
      const entry = { name };
      list.push(entry);
      return entry;
    }
    const r1 = born('editor');
    assert.ok(r1);
    assert.equal(list.length, 1);
    const r2 = born('editor');
    assert.equal(r2, null);
    assert.equal(list.length, 1);
    const r3 = born('renderer');
    assert.ok(r3);
    assert.equal(list.length, 2);
  });
});
