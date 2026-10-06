// Completa las imágenes del destacado y de los objetos con tarjetas en HTML.
import { getData } from "./api.js";
import { artwork, addImageFallback } from "./pokemon-ui.js";
export async function initImages() {
  // Solo la imagen de estos objetos requiere una consulta; sus tarjetas están en HTML.
  document.querySelectorAll("[data-item]").forEach(async (image) => {
    try {
      const item = await getData("item/" + image.dataset.item);
      if (item.sprites.default) {
        image.src = item.sprites.default;
        image.hidden = false;
      }
    } catch {
      image.hidden = true;
    }
  });

  try {
    const pikachu = await getData("pokemon/25");
    const image = document.querySelector("#featured-image");
    image.src = artwork(pikachu);
    addImageFallback(image);
  } catch {
    document.querySelector("#featured-image").hidden = true;
  }
}
