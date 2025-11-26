const API_URL = 'http://192.168.0.108/api/sensors';
const POLL_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 800;  

function formatNumber(n) {
  return (Math.round(n * 100) / 100).toLocaleString('ru-RU', {maximumFractionDigits:2});
}

function renderSidebar(containerId, sensors) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = ''; // очистить

  Object.entries(sensors).forEach(([key, sensor]) => {
    const section = document.createElement('section');
    section.className = 'sensor';

    const header = document.createElement('div');
    header.className = 'sensor-header';

    const name = document.createElement('div');
    name.className = 'sensor-name';
    name.textContent = key;

    const meta = document.createElement('div');
    meta.className = 'sensor-meta';
    meta.textContent = Object.keys(sensor).length + ' параметр(ы)';

    header.appendChild(name);
    header.appendChild(meta);
    section.appendChild(header);

    Object.entries(sensor).forEach(([pname, pval]) => {
      const row = document.createElement('div');
      row.className = 'param';

      const pnameEl = document.createElement('div');
      pnameEl.className = 'param-name';
      pnameEl.textContent = pname;

      const pvalEl = document.createElement('div');
      pvalEl.className = 'param-value';
      pvalEl.textContent = (pval && typeof pval.value === 'number')
        ? `${formatNumber(pval.value)} ${pval.unit || ''}`
        : '-';

      row.appendChild(pnameEl);
      row.appendChild(pvalEl);
      section.appendChild(row);
    });

    container.appendChild(section);
  });
}

// fetch с таймаутом
function fetchWithTimeout(url, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(id));
}

let pollingHandle = null;
let isFetching = false;

async function pollOnce() {
  if (isFetching) return; // пропустить, если предыдущий запрос ещё выполняется
  isFetching = true;
  try {
    const res = await fetchWithTimeout(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    renderSidebar('sensor-sidebar', json);
  } catch (err) {
    // Показываем ошибку в сайдбаре (минимально)
    const container = document.getElementById('sensor-sidebar');
    if (container) {
      container.innerHTML = `<div class="sensor"><div class="sensor-header"><div class="sensor-name">Ошибка</div><div class="sensor-meta">${err.message}</div></div></div>`;
    }
    console.error('Poll error:', err);
  } finally {
    isFetching = false;
  }
}

function startPolling() {
  // Немедленный первый запрос
  pollOnce();
  // Интервал для последующих; setInterval допускает накопление — но мы предотвращаем перекрытие isFetching
  pollingHandle = setInterval(pollOnce, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollingHandle) {
    clearInterval(pollingHandle);
    pollingHandle = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar('sensor-sidebar', {}); // начальный пустой рендер
  startPolling();
  // Остановить при выгрузке страницы
  window.addEventListener('beforeunload', stopPolling);
});
