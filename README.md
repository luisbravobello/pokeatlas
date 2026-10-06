# PokéAtlas

PokéAtlas es una página web de consulta para fans de Pokémon. Permite explorar Pokémon por región, conocer las ventajas de los tipos y consultar objetos. También incluye una guía de Kanto con sus líderes de gimnasio, medallas y el inicio de la aventura en Pokémon Rojo Fuego y Verde Hoja.

El proyecto está construido con **HTML, CSS y JavaScript**, sin frameworks. Su propósito es aprender desarrollo web paso a paso, manteniendo la estructura en HTML, la presentación en CSS y las funcionalidades en JavaScript.

## Funcionalidades

### Pokédex

- Selector de región y juego, incluida la Pokédex nacional.
- Búsqueda por nombre completo, nombre parcial o número nacional.
- Filtro por tipo con iconos SVG.
- Botón para limpiar filtros.
- Paginación de 12 Pokémon por página.
- Fichas con imagen, tipos, altura, peso, estadísticas, habilidades y familia evolutiva.

La lista regional corresponde a la Pokédex del juego indicado. Un Pokémon puede aparecer en varias regiones. Las fichas muestran su forma predeterminada y la familia evolutiva completa, que puede incluir especies de otros juegos.

### Tipos

Consulta la eficacia de los ataques de cada uno de los 18 tipos: daño doble, daño reducido e inmunidades. La tabla utiliza las relaciones actuales de PokéAPI; las reglas de los juegos antiguos pueden variar.

### Guía de Kanto

- Ocho líderes de gimnasio con imagen, ciudad, especialidad y medalla.
- Introducción e historia de Rojo Fuego y Verde Hoja, consultadas desde Wikipedia en español.
- Imágenes de Rojo, Hoja y Pueblo Paleta.
- Argumento posterior oculto mediante un desplegable con aviso de spoilers.
- Información básica sobre Azul y su elección de Pokémon inicial.
- Selección de objetos útiles para comenzar la aventura.

### Catálogo de objetos

- Búsqueda por nombre en español, identificador o número.
- Coincidencias parciales y búsqueda sin necesidad de escribir tildes.
- Filtro por categoría.
- Paginación de 12 objetos por página.
- Imagen, descripción y versión de referencia cuando están disponibles.
- Indicador «Imagen no disponible» cuando la API no proporciona una imagen o esta falla al cargar.

El catálogo reúne objetos de distintos juegos. No todos están disponibles en cada versión, y los efectos pueden cambiar entre juegos.

### Navegación y cierre

- Menú que permanece visible mientras se desplaza la página.
- Video de YouTube sobre el inicio de Rojo Fuego, sin reproducción automática.
- Footer con enlaces a las secciones, fuentes y [perfil de GitHub de Luis Bravo Bello](https://github.com/luisbravobello).

## Tecnologías y diseño

| Tecnología | Uso |
| --- | --- |
| HTML semántico | Estructura, formularios, tablas, navegación y plantillas de fichas |
| CSS Grid y Flexbox | Distribución de tarjetas y adaptación a móviles |
| JavaScript | Consultas a APIs, filtros, paginación y fichas interactivas |
| SVG | Iconos de la interfaz |
| Fredoka | Tipografía de títulos |
| Nunito | Tipografía del cuerpo de texto |

La página utiliza fondo blanco, controles con etiquetas, textos alternativos en imágenes y enlaces para saltar al contenido. Las fichas utilizan el elemento nativo `dialog`.

## Estructura del proyecto

```text
pokeatlas/
├── index.html          # Estructura semántica y plantillas
├── README.md           # Documentación del proyecto
├── assets/
│   ├── style.css       # Estilos y reglas adaptables
│   └── design-system.css # Jerarquía, retícula y sistema visual de WebLab
├── images/             # Líderes, medallas, protagonistas y Pueblo Paleta
└── js/
    ├── app.js             # Punto de entrada: inicia los módulos
    ├── api.js             # Consultas a PokéAPI y caché de respuestas
    ├── navigation.js      # Cabecera y menú móvil
    ├── pokedex.js         # Búsqueda, regiones, tipos y paginación
    ├── pokemon-detail.js  # Ficha modal y evoluciones
    ├── pokemon-ui.js      # Imágenes y etiquetas compartidas
    ├── type-chart.js      # Ventajas y resistencias de tipos
    ├── items.js           # Catálogo, categorías y búsqueda de objetos
    ├── history.js         # Historia consultada en Wikipedia
    └── images.js          # Imágenes del destacado y objetos frecuentes
```

## Cómo abrirlo localmente

1. Abre la carpeta `pokeatlas` en Visual Studio Code.
2. Si utilizas la extensión **Live Server**, abre `index.html` con **Open with Live Server**.
3. Consulta la dirección local que indique la extensión.

También puedes utilizar cualquier servidor HTTP estático que sirva esta carpeta. No hay un proceso de compilación ni dependencias de ejecución que instalar.

### Organización del JavaScript

Se usan módulos nativos del navegador (`import` y `export`). Cada módulo mantiene su propio estado y tiene una responsabilidad concreta: **alta cohesión**. Las consultas comunes están en `api.js` y los recursos visuales de Pokémon en `pokemon-ui.js`, para evitar duplicaciones.

La Pokédex recibe una función para abrir las fichas; no conoce los controles ni el estado del diálogo. La historia, los objetos y la navegación funcionan de forma independiente: **bajo acoplamiento**. Los comentarios explican la responsabilidad de cada archivo y decisiones como la caché o el control de peticiones antiguas.

Abre el proyecto con un servidor HTTP como Live Server; los módulos no deben ejecutarse abriendo `index.html` directamente con `file://`.

### Principios de WebLab aplicados

- **Jerarquía y contraste:** títulos con tamaños fluidos, etiquetas visibles y rojo oscuro para las acciones principales.
- **Retícula de 12 columnas:** portada 7/5, historia y guía 5/7, tarjetas de Pokémon 3 columnas de la retícula y objetos 4. En pantallas pequeñas, el contenido se reorganiza.
- **Sistema de 8 puntos:** variables de 8, 16, 24, 32, 48 y 64 px para separar controles, tarjetas y secciones.
- **Tipografía:** Fredoka expresa la identidad de la guía; Nunito mantiene legible el texto. Los párrafos largos tienen un ancho controlado.
- **Color:** se aplica la idea de 60-30-10 como orientación: blanco dominante, superficies suaves para agrupar y rojo como acento. Los colores de tipos conservan su significado Pokémon; no se fuerzan porcentajes exactos.
- **C.R.A.P.:** contraste entre niveles, repetición de componentes, alineación sobre la retícula y proximidad entre contenido relacionado.
- **Accesibilidad:** foco visible, enlace para saltar al contenido, controles de al menos 44 px, etiquetas asociadas y respeto por la preferencia de movimiento reducido.

Estas decisiones están comentadas en `assets/design-system.css`; el contenido sigue en HTML y las funcionalidades en los módulos JavaScript.

Se necesita conexión a internet para las APIs, las imágenes externas, Google Fonts y el video. Si no ves una modificación reciente, recarga con **Ctrl + F5**.

## Fuentes de datos

- [PokéAPI](https://pokeapi.co/docs/v2): Pokémon, Pokédex regionales, tipos, estadísticas, habilidades, evoluciones, objetos y sprites.
- [Datos públicos de PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv): índices de nombres y categorías usados para buscar objetos sin descargar todas sus fichas.
- [API de Wikipedia / MediaWiki](https://www.mediawiki.org/wiki/API:Main_page): extractos en español del artículo sobre Rojo Fuego y Verde Hoja.
- [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Kanto): referencias de la guía de Kanto.
- [Bulbagarden Archives](https://archives.bulbagarden.net/): imágenes de medallas y Pueblo Paleta.
- [pret/pokefirered](https://github.com/pret/pokefirered): sprites de líderes y protagonistas.
- [YouTube: inicio de Rojo Fuego](https://www.youtube.com/watch?v=TnFd7OoPm9k): video integrado en el cierre.

PokéAPI no requiere una clave para estas consultas. Las respuestas se reutilizan durante la sesión para evitar solicitudes repetidas.

## Alcance y limitaciones

- La Pokédex incluye varias regiones; la historia, los líderes y las medallas de la guía corresponden a Kanto.
- PokéAPI no proporciona en este proyecto equipos de líderes ni sus ataques por combate.
- Algunos objetos carecen de imagen o descripción; la interfaz indica esa ausencia.
- Las habilidades pueden aparecer con sus identificadores en inglés.
- El contenido cargado desde las APIs depende de su disponibilidad y cobertura.

## Créditos

PokéAtlas es un proyecto de fans sin afiliación oficial. Pokémon, sus personajes, imágenes y marcas pertenecen a sus respectivos titulares.

Los extractos de Wikipedia conservan enlaces a su fuente y atribución a sus colaboradores bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Las imágenes del juego tienen sus propios derechos; la licencia del texto de Wikipedia no se aplica a ellas.

## Autor

[Luis Bravo Bello](https://github.com/luisbravobello)
