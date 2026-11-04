/**
 * Cole este script no Console do navegador (F12) na página do app 5/3/1
 * se quiser forçar a correção manualmente.
 * Chave: pl531_data_v1
 */
(function () {
  const KEY = 'pl531_data_v1';
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    console.warn('Nenhum dado encontrado em localStorage[' + KEY + ']');
    return;
  }
  const data = JSON.parse(raw);
  let fixed = 0;
  (data.log || []).forEach(entry => {
    if (!entry || !entry.joker || !Array.isArray(entry.joker.sets)) return;
    entry.joker.sets.forEach(j => {
      if (!j) return;
      if (Number(j.reps) !== 1) {
        j.reps = 1;
        fixed++;
      }
    });
    if (entry.joker.sets.length) entry.joker.count = entry.joker.sets.length;
  });
  localStorage.setItem(KEY, JSON.stringify(data));
  console.log('Pronto. Séries de joker corrigidas para 1 rep:', fixed);
  console.log('Recarregue a página (F5) para ver o histórico atualizado.');
  alert('Jokers corrigidas: ' + fixed + ' série(s). Recarregue a página.');
})();
