#!/usr/bin/env node
// relais — vérification des critères d'acceptation en CI (GitHub Actions).
// Fichier AUTONOME (aucune dépendance) : copié dans le dépôt par /relais:ci. Ne pas modifier ici.
// Usage : node ci-check.mjs [--junit <fichier.xml>]... [--issue <n>]
//
// Vérifie, pour la PR courante :
//   1. l'issue liée (branche <prefix><n>-… ou « Closes #n ») et « Closes #n » dans le corps de PR ;
//   2. que la PR ne ferme pas l'epic ;
//   3. pour chaque CA `auto` : coché dans l'issue, présent dans le code de test (ID dans le nom),
//      et — si un rapport JUnit est fourni — au moins un cas de test portant l'ID, tous passés.
// Exit 0 : OK (ou PR hors workflow) · 1 : critère non satisfait · 2 : erreur technique.
export const VERSION = '0.10.0';

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RE_CA = /^-\s+\[( |x|X)\]\s+(CA\d+)\s*[—–-]\s*(.+?)\s*`(auto|manuel)`\s*$/;
const RE_HEADER = /^>\s*Epic\s*:\s*#(\d+)\s*·\s*ID plan\s*:\s*(T\d+)/m;
const idRe = (id) => new RegExp(`${id}(?![0-9])`);

export function parseCriteria(body = '') {
  return body.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim().match(RE_CA)).filter(Boolean)
    .map((m) => ({ id: m[2], checked: m[1] !== ' ', text: m[3], mode: m[4] }));
}

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// JUnit (Vitest, Jest, Playwright, pytest…) → [{ name, status: passed|failed|skipped }]
export function parseJUnit(xml) {
  const cases = [];
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g; let m;
  while ((m = re.exec(xml))) {
    const attr = (k) => decode(m[1].match(new RegExp(`\\b${k}="([^"]*)"`))?.[1] ?? '');
    const inner = m[3] || '';
    const status = /<(failure|error)\b/.test(inner) ? 'failed' : /<skipped\b/.test(inner) ? 'skipped' : 'passed';
    cases.push({ name: [attr('classname'), attr('name')].filter(Boolean).join(' › '), status });
  }
  return cases;
}

export function evaluate({ criteria, junit = null, testHits = () => [] }) {
  const rows = []; const errors = [];
  for (const c of criteria) {
    if (c.mode === 'manuel') { rows.push({ ...c, verdict: '👀 review', detail: 'validation humaine' }); continue; }
    const hits = testHits(c.id);
    let verdict = '✅'; let detail = hits[0] || '';
    if (!c.checked) { verdict = '❌'; detail = 'non coché dans l\'issue'; }
    else if (!hits.length) { verdict = '❌'; detail = `aucun test ne porte « ${c.id} »`; }
    else if (junit) {
      const cases = junit.filter((t) => idRe(c.id).test(t.name));
      const failed = cases.filter((t) => t.status === 'failed');
      if (!cases.length) { verdict = '❌'; detail = `aucun cas « ${c.id} » dans le rapport JUnit (test non exécuté ?)`; }
      else if (failed.length) { verdict = '❌'; detail = `${failed.length} cas en échec : ${failed[0].name}`; }
      else if (cases.every((t) => t.status === 'skipped')) { verdict = '❌'; detail = 'tous les cas sont ignorés (skip)'; }
      else detail = `${cases.filter((t) => t.status === 'passed').length} cas passé(s)`;
    }
    if (verdict === '❌') errors.push(`${c.id} — ${c.text} : ${detail}`);
    rows.push({ ...c, verdict, detail });
  }
  return { rows, errors };
}

// ---------- exécution en CI ----------
const gh = (args) => JSON.parse(execFileSync(process.env.SPEC2GH_GH_BIN?.endsWith('.mjs') ? process.execPath : (process.env.SPEC2GH_GH_BIN || 'gh'),
  [...(process.env.SPEC2GH_GH_BIN?.endsWith('.mjs') ? [process.env.SPEC2GH_GH_BIN] : []), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const summary = (md) => { if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md}\n`); console.log(md); };

function loadConfig() {
  const f = path.join(process.cwd(), '.claude', 'spec-to-github.json');
  const c = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  return { branchPrefix: c.branchPrefix || 'feat/', epicLabel: c.labels?.epic || 'epic', testPaths: c.tests?.paths || [], requireIssue: !!c.ci?.requireIssue };
}

function testHitsFactory(paths) {
  const specs = paths.length ? paths.map((p) => `:(glob)${p}`) : ['.', ':(exclude)plans/**', ':(exclude)specs/**', ':(exclude).claude/**', ':(exclude).github/**', ':(exclude)**/*.md'];
  return (id) => {
    try { return execFileSync('git', ['grep', '-n', '-I', '-E', `${id}([^0-9]|$)`, '--', ...specs], { encoding: 'utf8' }).trim().split('\n').filter(Boolean).slice(0, 3); }
    catch { return []; }
  };
}

async function run() {
  const args = process.argv.slice(2);
  const junitFiles = args.flatMap((a, i) => (a === '--junit' ? [args[i + 1]] : []));
  const cfg = loadConfig();
  const repo = process.env.GITHUB_REPOSITORY;
  const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
  const pr = event.pull_request || {};
  const body = pr.body || '';
  const branch = pr.head?.ref || process.env.GITHUB_HEAD_REF || '';
  const fromBranch = branch.match(new RegExp(`^${cfg.branchPrefix.replace(/[/.]/g, '\\$&')}(\\d+)-`))?.[1];
  const fromBody = body.match(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i)?.[1];
  const argIssue = args[args.indexOf('--issue') + 1];
  const n = Number(args.includes('--issue') ? argIssue : fromBranch || fromBody);

  summary(`## relais — critères d'acceptation\n`);
  if (!n) {
    const msg = `PR hors workflow relais (branche « ${branch} », aucun « Closes #n »).`;
    if (cfg.requireIssue) { console.log(`::error::${esc(msg)}`); summary(`❌ ${msg}`); process.exit(1); }
    summary(`ℹ️ ${msg} Vérification ignorée.`); return;
  }
  const errors = [];
  if (!new RegExp(`\\bCloses\\s+#${n}\\b`, 'i').test(body)) errors.push(`Le corps de PR doit contenir « Closes #${n} ».`);

  const issue = gh(['issue', 'view', String(n), '--repo', repo, '--json', 'number,title,body,state,labels']);
  const header = issue.body.match(RE_HEADER);
  if ((issue.labels || []).some((l) => l.name === cfg.epicLabel)) errors.push(`#${n} est une epic : une PR doit cibler une sub-issue.`);
  if (header && new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${header[1]}\\b`, 'i').test(body)) errors.push(`La PR ferme l'epic #${header[1]} : utiliser « Part of #${header[1]} ».`);
  if (!header) {
    const msg = `#${n} n'a pas d'en-tête « ID plan » (issue hors workflow).`;
    if (cfg.requireIssue) errors.push(msg); else summary(`ℹ️ ${msg} Vérification des CA ignorée.`);
  }

  let rows = [];
  if (header) {
    let junit = null;
    for (const f of junitFiles) {
      if (!fs.existsSync(f)) { errors.push(`Rapport JUnit introuvable : ${f} (les tests ont-ils tourné ?)`); continue; }
      junit = [...(junit || []), ...parseJUnit(fs.readFileSync(f, 'utf8'))];
    }
    const criteria = parseCriteria(issue.body);
    if (!criteria.length) errors.push(`#${n} : aucun critère d'acceptation lisible.`);
    const r = evaluate({ criteria, junit, testHits: testHitsFactory(cfg.testPaths) });
    rows = r.rows; errors.push(...r.errors);
  }

  summary(`Issue : #${n} — ${issue.title}${header ? ` · ${header[2]} · epic #${header[1]}` : ''}\n`);
  if (rows.length) {
    summary('| CA | Mode | Critère | Verdict | Détail |\n|---|---|---|---|---|');
    for (const r of rows) summary(`| ${r.id} | ${r.mode} | ${r.text.replace(/\|/g, '\\|')} | ${r.verdict} | ${String(r.detail).replace(/\|/g, '\\|')} |`);
  }
  if (errors.length) {
    for (const e of errors) console.log(`::error title=Critères d'acceptation::${esc(e)}`);
    summary(`\n❌ ${errors.length} problème(s) :\n${errors.map((e) => `- ${e}`).join('\n')}`);
    process.exit(1);
  }
  summary('\n✅ Tous les critères automatiques sont prouvés. Les critères `manuel` restent à valider en review.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((e) => { console.log(`::error::${esc(`relais : ${e.message}`)}`); process.exit(2); });
}
