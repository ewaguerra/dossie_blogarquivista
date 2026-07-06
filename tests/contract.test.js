import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('dossie_arquivo_morto — contrato de pistas', () => {
  it('pistas.json deve ter 8 pistas com guardiao-tampa', () => {
    const pistas = JSON.parse(
      readFileSync(join(ROOT, 'arquivo-morto/data/pistas.json'), 'utf8')
    );
    assert.strictEqual(pistas.length, 8);
    const ids = pistas.map((p) => p.id);
    assert.ok(ids.includes('guardiao-tampa'), 'guardiao-tampa deve existir');
  });

  it('data-clue-id do HTML deve ser subconjunto de pistas.json', () => {
    const html = readFileSync(join(ROOT, 'arquivo-morto/posts/registro-001.html'), 'utf8');
    const pistas = JSON.parse(
      readFileSync(join(ROOT, 'arquivo-morto/data/pistas.json'), 'utf8')
    );
    const validIds = new Set(pistas.map((p) => p.id));
    const matches = html.matchAll(/data-clue-id="([^"]+)"/g);
    const htmlIds = [...matches].map((m) => m[1]);
    const uniqueHtmlIds = [...new Set(htmlIds)];

    assert.ok(uniqueHtmlIds.length > 0, 'HTML deve ter data-clue-id');
    for (const id of uniqueHtmlIds) {
      assert.ok(validIds.has(id), `data-clue-id órfão: ${id}`);
    }
  });

  it('arquivo-morto.js deve usar DOM seguro no ledger', () => {
    const js = readFileSync(join(ROOT, 'arquivo-morto/js/arquivo-morto.js'), 'utf8');
    assert.ok(js.includes('replaceChildren'), 'ledger deve limpar com replaceChildren');
    assert.ok(js.includes('createElement'), 'ledger deve usar createElement');
    assert.ok(!js.includes('list.innerHTML'), 'ledger nao deve usar innerHTML na lista');
  });
});
