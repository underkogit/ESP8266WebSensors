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

         row.appendChild(
            createElementA(
               "div",
               "param-value",
               pval && typeof pval.value === "number"
                  ? `${formatNumber(pval.value)} ${pval.unit || ""}`
                  : "-"
            )
         );
         row.appendChild(createElementA("div", "param-name", pname));

         section.appendChild(row);
      });

      container.appendChild(section);
   });
}
