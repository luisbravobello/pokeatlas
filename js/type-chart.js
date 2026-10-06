// Consulta ventajas y resistencias del tipo seleccionado.
import { getData } from "./api.js";
import { badge } from "./pokemon-ui.js";
export function initTypeChart() {
  let typeToken = 0;
  // Los 18 tipos usan la tabla moderna, independiente de la guía histórica de Kanto.
  document.querySelectorAll("[data-type]").forEach((button) => {
    const id = button.dataset.type;
    button.addEventListener("click", async () => {
      const token = ++typeToken;
      document
        .querySelectorAll("[data-type]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      const result = document.querySelector("#type-result");
      result.textContent = "Consultando relaciones…";
      try {
        const data = await getData("type/" + id);
        if (token !== typeToken) return;
        const relations = document
          .querySelector("#relations-template")
          .content.firstElementChild.cloneNode(true);
        relations.querySelectorAll("[data-relation]").forEach((block) => {
          const entries = data.damage_relations[block.dataset.relation];
          if (entries.length)
            entries.forEach((t) => block.append(badge(t.name)));
          else block.textContent = "Ningún tipo";
        });
        result.replaceChildren(relations);
      } catch {
        if (token === typeToken)
          result.textContent =
            "No se pudo consultar la tabla. Selecciona un tipo para reintentar.";
      }
    });
  });
}
