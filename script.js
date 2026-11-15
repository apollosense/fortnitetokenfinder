(() => {
// odds r 1 in X
const LOOT = [
  { id: 'gold',    name: 'Weekly Gold Outfit',          odds: 1562500 },
  { id: 'token',   name: 'Pirate Token',                odds: 137500, sub: 'Pirate Shop Access' },
  { id: 'vehicle', name: 'Weekly Vehicle & Decal',      odds: 7813 },
  { id: 'pickaxe', name: 'Weekly Pickaxe or Backbling', odds: 568 },
  { id: 'jam',     name: 'Weekly Jam Track',            odds: 391 },
  { id: 'loading', name: 'Weekly Loading Screen',       odds: 272 },
  { id: 'sprite',  name: 'Sprite Gizmo',                odds: 127 },
];
const P_TOKEN = 1 / 137500;
const GIZMOS = ['Portable Extractor', 'Extraction Accelerator', 'Sprite Locator', 'Lucky Locator', 'Golden Firework'];

// weekly pool, rotates sundays 9pm ET (02:00 UTC monday)
const WEEKS = [
  { n: 1, start: '2026-11-01T00:00:00Z', items: {
    gold: 'Solid Gold A$AP Rocky', vehicle: "Mercedes-AMG G 63 'G-Wagon' + Golden Llama Crew decal",
    pickaxe: "Solid Gold A$AP Rocky's Gauntlets", jam: "'No Trespassing' by A$AP Rocky", loading: 'Plunder in Paradise' }, slot: 'Pickaxe' },
  { n: 2, start: '2026-11-09T02:00:00Z', items: {
    gold: "Solid Gold Lil' Uzi Vert", vehicle: 'Cadillac CT5-V Blackwing + Golden Llama Crew decal',
    pickaxe: 'Diamond and Gold', jam: "'London' by Lil' Uzi Vert", loading: 'So Kawaii' }, slot: 'Back Bling' },
  { n: 3, start: '2026-11-16T02:00:00Z', items: null },
  { n: 4, start: '2026-11-23T02:00:00Z', items: null },
  { n: 5, start: '2026-11-30T02:00:00Z', items: null },
];
const TYPES = { gold: 'Outfit', vehicle: 'Vehicle', pickaxe: 'Pickaxe / Back Bling', jam: 'Jam Track', loading: 'Loading Screen', token: 'Item Shop token', sprite: 'Gizmo' };
const now = Date.now();
let week = WEEKS.filter(w => Date.parse(w.start) <= now).pop() || WEEKS[0];
const nm = l => (week.items && week.items[l.id]) || l.name;

function roll() {
  const r = Math.random(); let acc = 0;
  for (const it of LOOT) { acc += 1 / it.odds; if (r < acc) return it; }
  return null
}

const fresh = () => ({ opened: 0, coins: 0, empties: 0, counts: {}, last: {}, log: [] });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem('pts2')); if (s && typeof s.opened === 'number') S = Object.assign(fresh(), s); } catch (e) {}
LOOT.forEach(l => { S.counts[l.id] = S.counts[l.id] || 0; });
let saveT; function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem('pts2', JSON.stringify(S)); } catch (e) {} }, 300); }

function openOne() {
  S.opened++;
  const it = roll();
  if (!it) { const c = 5 + Math.floor(Math.random() * 46); S.coins += c; S.empties++; return { it: null, label: `${c} gold coins` }; }
  S.counts[it.id]++; S.last[it.id] = S.opened;
  let label = nm(it);
  if (it.id === 'sprite') label = GIZMOS[Math.floor(Math.random() * GIZMOS.length)] + ' (Gizmo)';
  S.log.unshift({ n: S.opened, id: it.id, label });
  if (S.log.length > 200) S.log.length = 200;
  return { it, label };
}

const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString('en-US');
const chestEl = $('chest');

function render() {
  $('sOpened').textContent = fmt(S.opened);
  $('sFinds').textContent = fmt(LOOT.reduce((a, l) => a + S.counts[l.id], 0));
  $('sTokens').textContent = fmt(S.counts.token);
  $('chestNo').textContent = fmt(S.opened + 1);
  $('tbody').innerHTML = LOOT.map(l => {
    const got = S.counts[l.id], exp = S.opened / l.odds;
    const since = S.last[l.id] ? fmt(S.opened - S.last[l.id]) : (S.opened ? fmt(S.opened) : '—');
    return `<tr class="${got ? 'got' : ''} ${l.id === 'token' ? 'token' : ''}">
      <td><span class="dot"></span>${nm(l)}${l.id === 'token' ? ' ★' : ''}<small class="type">${l.id === 'token' ? 'Pirate Shop Access' : (l.id === 'pickaxe' && week.slot ? week.slot : week.items || l.id === 'sprite' ? TYPES[l.id] : 'not revealed yet')}</small></td>
      <td class="n mono">1/${fmt(l.odds)}</td>
      <td class="n mono">${fmt(got)}</td>
      <td class="n mono">${exp < 10 ? exp.toFixed(2) : fmt(exp)}</td>
      <td class="n mono">${since}</td></tr>`;
  }).join('');
  const pt = 1 - Math.pow(1 - P_TOKEN, S.opened);
  $('lTok').textContent = (pt * 100).toFixed(pt < .1 ? 3 : 1) + '%';
  $('lCoins').textContent = fmt(S.coins);
  $('lEmpty').textContent = S.opened ? (S.empties / S.opened * 100).toFixed(2) + '%' : '—';
  $('log').innerHTML = S.log.length
    ? S.log.slice(0, 60).map(e => `<li class="${e.id === 'token' ? 'tk' : ''}"><b>${e.label}</b><span class="mono">chest #${fmt(e.n)}</span></li>`).join('')
    : '<li><span style="color:var(--mute)">Nothing yet.</span></li>';
}

function showResult(r, extra) {
  const el = $('result');
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  const odds = r.it ? `1 in ${fmt(r.it.odds)}` : 'no drop this time';
  el.innerHTML = `<div class="name">${r.label}</div><div class="sub">${extra || odds}</div>`;
}

function tokenFound(atChest) {
  document.body.classList.add('token');
  $('bannerText').textContent = `Dropped from chest #${fmt(atChest)}. Odds: 1 in 137,500. That's ${(atChest / 137500 * 100).toFixed(1)}% of the average wait.`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function clearToken() { document.body.classList.remove('token'); }

let lidT;
function animateChest() {
  chestEl.classList.remove('shake'); void chestEl.offsetWidth; chestEl.classList.add('shake', 'open');
  clearTimeout(lidT); lidT = setTimeout(() => chestEl.classList.remove('open'), 450);
}

function manualOpen() {
  clearToken();
  const r = openOne();
  animateChest(); showResult(r);
  if (r.it && r.it.id === 'token') tokenFound(S.opened);
  render(); save();
}

function bulk(n) {
  clearToken();
  const got = {}; let tokenAt = 0;
  for (let i = 0; i < n; i++) { const r = openOne(); if (r.it) { got[r.it.id] = (got[r.it.id] || 0) + 1; if (r.it.id === 'token' && !tokenAt) tokenAt = S.opened; } }
  animateChest();
  const parts = LOOT.filter(l => got[l.id]).map(l => `${got[l.id]}× ${nm(l)}`);
  showResult({ it: null, label: `Opened ${fmt(n)} chests` }, parts.length ? parts.join(' · ') : 'only gold coins');
  if (tokenAt) tokenFound(tokenAt);
  render(); save();
}

let autoSpeed = 0, autoAcc = 0, lastT = 0, raf = null;
function setAuto(speed) {
  autoSpeed = autoSpeed === speed ? 0 : speed;
  document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === autoSpeed));
  $('autoRate').textContent = autoSpeed ? (autoSpeed >= 50000 ? 'max' : autoSpeed.toLocaleString() + '/s') : 'off';
  if (autoSpeed) { clearToken(); lastT = performance.now(); autoAcc = 0; if (!raf) raf = requestAnimationFrame(tick); }
}
function tick(t) {
  raf = null; if (!autoSpeed) return;
  const dt = Math.min(.25, (t - lastT) / 1000); lastT = t;
  autoAcc += autoSpeed * dt;
  let n = Math.floor(autoAcc); autoAcc -= n;
  let lastR = null, stop = false;
  for (let i = 0; i < n; i++) {
    const r = openOne(); lastR = r;
    if (r.it && r.it.id === 'token' && $('stopToken').checked) { stop = true; tokenFound(S.opened); break; }
    if (r.it && $('stopAny').checked) { stop = true; break; }
    if (r.it && r.it.id === 'token') tokenFound(S.opened);
  }
  if (lastR) { if (autoSpeed <= 50 || stop) { animateChest(); showResult(lastR); } render(); save(); }
  if (stop) { setAuto(autoSpeed); return; }
  raf = requestAnimationFrame(tick);
}


function shareText() {
  const finds = LOOT.filter(l => S.counts[l.id]).map(l => `${l.id === 'token' ? '★' : '•'} ${S.counts[l.id]}× ${nm(l)}`);
  const pt = 1 - Math.pow(1 - P_TOKEN, S.opened);
  return [
    '☠ PIRATE TOKEN SIMULATOR (week ' + week.n + ')',
    `Chests opened: ${fmt(S.opened)}`,
    `Pirate Tokens: ${fmt(S.counts.token)}${S.counts.token ? ' 🟨' : ''}`,
    ...(finds.length ? finds : ['• nothing but gold coins 💀']),
    `Gold coins: ${fmt(S.coins)}`,
    `Chance I'd have a token by now: ${(pt * 100).toFixed(pt < .1 ? 3 : 1)}%`,
    '',
    location.protocol.startsWith('http') && !location.hostname.endsWith('claude.ai') ? location.href.split('#')[0] : ''
  ].join('\n').trim();
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }
function legacyCopy(text) {
  const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
}
async function share() {
  const text = shareText();
  if (navigator.share && matchMedia('(pointer: coarse)').matches) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text); toast('Stats copied, paste them anywhere'); }
  catch (e) { toast(legacyCopy(text) ? 'Stats copied, paste them anywhere' : 'Couldn\'t copy, your browser blocked it'); }
}
$('shareBtn').onclick = share;
$('shareTokBtn').onclick = share;

$('openBtn').onclick = manualOpen;
chestEl.onclick = manualOpen;
document.querySelectorAll('[data-bulk]').forEach(b => b.onclick = () => bulk(+b.dataset.bulk));
document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => setAuto(+b.dataset.speed));
$('continueBtn').onclick = clearToken;
let resetArm = false;
$('resetBtn').onclick = () => {
  if (!resetArm) { resetArm = true; $('resetBtn').textContent = 'Click again to confirm'; setTimeout(() => { resetArm = false; $('resetBtn').textContent = 'Reset everything'; }, 2500); return; }
  resetArm = false; $('resetBtn').textContent = 'Reset everything';
  if (autoSpeed) setAuto(autoSpeed);
  S = fresh(); LOOT.forEach(l => S.counts[l.id] = 0); clearToken();
  $('result').innerHTML = '<div class="name">Ready</div><div class="sub">Press Space or click the chest</div>';
  render(); save();
};
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); manualOpen(); }
  else if (e.code === 'KeyA') setAuto(autoSpeed || 50);
  else if (e.code === 'Escape') { if (autoSpeed) setAuto(autoSpeed); clearToken(); }
});
const ws = $('weekSel');
ws.innerHTML = WEEKS.map(w => `<option value="${w.n}" ${Date.parse(w.start) > now ? 'disabled' : ''}>Week ${w.n}${w === week ? ' (now)' : ''}${Date.parse(w.start) > now ? ' (soon)' : ''}</option>`).join('');
ws.value = week.n;
ws.onchange = () => { week = WEEKS.find(w => w.n === +ws.value); render(); };
document.addEventListener('click', e => { const b = e.target.closest('button'); if (b) b.blur(); });
render();
})();
