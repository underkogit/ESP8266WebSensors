let host = "http://192.168.0.100";
let API_URL = host + "/api/sensors";
let sensorChart = null;
let pollingHandle = null;
let isFetching = false;
const POLL_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 800;

const PARAM_COLORS = {
   temperature: "rgba(239, 68, 68, 0.8)", // красный
   humidity: "rgba(59, 130, 246, 0.8)", // синий
   pressure: "rgba(139, 92, 246, 0.8)", // фиолетовый
};

function formatNumber(n) {
   return (Math.round(n * 100) / 100).toLocaleString("ru-RU", {
      maximumFractionDigits: 2,
   });
}

async function pingRange(startIP, endIP) {
   const start = parseInt(startIP.split(".").pop());
   const end = parseInt(endIP.split(".").pop());

   const requests = []; // Массив для хранения промисов

   // Заполнение массива промисов
   for (let i = start; i <= end; i++) {
      const url = `http://192.168.0.${i}/api/ping`;

      const request = fetch(url)
         .then((response) => {
            if (!response.ok) {
               return { ip: `192.168.0.${i}`, status: false }; // Ошибка при запросе
            }

            return response.json().then((data) => {
               return { ip: `192.168.0.${i}`, status: !!data.status }; // Преобразуем статус в boolean
            });
         })
         .catch(() => {
            return { ip: `192.168.0.${i}`, status: false }; // Ошибка при выполнении запроса
         });

      requests.push(request); // Добавляем промис в массив
   }

   // Ожидание завершения всех промисов
   const results = await Promise.all(requests);

   // Фильтрация результатов для получения только тех, где статус true
   const successfulPings = results.filter((result) => result.status === true);
   return successfulPings; // Возвращаем массив с успешными результатами
}

function updateChartData(sensorKey, paramName, value) {
   if (!sensorChart) {
      sensorChart = initSensorChart();
      if (!sensorChart) return;
   }

   // Если изменился датчик или параметр, очищаем график
   if (currentSensorKey !== sensorKey || currentParamName !== paramName) {
      sensorChart.data.datasets[0].data = [];
      currentSensorKey = sensorKey;
      currentParamName = paramName;
      sensorChart.data.datasets[0].label = `${sensorKey} - ${paramName}`;
   }

   // Добавляем новое значение
   const timestamp = Date.now();
   sensorChart.data.datasets[0].data.push({
      x: timestamp,
      y: value,
   });

   // Ограничиваем количество точек
   if (sensorChart.data.datasets[0].data.length > MAX_DATA_POINTS) {
      sensorChart.data.datasets[0].data.shift();
   }

   // Обновляем график
   sensorChart.update("none");
}

function createElementA(nameElement, className, textContent) {
   const name = document.createElement(nameElement);
   name.className = className;
   name.textContent = textContent;
   return name;
}

function renderSidebar(containerId, sensors) {
   const container = document.getElementById(containerId);
   if (!container) return;
   container.innerHTML = "";

   Object.entries(sensors).forEach(([key, sensor]) => {
      const section = document.createElement("section");
      section.className = "sensor";

      const header = document.createElement("div");
      header.className = "sensor-header";

      header.appendChild(createElementA("div", "sensor-name", key));
      header.appendChild(
         createElementA(
            "div",
            "sensor-meta",
            Object.keys(sensor).length + " параметр(ы)"
         )
      );

      section.appendChild(header);

      Object.entries(sensor).forEach(([pname, pval]) => {
         const row = document.createElement("div");
         row.className = "param";

         const pnameEl = document.createElement("div");
         pnameEl.className = "param-name";
         pnameEl.textContent = pname;

         const pvalEl = document.createElement("div");
         pvalEl.className = "param-value";
         pvalEl.textContent =
            pval && typeof pval.value === "number"
               ? `${formatNumber(pval.value)} ${pval.unit || ""}`
               : "-";

         row.appendChild(pnameEl);
         row.appendChild(pvalEl);
         section.appendChild(row);
      });

      container.appendChild(section);
   });
}

function fetchWithTimeout(url, timeout = REQUEST_TIMEOUT_MS) {
   const controller = new AbortController();
   const id = setTimeout(() => controller.abort(), timeout);
   return fetch(url, { signal: controller.signal }).finally(() =>
      clearTimeout(id)
   );
}

async function pollOnce() {
   if (isFetching) return;
   isFetching = true;
   try {
      const res = await fetchWithTimeout(API_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      renderSidebar("sensor-sidebar", json);
   } catch (err) {
      const container = document.getElementById("sensor-sidebar");
      if (container) {
         container.innerHTML = `<div class="sensor"><div class="sensor-header"><div class="sensor-name">Ошибка</div><div class="sensor-meta">${err.message}</div></div></div>`;
      }
      console.error("Poll error:", err);
   } finally {
      isFetching = false;
   }
}

function startPolling() {
   pingRange("192.168.0.100", "192.168.0.130").then((successfulPings) => {
      host = "http://" + successfulPings.map((result) => result.ip)[0];
      API_URL = host + "/api/sensors";
      console.log(host);
   });
   pollOnce();
   pollingHandle = setInterval(pollOnce, POLL_INTERVAL_MS);
}

function stopPolling() {
   if (pollingHandle) {
      clearInterval(pollingHandle);
      pollingHandle = null;
   }
}

document.addEventListener("DOMContentLoaded", () => {
   renderSidebar("sensor-sidebar", {});
   startPolling();
   window.sensorChart = initChart();
   window.addEventListener("beforeunload", stopPolling);
});
