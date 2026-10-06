// Acceso compartido a PokéAPI: reutiliza respuestas y limita el tiempo de espera.
export const API = "https://pokeapi.co/api/v2/";
const cache = new Map();
export async function getData(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(API + path, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "No encontramos ese Pokémon."
        : "No se pudo consultar PokéAPI.",
    );
  const data = await response.json();
  cache.set(path, data);
  return data;
}
