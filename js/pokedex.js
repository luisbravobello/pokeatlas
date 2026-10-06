// Búsqueda regional, filtro por tipo, tarjetas y paginación de la Pokédex.
import { getData } from "./api.js";
import { badge, artwork, addImageFallback } from "./pokemon-ui.js";
export function initPokedex(showDetail) {
  const grid = document.querySelector("#pokemon-grid");
  const status = document.querySelector("#catalog-status");
  const previousPage = document.querySelector("#dex-prev");
  const nextPage = document.querySelector("#dex-next");
  const filter = document.querySelector("#type-filter");
  const search = document.querySelector("#search");
  const regionFilter = document.querySelector("#region-filter");

  let page = 0;
  let catalogToken = 0;
  function makeCard(pokemon) {
    const card = document
      .querySelector("#pokemon-card-template")
      .content.firstElementChild.cloneNode(true);
    card.setAttribute("aria-label", `Ver ficha de ${pokemon.name}`);
    const img = card.querySelector("img");
    img.src = artwork(pokemon);
    addImageFallback(img);
    card.querySelector(".number").textContent =
      "#" + String(pokemon.id).padStart(3, "0");
    card.querySelector("h3").textContent = pokemon.name;
    pokemon.types.forEach((t) =>
      card.querySelector(".badges").append(badge(t.type.name)),
    );
    card.addEventListener("click", () => showDetail(pokemon));
    return card;
  }

  // Un contador evita que una petición antigua sobrescriba la búsqueda más reciente.
  async function loadCatalog(reset = true) {
    const token = ++catalogToken;
    if (reset) page = 0;
    grid.replaceChildren();
    status.classList.remove("error");
    status.textContent = "Consultando PokéAPI…";
    previousPage.disabled = true;
    nextPage.disabled = true;
    const query = search.value.trim().toLowerCase();
    try {
      // Algunas regiones dividen su Pokédex en zonas o expansiones.
      const regionalDexes = {
        kalos: ["kalos-central", "kalos-coastal", "kalos-mountain"],
        galar: ["galar", "isle-of-armor", "crown-tundra"],
        paldea: ["paldea", "kitakami", "blueberry"],
      };
      const dexNames = regionalDexes[regionFilter.value] || [
        regionFilter.value,
      ];
      const dexes = await Promise.all(
        dexNames.map((name) => getData("pokedex/" + name)),
      );
      if (token !== catalogToken) return;
      const entries = [
        ...new Map(
          dexes.flatMap((dex) =>
            dex.pokemon_entries.map((entry) => [
              Number(
                entry.pokemon_species.url.split("/").filter(Boolean).pop(),
              ),
              entry.pokemon_species.name,
            ]),
          ),
        ).entries(),
      ];
      let ids = entries.map(([id]) => id);
      document.querySelector("#dex-region-label").textContent =
        regionFilter.selectedOptions[0].textContent;
      if (query) {
        ids = entries
          .filter(
            ([id, name]) =>
              String(id) === query.replace(/^#/, "") || name.includes(query),
          )
          .map(([id]) => id);
      }
      if (filter.value) {
        const data = await getData("type/" + filter.value);
        if (token !== catalogToken) return;
        const typeIds = new Set(
          data.pokemon.map((p) =>
            Number(p.pokemon.url.split("/").filter(Boolean).pop()),
          ),
        );
        ids = ids.filter((id) => typeIds.has(id));
      }
      if (!ids.length) {
        status.textContent = "No hay Pokémon que coincidan con estos filtros.";
        document.querySelector("#dex-page").textContent = "Sin resultados";
        return;
      }
      ids.sort((a, b) => a - b);
      const totalPages = Math.ceil(ids.length / 12);
      page = Math.min(page, totalPages - 1);
      const batch = ids.slice(page * 12, page * 12 + 12);
      const results = await Promise.allSettled(
        batch.map((id) => getData("pokemon/" + id)),
      );
      if (token !== catalogToken) return;
      const successes = results.filter((r) => r.status === "fulfilled");
      successes.forEach((r) => grid.append(makeCard(r.value)));
      if (!successes.length && batch.length)
        throw new Error(
          "No se pudieron cargar los Pokémon. Pulsa Buscar para reintentar.",
        );
      const failures = results.length - successes.length;
      status.textContent = `${ids.length} Pokémon encontrados${failures ? ` · ${failures} no se pudieron cargar; pulsa Buscar para reintentar.` : ""}`;
      document.querySelector("#dex-page").textContent =
        `Página ${page + 1} de ${totalPages}`;
      previousPage.disabled = page === 0;
      nextPage.disabled = page === totalPages - 1;
    } catch (error) {
      if (token !== catalogToken) return;
      status.classList.add("error");
      status.textContent = `${error.message} Comprueba tu conexión y pulsa Buscar para reintentar.`;
    }
  }
  document.querySelector("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    loadCatalog();
  });
  filter.addEventListener("change", () => loadCatalog());
  regionFilter.addEventListener("change", () => {
    search.value = "";
    loadCatalog();
  });
  previousPage.addEventListener("click", () => {
    page--;
    loadCatalog(false);
  });
  nextPage.addEventListener("click", () => {
    page++;
    loadCatalog(false);
  });
  document.querySelectorAll("[data-dex-type]").forEach((button) =>
    button.addEventListener("click", () => {
      filter.value =
        filter.value === button.dataset.dexType ? "" : button.dataset.dexType;
      document
        .querySelectorAll("[data-dex-type]")
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(b.dataset.dexType === filter.value),
          ),
        );
      loadCatalog();
    }),
  );
  document.querySelector("#dex-reset").addEventListener("click", () => {
    search.value = "";
    regionFilter.value = "national";
    filter.value = "";
    document
      .querySelectorAll("[data-dex-type]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    loadCatalog();
  });

  loadCatalog();
}
