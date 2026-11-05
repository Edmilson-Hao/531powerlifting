/**
 * Cole no Console (F12) em:
 * https://edmilson-hao.github.io/531powerlifting/index.html
 * Corrige histórico sem apagar treinos:
 * - Jokers → 1 rep
 * - Deadlift S1/S4 → 3 reps | S2/S5 → 2 | S3/S6 → 1
 */
(function () {
  const KEY = 'pl531_data_v1';
  const raw = localStorage.getItem(KEY);
  if (!raw) { alert('Sem dados no localStorage'); return; }
  const data = JSON.parse(raw);
  let jokers = 0, dl = 0;

  function dlTarget(week) {
    const w = Number(week) || 0;
    if (w === 7) return null;
    const wave = ((w - 1) % 3) + 1;
    if (wave === 1) return 3;
    if (wave === 2) return 2;
    if (wave === 3) return 1;
    return null;
  }
  function isDL(e) {
    if (!e) return false;
    if (e.lift === 'deadlift') return true;
    const n = (e.liftName || '').toLowerCase();
    return n.includes('deadlift') || n.includes('terra');
  }

  (data.log || []).forEach(e => {
    if (e && e.joker && Array.isArray(e.joker.sets)) {
      e.joker.sets.forEach(j => {
        if (j && Number(j.reps) !== 1) { j.reps = 1; jokers++; }
      });
    }
    if (isDL(e) && Array.isArray(e.sets)) {
      const t = dlTarget(e.week);
      if (t == null) return;
      e.sets.forEach(s => {
        if (s && Number(s.reps) !== t) {
          s.reps = t;
          if (s.amrap && t !== 1) s.amrap = false;
          dl++;
        }
      });
    }
  });

  localStorage.setItem(KEY, JSON.stringify(data));
  alert('Corrigido: ' + dl + ' série(s) Deadlift + ' + jokers + ' joker(s). Dê F5.');
  console.log({ deadliftSets: dl, jokers });
})();
