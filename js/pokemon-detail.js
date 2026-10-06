// Ficha modal: estadísticas, habilidades y familia evolutiva.
import { API, getData } from "./api.js";
import { badge, artwork, addImageFallback } from "./pokemon-ui.js";
export function initPokemonDetail() {
  const dialog = document.querySelector("#pokemon-dialog");
  let detailToken = 0;
  function showDetail(pokemon) {
    const target = document.querySelector("#pokemon-detail");
    target.replaceChildren(
      document
        .querySelector("#pokemon-detail-template")
        .content.cloneNode(true),
    );
    const img = target.querySelector("img");
    img.src = artwork(pokemon);
    img.alt = pokemon.name;
    addImageFallback(img);
    target.querySelector(".muted").textContent =
      "#" + String(pokemon.id).padStart(3, "0");
    target.querySelector("h2").textContent = pokemon.name;
    pokemon.types.forEach((t) =>
      target.querySelector(".badges").append(badge(t.type.name)),
    );
    target.querySelector(".detail-meta").textContent =
      `${pokemon.height / 10} m de altura · ${pokemon.weight / 10} kg de peso`;
    const labels = [
      "PS",
      "Ataque",
      "Defensa",
      "At. especial",
      "Def. especial",
      "Velocidad",
    ];
    pokemon.stats.forEach((s, i) => {
      const row = document
        .querySelector("#stat-template")
        .content.firstElementChild.cloneNode(true);
      row.querySelector(".stat-label").textContent = labels[i];
      row.querySelector("progress").value = s.base_stat;
      row.querySelector("progress").setAttribute("aria-label", labels[i]);
      row.querySelector(".stat-value").textContent = s.base_stat;
      target.querySelector(".stats").append(row);
    });
    target.querySelector(".abilities").textContent = pokemon.abilities
      .map(
        (a) =>
          a.ability.name.replaceAll("-", " ") +
          (a.is_hidden ? " (oculta)" : ""),
      )
      .join(" · ");
    if (!dialog.open) dialog.showModal();
    loadEvolutions(pokemon, ++detailToken);
  }

  // Une todas las ramas de la cadena: Eevee, por ejemplo, tiene varias evoluciones.
  async function loadEvolutions(pokemon, token) {
    const message = document.querySelector("#evolution-status");
    const list = document.querySelector("#evolution-list");
    try {
      const species = await getData("pokemon-species/" + pokemon.species.name);
      const chain = await getData(species.evolution_chain.url.replace(API, ""));
      const names = [];
      function visit(node) {
        names.push(node.species.name);
        node.evolves_to.forEach(visit);
      }
      visit(chain.chain);
      const results = await Promise.all(
        names.map((name) => getData("pokemon/" + name)),
      );
      if (token !== detailToken) return;
      results.forEach((data) => {
        const entry = document
          .querySelector("#evolution-template")
          .content.firstElementChild.cloneNode(true);
        const image = entry.querySelector("img");
        image.src = artwork(data);
        image.alt = data.name;
        addImageFallback(image);
        entry.querySelector("span").textContent = data.name;
        entry
          .querySelector("button")
          .addEventListener("click", () => showDetail(data));
        list.append(entry);
      });
      message.textContent =
        names.length === 1
          ? "Este Pokémon no tiene evoluciones."
          : "Familia evolutiva completa, incluidas sus ramas. Pulsa un Pokémon para abrir su ficha.";
    } catch {
      if (token === detailToken)
        message.textContent =
          "No se pudieron consultar las evoluciones. Vuelve a abrir la ficha para reintentar.";
    }
  }
  document
    .querySelector("#close-dialog")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });

  // La Pokédex recibe esta función sin conocer los elementos internos de la ficha.
  return showDetail;
}
