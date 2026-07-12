# Component vocabulary

Copy-ready markup + CSS for the paper-html style. All snippets assume the
`:root` tokens from SKILL.md are present. They're already on-palette — drop them
in and adjust content. Mix and match; these are building blocks, not a fixed
layout.

## Table of contents
- [Header block](#header-block)
- [Cards & panels](#cards--panels)
- [Stat tiles / KPI row](#stat-tiles--kpi-row)
- [Badges & pills](#badges--pills)
- [Status dots](#status-dots)
- [Buttons](#buttons)
- [Inputs, checkbox, toggle](#inputs-checkbox-toggle)
- [Tables](#tables)
- [Callouts / notes](#callouts--notes)
- [Code block & inline code](#code-block--inline-code)
- [Timeline / activity list](#timeline--activity-list)
- [Tabs (inline JS)](#tabs-inline-js)

---

## Header block
The standard page opening: mono eyebrow → serif title → muted sub-line.

```html
<header style="margin-bottom:48px">
  <div class="eyebrow">Status report · Q3</div>
  <h1>Acme platform health</h1>
  <p style="color:var(--gray-500);font-size:14px;margin:6px 0 0">
    Generated 5 Jul 2026 · covering the last 14 days
  </p>
</header>
```

## Cards & panels
White card on the ivory field, hairline border, panel radius. The workhorse
container.

```css
.card {
  background: var(--white);
  border: var(--border);
  border-radius: var(--radius-panel);
  padding: 22px 24px;
}
.card + .card { margin-top: 16px; }
.card-title { font-family: var(--serif); font-weight: 500; font-size: 18px; margin: 0 0 10px; }
/* Soft variant — filled oat surface, no border, for asides */
.panel-soft {
  background: var(--oat);
  border-radius: var(--radius-panel);
  padding: 18px 20px;
}
```
```html
<div class="card">
  <div class="card-title">Deployment cadence</div>
  <p style="margin:0;color:var(--gray-700)">42 deploys shipped, median lead time 3.1h.</p>
</div>
```

## Stat tiles / KPI row
A responsive row of metric tiles. The number is where clay can earn its keep.

```css
.stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.stat-card { background: var(--white); border: var(--border); border-radius: var(--radius-panel); padding: 18px 20px; }
.stat-label { font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--gray-500); }
.stat-num { font-family: var(--serif); font-weight: 500; font-size: 34px; letter-spacing: -0.02em; margin: 8px 0 2px; }
.stat-num.accent { color: var(--clay); }
.stat-delta { font-size: 12px; font-weight: 500; }
.stat-delta.up   { color: var(--olive); }
.stat-delta.down { color: var(--danger); }
.stat-delta.flat { color: var(--gray-500); }
```
```html
<div class="stat-row">
  <div class="stat-card">
    <div class="stat-label">Uptime</div>
    <div class="stat-num">99.98%</div>
    <div class="stat-delta up">▲ 0.02 vs last period</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Open incidents</div>
    <div class="stat-num accent">3</div>
    <div class="stat-delta down">▲ 1 new today</div>
  </div>
</div>
```

## Badges & pills
Small rounded status labels. Tinted background, saturated text.

```css
.badge { display:inline-flex; align-items:center; height:22px; padding:0 9px;
  font-size:12px; font-weight:500; border-radius:999px; }
.badge-neutral { background: var(--gray-100); color: var(--gray-700); }
.badge-accent  { background: rgba(217,119,87,0.14); color: var(--clay); }
.badge-success { background: rgba(120,140,93,0.16); color: var(--olive); }
.badge-warning { background: rgba(199,142,63,0.16); color: #A06A2A; }
.badge-danger  { background: rgba(176,74,74,0.14);  color: var(--danger); }
```
```html
<span class="badge badge-accent">In review</span>
<span class="badge badge-success">Done</span>
<span class="badge badge-warning">Overdue</span>
```

## Status dots
Tiny colored dot for inline status (risk levels, health).

```css
.dot { display:inline-block; width:8px; height:8px; border-radius:999px; margin-right:6px; vertical-align:middle; }
.dot.low  { background: var(--olive); }
.dot.med  { background: var(--warning); }
.dot.high { background: var(--danger); }
```
```html
<span><span class="dot low"></span>Healthy</span>
```

## Buttons
Clay primary, bordered secondary, ghost, danger. 36px tall, 8px radius.

```css
.btn { display:inline-flex; align-items:center; justify-content:center; height:36px;
  padding:0 16px; font-family:var(--sans); font-size:14px; font-weight:500;
  border-radius:var(--radius-row); border:1.5px solid transparent; cursor:pointer;
  transition: background .12s ease, border-color .12s ease; }
.btn-primary   { background: var(--clay); color: var(--white); }
.btn-primary:hover { background: #C7684C; }
.btn-secondary { background: var(--white); color: var(--slate); border-color: var(--gray-300); }
.btn-secondary:hover { background: var(--gray-100); }
.btn-ghost { background: transparent; color: var(--gray-700); }
.btn-ghost:hover { background: var(--gray-100); }
.btn-danger { background: var(--danger); color: var(--white); }
.btn-danger:hover { background: #9A3F3F; }
```

## Inputs, checkbox, toggle
Note the clay focus ring — reuse it on any focusable custom control.

```css
.input { height:38px; padding:0 12px; font-family:var(--sans); font-size:14px;
  color:var(--slate); background:var(--white); border:var(--border);
  border-radius:var(--radius-row); outline:none;
  transition: border-color .12s ease, box-shadow .12s ease; }
.input::placeholder { color: var(--gray-500); }
.input:focus { border-color: var(--clay); box-shadow: 0 0 0 3px rgba(217,119,87,0.15); }

.checkbox { display:inline-flex; align-items:center; gap:10px; font-size:14px; cursor:pointer; user-select:none; }
.checkbox input { appearance:none; width:18px; height:18px; border:var(--border);
  border-radius:5px; background:var(--white); margin:0; cursor:pointer; position:relative;
  transition: background .12s ease, border-color .12s ease; }
.checkbox input:checked { background: var(--clay); border-color: var(--clay); }
.checkbox input:checked::after { content:""; position:absolute; left:5px; top:1px;
  width:5px; height:10px; border:solid var(--white); border-width:0 2px 2px 0; transform:rotate(45deg); }
```

## Tables
Airy, hairline row separators, mono column headers.

```css
.table { width:100%; border-collapse:collapse; font-size:14px; }
.table thead th { text-align:left; font-family:var(--mono); font-size:11px;
  text-transform:uppercase; letter-spacing:0.06em; color:var(--gray-500);
  font-weight:500; padding:0 16px 10px; border-bottom:1px solid var(--gray-300); }
.table tbody td { padding:12px 16px; border-bottom:1px solid var(--gray-100); color:var(--gray-700); }
.table tbody tr:last-child td { border-bottom:none; }
.table tbody tr:hover { background: var(--gray-100); }
```
Wrap wide tables in `<div style="overflow-x:auto">` so the page body never
scrolls sideways.

## Callouts / notes
Left clay rule marks an aside. Swap the accent for warning/danger as needed.

```css
.callout { border-left: 3px solid var(--clay); background: var(--gray-100);
  border-radius: 0 var(--radius-row) var(--radius-row) 0; padding: 14px 18px; }
.callout .callout-label { font-family:var(--mono); font-size:11px; text-transform:uppercase;
  letter-spacing:0.07em; color:var(--clay); margin-bottom:4px; }
.callout.warn { border-left-color: var(--warning); }
.callout.warn .callout-label { color:#A06A2A; }
```
```html
<div class="callout">
  <div class="callout-label">Note</div>
  <div>Migrations run before the app boots; keep them backward-compatible.</div>
</div>
```

## Code block & inline code
Mono, subtle gray fill. Inline chips are tiny.

```css
code.inline { font-family:var(--mono); font-size:0.9em; background:var(--gray-100);
  padding:1px 5px; border-radius:4px; }
pre.code { font-family:var(--mono); font-size:13px; line-height:1.6; color:var(--gray-700);
  background:var(--gray-100); border:var(--border); border-radius:var(--radius-row);
  padding:14px 16px; overflow-x:auto; margin:0; }
```

## Timeline / activity list
Vertical rail of events; clay marks the current/active node.

```css
.timeline { list-style:none; margin:0; padding:0; }
.timeline li { position:relative; padding:0 0 20px 24px; border-left:1.5px solid var(--gray-300); }
.timeline li:last-child { border-left-color:transparent; padding-bottom:0; }
.timeline li::before { content:""; position:absolute; left:-6px; top:2px; width:10px; height:10px;
  border-radius:999px; background:var(--white); border:1.5px solid var(--gray-300); }
.timeline li.active::before { background:var(--clay); border-color:var(--clay); }
.timeline .when { font-family:var(--mono); font-size:11px; color:var(--gray-500); }
```

## Tabs (inline JS)
Minimal client-side tabs when a page needs light interactivity. Keep JS small.

```html
<div class="tabbar" style="display:flex;gap:4px;border-bottom:1px solid var(--gray-300);margin-bottom:16px">
  <button class="tab on" data-tab="a">Overview</button>
  <button class="tab" data-tab="b">Details</button>
</div>
<div data-panel="a">Overview content…</div>
<div data-panel="b" hidden>Details content…</div>
<style>
  .tab { border:none; background:none; font-family:var(--sans); font-size:14px; font-weight:500;
    color:var(--gray-500); padding:8px 12px; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
  .tab.on { color:var(--slate); border-bottom-color:var(--clay); }
</style>
<script>
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
    const id = t.dataset.tab;
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== id; });
  }));
</script>
```
