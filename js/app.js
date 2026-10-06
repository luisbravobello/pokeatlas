/* Datos y nombres: la API usa identificadores ingleses; la interfaz los traduce. */
const API = 'https://pokeapi.co/api/v2/';
// La altura puede variar al ajustar la pantalla o cargar las tipografías.
const headerObserver = new ResizeObserver(entries=>{
  document.documentElement.style.setProperty('--header-height',entries[0].target.getBoundingClientRect().height+'px');
});
headerObserver.observe(document.querySelector('.site-header'));
const types = {
  normal:['Normal','#eceef0','#515861'],fire:['Fuego','#ffdfce','#993b13'],water:['Agua','#dbeaff','#215f9e'],electric:['Eléctrico','#fce9a1','#765900'],grass:['Planta','#dcefd8','#38662e'],ice:['Hielo','#d8f3f4','#286567'],fighting:['Lucha','#f4d6d2','#933d32'],poison:['Veneno','#eedcf5','#783e91'],ground:['Tierra','#f1e2cc','#7e5c27'],flying:['Volador','#e5e4fa','#60518d'],psychic:['Psíquico','#ffdae5','#9b355b'],bug:['Bicho','#e6edc7','#5d6d1e'],rock:['Roca','#eae3d2','#73602e'],ghost:['Fantasma','#e4def0','#604b82'],dragon:['Dragón','#dce2fa','#4a54a0'],dark:['Siniestro','#e1dcd9','#594a42'],steel:['Acero','#e1e9ee','#48606d'],fairy:['Hada','#f9dff0','#943d75']
};
const grid = document.querySelector('#pokemon-grid');
const status = document.querySelector('#catalog-status');
const previousPage = document.querySelector('#dex-prev');
const nextPage = document.querySelector('#dex-next');
const filter = document.querySelector('#type-filter');
const search = document.querySelector('#search');
const regionFilter = document.querySelector('#region-filter');
const dialog = document.querySelector('#pokemon-dialog');
const cache = new Map();
let page = 0;
let detailToken = 0;
let catalogToken = 0;
let typeToken = 0;

// Las respuestas repetidas se reutilizan y cada petición tiene un tiempo límite.
async function getData(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(API + path, {signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(response.status === 404 ? 'No encontramos ese Pokémon.' : 'No se pudo consultar PokéAPI.');
  const data = await response.json();
  cache.set(path, data);
  return data;
}
function badge(type) {
  const [name,bg,ink] = types[type] || [type,'#eceef0','#515861'];
  const element = document.createElement('span');
  element.className = 'badge'; element.textContent = name;
  element.style.setProperty('--type-bg',bg); element.style.setProperty('--type-ink',ink);
  return element;
}
function artwork(pokemon) { return pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default; }
function addImageFallback(img) {
  img.addEventListener('error', () => { img.hidden = true; }, {once:true});
}
function makeCard(pokemon) {
  const card = document.querySelector('#pokemon-card-template').content.firstElementChild.cloneNode(true);
  card.setAttribute('aria-label',`Ver ficha de ${pokemon.name}`);
  const img = card.querySelector('img'); img.src = artwork(pokemon); addImageFallback(img);
  card.querySelector('.number').textContent = '#' + String(pokemon.id).padStart(3,'0');
  card.querySelector('h3').textContent = pokemon.name;
  pokemon.types.forEach(t => card.querySelector('.badges').append(badge(t.type.name)));
  card.addEventListener('click', () => showDetail(pokemon));
  return card;
}
function showDetail(pokemon) {
  const target = document.querySelector('#pokemon-detail');
  target.replaceChildren(document.querySelector('#pokemon-detail-template').content.cloneNode(true));
  const img = target.querySelector('img'); img.src = artwork(pokemon); img.alt = pokemon.name; addImageFallback(img);
  target.querySelector('.muted').textContent = '#' + String(pokemon.id).padStart(3,'0');
  target.querySelector('h2').textContent = pokemon.name;
  pokemon.types.forEach(t => target.querySelector('.badges').append(badge(t.type.name)));
  target.querySelector('.detail-meta').textContent = `${pokemon.height / 10} m de altura · ${pokemon.weight / 10} kg de peso`;
  const labels = ['PS','Ataque','Defensa','At. especial','Def. especial','Velocidad'];
  pokemon.stats.forEach((s,i) => {
    const row = document.querySelector('#stat-template').content.firstElementChild.cloneNode(true);
    row.querySelector('.stat-label').textContent = labels[i];
    row.querySelector('progress').value = s.base_stat; row.querySelector('progress').setAttribute('aria-label',labels[i]);
    row.querySelector('.stat-value').textContent = s.base_stat;
    target.querySelector('.stats').append(row);
  });
  target.querySelector('.abilities').textContent = pokemon.abilities.map(a => a.ability.name.replaceAll('-',' ') + (a.is_hidden ? ' (oculta)' : '')).join(' · ');
  if (!dialog.open) dialog.showModal();
  loadEvolutions(pokemon, ++detailToken);
}

// Une todas las ramas de la cadena: Eevee, por ejemplo, tiene varias evoluciones.
async function loadEvolutions(pokemon, token) {
  const message=document.querySelector('#evolution-status');const list=document.querySelector('#evolution-list');
  try {
    const species=await getData('pokemon-species/'+pokemon.species.name);
    const chain=await getData(species.evolution_chain.url.replace(API,''));
    const names=[];function visit(node){names.push(node.species.name);node.evolves_to.forEach(visit);}visit(chain.chain);
    const results=await Promise.all(names.map(name=>getData('pokemon/'+name)));
    if(token!==detailToken)return;
    results.forEach(data=>{const entry=document.querySelector('#evolution-template').content.firstElementChild.cloneNode(true);const image=entry.querySelector('img');image.src=artwork(data);image.alt=data.name;addImageFallback(image);entry.querySelector('span').textContent=data.name;entry.querySelector('button').addEventListener('click',()=>showDetail(data));list.append(entry);});
    message.textContent=names.length===1?'Este Pokémon no tiene evoluciones.':'Familia evolutiva completa, incluidas sus ramas. Pulsa un Pokémon para abrir su ficha.';
  }catch{if(token===detailToken)message.textContent='No se pudieron consultar las evoluciones. Vuelve a abrir la ficha para reintentar.';}
}
document.querySelector('#close-dialog').addEventListener('click',() => dialog.close());
dialog.addEventListener('click',e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close(); } });

// Un contador evita que una petición antigua sobrescriba la búsqueda más reciente.
async function loadCatalog(reset = true) {
  const token = ++catalogToken;
  if (reset) page = 0;
  grid.replaceChildren();
  status.classList.remove('error'); status.textContent = 'Consultando PokéAPI…'; previousPage.disabled = true; nextPage.disabled = true;
  const query = search.value.trim().toLowerCase();
  try {
    // Algunas regiones dividen su Pokédex en zonas o expansiones.
    const regionalDexes = {kalos:['kalos-central','kalos-coastal','kalos-mountain'],galar:['galar','isle-of-armor','crown-tundra'],paldea:['paldea','kitakami','blueberry']};
    const dexNames = regionalDexes[regionFilter.value] || [regionFilter.value];
    const dexes = await Promise.all(dexNames.map(name=>getData('pokedex/'+name)));
    if (token !== catalogToken) return;
    const entries = [...new Map(dexes.flatMap(dex=>dex.pokemon_entries.map(entry=>[Number(entry.pokemon_species.url.split('/').filter(Boolean).pop()),entry.pokemon_species.name]))).entries()];
    let ids = entries.map(([id])=>id);
    document.querySelector('#dex-region-label').textContent = regionFilter.selectedOptions[0].textContent;
    if (query) {
      ids = entries.filter(([id,name])=>String(id)===query.replace(/^#/,'')||name.includes(query)).map(([id])=>id);
    }
    for (const type of [filter.value,document.querySelector('#second-type').value].filter(Boolean)) {
      const data = await getData('type/' + type);
      const typeIds = new Set(data.pokemon.map(p=>Number(p.pokemon.url.split('/').filter(Boolean).pop())));
      ids = ids.filter(id=>typeIds.has(id));
    }
    if (!ids.length) { status.textContent = 'No hay Pokémon que coincidan con estos filtros.';document.querySelector('#dex-page').textContent='Sin resultados'; return; }
    const names=new Map(entries);
    ids.sort(document.querySelector('#dex-sort').value==='name'?(a,b)=>names.get(a).localeCompare(names.get(b)):(a,b)=>a-b);
    const totalPages=Math.ceil(ids.length/12);page=Math.min(page,totalPages-1);
    const batch = ids.slice(page*12,page*12+12);
    const results = await Promise.allSettled(batch.map(id => getData('pokemon/' + id)));
    if (token !== catalogToken) return;
    const successes = results.filter(r => r.status === 'fulfilled');
    successes.forEach(r => grid.append(makeCard(r.value)));
    if (!successes.length && batch.length) throw new Error('No se pudieron cargar los Pokémon. Pulsa Buscar para reintentar.');
    const failures = results.length - successes.length;
    status.textContent = `${ids.length} Pokémon encontrados${failures ? ` · ${failures} no se pudieron cargar; pulsa Buscar para reintentar.` : ''}`;
    document.querySelector('#dex-page').textContent=`Página ${page+1} de ${totalPages}`;
    previousPage.disabled=page===0;nextPage.disabled=page===totalPages-1;
  } catch (error) {
    if (token !== catalogToken) return;
    status.classList.add('error'); status.textContent = `${error.message} Comprueba tu conexión y pulsa Buscar para reintentar.`;
  }
}
document.querySelector('#search-form').addEventListener('submit',e=>{e.preventDefault();loadCatalog();});
filter.addEventListener('change',()=>loadCatalog());
regionFilter.addEventListener('change',()=>{search.value='';loadCatalog();});
previousPage.addEventListener('click',()=>{page--;loadCatalog(false);});
nextPage.addEventListener('click',()=>{page++;loadCatalog(false);});
document.querySelector('#dex-sort').addEventListener('change',()=>loadCatalog());
document.querySelector('#second-type').addEventListener('change',()=>loadCatalog());
document.querySelectorAll('[data-dex-type]').forEach(button=>button.addEventListener('click',()=>{
  filter.value=filter.value===button.dataset.dexType?'':button.dataset.dexType;
  document.querySelectorAll('[data-dex-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dexType===filter.value)));
  loadCatalog();
}));
document.querySelector('#dex-reset').addEventListener('click',()=>{
  search.value='';regionFilter.value='national';filter.value='';document.querySelector('#second-type').value='';document.querySelector('#dex-sort').value='number';
  document.querySelectorAll('[data-dex-type]').forEach(b=>b.setAttribute('aria-pressed','false'));loadCatalog();
});

// Los 18 tipos usan la tabla moderna, independiente de la guía histórica de Kanto.
document.querySelectorAll('[data-type]').forEach(button => {
  const id = button.dataset.type;
  button.addEventListener('click',async()=>{
    const token = ++typeToken;
    document.querySelectorAll('.type-button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const result = document.querySelector('#type-result'); result.textContent = 'Consultando relaciones…';
    try {
      const data = await getData('type/' + id); if(token !== typeToken) return;
      const relations = document.querySelector('#relations-template').content.firstElementChild.cloneNode(true);
      relations.querySelectorAll('[data-relation]').forEach(block=>{
        const entries = data.damage_relations[block.dataset.relation];
        if(entries.length) entries.forEach(t=>block.append(badge(t.name))); else block.textContent='Ningún tipo';
      });
      result.replaceChildren(relations);
    } catch { if(token === typeToken) result.textContent = 'No se pudo consultar la tabla. Selecciona un tipo para reintentar.'; }
  });
});
// Solo la imagen de estos objetos requiere una consulta; sus tarjetas están en HTML.
document.querySelectorAll('[data-item]').forEach(async image => {
  try {
    const item = await getData('item/' + image.dataset.item);
    if (item.sprites.default) { image.src = item.sprites.default; image.hidden = false; }
  } catch { image.hidden = true; }
});

// Wikipedia devuelve texto plano: nunca insertamos HTML externo en la página.
function appendParagraphs(target, paragraphs) {
  target.replaceChildren();
  paragraphs.forEach(text=>{const p=document.createElement('p');p.textContent=text;target.append(p);});
}
async function loadHistory() {
  const status=document.querySelector('#history-status');
  const retry=document.querySelector('#history-retry');
  status.classList.remove('error');status.textContent='Consultando la historia en Wikipedia…';retry.hidden=true;
  try {
    const url=new URL('https://es.wikipedia.org/w/api.php');
    url.search=new URLSearchParams({action:'query',prop:'extracts',explaintext:'1',redirects:'1',format:'json',origin:'*',titles:'Pokémon rojo fuego y Pokémon verde hoja'});
    const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('No se pudo consultar Wikipedia.');
    const data=await response.json();
    if(data.error || !data.query?.pages)throw new Error('Wikipedia no devolvió el artículo.');
    const page=Object.values(data.query.pages)[0];
    const text=page.extract;
    if(!text)throw new Error('El artículo no contiene texto disponible.');
    const intro=text.split(/^== /m)[0].trim().split(/\n+/).filter(Boolean);
    const plot=text.match(/^=== Trama ===\s*([\s\S]*?)(?=^== |$(?![\s\S]))/m)?.[1];
    const paragraphs=plot?.trim().split(/\n+/).filter(Boolean);
    if(!intro.length || !paragraphs || paragraphs.length<3)throw new Error('El artículo cambió de estructura; consulta la fuente para leer la historia.');
    appendParagraphs(document.querySelector('#history-intro'),intro.slice(0,1));
    appendParagraphs(document.querySelector('#history-start'),paragraphs.slice(0,2));
    appendParagraphs(document.querySelector('#history-plot'),paragraphs.slice(2));
    document.querySelector('#history-source').href='https://es.wikipedia.org/?curid='+page.pageid;
    document.querySelector('#history-content').hidden=false;
    status.textContent='Fuente consultada: Wikipedia en español.';
  } catch(error) {
    status.classList.add('error');status.textContent=error.message+' Puedes reintentar la consulta.';retry.hidden=false;
  }
}
document.querySelector('#history-retry').addEventListener('click',loadHistory);
// Las listas provienen de la API; no limitamos las regiones a una lista propia.
const prettyName = name => ({unova:'Teselia',firered:'Rojo Fuego',leafgreen:'Verde Hoja','firered-leafgreen':'Rojo Fuego / Verde Hoja','gold-silver':'Oro / Plata',crystal:'Cristal','heartgold-soulsilver':'Oro HeartGold / Plata SoulSilver','sword-shield':'Espada / Escudo',healing:'Curación','standard-balls':'Poké Balls',revival:'Reanimación','status-cures':'Curas de estado','original-johto':'Johto original','updated-johto':'Johto actualizada'}[name] || name.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()));
const localizedName = data => data.names?.find(n=>n.language.name==='es')?.name || prettyName(data.name);
let itemPage=0;let itemRequest=0;
let itemIndexPromise;
const categoryNames=new Map();
const categoryTranslations={'All machines':'Máquinas técnicas','All mail':'Correo','Apricorn balls':'Balls de bonguri','Apricorn box':'Caja de bonguris','Bad held items':'Objetos equipados perjudiciales','Baking only':'Ingredientes de repostería','Catching bonus':'Ayudas de captura',Choice:'Objetos de elección',Collectibles:'Coleccionables','Curry ingredients':'Ingredientes de curri','Data cards':'Tarjetas de datos','Dex completion':'Completar la Pokédex','Dynamax crystals':'Cristales Dinamax','Effort drop':'Reducción de esfuerzo','Effort training':'Entrenamiento de esfuerzo','Event items':'Objetos de eventos',Evolution:'Evolución',Flutes:'Flautas',Gameplay:'Funciones del juego',Healing:'Curación','Held items':'Objetos equipados','In a pinch':'Uso en apuros',Jewels:'Gemas',Loot:'Tesoros',Medicine:'Medicinas','Mega Stones':'Megapiedras',Memories:'Discos','Miracle shooter':'Lanzador de objetos',Mulch:'Abonos','Nature mints':'Mentas',Other:'Otros','Picky healing':'Curación especial',Picnic:'Pícnic',Plates:'Tablas','Plot advancement':'Avance de la historia','PP recovery':'Recuperación de PP',Revival:'Reanimación','Sandwich ingredients':'Ingredientes de bocadillos',Scarves:'Pañuelos','Special balls':'Poké Balls especiales','Species candies':'Caramelos de especies','Species-specific':'Específicos de especies',Spelunking:'Exploración subterránea','Standard balls':'Poké Balls comunes','Stat boosts':'Mejoras de estadísticas','Status cures':'Curas de estado','Tera Shard':'Teralitos','TM materials':'Materiales para MT',Training:'Entrenamiento','Type enhancement':'Mejora de tipos','Type protection':'Protección de tipos',Unused:'Sin uso',Vitamins:'Vitaminas','Z-Crystals':'Cristales Z'};
const normalizeSearch=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[-\s]+/g,' ').trim();
// El índice oficial permite buscar traducciones sin descargar miles de fichas.
async function getItemIndex(){
  if(!itemIndexPromise)itemIndexPromise=(async()=>{
    const base='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
    const files=await Promise.all(['items.csv','item_names.csv','item_category_prose.csv'].map(async file=>{
      const response=await fetch(base+file,{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('No se pudo cargar el índice.');
      return (await response.text()).trim().split(/\r?\n/).slice(1).map(line=>{const [id,second,...rest]=line.split(',');return [id,second,rest.join(',').replace(/^"|"$/g,'').replaceAll('""','"')];});
    }));
    const names=new Map(files[1].filter(row=>row[1]==='7').map(row=>[row[0],row[2]]));
    files[2].filter(row=>row[1]==='9').forEach(row=>categoryNames.set(row[0],categoryTranslations[row[2]]||row[2]));
    files[2].filter(row=>row[1]==='7').forEach(row=>categoryNames.set(row[0],row[2]));
    const index=files[0].map(row=>({id:row[0],name:row[1],category:row[2].split(',')[0],label:names.get(row[0])||prettyName(row[1])}));
    const select=document.querySelector('#item-category');
    const categories=[...new Set(index.map(item=>item.category))];
    categories.sort((a,b)=>(categoryNames.get(a)||a).localeCompare(categoryNames.get(b)||b,'es')).forEach(id=>{const option=document.createElement('option');option.value=id;option.textContent=categoryNames.get(id)||'Categoría '+id;select.append(option);});
    return index;
  })().catch(error=>{itemIndexPromise=null;throw error;});
  return itemIndexPromise;
}
function itemCard(data){
  const card=document.querySelector('#item-card-template').content.firstElementChild.cloneNode(true);
  const img=card.querySelector('img');const fallback=card.querySelector('.item-image-fallback');
  img.hidden=!data.sprites.default;fallback.hidden=Boolean(data.sprites.default);
  if(data.sprites.default){
    img.src=data.sprites.default;img.alt=localizedName(data);
    img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;},{once:true});
  }
  card.querySelector('h3').textContent=localizedName(data);
  card.querySelector('.item-id').textContent=`#${data.id} · ${data.name}`;
  const entries=data.flavor_text_entries.filter(e=>e.language.name==='es');const entry=entries.at(-1);
  card.querySelector('p').textContent=entry?.text.replace(/[\n\f]/g,' ') || data.effect_entries.find(e=>e.language.name==='en')?.short_effect || 'La API no ofrece una descripción para este objeto.';
  card.querySelector('small').textContent=entry?`Descripción: ${prettyName(entry.version_group.name)}`:'Descripción en inglés o no disponible.';
  card.querySelector('.pill').textContent=categoryNames.get(data.category.url.split('/').filter(Boolean).pop())||prettyName(data.category.name);
  return card;
}
async function loadItems(reset=true){
  const token=++itemRequest;const status=document.querySelector('#items-status');const grid=document.querySelector('#api-item-grid');
  const previous=document.querySelector('#items-prev');const next=document.querySelector('#items-next');const pageLabel=document.querySelector('#items-page');
  if(reset)itemPage=0;
  grid.replaceChildren();previous.disabled=true;next.disabled=true;status.classList.remove('error');status.textContent='Consultando objetos…';pageLabel.textContent='Cargando…';
  try {
    const index=await getItemIndex();if(token!==itemRequest)return;
    const query=normalizeSearch(document.querySelector('#item-search').value);
    const category=document.querySelector('#item-category').value;
    const matches=index.filter(item=>(!category||item.category===category)&&(!query||item.id===query||normalizeSearch(item.name).includes(query)||normalizeSearch(item.label).includes(query)));
    if(!matches.length){status.textContent='No hay objetos que coincidan con la búsqueda y la categoría. Prueba otro nombre o limpia los filtros.';pageLabel.textContent='Sin resultados';return;}
    const pages=Math.ceil(matches.length/12);itemPage=Math.min(itemPage,pages-1);
    const batch=matches.slice(itemPage*12,itemPage*12+12);
    const results=await Promise.allSettled(batch.map(item=>getData('item/'+item.name)));if(token!==itemRequest)return;
    const loaded=results.filter(r=>r.status==='fulfilled');if(!loaded.length)throw new Error();loaded.forEach(r=>grid.append(itemCard(r.value)));
    status.textContent=`${matches.length} objetos encontrados${loaded.length<results.length?' · Algunos no pudieron cargarse; pulsa Buscar objeto para reintentar.':''}`;
    pageLabel.textContent=`Página ${itemPage+1} de ${pages}`;previous.disabled=itemPage===0;next.disabled=itemPage===pages-1;
  }catch{if(token===itemRequest){status.classList.add('error');status.textContent='No se pudo cargar el catálogo. Comprueba tu conexión y pulsa Buscar objeto para reintentar.';pageLabel.textContent='Consulta no disponible';}}
}
document.querySelector('#item-search-form').addEventListener('submit',e=>{e.preventDefault();loadItems();});
document.querySelector('#item-reset').addEventListener('click',()=>{document.querySelector('#item-search').value='';document.querySelector('#item-category').value='';loadItems();});
document.querySelector('#item-category').addEventListener('change',()=>loadItems());
document.querySelector('#items-prev').addEventListener('click',()=>{itemPage--;loadItems(false);});
document.querySelector('#items-next').addEventListener('click',()=>{itemPage++;loadItems(false);});
async function init() {

  loadItems();
  loadHistory();
  loadCatalog();
  try { const pikachu = await getData('pokemon/25'); const img=document.querySelector('#featured-image');img.src=artwork(pikachu);addImageFallback(img); }
  catch { document.querySelector('#featured-image').hidden=true; }
}
init();

