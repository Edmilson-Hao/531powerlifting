/**
 * 5/3/1 Powerlifting Tracker - PWA Offline
 * CM = 90% do 1RM
 * Programas: 5/3/1 Clássico (4 sem) e Beyond 5/3/1 (7 sem)
 */

(function () {
  'use strict';

  // ========== CONSTANTS ==========
  const LIFTS = [
    { id: 'squat', name: 'Squat', short: 'SQ' },
    { id: 'bench', name: 'Bench Press', short: 'BP' },
    { id: 'deadlift', name: 'Deadlift', short: 'DL' },
    { id: 'ohp', name: 'Overhead Press', short: 'OHP' }
  ];
  // Levantamentos principais da divisão atual (sem OHP)
  const MAIN_LIFTS = LIFTS.filter(l => l.id !== 'ohp');

  // Classic: última série é AMRAP (+)
  const SETS_5 = [
    { reps: 5, pct: 0.65, amrap: false },
    { reps: 5, pct: 0.75, amrap: false },
    { reps: 5, pct: 0.85, amrap: true }
  ];
  const SETS_3 = [
    { reps: 3, pct: 0.70, amrap: false },
    { reps: 3, pct: 0.80, amrap: false },
    { reps: 3, pct: 0.90, amrap: true }
  ];
  const SETS_531_CLASSIC = [
    { reps: 1, pct: 0.75, amrap: false },
    { reps: 1, pct: 0.85, amrap: false },
    { reps: 1, pct: 0.95, amrap: true }
  ];
  // Beyond: 3ª série fixa (sem +) — Joker é opcional depois
  const SETS_5_BEYOND = [
    { reps: 5, pct: 0.65, amrap: false },
    { reps: 5, pct: 0.75, amrap: false },
    { reps: 5, pct: 0.85, amrap: false }
  ];
  const SETS_3_BEYOND = [
    { reps: 3, pct: 0.70, amrap: false },
    { reps: 3, pct: 0.80, amrap: false },
    { reps: 3, pct: 0.90, amrap: false }
  ];
  const SETS_531_BEYOND = [
    { reps: 5, pct: 0.75, amrap: false },
    { reps: 3, pct: 0.85, amrap: false },
    { reps: 1, pct: 0.95, amrap: false }
  ];
  const SETS_DELOAD_CLASSIC = [
    { reps: 5, pct: 0.60, amrap: false },
    { reps: 5, pct: 0.60, amrap: false },
    { reps: 5, pct: 0.60, amrap: false }
  ];
  const SETS_DELOAD_BEYOND = [
    { reps: 5, pct: 0.60, amrap: false },
    { reps: 5, pct: 0.60, amrap: false },
    { reps: 5, pct: 0.60, amrap: false }
  ];

  /**
   * classic: 4 semanas, deload na 4, +5 kg no 1RM ao fim
   * beyond: 7 semanas (2 ondas sem deload no meio + deload na 7)
   *   após semana 3: +2 kg (superior) / +4 kg (inferior) e segue
   *   após semana 7: +2/+4 e novo ciclo
   */
  const PROGRAMS = {
    classic: {
      id: 'classic',
      name: '5/3/1 Clássico',
      shortName: '5/3/1',
      maxWeek: 4,
      weeks: {
        1: { sets: SETS_5, label: 'Séries de 5', joker: true, jokerReps: 5 },
        2: { sets: SETS_3, label: 'Séries de 3', joker: true, jokerReps: 3 },
        3: { sets: SETS_531_CLASSIC, label: '5/3/1', joker: true, jokerReps: 1 },
        4: { sets: SETS_DELOAD_CLASSIC, label: 'Deload', joker: false }
      }
    },
    beyond: {
      id: 'beyond',
      name: 'Beyond 5/3/1',
      shortName: 'Beyond',
      maxWeek: 7,
      weeks: {
        1: { sets: SETS_5_BEYOND, label: 'Séries de 5', joker: true, jokerReps: 5 },
        2: { sets: SETS_3_BEYOND, label: 'Séries de 3', joker: true, jokerReps: 3 },
        3: { sets: SETS_531_BEYOND, label: '5/3/1', joker: true, jokerReps: 1 },
        4: { sets: SETS_5_BEYOND, label: 'Séries de 5', joker: true, jokerReps: 5 },
        5: { sets: SETS_3_BEYOND, label: 'Séries de 3', joker: true, jokerReps: 3 },
        6: { sets: SETS_531_BEYOND, label: '5/3/1', joker: true, jokerReps: 1 },
        7: { sets: SETS_DELOAD_BEYOND, label: 'Deload', joker: false }
      }
    }
  };

  function getProgram() {
    return PROGRAMS[state.programMode] || PROGRAMS.classic;
  }

  function isLowerLift(liftId) {
    return liftId === 'squat' || liftId === 'deadlift';
  }

  function tmIncrement(liftId) {
    // Beyond: +4 kg inferior, +2 kg superior
    return isLowerLift(liftId) ? 4 : 2;
  }

  /**
   * Divisão semanal personalizada 5/3/1
   * "pesado" = dia das séries de trabalho 5/3/1 daquele levantamento
   * 0=Dom … 6=Sáb (Date.getDay())
   * Quinta = descanso total (não entra no SCHEDULE)
   */
  const SCHEDULE = {
    1: { // Segunda
      dayName: 'Segunda',
      short: 'Seg',
      main: 'squat',
      stripLabel: 'SQ',
      exercises: [
        { name: 'Agachamento', scheme: '5/3/1', heavy: true, liftId: 'squat' },
        { name: 'Extensora', scheme: '3×12–15', heavy: false },
        { name: 'Flexora', scheme: '3×10–12', heavy: false }
      ]
    },
    2: { // Terça
      dayName: 'Terça',
      short: 'Ter',
      main: 'bench',
      stripLabel: 'BP',
      exercises: [
        { name: 'Supino', scheme: '5/3/1', heavy: true, liftId: 'bench' },
        { name: 'Paralelas', scheme: '3×8–12', heavy: false },
        { name: 'Elevação Lateral', scheme: '3×12–15', heavy: false },
        { name: 'Tríceps Pulley', scheme: '3×10–12', heavy: false }
      ]
    },
    3: { // Quarta
      dayName: 'Quarta',
      short: 'Qua',
      main: 'deadlift',
      stripLabel: 'DL',
      exercises: [
        { name: 'Levantamento Terra', scheme: '5/3/1', heavy: true, liftId: 'deadlift' },
        { name: 'Chin Up', scheme: '3×6–10', heavy: false },
        { name: 'Rosca Martelo', scheme: '3×10–12', heavy: false }
      ]
    },
    5: { // Sexta — Dia de SBD
      dayName: 'Sexta',
      short: 'Sex',
      main: 'squat',
      stripLabel: 'SBD',
      exercises: [
        { name: 'Agachamento', scheme: '80% CM', heavy: false, liftId: 'squat' },
        { name: 'Supino', scheme: '80% CM', heavy: false, liftId: 'bench' },
        { name: 'Levantamento Terra', scheme: '80% CM', heavy: false, liftId: 'deadlift' }
      ]
    }
  };

  const TRAINING_DAYS = [1, 2, 3, 5]; // Seg, Ter, Qua, Sex (Qui = descanso total)

  const STORAGE_KEY = 'pl531_data_v1';
  const DEFAULT_STATE = {
    setupComplete: false,
    programMode: 'classic', // 'classic' | 'beyond'
    equipment: {
      bar: 20,
      plates: [20, 15, 10, 5, 2.5, 1]
    },
    lifts: {
      squat: { oneRM: 0 },
      bench: { oneRM: 0 },
      deadlift: { oneRM: 0 },
      ohp: { oneRM: 0 }
    },
    // Current progress per lift
    progress: {
      squat: { week: 1, cycle: 1 },
      bench: { week: 1, cycle: 1 },
      deadlift: { week: 1, cycle: 1 },
      ohp: { week: 1, cycle: 1 }
    },
    // Active lift being viewed
    activeLift: 'squat',
    // History log
    log: [],
    // Viewing a future week (null = current)
    previewWeek: null,
    // Selected day from agenda strip (null = follow activeLift only)
    selectedScheduleDay: null,
    // History filters
    histFilter: { lift: 'all', result: 'all', groupByCycle: false }
  };

  // ========== STATE ==========
  let state = loadState();
  let deferredPrompt = null;

  // ========== STORAGE ==========
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle schema evolution
      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        lifts: { ...DEFAULT_STATE.lifts, ...(parsed.lifts || {}) },
        progress: { ...DEFAULT_STATE.progress, ...(parsed.progress || {}) },
        histFilter: { ...DEFAULT_STATE.histFilter, ...(parsed.histFilter || {}) },
        programMode: parsed.programMode === 'beyond' ? 'beyond' : 'classic',
        equipment: {
          bar: (parsed.equipment && parsed.equipment.bar > 0) ? parsed.equipment.bar : 20,
          plates: (parsed.equipment && Array.isArray(parsed.equipment.plates) && parsed.equipment.plates.length)
            ? parsed.equipment.plates
            : [20, 15, 10, 5, 2.5, 1]
        }
      };
    } catch (e) {
      console.error('Erro ao carregar estado:', e);
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Erro ao salvar:', e);
      showToast('Erro ao salvar dados');
    }
  }

  // ========== HELPERS ==========
  function calcCM(oneRM) {
    return Math.round(oneRM * 0.9 * 10) / 10; // 1 decimal
  }

  function calcWeight(cm, pct) {
    // Round to nearest 2.5 kg (common plate increment)
    const raw = cm * pct;
    return Math.round(raw / 2.5) * 2.5;
  }

  function formatWeight(w) {
    if (Number.isInteger(w)) return String(w);
    // preserva 1.25, 2.5 etc. sem arredondar para 1.3
    return String(Math.round(w * 100) / 100);
  }

  function getEquipment() {
    const eq = state.equipment || { bar: 20, plates: [20, 15, 10, 5, 2.5, 1] };
    return {
      bar: eq.bar > 0 ? eq.bar : 20,
      plates: (eq.plates && eq.plates.length) ? [...eq.plates].sort((a, b) => b - a) : [20, 15, 10, 5, 2.5, 1]
    };
  }

  /** Montagem por lado (descontando a barra) */
  function platesPerSide(totalKg) {
    const { bar, plates } = getEquipment();
    let side = (totalKg - bar) / 2;
    if (side < -0.05) {
      return { text: 'abaixo da barra', detail: '', side: 0 };
    }
    if (side < 0.05) {
      return { text: 'só a barra', detail: formatWeight(bar) + ' kg', side: 0 };
    }
    let remaining = Math.round(side * 100) / 100;
    const used = [];
    for (const p of plates) {
      while (remaining >= p - 0.001) {
        used.push(p);
        remaining = Math.round((remaining - p) * 100) / 100;
      }
    }
    const text = used.length
      ? used.map(formatWeight).join(' + ')
      : '—';
    const note = remaining > 0.05 ? ` (falta ~${formatWeight(remaining)} kg/lado)` : '';
    return {
      text: text + note,
      detail: formatWeight(side) + ' kg/lado',
      side
    };
  }

  function formatPlatesLine(totalKg) {
    const p = platesPerSide(totalKg);
    if (p.side <= 0 && p.text === 'só a barra') return 'cada lado: só a barra';
    if (p.side <= 0) return p.text;
    return `cada lado: ${p.text}`;
  }

  function getLift(id) {
    return LIFTS.find(l => l.id === id) || LIFTS[0];
  }

  function getCurrentProgress(liftId) {
    return state.progress[liftId] || { week: 1, cycle: 1 };
  }

  function getWeekConfig(week) {
    const prog = getProgram();
    return prog.weeks[week] || prog.weeks[1];
  }

  function getSetsForWeek(week) {
    return getWeekConfig(week).sets;
  }

  function getMaxWeek() {
    return getProgram().maxWeek;
  }

  function weekRange() {
    const n = getMaxWeek();
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  function nextTrainingDayLabel() {
    const today = new Date().getDay();
    for (let i = 1; i <= 7; i++) {
      const d = (today + i) % 7;
      if (SCHEDULE[d]) {
        const heavy = SCHEDULE[d].exercises.find(e => e.heavy);
        return `${SCHEDULE[d].dayName} (${heavy ? heavy.name : getLift(SCHEDULE[d].main).short})`;
      }
    }
    return 'Segunda (Squat)';
  }

  function showToast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ========== RENDER ==========
  function render() {
    if (!state.setupComplete) {
      showView('setup');
      return;
    }
    showView('main');
    renderMain();
  }

  function showView(view) {
    document.getElementById('view-setup').classList.toggle('hidden', view !== 'setup');
    document.getElementById('view-main').classList.toggle('hidden', view !== 'main');
  }

  function renderMain() {
    const tab = document.querySelector('.nav-tab.active')?.dataset.tab || 'treino';
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    const panel = document.getElementById('panel-' + tab);
    if (panel) panel.classList.remove('hidden');

    if (tab === 'treino') renderTreino();
    else if (tab === 'divisao') renderDivisao();
    else if (tab === 'progresso') renderProgresso();
    else if (tab === 'historico') renderHistorico();
    else if (tab === 'config') renderConfig();
  }

  // ----- DIVISÃO TAB (consulta) -----
  function renderDivisao() {
    const container = document.getElementById('panel-divisao');
    const today = new Date().getDay();

    container.innerHTML = `
      <div class="card">
        <div class="card-title">Divisão semanal</div>
        <p class="text-muted mb-16" style="font-size:0.85rem">
          Consulta dos exercícios de cada dia. O treino pesado (5/3/1) é registrado na aba <strong>Treino</strong>.
        </p>
        <div class="week-split">
          ${TRAINING_DAYS.map(d => {
            const s = SCHEDULE[d];
            const isToday = d === today;
            return `
              <div class="split-day ${isToday ? 'is-today' : ''}">
                <div class="split-day-header">
                  <span class="split-day-name">${s.dayName}</span>
                  ${isToday ? '<span class="sd-badge">Hoje</span>' : ''}
                </div>
                <ul class="split-exercises">
                  ${s.exercises.map(ex => {
                    let schemeLabel = ex.scheme;
                    if (ex.scheme === '80% CM' && ex.liftId) {
                      const oneRM = state.lifts[ex.liftId]?.oneRM || 0;
                      const cm = calcCM(oneRM);
                      const w = calcWeight(cm, 0.80);
                      schemeLabel = oneRM > 0
                        ? `80% CM · ${formatWeight(w)} kg`
                        : '80% CM';
                    }
                    return `
                    <li class="${ex.heavy ? 'heavy' : ''}">
                      <span class="ex-name">${ex.name}${ex.heavy ? ' <span class="heavy-tag">pesado</span>' : ''}</span>
                      <span class="ex-scheme">${schemeLabel}</span>
                    </li>`;
                  }).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Resumo</div>
        <ul style="font-size:0.85rem;color:var(--text-muted);padding-left:18px;line-height:1.7">
          <li><strong>Segunda</strong> — Agachamento 5/3/1 + pernas</li>
          <li><strong>Terça</strong> — Supino 5/3/1 + empurrar / ombros</li>
          <li><strong>Quarta</strong> — Terra 5/3/1 + puxar / bíceps</li>
          <li><strong>Quinta</strong> — Descanso total (recuperação SNC)</li>
          <li><strong>Sexta</strong> — Dia de SBD (80% CM)</li>
        </ul>
        <p class="text-muted mt-12" style="font-size:0.8rem">
          Foco em Squat, Bench e Deadlift (SBD).
        </p>
      </div>
    `;
  }

  // ----- TREINO TAB -----
  function renderTreino() {
    if (state.activeLift === 'ohp') state.activeLift = 'squat';
    const liftId = state.activeLift;
    const lift = getLift(liftId);
    const oneRM = state.lifts[liftId]?.oneRM || 0;
    const cm = calcCM(oneRM);
    const prog = getCurrentProgress(liftId);
    const viewWeek = state.previewWeek || prog.week;
    const isCurrent = viewWeek === prog.week;
    const sets = getSetsForWeek(viewWeek);
    const viewingSBD = state.selectedScheduleDay === 5 && SCHEDULE[5] && SCHEDULE[5].stripLabel === 'SBD';

    const today = new Date().getDay(); // 0=Dom … 6=Sáb
    const todaySchedule = SCHEDULE[today] || null;
    const isTrainingDay = !!todaySchedule;
    const todayLift = todaySchedule ? getLift(todaySchedule.main) : null;

    const container = document.getElementById('panel-treino');
    container.innerHTML = `
      ${!window.matchMedia('(display-mode: standalone)').matches && deferredPrompt ? `
        <div class="install-banner" id="installBanner">
          <p>Instale o app para acesso rápido e offline completo.</p>
          <button class="btn btn-primary btn-sm" id="btnInstall">Instalar</button>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-title">Agenda · Levantamentos</div>
        <div class="schedule-strip">
          ${TRAINING_DAYS.map(d => {
            const s = SCHEDULE[d];
            const isToday = d === today;
            return `
              <button class="schedule-day ${isToday ? 'today' : ''} ${(state.selectedScheduleDay === d) || (state.selectedScheduleDay == null && s.main === liftId && s.stripLabel !== 'SBD') ? 'selected' : ''}" data-schedule-day="${d}" data-schedule-lift="${s.main}">
                <div class="sd-name">${s.short}</div>
                <div class="sd-lift">${s.stripLabel || getLift(s.main).short}</div>
                ${isToday ? '<div class="sd-badge">Hoje</div>' : ''}
              </button>
            `;
          }).join('')}
        </div>
        <div class="schedule-today-info mb-12">
          ${isTrainingDay
            ? `<strong>${todaySchedule.dayName}:</strong> ${todaySchedule.exercises.filter(e => e.heavy).map(e => e.name + ' (pesado)').join(', ') || (todaySchedule.stripLabel === 'SBD' ? 'Dia de SBD (80% CM)' : getLift(todaySchedule.main).name)}
               <button class="btn btn-outline btn-sm mt-8" id="btnGoTodayLift" style="width:auto;display:inline-flex">${todaySchedule.stripLabel === 'SBD' ? 'Ver SBD' : 'Ir para ' + todayLift.short}</button>`
            : `<span class="text-muted">Hoje é dia de descanso. Próximo treino: ${nextTrainingDayLabel()}.</span>`
          }
        </div>
        <div class="lift-grid" id="liftSelector">
          ${MAIN_LIFTS.map(l => {
            const l1rm = state.lifts[l.id]?.oneRM || 0;
            const lcm = calcCM(l1rm);
            const lp = getCurrentProgress(l.id);
            const isScheduledToday = todaySchedule && todaySchedule.main === l.id;
            return `
              <div class="lift-card ${l.id === liftId ? 'active' : ''} ${isScheduledToday ? 'scheduled-today' : ''}" data-lift="${l.id}">
                <div class="lift-top">
                  <div class="lift-name">${l.short}${isScheduledToday ? ' <span class="today-dot" title="Treino de hoje"></span>' : ''}</div>
                  <div class="lift-prog">C${lp.cycle} · S${lp.week}</div>
                </div>
                <div class="lift-1rm">1RM: ${formatWeight(l1rm)} kg</div>
                <div class="lift-cm">CM: ${formatWeight(lcm)} kg</div>
                <div class="lift-mini-bar">
                  ${weekRange().map(w => `<span class="${w < lp.week ? 'done' : ''} ${w === lp.week ? 'current' : ''}"></span>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${viewingSBD ? `
      <div class="card">
        <div class="session-header">
          <div>
            <span class="week-badge">Sexta · Dia de SBD</span>
            <h2>SBD — 80% CM</h2>
            <div class="subtitle">Prática técnica dos três levantamentos</div>
          </div>
        </div>
        <ul class="set-list">
          ${['squat','bench','deadlift'].map((id, i) => {
            const l = getLift(id);
            const one = state.lifts[id]?.oneRM || 0;
            const c = calcCM(one);
            const w = calcWeight(c, 0.80);
            return `
              <li class="set-item">
                <div class="set-num">${i + 1}</div>
                <div class="set-info">
                  <div class="reps">${l.name}</div>
                  <div class="pct">80% CM${one > 0 ? ' · CM ' + formatWeight(c) + ' kg' : ''}</div>
                  ${one > 0 ? `<div class="plates-hint">${formatPlatesLine(w)}</div>` : ''}
                </div>
                <div class="set-weight">${one > 0 ? formatWeight(w) : '—'} <small>kg</small></div>
              </li>`;
          }).join('')}
        </ul>
        <p class="text-muted text-center mt-12" style="font-size:0.8rem">
          Dia de técnica — não avança o ciclo 5/3/1.<br>
          Toque em SQ, BP ou DL acima para registrar o treino pesado.
        </p>
      </div>
      ` : `
      <div class="card">
        <div class="session-header">
          <div>
            <span class="week-badge">${getProgram().shortName} · Ciclo ${prog.cycle} · S${viewWeek}</span>
            <h2>${lift.name}</h2>
            <div class="subtitle">1RM: ${formatWeight(oneRM)} kg · CM: ${formatWeight(cm)} kg · ${getWeekConfig(viewWeek).label}</div>
          </div>
        </div>

        <div class="cycle-progress">
          ${weekRange().map(w => `
            <div class="cycle-dot ${w < prog.week ? 'done' : ''} ${w === prog.week ? 'current' : ''}"></div>
          `).join('')}
        </div>

        <div class="week-preview" id="weekPreview">
          ${weekRange().map(w => `
            <div class="week-chip ${w === viewWeek ? 'active' : ''}" data-week="${w}">
              <div class="w-label">${w === prog.week ? 'Atual' : (w < prog.week ? 'Passada' : 'Futura')}</div>
              <div class="w-num">S${w}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="warmup-note">
          <strong>Aquecimento:</strong> Faça 2–4 séries leves progressivas antes das séries de trabalho (ex: barra, 40%, 50%, 60%).
        </div>

        <div class="card-title">Séries de Trabalho · ${getWeekConfig(viewWeek).label}</div>
        <ul class="set-list">
          ${sets.map((s, i) => {
            const weight = calcWeight(cm, s.pct);
            const pctLabel = Math.round(s.pct * 100);
            const platesLine = formatPlatesLine(weight);
            return `
              <li class="set-item">
                <div class="set-num ${s.amrap ? 'amrap' : ''}">${i + 1}</div>
                <div class="set-info">
                  <div class="reps">${s.amrap ? `AMRAP × ${s.reps}+` : `${s.reps} reps`}</div>
                  <div class="pct">${pctLabel}% CM</div>
                  <div class="plates-hint">${platesLine}</div>
                </div>
                <div class="set-weight">${formatWeight(weight)} <small>kg</small></div>
              </li>
            `;
          }).join('')}
        </ul>

        ${(() => {
          const wc = getWeekConfig(viewWeek);
          if (wc.joker) {
            const topSet = [...sets].reverse().find(s => s.amrap) || sets[sets.length - 1];
            const base = calcWeight(cm, topSet.pct);
            const joker5 = Math.round((base * 1.05) / 2.5) * 2.5;
            const joker10 = Math.round((base * 1.10) / 2.5) * 2.5;
            return `
          <div class="joker-note" id="jokerPanel"
               data-base="${base}" data-j5="${joker5}" data-j10="${joker10}" data-reps="${wc.jokerReps}">
            <strong>Joker Set (opcional):</strong> Se a 3ª série saiu rápida e limpa, registre o Joker.
            <div class="joker-loads">
              <span class="joker-load">+5% → <strong>${formatWeight(joker5)} kg</strong><small class="plates-hint">${formatPlatesLine(joker5)}</small></span>
              <span class="joker-load">+10% → <strong>${formatWeight(joker10)} kg</strong><small class="plates-hint">${formatPlatesLine(joker10)}</small></span>
            </div>
            ${isCurrent ? `
            <div class="joker-picker">
              <div class="joker-picker-label">Quantas séries?</div>
              <div class="filter-row" id="jokerCountRow">
                <button type="button" class="filter-chip active" data-joker-count="0">Nenhuma</button>
                <button type="button" class="filter-chip" data-joker-count="1">1 série</button>
                <button type="button" class="filter-chip" data-joker-count="2">2 séries</button>
              </div>
              <div id="jokerSlots" class="hidden">
                <div class="joker-slot" data-slot="1">
                  <div class="joker-picker-label">1ª Joker</div>
                  <div class="filter-row">
                    <button type="button" class="filter-chip active" data-joker-pct="5" data-slot="1">+5% · ${formatWeight(joker5)} kg</button>
                    <button type="button" class="filter-chip" data-joker-pct="10" data-slot="1">+10% · ${formatWeight(joker10)} kg</button>
                  </div>
                  <div class="plates-hint" id="jokerPlate1">${formatPlatesLine(joker5)}</div>
                </div>
                <div class="joker-slot hidden" data-slot="2">
                  <div class="joker-picker-label">2ª Joker</div>
                  <div class="filter-row">
                    <button type="button" class="filter-chip active" data-joker-pct="5" data-slot="2">+5% · ${formatWeight(joker5)} kg</button>
                    <button type="button" class="filter-chip" data-joker-pct="10" data-slot="2">+10% · ${formatWeight(joker10)} kg</button>
                  </div>
                  <div class="plates-hint" id="jokerPlate2">${formatPlatesLine(joker5)}</div>
                </div>
              </div>
              <div class="joker-summary text-muted" id="jokerSummary" style="font-size:0.8rem;margin-top:8px">Sem Joker Set</div>
            </div>
            ` : ''}
            <span class="joker-hint">Base (3ª série): ${formatWeight(base)} kg · Se sofreu na obrigatória, não faça Joker.</span>
          </div>`;
          }
          if (wc.label === 'Deload') {
            return `
          <div class="joker-note deload">
            <strong>Deload:</strong> séries leves — foque em técnica e recuperação. Não force carga.
          </div>`;
          }
          return '';
        })()}

        ${isCurrent ? `
          <div class="btn-group mt-16">
            <button class="btn btn-success" id="btnSuccess">✓ Sucesso</button>
            <button class="btn btn-danger" id="btnFail">✗ Falhou</button>
          </div>
          <p class="text-muted text-center mt-8" style="font-size:0.8rem">
            Sucesso = avançar para próxima semana.<br>
            Falhou = repetir a mesma semana.
          </p>
        ` : `
          <p class="text-muted text-center mt-16" style="font-size:0.85rem">
            Visualizando semana futura / passada. Volte para a semana atual para registrar o treino.
          </p>
          <button class="btn btn-outline mt-12" id="btnBackCurrent">Voltar para semana atual</button>
        `}
      </div>
      `}
    `;

    // Events
    container.querySelectorAll('.lift-card').forEach(el => {
      el.addEventListener('click', () => {
        state.activeLift = el.dataset.lift;
        state.previewWeek = null;
        state.selectedScheduleDay = null; // sai do modo SBD
        saveState();
        renderTreino();
      });
    });

    container.querySelectorAll('.schedule-day').forEach(el => {
      el.addEventListener('click', () => {
        const day = parseInt(el.dataset.scheduleDay, 10);
        const s = SCHEDULE[day];
        state.selectedScheduleDay = day;
        state.previewWeek = null;
        // SBD: não força o 5/3/1 de segunda; outros dias abrem o levantamento pesado
        if (s && s.stripLabel !== 'SBD') {
          state.activeLift = s.main;
        }
        saveState();
        renderTreino();
      });
    });

    const btnGoToday = document.getElementById('btnGoTodayLift');
    if (btnGoToday && todaySchedule) {
      btnGoToday.addEventListener('click', () => {
        const day = today;
        state.selectedScheduleDay = day;
        state.previewWeek = null;
        if (todaySchedule.stripLabel !== 'SBD') {
          state.activeLift = todaySchedule.main;
        }
        saveState();
        renderTreino();
      });
    }

    container.querySelectorAll('.week-chip').forEach(el => {
      el.addEventListener('click', () => {
        const w = parseInt(el.dataset.week, 10);
        state.previewWeek = w === prog.week ? null : w;
        renderTreino();
      });
    });

    // Joker picker interactions
    const jokerPanel = document.getElementById('jokerPanel');
    if (jokerPanel) {
      const slotsEl = document.getElementById('jokerSlots');
      const summaryEl = document.getElementById('jokerSummary');
      const j5 = parseFloat(jokerPanel.dataset.j5);
      const j10 = parseFloat(jokerPanel.dataset.j10);
      const jReps = parseInt(jokerPanel.dataset.reps, 10) || 5;

      function updateJokerUI() {
        const countBtn = jokerPanel.querySelector('[data-joker-count].active');
        const count = countBtn ? parseInt(countBtn.dataset.jokerCount, 10) : 0;
        if (slotsEl) {
          slotsEl.classList.toggle('hidden', count === 0);
          const slot2 = slotsEl.querySelector('.joker-slot[data-slot="2"]');
          if (slot2) slot2.classList.toggle('hidden', count < 2);
        }
        if (summaryEl) {
          if (count === 0) {
            summaryEl.textContent = 'Sem Joker Set';
          } else {
            const parts = [];
            for (let i = 1; i <= count; i++) {
              const pctBtn = jokerPanel.querySelector(`[data-joker-pct].active[data-slot="${i}"]`);
              const pct = pctBtn ? parseInt(pctBtn.dataset.jokerPct, 10) : 5;
              const w = pct === 10 ? j10 : j5;
              parts.push(`${i}ª: +${pct}% (${formatWeight(w)} kg × ${jReps})`);
              const plateEl = document.getElementById('jokerPlate' + i);
              if (plateEl) plateEl.textContent = formatPlatesLine(w);
            }
            summaryEl.textContent = parts.join(' · ');
          }
        }
      }

      jokerPanel.querySelectorAll('[data-joker-count]').forEach(btn => {
        btn.addEventListener('click', () => {
          jokerPanel.querySelectorAll('[data-joker-count]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updateJokerUI();
        });
      });
      jokerPanel.querySelectorAll('[data-joker-pct]').forEach(btn => {
        btn.addEventListener('click', () => {
          const slot = btn.dataset.slot;
          jokerPanel.querySelectorAll(`[data-joker-pct][data-slot="${slot}"]`).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updateJokerUI();
        });
      });
      updateJokerUI();
    }

    function readJokerSelection() {
      const panel = document.getElementById('jokerPanel');
      if (!panel) return null;
      const countBtn = panel.querySelector('[data-joker-count].active');
      const count = countBtn ? parseInt(countBtn.dataset.jokerCount, 10) : 0;
      if (!count) return null;
      const j5 = parseFloat(panel.dataset.j5);
      const j10 = parseFloat(panel.dataset.j10);
      const jReps = parseInt(panel.dataset.reps, 10) || 5;
      const jokerSets = [];
      for (let i = 1; i <= count; i++) {
        const pctBtn = panel.querySelector(`[data-joker-pct].active[data-slot="${i}"]`);
        const pct = pctBtn ? parseInt(pctBtn.dataset.jokerPct, 10) : 5;
        jokerSets.push({
          order: i,
          boostPct: pct,
          weight: pct === 10 ? j10 : j5,
          reps: jReps
        });
      }
      return { count, sets: jokerSets };
    }

    const btnSuccess = document.getElementById('btnSuccess');
    if (btnSuccess) {
      btnSuccess.addEventListener('click', () => handleResult(true, readJokerSelection()));
    }
    const btnFail = document.getElementById('btnFail');
    if (btnFail) {
      btnFail.addEventListener('click', () => handleResult(false, readJokerSelection()));
    }
    const btnBack = document.getElementById('btnBackCurrent');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        state.previewWeek = null;
        renderTreino();
      });
    }
    const btnInstall = document.getElementById('btnInstall');
    if (btnInstall && deferredPrompt) {
      btnInstall.addEventListener('click', async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          document.getElementById('installBanner')?.remove();
        }
        deferredPrompt = null;
      });
    }
  }

  function handleResult(success, jokerSelection) {
    const liftId = state.activeLift;
    const lift = getLift(liftId);
    const prog = getCurrentProgress(liftId);
    const oneRM = state.lifts[liftId].oneRM;
    const cm = calcCM(oneRM);
    const sets = getSetsForWeek(prog.week);
    const weights = sets.map(s => calcWeight(cm, s.pct));
    const mode = state.programMode || 'classic';
    const maxW = getMaxWeek();

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      lift: liftId,
      liftName: lift.name,
      cycle: prog.cycle,
      week: prog.week,
      oneRM,
      cm,
      programMode: mode,
      sets: sets.map((s, i) => ({
        reps: s.reps,
        pct: s.pct,
        weight: weights[i],
        amrap: s.amrap
      })),
      joker: jokerSelection || null,
      success
    };
    state.log.unshift(entry);

    if (success) {
      if (mode === 'beyond') {
        if (prog.week === 3) {
          // Fim da 1ª onda: sobe TM e segue para semana 4 (sem deload)
          const inc = tmIncrement(liftId);
          const new1RM = Math.round((oneRM + inc) * 10) / 10;
          state.lifts[liftId].oneRM = new1RM;
          state.progress[liftId].week = 4;
          showToast(`Onda 1 ok! TM +${inc} kg → ${formatWeight(new1RM)} kg · Semana 4`);
        } else if (prog.week === 6) {
          state.progress[liftId].week = 7;
          showToast('Semana 6 ok! → Semana 7 Deload (obrigatório)');
        } else if (prog.week >= maxW) {
          // Fim do bloco Beyond: +TM e novo ciclo
          const inc = tmIncrement(liftId);
          const new1RM = Math.round((oneRM + inc) * 10) / 10;
          state.lifts[liftId].oneRM = new1RM;
          state.progress[liftId].week = 1;
          state.progress[liftId].cycle = prog.cycle + 1;
          showToast(`Bloco Beyond completo! TM +${inc} kg → ${formatWeight(new1RM)} kg`);
        } else {
          state.progress[liftId].week = prog.week + 1;
          showToast(`Semana ${prog.week} concluída! → Semana ${prog.week + 1}`);
        }
      } else {
        // Classic 5/3/1
        if (prog.week < maxW) {
          state.progress[liftId].week = prog.week + 1;
          showToast(`Semana ${prog.week} concluída! → Semana ${prog.week + 1}`);
        } else {
          const new1RM = Math.round((oneRM + 5) * 10) / 10;
          state.lifts[liftId].oneRM = new1RM;
          state.progress[liftId].week = 1;
          state.progress[liftId].cycle = prog.cycle + 1;
          showToast(`Ciclo ${prog.cycle} completo! 1RM agora ${formatWeight(new1RM)} kg`);
        }
      }
    } else {
      showToast(`Semana ${prog.week} marcada como falha. Repita o treino.`);
    }

    state.previewWeek = null;
    saveState();
    renderTreino();
  }

  // ----- PROGRESSO TAB -----
  function renderProgresso() {
    const container = document.getElementById('panel-progresso');
    container.innerHTML = `
      <div class="card">
        <div class="card-title">Resumo dos Levantamentos</div>
        ${MAIN_LIFTS.map(l => {
          const oneRM = state.lifts[l.id]?.oneRM || 0;
          const cm = calcCM(oneRM);
          const prog = getCurrentProgress(l.id);
          return `
            <div class="log-item">
              <div class="flex justify-between items-center">
                <div>
                  <div class="log-title">${l.name}</div>
                  <div class="text-muted" style="font-size:0.8rem">Ciclo ${prog.cycle} · Semana ${prog.week}/${getMaxWeek()} · ${getProgram().shortName}</div>
                </div>
                <div class="text-right">
                  <div class="fw-bold text-accent">${formatWeight(oneRM)} kg</div>
                  <div class="text-muted" style="font-size:0.75rem">CM ${formatWeight(cm)}</div>
                </div>
              </div>
              <div class="cycle-progress mt-8">
                ${weekRange().map(w => `
                  <div class="cycle-dot ${w < prog.week ? 'done' : ''} ${w === prog.week ? 'current' : ''}"></div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="card">
        <div class="card-title">Próximas Cargas (semana atual)</div>
        ${MAIN_LIFTS.map(l => {
          const oneRM = state.lifts[l.id]?.oneRM || 0;
          const cm = calcCM(oneRM);
          const prog = getCurrentProgress(l.id);
          const sets = getSetsForWeek(prog.week);
          return `
            <div class="mb-16">
              <div class="fw-bold mb-8">${l.short} · S${prog.week}</div>
              <div class="flex gap-8" style="flex-wrap:wrap">
                ${sets.map((s, i) => `
                  <div style="background:var(--bg);padding:8px 12px;border-radius:8px;font-size:0.85rem">
                    <span class="text-muted">${s.amrap ? 'AMRAP' : s.reps + '×'}</span>
                    <span class="fw-bold text-accent">${formatWeight(calcWeight(cm, s.pct))} kg</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ----- HISTÓRICO TAB -----
  function getHistoryStats(log) {
    const total = log.length;
    const successes = log.filter(e => e.success).length;
    const fails = total - successes;
    const rate = total > 0 ? Math.round((successes / total) * 100) : 0;

    // Cycles completed = number of successful week-4 entries per lift
    const cyclesDone = {};
    LIFTS.forEach(l => { cyclesDone[l.id] = 0; });
    log.forEach(e => {
      if (e.success && e.week === 4) {
        cyclesDone[e.lift] = (cyclesDone[e.lift] || 0) + 1;
      }
    });

    // Current cycle from progress (completed = cycle - 1, or cycle if week>1 after finishing)
    // More accurate: max cycle from successful week 4, or current progress.cycle - 1 if still in progress
    const cyclesFromProgress = {};
    LIFTS.forEach(l => {
      const p = state.progress[l.id] || { cycle: 1, week: 1 };
      // If currently on cycle N week 1 after finishing, cycles done = N-1
      // Safe lower bound from log
      cyclesFromProgress[l.id] = Math.max(0, (p.cycle || 1) - 1);
      // Prefer log count if higher (handles manual edits)
      if ((cyclesDone[l.id] || 0) > cyclesFromProgress[l.id]) {
        cyclesFromProgress[l.id] = cyclesDone[l.id];
      }
    });

    return { total, successes, fails, rate, cyclesDone: cyclesFromProgress };
  }

  function getFilteredLog() {
    const f = state.histFilter || { lift: 'all', result: 'all', groupByCycle: false };
    let list = (state.log || []).slice();

    if (f.lift !== 'all') {
      list = list.filter(e => e.lift === f.lift);
    }
    if (f.result === 'success') {
      list = list.filter(e => e.success === true);
    } else if (f.result === 'fail') {
      list = list.filter(e => e.success === false);
    }
    return list;
  }

  function renderHistorico() {
    const container = document.getElementById('panel-historico');
    const allLog = state.log || [];
    const f = state.histFilter || { lift: 'all', result: 'all', groupByCycle: false };
    const filtered = getFilteredLog();
    const stats = getHistoryStats(allLog);

    if (allLog.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📋</div>
          <p>Nenhum treino registrado ainda.</p>
          <p style="font-size:0.85rem;margin-top:8px">Complete um treino na aba Treino para ver o histórico aqui.</p>
        </div>
      `;
      return;
    }

    // Cycles summary cards
    const cyclesHtml = MAIN_LIFTS.map(l => {
      const done = stats.cyclesDone[l.id] || 0;
      const prog = getCurrentProgress(l.id);
      return `
        <div class="stat-chip">
          <div class="stat-chip-label">${l.short}</div>
          <div class="stat-chip-value">${done}</div>
          <div class="stat-chip-sub">bloco${done !== 1 ? 's' : ''} · C${prog.cycle} S${prog.week}</div>
        </div>
      `;
    }).join('');

    // Filter chips
    const liftFilters = [
      { id: 'all', label: 'Todos' },
      ...MAIN_LIFTS.map(l => ({ id: l.id, label: l.short }))
    ];
    const resultFilters = [
      { id: 'all', label: 'Todos' },
      { id: 'success', label: '✓ Sucesso' },
      { id: 'fail', label: '✗ Falha' }
    ];

    // Build list HTML
    let listHtml = '';
    if (filtered.length === 0) {
      listHtml = `<p class="text-muted text-center" style="padding:24px 0;font-size:0.9rem">Nenhum treino com esses filtros.</p>`;
    } else if (f.groupByCycle) {
      // Group by lift + cycle
      const groups = {};
      filtered.forEach(e => {
        const key = `${e.lift}|${e.cycle}`;
        if (!groups[key]) groups[key] = { lift: e.lift, liftName: e.liftName, cycle: e.cycle, entries: [] };
        groups[key].entries.push(e);
      });
      // Sort groups by most recent entry
      const sortedKeys = Object.keys(groups).sort((a, b) => {
        const da = new Date(groups[a].entries[0].date).getTime();
        const db = new Date(groups[b].entries[0].date).getTime();
        return db - da;
      });
      listHtml = sortedKeys.map(key => {
        const g = groups[key];
        const weeksDone = g.entries.filter(e => e.success).length;
        const hasFail = g.entries.some(e => !e.success);
        return `
          <div class="cycle-group">
            <div class="cycle-group-header">
              <span class="fw-bold">${g.liftName} · Ciclo ${g.cycle}</span>
              <span class="text-muted" style="font-size:0.8rem">${weeksDone}/4 semanas ✓${hasFail ? ' · teve falha' : ''}</span>
            </div>
            ${g.entries.map(entry => renderLogEntry(entry)).join('')}
          </div>
        `;
      }).join('');
    } else {
      listHtml = filtered.slice(0, 80).map(entry => renderLogEntry(entry)).join('');
      if (filtered.length > 80) {
        listHtml += `<p class="text-muted text-center mt-8" style="font-size:0.8rem">Mostrando os 80 mais recentes de ${filtered.length}</p>`;
      }
    }

    container.innerHTML = `
      <!-- Summary -->
      <div class="card">
        <div class="card-title">Resumo</div>
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-num">${stats.total}</div>
            <div class="stat-label">Treinos</div>
          </div>
          <div class="stat-box">
            <div class="stat-num text-success">${stats.rate}%</div>
            <div class="stat-label">Sucesso</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${Object.values(stats.cyclesDone).reduce((a,b)=>a+b,0)}</div>
            <div class="stat-label">Blocos 4 sem.</div>
          </div>
        </div>
        <div class="card-title mt-16">Blocos completos por levantamento</div>
        <div class="cycles-grid">${cyclesHtml}</div>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="card-title">Filtros</div>
        <div class="filter-row">
          ${liftFilters.map(opt => `
            <button class="filter-chip ${f.lift === opt.id ? 'active' : ''}" data-filter="lift" data-value="${opt.id}">${opt.label}</button>
          `).join('')}
        </div>
        <div class="filter-row mt-8">
          ${resultFilters.map(opt => `
            <button class="filter-chip ${f.result === opt.id ? 'active' : ''}" data-filter="result" data-value="${opt.id}">${opt.label}</button>
          `).join('')}
        </div>
        <div class="filter-row mt-8">
          <button class="filter-chip ${f.groupByCycle ? 'active' : ''}" data-filter="group" data-value="cycle">
            Agrupar por ciclo
          </button>
        </div>
      </div>

      <!-- Log list -->
      <div class="card">
        <div class="flex justify-between items-center mb-8">
          <div class="card-title" style="margin:0">
            ${filtered.length === allLog.length ? `Log (${allLog.length})` : `Log (${filtered.length} de ${allLog.length})`}
          </div>
          <button class="btn btn-outline btn-sm" id="btnShareLog">Compartilhar</button>
        </div>
        ${listHtml}
      </div>
    `;

    // Filter events
    container.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.filter;
        const value = btn.dataset.value;
        if (type === 'lift') state.histFilter.lift = value;
        else if (type === 'result') state.histFilter.result = value;
        else if (type === 'group') state.histFilter.groupByCycle = !state.histFilter.groupByCycle;
        saveState();
        renderHistorico();
      });
    });

    // Delete events
    container.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (confirm('Apagar este treino do histórico?')) {
          state.log = state.log.filter(entry => entry.id !== id);
          saveState();
          showToast('Treino removido');
          renderHistorico();
        }
      });
    });

    document.getElementById('btnShareLog')?.addEventListener('click', openShareModal);
  }

  function renderLogEntry(entry) {
    const d = new Date(entry.date);
    const dateStr = d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="log-item">
        <div class="flex justify-between items-center">
          <div class="log-date">${dateStr}</div>
          <button class="btn-delete" data-delete-id="${entry.id}" title="Apagar" aria-label="Apagar">×</button>
        </div>
        <div class="log-title">${entry.liftName} · Ciclo ${entry.cycle} · Semana ${entry.week}</div>
        <div class="log-result ${entry.success ? 'success' : 'fail'}">
          ${entry.success ? '✓ Sucesso' : '✗ Falhou'} · 1RM ${formatWeight(entry.oneRM)} kg
        </div>
        <div class="text-muted" style="font-size:0.75rem;margin-top:2px">
          ${(entry.sets || []).map(s => `${formatWeight(s.weight)}kg × ${s.amrap ? 'AMRAP' : s.reps}`).join(' · ')}
        </div>
        ${entry.joker && entry.joker.sets && entry.joker.sets.length ? `
        <div class="log-joker">
          Joker: ${entry.joker.sets.map(j => `+${j.boostPct}% ${formatWeight(j.weight)}kg×${j.reps}`).join(' → ')}
        </div>` : ''}
      </div>
    `;
  }

  // ----- CONFIG TAB -----
  function renderConfig() {
    const container = document.getElementById('panel-config');
    const mode = state.programMode || 'classic';
    container.innerHTML = `
      <div class="card">
        <div class="card-title">Periodização</div>
        <p class="text-muted mb-12" style="font-size:0.85rem">Escolha o modelo de progressão. Ao trocar, as semanas atuais são mantidas (ajuste manualmente se precisar).</p>
        <div class="filter-row">
          <button class="filter-chip ${mode === 'classic' ? 'active' : ''}" data-program="classic">5/3/1 Clássico</button>
          <button class="filter-chip ${mode === 'beyond' ? 'active' : ''}" data-program="beyond">Beyond 5/3/1</button>
        </div>
        <p class="text-muted mt-12" style="font-size:0.8rem">
          ${mode === 'beyond'
            ? 'Beyond: 6 semanas pesadas + deload na 7ª (3×5 @ 60% CM). Após a semana 3: +2 kg (supino) / +4 kg (agachamento e terra). Joker Sets opcionais.'
            : 'Clássico: 3 semanas pesadas + deload na 4ª. Ao fim do ciclo: +5 kg no 1RM.'}
        </p>
      </div>

      <div class="card">
        <div class="card-title">Barra e anilhas</div>
        <p class="text-muted mb-12" style="font-size:0.85rem">Usado para mostrar quanto colocar em cada lado.</p>
        <div class="form-group">
          <label>Peso da barra</label>
          <div class="input-suffix">
            <input type="number" id="cfg-bar" inputmode="decimal" step="0.5" min="1" value="${getEquipment().bar}">
            <span>kg</span>
          </div>
        </div>
        <div class="form-group">
          <label>Anilhas disponíveis (por unidade)</label>
          <div class="plate-checks" id="cfgPlateChecks">
            ${[25, 20, 15, 10, 5, 2.5, 2, 1.25, 1, 0.5].map(p => {
              const on = getEquipment().plates.some(x => Math.abs(x - p) < 0.001);
              return `<label class="plate-check"><input type="checkbox" value="${p}" ${on ? 'checked' : ''}> ${formatWeight(p)} kg</label>`;
            }).join('')}
          </div>
        </div>
        <button class="btn btn-primary" id="btnSaveEquipment">Salvar equipamento</button>
      </div>

      <div class="card">
        <div class="card-title">1RM Atual (editar)</div>
        <p class="text-muted mb-16" style="font-size:0.85rem">
          Altere os valores se necessário. O CM (90% do 1RM) é recalculado automaticamente.
        </p>
        ${MAIN_LIFTS.map(l => {
          const oneRM = state.lifts[l.id]?.oneRM || 0;
          return `
            <div class="form-group">
              <label>${l.name}</label>
              <div class="input-suffix">
                <input type="number" inputmode="decimal" step="0.5" min="0" data-lift="${l.id}" class="config-1rm" value="${oneRM}">
                <span>kg</span>
              </div>
            </div>
          `;
        }).join('')}
        <button class="btn btn-primary" id="btnSave1RM">Salvar 1RMs</button>
      </div>

      <div class="card">
        <div class="card-title">Progresso (avançar / resetar manualmente)</div>
        ${MAIN_LIFTS.map(l => {
          const prog = getCurrentProgress(l.id);
          return `
            <div class="form-group">
              <label>${l.name} — Ciclo ${prog.cycle}, Semana ${prog.week}</label>
              <div class="btn-group">
                <button class="btn btn-outline btn-sm" data-action="prev" data-lift="${l.id}">← Semana</button>
                <button class="btn btn-outline btn-sm" data-action="next" data-lift="${l.id}">Semana →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="card">
        <div class="card-title">Dados</div>
        <button class="btn btn-outline mb-8" id="btnExport">Exportar log (JSON)</button>
        <button class="btn btn-outline mb-8" id="btnImport">Importar log (JSON)</button>
        <input type="file" id="importFile" accept=".json,application/json" class="hidden">
        <button class="btn btn-danger" id="btnResetAll">Apagar todos os dados</button>
      </div>

      <div class="card text-center">
        <div class="card-title">Sobre</div>
        <p style="font-size:0.9rem">5/3/1 Powerlifting Tracker</p>
        <p class="text-muted" style="font-size:0.8rem;margin-top:4px">
          CM = 90% do 1RM · +5 kg após ciclo completo<br>
          100% offline · Dados apenas no seu dispositivo
        </p>
      </div>
    `;

    container.querySelectorAll('[data-program]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.program;
        if (next === state.programMode) return;
        if (!confirm('Trocar periodização para ' + (next === 'beyond' ? 'Beyond 5/3/1' : '5/3/1 Clássico') + '?')) return;
        state.programMode = next;
        // Clamp weeks to new max
        const maxW = getMaxWeek();
        MAIN_LIFTS.forEach(l => {
          if (state.progress[l.id].week > maxW) state.progress[l.id].week = maxW;
        });
        saveState();
        showToast(next === 'beyond' ? 'Beyond 5/3/1 ativo' : '5/3/1 Clássico ativo');
        renderConfig();
      });
    });

    document.getElementById('btnSaveEquipment')?.addEventListener('click', () => {
      const barVal = parseFloat(document.getElementById('cfg-bar')?.value);
      const plates = [];
      document.querySelectorAll('#cfgPlateChecks input:checked').forEach(cb => {
        const v = parseFloat(cb.value);
        if (!isNaN(v)) plates.push(v);
      });
      state.equipment = {
        bar: (!isNaN(barVal) && barVal > 0) ? barVal : 20,
        plates: plates.length ? plates.sort((a, b) => b - a) : [20, 15, 10, 5, 2.5, 1]
      };
      saveState();
      showToast('Equipamento salvo');
      renderConfig();
    });

    document.getElementById('btnSave1RM')?.addEventListener('click', () => {
      document.querySelectorAll('.config-1rm').forEach(inp => {
        const id = inp.dataset.lift;
        const val = parseFloat(inp.value);
        if (!isNaN(val) && val >= 0) {
          state.lifts[id].oneRM = Math.round(val * 10) / 10;
        }
      });
      saveState();
      showToast('1RMs salvos');
      renderConfig();
    });

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.lift;
        const action = btn.dataset.action;
        const prog = state.progress[id];
        if (action === 'next') {
          const maxW = getMaxWeek();
          if (prog.week < maxW) prog.week++;
          else {
            prog.week = 1;
            prog.cycle++;
            const inc = (state.programMode === 'beyond') ? tmIncrement(id) : 5;
            state.lifts[id].oneRM = Math.round((state.lifts[id].oneRM + inc) * 10) / 10;
          }
        } else if (action === 'prev') {
          if (prog.week > 1) prog.week--;
        }
        saveState();
        showToast(`${getLift(id).short}: Ciclo ${prog.cycle} Semana ${prog.week}`);
        renderConfig();
      });
    });

    document.getElementById('btnExport')?.addEventListener('click', openShareModal);

    document.getElementById('btnImport')?.addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.lifts && data.progress) {
            // Full state import
            state = {
              ...structuredClone(DEFAULT_STATE),
              ...data,
              setupComplete: true
            };
            saveState();
            showToast('Dados importados com sucesso');
            render();
          } else if (Array.isArray(data)) {
            // Log only
            state.log = data.concat(state.log || []);
            saveState();
            showToast(`Log importado (${data.length} entradas)`);
            render();
          } else {
            showToast('Formato inválido');
          }
        } catch (err) {
          showToast('Erro ao ler arquivo');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('btnResetAll')?.addEventListener('click', () => {
      if (confirm('Tem certeza? Todos os dados (1RMs, progresso e log) serão apagados.')) {
        state = structuredClone(DEFAULT_STATE);
        saveState();
        showToast('Dados apagados');
        render();
      }
    });
  }

  // ========== SHARE / EXPORT ==========
  function openShareModal() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      lifts: state.lifts,
      progress: state.progress,
      log: state.log
    };
    const json = JSON.stringify(payload, null, 2);

    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modalContent');
    modal.innerHTML = `
      <div class="modal-handle"></div>
      <h3>Exportar / Compartilhar</h3>
      <p class="text-muted mb-16" style="font-size:0.85rem;text-align:center">
        Copie o JSON abaixo ou use o botão de compartilhar para transferir seus dados para outro dispositivo.
      </p>
      <div class="export-box" id="exportBox">${escapeHtml(json)}</div>
      <div class="btn-group">
        <button class="btn btn-primary" id="btnCopy">Copiar JSON</button>
        <button class="btn btn-outline" id="btnNativeShare">Compartilhar</button>
      </div>
      <button class="btn btn-outline mt-12" id="btnCloseModal">Fechar</button>
    `;
    overlay.classList.add('open');

    document.getElementById('btnCopy')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(json);
        showToast('Copiado!');
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = json;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copiado!');
      }
    });

    document.getElementById('btnNativeShare')?.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          const blob = new Blob([json], { type: 'application/json' });
          const file = new File([blob], '531-powerlifting-log.json', { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: '5/3/1 Log' });
          } else {
            await navigator.share({ title: '5/3/1 Powerlifting Log', text: json });
          }
        } catch (e) {
          if (e.name !== 'AbortError') showToast('Não foi possível compartilhar');
        }
      } else {
        showToast('Compartilhamento nativo não disponível. Use Copiar.');
      }
    });

    document.getElementById('btnCloseModal')?.addEventListener('click', closeModal);
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ========== SETUP ==========
  function initSetup() {
    const form = document.getElementById('setupForm');
    // Toggle visual dos chips de periodização
    form.querySelectorAll('input[name="setup-program"]').forEach(radio => {
      radio.addEventListener('change', () => {
        form.querySelectorAll('input[name="setup-program"]').forEach(r => {
          r.closest('label').classList.toggle('active', r.checked);
        });
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      MAIN_LIFTS.forEach(l => {
        const inp = document.getElementById('setup-' + l.id);
        const val = parseFloat(inp.value);
        if (isNaN(val) || val <= 0) {
          valid = false;
          inp.style.borderColor = 'var(--danger)';
        } else {
          inp.style.borderColor = '';
          state.lifts[l.id].oneRM = Math.round(val * 10) / 10;
        }
      });
      if (!valid) {
        showToast('Preencha todos os 1RMs com valores válidos');
        return;
      }
      const progRadio = form.querySelector('input[name="setup-program"]:checked');
      state.programMode = progRadio && progRadio.value === 'beyond' ? 'beyond' : 'classic';

      const barInp = document.getElementById('setup-bar');
      const barVal = parseFloat(barInp?.value);
      state.equipment = {
        bar: (!isNaN(barVal) && barVal > 0) ? barVal : 20,
        plates: []
      };
      form.querySelectorAll('input[name="setup-plate"]:checked').forEach(cb => {
        const v = parseFloat(cb.value);
        if (!isNaN(v) && v > 0) state.equipment.plates.push(v);
      });
      if (!state.equipment.plates.length) {
        state.equipment.plates = [20, 15, 10, 5, 2.5, 1];
      }
      state.equipment.plates.sort((a, b) => b - a);

      state.setupComplete = true;
      state.progress = {
        squat: { week: 1, cycle: 1 },
        bench: { week: 1, cycle: 1 },
        deadlift: { week: 1, cycle: 1 },
        ohp: { week: 1, cycle: 1 }
      };
      state.log = [];
      saveState();
      showToast(state.programMode === 'beyond' ? 'Beyond 5/3/1 iniciado!' : '5/3/1 Clássico iniciado!');
      render();
    });
  }

  // ========== NAV ==========
  function initNav() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.previewWeek = null;
        renderMain();
      });
    });
  }

  // ========== PWA ==========
  function initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Re-render treino if visible to show banner
      if (state.setupComplete) {
        const active = document.querySelector('.nav-tab.active')?.dataset.tab;
        if (active === 'treino') renderTreino();
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      showToast('App instalado!');
    });
  }

  // ========== BOOT ==========
  function boot() {
    // Hide splash
    setTimeout(() => {
      document.getElementById('splash').classList.add('hide');
      document.getElementById('app').classList.add('visible');
      render();
    }, 900);

    initSetup();
    initNav();
    initPWA();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
