# dossie_arquivo_morto

**Anhangabaú: O Arquivo dos Soterrados — Protocolo 13 Almas**
Superfície: **Arquivo Morto** (blog narrativo forense)

---

## O que é este projeto

O blog forense do ARG. Dossiês do Arquivista, pistas clicáveis (`clue-word`),
Caderno lateral com ledger de evidências coletadas. A superfície onde o jogador
lê os dossiês, coleta 8 pistas e recebe as instruções para descer ao mapa.

Entrada narrativa: o jogador chega da Landing ou acessa diretamente.

---

## Como rodar localmente

```bash
# Iniciar servidor de desenvolvimento na porta 8080
python3 server.py

# Acessar
open http://127.0.0.1:8080/arquivo-morto/
```

Não há `npm install` obrigatório para o Arquivo Morto — ele não usa bundler,
MapLibre nem Three. A única dependência de runtime é `vendor/app/` (design
system, já copiado aqui).

---

## Como testar

```bash
npm test
```

Testes HTTP sobem `server.py` na porta 9878 e validam rotas, cache headers e
contrato de 8 pistas (sem dependências externas além de Node ≥18).

---

## Estrutura principal

```
dossie_arquivo_morto/
├── arquivo-morto/
│   ├── index.html             ← Registro 001 (artigo principal)
│   ├── posts/
│   │   └── martinelli-topo.html  ← post adicional
│   ├── css/
│   │   └── arquivo-morto.css
│   ├── js/
│   │   └── arquivo-morto.js   ← clue-word, Caderno, localStorage
│   ├── data/
│   │   └── pistas.json        ← metadados das 8 pistas
│   └── assets/
│       └── img/               ← imagens narrativas
├── vendor/app/                ← design system (tokens.css, a11y.css, components.css)
├── config/
│   └── surface-links.json     ← URLs das outras superfícies (override deploy)
├── index.html                 ← redirect para /arquivo-morto/
├── server.py                  ← servidor isolado (porta 8080)
└── docs/game/                 ← contratos ARG (pistas, fases, superfícies)
```

---

## Rotas disponíveis (servidor isolado)

| Rota | Status | Descrição |
|------|--------|-----------|
| `/` | 200 | Redirect meta para `/arquivo-morto/` |
| `/arquivo-morto/` | 200 | Blog narrativo + Caderno |
| `/arquivo-morto/js/arquivo-morto.js` | 200 | Runtime de pistas |
| `/arquivo-morto/data/pistas.json` | 200 | Metadados das 8 pistas |
| `/app/styles/tokens.css` | 200 | Design system (proxy → `vendor/app/`) |
| `/config/surface-links.json` | 200 | Links externos configuráveis |
| `/docs/` | 200 | Contratos ARG |
| `/centro/` | 404 | Superfície externa |
| `/landing/` | 404 | Superfície externa |
| `/arquivista/` | 404 | Superfície externa |

A pasta `landing/` existe no repo como artefato da cópia inicial, mas o
servidor isolado **não** a expõe — links para Landing/Centro/Arquivista
apontam para outras superfícies (mesmo domínio ou URL absoluta).

---

## Superfície

**Arquivo Morto** — `/arquivo-morto/`

---

## Contratos que esta superfície produz

| Contrato                    | Destino      | Uso |
|-----------------------------|--------------|-----|
| `protocolo13_caderno_clues` | Centro, Arquivista | Array JSON de IDs de pistas coletadas |

Chave `localStorage`: `protocolo13_caderno_clues` — array de strings com IDs
das pistas coletadas (até 8).

**Aviso multi-domínio:** se Centro, Landing ou Arquivista estiverem em outro
domínio, `localStorage` não atravessa origens. O jogador precisará de fallback
por link/query (`?clues=`) ou export futuro — ver `ARG-CONTRACTS-B`.

---

## Links externos configuráveis

Defaults (monodomínio):

| Destino | URL default |
|---------|-------------|
| Centro | `/centro/` |
| Landing | `/landing/` |
| Arquivista | `/arquivista/` |

Override por deploy:

1. Editar `config/surface-links.json`
2. Ou definir antes do script: `window.ARQUIVO_MORTO_SURFACE_LINKS = { centro: 'https://...' }`

Elementos com `data-surface-link="centro|landing|arquivista"` recebem o href
em runtime. O link “Abrir MapLibre” na conclusão (4/4 REQUIRED_CLUES) usa
o mesmo resolver (`getSurfaceLink('centro')`).

**Pendência documentada:** o Centro aceita `?clues=` para bootstrap cross-domain;
o Arquivo Morto ainda não anexa query ao link de conclusão — o contrato
canônico continua sendo `protocolo13_caderno_clues` no mesmo domínio.

---

## Contratos que esta superfície consome

Nenhum contrato externo. O Arquivo Morto é a **origem** das pistas.

---

## Pistas (contrato 8)

| ID | Categoria |
|----|-----------|
| `peso-fundacao` | mecanica |
| `nao-olhe-alto` | mecanica |
| `sob-solas` | mecanica |
| `aresta-fria` | local |
| `aurora-maloca` | evento |
| `agua-calada` | entidade |
| `comercio-velho` | local |
| `guardiao-tampa` | local |

**REQUIRED_CLUES** (conclusão 3/4 e 4/4): `peso-fundacao`, `aresta-fria`,
`aurora-maloca`, `agua-calada` — as outras 4 enriquecem o ledger e o Centro.

---

## Próximos gates

- `SPLIT-ARQUIVISTA-B` — validar Arquivista isolado
- `ARG-CONTRACTS-B` — contrato cross-domain para `protocolo13_caderno_clues`
- `REPO-INIT-C` — `git init` quando todas as superfícies estiverem autônomas
