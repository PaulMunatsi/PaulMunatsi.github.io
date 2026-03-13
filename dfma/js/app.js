/* ============================================================
   DFMA Site — Main JavaScript
   Digital Forensics & Malware Analysis: Zero to Mastery
   ============================================================ */

'use strict';

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  modules: [
    { id: 'mod00', num: '00', title: 'Introduction & Setup', file: 'modules/00_introduction.md', difficulty: 'beginner', hasLab: true, labFile: 'labs/lab00_setup.md', labId: 'lab00', desc: 'Lab setup, ethics, legal framework and course overview.' },
    { id: 'mod01', num: '01', title: 'Foundations', file: 'modules/01_foundations.md', difficulty: 'beginner', hasLab: true, labFile: 'labs/lab01_file_formats.md', labId: 'lab01', desc: 'ELF/PE/APK file formats, magic bytes and analysis mindset.' },
    { id: 'mod02', num: '02', title: 'Static Analysis', file: 'modules/02_static_analysis.md', difficulty: 'beginner', hasLab: true, labFile: 'labs/lab02_static_analysis.md', labId: 'lab02', desc: 'strings, file, readelf, objdump — without executing anything.' },
    { id: 'mod03', num: '03', title: 'Dynamic Analysis', file: 'modules/03_dynamic_analysis.md', difficulty: 'intermediate', hasLab: true, labFile: 'labs/lab03_dynamic_analysis.md', labId: 'lab03', desc: 'strace, ltrace, sandbox execution and behavioral profiling.' },
    { id: 'mod04', num: '04', title: 'Memory Forensics', file: 'modules/04_memory_forensics.md', difficulty: 'intermediate', hasLab: true, labFile: 'labs/lab04_memory_forensics.md', labId: 'lab04', desc: 'Volatility3, RAM acquisition, process injection detection.' },
    { id: 'mod05', num: '05', title: 'YARA & Sigma Rules', file: 'modules/05_yara_sigma.md', difficulty: 'intermediate', hasLab: true, labFile: 'labs/lab05_yara.md', labId: 'lab05', desc: 'Writing detection rules from first principles.' },
    { id: 'mod06', num: '06', title: 'Reverse Engineering', file: 'modules/06_reverse_engineering.md', difficulty: 'advanced', hasLab: true, labFile: 'labs/lab06_reverse_engineering.md', labId: 'lab06', desc: 'Ghidra, radare2, XOR decoding and anti-disassembly.' },
    { id: 'mod07', num: '07', title: 'Reporting & IOCs', file: 'modules/07_reporting_iocs.md', difficulty: 'intermediate', hasLab: true, labFile: 'labs/lab07_reporting_iocs.md', labId: 'lab07', desc: 'STIX/TAXII, TLP, professional analyst report writing.' },
    { id: 'mod08', num: '08', title: 'Case Study: Hollow Reed', file: 'modules/08_case_study.md', difficulty: 'intermediate', hasLab: true, labFile: 'labs/lab08_case_study.md', labId: 'lab08', desc: 'Full incident response from triage to final report.' },
    { id: 'mod09', num: '09', title: 'Document Malware', file: 'modules/09_document_analysis.md', difficulty: 'intermediate', hasLab: true, labFile: 'labs/lab09_document_analysis.md', labId: 'lab09', desc: 'PDF streams, Office macros, RTF exploits (CVE-2017-11882).' },
    { id: 'mod10', num: '10', title: 'Android Malware', file: 'modules/10_android_mobile_malware.md', difficulty: 'advanced', hasLab: true, labFile: 'labs/lab10_volatility_mobile.md', labId: 'lab10', desc: 'APK reversing, stalkerware, dropper and banker analysis.' },
    { id: 'mod11', num: '11', title: 'Threat Actor Profiling', file: 'modules/11_threat_actor_profiling.md', difficulty: 'advanced', hasLab: false, desc: 'Diamond Model, ATT&CK, campaign attribution techniques.' },
    { id: 'mod12', num: '12', title: 'Disk Forensics', file: 'modules/12_forensic_disk_imaging.md', difficulty: 'intermediate', hasLab: false, desc: 'dd, chain of custody, file system artefacts and recovery.' },
    { id: 'mod13', num: '13', title: 'Anti-Forensics & Ransomware', file: 'modules/13_advanced_antiforensics_ransomware_lateral.md', difficulty: 'advanced', hasLab: true, labFile: 'labs/lab13_advanced.md', labId: 'lab13', desc: 'Timestomping, log wiping, XOR ransomware decryption.' },
    { id: 'mod14', num: '14', title: 'Fileless Malware & LOLBins', file: 'modules/14_fileless_malware_lolbins.md', difficulty: 'advanced', hasLab: true, labFile: 'labs/lab14_fileless.md', labId: 'lab14', desc: 'memfd_create, ld.so.preload, auditd detection.' },
    { id: 'mod15', num: '15', title: 'Network Forensics', file: 'modules/15_network_forensics_traffic_analysis.md', difficulty: 'advanced', hasLab: true, labFile: 'labs/lab15_network_forensics.md', labId: 'lab15', desc: 'tshark, beacon detection, DGA scoring, covert channels.' },
    { id: 'mod16', num: '16', title: 'Threat Hunting', file: 'modules/16_threat_hunting.md', difficulty: 'advanced', hasLab: true, labFile: 'labs/lab16_threat_hunting.md', labId: 'lab16', desc: 'Hypothesis-driven hunting, pivot chains, hunt playbooks.' },
    { id: 'mod17', num: '17', title: 'Supply Chain & Cryptominers', file: 'modules/17_supply_chain_cryptominer.md', difficulty: 'advanced', hasLab: false, desc: 'Typosquatting, dependency confusion, XMRig hunting.' },
    { id: 'mod18', num: '18', title: 'Analyst OPSEC', file: 'modules/18_analyst_opsec.md', difficulty: 'intermediate', hasLab: false, desc: 'What each lookup leaks, isolation layers, TLP handling.' },
  ],
  labs: [
    { id: 'lab00', num: 'L00', title: 'Environment Setup', file: 'labs/lab00_setup.md', parentMod: 'mod00' },
    { id: 'lab01', num: 'L01', title: 'File Format Analysis', file: 'labs/lab01_file_formats.md', parentMod: 'mod01' },
    { id: 'lab02', num: 'L02', title: 'Static Analysis Lab', file: 'labs/lab02_static_analysis.md', parentMod: 'mod02' },
    { id: 'lab03', num: 'L03', title: 'Dynamic Analysis Lab', file: 'labs/lab03_dynamic_analysis.md', parentMod: 'mod03' },
    { id: 'lab04', num: 'L04', title: 'Memory Forensics Lab', file: 'labs/lab04_memory_forensics.md', parentMod: 'mod04' },
    { id: 'lab05', num: 'L05', title: 'YARA Lab', file: 'labs/lab05_yara.md', parentMod: 'mod05' },
    { id: 'lab06', num: 'L06', title: 'Reverse Engineering Lab', file: 'labs/lab06_reverse_engineering.md', parentMod: 'mod06' },
    { id: 'lab07', num: 'L07', title: 'Reporting Lab', file: 'labs/lab07_reporting_iocs.md', parentMod: 'mod07' },
    { id: 'lab08', num: 'L08', title: 'Case Study Lab', file: 'labs/lab08_case_study.md', parentMod: 'mod08' },
    { id: 'lab09', num: 'L09', title: 'Document Analysis Lab', file: 'labs/lab09_document_analysis.md', parentMod: 'mod09' },
    { id: 'lab10', num: 'L10', title: 'Mobile Malware Lab', file: 'labs/lab10_volatility_mobile.md', parentMod: 'mod10' },
    { id: 'lab13', num: 'L13', title: 'Anti-Forensics Lab', file: 'labs/lab13_advanced.md', parentMod: 'mod13' },
    { id: 'lab14', num: 'L14', title: 'Fileless Malware Lab', file: 'labs/lab14_fileless.md', parentMod: 'mod14' },
    { id: 'lab15', num: 'L15', title: 'Network Forensics Lab', file: 'labs/lab15_network_forensics.md', parentMod: 'mod15' },
    { id: 'lab16', num: 'L16', title: 'Threat Hunting Lab', file: 'labs/lab16_threat_hunting.md', parentMod: 'mod16' },
  ],
  capstone: { id: 'capstone', title: 'Capstone: Operation Silent Harbour', file: 'labs/capstone_silent_harbour.md' },
  markdownPath: 'assets/markdown/'
};

// All pages combined for navigation
const ALL_PAGES = [
  ...CONFIG.modules.map(m => ({ ...m, type: 'module', href: `${m.id}.html` })),
  ...CONFIG.labs.map(l => ({ ...l, type: 'lab', href: `${l.id}.html` })),
  { ...CONFIG.capstone, type: 'capstone', href: 'capstone.html' }
];

// ============================================================
// STATE
// ============================================================

let contentCache = {};
let searchIndex  = [];
let currentPage  = '';

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  currentPage = window.location.pathname.split('/').pop() || 'index.html';

  initTheme();
  initSidebar();
  initBackToTop();
  initProgress();
  initSearch();
  loadPageContent();

  setTimeout(() => preloadForSearch(), 1000);
});

// ============================================================
// THEME
// ============================================================

function initTheme() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('dfma-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (btn) btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dfma-theme', next);
  });
}

// ============================================================
// SIDEBAR
// ============================================================

function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const backdrop  = document.getElementById('sidebarBackdrop');
  const mobileBtn = document.getElementById('mobileMenuBtn');

  function open()  { sidebar.classList.add('open'); backdrop.classList.add('show'); }
  function close() { sidebar.classList.remove('open'); backdrop.classList.remove('show'); }

  if (mobileBtn) mobileBtn.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
  if (backdrop)  backdrop.addEventListener('click', close);

  // Close on link click (mobile)
  sidebar?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 768) close();
  }));

  // Mark active
  sidebar?.querySelectorAll('[data-page]').forEach(el => {
    if (el.dataset.page === currentPage) {
      el.closest('.module-item')?.classList.add('active');
      el.classList.add('active');
    }
  });
}

// ============================================================
// BACK TO TOP
// ============================================================

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================
// PROGRESS
// ============================================================

function getProgress() {
  try { return JSON.parse(localStorage.getItem('dfma-progress') || '{}'); }
  catch { return {}; }
}
function saveProgress(p) { localStorage.setItem('dfma-progress', JSON.stringify(p)); }

function isComplete(id) { return getProgress()[id] === true; }

function toggleComplete(id) {
  const p = getProgress();
  const wasComplete = p[id];
  p[id] = !p[id];
  saveProgress(p);
  updateProgressUI();
  updateCheckmarks();

  if (!wasComplete && p[id]) {
    showToast('✓ Module marked complete!', 'success');
    confetti();
  } else {
    showToast('Module unmarked.', '');
  }

  // Update mark-complete button
  const btn = document.getElementById('markCompleteBtn');
  if (btn) updateCompleteBtn(btn, p[id]);
}

function initProgress() {
  updateProgressUI();
  updateCheckmarks();

  const btn = document.getElementById('markCompleteBtn');
  if (btn) {
    const pageId = getPageId();
    updateCompleteBtn(btn, isComplete(pageId));
    btn.addEventListener('click', () => toggleComplete(pageId));
  }
}

function updateProgressUI() {
  const p = getProgress();
  const total = CONFIG.modules.length + CONFIG.labs.length + 1; // +1 capstone
  const done  = Object.values(p).filter(Boolean).length;
  const pct   = Math.round((done / total) * 100);

  const pctEl  = document.getElementById('progressPct');
  const fillEl = document.getElementById('progressFill');
  if (pctEl)  pctEl.textContent  = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
}

function updateCheckmarks() {
  const p = getProgress();
  document.querySelectorAll('[data-check-id]').forEach(btn => {
    const id = btn.dataset.checkId;
    btn.classList.toggle('done', !!p[id]);
    btn.textContent = p[id] ? '✓' : '';
    btn.title = p[id] ? 'Mark incomplete' : 'Mark complete';
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      toggleComplete(id);
    });
  });
}

function updateCompleteBtn(btn, done) {
  btn.classList.toggle('is-done', done);
  btn.innerHTML = done
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Completed`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Mark Complete`;
}

function getPageId() {
  return currentPage.replace('.html', '');
}

// ============================================================
// CONTENT LOADING
// ============================================================

async function loadPageContent() {
  const body    = document.getElementById('contentBody');
  const spinner = document.getElementById('loadingSpinner');
  if (!body) return;

  // Home page
  if (currentPage === 'index.html' || currentPage === '') {
    buildHomePage(body);
    spinner?.remove();
    return;
  }

  // Find page config
  const page = ALL_PAGES.find(p => p.href === currentPage);
  if (!page) {
    body.innerHTML = `<div style="text-align:center;padding:60px"><h2 style="color:var(--red)">Page not found</h2><p style="color:var(--text-muted)">No content configured for ${currentPage}</p></div>`;
    spinner?.remove();
    return;
  }

  try {
    const md = await fetchMarkdown(page.file);
    spinner?.remove();

    // Inject metadata bar
    const metaBar = buildMetaBar(page);

    // Render markdown
    const html = marked.parse(md);
    body.innerHTML = metaBar + html;

    // Post-process
    Prism.highlightAllUnder(body);
    enhanceCodeBlocks(body);
    enhanceCallouts(body);
    addReadingTime(body);
    setupModuleNav(page);
    initModuleQuiz(page);

  } catch (err) {
    console.error(err);
    body.innerHTML = `<div style="text-align:center;padding:60px"><h2 style="color:var(--red)">⚠ Load Error</h2><p style="color:var(--text-muted)">Could not load content. Check that markdown files are in <code>assets/</code>.</p></div>`;
    spinner?.remove();
  }
}

async function fetchMarkdown(file) {
  if (contentCache[file]) return contentCache[file];
  const res = await fetch(`${CONFIG.markdownPath}${file}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${file}`);
  const text = await res.text();
  contentCache[file] = text;
  return text;
}

// ============================================================
// HOME PAGE BUILDER
// ============================================================

function buildHomePage(container) {
  const totalItems = CONFIG.modules.length + CONFIG.labs.length + 1;
  const p = getProgress();
  const done = Object.values(p).filter(Boolean).length;

  container.innerHTML = `
    <div class="hero-section">
      <div class="hero-label"><span class="dot"></span> Zero to Mastery</div>
      <h1 class="hero-title">
        Digital Forensics &<br>
        <span class="accent-red">Malware Analysis</span>
      </h1>
      <p class="hero-subtitle">
        From ELF magic bytes to memory forensics, YARA rules to threat hunting —
        a complete practitioner curriculum built for defenders.
      </p>
      <div class="hero-cta">
        <a href="mod00.html" class="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Course
        </a>
        <a href="capstone.html" class="btn btn-ghost">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Capstone Challenge
        </a>
      </div>
    </div>

    <div class="stats-strip">
      <div class="stat-cell"><span class="stat-num">19</span><span class="stat-lbl">Modules</span></div>
      <div class="stat-cell"><span class="stat-num">16</span><span class="stat-lbl">Labs</span></div>
      <div class="stat-cell"><span class="stat-num">30</span><span class="stat-lbl">CTF Flags</span></div>
      <div class="stat-cell"><span class="stat-num">5500</span><span class="stat-lbl">Total Points</span></div>
      <div class="stat-cell"><span class="stat-num" id="homeProgressPct">${done}/${totalItems}</span><span class="stat-lbl">Completed</span></div>
    </div>

    <div class="section-header">
      <span class="section-title">Course Modules</span>
      <span class="section-line"></span>
    </div>
    <div class="modules-grid" id="modulesGrid"></div>

    <div class="section-header">
      <span class="section-title">Labs</span>
      <span class="section-line"></span>
    </div>
    <div class="modules-grid" id="labsGrid"></div>

    <div class="section-header">
      <span class="section-title">Capstone</span>
      <span class="section-line"></span>
    </div>
    <div class="modules-grid" id="capstoneGrid"></div>
  `;

  // Populate module cards
  const mgrid = document.getElementById('modulesGrid');
  CONFIG.modules.forEach(m => mgrid.insertAdjacentHTML('beforeend', buildCard(m, 'module', m.id + '.html')));

  // Labs
  const lgrid = document.getElementById('labsGrid');
  CONFIG.labs.forEach(l => lgrid.insertAdjacentHTML('beforeend', buildCard(l, 'lab', l.id + '.html')));

  // Capstone
  const cgrid = document.getElementById('capstoneGrid');
  cgrid.insertAdjacentHTML('beforeend', buildCard(CONFIG.capstone, 'capstone', 'capstone.html'));

  updateCheckmarks();
}

function buildCard(item, type, href) {
  const p = getProgress();
  const done = !!p[item.id];
  const badgeClass = { module: 'badge-module', lab: 'badge-lab', capstone: 'badge-capstone' }[type];
  const badgeText  = { module: 'Module', lab: 'Lab', capstone: '★ Capstone' }[type];
  const num = item.num || (type === 'capstone' ? '★' : '?');
  const diff = item.difficulty || 'advanced';
  const desc = item.desc || '';

  return `
    <a href="${href}" class="module-card ${done ? 'done' : ''}">
      <div class="card-top">
        <span class="card-badge ${badgeClass}">${badgeText}</span>
        <span class="card-num">${num}</span>
      </div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">${desc}</div>
      <div class="card-footer">
        <span class="card-tag tag-${diff}">${diff}</span>
        <span class="card-arrow">${done ? '✓' : '→'}</span>
      </div>
    </a>
  `;
}

// ============================================================
// METADATA BAR
// ============================================================

function buildMetaBar(page) {
  const type = page.type;
  const diff = page.difficulty || 'advanced';

  let tags = `<span class="meta-tag type-${type}">${type === 'capstone' ? '★ Capstone' : type === 'lab' ? '🔬 Lab' : '📖 Module'}</span>`;
  if (diff) tags += `<span class="meta-tag difficulty-${diff}">${diff}</span>`;
  if (page.hasLab) tags += `<a href="${page.labId}.html" class="meta-tag has-lab">🔬 Has Lab →</a>`;
  if (page.parentMod) {
    const mod = CONFIG.modules.find(m => m.id === page.parentMod);
    if (mod) tags += `<a href="${mod.id}.html" class="meta-tag type-module">← ${mod.title}</a>`;
  }

  return `<div class="module-meta">${tags}</div>`;
}

// ============================================================
// CODE BLOCK ENHANCEMENTS
// ============================================================

function enhanceCodeBlocks(root) {
  root.querySelectorAll('pre code').forEach((code, i) => {
    const pre = code.parentElement;
    if (pre.parentElement.classList.contains('code-wrapper')) return;

    const lang = (code.className.match(/language-(\w+)/) || [])[1] || 'code';

    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';

    const header = document.createElement('div');
    header.className = 'code-header';
    header.innerHTML = `
      <div class="code-dots">
        <span class="dot-red"></span>
        <span class="dot-yellow"></span>
        <span class="dot-green"></span>
      </div>
      <span class="code-lang">${lang}</span>
      <button class="copy-btn" aria-label="Copy code">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
    `;

    const copyBtn = header.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
        }, 2000);
      } catch { /* clipboard API not available */ }
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

// ============================================================
// CALLOUT ENHANCEMENT
// ============================================================

function enhanceCallouts(root) {
  root.querySelectorAll('blockquote').forEach(bq => {
    const text = bq.textContent;
    if (text.includes('⚠') || text.toLowerCase().includes('warning')) {
      bq.className = 'callout callout-warning';
    } else if (text.includes('🚨') || text.toLowerCase().includes('danger') || text.toLowerCase().includes('legal warning')) {
      bq.className = 'callout callout-danger';
    } else if (text.includes('ℹ') || text.toLowerCase().includes('note') || text.toLowerCase().includes('tip')) {
      bq.className = 'callout callout-info';
    }
  });
}

// ============================================================
// READING TIME
// ============================================================

function addReadingTime(root) {
  const h1 = root.querySelector('h1');
  if (!h1) return;
  const words = root.textContent.split(/\s+/).length;
  const mins  = Math.ceil(words / 200);
  const badge = document.createElement('span');
  badge.className = 'reading-time-badge';
  badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${mins} min`;
  h1.appendChild(badge);
}

// ============================================================
// MODULE NAVIGATION
// ============================================================

function setupModuleNav(page) {
  const actionsDiv = document.getElementById('moduleActions');
  if (!actionsDiv) return;
  actionsDiv.style.display = 'flex';

  const allMods = CONFIG.modules;
  const idx = allMods.findIndex(m => m.id === page.id);

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    if (idx > 0) {
      prevBtn.href = `${allMods[idx - 1].id}.html`;
      prevBtn.style.display = 'inline-flex';
    } else prevBtn.style.display = 'none';
  }
  if (nextBtn) {
    if (idx >= 0 && idx < allMods.length - 1) {
      nextBtn.href = `${allMods[idx + 1].id}.html`;
      nextBtn.style.display = 'inline-flex';
    } else nextBtn.style.display = 'none';
  }
}

// ============================================================
// SEARCH
// ============================================================

function initSearch() {
  const input   = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  if (!input) return;

  let timeout;
  input.addEventListener('input', e => {
    clearTimeout(timeout);
    const q = e.target.value.trim();
    if (q.length < 2) { results.classList.remove('open'); return; }
    timeout = setTimeout(() => doSearch(q), 250);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open');
  });

  // Keyboard nav
  input.addEventListener('keydown', e => {
    const items = results.querySelectorAll('.search-result');
    const active = results.querySelector('.search-result.highlighted');
    let idx = [...items].indexOf(active);

    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, items.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); }
    else if (e.key === 'Enter' && active) { e.preventDefault(); active.click(); return; }
    else if (e.key === 'Escape') { results.classList.remove('open'); return; }

    items.forEach((it, i) => it.classList.toggle('highlighted', i === idx));
  });

  // Ctrl+K shortcut
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); input.focus(); }
  });
}

async function preloadForSearch() {
  for (const item of ALL_PAGES) {
    if (!item.file) continue;
    try {
      const md = await fetchMarkdown(item.file);
      indexContent(item, md);
    } catch { /* skip */ }
  }
}

function indexContent(item, md) {
  const lines = md.split('\n');
  let section = item.title;
  lines.forEach(line => {
    if (/^#{1,3}\s/.test(line)) { section = line.replace(/^#+\s/, '').trim(); return; }
    if (line.length > 60 && !/^[`\-\*#>]/.test(line)) {
      searchIndex.push({ page: item, section, text: line.trim() });
    }
  });
}

function doSearch(query) {
  const results = document.getElementById('searchResults');
  const q = query.toLowerCase();

  const hits = searchIndex.filter(item =>
    item.text.toLowerCase().includes(q) ||
    item.section.toLowerCase().includes(q) ||
    item.page.title.toLowerCase().includes(q)
  ).slice(0, 8);

  if (!hits.length) {
    results.innerHTML = `<div class="search-result"><div class="search-result-excerpt" style="text-align:center;color:var(--text-muted)">No results for "${query}"</div></div>`;
  } else {
    results.innerHTML = hits.map(hit => {
      const excerpt = highlightText(hit.text, query);
      return `
        <div class="search-result" onclick="window.location.href='${hit.page.href}'">
          <div class="search-result-title">${hit.section}</div>
          <div class="search-result-excerpt">${excerpt}</div>
          <span class="search-result-tag">${hit.page.title}</span>
        </div>
      `;
    }).join('');
  }
  results.classList.add('open');
}

function highlightText(text, query) {
  const max = 120;
  const lo  = text.toLowerCase();
  const qi  = lo.indexOf(query.toLowerCase());
  let excerpt = qi === -1 ? text.substring(0, max) : text.substring(Math.max(0, qi - 40), Math.min(text.length, qi + 80));
  if (qi > 40) excerpt = '…' + excerpt;
  if (qi + 80 < text.length) excerpt += '…';
  return excerpt.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
    '<mark style="background:rgba(230,57,70,0.3);color:var(--text-primary);padding:0 2px;border-radius:2px">$1</mark>');
}

// ============================================================
// PARTICLES
// ============================================================

function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let raf;

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const count = Math.min(40, Math.floor(window.innerWidth / 35));
  const pts = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.5 + 0.5
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pts.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,217,255,0.5)';
      ctx.fill();

      for (let j = i + 1; j < pts.length; j++) {
        const q  = pts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(0,217,255,${0.12 * (1 - d / 110)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    raf = requestAnimationFrame(frame);
  }

  frame();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf); else frame();
  });
}

window.addEventListener('load', initParticles);

// ============================================================
// TOAST
// ============================================================

function showToast(msg, type = '') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span> ${msg}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// CONFETTI
// ============================================================

function confetti() {
  const colors = ['#e63946', '#00d9ff', '#ff6b35', '#06d6a0', '#ffd166'];
  for (let i = 0; i < 32; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999;
      width:8px; height:8px; border-radius:2px;
      background:${colors[i % colors.length]};
      left:${Math.random() * 100}%; top:-10px;
      opacity:1; transition: all 2.5s ease-out;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.top = '105%';
      el.style.opacity = '0';
      el.style.transform = `translateX(${(Math.random() - 0.5) * 300}px) rotate(${Math.random() * 720}deg)`;
    });
    setTimeout(() => el.remove(), 2600);
  }
}

// ============================================================
// QUIZ DATA & ENGINE
// ============================================================

const QUIZ_DATA = {
  mod01: [
    {
      q: "What are the first 4 bytes of an ELF binary called?",
      opts: ["File header", "Magic bytes", "Entrypoint", "Section header"],
      ans: 1,
      exp: "ELF files start with 0x7F 45 4C 46 (0x7F 'ELF'). These magic bytes let tools like file and readelf identify the format without relying on the extension."
    },
    {
      q: "The file command identified a binary as 'ELF 64-bit LSB executable, x86-64'. What does LSB mean?",
      opts: ["Linux System Binary", "Least Significant Bit (little-endian)", "Large Static Binary", "Local System Build"],
      ans: 1,
      exp: "LSB = Least Significant Byte first — little-endian byte ordering. x86-64 processors are little-endian, meaning multi-byte values are stored with the low byte first."
    },
    {
      q: "Which hex bytes mark the start of a PDF document?",
      opts: ["FF D8 FF", "25 50 44 46", "7F 45 4C 46", "50 4B 03 04"],
      ans: 1,
      exp: "25 50 44 46 decodes to %PDF. Knowing magic bytes lets you identify mislabelled files and spot embedded payloads."
    },
    {
      q: "An analyst runs `strings` on a suspicious ELF and sees '/proc/self/maps'. What does this suggest?",
      opts: ["The binary reads its own memory map — possibly for anti-debug or process hollowing", "Normal system utility behaviour", "The binary only runs as root", "A corrupted file"],
      ans: 0,
      exp: "/proc/self/maps lets a process inspect its own memory regions. Malware uses this to locate targets for injection, detect sandboxes (via unexpected mappings), or implement reflective loaders."
    },
    {
      q: "Why should you never run an unknown binary directly on your host machine?",
      opts: ["It might be slow", "It could modify the host, phone home, or persist — contaminating evidence and infecting your environment", "file won't work on it", "strings output will be misleading"],
      ans: 1,
      exp: "Dynamic analysis must always occur inside an isolated VM with no network access or host-shared folders. Never execute untrusted code on a machine you care about."
    }
  ],
  mod02: [
    {
      q: "You run `strings -n 8 malware.elf` and see 'ToyBeacon/1.0'. What does the -n flag do?",
      opts: ["Limits output to 8 results", "Only prints strings ≥ 8 characters long", "Searches 8 bytes at a time", "Outputs in network byte order"],
      ans: 1,
      exp: "The -n flag sets the minimum string length. -n 8 filters out short noise and surfaces more meaningful strings like user-agents, C2 domains and error messages."
    },
    {
      q: "readelf -h shows 'Entry point address: 0x401080'. What is the entry point?",
      opts: ["The last instruction executed", "The first instruction the OS runs after loading the binary", "The main() function address", "The .text section start"],
      ans: 1,
      exp: "The entry point is where execution begins. On Linux ELFs it's typically _start, which sets up the C runtime before calling main(). Malware sometimes patches this to run code before main()."
    },
    {
      q: "objdump -d output shows a call to socket() and connect(). What does this indicate?",
      opts: ["The binary handles file I/O", "The binary makes network connections — a strong indicator of C2 or beaconing behaviour", "It is a web server", "Normal for any program"],
      ans: 1,
      exp: "socket() + connect() = TCP client. Combined with gethostbyname() or hard-coded IP strings, this is a classic C2 indicator. Fileless malware may also use memfd_create + execve instead."
    },
    {
      q: "During static analysis you find an XOR loop: `xor al, 0x41` applied to each byte of a buffer. What is this?",
      opts: ["Checksumming", "Single-byte XOR obfuscation with key 0x41", "AES encryption", "Compression"],
      ans: 1,
      exp: "Single-byte XOR is the most common lightweight obfuscation. Key 0x41 = 'A'. You can decode by XORing every byte of the cipher buffer with 0x41. Our toy_app.c uses this exact scheme."
    },
    {
      q: "What is the primary difference between static and dynamic analysis?",
      opts: [
        "Static is faster; dynamic is more accurate",
        "Static examines the file without executing it; dynamic observes behaviour during execution",
        "Static requires root; dynamic does not",
        "Static only works on Windows; dynamic on Linux"
      ],
      ans: 1,
      exp: "Static analysis (strings, readelf, disassembly) is safe — the binary never runs. Dynamic analysis (strace, sandbox) reveals runtime behaviour including decrypted payloads and network calls, but requires an isolated environment."
    }
  ],
  mod03: [
    {
      q: "strace output shows `connect(3, {AF_INET, '127.0.0.1', 4444}, 16)`. What does this tell you?",
      opts: [
        "The binary listens on port 4444",
        "The binary is making an outbound TCP connection to 127.0.0.1:4444",
        "The binary is reading a file descriptor",
        "The binary is creating a socket"
      ],
      ans: 1,
      exp: "connect() initiates an outbound TCP connection. AF_INET = IPv4, 127.0.0.1 = loopback, port 4444. This matches our toy_network_linux C2 pattern exactly."
    },
    {
      q: "ltrace shows `strcmp(input, 'SECRET_KEY_2024')`. Why is this useful to an analyst?",
      opts: [
        "It reveals a hardcoded secret the binary compares against — useful for bypassing auth or extracting credentials",
        "It shows the binary is safe",
        "It shows memory corruption",
        "ltrace only shows system calls"
      ],
      ans: 0,
      exp: "ltrace intercepts library function calls, including strcmp/memcmp. Hardcoded comparison strings are a goldmine — passwords, license checks, mutex names, and anti-debug triggers are often found this way."
    },
    {
      q: "A sandbox report shows the binary sleeps for 300 seconds before executing. Why?",
      opts: [
        "Bug in the code",
        "Sandbox evasion — most automated sandboxes time out before 5 minutes",
        "Waiting for user input",
        "Performance optimisation"
      ],
      ans: 1,
      exp: "Long sleep() calls are a classic sandbox evasion technique. Automated analysis runs typically time out at 2-3 minutes. Analysts can patch out the sleep or advance system time to bypass it."
    },
    {
      q: "During dynamic analysis you see a process fork itself and the child immediately calls execve(). What is this pattern?",
      opts: [
        "Crash recovery",
        "Process spawning — possibly process hollowing or simply launching a shell",
        "Memory allocation",
        "File read operation"
      ],
      ans: 1,
      exp: "fork() + execve() is the standard Unix process creation pattern. Malware uses it to launch shells (`/bin/sh -c cmd`), execute dropped payloads, or implement watchdog processes for persistence."
    },
    {
      q: "What is the purpose of a network sinkhole during dynamic analysis?",
      opts: [
        "Block all network traffic",
        "Intercept and respond to C2 communications, allowing you to observe the full protocol without contacting real infrastructure",
        "Speed up network analysis",
        "Decrypt TLS traffic"
      ],
      ans: 1,
      exp: "A sinkhole (e.g. INetSim or FakeNet-NG) emulates network services so malware believes it connected to real C2. This reveals commands, payloads, and protocol details safely — without touching attacker infrastructure."
    }
  ],
  mod04: [
    {
      q: "Volatility3's windows.malfind finds a region with RWX permissions containing x86 shellcode. What does this indicate?",
      opts: [
        "Normal JIT compilation",
        "Likely process injection — executable code written into writable memory without a backing file",
        "A corrupted heap",
        "Stack overflow"
      ],
      ans: 1,
      exp: "RWX anonymous memory regions containing shellcode are the classic process injection fingerprint. Legitimate code is mapped read-execute from files; injected code is written at runtime and has no file backing."
    },
    {
      q: "windows.pstree shows svchost.exe spawned from explorer.exe. Why is this suspicious?",
      opts: [
        "svchost.exe should never be running",
        "svchost.exe is legitimately spawned only by services.exe or wininit.exe — explorer.exe as parent indicates masquerading or hollow process injection",
        "The process tree is always random",
        "It indicates a driver conflict"
      ],
      ans: 1,
      exp: "Process parent-child relationships are a key detection signal. svchost.exe spawned from explorer.exe is a classic masquerading / process hollowing indicator. Tools like pstree and pslist help spot these anomalies."
    },
    {
      q: "You extract strings from a memory dump and find a decoded payload that wasn't visible in static analysis. Why?",
      opts: [
        "Memory is more readable than disk",
        "Memory forensics captures the runtime state — including decrypted payloads, decoded strings and injected code that exist only after execution",
        "The binary was packed",
        "Volatility adds annotations"
      ],
      ans: 1,
      exp: "Memory forensics is uniquely powerful against encrypted or packed malware. The packer/cryptor must decrypt into memory to execute — and at that point Volatility can extract the plaintext payload."
    },
    {
      q: "What is the purpose of LiME (Linux Memory Extractor)?",
      opts: [
        "A lightweight malware engine",
        "A kernel module that acquires a forensically-sound image of live Linux RAM",
        "A Volatility plugin",
        "A packet capture tool"
      ],
      ans: 1,
      exp: "LiME is loaded as a kernel module and dumps physical RAM to a file or network socket. It's the standard tool for acquiring memory from live Linux systems during incident response."
    },
    {
      q: "In a Volatility malfind output, what does the 'VAD' stand for and why does it matter?",
      opts: [
        "Virtual Address Descriptor — Windows kernel structures tracking each process's memory regions, used to identify suspicious allocations",
        "Volatile Address Directory",
        "Variable Allocation Data",
        "Virus Activity Detection"
      ],
      ans: 0,
      exp: "VADs are Windows kernel structures that track virtual memory regions per process. Malfind cross-references VADs with page table permissions to find executable regions not backed by legit files — the hallmark of injection."
    }
  ],
  mod05: [
    {
      q: "Write a YARA string to match the XOR-encoded User-Agent bytes: 01 3A 2C 17 30 34 36 3A",
      opts: [
        '`$ua = "ToyBeacon/1.0"`',
        '`$ua = { 01 3A 2C 17 30 34 36 3A }`',
        '`$ua = /ToyBeacon.*/`',
        '`$ua = { FF FF FF FF }`'
      ],
      ans: 1,
      exp: "YARA hex strings { 01 3A 2C 17 30 34 36 3A } match the encoded bytes exactly, regardless of encoding. This is more reliable than matching the decoded string, which won't appear in the raw binary."
    },
    {
      q: "A YARA rule has `all of them` in the condition. What does this mean?",
      opts: [
        "Match if any single string is found",
        "All defined strings must be present in the file for the rule to fire",
        "All files in the directory are scanned",
        "Match files of any type"
      ],
      ans: 1,
      exp: "`all of them` requires every string defined in the rule to be present. Use `any of them` for looser matching. Specific conditions like `$xor and #beacon > 2` reduce false positives."
    },
    {
      q: "What is the key difference between a YARA rule and a Sigma rule?",
      opts: [
        "YARA is faster",
        "YARA matches file/memory content; Sigma matches log events (SIEM rules)",
        "Sigma is open source; YARA is not",
        "YARA uses regex; Sigma uses hex"
      ],
      ans: 1,
      exp: "YARA scans file bytes or memory. Sigma is a generic SIEM rule format for log events — a single Sigma rule can be compiled to Splunk, Elastic, QRadar etc. Both are essential in a detection engineering toolkit."
    },
    {
      q: "You add `xor (0x01-0xff)` to a YARA string. What does this do?",
      opts: [
        "Encrypts the string before matching",
        "Tells YARA to try all single-byte XOR keys 0x01-0xff when matching the string",
        "Converts the string to hex",
        "Applies XOR to the scanned file"
      ],
      ans: 1,
      exp: "YARA's built-in xor modifier brute-forces all single-byte keys automatically. Add `nocase` too for case-insensitive XOR matches. This catches simple obfuscation without needing to know the key."
    },
    {
      q: "Why should a YARA rule have a high specificity (low false positive rate)?",
      opts: [
        "To reduce scan time",
        "Broad rules flood analysts with false positives, causing alert fatigue and missing real threats buried in noise",
        "YARA requires it technically",
        "To save disk space"
      ],
      ans: 1,
      exp: "A rule that fires on 10% of files is useless in production. Good rules combine multiple specific indicators — hex patterns, string context, file size constraints — to achieve near-zero false positives at scale."
    }
  ],
  mod06: [
    {
      q: "In Ghidra, you're looking at a function that XORs each byte with 0x41. What's the quickest way to decode the output?",
      opts: [
        "Run the binary in a sandbox",
        "Write a short Python loop: `''.join(chr(b ^ 0x41) for b in bytes)`",
        "Use strings on the binary",
        "Ask Ghidra to decompile it"
      ],
      ans: 1,
      exp: "XOR 0x41 is trivially reversible. A one-liner: `bytes([b ^ 0x41 for b in cipher_bytes])`. For our toy_app.c the hidden string is ANALYSIS_DEMO. Always verify decode in Python before trusting Ghidra's decompiler output."
    },
    {
      q: "Ghidra's decompiler shows: `if (TracerPid != 0) { exit(1); }`. What is this?",
      opts: [
        "Normal process management",
        "Anti-debug check — reads /proc/self/status to detect if a debugger is attached (TracerPid ≠ 0 means yes)",
        "Memory error handler",
        "Child process management"
      ],
      ans: 1,
      exp: "Reading /proc/self/status and checking TracerPid is a classic Linux anti-debug trick. Bypass it with a ptrace call before attaching, or patch the conditional jump to NOP out the check."
    },
    {
      q: "You see `JG +0x18` (jump if greater) in a disassembly. You want execution to always fall through. How do you patch it?",
      opts: [
        "Replace with JMP +0x18",
        "Replace the conditional jump bytes with 0x90 0x90 (NOP NOP) to neutralise it",
        "Change the comparison value",
        "Delete the instruction"
      ],
      ans: 1,
      exp: "NOP-patching (0x90) removes the jump entirely — execution falls through unconditionally. This is the standard technique for bypassing license checks, anti-debug branches, and trial expirations."
    },
    {
      q: "What does it mean when a function has no cross-references (XREFs) in Ghidra?",
      opts: [
        "It's never called — possibly dead code, or called indirectly via function pointer / self-modifying code",
        "It's the entry point",
        "Ghidra failed to analyse it",
        "It's a library function"
      ],
      ans: 0,
      exp: "Zero XREFs can indicate: dead code, code called via function pointer (common in malware dispatchers), dynamically resolved calls (dlopen/dlsym), or self-modifying code. Worth investigating manually."
    },
    {
      q: "Why do malware authors use rotating XOR (key = (0x37 + i) % 256) instead of single-byte XOR?",
      opts: [
        "It's faster",
        "It defeats simple frequency analysis — each position has a different key, making decoding harder without knowing the algorithm",
        "It's easier to implement",
        "To reduce binary size"
      ],
      ans: 1,
      exp: "Single-byte XOR produces a repeating cipher easily broken by frequency analysis. Rotating XOR changes the key per byte, increasing complexity. Our toy_app_packed.c uses this scheme — the key rotates as (0x37 + byte_index) mod 256."
    }
  ],
  mod14: [
    {
      q: "A `base64 -d | python3` pipe chain runs on a Linux box with no files created. How do you detect it?",
      opts: [
        "Check /tmp for files",
        "Use auditd: look for execve events where the command line contains 'base64' piped to an interpreter",
        "Run ps aux",
        "Check /proc filesystem"
      ],
      ans: 1,
      exp: "Fileless execution via pipes leaves no disk artefacts. auditd with `-a always,exit -F arch=b64 -S execve -k exec_events` captures the full command line including base64|python3 chains."
    },
    {
      q: "memfd_create() creates a file descriptor in memory. Why is this used by fileless malware?",
      opts: [
        "It's faster than writing to disk",
        "The 'file' has no path in the filesystem — it appears only in /proc/<pid>/fd/ — evading file-based YARA scans",
        "It requires fewer permissions",
        "It's a standard system call for all processes"
      ],
      ans: 1,
      exp: "memfd_create() gives an anonymous in-memory FD. The payload can be written to it and execve()'d from /proc/self/fd/<n> — never touching disk. No file path, no hash, no YARA match on file content."
    },
    {
      q: "You find `/etc/ld.so.preload` containing `/tmp/.libsocket.so`. What does this indicate?",
      opts: [
        "Standard system library configuration",
        "LD_PRELOAD hijacking — the malicious shared library is injected into every process at startup, enabling keylogging, rootkit functionality or persistence",
        "A broken library installation",
        "A virtualisation artefact"
      ],
      ans: 1,
      exp: "/etc/ld.so.preload forces every dynamically linked process to load the listed .so first. This is a root-level persistence mechanism that can intercept any library call, hide files, and survive reboots."
    }
  ],
  mod15: [
    {
      q: "A tshark beacon_detector output shows 127.0.0.1:4444 with avg interval 5.0s and jitter 2.1%. What does this mean?",
      opts: [
        "Normal background traffic",
        "Classic C2 beaconing — regular 5-second check-ins with very low jitter indicating automated, not human, traffic",
        "A DNS query pattern",
        "Port scan activity"
      ],
      ans: 1,
      exp: "Low jitter (<5%) with a fixed interval is the hallmark of automated C2 beaconing. Humans have high jitter; malware timers do not. Our toy_network_linux beacons every 5 seconds — exactly this pattern."
    },
    {
      q: "A DGA scorer gives xk3mdf92kqp.com a score of 5/7. What characteristics drove the score?",
      opts: [
        "The domain is long and uses common words",
        "High entropy, consonant-heavy, 8-20 chars, contains digits — all statistical features of algorithmically generated domains",
        "It ends in .com",
        "It has a high Alexa rank"
      ],
      ans: 1,
      exp: "DGA domains are statistically distinguishable: high Shannon entropy, unusual consonant ratios, mixed alphanumeric patterns, and absence of common English substrings. These features form the basis of ML-based DGA detection."
    },
    {
      q: "How does DNS tunnelling exfiltrate data over port 53?",
      opts: [
        "By sending large DNS packets",
        "By encoding data as subdomains of attacker-controlled domains — each lookup carries encoded payload that the authoritative nameserver decodes",
        "By modifying DNS responses",
        "By using DNSSEC"
      ],
      ans: 1,
      exp: "DNS tunnelling encodes data in subdomain labels: `c2VjcmV0.attacker.com`. The attacker controls the authoritative nameserver and decodes each query. Detected by: high query volume, long subdomain strings, non-existent TLD queries."
    }
  ],
  capstone: [
    {
      q: "Operation Silent Harbour Phase 1: you find a file named `document_viewer`. What is your first triage step?",
      opts: [
        "Execute it to see what it does",
        "Run `file document_viewer` and `sha256sum document_viewer` to identify the format and establish a hash before touching anything else",
        "Open it in a hex editor",
        "Upload it to VirusTotal immediately"
      ],
      ans: 1,
      exp: "Triage = identify before you act. file reveals it's an ELF. sha256sum creates the forensic hash. Uploading to VT before hashing or preserving chain of custody contaminates the investigation — and leaks the sample to the attacker."
    },
    {
      q: "The document_viewer binary has TracerPid check and XOR key 0x5E. What is the correct order of analysis?",
      opts: [
        "Dynamic first, then static",
        "Static first (strings, readelf, Ghidra disassembly to find XOR key and anti-debug), then dynamic in isolated VM with anti-debug patched",
        "Skip static, run in sandbox",
        "Memory forensics first"
      ],
      ans: 1,
      exp: "Static first reveals the XOR key (0x5E ≠ toy sample's 0x41 — must find from disassembly) and the TracerPid check. Patch the anti-debug before dynamic analysis. Working through phases prevents contaminating your evidence."
    },
    {
      q: "The PCAP shows beaconing to 127.0.0.1:4444 every 5 seconds with an XOR-encoded User-Agent. What ATT&CK technique is this?",
      opts: [
        "T1071.001 — Application Layer Protocol: Web Protocols",
        "T1571 — Non-Standard Port",
        "T1041 — Exfiltration Over C2 Channel",
        "T1132 — Data Encoding"
      ],
      ans: 0,
      exp: "Beaconing over HTTP (or custom TCP with HTTP-like structure) maps to T1071.001. The XOR encoding of headers is T1132 (Data Encoding). Both should appear in your ATT&CK mapping. Non-standard ports (4444) adds T1571."
    }
  ]
};

function initModuleQuiz(page) {
  const qData = QUIZ_DATA[page.id];
  if (!qData) return;

  const body = document.getElementById('contentBody');
  if (!body) return;

  setTimeout(() => {
    if (body.querySelector('.quiz-wrap')) return;
    body.insertAdjacentHTML('beforeend', buildQuizHTML(page.id, qData));
    attachQuizListeners(page.id, qData);
  }, 600);
}

function buildQuizHTML(id, qs) {
  return `
    <div class="quiz-wrap" id="quiz-${id}">
      <div class="quiz-header-bar">
        <div class="quiz-icon">🎯</div>
        <div class="quiz-header-text">
          <h2>Knowledge Check</h2>
          <p>Test your understanding before moving on. All questions are scenario-based.</p>
        </div>
      </div>
      <div class="quiz-stats-row">
        <div class="quiz-stat-item"><span class="quiz-stat-num">${qs.length}</span><span class="quiz-stat-lbl">Questions</span></div>
        <div class="quiz-stat-item"><span class="quiz-stat-num" id="qs-${id}">0/${qs.length}</span><span class="quiz-stat-lbl">Score</span></div>
      </div>
      <div class="quiz-body" id="qbody-${id}">
        ${qs.map((q, i) => `
          <div class="quiz-question" id="qq-${id}-${i}">
            <div class="q-header">
              <div class="q-num">${i + 1}</div>
              <div class="q-text">${q.q}</div>
            </div>
            <div class="q-options">
              ${q.opts.map((opt, j) => `
                <div class="q-option" id="qo-${id}-${i}-${j}">
                  <input type="radio" id="qr-${id}-${i}-${j}" name="qn-${id}-${i}" value="${j}">
                  <label for="qr-${id}-${i}-${j}">${opt}</label>
                </div>
              `).join('')}
            </div>
            <div class="q-feedback" id="qf-${id}-${i}">
              <div class="q-feedback-title"></div>
              <div>${q.exp}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="quiz-controls">
        <button class="btn btn-ghost" id="qreset-${id}">↺ Reset</button>
        <button class="btn btn-primary" id="qsubmit-${id}">Submit Answers</button>
      </div>
      <div class="quiz-results" id="qresults-${id}">
        <div class="results-score" id="qrscore-${id}">0%</div>
        <div class="results-msg" id="qrmsg-${id}"></div>
        <div class="results-breakdown">
          <div class="breakdown-item"><div class="breakdown-num c" id="qrcorrect-${id}">0</div><div class="breakdown-lbl">Correct</div></div>
          <div class="breakdown-item"><div class="breakdown-num w" id="qrwrong-${id}">0</div><div class="breakdown-lbl">Wrong</div></div>
        </div>
      </div>
    </div>
  `;
}

function attachQuizListeners(id, qs) {
  // Option selection
  qs.forEach((q, i) => {
    q.opts.forEach((_, j) => {
      const opt = document.getElementById(`qo-${id}-${i}-${j}`);
      const rad = document.getElementById(`qr-${id}-${i}-${j}`);
      if (!opt || !rad) return;
      const select = () => {
        document.querySelectorAll(`#qq-${id}-${i} .q-option`).forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        rad.checked = true;
      };
      opt.addEventListener('click', select);
    });
  });

  document.getElementById(`qsubmit-${id}`)?.addEventListener('click', () => submitQuiz(id, qs));
  document.getElementById(`qreset-${id}`)?.addEventListener('click',  () => resetQuiz(id, qs));
}

function submitQuiz(id, qs) {
  let correct = 0, answered = 0;

  qs.forEach((q, i) => {
    const sel = document.querySelector(`input[name="qn-${id}-${i}"]:checked`);
    if (!sel) return;
    answered++;
    const chosen = parseInt(sel.value);
    const ok = chosen === q.ans;
    if (ok) correct++;

    const qEl = document.getElementById(`qq-${id}-${i}`);
    const fb  = document.getElementById(`qf-${id}-${i}`);
    qEl.classList.add(ok ? 'correct' : 'wrong');

    q.opts.forEach((_, j) => {
      const opt = document.getElementById(`qo-${id}-${i}-${j}`);
      opt.classList.add('locked');
      opt.querySelector('input').disabled = true;
      if (j === q.ans) opt.classList.add('opt-correct');
      else if (j === chosen && !ok) opt.classList.add('opt-wrong');
    });

    fb.classList.add('show', ok ? 'correct' : 'wrong');
    fb.querySelector('.q-feedback-title').textContent = ok ? '✓ Correct' : '✗ Incorrect';
  });

  if (answered < qs.length) { showToast('Answer all questions first!', ''); return; }

  document.getElementById(`qs-${id}`).textContent = `${correct}/${qs.length}`;
  document.getElementById(`qsubmit-${id}`).disabled = true;

  const pct = Math.round(correct / qs.length * 100);
  const results = document.getElementById(`qresults-${id}`);
  document.getElementById(`qrscore-${id}`).textContent = `${pct}%`;
  document.getElementById(`qrcorrect-${id}`).textContent = correct;
  document.getElementById(`qrwrong-${id}`).textContent = qs.length - correct;
  document.getElementById(`qrmsg-${id}`).textContent =
    pct >= 90 ? '🎯 Outstanding. You nailed it.' :
    pct >= 70 ? '✅ Solid pass. Keep building.' :
    pct >= 50 ? '📚 Review the material and try again.' :
                '💡 Re-read the module carefully, then retry.';
  results.classList.add('show');
  results.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetQuiz(id, qs) {
  qs.forEach((q, i) => {
    const qEl = document.getElementById(`qq-${id}-${i}`);
    const fb  = document.getElementById(`qf-${id}-${i}`);
    qEl.classList.remove('correct', 'wrong');
    fb.classList.remove('show', 'correct', 'wrong');
    fb.querySelector('.q-feedback-title').textContent = '';
    q.opts.forEach((_, j) => {
      const opt = document.getElementById(`qo-${id}-${i}-${j}`);
      const rad = document.getElementById(`qr-${id}-${i}-${j}`);
      opt.className = 'q-option';
      rad.checked = false; rad.disabled = false;
    });
  });
  document.getElementById(`qs-${id}`).textContent = `0/${qs.length}`;
  document.getElementById(`qsubmit-${id}`).disabled = false;
  document.getElementById(`qresults-${id}`).classList.remove('show');
  document.getElementById(`quiz-${id}`).scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 't') {
    e.preventDefault();
    document.getElementById('themeToggle')?.click();
  }
  if (e.key === 'Escape') {
    document.getElementById('searchResults')?.classList.remove('open');
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarBackdrop')?.classList.remove('show');
  }
});
