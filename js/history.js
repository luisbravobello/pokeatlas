// Consulta la historia en Wikipedia e inserta solamente texto, nunca HTML externo.
export function initHistory() {
  // Wikipedia devuelve texto plano: nunca insertamos HTML externo en la página.
  function appendParagraphs(target, paragraphs) {
    target.replaceChildren();
    paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      target.append(p);
    });
  }
  async function loadHistory() {
    const status = document.querySelector("#history-status");
    const retry = document.querySelector("#history-retry");
    status.classList.remove("error");
    status.textContent = "Consultando la historia en Wikipedia…";
    retry.hidden = true;
    try {
      const url = new URL("https://es.wikipedia.org/w/api.php");
      url.search = new URLSearchParams({
        action: "query",
        prop: "extracts",
        explaintext: "1",
        redirects: "1",
        format: "json",
        origin: "*",
        titles: "Pokémon rojo fuego y Pokémon verde hoja",
      });
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("No se pudo consultar Wikipedia.");
      const data = await response.json();
      if (data.error || !data.query?.pages)
        throw new Error("Wikipedia no devolvió el artículo.");
      const page = Object.values(data.query.pages)[0];
      const text = page.extract;
      if (!text) throw new Error("El artículo no contiene texto disponible.");
      const intro = text.split(/^== /m)[0].trim().split(/\n+/).filter(Boolean);
      const plot = text.match(
        /^=== Trama ===\s*([\s\S]*?)(?=^== |$(?![\s\S]))/m,
      )?.[1];
      const paragraphs = plot?.trim().split(/\n+/).filter(Boolean);
      if (!intro.length || !paragraphs || paragraphs.length < 3)
        throw new Error(
          "El artículo cambió de estructura; consulta la fuente para leer la historia.",
        );
      appendParagraphs(
        document.querySelector("#history-intro"),
        intro.slice(0, 1),
      );
      appendParagraphs(
        document.querySelector("#history-start"),
        paragraphs.slice(0, 2),
      );
      appendParagraphs(
        document.querySelector("#history-plot"),
        paragraphs.slice(2),
      );
      document.querySelector("#history-source").href =
        "https://es.wikipedia.org/?curid=" + page.pageid;
      document.querySelector("#history-content").hidden = false;
      status.textContent = "Fuente consultada: Wikipedia en español.";
    } catch (error) {
      status.classList.add("error");
      status.textContent = error.message + " Puedes reintentar la consulta.";
      retry.hidden = false;
    }
  }
  document
    .querySelector("#history-retry")
    .addEventListener("click", loadHistory);

  loadHistory();
}
