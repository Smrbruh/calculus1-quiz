'use strict';
const MathUtils = (() => {
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function randNonZero(range = 5) {
    let v = 0;
    while (v === 0) v = randInt(-range, range);
    return v;
  }
  function randCoeff(range = 5) {
    return randInt(-range, range);
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function randPolynomial(degree = 3, range = 4) {
    const c = Array.from({ length: degree + 1 }, () => randCoeff(range));
    if (c[0] === 0) c[0] = randNonZero(range);
    return c;
  }
  function polyToString(coeffs, varName = 'x') {
    const degree = coeffs.length - 1;
    let parts = [];
    for (let i = 0; i < coeffs.length; i++) {
      const c = coeffs[i];
      if (c === 0) continue;
      const power = degree - i;
      let term = '';
      if (power === 0) term = `${Math.abs(c)}`;
      else if (power === 1) term = Math.abs(c) === 1 ? `${varName}` : `${Math.abs(c)}${varName}`;
      else term = Math.abs(c) === 1 ? `${varName}^{${power}}` : `${Math.abs(c)}${varName}^{${power}}`;
      if (parts.length === 0) parts.push(c < 0 ? `-${term}` : term);
      else parts.push(c < 0 ? ` - ${term}` : ` + ${term}`);
    }
    return parts.join('') || '0';
  }
  function polyToStringUnicode(coeffs, varName = 'x') {
    const degree = coeffs.length - 1;
    let parts = [];
    for (let i = 0; i < coeffs.length; i++) {
      const c = coeffs[i];
      if (c === 0) continue;
      const power = degree - i;
      let term = '';
      if (power === 0) term = `${Math.abs(c)}`;
      else if (power === 1) term = Math.abs(c) === 1 ? `${varName}` : `${Math.abs(c)}${varName}`;
      else term = Math.abs(c) === 1 ? `${varName}${toSup(power)}` : `${Math.abs(c)}${varName}${toSup(power)}`;
      if (parts.length === 0) parts.push(c < 0 ? `−${term}` : term);
      else parts.push(c < 0 ? ` − ${term}` : ` + ${term}`);
    }
    return parts.join('') || '0';
  }
  function toSup(n) {
    const map = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
    return String(n).split('').map(d => map[d] || d).join('');
  }
  function evalPoly(coeffs, x) {
    const degree = coeffs.length - 1;
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) result += coeffs[i] * Math.pow(x, degree - i);
    return result;
  }
  function polyDerivative(coeffs) {
    const degree = coeffs.length - 1;
    if (degree === 0) return [0];
    return coeffs.slice(0, -1).map((c, i) => c * (degree - i));
  }
  function polyIntegral(coeffs) {
    const degree = coeffs.length - 1;
    const result = coeffs.map((c, i) => c / (degree - i + 1));
    return [...result, 0];
  }
  function frac(num, den = 1) {
    if (den === 0) return '∞';
    if (num === 0) return '0';
    const g = gcd(Math.abs(num), Math.abs(den));
    const n = num / g, d = den / g;
    if (d < 0) return d === -1 ? (n === 1 ? '-1' : `-${n}`) : `${-n}/${-d}`;
    if (d === 1) return `${n}`;
    return `${n}/${d}`;
  }
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  function fmt(v) {
    if (Number.isInteger(v)) return `${v}`;
    const r = Math.round(v * 1000) / 1000;
    return `${r}`;
  }
  function fmtFrac(v) {
    if (Number.isInteger(v)) return `${v}`;
    for (let d = 2; d <= 12; d++) {
      if (Math.abs(v * d - Math.round(v * d)) < 1e-9) {
        return frac(Math.round(v * d), d);
      }
    }
    return fmt(v);
  }
  function compose(f, g) {
    return x => f(g(x));
  }
  return {
    randInt, randNonZero, randCoeff, pick, shuffle,
    randPolynomial, polyToString, polyToStringUnicode, evalPoly, polyDerivative, polyIntegral,
    frac, gcd, fmt, fmtFrac, compose, toSup
  };
})();
const StorageManager = (() => {
  const PREFIX = 'calcgen_';
  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {}
  }
  function get(key, fallback = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) {}
  }
  function clear() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }
  return { set, get, remove, clear };
})();
const StatsManager = (() => {
  let stats = {
    generated: 0, solved: 0, viewed: 0, streak: 0,
    byTopic: {}, byDifficulty: { easy: 0, intermediate: 0, hard: 0 },
    currentTopic: '—', currentDifficulty: 'Intermediate', currentWeek: '', lastGenerated: null
  };
  function load() {
    const saved = StorageManager.get('stats', null);
    if (saved) stats = { ...stats, ...saved };
  }
  function save() { StorageManager.set('stats', stats); }
  function setTopic(topicName, week, difficulty) {
    stats.currentTopic = topicName;
    stats.currentWeek = week ? `Week ${week}` : '';
    stats.currentDifficulty = difficulty || 'Intermediate';
    if (!stats.byTopic[topicName]) stats.byTopic[topicName] = 0;
    stats.byTopic[topicName]++;
    const d = difficulty || 'intermediate';
    if (stats.byDifficulty[d] !== undefined) stats.byDifficulty[d]++;
    save(); updateUI();
  }
  function incrementGenerated(topicName, week, difficulty) {
    stats.generated++;
    stats.lastGenerated = Date.now();
    setTopic(topicName, week, difficulty);
    save(); updateUI();
  }
  function incrementSolved() { stats.solved++; stats.streak++; save(); updateUI(); }
  function incrementViewed() { stats.viewed++; save(); updateUI(); }
  function getAccuracy() {
    if (stats.generated === 0) return null;
    return Math.round((stats.solved / stats.generated) * 100);
  }
  function updateUI() {
    const els = {
      'stat-generated': stats.generated,
      'stat-solved': stats.solved,
      'stat-viewed': stats.viewed,
      'stat-topic': stats.currentTopic,
      'stat-topic-week': stats.currentWeek,
      'stat-difficulty': capitalize(stats.currentDifficulty),
      'header-stat-generated': stats.generated,
      'header-stat-solved': stats.solved,
      'header-stat-streak': stats.streak
    };
    for (const [id, val] of Object.entries(els)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }
    const acc = getAccuracy();
    const accEl = document.getElementById('stat-accuracy');
    if (accEl) accEl.textContent = acc !== null ? `${acc}%` : '—';
    const ring = document.getElementById('accuracy-ring');
    if (ring && acc !== null) {
      const circumference = 94.25;
      ring.style.strokeDashoffset = circumference - (acc / 100) * circumference;
    }
    const bar = document.getElementById('difficulty-bar-fill');
    if (bar) {
      const map = { easy: 25, intermediate: 55, hard: 90, advanced: 90 };
      bar.style.width = `${map[stats.currentDifficulty.toLowerCase()] || 55}%`;
    }
  }
  function reset() {
    stats = {
      generated: 0, solved: 0, viewed: 0, streak: 0,
      byTopic: {}, byDifficulty: { easy: 0, intermediate: 0, hard: 0 },
      currentTopic: '—', currentDifficulty: 'Intermediate', currentWeek: '', lastGenerated: null
    };
    save(); updateUI();
  }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  return { load, save, setTopic, incrementGenerated, incrementSolved, incrementViewed, getAccuracy, updateUI, reset, get: () => stats };
})();
const ThemeManager = (() => {
  let current = 'dark';
  function init() {
    current = StorageManager.get('theme', 'dark');
    apply(current);
  }
  function apply(theme) {
    const body = document.getElementById('page-body');
    if (!body) return;
    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(`theme-${theme}`);
    if (theme === 'light') body.setAttribute('data-theme', 'light');
    else body.removeAttribute('data-theme');
  }
  function toggle() {
    current = current === 'dark' ? 'light' : 'dark';
    apply(current);
    StorageManager.set('theme', current);
    ToastManager.show(`${current === 'dark' ? '☾ Dark' : '☀ Light'} mode activated`, 'info', 1600);
  }
  function get() { return current; }
  return { init, toggle, get };
})();
const ToastManager = (() => {
  function show(message, type = 'info', duration = 3000) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span style="font-size:1.1rem;line-height:1;">${icons[type] || 'ℹ'}</span><span style="font-size:var(--text-sm);color:var(--text-secondary);flex:1;">${message}</span>`;
    region.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.2s reverse forwards';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
  return { show };
})();
const MathRenderer = (() => {
  function render(container) {
    if (!container) return;
    if (window.MathJax) {
      try { MathJax.typesetPromise([container]).catch(() => {}); } catch (e) {}
    }
  }
  function renderAll() {
    if (window.MathJax) {
      try { MathJax.typesetPromise().catch(() => {}); } catch (e) {}
    }
  }
  function setDisplay(el, latex) {
    if (!el) return;
    el.innerHTML = `\\[${latex}\\]`;
    render(el);
  }
  function setInline(el, latex) {
    if (!el) return;
    el.innerHTML = `\\(${latex}\\)`;
    render(el);
  }
  function setHTML(el, html) {
    if (!el) return;
    el.innerHTML = html;
    render(el);
  }
  return { render, renderAll, setDisplay, setInline, setHTML };
})();
const Generators = (() => {
  const { randInt, randNonZero, randCoeff, pick, shuffle,
    randPolynomial, polyToString, polyToStringUnicode, evalPoly, polyDerivative, polyIntegral,
    fmt, fmtFrac, frac, gcd } = MathUtils;
  const TOPIC_META = {
    'sets-intervals': { name: 'Sets & Intervals', week: 1, section: '§1.1', desc: 'Set operations, interval notation, absolute value.', concepts: ['Union, intersection, difference', 'Open/closed intervals', 'Absolute value properties', 'Set-builder notation'] },
    'functions-graphs': { name: 'Functions & Graphs', week: 1, section: '§1.2', desc: 'Domain, range, even/odd, piecewise functions.', concepts: ['Domain and range', 'Vertical line test', 'Even/odd functions', 'Piecewise definitions'] },
    'shifts-scaling': { name: 'Shifts & Scaling', week: 1, section: '§1.3', desc: 'Graph transformations: shifts, reflections, scaling.', concepts: ['Vertical shifts f(x)+c', 'Horizontal shifts f(x−c)', 'Reflections', 'Scaling by a factor'] },
    'inverse-functions': { name: 'Inverse Functions', week: 1, section: '§1.5', desc: 'One-to-one functions and their inverses.', concepts: ['Horizontal line test', 'f⁻¹(f(x)) = x', 'Reflection across y = x', 'Domain/range swap'] },
    'composition-functions': { name: 'Composition', week: 1, section: '§1.3', desc: 'Compose functions and find domains of composites.', concepts: ['(f∘g)(x) = f(g(x))', 'Domain restrictions', 'Non-commutativity', 'Decomposition'] },
    'trigonometric-functions': { name: 'Trigonometric Functions', week: 1, section: 'Appendix D', desc: 'Trig identities, inverse trig, graphs.', concepts: ['sin²+cos²=1', 'Double-angle formulas', 'Inverse trig domains', 'Periodicity and amplitude'] },
    'sequences': { name: 'Sequences', week: 2, section: '§11.1', desc: 'Sequence convergence, limit laws, monotone sequences.', concepts: ['Convergence definition', 'Limit laws', 'Monotone Convergence', 'Boundedness'] },
    'sequence-limits': { name: 'Limits of Sequences', week: 2, section: '§11.1', desc: 'Compute limits of sequences including rational forms.', concepts: ['Limit of n-th term', 'Rational sequence limits', 'Squeeze theorem', 'Divergence to ∞'] },
    'monotone-sequences': { name: 'Monotone Sequences', week: 2, section: '§11.1', desc: 'Increasing/decreasing sequences and boundedness.', concepts: ['Increasing aₙ₊₁ ≥ aₙ', 'Bounded above/below', 'Monotone Convergence Theorem', 'Supremum limit'] },
    'sandwich-theorem': { name: 'Sandwich Theorem', week: 2, section: '§2.3', desc: 'Bound a function between two known limits.', concepts: ['f ≤ g ≤ h', 'Equal outer limits', 'Typical uses: sin x / x', 'Squeeze for sequences'] },
    'one-sided-limits': { name: 'One-Sided Limits', week: 3, section: '§2.2', desc: 'Left-hand and right-hand limits.', concepts: ['lim x→a⁻', 'lim x→a⁺', 'Existence of two-sided limit', 'Piecewise functions'] },
    'continuity': { name: 'Continuity', week: 3, section: '§2.5', desc: 'Continuity at a point and on intervals.', concepts: ['f(a) defined', 'limit exists', 'limit = f(a)', 'Continuity on intervals'] },
    'discontinuities': { name: 'Discontinuities', week: 3, section: '§2.5', desc: 'Classify removable, jump, infinite, oscillating.', concepts: ['Removable (hole)', 'Jump (one-sided differ)', 'Infinite (vertical asymptote)', 'Oscillating'] },
    'limits-infinity': { name: 'Limits at Infinity', week: 3, section: '§2.6', desc: 'End behavior, horizontal asymptotes.', concepts: ['lim x→∞ f(x) = L', 'Horizontal asymptote', 'Rational function end behavior', 'Growth comparison'] },
    'growth-rates': { name: 'Relative Growth Rates', week: 3, section: '§2.6', desc: 'Compare growth of functions as x → ∞.', concepts: ['ln x ≪ x^p ≪ b^x', 'Asymptotic equivalence', 'Big-O notation', 'Dominant term'] },
    'definition-derivative': { name: 'Definition of Derivative', week: 4, section: '§2.7', desc: 'Compute derivatives from the limit definition.', concepts: ['f\'(a) = lim (f(a+h)−f(a))/h', 'Difference quotient', 'Tangent line slope', 'Differentiability → continuity'] },
    'differentiation-rules': { name: 'Differentiation Rules', week: 4, section: '§3.1–3.2', desc: 'Power, product, quotient, chain rules.', concepts: ['Power rule', 'Product rule (fg)\' = f\'g + fg\'', 'Quotient rule', 'Chain rule'] },
    'chain-rule': { name: 'Chain Rule', week: 4, section: '§3.4', desc: 'Differentiate compositions of functions.', concepts: ['dy/dx = dy/du · du/dx', 'Inner and outer functions', 'Repeated chain rule', 'Composite of 3+ functions'] },
    'implicit-diff': { name: 'Implicit Differentiation', week: 4, section: '§3.5', desc: 'Differentiate equations defining y implicitly.', concepts: ['Differentiate both sides', 'Chain rule for y terms', 'Solve for dy/dx', 'Tangent lines to implicit curves'] },
    'parametric-derivatives': { name: 'Parametric Derivatives', week: 4, section: '§10.2', desc: 'Derivatives of parametric curves.', concepts: ['x = f(t), y = g(t)', 'dy/dx = (dy/dt)/(dx/dt)', 'Second derivative formula', 'Tangent slopes'] },
    'tangents-normals': { name: 'Tangents & Normals', week: 4, section: '§3.1', desc: 'Equations of tangent and normal lines.', concepts: ['Tangent: y−f(a) = f\'(a)(x−a)', 'Normal slope: −1/f\'(a)', 'Perpendicular lines', 'Horizontal tangents'] },
    'maxima-minima': { name: 'Maxima & Minima', week: 5, section: '§4.1, §4.3', desc: 'Find local and absolute extrema.', concepts: ['Critical numbers', 'First derivative test', 'Second derivative test', 'Closed interval method'] },
    'mean-value-theorem': { name: 'Mean Value Theorem', week: 5, section: '§4.2', desc: 'MVT and Rolle\'s Theorem.', concepts: ['f\'(c) = (f(b)−f(a))/(b−a)', 'Rolle: f(a)=f(b) → f\'(c)=0', 'Consequences for monotonicity', 'Applications'] },
    'graphing-derivatives': { name: 'Graphing with Derivatives', week: 5, section: '§4.3, §4.5', desc: 'Use f\' and f\'\' to sketch graphs.', concepts: ['Increasing/decreasing', 'Concavity', 'Inflection points', 'Asymptotes'] },
    'related-rates': { name: 'Related Rates', week: 5, section: '§3.9', desc: 'Rates of change of related quantities.', concepts: ['Set up equation', 'Differentiate w.r.t. t', 'Substitute known rates', 'Common: balloon, ladder'] },
    'optimization': { name: 'Optimization', week: 5, section: '§4.7', desc: 'Maximize or minimize a quantity subject to constraints.', concepts: ['Objective function', 'Constraint equation', 'Critical points', 'Verify min vs max'] },
    'lhopitals-rule': { name: "L'Hôpital's Rule", week: 5, section: '§4.4', desc: 'Evaluate indeterminate limits via derivatives.', concepts: ['0/0 and ∞/∞ forms', 'lim f/g = lim f\'/g\'', 'Transform other forms', 'Repeated application'] },
    'antiderivatives': { name: 'Antiderivatives', week: 6, section: '§4.9', desc: 'Find general antiderivatives.', concepts: ['F\'(x) = f(x)', 'General form F(x)+C', 'Power rule for integrals', 'Initial value problems'] },
    'indefinite-integrals': { name: 'Indefinite Integrals', week: 6, section: '§5.4', desc: 'Notation and linearity of integrals.', concepts: ['∫f(x)dx = F(x)+C', 'Linearity', 'Constant multiple', 'Sum rule'] },
    'basic-integration-formulas': { name: 'Basic Integration Formulas', week: 6, section: '§5.4', desc: 'Table of standard integrals.', concepts: ['∫xⁿ dx', '∫1/x dx = ln|x|+C', '∫eˣ, ∫sin, ∫cos', 'Inverse trig integrals'] },
    'substitution': { name: 'Substitution (u-sub)', week: 6, section: '§5.5', desc: 'Change of variables for integration.', concepts: ['u = g(x), du = g\'(x)dx', 'Reverse chain rule', 'Definite integral limits change', 'Trig substitution'] },
    'integration-by-parts': { name: 'Integration by Parts', week: 7, section: '§7.1', desc: 'Integrate products via parts formula.', concepts: ['∫u dv = uv − ∫v du', 'LIATE choice for u', 'Repeated by parts', 'Cyclic integrals'] },
    'trig-integrals': { name: 'Trigonometric Integrals', week: 7, section: '§7.2', desc: 'Integrals of powers and products of trig functions.', concepts: ['Odd power substitution', 'Half-angle for even', 'Reduction formulas', 'Product-to-sum'] },
    'partial-fractions': { name: 'Partial Fractions', week: 7, section: '§7.4', desc: 'Integrate rational functions via decomposition.', concepts: ['Distinct linear factors', 'Repeated linear factors', 'Irreducible quadratic', 'Improper fractions'] },
    'riemann-sums': { name: 'Riemann Sums', week: 8, section: '§5.1, §5.2', desc: 'Approximate and define definite integrals.', concepts: ['Left/right/midpoint sums', 'Sigma notation', 'Limit definition', 'Area estimation'] },
    'definite-integrals': { name: 'Definite Integrals', week: 8, section: '§5.2', desc: 'Properties and evaluation via FTC.', concepts: ['∫ₐᵇ f(x)dx', 'Net signed area', 'Properties', 'FTC Part 2'] },
    'fundamental-theorem': { name: 'Fundamental Theorem', week: 8, section: '§5.3', desc: 'FTC Parts 1 and 2.', concepts: ['F(x)=∫ₐˣ f(t)dt → F\'=f', '∫ₐᵇ f = F(b)−F(a)', 'Derivative of integral', 'Chain rule with FTC'] },
    'improper-integrals': { name: 'Improper Integrals', week: 8, section: '§7.8', desc: 'Infinite intervals and discontinuities.', concepts: ['Type I (∞ interval)', 'Type II (discontinuity)', 'p-integral test', 'Comparison test'] },
    'area-between-curves': { name: 'Area Between Curves', week: 9, section: '§6.1', desc: 'Compute areas between curves.', concepts: ['∫(top − bottom)dx', 'Integrate in y', 'Split at intersections', 'Sign considerations'] },
    'volumes': { name: 'Volumes of Solids', week: 9, section: '§6.2, §6.3', desc: 'Disk, washer, shell methods.', concepts: ['Disk: π∫f²dx', 'Washer: π∫(f²−g²)dx', 'Shells: 2π∫x·f dx', 'Slice method'] },
    'arc-length': { name: 'Arc Length', week: 9, section: '§8.1', desc: 'Length of a curve.', concepts: ['L = ∫√(1+f\'²)dx', 'Parametric arc length', 'Arc length function', 'Smooth curve requirement'] },
    'surface-area': { name: 'Surface Area', week: 9, section: '§8.2', desc: 'Surface area of revolution.', concepts: ['S = ∫2πy·ds', 'About x or y-axis', 'Parametric form', 'Frustum approximation'] },
    'complex-numbers': { name: 'Complex Numbers', week: 10, section: 'Appendix H', desc: 'Arithmetic, modulus, conjugate.', concepts: ['z = a + bi, i² = −1', 'Addition, multiplication', 'Conjugate and modulus', 'Division via conjugate'] },
    'polar-coordinates': { name: 'Polar Coordinates', week: 10, section: '§10.3', desc: 'Convert between Cartesian and polar.', concepts: ['x = r cos θ, y = r sin θ', 'r² = x² + y²', 'Non-uniqueness', 'Polar graphs'] },
    'polar-graphing': { name: 'Graphing Polar Equations', week: 10, section: '§10.3', desc: 'Sketch polar curves.', concepts: ['Circles, cardioids, roses', 'Lemniscates', 'Symmetry tests', 'Polar grid'] },
    'polar-integration': { name: 'Integration in Polar', week: 10, section: '§10.4', desc: 'Area in polar coordinates.', concepts: ['A = ∫(1/2)r² dθ', 'Between curves', 'Finding intersection angles', 'Symmetry shortcuts'] },
    'polar-arc-length': { name: 'Polar Arc Length', week: 10, section: '§10.4', desc: 'Arc length and surface area in polar.', concepts: ['L = ∫√(r²+(dr/dθ)²)dθ', 'Surface area formula', 'Spiral lengths', 'Cardioid perimeter'] },
    'final-review-mixed': { name: 'Comprehensive Mixed Review', week: 10, section: '§1–10', desc: 'Mixed problems from all 10 weeks simulating the final exam.', concepts: ['All major topics', 'Exam-style questions', 'Full course integration', 'Timed practice'] }
  };
  function makeProblem({ topic, week, difficulty, instruction, parts, solution, theorems, mistakes, related }) {
    return { topic, week, difficulty, instruction, parts, solution, theorems, mistakes: mistakes || [], related: related || [] };
  }
  function genSetsIntervals(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(-6, -1);
    const b = randInt(1, 6);
    const type = pick(['union', 'intersection', 'difference', 'absolute']);
    if (type === 'absolute') {
      const c = randInt(1, 5);
      const k = randInt(2, 8);
      return makeProblem({
        topic: 'Sets & Intervals', week: 1, difficulty,
        instruction: `Solve the absolute value inequality and express the solution in interval notation.`,
        parts: [
          { letter: 'a', points: 3, content: `Solve $|${c}x ${k >= 0 ? '+' : '−'} ${Math.abs(k)}| < ${randInt(3, 12)}$ and write the solution set in interval notation.` },
          { letter: 'b', points: 3, content: `Graph the solution on a number line and identify the boundary points.` },
          { letter: 'c', points: 2, content: `Verify by testing a point inside and outside the solution set.` }
        ],
        solution: {
          answer: `Rewrite as a compound inequality: $-M < ${c}x + ${k} < M$, solve for $x$, giving an open interval.`,
          steps: [
            { title: 'Rewrite Absolute Value', math: `\\[|${c}x ${k>=0?'+':'−'} ${Math.abs(k)}| < M \\iff -M < ${c}x ${k>=0?'+':'−'} ${Math.abs(k)} < M\\]` },
            { title: 'Isolate x', math: `\\[\\frac{-M ${k>=0?'−':'+'} ${Math.abs(k)}}{${c}} < x < \\frac{M ${k>=0?'−':'+'} ${Math.abs(k)}}{${c}}\\]` },
            { title: 'Interval Notation', math: `\\[x \\in \\left(\\frac{-M-${k}}{${c}},\\ \\frac{M-${k}}{${c}}\\right)\\]` }
          ]
        },
        theorems: ['Absolute value inequality rules', 'Interval notation conventions'],
        mistakes: ['Forgetting to flip inequality when dividing by negative', 'Using closed brackets instead of open for strict inequality'],
        related: ['functions-graphs']
      });
    }
    return makeProblem({
      topic: 'Sets & Intervals', week: 1, difficulty,
      instruction: `Given sets $A = [${a}, ${b}]$ and $B = (${a + 2}, ${b + 3})$, perform the requested set operation and express the result in interval notation.`,
      parts: [
        { letter: 'a', points: 2, content: `Find $A \\cup B$.` },
        { letter: 'b', points: 2, content: `Find $A \\cap B$.` },
        { letter: 'c', points: 3, content: `Find $A \\setminus B$ (elements in $A$ but not $B$).` }
      ],
      solution: {
        answer: `Union: $[${a}, ${b+3})$; Intersection: $(${a+2}, ${b}]$; Difference: $[${a}, ${a+2}]$.`,
        steps: [
          { title: 'Identify Endpoints', explanation: `A = [${a}, ${b}], B = (${a+2}, ${b+3})` },
          { title: 'Union', math: `\\[A \\cup B = [${a}, ${b+3})\\]` },
          { title: 'Intersection', math: `\\[A \\cap B = (${a+2}, ${b}]\\]` },
          { title: 'Difference', math: `\\[A \\setminus B = [${a}, ${a+2}]\\]` }
        ]
      },
      theorems: ['Set operations definitions', 'Interval notation', 'De Morgan\'s Laws for sets'],
      mistakes: ['Including endpoints incorrectly for open intervals', 'Confusing union with intersection'],
      related: ['functions-graphs']
    });
  }
  function genFunctionsGraphs(difficulty) {
    const d = difficulty || 'intermediate';
    const type = pick(['domain', 'evenodd', 'piecewise']);
    if (type === 'domain') {
      const a = randInt(1, 5);
      return makeProblem({
        topic: 'Functions & Graphs', week: 1, difficulty,
        instruction: `Find the domain of the given function. Express your answer in interval notation.`,
        parts: [
          { letter: 'a', points: 3, content: `Find the domain of $f(x) = \\dfrac{\\sqrt{x + ${a}}}{x - ${a + 2}}$.` },
          { letter: 'b', points: 3, content: `Find the domain of $g(x) = \\ln(${a} - x) + \\sqrt{x + ${a}}$.` },
          { letter: 'c', points: 2, content: `State the range of $h(x) = \\sqrt{x - ${a}}$.` }
        ],
        solution: {
          answer: `f: $[-${a}, ${a+2}) \\cup (${a+2}, \\infty)$. g: $[-${a}, ${a})$. h: $[0, \\infty)$.`,
          steps: [
            { title: 'Radicand Constraint', explanation: 'The expression under the square root must be ≥ 0.' },
            { title: 'Denominator Constraint', explanation: 'Denominator must be ≠ 0.' },
            { title: 'Log Argument Constraint', explanation: 'The argument of ln must be > 0.' },
            { title: 'Combine Intervals', math: `\\[\\text{Domain} = [-${a}, ${a+2}) \\cup (${a+2}, \\infty)\\]` }
          ]
        },
        theorems: ['Domain rules: sqrt, log, denominator', 'Interval notation'],
        mistakes: ['Including value that makes denominator zero', 'Using closed brackets for log domain'],
        related: ['shifts-scaling', 'inverse-functions']
      });
    }
    if (type === 'evenodd') {
      const coeffs = randPolynomial(3, 3);
      return makeProblem({
        topic: 'Functions & Graphs', week: 1, difficulty,
        instruction: `Determine whether the given function is even, odd, or neither. Justify algebraically.`,
        parts: [
          { letter: 'a', points: 4, content: `Let $f(x) = ${polyToStringUnicode(coeffs)}$. Compute $f(-x)$ and compare with $f(x)$ and $-f(x)$.` },
          { letter: 'b', points: 2, content: `State whether $f$ is even, odd, or neither.` },
          { letter: 'c', points: 2, content: `Describe the symmetry of the graph.` }
        ],
        solution: {
          answer: `Substitute −x into f and compare to original.`,
          steps: [
            { title: 'Compute f(−x)', math: `\\[f(-x) = ${polyToStringUnicode(coeffs)}\\]` },
            { title: 'Compare', explanation: 'If f(−x) = f(x) → even. If f(−x) = −f(x) → odd. Otherwise neither.' }
          ]
        },
        theorems: ['Even/odd definitions', 'Symmetry about y-axis or origin'],
        mistakes: ['Only checking numerically instead of algebraically', 'Forgetting constant term'],
        related: ['shifts-scaling']
      });
    }
    return makeProblem({
      topic: 'Functions & Graphs', week: 1, difficulty,
      instruction: `Sketch the piecewise function and find its domain, range, and any discontinuities.`,
      parts: [
        { letter: 'a', points: 4, content: `Let $f(x) = \\begin{cases} x + 2 & x < 0 \\\\ x^2 & 0 \\leq x \\leq 2 \\\\ 4 & x > 2 \\end{cases}$. Evaluate $f(-1)$, $f(0)$, $f(1)$, $f(3)$.` },
        { letter: 'b', points: 3, content: `Sketch the graph on the interval $[-3, 4]$.` },
        { letter: 'c', points: 3, content: `State the domain and range, and identify any discontinuities.` }
      ],
      solution: {
        answer: `f(−1)=1, f(0)=0, f(1)=1, f(3)=4. Domain: ℝ, Range: [0, ∞).`,
        steps: [
          { title: 'Evaluate Each Branch', explanation: 'Choose the correct formula based on x value.' },
          { title: 'Sketch', explanation: 'Line for x<0, parabola for 0≤x≤2, horizontal line at 4.' },
          { title: 'Domain/Range', math: `\\[D = \\mathbb{R}, \\quad R = [0, \\infty)\\]` }
        ]
      },
      theorems: ['Piecewise function definition', 'Continuity at branch boundaries'],
      mistakes: ['Using wrong branch', 'Including/excluding endpoints incorrectly'],
      related: ['continuity', 'one-sided-limits']
    });
  }
  function genShiftsScaling(difficulty) {
    const d = difficulty || 'intermediate';
    const baseFn = pick(['x^2', '\\sqrt{x}', '|x|', '\\sin x']);
    const a = randNonZero(4);
    const h = randNonZero(5);
    const k = randNonZero(5);
    return makeProblem({
      topic: 'Shifts & Scaling', week: 1, difficulty,
      instruction: `Describe the transformations applied to the base function $y = ${baseFn}$ to obtain the given function. Then sketch the graph.`,
      parts: [
        { letter: 'a', points: 3, content: `Base: $y = ${baseFn}$, transformed: $y = ${a}(f(x ${h >= 0 ? '−' : '+'} ${Math.abs(h)})) ${k >= 0 ? '+' : '−'} ${Math.abs(k)}$. Describe each transformation in order.` },
        { letter: 'b', points: 3, content: `Sketch both the base function and the transformed function on the same axes.` },
        { letter: 'c', points: 2, content: `State the new domain and range.` }
      ],
      solution: {
        answer: `Horizontal shift by ${h}, vertical scaling by ${a}, vertical shift by ${k}.`,
        steps: [
          { title: 'Horizontal Shift', explanation: `Shift the graph ${h>0?'right':'left'} by ${Math.abs(h)} units.` },
          { title: 'Vertical Scaling', explanation: `Stretch/compress vertically by factor ${Math.abs(a)}${a<0?', and reflect across the x-axis':''}.` },
          { title: 'Vertical Shift', explanation: `Shift ${k>0?'up':'down'} by ${Math.abs(k)} units.` }
        ]
      },
      theorems: ['Order of transformations', 'Domain/range under transformations'],
      mistakes: ['Applying transformations in wrong order', 'Confusing sign of horizontal shift'],
      related: ['functions-graphs']
    });
  }
  function genInverseFunctions(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randNonZero(4);
    const b = randNonZero(6);
    const type = pick(['linear', 'rational', 'quadratic']);
    if (type === 'linear') {
      return makeProblem({
        topic: 'Inverse Functions', week: 1, difficulty,
        instruction: `Find the inverse of the given one-to-one function and verify your answer.`,
        parts: [
          { letter: 'a', points: 4, content: `Find $f^{-1}(x)$ for $f(x) = ${a}x ${b>=0?'+':'−'} ${Math.abs(b)}$.` },
          { letter: 'b', points: 3, content: `Verify that $f(f^{-1}(x)) = x$ and $f^{-1}(f(x)) = x$.` },
          { letter: 'c', points: 3, content: `State the domain and range of both $f$ and $f^{-1}$.` }
        ],
        solution: {
          answer: `$f^{-1}(x) = \\dfrac{x ${b>=0?'−':'+'} ${Math.abs(b)}}{${a}}$`,
          steps: [
            { title: 'Set y = f(x)', math: `\\[y = ${a}x ${b>=0?'+':'−'} ${Math.abs(b)}\\]` },
            { title: 'Solve for x', math: `\\[x = \\frac{y ${b>=0?'−':'+'} ${Math.abs(b)}}{${a}}\\]` },
            { title: 'Swap x and y', math: `\\[f^{-1}(x) = \\frac{x ${b>=0?'−':'+'} ${Math.abs(b)}}{${a}}\\]` },
            { title: 'Verify', math: `\\[f(f^{-1}(x)) = ${a} \\cdot \\frac{x ${b>=0?'−':'+'} ${Math.abs(b)}}{${a}} ${b>=0?'+':'−'} ${Math.abs(b)} = x \\checkmark\\]` }
          ]
        },
        theorems: ['Inverse function definition', 'f⁻¹(f(x)) = x', 'Graph reflected across y = x'],
        mistakes: ['Forgetting to swap x and y', 'Algebraic errors when solving'],
        related: ['functions-graphs', 'composition-functions']
      });
    }
    return makeProblem({
      topic: 'Inverse Functions', week: 1, difficulty,
      instruction: `For the given one-to-one function on the specified domain, find the inverse and state its domain.`,
      parts: [
        { letter: 'a', points: 4, content: `Find $f^{-1}(x)$ for $f(x) = \\sqrt{x ${b>=0?'+':'−'} ${Math.abs(b)}}$ with domain $x \\geq ${b>=0?'-' + Math.abs(b):Math.abs(b)}$.` },
        { letter: 'b', points: 3, content: `State the domain and range of $f^{-1}$.` },
        { letter: 'c', points: 3, content: `Sketch both $f$ and $f^{-1}$ and show they are reflections across $y = x$.` }
      ],
      solution: {
        answer: `$f^{-1}(x) = x^2 ${b>=0?'−':'+'} ${Math.abs(b)}$ for $x \\geq 0$.`,
        steps: [
          { title: 'Set y = f(x)', math: `\\[y = \\sqrt{x ${b>=0?'+':'−'} ${Math.abs(b)}}\\]` },
          { title: 'Solve for x', math: `\\[y^2 = x ${b>=0?'+':'−'} ${Math.abs(b)} \\implies x = y^2 ${b>=0?'−':'+'} ${Math.abs(b)}\\]` },
          { title: 'Swap and State Domain', math: `\\[f^{-1}(x) = x^2 ${b>=0?'−':'+'} ${Math.abs(b)}, \\quad x \\geq 0\\]` }
        ]
      },
      theorems: ['Inverse of sqrt function', 'Domain/range swap'],
      mistakes: ['Forgetting to restrict domain', 'Not stating range of original'],
      related: ['functions-graphs']
    });
  }
  function genComposition(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randNonZero(4);
    const b = randNonZero(5);
    const c = randNonZero(4);
    return makeProblem({
      topic: 'Composition', week: 1, difficulty,
      instruction: `Given $f(x)$ and $g(x)$, find the composite functions and state their domains.`,
      parts: [
        { letter: 'a', points: 3, content: `Let $f(x) = ${a}x ${b>=0?'+':'−'} ${Math.abs(b)}$ and $g(x) = x^2 ${c>=0?'+':'−'} ${Math.abs(c)}$. Find $(f \\circ g)(x)$.` },
        { letter: 'b', points: 3, content: `Find $(g \\circ f)(x)$. Is $(f \\circ g)(x) = (g \\circ f)(x)$?` },
        { letter: 'c', points: 3, content: `Find $(f \\circ f)(x)$ and $(g \\circ g)(x)$.` },
        { letter: 'd', points: 1, content: `State the domain of each composite function.` }
      ],
      solution: {
        answer: `(f∘g)(x) = ${a}(x² ${c>=0?'+':'−'} ${Math.abs(c)}) ${b>=0?'+':'−'} ${Math.abs(b)}. (g∘f)(x) = (${a}x ${b>=0?'+':'−'} ${Math.abs(b)})² ${c>=0?'+':'−'} ${Math.abs(c)}.`,
        steps: [
          { title: 'Compute f∘g', math: `\\[(f \\circ g)(x) = f(g(x)) = ${a}(x^2 ${c>=0?'+':'−'} ${Math.abs(c)}) ${b>=0?'+':'−'} ${Math.abs(b)}\\]` },
          { title: 'Compute g∘f', math: `\\[(g \\circ f)(x) = g(f(x)) = (${a}x ${b>=0?'+':'−'} ${Math.abs(b)})^2 ${c>=0?'+':'−'} ${Math.abs(c)}\\]` },
          { title: 'Compare', explanation: 'In general f∘g ≠ g∘f — composition is not commutative.' }
        ]
      },
      theorems: ['Composition definition', 'Domain of composite = x in dom(g) with g(x) in dom(f)'],
      mistakes: ['Assuming f∘g = g∘f', 'Forgetting domain restrictions'],
      related: ['inverse-functions']
    });
  }
  function genTrigFunctions(difficulty) {
    const d = difficulty || 'intermediate';
    const type = pick(['identity', 'inverse', 'equation']);
    if (type === 'identity') {
      return makeProblem({
        topic: 'Trigonometric Functions', week: 1, difficulty,
        instruction: `Verify the trigonometric identity or simplify the expression.`,
        parts: [
          { letter: 'a', points: 4, content: `Simplify $\\dfrac{\\sin x}{1 + \\cos x} + \\dfrac{1 + \\cos x}{\\sin x}$.` },
          { letter: 'b', points: 3, content: `Use the identity to evaluate the expression at $x = \\dfrac{\\pi}{3}$.` },
          { letter: 'c', points: 3, content: `State any domain restrictions.` }
        ],
        solution: {
          answer: `The expression simplifies to $2\\csc x$.`,
          steps: [
            { title: 'Common Denominator', math: `\\[\\frac{\\sin^2 x + (1+\\cos x)^2}{\\sin x (1 + \\cos x)}\\]` },
            { title: 'Simplify Numerator', math: `\\[\\sin^2 x + 1 + 2\\cos x + \\cos^2 x = 2 + 2\\cos x = 2(1+\\cos x)\\]` },
            { title: 'Cancel', math: `\\[\\frac{2(1+\\cos x)}{\\sin x (1+\\cos x)} = \\frac{2}{\\sin x} = 2\\csc x\\]` }
          ]
        },
        theorems: ['Pythagorean identity sin²+cos²=1', 'Reciprocal identities'],
        mistakes: ['Forgetting domain restrictions sin x ≠ 0, 1+cos x ≠ 0'],
        related: ['functions-graphs']
      });
    }
    return makeProblem({
      topic: 'Trigonometric Functions', week: 1, difficulty,
      instruction: `Evaluate the inverse trigonometric expression exactly.`,
      parts: [
        { letter: 'a', points: 3, content: `Evaluate $\\arcsin\\left(\\dfrac{1}{2}\\right)$, $\\arccos\\left(-\\dfrac{\\sqrt{3}}{2}\\right)$, $\\arctan(1)$.` },
        { letter: 'b', points: 3, content: `Evaluate $\\sin\\left(\\arccos\\dfrac{3}{5}\\right)$ without a calculator.` },
        { letter: 'c', points: 4, content: `Evaluate $\\tan\\left(\\arcsin\\dfrac{4}{5} + \\arccos\\dfrac{5}{13}\\right)$.` }
      ],
      solution: {
        answer: `a) π/6, 5π/6, π/4. b) 4/5. c) Use sum formula with right triangles.`,
        steps: [
          { title: 'Reference Values', explanation: 'Recall standard unit circle values.' },
          { title: 'Right Triangle Method', explanation: 'Draw a triangle with the given ratio to find the missing side.' },
          { title: 'Apply Sum Formula', math: `\\[\\tan(A+B) = \\frac{\\tan A + \\tan B}{1 - \\tan A \\tan B}\\]` }
        ]
      },
      theorems: ['Inverse trig ranges', 'Sum and difference formulas'],
      mistakes: ['Choosing wrong branch of inverse function'],
      related: ['trigonometric-functions']
    });
  }
  function genSequences(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 6);
    const b = randInt(1, 5);
    return makeProblem({
      topic: 'Sequences', week: 2, difficulty,
      instruction: `Determine whether the given sequence converges or diverges. If it converges, find its limit.`,
      parts: [
        { letter: 'a', points: 3, content: `$a_n = \\dfrac{${a}n ${b>=0?'+':'−'} ${Math.abs(b)}}{${a+2}n^2 + 1}$` },
        { letter: 'b', points: 3, content: `$b_n = \\dfrac{${a}^n}{n!}$` },
        { letter: 'c', points: 4, content: `$c_n = \\left(1 + \\dfrac{${a}}{n}\\right)^n$` }
      ],
      solution: {
        answer: `(a) Converges to 0. (b) Converges to 0 (exponential vs factorial). (c) Converges to $e^{${a}}$.`,
        steps: [
          { title: 'Divide by Highest Power', math: `\\[a_n = \\frac{${a}/n ${b>=0?'+':'−'} ${Math.abs(b)}/n^2}{${a+2} + 1/n^2} \\to \\frac{0}{${a+2}} = 0\\]` },
          { title: 'Growth Comparison', explanation: 'n! grows faster than any exponential.' },
          { title: 'Standard Limit', math: `\\[\\lim_{n\\to\\infty}\\left(1+\\frac{c}{n}\\right)^n = e^c\\]` }
        ]
      },
      theorems: ['Sequence limit laws', 'Squeeze theorem', 'Standard limit: (1+c/n)^n → e^c'],
      mistakes: ['Applying L\'Hôpital to discrete n', 'Forgetting n! growth'],
      related: ['sequence-limits', 'monotone-sequences']
    });
  }
  function genSequenceLimits(difficulty) {
    const d = difficulty || 'intermediate';
    return makeProblem({
      topic: 'Limits of Sequences', week: 2, difficulty,
      instruction: `Compute the limit of the sequence or determine that it diverges.`,
      parts: [
        { letter: 'a', points: 3, content: `$a_n = \\dfrac{\\ln n}{n}$` },
        { letter: 'b', points: 3, content: `$b_n = \\sqrt[n]{${randInt(2, 6)}}$` },
        { letter: 'c', points: 4, content: `$c_n = \\dfrac{${randInt(3, 8)}^n + n^${randInt(2, 4)}}{${randInt(2, 7)}^n - n^${randInt(2, 5)}}$` }
      ],
      solution: {
        answer: `(a) 0 (log grows slower than n). (b) 1. (c) 0 if base of numerator < denominator, ∞ otherwise.`,
        steps: [
          { title: 'Apply L\'Hôpital to Continuous Version', math: `\\[\\lim_{x\\to\\infty}\\frac{\\ln x}{x} = \\lim_{x\\to\\infty}\\frac{1/x}{1} = 0\\]` },
          { title: 'Use a^(1/n) → 1', math: `\\[\\lim_{n\\to\\infty} a^{1/n} = a^0 = 1\\]` },
          { title: 'Dominant Term Comparison', explanation: 'Exponential dominates polynomial; larger base grows faster.' }
        ]
      },
      theorems: ['Limit of ln n / n = 0', 'Root test for sequences', 'Exponential growth hierarchy'],
      mistakes: ['Using L\'Hôpital directly on discrete variable', 'Forgetting that ln n → ∞ but slower than n'],
      related: ['sequences', 'growth-rates']
    });
  }
  function genMonotoneSequences(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    return makeProblem({
      topic: 'Monotone Sequences', week: 2, difficulty,
      instruction: `Determine whether the sequence is monotone (increasing/decreasing) and bounded, then apply the Monotone Convergence Theorem.`,
      parts: [
        { letter: 'a', points: 4, content: `$a_n = \\dfrac{n}{n + ${a}}$` },
        { letter: 'b', points: 3, content: `$b_n = ${a} - \\dfrac{1}{n^2}$` },
        { letter: 'c', points: 3, content: `$c_n = \\dfrac{(-1)^n}{n}$ (is it monotone?)` }
      ],
      solution: {
        answer: `(a) Increasing, bounded above by 1, converges to 1. (b) Increasing, bounded above by ${a}, converges to ${a}. (c) Not monotone (oscillates) but converges to 0.`,
        steps: [
          { title: 'Test aₙ₊₁ − aₙ', math: `\\[a_{n+1} - a_n = \\frac{n+1}{n+1+${a}} - \\frac{n}{n+${a}} = \\frac{${a}}{(n+1+${a})(n+${a})} > 0\\]` },
          { title: 'Find Upper Bound', explanation: 'As n → ∞, aₙ → 1, so bounded above by 1.' },
          { title: 'Apply MCT', explanation: 'Monotone + bounded → converges to supremum.' }
        ]
      },
      theorems: ['Monotone Convergence Theorem', 'Bounded + monotone → convergent'],
      mistakes: ['Confusing bounded with convergent', 'Assuming oscillating sequences diverge'],
      related: ['sequences', 'sandwich-theorem']
    });
  }
  function genSandwichTheorem(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 6);
    return makeProblem({
      topic: 'Sandwich Theorem', week: 2, difficulty,
      instruction: `Use the Sandwich (Squeeze) Theorem to evaluate the limit.`,
      parts: [
        { letter: 'a', points: 4, content: `Evaluate $\\displaystyle\\lim_{x \\to 0} x^${a} \\sin\\left(\\dfrac{1}{x}\\right)$.` },
        { letter: 'b', points: 3, content: `Evaluate $\\displaystyle\\lim_{x \\to \\infty} \\dfrac{\\sin x}{x}$.` },
        { letter: 'c', points: 3, content: `Evaluate $\\displaystyle\\lim_{x \\to 0} x^2 \\cos\\left(\\dfrac{1}{x^2}\\right)$.` }
      ],
      solution: {
        answer: `All three limits equal 0 due to bounded × vanishing = 0.`,
        steps: [
          { title: 'Bound the Oscillating Factor', math: `\\[-1 \\leq \\sin\\left(\\frac{1}{x}\\right) \\leq 1\\]` },
          { title: 'Multiply by Vanishing Factor', math: `\\[-x^${a} \\leq x^${a}\\sin\\left(\\frac{1}{x}\\right) \\leq x^${a}\\]` },
          { title: 'Apply Sandwich', math: `\\[\\lim_{x\\to 0} (-x^${a}) = \\lim_{x\\to 0} x^${a} = 0 \\implies \\text{limit} = 0\\]` }
        ]
      },
      theorems: ['Sandwich Theorem', 'Bounded × vanishing = 0'],
      mistakes: ['Trying to evaluate sin(1/x) directly', 'Forgetting the ±1 bound'],
      related: ['sandwich-theorem', 'sequences']
    });
  }
  function genOneSidedLimits(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 4);
    return makeProblem({
      topic: 'One-Sided Limits', week: 3, difficulty,
      instruction: `Evaluate the one-sided limits and determine whether the two-sided limit exists.`,
      parts: [
        { letter: 'a', points: 3, content: `Let $f(x) = \\begin{cases} ${a}x + 1 & x < 2 \\\\ x^2 - 1 & x \\geq 2 \\end{cases}$. Find $\\lim_{x\\to 2^-} f(x)$ and $\\lim_{x\\to 2^+} f(x)$.` },
        { letter: 'b', points: 3, content: `Does $\\lim_{x\\to 2} f(x)$ exist? If yes, find it.` },
        { letter: 'c', points: 4, content: `Find $\\lim_{x\\to 0^-} \\dfrac{|x|}{x}$ and $\\lim_{x\\to 0^+} \\dfrac{|x|}{x}$.` }
      ],
      solution: {
        answer: `a) Left = ${a*2+1}, Right = 3. b) Exists only if equal. c) −1 and 1 — two-sided limit does not exist.`,
        steps: [
          { title: 'Left-Hand Limit', explanation: 'Use branch x < 2.', math: `\\[\\lim_{x\\to 2^-}(${a}x+1) = ${a*2+1}\\]` },
          { title: 'Right-Hand Limit', explanation: 'Use branch x ≥ 2.', math: `\\[\\lim_{x\\to 2^+}(x^2-1) = 3\\]` },
          { title: 'Compare', explanation: 'If left ≠ right, two-sided limit does not exist.' }
        ]
      },
      theorems: ['Two-sided limit exists ↔ both one-sided limits exist and are equal'],
      mistakes: ['Mixing branches', 'Forgetting absolute value splits into two cases'],
      related: ['continuity', 'discontinuities']
    });
  }
  function genContinuity(difficulty) {
    const d = difficulty || 'intermediate';
    const k = randInt(2, 6);
    return makeProblem({
      topic: 'Continuity', week: 3, difficulty,
      instruction: `Determine whether the function is continuous at the given point. If not, classify the discontinuity.`,
      parts: [
        { letter: 'a', points: 3, content: `$f(x) = \\dfrac{x^2 - ${k*k}}{x - ${k}}$ at $x = ${k}$.` },
        { letter: 'b', points: 4, content: `Find the value of $c$ that makes $g(x) = \\begin{cases} x^2 + c & x < 1 \\\\ ${k}x & x \\geq 1 \\end{cases}$ continuous at $x = 1$.` },
        { letter: 'c', points: 3, content: `For $h(x) = \\dfrac{1}{x - ${k}}$, describe the discontinuity at $x = ${k}$.` }
      ],
      solution: {
        answer: `a) Removable discontinuity (hole at x=${k}, value ${2*k}). b) c = ${k} − 1. c) Infinite discontinuity (vertical asymptote).`,
        steps: [
          { title: 'Factor and Simplify (a)', math: `\\[\\frac{x^2 - ${k*k}}{x - ${k}} = \\frac{(x-${k})(x+${k})}{x-${k}} = x + ${k}\\]` },
          { title: 'Match Left and Right (b)', math: `\\[\\lim_{x\\to 1^-}(x^2+c) = 1 + c = \\lim_{x\\to 1^+}${k}x = ${k} \\implies c = ${k-1}\\]` },
          { title: 'Classify (c)', explanation: 'As x → ' + k + ', h(x) → ±∞. Vertical asymptote.' }
        ]
      },
      theorems: ['Three conditions for continuity', 'Removable, jump, infinite discontinuities'],
      mistakes: ['Concluding continuity without checking all three conditions', 'Forgetting to compute f(a) explicitly'],
      related: ['one-sided-limits', 'discontinuities', 'ivt']
    });
  }
  function genDiscontinuities(difficulty) {
    const d = difficulty || 'intermediate';
    return makeProblem({
      topic: 'Discontinuities', week: 3, difficulty,
      instruction: `Classify each discontinuity as removable, jump, infinite, or oscillating.`,
      parts: [
        { letter: 'a', points: 3, content: `$f(x) = \\dfrac{x^2 - 4}{x - 2}$ at $x = 2$.` },
        { letter: 'b', points: 3, content: `$g(x) = \\begin{cases} x & x < 0 \\\\ x + 1 & x \\geq 0 \\end{cases}$ at $x = 0$.` },
        { letter: 'c', points: 2, content: `$h(x) = \\dfrac{1}{x^2}$ at $x = 0$.` },
        { letter: 'd', points: 2, content: `$k(x) = \\sin(1/x)$ at $x = 0$.` }
      ],
      solution: {
        answer: `a) Removable. b) Jump. c) Infinite. d) Oscillating.`,
        steps: [
          { title: 'Check Limits', explanation: 'Compute left and right limits and f(a).' },
          { title: 'Classify', explanation: 'Removable = hole; jump = different one-sided; infinite = ±∞; oscillating = no limit.' }
        ]
      },
      theorems: ['Classification of discontinuities'],
      mistakes: ['Confusing jump with removable'],
      related: ['continuity', 'one-sided-limits']
    });
  }
  function genLimitsInfinity(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(1, 5);
    const c = randInt(2, 6);
    return makeProblem({
      topic: 'Limits at Infinity', week: 3, difficulty,
      instruction: `Evaluate the limit at infinity, and identify any horizontal asymptotes.`,
      parts: [
        { letter: 'a', points: 3, content: `$\\displaystyle\\lim_{x \\to \\infty} \\dfrac{${a}x^2 + ${b}x - 1}{${c}x^2 + 3}$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\lim_{x \\to -\\infty} \\dfrac{\\sqrt{${a}x^2 + 1}}{x + ${b}}$` },
        { letter: 'c', points: 4, content: `$\\displaystyle\\lim_{x \\to \\infty} \\dfrac{${b}^x}{x^${a}}$` }
      ],
      solution: {
        answer: `a) ${a}/${c}. b) ${a < 0 ? '−' : ''}√${a}. c) ∞.`,
        steps: [
          { title: 'Divide by Highest Power', math: `\\[\\lim_{x\\to\\infty}\\frac{${a} + ${b}/x - 1/x^2}{${c} + 3/x^2} = \\frac{${a}}{${c}}\\]` },
          { title: 'Handle Absolute Value', explanation: 'Since x → −∞, √(x²) = |x| = −x.' },
          { title: 'Growth Comparison', explanation: 'Exponential grows faster than any polynomial.' }
        ]
      },
      theorems: ['Limits at infinity for rational functions', 'Horizontal asymptote = limit at ±∞'],
      mistakes: ['Wrong sign with √(x²) as x → −∞', 'Miscounting degrees'],
      related: ['growth-rates', 'limits-infinity']
    });
  }
  function genGrowthRates(difficulty) {
    const d = difficulty || 'intermediate';
    const p = randInt(2, 5);
    const b = randInt(2, 4);
    return makeProblem({
      topic: 'Relative Growth Rates', week: 3, difficulty,
      instruction: `Compare the growth rates of the following pairs of functions as $x \\to \\infty$. Justify using limits.`,
      parts: [
        { letter: 'a', points: 3, content: `$\\ln x$ vs $x^{1/${p}}$` },
        { letter: 'b', points: 3, content: `$x^{${p}}$ vs $${b}^x$` },
        { letter: 'c', points: 4, content: `$${b}^x$ vs $x^x$` }
      ],
      solution: {
        answer: `Hierarchy: ln x ≪ x^(1/${p}) ≪ x^${p} ≪ ${b}^x ≪ x^x.`,
        steps: [
          { title: 'Take Ratio and Limit', math: `\\[\\lim_{x\\to\\infty}\\frac{\\ln x}{x^{1/${p}}} = 0\\]` },
          { title: 'Apply L\'Hôpital Repeatedly', explanation: 'Exponential beats polynomial after enough differentiations.' },
          { title: 'Compare Bases', explanation: 'For x^x, base grows with x, so it beats fixed-base exponentials.' }
        ]
      },
      theorems: ['ln x ≪ x^p ≪ b^x ≪ x^x', 'Asymptotic equivalence notation'],
      mistakes: ['Assuming any exponential beats x^x', 'Forgetting ln x is slowest'],
      related: ['limits-infinity', 'lhopitals-rule']
    });
  }
  function genDefinitionDerivative(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(1, 4);
    return makeProblem({
      topic: 'Definition of Derivative', week: 4, difficulty,
      instruction: `Use the limit definition of the derivative to compute $f'(x)$ and evaluate $f'(a)$ at the given point.`,
      parts: [
        { letter: 'a', points: 4, content: `Find $f'(x)$ using $f'(x) = \\displaystyle\\lim_{h\\to 0}\\dfrac{f(x+h)-f(x)}{h}$ for $f(x) = ${a}x^2 ${b>=0?'+':'−'} ${Math.abs(b)}x$.` },
        { letter: 'b', points: 3, content: `Evaluate $f'(1)$ and state the equation of the tangent line at $x = 1$.` },
        { letter: 'c', points: 3, content: `Verify the same result using the power rule.` }
      ],
      solution: {
        answer: `$f'(x) = ${2*a}x ${b>=0?'+':'−'} ${Math.abs(b)}$, tangent at x=1: y = f(1) + f'(1)(x−1).`,
        steps: [
          { title: 'Set Up Difference Quotient', math: `\\[\\frac{f(x+h) - f(x)}{h} = \\frac{${a}(x+h)^2 ${b>=0?'+':'−'} ${Math.abs(b)}(x+h) - ${a}x^2 ${b>=0?'−':'+'} ${Math.abs(b)}x}{h}\\]` },
          { title: 'Expand and Simplify', math: `\\[= \\frac{${2*a}xh + ${a}h^2 ${b>=0?'+':'−'} ${Math.abs(b)}h}{h} = ${2*a}x ${b>=0?'+':'−'} ${Math.abs(b)} + ${a}h\\]` },
          { title: 'Take Limit as h→0', math: `\\[f'(x) = ${2*a}x ${b>=0?'+':'−'} ${Math.abs(b)}\\]` }
        ]
      },
      theorems: ['Definition of derivative', 'Tangent line equation', 'Power rule verification'],
      mistakes: ['Algebraic errors in (x+h)² expansion', 'Forgetting to cancel h properly'],
      related: ['differentiation-rules', 'tangents-normals']
    });
  }
  function genDifferentiationRules(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(2, 5);
    return makeProblem({
      topic: 'Differentiation Rules', week: 4, difficulty,
      instruction: `Differentiate each function using the appropriate rules (power, product, quotient, chain).`,
      parts: [
        { letter: 'a', points: 3, content: `$f(x) = (${a}x^2 + ${b}x)^3$` },
        { letter: 'b', points: 3, content: `$g(x) = \\dfrac{x^2 + 1}{x - ${a}}$` },
        { letter: 'c', points: 4, content: `$h(x) = x^${a} \\ln x + e^{${b}x} \\sin x$` }
      ],
      solution: {
        answer: `Apply chain, quotient, product rules in sequence.`,
        steps: [
          { title: 'Chain Rule (a)', math: `\\[f'(x) = 3(${a}x^2 + ${b}x)^2 \\cdot (${2*a}x + ${b})\\]` },
          { title: 'Quotient Rule (b)', math: `\\[g'(x) = \\frac{2x(x-${a}) - (x^2+1)}{(x-${a})^2}\\]` },
          { title: 'Product Rule (c)', math: `\\[h'(x) = ${a}x^{${a-1}}\\ln x + x^{${a-1}} + ${b}e^{${b}x}\\sin x + e^{${b}x}\\cos x\\]` }
        ]
      },
      theorems: ['Power rule', 'Product rule', 'Quotient rule', 'Chain rule'],
      mistakes: ['Forgetting chain rule multiplier', 'Product rule sign errors'],
      related: ['chain-rule', 'definition-derivative']
    });
  }
  function genChainRule(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 6);
    const b = randInt(1, 4);
    return makeProblem({
      topic: 'Chain Rule', week: 4, difficulty,
      instruction: `Differentiate using the chain rule. Show the inner and outer function decomposition clearly.`,
      parts: [
        { letter: 'a', points: 3, content: `$f(x) = \\sin(${a}x^2 + ${b})$` },
        { letter: 'b', points: 3, content: `$g(x) = e^{\\sqrt{${a}x + ${b}}}$` },
        { letter: 'c', points: 4, content: `$h(x) = \\left(\\dfrac{x + 1}{x - 1}\\right)^{${a}}$` }
      ],
      solution: {
        answer: `Apply chain rule with clear inner/outer identification.`,
        steps: [
          { title: 'Decompose (a)', explanation: 'Outer sin, inner ' + a + 'x² + ' + b, math: `\\[f'(x) = \\cos(${a}x^2 + ${b}) \\cdot ${2*a}x\\]` },
          { title: 'Nested Chain (b)', explanation: 'Two chained applications.', math: `\\[g'(x) = e^{\\sqrt{${a}x+${b}}} \\cdot \\frac{${a}}{2\\sqrt{${a}x+${b}}}\\]` },
          { title: 'Power + Quotient (c)', math: `\\[h'(x) = ${a}\\left(\\frac{x+1}{x-1}\\right)^{${a-1}} \\cdot \\frac{-2}{(x-1)^2}\\]` }
        ]
      },
      theorems: ['Chain rule: (f∘g)\' = f\'(g)·g\''],
      mistakes: ['Forgetting to multiply by inner derivative', 'Sign error in quotient rule'],
      related: ['differentiation-rules', 'implicit-diff']
    });
  }
  function genImplicitDiff(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    return makeProblem({
      topic: 'Implicit Differentiation', week: 4, difficulty,
      instruction: `Find $\\dfrac{dy}{dx}$ by implicit differentiation. Then find the tangent line at the given point.`,
      parts: [
        { letter: 'a', points: 4, content: `Find $\\dfrac{dy}{dx}$ for $x^2 + ${a}y^2 = ${a*a + 1}$.` },
        { letter: 'b', points: 3, content: `Find the tangent line at the point $(1, 1)$.` },
        { letter: 'c', points: 3, content: `Find $\\dfrac{d^2y}{dx^2}$ at $(1, 1)$.` }
      ],
      solution: {
        answer: `dy/dx = −x/(${a}y). Tangent slope at (1,1): −1/${a}.`,
        steps: [
          { title: 'Differentiate Both Sides', math: `\\[2x + ${2*a}y\\frac{dy}{dx} = 0\\]` },
          { title: 'Solve for dy/dx', math: `\\[\\frac{dy}{dx} = -\\frac{x}{${a}y}\\]` },
          { title: 'Tangent Line', math: `\\[y - 1 = -\\frac{1}{${a}}(x - 1)\\]` },
          { title: 'Second Derivative', explanation: 'Differentiate dy/dx implicitly again.' }
        ]
      },
      theorems: ['Implicit differentiation', 'Chain rule applied to y(x)'],
      mistakes: ['Forgetting chain rule when differentiating y terms', 'Not substituting (x,y) after finding dy/dx'],
      related: ['chain-rule', 'tangents-normals']
    });
  }
  function genParametricDerivatives(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(1, 4);
    return makeProblem({
      topic: 'Parametric Derivatives', week: 4, difficulty,
      instruction: `For the given parametric curve, find $\\dfrac{dy}{dx}$ and $\\dfrac{d^2y}{dx^2}$.`,
      parts: [
        { letter: 'a', points: 3, content: `$x = t^2 + ${a}$, $y = t^3 - ${b}t$. Find $\\dfrac{dy}{dx}$.` },
        { letter: 'b', points: 4, content: `Find $\\dfrac{d^2y}{dx^2}$ in terms of $t$.` },
        { letter: 'c', points: 3, content: `Find the equation of the tangent line at $t = 1$.` }
      ],
      solution: {
        answer: `dy/dx = (3t² − ${b})/(2t). Second derivative: differentiate and divide by dx/dt.`,
        steps: [
          { title: 'Compute dx/dt and dy/dt', math: `\\[\\frac{dx}{dt} = 2t, \\quad \\frac{dy}{dt} = 3t^2 - ${b}\\]` },
          { title: 'Chain Rule for dy/dx', math: `\\[\\frac{dy}{dx} = \\frac{3t^2 - ${b}}{2t}\\]` },
          { title: 'Second Derivative Formula', math: `\\[\\frac{d^2y}{dx^2} = \\frac{\\frac{d}{dt}\\left(\\frac{dy}{dx}\\right)}{\\frac{dx}{dt}}\\]` },
          { title: 'Tangent at t=1', explanation: 'Substitute t=1 into dy/dx and the point (x(1), y(1)).' }
        ]
      },
      theorems: ['Parametric derivative formulas', 'Second derivative of parametric curve'],
      mistakes: ['Using dx/dt as dx/dy', 'Forgetting to divide by dx/dt for second derivative'],
      related: ['chain-rule', 'arc-length']
    });
  }
  function genTangentsNormals(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 4);
    const b = randInt(1, 5);
    return makeProblem({
      topic: 'Tangents & Normals', week: 4, difficulty,
      instruction: `Find the equations of the tangent and normal lines to the curve at the given point.`,
      parts: [
        { letter: 'a', points: 4, content: `Curve: $y = x^3 - ${a}x^2 + ${b}$, at $x = 1$.` },
        { letter: 'b', points: 3, content: `Find all points on the curve where the tangent line is horizontal.` },
        { letter: 'c', points: 3, content: `Find the equation of the normal line at $x = 1$.` }
      ],
      solution: {
        answer: `Find y\' = 3x² − ${2*a}x. At x=1, slope m = ${3-2*a}. Tangent: y − f(1) = m(x−1). Normal slope: −1/m.`,
        steps: [
          { title: 'Compute Derivative', math: `\\[y' = 3x^2 - ${2*a}x\\]` },
          { title: 'Evaluate at x=1', math: `\\[y'(1) = ${3-2*a}, \\quad y(1) = ${1-a+b}\\]` },
          { title: 'Tangent Line', math: `\\[y - ${1-a+b} = ${3-2*a}(x - 1)\\]` },
          { title: 'Normal Line', math: `\\[y - ${1-a+b} = \\frac{-1}{${3-2*a}}(x - 1)\\]` },
          { title: 'Horizontal Tangents', explanation: 'Set y\' = 0 and solve for x.' }
        ]
      },
      theorems: ['Tangent slope = f\'(a)', 'Normal slope = −1/f\'(a)'],
      mistakes: ['Forgetting normal is perpendicular (negative reciprocal)', 'Sign errors in slope computation'],
      related: ['definition-derivative', 'differentiation-rules']
    });
  }
  function genMaximaMinima(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 4);
    const b = randInt(2, 6);
    return makeProblem({
      topic: 'Maxima & Minima', week: 5, difficulty,
      instruction: `Find all local and absolute extrema of the function on the given interval.`,
      parts: [
        { letter: 'a', points: 4, content: `Find local extrema of $f(x) = x^3 - ${3*a}x^2 + ${3*a*a}x$ using the first or second derivative test.` },
        { letter: 'b', points: 3, content: `Find absolute extrema of $f$ on $[0, ${b}]$.` },
        { letter: 'c', points: 3, content: `Sketch the graph showing all critical points and inflections.` }
      ],
      solution: {
        answer: `Critical points at x = ${a}. Check f\'\' for min/max. Absolute extrema from closed interval method.`,
        steps: [
          { title: 'Find Critical Numbers', math: `\\[f'(x) = 3x^2 - ${6*a}x + ${3*a*a} = 3(x - ${a})^2 = 0 \\implies x = ${a}\\]` },
          { title: 'Second Derivative Test', math: `\\[f''(x) = 6x - ${6*a}, \\quad f''(${a}) = 0 \\text{ — inconclusive}\\]` },
          { title: 'Closed Interval Method', explanation: 'Evaluate at endpoints and critical numbers.' }
        ]
      },
      theorems: ['Fermat\'s theorem', 'First/second derivative tests', 'Closed interval method'],
      mistakes: ['Stopping at f\'=0 without checking second derivative', 'Forgetting endpoints for absolute extrema'],
      related: ['graphing-derivatives', 'mean-value-theorem']
    });
  }
  function genMeanValueTheorem(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 5);
    const b = randInt(1, 4);
    return makeProblem({
      topic: 'Mean Value Theorem', week: 5, difficulty,
      instruction: `Verify that the function satisfies the hypotheses of the Mean Value Theorem on the given interval, then find all numbers $c$ guaranteed by the theorem.`,
      parts: [
        { letter: 'a', points: 3, content: `$f(x) = x^3 - ${a}x^2 + ${b}x$ on $[0, 3]$.` },
        { letter: 'b', points: 4, content: `Find all $c \\in (0, 3)$ such that $f'(c) = \\dfrac{f(3) - f(0)}{3 - 0}$.` },
        { letter: 'c', points: 3, content: `Illustrate geometrically: what does the MVT guarantee?` }
      ],
      solution: {
        answer: `Solve f\'(c) = slope of secant line.`,
        steps: [
          { title: 'Verify Hypotheses', explanation: 'f is a polynomial — continuous on [0,3], differentiable on (0,3).' },
          { title: 'Compute Secant Slope', math: `\\[m = \\frac{f(3) - f(0)}{3} = \\frac{${27-9*a+3*b} - 0}{3} = ${9-3*a+b}\\]` },
          { title: 'Solve f\'(c) = m', math: `\\[3c^2 - ${2*a}c + ${b} = ${9-3*a+b}\\]` },
          { title: 'Select Valid c', explanation: 'Choose c values in the open interval (0, 3).' }
        ]
      },
      theorems: ['Mean Value Theorem', 'Rolle\'s Theorem (special case)', 'Geometric interpretation: tangent parallel to secant'],
      mistakes: ['Using closed interval for c', 'Not verifying continuity/differentiability hypotheses'],
      related: ['maxima-minima', 'graphing-derivatives']
    });
  }
  function genGraphingDerivatives(difficulty) {
    const d = difficulty || 'intermediate';
    return makeProblem({
      topic: 'Graphing with Derivatives', week: 5, difficulty,
      instruction: `Analyze the function using its first and second derivatives: find intervals of increase/decrease, concavity, and inflection points.`,
      parts: [
        { letter: 'a', points: 3, content: `Find $f'(x)$ and identify critical numbers for $f(x) = x^4 - 4x^3$.` },
        { letter: 'b', points: 3, content: `Find $f''(x)$ and identify possible inflection points.` },
        { letter: 'c', points: 4, content: `Determine intervals of increase/decrease and concavity, then sketch the graph.` }
      ],
      solution: {
        answer: `f\' = 4x²(x−3). Critical at x=0, 3. f\'\' = 12x(x−2). Inflections at x=0, 2.`,
        steps: [
          { title: 'First Derivative', math: `\\[f'(x) = 4x^3 - 12x^2 = 4x^2(x - 3)\\]` },
          { title: 'First Derivative Sign Chart', explanation: 'f\' < 0 on (−∞, 0), f\' < 0 on (0, 3), f\' > 0 on (3, ∞).' },
          { title: 'Second Derivative', math: `\\[f''(x) = 12x^2 - 24x = 12x(x - 2)\\]` },
          { title: 'Concavity', explanation: 'Concave up on (−∞, 0) ∪ (2, ∞); concave down on (0, 2).' },
          { title: 'Sketch', explanation: 'Combine all information: local min at x=3, inflection points at x=0 and x=2.' }
        ]
      },
      theorems: ['First derivative test', 'Second derivative test', 'Concavity and inflection'],
      mistakes: ['Confusing f\' and f\'\' sign charts', 'Missing sign changes in f\'\''],
      related: ['maxima-minima', 'lhopitals-rule']
    });
  }
  function genRelatedRates(difficulty) {
    const d = difficulty || 'intermediate';
    const type = pick(['sphere', 'ladder', 'cone']);
    if (type === 'sphere') {
      return makeProblem({
        topic: 'Related Rates', week: 5, difficulty,
        instruction: `A spherical balloon is inflated at a constant rate. Find the rate of change of the radius at the given instant.`,
        parts: [
          { letter: 'a', points: 3, content: `The volume increases at $\\dfrac{dV}{dt} = 100\\ \\text{cm}^3/\\text{s}$. Find $\\dfrac{dr}{dt}$ when $r = 5$ cm.` },
          { letter: 'b', points: 3, content: `Find $\\dfrac{dr}{dt}$ when $r = 10$ cm.` },
          { letter: 'c', points: 4, content: `At what radius is the radius increasing at $1\\ \\text{cm/s}$?` }
        ],
        solution: {
          answer: `dV/dt = 4πr² dr/dt. At r=5: dr/dt = 1/π cm/s.`,
          steps: [
            { title: 'Volume Formula', math: `\\[V = \\frac{4}{3}\\pi r^3\\]` },
            { title: 'Differentiate w.r.t. t', math: `\\[\\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt}\\]` },
            { title: 'Substitute', math: `\\[100 = 4\\pi(25)\\frac{dr}{dt} \\implies \\frac{dr}{dt} = \\frac{1}{\\pi}\\ \\text{cm/s}\\]` }
          ]
        },
        theorems: ['Chain rule with time', 'Implicit differentiation w.r.t. t'],
        mistakes: ['Forgetting to differentiate with respect to t', 'Treating r as constant'],
        related: ['implicit-diff', 'optimization']
      });
    }
    if (type === 'ladder') {
      return makeProblem({
        topic: 'Related Rates', week: 5, difficulty,
        instruction: `A ladder of length 10 ft leans against a vertical wall. The bottom slides away from the wall at 1 ft/s.`,
        parts: [
          { letter: 'a', points: 4, content: `How fast is the top sliding down when the bottom is 6 ft from the wall?` },
          { letter: 'b', points: 3, content: `How fast when the bottom is 8 ft from the wall?` },
          { letter: 'c', points: 3, content: `What happens to the speed of the top as the bottom approaches 10 ft?` }
        ],
        solution: {
          answer: `x² + y² = 100. Differentiate: 2x dx/dt + 2y dy/dt = 0. At x=6, y=8: dy/dt = −0.75 ft/s.`,
          steps: [
            { title: 'Pythagoras Relation', math: `\\[x^2 + y^2 = 100\\]` },
            { title: 'Differentiate w.r.t. t', math: `\\[2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0\\]` },
            { title: 'Substitute', math: `\\[\\frac{dy}{dt} = -\\frac{x}{y}\\frac{dx}{dt} = -\\frac{6}{8}(1) = -0.75\\ \\text{ft/s}\\]` }
          ]
        },
        theorems: ['Pythagorean theorem', 'Implicit differentiation in time'],
        mistakes: ['Sign errors — y decreases so dy/dt < 0', 'Mixing x and y'],
        related: ['implicit-diff']
      });
    }
    return makeProblem({
      topic: 'Related Rates', week: 5, difficulty,
      instruction: `Water drains from a conical tank at a constant rate. Relate the rates of change.`,
      parts: [
        { letter: 'a', points: 4, content: `A cone with height 10 m and radius 4 m drains at 2 m³/min. Find dh/dt when h = 5 m.` },
        { letter: 'b', points: 3, content: `Find dh/dt when h = 8 m.` },
        { letter: 'c', points: 3, content: `Interpret the sign of dh/dt physically.` }
      ],
      solution: {
        answer: `Use similar triangles: r = (2/5)h. V = (1/3)πr²h = (4π/75)h³. dV/dt = (4π/25)h² dh/dt.`,
        steps: [
          { title: 'Similar Triangles', math: `\\[\\frac{r}{h} = \\frac{4}{10} = \\frac{2}{5} \\implies r = \\frac{2h}{5}\\]` },
          { title: 'Volume in Terms of h', math: `\\[V = \\frac{1}{3}\\pi\\left(\\frac{2h}{5}\\right)^2 h = \\frac{4\\pi}{75}h^3\\]` },
          { title: 'Differentiate', math: `\\[\\frac{dV}{dt} = \\frac{4\\pi}{25}h^2 \\frac{dh}{dt}\\]` },
          { title: 'Substitute h=5', math: `\\[-2 = \\frac{4\\pi}{25}(25)\\frac{dh}{dt} \\implies \\frac{dh}{dt} = -\\frac{1}{2\\pi}\\ \\text{m/min}\\]` }
        ]
      },
      theorems: ['Similar triangles', 'Volume of cone', 'Chain rule'],
      mistakes: ['Using r without expressing in terms of h', 'Sign of dV/dt (negative if draining)'],
      related: ['related-rates', 'optimization']
    });
  }
  function genOptimization(difficulty) {
    const d = difficulty || 'intermediate';
    const type = pick(['box', 'fence', 'numbers']);
    if (type === 'box') {
      return makeProblem({
        topic: 'Optimization', week: 5, difficulty,
        instruction: `Solve the optimization problem. Set up the objective function, express it in one variable, and use calculus to find the optimum.`,
        parts: [
          { letter: 'a', points: 4, content: `A closed rectangular box with a square base has volume 32 cm³. Find dimensions minimizing surface area.` },
          { letter: 'b', points: 3, content: `Justify that your critical point is indeed a minimum.` },
          { letter: 'c', points: 3, content: `What is the minimum surface area?` }
        ],
        solution: {
          answer: `x = 4, h = 2. Minimum surface area = 48 cm².`,
          steps: [
            { title: 'Constraint', math: `\\[x^2 h = 32 \\implies h = \\frac{32}{x^2}\\]` },
            { title: 'Objective: Surface Area', math: `\\[S = 2x^2 + 4xh = 2x^2 + \\frac{128}{x}\\]` },
            { title: 'Differentiate and Set to Zero', math: `\\[S'(x) = 4x - \\frac{128}{x^2} = 0 \\implies x^3 = 32 \\implies x = 4\\]` },
            { title: 'Second Derivative Check', math: `\\[S''(x) = 4 + \\frac{256}{x^3} > 0 \\implies \\text{minimum}\\]` }
          ]
        },
        theorems: ['Optimization: reduce to one variable', 'Second derivative test for minimum'],
        mistakes: ['Forgetting the constraint equation', 'Missing surface area term for closed box'],
        related: ['maxima-minima', 'related-rates']
      });
    }
    if (type === 'fence') {
      return makeProblem({
        topic: 'Optimization', week: 5, difficulty,
        instruction: `A farmer wants to fence a rectangular field along a river (no fence needed on the river side) with 200 m of fence. Maximize the area.`,
        parts: [
          { letter: 'a', points: 4, content: `Set up the objective function $A(x)$ and the constraint.` },
          { letter: 'b', points: 4, content: `Find the dimensions that maximize the area.` },
          { letter: 'c', points: 2, content: `What is the maximum area?` }
        ],
        solution: {
          answer: `Dimensions: 50 m × 100 m. Max area = 5000 m².`,
          steps: [
            { title: 'Constraint', math: `\\[2x + y = 200 \\implies y = 200 - 2x\\]` },
            { title: 'Objective: Area', math: `\\[A = xy = x(200 - 2x) = 200x - 2x^2\\]` },
            { title: 'Differentiate', math: `\\[A'(x) = 200 - 4x = 0 \\implies x = 50\\]` },
            { title: 'Maximum', math: `\\[A(50) = 5000\\ \\text{m}^2\\]` }
          ]
        },
        theorems: ['Optimization strategy', 'Second derivative test'],
        mistakes: ['Including river side in fence length', 'Not verifying maximum'],
        related: ['optimization', 'maxima-minima']
      });
    }
    return makeProblem({
      topic: 'Optimization', week: 5, difficulty,
      instruction: `Find two positive numbers satisfying the given condition and optimizing the objective.`,
      parts: [
        { letter: 'a', points: 3, content: `The sum is 20. Maximize the product.` },
        { letter: 'b', points: 3, content: `The product is 100. Minimize the sum.` },
        { letter: 'c', points: 4, content: `The sum is 30. Minimize the sum of squares.` }
      ],
      solution: {
        answer: `(a) 10 and 10, product 100. (b) 10 and 10. (c) 15 and 15.`,
        steps: [
          { title: 'Set Variables', math: `\\[x + y = S,\\ \\text{maximize } xy\\]` },
          { title: 'Reduce', math: `\\[P = x(S - x) = Sx - x^2\\]` },
          { title: 'Optimize', math: `\\[P'(x) = S - 2x = 0 \\implies x = S/2\\]` }
        ]
      },
      theorems: ['AM-GM inequality intuition', 'Optimization with constraints'],
      mistakes: ['Forgetting positivity constraint', 'Not checking endpoints'],
      related: ['optimization']
    });
  }
  function genLhopitalsRule(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    return makeProblem({
      topic: "L'Hôpital's Rule", week: 5, difficulty,
      instruction: `Evaluate each limit using L'Hôpital's Rule. State the indeterminate form first.`,
      parts: [
        { letter: 'a', points: 3, content: `$\\displaystyle\\lim_{x \\to 0} \\dfrac{e^{${a}x} - 1}{x}$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\lim_{x \\to \\infty} \\dfrac{\\ln x}{x^{1/${a}}}$` },
        { letter: 'c', points: 4, content: `$\\displaystyle\\lim_{x \\to 0^+} x^{${a}} \\ln x$` }
      ],
      solution: {
        answer: `(a) ${a}. (b) 0. (c) 0.`,
        steps: [
          { title: 'Identify Form', explanation: '(a) 0/0, (b) ∞/∞, (c) 0·(−∞) — rewrite as quotient.' },
          { title: 'Apply L\'Hôpital', math: `\\[\\lim_{x\\to 0}\\frac{e^{${a}x}-1}{x} \\stackrel{LH}{=} \\lim_{x\\to 0}\\frac{${a}e^{${a}x}}{1} = ${a}\\]` },
          { title: 'Repeat or Simplify', explanation: 'For (c), rewrite as ln x / x^(−' + a + '), then apply LH.' }
        ]
      },
      theorems: ["L'Hôpital's Rule for 0/0 and ∞/∞", 'Transform other indeterminate forms'],
      mistakes: ['Applying LH to determinate forms', 'Forgetting to check form first'],
      related: ['growth-rates', 'limits-infinity']
    });
  }
  function genAntiderivatives(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(1, 5);
    return makeProblem({
      topic: 'Antiderivatives', week: 6, difficulty,
      instruction: `Find the most general antiderivative of each function. Then find the particular antiderivative satisfying the initial condition.`,
      parts: [
        { letter: 'a', points: 3, content: `$f(x) = ${a}x^2 - ${b}x + 1$, with $F(0) = 2$.` },
        { letter: 'b', points: 3, content: `$g(x) = \\dfrac{1}{x} + e^{${a}x}$, with $G(1) = 0$.` },
        { letter: 'c', points: 4, content: `$h(x) = \\sin(${a}x) + \\cos x$, with $H(0) = 1$.` }
      ],
      solution: {
        answer: `Apply reverse power rule for each term, add C, solve for C using IC.`,
        steps: [
          { title: 'Antiderivative of Polynomial', math: `\\[F(x) = \\frac{${a}}{3}x^3 - \\frac{${b}}{2}x^2 + x + C\\]` },
          { title: 'Use Initial Condition', math: `\\[F(0) = C = 2\\]` },
          { title: 'Antiderivative of 1/x + e^x', math: `\\[G(x) = \\ln|x| + \\frac{1}{${a}}e^{${a}x} + C\\]` },
          { title: 'Trig Antiderivatives', math: `\\[H(x) = -\\frac{1}{${a}}\\cos(${a}x) + \\sin x + C\\]` }
        ]
      },
      theorems: ['Reverse power rule', 'Standard antiderivative formulas', 'Initial value problems'],
      mistakes: ['Forgetting +C', 'Wrong coefficient from reverse power rule'],
      related: ['indefinite-integrals', 'basic-integration-formulas']
    });
  }
  function genIndefiniteIntegrals(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    return makeProblem({
      topic: 'Indefinite Integrals', week: 6, difficulty,
      instruction: `Evaluate the indefinite integral. Show all steps using linearity and standard formulas.`,
      parts: [
        { letter: 'a', points: 4, content: `$\\displaystyle\\int \\left(${a}x^3 - \\sqrt{x} + \\dfrac{1}{x}\\right) dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int (e^{${a}x} + \\sin x - \\sec^2 x) dx$` },
        { letter: 'c', points: 3, content: `$\\displaystyle\\int \\dfrac{1}{1 + x^2} dx + \\int \\dfrac{1}{\\sqrt{1 - x^2}} dx$` }
      ],
      solution: {
        answer: `Apply term-by-term integration with standard formulas.`,
        steps: [
          { title: 'Rewrite Powers', math: `\\[\\int\\left(${a}x^3 - x^{1/2} + x^{-1}\\right)dx\\]` },
          { title: 'Integrate Each Term', math: `\\[\\frac{${a}}{4}x^4 - \\frac{2}{3}x^{3/2} + \\ln|x| + C\\]` },
          { title: 'Trig and Exponential', math: `\\[\\frac{1}{${a}}e^{${a}x} - \\cos x - \\tan x + C\\]` },
          { title: 'Inverse Trig', math: `\\[\\arctan x + \\arcsin x + C\\]` }
        ]
      },
      theorems: ['Linearity of integration', 'Standard integral table'],
      mistakes: ['Forgetting +C', 'Wrong exponent increment'],
      related: ['basic-integration-formulas', 'substitution']
    });
  }
  function genBasicIntegrationFormulas(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 6);
    return makeProblem({
      topic: 'Basic Integration Formulas', week: 6, difficulty,
      instruction: `Evaluate using standard integration formulas.`,
      parts: [
        { letter: 'a', points: 3, content: `$\\displaystyle\\int \\dfrac{1}{x^2 + ${a*a}} dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int ${a}^x dx$` },
        { letter: 'c', points: 4, content: `$\\displaystyle\\int \\sec x \\tan x\\, dx - \\int \\csc^2 x\\, dx$` }
      ],
      solution: {
        answer: `Use inverse trig, exponential, and trig formulas.`,
        steps: [
          { title: 'Inverse Tangent Form', math: `\\[\\int \\frac{1}{x^2 + ${a*a}}dx = \\frac{1}{${a}}\\arctan\\left(\\frac{x}{${a}}\\right) + C\\]` },
          { title: 'Exponential Form', math: `\\[\\int ${a}^x dx = \\frac{${a}^x}{\\ln ${a}} + C\\]` },
          { title: 'Trig Integrals', math: `\\[\\sec x - (-\\cot x) + C = \\sec x + \\cot x + C\\]` }
        ]
      },
      theorems: ['Standard integral formulas', 'Inverse trig integrals'],
      mistakes: ['Forgetting the 1/a factor in arctan form', 'Mixing derivative and integral signs'],
      related: ['indefinite-integrals', 'substitution']
    });
  }
  function genSubstitution(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(1, 4);
    return makeProblem({
      topic: 'Substitution (u-sub)', week: 6, difficulty,
      instruction: `Evaluate each integral using u-substitution. Clearly state your substitution.`,
      parts: [
        { letter: 'a', points: 3, content: `$\\displaystyle\\int 2x\\cos(x^2) dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int e^{${a}x + ${b}} dx$` },
        { letter: 'c', points: 4, content: `$\\displaystyle\\int \\dfrac{x}{\\sqrt{x^2 + ${a}}} dx$` }
      ],
      solution: {
        answer: `Identify u, compute du, rewrite integral, integrate, back-substitute.`,
        steps: [
          { title: 'Choose u', math: `\\[u = x^2 \\implies du = 2x\\, dx\\]` },
          { title: 'Rewrite', math: `\\[\\int \\cos u\\, du = \\sin u + C = \\sin(x^2) + C\\]` },
          { title: 'Exponential Sub', math: `\\[u = ${a}x + ${b} \\implies \\int e^u \\cdot \\frac{du}{${a}} = \\frac{1}{${a}}e^{${a}x+${b}} + C\\]` },
          { title: 'Radical Sub', math: `\\[u = x^2 + ${a} \\implies \\frac{1}{2}\\int u^{-1/2}du = \\sqrt{x^2 + ${a}} + C\\]` }
        ]
      },
      theorems: ['Substitution rule: ∫f(g(x))g\'(x)dx = ∫f(u)du', 'Trig substitution'],
      mistakes: ['Forgetting to substitute dx', 'Not back-substituting u'],
      related: ['basic-integration-formulas', 'integration-by-parts']
    });
  }
  function genIntegrationByParts(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    return makeProblem({
      topic: 'Integration by Parts', week: 7, difficulty,
      instruction: `Evaluate each integral using integration by parts. Choose $u$ and $dv$ wisely (LIATE).`,
      parts: [
        { letter: 'a', points: 3, content: `$\\displaystyle\\int x e^{${a}x} dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int x \\sin(${a}x) dx$` },
        { letter: 'c', points: 4, content: `$\\displaystyle\\int \\ln x\\, dx$ and $\\displaystyle\\int x \\ln x\\, dx$` }
      ],
      solution: {
        answer: `Apply ∫u dv = uv − ∫v du. LIATE helps choose u.`,
        steps: [
          { title: 'For x·e^x', math: `\\[u = x,\\ dv = e^{${a}x}dx \\implies \\int x e^{${a}x}dx = \\frac{x e^{${a}x}}{${a}} - \\frac{e^{${a}x}}{${a}^2} + C\\]` },
          { title: 'For x·sin', math: `\\[u = x,\\ dv = \\sin(${a}x)dx \\implies -\\frac{x\\cos(${a}x)}{${a}} + \\frac{\\sin(${a}x)}{${a}^2} + C\\]` },
          { title: 'For ln x', math: `\\[\\int \\ln x\\, dx = x\\ln x - x + C\\]` }
        ]
      },
      theorems: ['Integration by parts formula', 'LIATE rule for choosing u'],
      mistakes: ['Choosing u poorly (making integral harder)', 'Sign errors in the formula'],
      related: ['substitution', 'trig-integrals']
    });
  }
  function genTrigIntegrals(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    return makeProblem({
      topic: 'Trigonometric Integrals', week: 7, difficulty,
      instruction: `Evaluate the trigonometric integral using the appropriate technique.`,
      parts: [
        { letter: 'a', points: 3, content: `$\\displaystyle\\int \\sin^${a} x \\cos x\\, dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int \\sin^2 x\\, dx$` },
        { letter: 'c', points: 4, content: `$\\displaystyle\\int \\sin(${a}x)\\cos(${a}x)\\, dx$` }
      ],
      solution: {
        answer: `(a) Substitute u = sin x. (b) Use half-angle. (c) Use product-to-sum.`,
        steps: [
          { title: 'Odd Power Sub (a)', math: `\\[u = \\sin x \\implies \\int u^${a} du = \\frac{\\sin^{${a+1}}x}{${a+1}} + C\\]` },
          { title: 'Half-Angle (b)', math: `\\[\\sin^2 x = \\frac{1 - \\cos 2x}{2} \\implies \\int = \\frac{x}{2} - \\frac{\\sin 2x}{4} + C\\]` },
          { title: 'Double-Angle (c)', math: `\\[\\sin(${a}x)\\cos(${a}x) = \\frac{\\sin(${2*a}x)}{2} \\implies -\\frac{\\cos(${2*a}x)}{${4*a}} + C\\]` }
        ]
      },
      theorems: ['Half-angle identities', 'Product-to-sum', 'Odd/even power strategy'],
      mistakes: ['Using wrong identity', 'Forgetting chain rule factor'],
      related: ['integration-by-parts', 'partial-fractions']
    });
  }
  function genPartialFractions(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(1, 4);
    return makeProblem({
      topic: 'Partial Fractions', week: 7, difficulty,
      instruction: `Decompose the rational function into partial fractions and evaluate the integral.`,
      parts: [
        { letter: 'a', points: 4, content: `$\\displaystyle\\int \\dfrac{1}{x^2 - ${a*a}} dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int \\dfrac{${a}x + ${b}}{x^2 + ${b}x} dx$` },
        { letter: 'c', points: 3, content: `$\\displaystyle\\int \\dfrac{x^2 + 1}{x^3 - x} dx$` }
      ],
      solution: {
        answer: `Decompose each into simpler fractions.`,
        steps: [
          { title: 'Factor Denominator', math: `\\[x^2 - ${a*a} = (x-${a})(x+${a})\\]` },
          { title: 'Decompose', math: `\\[\\frac{1}{(x-${a})(x+${a})} = \\frac{1}{${2*a}}\\left(\\frac{1}{x-${a}} - \\frac{1}{x+${a}}\\right)\\]` },
          { title: 'Integrate', math: `\\[\\frac{1}{${2*a}}\\ln\\left|\\frac{x-${a}}{x+${a}}\\right| + C\\]` },
          { title: 'Repeated/Quadratic', explanation: 'For (b) and (c), decompose similarly and integrate.' }
        ]
      },
      theorems: ['Partial fraction decomposition', 'Heaviside cover-up method', 'Long division for improper fractions'],
      mistakes: ['Forgetting repeated factors', 'Missing quadratic irreducible terms'],
      related: ['trig-integrals', 'indefinite-integrals']
    });
  }
  function genRiemannSums(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    const b = randInt(1, 5);
    return makeProblem({
      topic: 'Riemann Sums', week: 8, difficulty,
      instruction: `Approximate the area under the curve using Riemann sums and express the exact area as a limit.`,
      parts: [
        { letter: 'a', points: 3, content: `Approximate $\\displaystyle\\int_0^${a} x^2\\, dx$ using $n = 4$ subintervals and right endpoints.` },
        { letter: 'b', points: 4, content: `Write the exact value as $\\displaystyle\\lim_{n\\to\\infty}\\sum_{i=1}^n f(x_i)\\Delta x$ and evaluate.` },
        { letter: 'c', points: 3, content: `Verify using the Fundamental Theorem of Calculus.` }
      ],
      solution: {
        answer: `Approximation with n=4 for interval [0, ${a}]: sum of f(x_i*)Δx. Exact value: ${a}³/3.`,
        steps: [
          { title: 'Set Up Right Riemann Sum', math: `\\[\\Delta x = \\frac{${a}}{4},\\ x_i = \\frac{${a}i}{4}\\]` },
          { title: 'Evaluate Sum', math: `\\[S_4 = \\sum_{i=1}^{4}\\left(\\frac{${a}i}{4}\\right)^2 \\cdot \\frac{${a}}{4}\\]` },
          { title: 'Limit Form', math: `\\[\\lim_{n\\to\\infty}\\sum_{i=1}^n \\left(\\frac{${a}i}{n}\\right)^2 \\frac{${a}}{n} = \\frac{${a}^3}{3}\\]` }
        ]
      },
      theorems: ['Riemann sum definition of integral', 'Sum formulas: Σi, Σi²', 'FTC verification'],
      mistakes: ['Wrong Δx', 'Using wrong endpoint rule'],
      related: ['definite-integrals', 'fundamental-theorem']
    });
  }
  function genDefiniteIntegrals(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 4);
    const b = randInt(2, 6);
    return makeProblem({
      topic: 'Definite Integrals', week: 8, difficulty,
      instruction: `Evaluate the definite integrals using the Fundamental Theorem of Calculus.`,
      parts: [
        { letter: 'a', points: 3, content: `$\\displaystyle\\int_${a}^${b} (3x^2 - 2x + 1)\\, dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int_0^{\\pi/2} \\sin x\\, dx$` },
        { letter: 'c', points: 4, content: `$\\displaystyle\\int_1^e \\dfrac{1}{x}\\, dx$` }
      ],
      solution: {
        answer: `Apply FTC: evaluate antiderivative at endpoints and subtract.`,
        steps: [
          { title: 'Find Antiderivative (a)', math: `\\[x^3 - x^2 + x\\]` },
          { title: 'Evaluate at Limits', math: `\\[\\left[x^3 - x^2 + x\\right]_${a}^${b}\\]` },
          { title: 'Trig Integral', math: `\\[\\int_0^{\\pi/2}\\sin x\\, dx = [-\\cos x]_0^{\\pi/2} = 1\\]` },
          { title: 'Log Integral', math: `\\[\\int_1^e \\frac{1}{x}dx = [\\ln x]_1^e = 1\\]` }
        ]
      },
      theorems: ['FTC Part 2', 'Definite integral properties'],
      mistakes: ['Forgetting to subtract lower limit value', 'Sign errors with trig'],
      related: ['fundamental-theorem', 'riemann-sums']
    });
  }
  function genFundamentalTheorem(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(2, 5);
    return makeProblem({
      topic: 'Fundamental Theorem', week: 8, difficulty,
      instruction: `Apply the Fundamental Theorem of Calculus (both parts).`,
      parts: [
        { letter: 'a', points: 4, content: `Find $\\dfrac{d}{dx}\\displaystyle\\int_${a}^x \\sqrt{t^2 + 1}\\, dt$.` },
        { letter: 'b', points: 3, content: `Find $\\dfrac{d}{dx}\\displaystyle\\int_0^{x^2} e^{t}\\, dt$ using the chain rule with FTC.` },
        { letter: 'c', points: 3, content: `Evaluate $\\displaystyle\\int_1^${a} \\dfrac{1}{t}\\, dt$ using FTC Part 2.` }
      ],
      solution: {
        answer: `(a) √(x²+1). (b) 2x·e^(x²). (c) ln(${a}).`,
        steps: [
          { title: 'FTC Part 1 (a)', math: `\\[\\frac{d}{dx}\\int_${a}^x\\sqrt{t^2+1}dt = \\sqrt{x^2+1}\\]` },
          { title: 'FTC + Chain Rule (b)', math: `\\[\\frac{d}{dx}\\int_0^{x^2}e^t dt = e^{x^2}\\cdot 2x\\]` },
          { title: 'FTC Part 2 (c)', math: `\\[\\int_1^${a}\\frac{1}{t}dt = \\ln(${a}) - \\ln(1) = \\ln(${a})\\]` }
        ]
      },
      theorems: ['FTC Part 1: d/dx ∫ₐˣ f(t)dt = f(x)', 'FTC Part 2: ∫ₐᵇ f = F(b) − F(a)', 'Chain rule with variable limits'],
      mistakes: ['Forgetting chain rule when upper limit is a function', 'Sign errors with a lower limit variable'],
      related: ['definite-integrals', 'riemann-sums']
    });
  }
  function genImproperIntegrals(difficulty) {
    const d = difficulty || 'intermediate';
    const p = randInt(1, 4);
    return makeProblem({
      topic: 'Improper Integrals', week: 8, difficulty,
      instruction: `Determine whether the improper integral converges or diverges. If it converges, find its value.`,
      parts: [
        { letter: 'a', points: 4, content: `$\\displaystyle\\int_1^{\\infty} \\dfrac{1}{x^{${p}}}\\ dx$` },
        { letter: 'b', points: 3, content: `$\\displaystyle\\int_0^1 \\dfrac{1}{\\sqrt{x}}\\ dx$` },
        { letter: 'c', points: 3, content: `$\\displaystyle\\int_1^{\\infty} \\dfrac{\\ln x}{x}\\ dx$` }
      ],
      solution: {
        answer: `(a) Converges iff p > 1. For p=${p}: ${p > 1 ? 'converges to 1/(p−1)' : 'diverges'}. (b) Converges to 2. (c) Diverges.`,
        steps: [
          { title: 'Rewrite as Limit (a)', math: `\\[\\lim_{t\\to\\infty}\\int_1^t x^{-${p}}dx = \\lim_{t\\to\\infty}\\left[\\frac{x^{1-${p}}}{1-${p}}\\right]_1^t\\]` },
          { title: 'p-Integral Test', explanation: `Converges if p > 1, diverges if p ≤ 1.` },
          { title: 'Type II (b)', math: `\\[\\lim_{a\\to 0^+}\\int_a^1 x^{-1/2}dx = \\lim_{a\\to 0^+}[2\\sqrt{x}]_a^1 = 2\\]` },
          { title: 'Log Integral (c)', math: `\\[\\int_1^\\infty \\frac{\\ln x}{x}dx = \\lim_{t\\to\\infty}\\left[\\frac{(\\ln x)^2}{2}\\right]_1^t = \\infty\\]` }
        ]
      },
      theorems: ['p-integral test: ∫₁^∞ 1/x^p converges iff p > 1', 'Comparison test', 'Type I and Type II improper integrals'],
      mistakes: ['Not converting to a limit', 'Wrong p condition'],
      related: ['definite-integrals', 'fundamental-theorem']
    });
  }
  function genAreaBetweenCurves(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(-3, 0);
    const b = randInt(1, 4);
    return makeProblem({
      topic: 'Area Between Curves', week: 9, difficulty,
      instruction: `Find the area of the region bounded by the given curves.`,
      parts: [
        { letter: 'a', points: 4, content: `$y = x^2$ and $y = ${b}x$. Find intersection points and the area between them.` },
        { letter: 'b', points: 3, content: `Sketch the region and label the integration limits.` },
        { letter: 'c', points: 3, content: `Set up and evaluate the integral $\\displaystyle\\int_a^b (\\text{top} - \\text{bottom})\\, dx$.` }
      ],
      solution: {
        answer: `Intersections at x = 0 and x = ${b}. Area = ${b}³/6.`,
        steps: [
          { title: 'Find Intersections', math: `\\[x^2 = ${b}x \\implies x = 0, ${b}\\]` },
          { title: 'Set Up Integral', math: `\\[A = \\int_0^${b} (${b}x - x^2)\\, dx\\]` },
          { title: 'Evaluate', math: `\\[A = \\left[\\frac{${b}x^2}{2} - \\frac{x^3}{3}\\right]_0^${b} = \\frac{${b}^3}{6}\\]` }
        ]
      },
      theorems: ['Area between curves formula', 'Intersection points as limits'],
      mistakes: ['Wrong top/bottom assignment', 'Missing sign change'],
      related: ['volumes', 'riemann-sums']
    });
  }
  function genVolumes(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 3);
    const b = randInt(2, 5);
    return makeProblem({
      topic: 'Volumes of Solids', week: 9, difficulty,
      instruction: `Find the volume of the solid generated by revolving the region about the specified axis.`,
      parts: [
        { letter: 'a', points: 4, content: `Region: $y = \\sqrt{x}$, $x = ${a}$, $x = ${b}$, $y = 0$. Revolving about the $x$-axis. Use the disk method.` },
        { letter: 'b', points: 3, content: `Same region, revolving about $y = -1$. Use the washer method.` },
        { letter: 'c', points: 3, content: `Region: $y = x - x^2$ on $[0, 1]$, revolving about the $y$-axis. Use shells.` }
      ],
      solution: {
        answer: `Disk: V = π∫x dx = π(${b}²−${a}²)/2. Washer adjusts for offset. Shells: 2π∫x(x−x²)dx.`,
        steps: [
          { title: 'Disk Method', math: `\\[V = \\pi\\int_${a}^${b} (\\sqrt{x})^2 dx = \\pi\\left[\\frac{x^2}{2}\\right]_${a}^${b}\\]` },
          { title: 'Washer Method', math: `\\[V = \\pi\\int_${a}^${b} [(\\sqrt{x}+1)^2 - 1^2] dx\\]` },
          { title: 'Shells Method', math: `\\[V = 2\\pi\\int_0^1 x(x - x^2)\\, dx = 2\\pi\\left[\\frac{x^3}{3} - \\frac{x^4}{4}\\right]_0^1 = \\frac{\\pi}{6}\\]` }
        ]
      },
      theorems: ['Disk/washer/shell methods', 'Volume of revolution'],
      mistakes: ['Wrong radius expression', 'Forgetting square in disk/washer'],
      related: ['area-between-curves', 'arc-length']
    });
  }
  function genArcLength(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 4);
    return makeProblem({
      topic: 'Arc Length', week: 9, difficulty,
      instruction: `Find the arc length of the curve on the given interval.`,
      parts: [
        { letter: 'a', points: 4, content: `$y = \\dfrac{2}{3}x^{3/2}$ on $[0, ${a}]$.` },
        { letter: 'b', points: 3, content: `Set up the integral $\\displaystyle\\int_a^b \\sqrt{1 + [f'(x)]^2}\\, dx$.` },
        { letter: 'c', points: 3, content: `Evaluate using u-substitution.` }
      ],
      solution: {
        answer: `L = ∫√(1+x)dx on [0, ${a}]. After substitution, L = (2/3)[(1+${a})^{3/2} − 1].`,
        steps: [
          { title: 'Compute f\'(x)', math: `\\[f(x) = \\frac{2}{3}x^{3/2} \\implies f'(x) = \\sqrt{x}\\]` },
          { title: 'Arc Length Integral', math: `\\[L = \\int_0^${a} \\sqrt{1 + x}\\, dx\\]` },
          { title: 'Substitute u = 1 + x', math: `\\[L = \\int_1^{1+${a}} \\sqrt{u}\\, du = \\frac{2}{3}\\left[(1+${a})^{3/2} - 1\\right]\\]` }
        ]
      },
      theorems: ['Arc length formula: L = ∫√(1+f\'²)dx', 'Parametric arc length'],
      mistakes: ['Forgetting square inside the radical', 'Not differentiating correctly'],
      related: ['surface-area', 'volumes']
    });
  }
  function genSurfaceArea(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 4);
    return makeProblem({
      topic: 'Surface Area', week: 9, difficulty,
      instruction: `Find the surface area of the solid generated by revolving the curve about the $x$-axis.`,
      parts: [
        { letter: 'a', points: 4, content: `Curve: $y = \\sqrt{x}$ on $[${a}, ${a+3}]$. Revolve about the $x$-axis.` },
        { letter: 'b', points: 3, content: `Set up the integral $\\displaystyle\\int 2\\pi y\\, ds$.` },
        { letter: 'c', points: 3, content: `Evaluate and simplify.` }
      ],
      solution: {
        answer: `S = 2π∫√x·√(1+1/(4x))dx = π∫√(4x+1)dx.`,
        steps: [
          { title: 'Arc Element ds', math: `\\[ds = \\sqrt{1 + \\left(\\frac{1}{2\\sqrt{x}}\\right)^2} dx = \\sqrt{\\frac{4x+1}{4x}} dx\\]` },
          { title: 'Surface Integral', math: `\\[S = \\int_${a}^${a+3} 2\\pi \\sqrt{x} \\cdot \\sqrt{\\frac{4x+1}{4x}} dx = \\pi\\int_${a}^${a+3}\\sqrt{4x+1} dx\\]` },
          { title: 'u-Substitution', math: `\\[u = 4x+1, \\quad S = \\frac{\\pi}{6}\\left[(4x+1)^{3/2}\\right]_${a}^${a+3}\\]` }
        ]
      },
      theorems: ['Surface area formula: S = ∫2πy ds', 'Revolving about x-axis or y-axis'],
      mistakes: ['Forgetting the 2π factor', 'Wrong arc element ds'],
      related: ['arc-length', 'volumes']
    });
  }
  function genComplexNumbers(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 5);
    const b = randInt(1, 5);
    const c = randInt(1, 5);
    const dd = randInt(1, 5);
    return makeProblem({
      topic: 'Complex Numbers', week: 10, difficulty,
      instruction: `Perform the given operations on complex numbers. Write all answers in $a + bi$ form.`,
      parts: [
        { letter: 'a', points: 3, content: `Compute $(${a} + ${b}i) + (${c} - ${dd}i)$ and $(${a} + ${b}i)(${c} - ${dd}i)$.` },
        { letter: 'b', points: 4, content: `Compute $\\dfrac{${a} + ${b}i}{${c} - ${dd}i}$ by multiplying numerator and denominator by the conjugate.` },
        { letter: 'c', points: 3, content: `Find $|${a} + ${b}i|$ and the conjugate $\\overline{${a} + ${b}i}$.` }
      ],
      solution: {
        answer: `Sum: (${a+c}) + (${b-d})i. Product uses i²=−1. Division multiplies by conjugate.`,
        steps: [
          { title: 'Addition', math: `\\[(${a}+${b}i)+(${c}-${dd}i) = ${a+c} + ${b-dd}i\\]` },
          { title: 'Multiplication', math: `\\[(${a}+${b}i)(${c}-${dd}i) = ${a*c + b*dd} + ${b*c - a*dd}i\\]` },
          { title: 'Division', math: `\\[\\frac{${a}+${b}i}{${c}-${dd}i} \\cdot \\frac{${c}+${dd}i}{${c}+${dd}i} = \\frac{(${a}+${b}i)(${c}+${dd}i)}{${c*c + dd*dd}}\\]` },
          { title: 'Modulus and Conjugate', math: `\\[|z| = \\sqrt{${a*a + b*b}}, \\quad \\bar{z} = ${a} - ${b}i\\]` }
        ]
      },
      theorems: ['Complex arithmetic', 'Conjugate and modulus properties', 'Division by conjugate'],
      mistakes: ['Forgetting i² = −1', 'Errors in conjugate multiplication'],
      related: ['polar-coordinates']
    });
  }
  function genPolarCoordinates(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 5);
    const b = randInt(1, 5);
    return makeProblem({
      topic: 'Polar Coordinates', week: 10, difficulty,
      instruction: `Convert between Cartesian and polar coordinates and sketch polar curves.`,
      parts: [
        { letter: 'a', points: 3, content: `Convert $(x, y) = (${a}, ${b})$ to polar coordinates $(r, \\theta)$ with $r > 0$ and $0 \\leq \\theta < 2\\pi$.` },
        { letter: 'b', points: 3, content: `Convert $(r, \\theta) = \\left(2, \\dfrac{\\pi}{${a}}\\right)$ to Cartesian coordinates.` },
        { letter: 'c', points: 4, content: `Sketch $r = 1 + \\cos\\theta$ (cardioid) and $r = 2\\cos(2\\theta)$ (4-petal rose).` }
      ],
      solution: {
        answer: `(a) r = √(${a}²+${b}²), θ = arctan(${b}/${a}). (b) x = 2cos(π/${a}), y = 2sin(π/${a}).`,
        steps: [
          { title: 'Cartesian → Polar', math: `\\[r = \\sqrt{${a*a}+${b*b}}, \\quad \\theta = \\arctan\\left(\\frac{${b}}{${a}}\\right)\\]` },
          { title: 'Polar → Cartesian', math: `\\[x = 2\\cos\\left(\\frac{\\pi}{${a}}\\right), \\quad y = 2\\sin\\left(\\frac{\\pi}{${a}}\\right)\\]` },
          { title: 'Sketching Polar Curves', explanation: 'Cardioid = heart shape. Rose with even n = 2n petals.' }
        ]
      },
      theorems: ['x = r cos θ, y = r sin θ', 'r² = x² + y²', 'Symmetry tests for polar graphs'],
      mistakes: ['Forgetting quadrant for θ', 'Mixing up r and θ conversions'],
      related: ['polar-graphing', 'complex-numbers']
    });
  }
  function genPolarGraphing(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 3);
    return makeProblem({
      topic: 'Graphing Polar Equations', week: 10, difficulty,
      instruction: `Identify the type of polar curve, determine the number of petals or lobes, and sketch it.`,
      parts: [
        { letter: 'a', points: 3, content: `Sketch $r = ${a}\\cos(2\\theta)$. How many petals? What are the extreme points?` },
        { letter: 'b', points: 3, content: `Sketch $r = 1 + \\sin\\theta$. What type of curve is this?` },
        { letter: 'c', points: 4, content: `Sketch $r^2 = ${a*a}\\cos(2\\theta)$. What type of curve is this?` }
      ],
      solution: {
        answer: `(a) 4-petal rose with max |r|=${a}. (b) Cardioid pointing up. (c) Lemniscate (figure-eight).`,
        steps: [
          { title: 'Identify Curve Type', explanation: 'r = a cos(nθ) with n even → 2n petals. Cardioid: r = a ± a cos θ or sin θ.' },
          { title: 'Find Extreme Points', math: `\\[r = ${a}\\cos(2\\theta): r_{max} = ${a} \\text{ at } \\theta = 0, \\pi\\]` },
          { title: 'Sketch', explanation: 'Plot points at key θ values and connect smoothly.' }
        ]
      },
      theorems: ['Classification of polar curves', 'Symmetry in polar graphs'],
      mistakes: ['Miscounting petals', 'Forgetting lemniscate requires r² ≥ 0'],
      related: ['polar-coordinates', 'polar-integration']
    });
  }
  function genPolarIntegration(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 3);
    return makeProblem({
      topic: 'Integration in Polar', week: 10, difficulty,
      instruction: `Find the area of the region described in polar coordinates.`,
      parts: [
        { letter: 'a', points: 4, content: `Find the area enclosed by the cardioid $r = 1 + \\cos\\theta$.` },
        { letter: 'b', points: 3, content: `Find the area of one petal of the rose $r = \\cos(2\\theta)$.` },
        { letter: 'c', points: 3, content: `Find the area inside $r = 2$ and outside $r = 1 + \\cos\\theta$.` }
      ],
      solution: {
        answer: `(a) A = 3π/2. (b) A = π/8. (c) A = 5π/2.`,
        steps: [
          { title: 'Polar Area Formula', math: `\\[A = \\int_{\\alpha}^{\\beta} \\frac{1}{2} r^2\\, d\\theta\\]` },
          { title: 'Cardioid', math: `\\[A = \\frac{1}{2}\\int_0^{2\\pi} (1+\\cos\\theta)^2 d\\theta = \\frac{3\\pi}{2}\\]` },
          { title: 'Rose Petal', math: `\\[A = \\frac{1}{2}\\int_{-\\pi/4}^{\\pi/4}\\cos^2(2\\theta)d\\theta = \\frac{\\pi}{8}\\]` },
          { title: 'Between Curves', math: `\\[A = \\frac{1}{2}\\int_0^{2\\pi} (4 - (1+\\cos\\theta)^2)d\\theta = \\frac{5\\pi}{2}\\]` }
        ]
      },
      theorems: ['Area in polar: ∫(1/2)r²dθ', 'Area between polar curves', 'Symmetry in polar integration'],
      mistakes: ['Forgetting 1/2 factor', 'Wrong limits for petal symmetry'],
      related: ['polar-coordinates', 'polar-graphing']
    });
  }
  function genPolarArcLength(difficulty) {
    const d = difficulty || 'intermediate';
    const a = randInt(1, 2);
    return makeProblem({
      topic: 'Polar Arc Length', week: 10, difficulty,
      instruction: `Find the arc length of the polar curve on the given interval.`,
      parts: [
        { letter: 'a', points: 4, content: `Find the length of the cardioid $r = 1 + \\cos\\theta$ for $\\theta \\in [0, 2\\pi]$.` },
        { letter: 'b', points: 3, content: `Set up the integral $\\displaystyle\\int_{\\alpha}^{\\beta}\\sqrt{r^2 + (dr/d\\theta)^2}\\, d\\theta$.` },
        { letter: 'c', points: 3, content: `Evaluate and simplify.` }
      ],
      solution: {
        answer: `L = 8 for the full cardioid.`,
        steps: [
          { title: 'Compute dr/dθ', math: `\\[r = 1 + \\cos\\theta \\implies \\frac{dr}{d\\theta} = -\\sin\\theta\\]` },
          { title: 'Integrand', math: `\\[\\sqrt{r^2 + (r\')^2} = \\sqrt{(1+\\cos\\theta)^2 + \\sin^2\\theta} = \\sqrt{2 + 2\\cos\\theta} = 2\\left|\\cos\\frac{\\theta}{2}\\right|\\]` },
          { title: 'Integrate with Symmetry', math: `\\[L = 2\\int_0^{\\pi} 2\\cos\\frac{\\theta}{2}d\\theta = 8\\]` }
        ]
      },
      theorems: ['Polar arc length formula', 'Symmetry for integration limits'],
      mistakes: ['Forgetting to compute dr/dθ', 'Not using symmetry properly'],
      related: ['polar-integration', 'arc-length']
    });
  }
  function genFinalReviewMixed(difficulty) {
    const allTopics = Object.keys(TOPIC_META).filter(t => t !== 'final-review-mixed');
    const t = pick(allTopics);
    return generate(t, difficulty || 'hard');
  }
  function genSpecialLimit(subTypes) {
    return genOneSidedLimits('intermediate');
  }
  function genSpecialDerivative(subTypes) {
    return genDifferentiationRules('intermediate');
  }
  function genSpecialIntegral(subTypes) {
    return genIndefiniteIntegrals('intermediate');
  }
  function genSpecialApplication(subTypes) {
    return genOptimization('intermediate');
  }
  function genSpecialPolar(subTypes) {
    return genPolarCoordinates('intermediate');
  }
  function genSpecialTheorem(subTypes) {
    return genMeanValueTheorem('intermediate');
  }
  function genSpecialMixed(subTypes) {
    return genFinalReviewMixed('hard');
  }
  const GENERATORS = {
    'sets-intervals': genSetsIntervals,
    'functions-graphs': genFunctionsGraphs,
    'shifts-scaling': genShiftsScaling,
    'inverse-functions': genInverseFunctions,
    'composition-functions': genComposition,
    'trigonometric-functions': genTrigFunctions,
    'sequences': genSequences,
    'sequence-limits': genSequenceLimits,
    'monotone-sequences': genMonotoneSequences,
    'sandwich-theorem': genSandwichTheorem,
    'one-sided-limits': genOneSidedLimits,
    'continuity': genContinuity,
    'discontinuities': genDiscontinuities,
    'limits-infinity': genLimitsInfinity,
    'growth-rates': genGrowthRates,
    'definition-derivative': genDefinitionDerivative,
    'differentiation-rules': genDifferentiationRules,
    'chain-rule': genChainRule,
    'implicit-diff': genImplicitDiff,
    'parametric-derivatives': genParametricDerivatives,
    'tangents-normals': genTangentsNormals,
    'maxima-minima': genMaximaMinima,
    'mean-value-theorem': genMeanValueTheorem,
    'graphing-derivatives': genGraphingDerivatives,
    'related-rates': genRelatedRates,
    'optimization': genOptimization,
    'lhopitals-rule': genLhopitalsRule,
    'antiderivatives': genAntiderivatives,
    'indefinite-integrals': genIndefiniteIntegrals,
    'basic-integration-formulas': genBasicIntegrationFormulas,
    'substitution': genSubstitution,
    'integration-by-parts': genIntegrationByParts,
    'trig-integrals': genTrigIntegrals,
    'partial-fractions': genPartialFractions,
    'riemann-sums': genRiemannSums,
    'definite-integrals': genDefiniteIntegrals,
    'fundamental-theorem': genFundamentalTheorem,
    'improper-integrals': genImproperIntegrals,
    'area-between-curves': genAreaBetweenCurves,
    'volumes': genVolumes,
    'arc-length': genArcLength,
    'surface-area': genSurfaceArea,
    'complex-numbers': genComplexNumbers,
    'polar-coordinates': genPolarCoordinates,
    'polar-graphing': genPolarGraphing,
    'polar-integration': genPolarIntegration,
    'polar-arc-length': genPolarArcLength,
    'final-review-mixed': genFinalReviewMixed
  };
  function generate(topicKey, difficulty) {
    const gen = GENERATORS[topicKey];
    if (!gen) return null;
    try { return gen(difficulty); } catch (e) { console.error('Generator error:', e); return null; }
  }
  function getMeta(topicKey) { return TOPIC_META[topicKey] || null; }
  function getAllTopics() { return Object.keys(TOPIC_META); }
  return { generate, getMeta, getAllTopics, GENERATORS, TOPIC_META, genSpecialLimit, genSpecialDerivative, genSpecialIntegral, genSpecialApplication, genSpecialPolar, genSpecialTheorem, genSpecialMixed };
})();
const ExamGenerator = (() => {
  const TOPIC_WEIGHTS = {
    'sets-intervals': 1, 'functions-graphs': 1, 'shifts-scaling': 1, 'inverse-functions': 1, 'composition-functions': 1, 'trigonometric-functions': 1,
    'sequences': 2, 'sequence-limits': 2, 'monotone-sequences': 1, 'sandwich-theorem': 1,
    'one-sided-limits': 2, 'continuity': 2, 'discontinuities': 1, 'limits-infinity': 2, 'growth-rates': 1,
    'definition-derivative': 2, 'differentiation-rules': 3, 'chain-rule': 3, 'implicit-diff': 2, 'parametric-derivatives': 1, 'tangents-normals': 2,
    'maxima-minima': 3, 'mean-value-theorem': 2, 'graphing-derivatives': 2, 'related-rates': 2, 'optimization': 2, 'lhopitals-rule': 3,
    'antiderivatives': 2, 'indefinite-integrals': 2, 'basic-integration-formulas': 2, 'substitution': 3,
    'integration-by-parts': 3, 'trig-integrals': 2, 'partial-fractions': 2,
    'riemann-sums': 1, 'definite-integrals': 3, 'fundamental-theorem': 3, 'improper-integrals': 2,
    'area-between-curves': 2, 'volumes': 3, 'arc-length': 2, 'surface-area': 2,
    'complex-numbers': 2, 'polar-coordinates': 2, 'polar-graphing': 1, 'polar-integration': 2, 'polar-arc-length': 1
  };
  function weightedTopics(coverage) {
    let topics = Object.keys(TOPIC_WEIGHTS);
    if (coverage === 'first-half') topics = topics.filter(t => Generators.TOPIC_META[t]?.week <= 5);
    if (coverage === 'second-half') topics = topics.filter(t => Generators.TOPIC_META[t]?.week >= 6);
    const weighted = [];
    for (const t of topics) { for (let i = 0; i < (TOPIC_WEIGHTS[t] || 1); i++) weighted.push(t); }
    return weighted;
  }
  function generateExam({ numQuestions, coverage, difficulty, shuffle }) {
    const pool = weightedTopics(coverage || 'all');
    const usedTopics = new Set();
    const problems = [];
    let attempts = 0;
    while (problems.length < numQuestions && attempts < numQuestions * 8) {
      attempts++;
      const t = pool[Math.floor(Math.random() * pool.length)];
      if (usedTopics.has(t) && usedTopics.size < pool.length * 0.7) continue;
      const prob = Generators.generate(t, difficulty || 'intermediate');
      if (prob) { problems.push({ ...prob, id: Date.now() + problems.length }); usedTopics.add(t); }
    }
    if (shuffle) MathUtils.shuffle(problems);
    return problems;
  }
  return { generateExam };
})();
const ProblemHistory = (() => {
  let history = [];
  const MAX_HISTORY = 20;
  function add(prob) {
    history.unshift({ ...prob, timestamp: Date.now(), id: Date.now() });
    if (history.length > MAX_HISTORY) history.pop();
    render();
  }
  function render() {
    const list = document.getElementById('recent-history-list');
    const empty = document.getElementById('recent-history-empty');
    if (!list) return;
    if (history.length === 0) { if (empty) empty.style.display = ''; return; }
    if (empty) empty.style.display = 'none';
    const items = history.slice(0, 8).map(p => `
      <li style="padding:var(--space-2) var(--space-4);border-bottom:1px solid var(--border);cursor:pointer;" data-history-id="${p.id}" title="Click to recall">
        <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-primary);margin-bottom:2px;">${p.topic || '—'}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">${p.week ? 'Week ' + p.week : ''} · ${p.difficulty || ''}</div>
      </li>`).join('');
    list.innerHTML = items;
  }
  function get() { return history; }
  return { add, render, get };
})();
const ProblemDisplay = (() => {
  let currentProblem = null;
  let solutionVisible = false;
  let timerInterval = null;
  let timerSeconds = 0;
  let timerPaused = false;
  function setCurrentProblem(prob) {
    currentProblem = prob;
    solutionVisible = false;
    timerSeconds = 0;
  }
  function show(prob) {
    if (!prob) return;
    setCurrentProblem(prob);
    renderProblem(prob);
    hideSolution();
    if (StorageManager.get('examMode', 'practice') === 'timed') startTimer();
    scrollTo('problem-display');
  }
  function renderProblem(prob) {
    const content = document.getElementById('problem-content');
    const emptyState = document.getElementById('problem-empty-state');
    if (emptyState) { emptyState.setAttribute('aria-hidden', 'true'); emptyState.style.display = 'none'; }
    if (content) { content.setAttribute('aria-hidden', 'false'); content.style.display = ''; }
    const instrEl = document.getElementById('problem-instructions-text');
    if (instrEl) instrEl.textContent = prob.instruction || '';
    const metaTopic = document.getElementById('problem-meta-topic');
    const metaWeek = document.getElementById('problem-meta-week');
    const metaDiff = document.getElementById('problem-meta-difficulty');
    const metaPts = document.getElementById('problem-meta-points');
    if (metaTopic) metaTopic.textContent = prob.topic || '';
    if (metaWeek) metaWeek.textContent = prob.week ? `Week ${prob.week}` : '';
    if (metaDiff) metaDiff.textContent = prob.difficulty || '';
    if (metaPts) { const total = (prob.parts || []).reduce((s, p) => s + (p.points || 0), 0); metaPts.textContent = total ? `${total} pts` : ''; }
    const partLetters = ['a', 'b', 'c', 'd'];
    const numParts = (prob.parts || []).length;
    partLetters.forEach((letter, idx) => {
      const partEl = document.getElementById(`problem-part-${letter}`);
      if (!partEl) return;
      if (idx < numParts) {
        partEl.style.display = '';
        const part = prob.parts[idx];
        const ptsEl = document.getElementById(`part-${letter}-points`);
        const mathEl = document.getElementById(`part-${letter}-math`);
        const matrixEl = document.getElementById(`part-${letter}-matrix`);
        const augEl = document.getElementById(`part-${letter}-augmented`);
        const vecEl = document.getElementById(`part-${letter}-vector`);
        const figEl = document.getElementById(`part-${letter}-figure`);
        if (ptsEl) ptsEl.textContent = part.points ? `(${part.points} pts)` : '';
        if (mathEl) MathRenderer.setHTML(mathEl, part.content || '');
        if (matrixEl) matrixEl.style.display = 'none';
        if (augEl) augEl.style.display = 'none';
        if (vecEl) vecEl.style.display = 'none';
        if (figEl) figEl.style.display = 'none';
      } else {
        partEl.style.display = 'none';
      }
    });
    const numPtsSelect = document.getElementById('num-questions-select');
    const maxParts = numPtsSelect ? parseInt(numPtsSelect.value) : 3;
    partLetters.forEach((letter, idx) => {
      const partEl = document.getElementById(`problem-part-${letter}`);
      if (partEl && idx >= maxParts) partEl.style.display = 'none';
    });
    const problemSection = document.getElementById('problem-display');
    MathRenderer.render(problemSection);
  }
  function showSolution() {
    if (!currentProblem) return;
    solutionVisible = true;
    StatsManager.incrementViewed();
    const content = document.getElementById('solution-content');
    const revealBtn = document.getElementById('reveal-solution-btn');
    if (content) content.setAttribute('aria-hidden', 'false');
    if (revealBtn) {
      revealBtn.innerHTML = '<span class="action-btn__icon" aria-hidden="true">👁</span><span class="action-btn__text">Hide Solution</span>';
      revealBtn.setAttribute('aria-expanded', 'true');
    }
    renderSolution(currentProblem.solution, currentProblem.theorems, currentProblem.mistakes, currentProblem.related);
    scrollTo('solution-area');
  }
  function hideSolution() {
    solutionVisible = false;
    const content = document.getElementById('solution-content');
    const revealBtn = document.getElementById('reveal-solution-btn');
    if (content) content.setAttribute('aria-hidden', 'true');
    if (revealBtn) {
      revealBtn.innerHTML = '<span class="action-btn__icon" aria-hidden="true">👁</span><span class="action-btn__text">Show Solution</span>';
      revealBtn.setAttribute('aria-expanded', 'false');
    }
  }
  function toggleSolution() {
    if (solutionVisible) hideSolution();
    else showSolution();
  }
  function renderSolution(solution, theorems, mistakes, related) {
    if (!solution) return;
    const answerEl = document.getElementById('solution-answer-math');
    if (answerEl) MathRenderer.setHTML(answerEl, solution.answer || '');
    const answerMatrixEl = document.getElementById('solution-answer-matrix');
    if (answerMatrixEl) answerMatrixEl.style.display = 'none';
    const answerVectorEl = document.getElementById('solution-answer-vector');
    if (answerVectorEl) answerVectorEl.style.display = 'none';
    const stepsList = document.getElementById('solution-steps-list');
    if (stepsList && solution.steps) {
      stepsList.innerHTML = solution.steps.map((step, i) => `
        <li class="solution-step" data-step="${i+1}">
          <div class="solution-step__header">
            <span class="solution-step__number">${i+1}</span>
            <span class="solution-step__title">${step.title || ''}</span>
          </div>
          <div class="solution-step__body">
            ${step.explanation ? `<p class="solution-step__explanation">${step.explanation}</p>` : ''}
            ${step.math ? `<div class="math-content solution-step__math">${step.math}</div>` : ''}
          </div>
        </li>`).join('');
    }
    const theoryBody = document.getElementById('solution-theory-body');
    if (theoryBody && theorems && theorems.length) {
      theoryBody.innerHTML = theorems.map(t => `
        <div class="theory-box">
          <div class="theory-box__tag">Theorem / Definition</div>
          <div class="theory-box__statement math-content">${t}</div>
        </div>`).join('');
    } else if (theoryBody) theoryBody.innerHTML = '<p style="color:var(--text-muted);font-size:var(--text-sm);">No specific theorems listed for this problem.</p>';
    const mistakesList = document.getElementById('solution-mistakes-list');
    if (mistakesList && mistakes && mistakes.length) {
      mistakesList.innerHTML = mistakes.map(m => `<li>${m}</li>`).join('');
    } else if (mistakesList) mistakesList.innerHTML = '<li style="color:var(--text-muted);">No specific mistakes listed.</li>';
    const relatedEl = document.getElementById('solution-related-suggestions');
    if (relatedEl && related && related.length) {
      relatedEl.innerHTML = related.map(r => {
        const meta = Generators.getMeta(r);
        return meta ? `<button class="action-btn action-btn--ghost" data-topic="${r}" style="font-size:var(--text-xs);">${meta.name}</button>` : '';
      }).join('');
    }
    const solutionSection = document.getElementById('solution-area');
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([solutionSection]).catch(err => console.warn('[MathJax]', err));
    } else {
      MathRenderer.render(solutionSection);
    }
  }
  function startTimer() {
    stopTimer();
    timerSeconds = 0; timerPaused = false;
    const timerEl = document.getElementById('problem-timer');
    if (timerEl) timerEl.removeAttribute('hidden');
    timerInterval = setInterval(() => {
      if (!timerPaused) {
        timerSeconds++;
        updateTimerDisplay();
      }
    }, 1000);
  }
  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }
  function toggleTimer() {
    timerPaused = !timerPaused;
    const btn = document.getElementById('timer-pause-btn');
    if (btn) btn.textContent = timerPaused ? '▶' : '⏸';
  }
  function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const s = (timerSeconds % 60).toString().padStart(2, '0');
    display.textContent = `${m}:${s}`;
  }
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function getCurrentProblem() { return currentProblem; }
  function isSolutionVisible() { return solutionVisible; }
  return { show, showSolution, hideSolution, toggleSolution, renderSolution, getCurrentProblem, isSolutionVisible, startTimer, stopTimer, toggleTimer };
})();
const ExamMode = (() => {
  let examProblems = [];
  let examTimerInterval = null;
  let examTimeRemaining = 6000;
  let examTimerPaused = false;
  let solutionsRevealed = false;
  function generateExam() {
    const numQ = parseInt(document.querySelector('input[name="exam-length"]:checked')?.value || '20');
    const coverage = document.querySelector('input[name="exam-coverage"]:checked')?.value || 'all';
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'intermediate';
    const timed = document.getElementById('exam-timed-mode')?.checked;
    const shouldShuffle = document.getElementById('exam-shuffle')?.checked;
    examProblems = ExamGenerator.generateExam({ numQuestions: numQ, coverage, difficulty, shuffle: shouldShuffle });
    renderExamPaper(numQ, timed);
    if (timed) startExamTimer(6000);
  }
  function renderExamPaper(numQ, timed) {
    const empty = document.getElementById('exam-paper-empty');
    const list = document.getElementById('exam-problems-list');
    const scoreGrid = document.getElementById('exam-score-grid');
    const timerBar = document.getElementById('exam-timer-bar');
    const solutions = document.getElementById('exam-solutions');
    if (empty) empty.style.display = 'none';
    if (list) { list.removeAttribute('hidden'); list.innerHTML = ''; }
    if (solutions) solutions.setAttribute('hidden', '');
    solutionsRevealed = false;
    if (scoreGrid && numQ > 0) {
      scoreGrid.removeAttribute('hidden');
      const table = scoreGrid.querySelector('table');
      if (table) {
        const thead = table.querySelector('thead tr') || table.createTHead().insertRow(0);
        const tbody = table.querySelector('tbody tr') || table.createTBody().insertRow(0);
        thead.innerHTML = '<th>Q</th>' + Array.from({length:Math.min(numQ, 20)}, (_,i)=>`<th>${i+1}</th>`).join('') + (numQ>20?`<th>+${numQ-20}</th>`:'') + '<th>Total</th>';
        tbody.innerHTML = '<td>Pts</td>' + Array.from({length:Math.min(numQ, 20)}, ()=>'<td></td>').join('') + (numQ>20?'<td></td>':'') + '<td></td>';
      }
    }
    if (list) {
      examProblems.forEach((prob, idx) => {
        const li = document.createElement('li');
        li.className = 'exam-problem';
        li.dataset.problemNum = idx + 1;
        li.dataset.topic = prob.topic || '';
        const pts = (prob.parts || []).reduce((s, p) => s + (p.points || 0), 0);
        li.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3);">
            <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--secondary);">${prob.topic || ''} · Week ${prob.week || ''}</span>
            <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--accent);background:var(--accent-dim);padding:2px 8px;border-radius:var(--radius-full);">${pts} pts</span>
          </div>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4);">${prob.instruction || ''}</p>
          ${(prob.parts || []).map((p, pi) => `
            <div style="margin-bottom:var(--space-3);padding:var(--space-3);background:var(--bg-elevated);border-radius:var(--radius-md);">
              <strong style="font-size:var(--text-xs);color:var(--primary);">(${['a','b','c','d'][pi]})</strong>
              <div class="math-content" style="margin-top:var(--space-2);">${p.content || ''}</div>
            </div>`).join('')}
          <div class="exam-problem__work-space">Work space</div>`;
        list.appendChild(li);
      });
    }
    const dlBtn = document.getElementById('download-exam-pdf-btn');
    if (dlBtn) dlBtn.removeAttribute('disabled');
    if (timed && timerBar) timerBar.removeAttribute('hidden');
    else if (timerBar) timerBar.setAttribute('hidden', '');
    MathRenderer.render(document.getElementById('exam-paper'));
    setTimeout(() => { document.getElementById('exam-paper').scrollIntoView({ behavior: 'smooth' }); }, 200);
  }
  function startExamTimer(seconds) {
    examTimeRemaining = seconds;
    examTimerPaused = false;
    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = setInterval(() => {
      if (!examTimerPaused) {
        examTimeRemaining--;
        updateExamTimerDisplay();
        if (examTimeRemaining <= 0) { clearInterval(examTimerInterval); ToastManager.show('Time is up!', 'warning', 5000); }
      }
    }, 1000);
  }
  function toggleExamTimer() {
    examTimerPaused = !examTimerPaused;
    const btn = document.getElementById('exam-timer-pause-btn');
    if (btn) btn.textContent = examTimerPaused ? '▶' : '⏸';
  }
  function updateExamTimerDisplay() {
    const display = document.getElementById('exam-timer-display');
    const fill = document.getElementById('exam-timer-fill');
    if (!display) return;
    const h = Math.floor(examTimeRemaining / 3600).toString().padStart(1, '0');
    const m = Math.floor((examTimeRemaining % 3600) / 60).toString().padStart(2, '0');
    const s = (examTimeRemaining % 60).toString().padStart(2, '0');
    display.textContent = `${h}:${m}:${s}`;
    if (fill) fill.style.width = `${(examTimeRemaining / 6000) * 100}%`;
  }
  function revealAllSolutions() {
    if (!examProblems.length) return;
    solutionsRevealed = true;
    const solutionsEl = document.getElementById('exam-solutions');
    const solutionsBody = document.getElementById('exam-solutions-body');
    if (!solutionsEl || !solutionsBody) return;
    solutionsEl.removeAttribute('hidden');
    solutionsBody.innerHTML = examProblems.map((prob, idx) => `
      <div style="padding:var(--space-5);background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:var(--space-4);">
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--primary);margin-bottom:var(--space-2);">Problem ${idx+1}: ${prob.topic || ''}</div>
        <div style="font-size:var(--text-sm);color:var(--accent);font-weight:600;margin-bottom:var(--space-3);">${prob.solution?.answer || ''}</div>
        ${(prob.solution?.steps || []).slice(0, 2).map((s) => `
          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-2);">
            <strong>${s.title}:</strong> ${s.explanation || ''}
            <div class="math-content">${s.math || ''}</div>
          </div>`).join('')}
      </div>`).join('');
    MathRenderer.render(solutionsBody);
  }
  return { generateExam, toggleExamTimer, revealAllSolutions };
})();
const WeekModules = (() => {
  const WEEK_TOPIC_MAP = {
    1: { 'set-ops': 'sets-intervals', 'interval': 'sets-intervals', 'domain-range': 'functions-graphs', 'even-odd': 'functions-graphs', 'shifts': 'shifts-scaling', 'scaling': 'shifts-scaling', 'inverse': 'inverse-functions', 'composition': 'composition-functions', 'trig-identities': 'trigonometric-functions', 'inverse-trig': 'trigonometric-functions' },
    2: { 'seq-convergence': 'sequences', 'seq-limit-compute': 'sequence-limits', 'monotone': 'monotone-sequences', 'limit-function': 'sandwich-theorem', 'sandwich': 'sandwich-theorem', 'epsilon-delta': 'sequence-limits' },
    3: { 'one-sided': 'one-sided-limits', 'continuity': 'continuity', 'discontinuity': 'discontinuities', 'ivt': 'continuity', 'asymptote': 'limits-infinity', 'limits-infinity': 'limits-infinity', 'growth': 'growth-rates', 'equivalent': 'growth-rates' },
    4: { 'def-derivative': 'definition-derivative', 'power-rule': 'differentiation-rules', 'chain-rule': 'chain-rule', 'trig-deriv': 'differentiation-rules', 'exp-log-deriv': 'differentiation-rules', 'implicit': 'implicit-diff', 'higher-order': 'differentiation-rules', 'parametric': 'parametric-derivatives', 'tangent-normal': 'tangents-normals' },
    5: { 'extrema': 'maxima-minima', 'mvt': 'mean-value-theorem', 'rolle': 'mean-value-theorem', 'graphing': 'graphing-derivatives', 'inflection': 'graphing-derivatives', 'related-rates': 'related-rates', 'optimization': 'optimization', 'lhopital': 'lhopitals-rule' },
    6: { 'antiderivative': 'antiderivatives', 'indefinite': 'indefinite-integrals', 'power-rule-int': 'basic-integration-formulas', 'trig-int': 'basic-integration-formulas', 'exp-log-int': 'basic-integration-formulas', 'u-sub': 'substitution', 'trig-sub': 'substitution' },
    7: { 'by-parts': 'integration-by-parts', 'by-parts-repeat': 'integration-by-parts', 'trig-integrals': 'trig-integrals', 'trig-mixed': 'trig-integrals', 'partial-fractions': 'partial-fractions', 'long-division': 'partial-fractions' },
    8: { 'riemann': 'riemann-sums', 'definite-basic': 'definite-integrals', 'definite-sub': 'definite-integrals', 'area-signed': 'definite-integrals', 'ftc-1': 'fundamental-theorem', 'improper-inf': 'improper-integrals', 'improper-disc': 'improper-integrals', 'p-integral': 'improper-integrals' },
    9: { 'area': 'area-between-curves', 'area-y': 'area-between-curves', 'volume-disk': 'volumes', 'volume-washer': 'volumes', 'volume-shell': 'volumes', 'arc-length': 'arc-length', 'surface-area': 'surface-area' },
    10: { 'complex-ops': 'complex-numbers', 'complex-modulus': 'complex-numbers', 'polar-convert': 'polar-coordinates', 'polar-graph': 'polar-graphing', 'polar-area': 'polar-integration', 'polar-length': 'polar-arc-length', 'mixed-all': 'final-review-mixed' }
  };
  function generateForWeek(week) {
    const topicSelect = document.getElementById(`w${week}-topic-select`);
    const diffSelect = document.getElementById(`w${week}-diff-select`);
    const exerciseList = document.getElementById(`week-${week}-exercises-list`);
    if (!topicSelect || !exerciseList) return;
    const subTopic = topicSelect.value;
    const difficulty = diffSelect?.value || 'intermediate';
    const topicKey = WEEK_TOPIC_MAP[week]?.[subTopic] || 'sets-intervals';
    const prob = Generators.generate(topicKey, difficulty);
    if (!prob) { ToastManager.show('Generation failed. Try again.', 'error'); return; }
    StatsManager.incrementGenerated(prob.topic, prob.week, difficulty);
    ProblemHistory.add(prob);
    const card = document.createElement('div');
    card.className = 'problem-part';
    card.style.marginBottom = 'var(--space-4)';
    card.innerHTML = `
      <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--secondary);margin-bottom:var(--space-2);">${prob.topic} · ${difficulty}</div>
      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-3);">${prob.instruction}</p>
      ${(prob.parts || []).map(p => `<div class="math-content" style="margin-bottom:var(--space-2);">${p.content}</div>`).join('')}
      <button class="action-btn action-btn--solution" style="margin-top:var(--space-3);font-size:var(--text-xs);" data-show-sol>Show Solution</button>
      <div class="solution-content" style="display:none;margin-top:var(--space-3);" data-sol-content>
        <div class="solution-answer-box">
          <strong style="color:var(--accent);">Answer:</strong>
          <div class="math-content">${prob.solution?.answer || ''}</div>
        </div>
      </div>`;
    const btn = card.querySelector('[data-show-sol]');
    const solContent = card.querySelector('[data-sol-content]');
    if (btn && solContent) {
      btn.addEventListener('click', () => {
        const visible = solContent.style.display !== 'none';
        solContent.style.display = visible ? 'none' : '';
        btn.textContent = visible ? 'Show Solution' : 'Hide Solution';
        if (!visible) { MathRenderer.render(solContent); StatsManager.incrementViewed(); }
      });
    }
    exerciseList.innerHTML = '';
    exerciseList.appendChild(card);
    MathRenderer.render(exerciseList);
    ToastManager.show(`Week ${week} problem generated!`, 'success', 1800);
  }
  function init() {
    document.querySelectorAll('.week-module__toggle-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        const bodyId = this.getAttribute('aria-controls');
        const body = document.getElementById(bodyId);
        if (body) {
          if (expanded) { body.setAttribute('hidden', ''); this.setAttribute('aria-expanded', 'false'); }
          else { body.removeAttribute('hidden'); this.setAttribute('aria-expanded', 'true'); }
        }
      });
    });
    for (let w = 1; w <= 10; w++) {
      const btn = document.getElementById(`gen-week${w}-btn`);
      if (btn) btn.addEventListener('click', () => generateForWeek(w));
    }
  }
  return { init, generateForWeek };
})();
const SidebarController = (() => {
  let isOpen = false;
  function open() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) { overlay.classList.add('is-active'); overlay.setAttribute('aria-hidden', 'false'); }
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    isOpen = true;
  }
  function close() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) { overlay.classList.remove('is-active'); overlay.setAttribute('aria-hidden', 'true'); }
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    isOpen = false;
  }
  function toggle() { isOpen ? close() : open(); }
  function highlightActiveSection() {
    const sections = document.querySelectorAll('section[id], article[id^="week-"]');
    const navLinks = document.querySelectorAll('.sidebar__nav-link, .sidebar__week-link');
    const scrollY = window.scrollY + 120;
    let activeId = '';
    sections.forEach(sec => { if (sec.offsetTop <= scrollY) activeId = sec.id; });
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('sidebar__nav-link--active', href === `#${activeId}`);
      if (href === `#${activeId}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  function init() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const overlay = document.getElementById('sidebar-overlay');
    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
    document.querySelectorAll('.sidebar__nav-link, .sidebar__week-link').forEach(link => {
      link.addEventListener('click', () => { if (window.innerWidth <= 768) close(); });
    });
    window.addEventListener('scroll', debounce(highlightActiveSection, 80));
    highlightActiveSection();
  }
  return { init, open, close, toggle };
})();
function updateInfoCard(topicKey) {
  const meta = Generators.getMeta(topicKey);
  if (!meta) return;
  const nameEl = document.getElementById('info-card-topic-name');
  const weekEl = document.getElementById('info-card-week-label');
  const descEl = document.getElementById('info-card-deion');
  const conceptsEl = document.getElementById('info-card-key-concepts');
  const sectionEl = document.getElementById('info-card-section');
  if (nameEl) nameEl.textContent = meta.name;
  if (weekEl) weekEl.textContent = meta.week ? `Week ${meta.week}` : '';
  if (descEl) descEl.textContent = meta.desc || '';
  if (conceptsEl) conceptsEl.innerHTML = (meta.concepts || []).map(c => `<li>${c}</li>`).join('');
  if (sectionEl) sectionEl.textContent = meta.section || '';
}
const KeyboardShortcuts = (() => {
  function init() {
    document.addEventListener('keydown', (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      switch (e.key.toLowerCase()) {
        case 'g': e.preventDefault(); document.getElementById('generate-btn')?.click(); break;
        case 't': e.preventDefault(); ThemeManager.toggle(); break;
        case 's': e.preventDefault(); ProblemDisplay.toggleSolution(); break;
        case 'e': e.preventDefault(); document.getElementById('generate-exam-btn')?.click(); break;
        case 'escape': SidebarController.close(); break;
      }
    });
  }
  return { init };
})();
function initBackToTop() {
  const btn = document.getElementById('back-to-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', debounce(() => {
    btn.toggleAttribute('hidden', window.scrollY < 400);
  }, 100));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function initLatexPalette() {
  const placeholders = {
    'limit-basic': '\\lim_{x \\to a} f(x) = L',
    'limit-lhopital': '\\lim_{x \\to a} \\frac{f(x)}{g(x)} \\stackrel{LH}{=} \\lim_{x \\to a} \\frac{f\'(x)}{g\'(x)}',
    'limit-sandwich': 'f(x) \\leq g(x) \\leq h(x) \\implies \\lim g = L',
    'deriv-def': 'f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}',
    'chain-rule': '\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}',
    'implicit': 'x^2 + y^2 = 25 \\implies 2x + 2y\\frac{dy}{dx} = 0',
    'tangent-line': 'y - f(a) = f\'(a)(x - a)',
    'indefinite': '\\int f(x)\\, dx = F(x) + C',
    'definite': '\\int_a^b f(x)\\, dx = F(b) - F(a)',
    'by-parts': '\\int u\\, dv = uv - \\int v\\, du',
    'u-sub': '\\int f(g(x))g\'(x)\\, dx = \\int f(u)\\, du',
    'improper': '\\int_1^{\\infty} \\frac{1}{x^p}\\, dx',
    'area-curves': 'A = \\int_a^b [f(x) - g(x)]\\, dx',
    'volume-disk': 'V = \\pi \\int_a^b [f(x)]^2\\, dx',
    'volume-washer': 'V = \\pi \\int_a^b ([f(x)]^2 - [g(x)]^2)\\, dx',
    'arc-length': 'L = \\int_a^b \\sqrt{1 + [f\'(x)]^2}\\, dx',
    'surface-area': 'S = \\int_a^b 2\\pi f(x) \\sqrt{1 + [f\'(x)]^2}\\, dx',
    'complex-number': 'z = a + bi, \\quad |z| = \\sqrt{a^2 + b^2}',
    'polar-conversion': 'x = r\\cos\\theta, \\quad y = r\\sin\\theta',
    'polar-area': 'A = \\int_{\\alpha}^{\\beta} \\frac{1}{2} r^2\\, d\\theta',
    'polar-arc-length': 'L = \\int_{\\alpha}^{\\beta} \\sqrt{r^2 + (dr/d\\theta)^2}\\, d\\theta',
    'ivt': 'f(a) < N < f(b) \\implies \\exists c: f(c) = N',
    'mvt': 'f\'(c) = \\frac{f(b) - f(a)}{b - a}',
    'ftc': '\\int_a^b f(x)\\, dx = F(b) - F(a)'
  };
  document.querySelectorAll('[data-mathjax-placeholder]').forEach(el => {
    const key = el.dataset.mathjaxPlaceholder;
    if (placeholders[key]) el.innerHTML = `\\[${placeholders[key]}\\]`;
  });
}
const ModalController = (() => {
  function open(title, content) {
    const modal = document.getElementById('problem-modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    if (!modal) return;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) { bodyEl.innerHTML = content; MathRenderer.render(bodyEl); }
    modal.removeAttribute('hidden');
    document.getElementById('modal-close-btn')?.focus();
  }
  function close() {
    const modal = document.getElementById('problem-modal');
    if (modal) modal.setAttribute('hidden', '');
  }
  function init() {
    document.getElementById('modal-close-btn')?.addEventListener('click', close);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', close);
    document.getElementById('modal-backdrop')?.addEventListener('click', close);
  }
  return { init, open, close };
})();
function initUtilityButtons() {
  document.getElementById('copy-problem-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob) { ToastManager.show('No problem to copy.', 'warning'); return; }
    const text = `${prob.topic} — ${prob.instruction}\n\n${(prob.parts || []).map(p => `(${p.letter}) ${p.content}`).join('\n\n')}`;
    navigator.clipboard?.writeText(text).then(() => ToastManager.show('Problem copied!', 'success')).catch(() => ToastManager.show('Copy failed.', 'error'));
  });
  document.getElementById('bookmark-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob) { ToastManager.show('No problem to bookmark.', 'warning'); return; }
    ModalController.open('Bookmark Problem', `<p style="color:var(--text-secondary);margin-bottom:var(--space-4);">Bookmarking: <strong>${prob.topic}</strong></p><p style="color:var(--text-muted);font-size:var(--text-sm);">${prob.instruction}</p>`);
    ToastManager.show('Problem bookmarked!', 'success');
  });
  document.getElementById('clear-work-btn')?.addEventListener('click', () => {
    const workArea = document.getElementById('student-work-input');
    if (workArea) workArea.textContent = '';
    ToastManager.show('Work area cleared.', 'info', 1500);
  });
  document.getElementById('mark-solved-btn')?.addEventListener('click', () => {
    StatsManager.incrementSolved();
    ToastManager.show('Problem marked as solved! ✓', 'success');
  });
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    document.querySelectorAll('input[name="topic"]').forEach(r => r.checked = false);
    const intRadio = document.querySelector('input[name="difficulty"][value="intermediate"]');
    if (intRadio) intRadio.checked = true;
    ToastManager.show('Generator settings reset.', 'info', 1500);
  });
  document.getElementById('generate-similar-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob) { ToastManager.show('Generate a problem first.', 'warning'); return; }
    const topicKey = Object.keys(Generators.TOPIC_META).find(k => Generators.TOPIC_META[k].name === prob.topic);
    if (topicKey) {
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || prob.difficulty;
      const newProb = Generators.generate(topicKey, difficulty);
      if (newProb) {
        ProblemDisplay.show(newProb);
        StatsManager.incrementGenerated(newProb.topic, newProb.week, difficulty);
        ProblemHistory.add(newProb);
        updateInfoCard(topicKey);
        ToastManager.show('Similar problem generated!', 'success');
      }
    }
  });
  document.getElementById('reset-session-btn')?.addEventListener('click', () => {
    StatsManager.reset();
    ToastManager.show('Session reset.', 'info');
  });
  document.getElementById('timer-pause-btn')?.addEventListener('click', () => ProblemDisplay.toggleTimer());
  document.getElementById('reveal-answer-only-btn')?.addEventListener('click', () => {
    const prob = ProblemDisplay.getCurrentProblem();
    if (!prob?.solution?.answer) { ToastManager.show('No answer available.', 'warning'); return; }
    const ansEl = document.getElementById('solution-final-answer');
    if (ansEl) {
      const solContent = document.getElementById('solution-content');
      if (solContent) solContent.setAttribute('aria-hidden', 'false');
      ansEl.scrollIntoView({ behavior: 'smooth' });
      MathRenderer.render(ansEl);
    }
    ProblemDisplay.showSolution();
    StatsManager.incrementViewed();
  });
  document.getElementById('download-exam-pdf-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('download-exam-pdf-btn');
    const examPaper = document.getElementById('exam-paper');
    if (!examPaper) { ToastManager.show('No exam to download.', 'warning'); return; }
    const problemsList = document.getElementById('exam-problems-list');
    if (!problemsList || problemsList.hasAttribute('hidden') || problemsList.children.length === 0) {
      ToastManager.show('Generate an exam first.', 'warning');
      return;
    }
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      ToastManager.show('PDF library not loaded. Check your connection.', 'error');
      return;
    }
    btn.setAttribute('disabled', '');
    btn.querySelector('.action-btn__text').textContent = 'Generating…';
    ToastManager.show('Preparing PDF…', 'info', 3000);
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentW = pageW - margin * 2;
      const originalBg = examPaper.style.background;
      if (window.MathJax?.typesetPromise) {
        await window.MathJax.typesetPromise([examPaper]).catch(() => {});
      }
      await new Promise(r => setTimeout(r, 400));
      function resolveCSSVars(root) {
        const computed = getComputedStyle(root);
        const styleProps = ['color','background','backgroundColor','borderColor','borderTopColor','borderBottomColor','borderLeftColor','borderRightColor'];
        styleProps.forEach(prop => {
          const val = computed.getPropertyValue(prop);
          if (val && val.includes('var(')) root.style[prop] = val;
        });
        Array.from(root.children).forEach(child => resolveCSSVars(child));
      }
      const clone = examPaper.cloneNode(true);
      clone.style.cssText = `position: fixed; top: 0; left: 0; width: ${examPaper.scrollWidth}px; background: #ffffff; color: #0f172a; font-family: Georgia, 'Times New Roman', serif; padding: 32px; box-sizing: border-box; z-index: -9999; pointer-events: none;`;
      document.body.appendChild(clone);
      clone.querySelectorAll('[hidden]').forEach(el => { el.removeAttribute('hidden'); el.style.display = ''; });
      clone.querySelectorAll('*').forEach(el => { if (el.style.display === 'none') el.style.display = ''; });
      resolveCSSVars(clone);
      if (window.MathJax?.typesetPromise) {
        await window.MathJax.typesetPromise([clone]).catch(() => {});
      }
      await new Promise(r => setTimeout(r, 600));
      const canvas = await html2canvas(clone, {
        scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff',
        width: clone.scrollWidth, height: clone.scrollHeight, windowWidth: clone.scrollWidth, windowHeight: clone.scrollHeight
      });
      document.body.removeChild(clone);
      examPaper.style.background = originalBg;
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgW = contentW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let yOffset = margin;
      let remainingH = imgH;
      let sourceY = 0;
      const usableH = pageH - margin * 2;
      while (remainingH > 0) {
        const sliceH = Math.min(remainingH, usableH);
        const canvasScale = canvas.height / imgH;
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.round(sliceH * canvasScale);
        const ctx = sliceCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, Math.round(sourceY * canvasScale), canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height);
        sourceY += sliceH;
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(sliceData, 'JPEG', margin, yOffset, imgW, sliceH);
        remainingH -= sliceH;
        if (remainingH > 0) { pdf.addPage(); yOffset = margin; }
      }
      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`AITU_Calculus_I_Exam_${timestamp}.pdf`);
      ToastManager.show('PDF downloaded!', 'success', 3000);
    } catch (err) {
      console.error('[PDF Export]', err);
      ToastManager.show('PDF generation failed. See console for details.', 'error');
    } finally {
      btn.removeAttribute('disabled');
      btn.querySelector('.action-btn__text').textContent = 'Download as PDF';
    }
  });
  document.getElementById('exam-timer-pause-btn')?.addEventListener('click', () => ExamMode.toggleExamTimer());
  document.getElementById('reveal-all-solutions-btn')?.addEventListener('click', () => ExamMode.revealAllSolutions());
  document.getElementById('new-exam-btn')?.addEventListener('click', () => ExamMode.generateExam());
  document.getElementById('solution-related-suggestions')?.addEventListener('click', (e) => {
    if (e.target.dataset.topic) {
      const topicKey = e.target.dataset.topic;
      const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'intermediate';
      const newProb = Generators.generate(topicKey, difficulty);
      if (newProb) {
        ProblemDisplay.show(newProb);
        StatsManager.incrementGenerated(newProb.topic, newProb.week, difficulty);
        ProblemHistory.add(newProb);
        updateInfoCard(topicKey);
      }
    }
  });
}
function initSpecialTypeButtons() {
  const specialBtns = [
    { id: 'gen-limit-btn', fn: () => Generators.genSpecialLimit(getChecked('limit-sub')) },
    { id: 'gen-derivative-btn', fn: () => Generators.genSpecialDerivative(getChecked('deriv-sub')) },
    { id: 'gen-integral-btn', fn: () => Generators.genSpecialIntegral(getChecked('int-sub')) },
    { id: 'gen-application-btn', fn: () => Generators.genSpecialApplication(getChecked('app-sub')) },
    { id: 'gen-polar-btn', fn: () => Generators.genSpecialPolar(getChecked('polar-sub')) },
    { id: 'gen-theorem-btn', fn: () => Generators.genSpecialTheorem(getChecked('theorem-sub')) },
    { id: 'gen-mixed-btn', fn: () => Generators.genSpecialMixed(getChecked('mixed-sub')) }
  ];
  function getChecked(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
  }
  specialBtns.forEach(({ id, fn }) => {
    document.getElementById(id)?.addEventListener('click', () => {
      const prob = fn();
      if (!prob) { ToastManager.show('Generation failed.', 'error'); return; }
      ProblemDisplay.show(prob);
      StatsManager.incrementGenerated(prob.topic, prob.week, 'intermediate');
      ProblemHistory.add(prob);
      ToastManager.show(`${prob.topic} problem generated!`, 'success');
      document.getElementById('problem-display')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
function initMainGenerator() {
  const examMode = document.querySelector('input[name="exam-mode"]:checked')?.value || 'practice';
  StorageManager.set('examMode', examMode);
  const generateBtn = document.getElementById('generate-btn');
  if (!generateBtn) return;
  generateBtn.addEventListener('click', () => {
    const topicRadio = document.querySelector('input[name="topic"]:checked');
    if (!topicRadio) { ToastManager.show('Please select a topic first.', 'warning', 2500); return; }
    const topicKey = topicRadio.value;
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'intermediate';
    generateBtn.classList.add('is-generating');
    generateBtn.setAttribute('aria-busy', 'true');
    setTimeout(() => {
      const prob = Generators.generate(topicKey, difficulty);
      generateBtn.classList.remove('is-generating');
      generateBtn.setAttribute('aria-busy', 'false');
      if (!prob) { ToastManager.show('Problem generation failed. Please try again.', 'error'); return; }
      ProblemDisplay.show(prob);
      StatsManager.incrementGenerated(prob.topic, prob.week, difficulty);
      ProblemHistory.add(prob);
      updateInfoCard(topicKey);
      ToastManager.show(`${prob.topic} problem generated!`, 'success', 2000);
      StorageManager.set('lastTopic', topicKey);
      StorageManager.set('lastDifficulty', difficulty);
    }, 120);
  });
  document.querySelectorAll('input[name="topic"]').forEach(radio => {
    radio.addEventListener('change', () => updateInfoCard(radio.value));
  });
  document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const meta = Generators.getMeta(document.querySelector('input[name="topic"]:checked')?.value);
      StatsManager.setTopic(meta?.name || '—', meta?.week || '', radio.value);
    });
  });
}
function initExamGenerator() {
  document.getElementById('generate-exam-btn')?.addEventListener('click', () => {
    ExamMode.generateExam();
    ToastManager.show('Mock exam generated!', 'success', 2000);
  });
}
function restoreState() {
  ThemeManager.init();
  const lastDiff = StorageManager.get('lastDifficulty', 'intermediate');
  const diffRadio = document.querySelector(`input[name="difficulty"][value="${lastDiff}"]`);
  if (diffRadio) diffRadio.checked = true;
  const lastTopic = StorageManager.get('lastTopic', null);
  if (lastTopic) {
    const topicRadio = document.querySelector(`input[name="topic"][value="${lastTopic}"]`);
    if (topicRadio) { topicRadio.checked = true; updateInfoCard(lastTopic); }
  }
  StatsManager.load();
  StatsManager.updateUI();
}
function initApp() {
  try {
    restoreState();
    SidebarController.init();
    WeekModules.init();
    ModalController.init();
    KeyboardShortcuts.init();
    initMainGenerator();
    initExamGenerator();
    initUtilityButtons();
    initSpecialTypeButtons();
    initBackToTop();
    initLatexPalette();
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => ThemeManager.toggle());
    document.getElementById('reveal-solution-btn')?.addEventListener('click', () => ProblemDisplay.toggleSolution());
    document.addEventListener('mathjax-ready', () => {
      initLatexPalette();
      MathRenderer.renderAll();
    });
    if (window.MathJax?.startup?.promise) {
      window.MathJax.startup.promise.then(() => {
        initLatexPalette();
        MathRenderer.renderAll();
      }).catch(() => {});
    }
    setTimeout(() => {
      ToastManager.show('Keyboard shortcuts: G=Generate · T=Theme · S=Solution · E=Exam', 'info', 4000);
    }, 1500);
    console.log('[CALC-GEN] Calculus I Problem Generator initialized successfully.');
  } catch (err) {
    console.error('[CALC-GEN] Initialization error:', err);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
