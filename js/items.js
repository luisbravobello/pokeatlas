// Catálogo de objetos: índice traducido, categorías, tarjetas y paginación.
// Su estado y sus controles son independientes de la Pokédex.
import { getData } from "./api.js";
export function initItems() {
  // Las listas provienen de la API; no limitamos las regiones a una lista propia.
  const prettyName = (name) =>
    ({
      unova: "Teselia",
      firered: "Rojo Fuego",
      leafgreen: "Verde Hoja",
      "firered-leafgreen": "Rojo Fuego / Verde Hoja",
      "gold-silver": "Oro / Plata",
      crystal: "Cristal",
      "heartgold-soulsilver": "Oro HeartGold / Plata SoulSilver",
      "sword-shield": "Espada / Escudo",
      healing: "Curación",
      "standard-balls": "Poké Balls",
      revival: "Reanimación",
      "status-cures": "Curas de estado",
      "original-johto": "Johto original",
      "updated-johto": "Johto actualizada",
    })[name] ||
    name.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const localizedName = (data) =>
    data.names?.find((n) => n.language.name === "es")?.name ||
    prettyName(data.name);
  let itemPage = 0;
  let itemRequest = 0;
  let itemIndexPromise;
  const categoryNames = new Map();
  const categoryTranslations = {
    "All machines": "Máquinas técnicas",
    "All mail": "Correo",
    "Apricorn balls": "Balls de bonguri",
    "Apricorn box": "Caja de bonguris",
    "Bad held items": "Objetos equipados perjudiciales",
    "Baking only": "Ingredientes de repostería",
    "Catching bonus": "Ayudas de captura",
    Choice: "Objetos de elección",
    Collectibles: "Coleccionables",
    "Curry ingredients": "Ingredientes de curri",
    "Data cards": "Tarjetas de datos",
    "Dex completion": "Completar la Pokédex",
    "Dynamax crystals": "Cristales Dinamax",
    "Effort drop": "Reducción de esfuerzo",
    "Effort training": "Entrenamiento de esfuerzo",
    "Event items": "Objetos de eventos",
    Evolution: "Evolución",
    Flutes: "Flautas",
    Gameplay: "Funciones del juego",
    Healing: "Curación",
    "Held items": "Objetos equipados",
    "In a pinch": "Uso en apuros",
    Jewels: "Gemas",
    Loot: "Tesoros",
    Medicine: "Medicinas",
    "Mega Stones": "Megapiedras",
    Memories: "Discos",
    "Miracle shooter": "Lanzador de objetos",
    Mulch: "Abonos",
    "Nature mints": "Mentas",
    Other: "Otros",
    "Picky healing": "Curación especial",
    Picnic: "Pícnic",
    Plates: "Tablas",
    "Plot advancement": "Avance de la historia",
    "PP recovery": "Recuperación de PP",
    Revival: "Reanimación",
    "Sandwich ingredients": "Ingredientes de bocadillos",
    Scarves: "Pañuelos",
    "Special balls": "Poké Balls especiales",
    "Species candies": "Caramelos de especies",
    "Species-specific": "Específicos de especies",
    Spelunking: "Exploración subterránea",
    "Standard balls": "Poké Balls comunes",
    "Stat boosts": "Mejoras de estadísticas",
    "Status cures": "Curas de estado",
    "Tera Shard": "Teralitos",
    "TM materials": "Materiales para MT",
    Training: "Entrenamiento",
    "Type enhancement": "Mejora de tipos",
    "Type protection": "Protección de tipos",
    Unused: "Sin uso",
    Vitamins: "Vitaminas",
    "Z-Crystals": "Cristales Z",
  };
  const normalizeSearch = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[-\s]+/g, " ")
      .trim();
  // El índice oficial permite buscar traducciones sin descargar miles de fichas.
  async function getItemIndex() {
    if (!itemIndexPromise)
      itemIndexPromise = (async () => {
        const base =
          "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/";
        const files = await Promise.all(
          ["items.csv", "item_names.csv", "item_category_prose.csv"].map(
            async (file) => {
              const response = await fetch(base + file, {
                signal: AbortSignal.timeout(15000),
              });
              if (!response.ok) throw new Error("No se pudo cargar el índice.");
              return (await response.text())
                .trim()
                .split(/\r?\n/)
                .slice(1)
                .map((line) => {
                  const [id, second, ...rest] = line.split(",");
                  return [
                    id,
                    second,
                    rest.join(",").replace(/^"|"$/g, "").replaceAll('""', '"'),
                  ];
                });
            },
          ),
        );
        const names = new Map(
          files[1]
            .filter((row) => row[1] === "7")
            .map((row) => [row[0], row[2]]),
        );
        files[2]
          .filter((row) => row[1] === "9")
          .forEach((row) =>
            categoryNames.set(row[0], categoryTranslations[row[2]] || row[2]),
          );
        files[2]
          .filter((row) => row[1] === "7")
          .forEach((row) => categoryNames.set(row[0], row[2]));
        const index = files[0].map((row) => ({
          id: row[0],
          name: row[1],
          category: row[2].split(",")[0],
          label: names.get(row[0]) || prettyName(row[1]),
        }));
        const select = document.querySelector("#item-category");
        const categories = [...new Set(index.map((item) => item.category))];
        categories
          .sort((a, b) =>
            (categoryNames.get(a) || a).localeCompare(
              categoryNames.get(b) || b,
              "es",
            ),
          )
          .forEach((id) => {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = categoryNames.get(id) || "Categoría " + id;
            select.append(option);
          });
        return index;
      })().catch((error) => {
        itemIndexPromise = null;
        throw error;
      });
    return itemIndexPromise;
  }
  // Rellena la plantilla HTML y muestra una alternativa si falta el sprite.
  function itemCard(data) {
    const card = document
      .querySelector("#item-card-template")
      .content.firstElementChild.cloneNode(true);
    const img = card.querySelector("img");
    const fallback = card.querySelector(".item-image-fallback");
    img.hidden = !data.sprites.default;
    fallback.hidden = Boolean(data.sprites.default);
    if (data.sprites.default) {
      img.src = data.sprites.default;
      img.alt = localizedName(data);
      img.addEventListener(
        "error",
        () => {
          img.hidden = true;
          fallback.hidden = false;
        },
        { once: true },
      );
    }
    card.querySelector("h3").textContent = localizedName(data);
    card.querySelector(".item-id").textContent = `#${data.id} · ${data.name}`;
    const entries = data.flavor_text_entries.filter(
      (e) => e.language.name === "es",
    );
    const entry = entries.at(-1);
    card.querySelector("p").textContent =
      entry?.text.replace(/[\n\f]/g, " ") ||
      data.effect_entries.find((e) => e.language.name === "en")?.short_effect ||
      "La API no ofrece una descripción para este objeto.";
    card.querySelector("small").textContent = entry
      ? `Descripción: ${prettyName(entry.version_group.name)}`
      : "Descripción en inglés o no disponible.";
    card.querySelector(".pill").textContent =
      categoryNames.get(data.category.url.split("/").filter(Boolean).pop()) ||
      prettyName(data.category.name);
    return card;
  }
  // Filtra el índice y descarga solo los objetos de la página actual.
  // El contador descarta respuestas de búsquedas anteriores.
  async function loadItems(reset = true) {
    const token = ++itemRequest;
    const status = document.querySelector("#items-status");
    const grid = document.querySelector("#api-item-grid");
    const previous = document.querySelector("#items-prev");
    const next = document.querySelector("#items-next");
    const pageLabel = document.querySelector("#items-page");
    if (reset) itemPage = 0;
    grid.replaceChildren();
    previous.disabled = true;
    next.disabled = true;
    status.classList.remove("error");
    status.textContent = "Consultando objetos…";
    pageLabel.textContent = "Cargando…";
    try {
      const index = await getItemIndex();
      if (token !== itemRequest) return;
      const query = normalizeSearch(
        document.querySelector("#item-search").value,
      );
      const category = document.querySelector("#item-category").value;
      const matches = index.filter(
        (item) =>
          (!category || item.category === category) &&
          (!query ||
            item.id === query ||
            normalizeSearch(item.name).includes(query) ||
            normalizeSearch(item.label).includes(query)),
      );
      if (!matches.length) {
        status.textContent =
          "No hay objetos que coincidan con la búsqueda y la categoría. Prueba otro nombre o limpia los filtros.";
        pageLabel.textContent = "Sin resultados";
        return;
      }
      const pages = Math.ceil(matches.length / 12);
      itemPage = Math.min(itemPage, pages - 1);
      const batch = matches.slice(itemPage * 12, itemPage * 12 + 12);
      const results = await Promise.allSettled(
        batch.map((item) => getData("item/" + item.name)),
      );
      if (token !== itemRequest) return;
      const loaded = results.filter((r) => r.status === "fulfilled");
      if (!loaded.length) throw new Error();
      loaded.forEach((r) => grid.append(itemCard(r.value)));
      status.textContent = `${matches.length} objetos encontrados${loaded.length < results.length ? " · Algunos no pudieron cargarse; pulsa Buscar objeto para reintentar." : ""}`;
      pageLabel.textContent = `Página ${itemPage + 1} de ${pages}`;
      previous.disabled = itemPage === 0;
      next.disabled = itemPage === pages - 1;
    } catch {
      if (token === itemRequest) {
        status.classList.add("error");
        status.textContent =
          "No se pudo cargar el catálogo. Comprueba tu conexión y pulsa Buscar objeto para reintentar.";
        pageLabel.textContent = "Consulta no disponible";
      }
    }
  }
  document
    .querySelector("#item-search-form")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      loadItems();
    });
  document.querySelector("#item-reset").addEventListener("click", () => {
    document.querySelector("#item-search").value = "";
    document.querySelector("#item-category").value = "";
    loadItems();
  });
  document
    .querySelector("#item-category")
    .addEventListener("change", () => loadItems());
  document.querySelector("#items-prev").addEventListener("click", () => {
    itemPage--;
    loadItems(false);
  });
  document.querySelector("#items-next").addEventListener("click", () => {
    itemPage++;
    loadItems(false);
  });

  loadItems();
}
