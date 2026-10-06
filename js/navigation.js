// Controla únicamente la altura de la cabecera y el menú móvil.
export function initNavigation() {
  // La altura puede variar al ajustar la pantalla o cargar las tipografías.
  const headerObserver = new ResizeObserver((entries) => {
    document.documentElement.style.setProperty(
      "--header-height",
      entries[0].target.getBoundingClientRect().height + "px",
    );
  });
  headerObserver.observe(document.querySelector(".site-header"));
  // Menú móvil: el estado accesible y la presentación cambian juntos.
  const menuButton = document.querySelector("#menu-toggle");
  const mainNav = document.querySelector("#main-nav");
  function closeMenu() {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
    mainNav.classList.remove("is-open");
  }
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mainNav.classList.toggle("is-open", open);
  });
  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  matchMedia("(max-width:700px)").addEventListener("change", closeMenu);
}
