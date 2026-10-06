// Presentación común de Pokémon: etiquetas de tipo, imagen y alternativa si falla.
const types = {
  normal: ["Normal", "#eceef0", "#515861"],
  fire: ["Fuego", "#ffdfce", "#993b13"],
  water: ["Agua", "#dbeaff", "#215f9e"],
  electric: ["Eléctrico", "#fce9a1", "#765900"],
  grass: ["Planta", "#dcefd8", "#38662e"],
  ice: ["Hielo", "#d8f3f4", "#286567"],
  fighting: ["Lucha", "#f4d6d2", "#933d32"],
  poison: ["Veneno", "#eedcf5", "#783e91"],
  ground: ["Tierra", "#f1e2cc", "#7e5c27"],
  flying: ["Volador", "#e5e4fa", "#60518d"],
  psychic: ["Psíquico", "#ffdae5", "#9b355b"],
  bug: ["Bicho", "#e6edc7", "#5d6d1e"],
  rock: ["Roca", "#eae3d2", "#73602e"],
  ghost: ["Fantasma", "#e4def0", "#604b82"],
  dragon: ["Dragón", "#dce2fa", "#4a54a0"],
  dark: ["Siniestro", "#e1dcd9", "#594a42"],
  steel: ["Acero", "#e1e9ee", "#48606d"],
  fairy: ["Hada", "#f9dff0", "#943d75"],
};

export function badge(type) {
  const [name, bg, ink] = types[type] || [type, "#eceef0", "#515861"];
  const element = document.createElement("span");
  element.className = "badge";
  element.textContent = name;
  element.style.setProperty("--type-bg", bg);
  element.style.setProperty("--type-ink", ink);
  return element;
}
export function artwork(pokemon) {
  return (
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default
  );
}
export function addImageFallback(img) {
  img.addEventListener(
    "error",
    () => {
      img.hidden = true;
    },
    { once: true },
  );
}
