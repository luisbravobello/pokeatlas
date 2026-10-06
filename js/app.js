// Punto de entrada: conecta e inicia los módulos, sin incluir su implementación.
import { initNavigation } from "./navigation.js";
import { initPokemonDetail } from "./pokemon-detail.js";
import { initPokedex } from "./pokedex.js";
import { initTypeChart } from "./type-chart.js";
import { initImages } from "./images.js";
import { initHistory } from "./history.js";
import { initItems } from "./items.js";

initNavigation();
const showDetail = initPokemonDetail();
initPokedex(showDetail);
initTypeChart();
initImages();
initHistory();
initItems();
