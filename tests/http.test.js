import { describe, it, after, before } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request } from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
/** Porta dedicada — evita colisão com landing (9877) ou centro (9879). */
const PORT = 9878;
const BASE = `http://127.0.0.1:${PORT}`;

let server = null;

function fetchPath(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject).end();
  });
}

function waitForServer(maxMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    async function check() {
      if (Date.now() - start > maxMs) return reject(new Error('Timeout'));
      try {
        const res = await fetchPath('/arquivo-morto/index.html');
        if (res.status === 200) return resolve();
      } catch {
        /* server ainda subindo */
      }
      setTimeout(check, 200);
    }
    check();
  });
}

describe('dossie_arquivo_morto — HTTP', () => {
  before(async () => {
    server = spawn('python3', [join(ROOT, 'server.py'), String(PORT)], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await waitForServer();
  });

  after(() => {
    if (server) {
      server.kill();
      server = null;
    }
  });

  it('deve responder 200 em / com redirect para arquivo-morto/', async () => {
    const res = await fetchPath('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('arquivo-morto/'), 'raiz deve redirecionar para arquivo-morto/');
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
  });

  it('deve responder 200 em /arquivo-morto/', async () => {
    const res = await fetchPath('/arquivo-morto/index.html');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('data-clue-id'), 'HTML deve conter pistas clicáveis');
    assert.ok(res.body.includes('data-surface-link'), 'HTML deve ter links configuráveis');
  });

  it('deve responder 200 em /arquivo-morto/js/arquivo-morto.js', async () => {
    const res = await fetchPath('/arquivo-morto/js/arquivo-morto.js');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('initSurfaceLinks'), 'JS deve configurar links de superfície');
    assert.ok(res.body.includes('renderClueLedger'), 'JS deve renderizar ledger');
    assert.ok(res.body.includes('clue inválido'), 'collectClue deve ter warning defensivo');
  });

  it('deve responder 200 em /arquivo-morto/data/pistas.json', async () => {
    const res = await fetchPath('/arquivo-morto/data/pistas.json');
    assert.strictEqual(res.status, 200);
    const pistas = JSON.parse(res.body);
    assert.strictEqual(pistas.length, 8, 'deve ter 8 pistas');
  });

  it('deve responder 200 em /app/styles/tokens.css', async () => {
    const res = await fetchPath('/app/styles/tokens.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('--color-brand'), 'tokens deve conter --color-brand');
  });

  it('deve responder 200 em /config/surface-links.json', async () => {
    const res = await fetchPath('/config/surface-links.json');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('centro'), 'config deve listar centro');
  });

  it('404 em /centro/ nao deve receber cache immutable', async () => {
    const res = await fetchPath('/centro/');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });

  it('404 em /landing/ nao deve existir neste servidor isolado', async () => {
    const res = await fetchPath('/landing/');
    assert.strictEqual(res.status, 404);
  });

  it('404 em /arquivista/ nao deve existir neste servidor isolado', async () => {
    const res = await fetchPath('/arquivista/');
    assert.strictEqual(res.status, 404);
  });

  it('404 em /vendor/inexistente nao deve receber cache immutable', async () => {
    const res = await fetchPath('/vendor/inexistente.js');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.headers['cache-control'], 'no-cache, must-revalidate');
  });
});
