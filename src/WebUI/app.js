let host = "http://192.168.0.100";
let API_URL = host + "/api/sensors";

let pollingHandle = null;
let isFetching = false;
const POLL_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 800;

function formatNumber(n) {
   return (Math.round(n * 100) / 100).toLocaleString("ru-RU", {
      maximumFractionDigits: 2,
   });
}

async function pingRangeParallel(startIP, endIP) {
   const baseIP = "192.168.0.";
   const start = parseInt(startIP.split(".").pop());
   const end = parseInt(endIP.split(".").pop());

   const ips = Array.from(
      { length: end - start + 1 },
      (_, i) => `${baseIP}${start + i}`
   );

   const requests = ips.map((ip) =>
      fetch(`http://${ip}/api/ping`, { timeout: 2000 })
         .then((response) =>
            response.ok ? { ip, status: true } : { ip, status: false }
         )
         .catch(() => ({ ip, status: false }))
   );

   const results = await Promise.allSettled(requests);
   return results
      .filter((r) => r.status === "fulfilled" && r.value.status)
      .map((r) => r.value);
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
   pingRangeParallel("192.168.0.100", "192.168.0.130").then(
      (successfulPings) => {
         host = "http://" + successfulPings.map((result) => result.ip)[0];
         API_URL = host + "/api/sensors";
         console.log(host);
      }
   );
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
