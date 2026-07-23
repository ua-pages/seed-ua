import { mkdir, readFile, writeFile, access, stat, rm } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createManifest, writeManifest, isInstalled } from '../core/manifest.js';
import { buildPlan } from '../core/plan.js';
import { isClean, hasGitRepo, gitCommit, gitPush } from '../git/integration.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

function resolvePath(p) {
  if (p.startsWith('~')) {
    return join(process.env.HOME, p.slice(1));
  }
  return resolve(p);
}

export async function plant(targetPath, options = {}) {
  const projectPath = resolvePath(targetPath);

  try {
    await stat(projectPath);
  } catch {
    throw new Error(`Directory not found: ${projectPath}`);
  }

  console.log(`\n🌱 Seed\n`);
  console.log(`🔍 Scanning ${projectPath}...\n`);

  if (await isInstalled(projectPath)) {
    throw new Error('Seed is already planted in this project.');
  }

  let name;
  try {
    const pkg = JSON.parse(await readFile(join(projectPath, 'package.json'), 'utf-8'));
    name = pkg.name || basename(projectPath);
  } catch {
    name = basename(projectPath);
  }

  let environment = 'unknown';
  let entryFile = null;
  try {
    await access(join(projectPath, 'index.html'));
    environment = 'vanilla';
    entryFile = 'index.html';
  } catch {
    // no index.html found
  }

  let runtimeDir;
  let runtimeRelPath;
  try {
    await access(join(projectPath, 'src'));
    runtimeDir = 'src/seed';
    runtimeRelPath = './src/seed/index.js';
  } catch {
    runtimeDir = 'seed';
    runtimeRelPath = './seed/index.js';
  }

  const origin = basename(dirname(projectPath));

  const pwa = options.pwa;

  console.log(`📦 Project       ${name}`);
  console.log(`🌐 Environment   ${environment}`);
  if (pwa) console.log(`📱 PWA mode      enabled\n`);
  else console.log();

  if ((options.commit || options.push) && (await hasGitRepo(projectPath))) {
    if (!(await isClean(projectPath))) {
      throw new Error('Working tree is dirty. Commit or stash changes first.');
    }
  }

  const plan = await buildPlan(projectPath, { runtimeDir, entryFile });

  if (plan.conflicts.length > 0) {
    console.error('Conflicts found:');
    plan.conflicts.forEach(f => console.error(`  ${f}`));
    throw new Error('Cannot plant: some files already exist.');
  }

  if (pwa) {
    const pwaConflicts = ['sw.js', 'manifest.json'];
    const found = [];
    for (const f of pwaConflicts) {
      try {
        await access(join(projectPath, f));
        found.push(f);
      } catch {}
    }
    if (found.length > 0) {
      console.error('PWA conflicts found:');
      found.forEach(f => console.error(`  ${f}`));
      throw new Error('Cannot plant: some PWA files already exist.');
    }
  }

  if (pwa) {
    console.log('📱 Enabling PWA mode...');
  }
  console.log('🌱 Planting seed...');
  console.log('🪪  Creating identity...');
  console.log('🧠 Connecting memory...');
  console.log('💓 Starting heartbeat...\n');

  const createdItems = [];
  const allCreatedFiles = [];
  const modifiedFiles = [];
  const originalContent = new Map();

  try {
    for (const dir of plan.createdDirs) {
      await mkdir(join(projectPath, dir), { recursive: true });
    }

    const manifest = createManifest({ name, environment, origin });
    await writeManifest(projectPath, manifest);
    allCreatedFiles.push('.seed/seed.json');
    createdItems.push('.seed/seed.json');

    const templateFiles = ['index.js', 'life.js', 'memory.js'];
    if (pwa) templateFiles.push('pwa.js');
    for (const tf of templateFiles) {
      let content = await readFile(join(TEMPLATES_DIR, tf), 'utf-8');
      if (tf === 'index.js') {
        const identityData = {
          name: manifest.name,
          species: manifest.species,
          environment: manifest.environment,
          plantedAt: manifest.plantedAt,
        };
        const escaped = JSON.stringify(identityData)
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'");
        content = content.replace('__IDENTITY_JSON__', escaped);
        content = content.replace('__PWA_IMPORT__', pwa
          ? "import { createPWA } from './pwa.js';"
          : '');
        content = content.replace('__PWA_INIT__', pwa
          ? 'const pwa = createPWA(IDENTITY);'
          : 'const pwa = null;');
      }
      const targetFile = join(projectPath, runtimeDir, tf);
      await writeFile(targetFile, content);
      const relPath = join(runtimeDir, tf);
      allCreatedFiles.push(relPath);
      createdItems.push(relPath);
    }

    if (pwa) {
      const swContent = await readFile(join(TEMPLATES_DIR, 'sw.js'), 'utf-8');
      await writeFile(join(projectPath, 'sw.js'), swContent);
      allCreatedFiles.push('sw.js');
      createdItems.push('sw.js');

      const webManifest = {
        name,
        short_name: name,
        start_url: '/',
        display: 'standalone',
        background_color: '#090d0b',
        theme_color: '#090d0b',
        icons: [],
      };
      await writeFile(
        join(projectPath, 'manifest.json'),
        JSON.stringify(webManifest, null, 2) + '\n'
      );
      allCreatedFiles.push('manifest.json');
      createdItems.push('manifest.json');
    }

    if (entryFile) {
      const originalHtml = await readFile(join(projectPath, entryFile), 'utf-8');
      let headTags = '';
      if (pwa) {
        headTags += `  <link rel="manifest" href="/manifest.json">\n`;
        headTags += `  <meta name="theme-color" content="#090d0b">\n`;
      }
      const scriptTag = `  <script type="module" src="${runtimeRelPath}"></script>\n`;
      let html = originalHtml;
      if (headTags && html.includes('</head>')) {
        html = html.replace('</head>', `${headTags}</head>`);
      }
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}</body>`);
      } else if (html.includes('</html>')) {
        html = html.replace('</html>', `${scriptTag}</html>`);
      } else {
        html += `\n${scriptTag}`;
      }
      await writeFile(join(projectPath, entryFile), html);
      originalContent.set(entryFile, originalHtml);
      modifiedFiles.push(entryFile);
      createdItems.push(`${entryFile} (modified)`);
    }

    console.log('📄 Created files:');
    createdItems.forEach(f => console.log(`  ✅ ${f}`));

    if (options.commit || options.push) {
      if (await hasGitRepo(projectPath)) {
        await gitCommit(projectPath, [...allCreatedFiles, ...modifiedFiles]);
        console.log('  ✅ git commit created');

        if (options.push) {
          await gitPush(projectPath, options);
          console.log('  ✅ git push completed');
        }
      } else {
        console.log('  ⏭️  not a git repository, skipping git operations');
      }
    }

    console.log(`\n✅ Seed planted successfully.`);
    console.log(`✨ ${name} is alive.`);
  } catch (err) {
    for (const [file, content] of originalContent) {
      try {
        await writeFile(join(projectPath, file), content);
      } catch {
        // ignore rollback errors
      }
    }
    for (const item of [...allCreatedFiles].reverse()) {
      try {
        await rm(join(projectPath, item), { force: true });
      } catch {
        // ignore rollback errors
      }
    }
    for (const dir of [...plan.createdDirs].reverse()) {
      try {
        await rm(join(projectPath, dir), { recursive: true, force: true });
      } catch {
        // ignore rollback errors
      }
    }
    throw err;
  }
}
