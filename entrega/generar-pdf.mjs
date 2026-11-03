import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), 'package.json'))
const hljs = require('highlight.js/lib/core')
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'))
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))
hljs.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'))
hljs.registerLanguage('css', require('highlight.js/lib/languages/css'))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const capturas = path.join(__dirname, 'capturas')
const htmlPath = path.join(__dirname, 'informe-miora.html')
const pdfPath = path.join(__dirname, 'MF0493_Moussi_Fako_Joelle_Charnelle_Miora.pdf')
const edge =
  process.env.EDGE_PATH ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function img(nombre) {
  return pathToFileURL(path.join(capturas, nombre)).href
}

function leer(...partes) {
  return fs.readFileSync(path.join(root, ...partes), 'utf8').replace(/\r\n/g, '\n')
}

/** Comentarios en tono de alumna (solo en el PDF). */
const comentariosPorArchivo = {
  'astro.config.mjs': `// Config de Astro: la tienda corre en servidor (SSR)
// y se publica en Vercel con el adapter oficial.`,

  'src/lib/db.ts': `// Conexión a Postgres con "pg".
// Aquí solo abro el pool; las consultas van en cada lib.
// La URL viene del .env para no dejar la clave en el código.`,

  'src/lib/categorias.ts': `// Categorías de la tienda.
// Tipé el resultado con una interface y consulto con SQL ($1).
// Si falla la BD, devuelvo lista vacía para no tumbar la página.`,

  'src/lib/productos.ts': `// Productos: listar por categoría, buscar uno por id, etc.
// Todo con SQL nativo y parámetros preparados.`,

  'src/lib/clientes.ts': `// Datos del cliente en la tabla clientes.
// Lo uso desde el perfil y al registrarse.`,

  'src/lib/facturas.ts': `// Cuando el pago de Stripe va bien, aquí creo la factura
// y las líneas. También toco el stock si hace falta.`,

  'src/components/MenuCategorias.astro': `---
// Menú lateral: saco las categorías de la BD
// y enlazo cada una a /categoria/su-id
---`,

  'src/layouts/Tienda.astro': `---
// Layout de casi todas las páginas: cabecera, búsqueda,
// "Hola, nombre", cesta con el globito y el menú.
// Si hay cookies de sesión, recupero el usuario.
---`,

  'src/pages/index.astro': `---
// Inicio: solo el hero. El layout pone el menú y la foto de fondo.
---`,

  'src/pages/categoria/[id].astro': `---
// Leo el id de la categoría en la URL, busco esa categoría
// y pinto sus productos en cuadrícula.
---`,

  'src/pages/producto/[id].astro': `---
// Ficha de un vestido. El id viene en la URL.
// Al añadir a la cesta guardo en localStorage (talla + cantidad).
---`,

  'src/pages/carrito.astro': `---
// Cesta: leo lo guardado en el navegador, dejo cambiar cantidades
// y al pagar llamo a mi API de Stripe.
---`,

  'src/pages/login.astro': `---
// Login y registro: Google o email/contraseña.
// Si ya hay sesión, muestro un aviso; si no, los formularios.
---`,

  'src/pages/perfil.astro': `---
// Mis datos: nombre y teléfono.
// Si no estoy logueada, me manda a /login.
// Abajo salen mis facturas si tengo alguna.
---`,

  'src/pages/api/crear-checkout.ts': `// API del pago: compruebo que hay usuario,
// monto las líneas para Stripe y devuelvo la URL del checkout.`,

  'src/pages/exito.astro': `---
// Extra: después de pagar, Stripe vuelve aquí.
// Miro si el pago está OK, creo la factura y vacío la cesta.
// pagoExitoso lo paso al script con define:vars.
---`,

  'src/pages/factura/[id].astro': `---
// Extra: factura para imprimir.
// Solo la ve el cliente dueño; lleva líneas, IVA y total.
---`,
}

function anotar(rutaRelativa, codigo) {
  const bloque = comentariosPorArchivo[rutaRelativa]
  if (!bloque) {
    return `// ${rutaRelativa}\n` + codigo
  }
  return `${bloque}\n\n${codigo}`
}

function lenguajeDe(ruta) {
  if (ruta.endsWith('.ts') || ruta.endsWith('.mts')) return 'typescript'
  if (ruta.endsWith('.mjs') || ruta.endsWith('.js')) return 'javascript'
  if (ruta.endsWith('.astro')) return 'xml'
  if (ruta.endsWith('.css')) return 'css'
  return 'typescript'
}

function bloquearCodigo(rutaRelativa, contenidoCrudo) {
  const anotado = anotar(rutaRelativa, contenidoCrudo).replace(/\t/g, '  ')
  const lang = lenguajeDe(rutaRelativa)
  let highlighted
  try {
    highlighted = hljs.highlight(anotado, { language: lang }).value
  } catch {
    highlighted = esc(anotado)
  }
  const filas = highlighted.split('\n').map((linea, i) => {
    const contenido = linea.length === 0 ? ' ' : linea
    return `<tr><td class="ln">${i + 1}</td><td class="lc">${contenido}</td></tr>`
  }).join('')
  return `<div class="code-block">
  <div class="code-tab"><span class="code-dot"></span><span class="code-dot"></span><span class="code-dot"></span><span class="code-path">${esc(rutaRelativa)}</span></div>
  <table class="code-table hljs"><tbody>${filas}</tbody></table>
</div>`
}

function pantalla({ numero, titulo, rutas, texto, imagenes, codigos, continuar = false }) {
  const figs = imagenes
    .map(
      (nombre) =>
        `<figure class="shot-wrap"><img class="shot" src="${img(nombre)}" alt="${esc(titulo)}" /></figure>`,
    )
    .join('\n')
  const codes = codigos.map(([ruta, body]) => bloquearCodigo(ruta, body)).join('\n')
  const claseCab = imagenes.length > 1 ? 'cabecera-pantalla cabecera-doble' : 'cabecera-pantalla'
  const claseSec = continuar ? 'seccion seccion-continua' : 'seccion seccion-pantalla'
  return `
  <section class="${claseSec}">
    <div class="${claseCab}">
      <h1>${numero}. ${esc(titulo)}</h1>
      <p class="ruta">${rutas.map((r) => `<code>${esc(r)}</code>`).join(' · ')}</p>
      <p>${texto}</p>
      ${figs}
    </div>
    <h2>Código</h2>
    <p class="nota">Código completo del proyecto, con comentarios míos para explicar qué hace cada archivo.</p>
    ${codes}
  </section>`
}

const archivos = {
  index: leer('src', 'pages', 'index.astro'),
  categoria: leer('src', 'pages', 'categoria', '[id].astro'),
  producto: leer('src', 'pages', 'producto', '[id].astro'),
  carrito: leer('src', 'pages', 'carrito.astro'),
  login: leer('src', 'pages', 'login.astro'),
  perfil: leer('src', 'pages', 'perfil.astro'),
  checkout: leer('src', 'pages', 'api', 'crear-checkout.ts'),
  exito: leer('src', 'pages', 'exito.astro'),
  factura: leer('src', 'pages', 'factura', '[id].astro'),
  db: leer('src', 'lib', 'db.ts'),
  categorias: leer('src', 'lib', 'categorias.ts'),
  productos: leer('src', 'lib', 'productos.ts'),
  clientes: leer('src', 'lib', 'clientes.ts'),
  facturas: leer('src', 'lib', 'facturas.ts'),
  menu: leer('src', 'components', 'MenuCategorias.astro'),
  tienda: leer('src', 'layouts', 'Tienda.astro'),
  astroConfig: leer('astro.config.mjs'),
}

const hljsCss = [
  '.hljs { color: #d4d4d4; background: #1e1e1e; }',
  '.hljs-comment, .hljs-quote { color: #6a9955; font-style: italic; }',
  '.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-name { color: #569cd6; }',
  '.hljs-string, .hljs-attr, .hljs-template-variable { color: #ce9178; }',
  '.hljs-number, .hljs-built_in, .hljs-type { color: #b5cea8; }',
  '.hljs-title, .hljs-section, .hljs-selector-id { color: #dcdcaa; }',
  '.hljs-meta, .hljs-meta .hljs-keyword { color: #c586c0; }',
  '.hljs-variable, .hljs-template-tag { color: #9cdcfe; }',
  '.hljs-tag { color: #569cd6; }',
  '.hljs-attribute { color: #9cdcfe; }',
  '.hljs-symbol, .hljs-bullet { color: #d7ba7d; }',
  '.code-block { margin: 0.35em 0 0.85em; border: 1px solid #2d2d2d; border-radius: 4px; overflow: hidden; background: #1e1e1e; }',
  '.code-tab { display: flex; align-items: center; gap: 6px; background: #252526; border-bottom: 1px solid #2d2d2d; padding: 7px 10px; font-family: Consolas, "Cascadia Code", "Courier New", monospace; font-size: 9.5pt; color: #cccccc; }',
  '.code-dot { width: 8px; height: 8px; border-radius: 50%; background: #3e3e42; flex-shrink: 0; }',
  '.code-dot:nth-child(1) { background: #ff5f56; }',
  '.code-dot:nth-child(2) { background: #ffbd2e; }',
  '.code-dot:nth-child(3) { background: #27c93f; }',
  '.code-path { margin-left: 6px; word-break: break-all; }',
  '.code-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0; font-size: 10pt; line-height: 1.38; font-family: Consolas, "Cascadia Code", "Courier New", monospace; tab-size: 2; }',
  '.code-table .ln { width: 2.8em; text-align: right; vertical-align: top; color: #858585; padding: 0 8px 0 6px; border-right: 1px solid #333; user-select: none; white-space: nowrap; }',
  '.code-table .lc { vertical-align: top; padding: 0 10px; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; color: #d4d4d4; }',
].join('\n')

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>MF0493_3 — Tienda Miora — Moussi Fako Joelle Charnelle</title>
  <style>
    @page { size: A4 portrait; margin: 11mm 10mm 14mm 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.42;
      font-size: 13pt;
      margin: 0;
    }
    h1 {
      font-size: 18pt;
      font-weight: 700;
      margin: 0 0 0.28em;
      color: #5e3344;
    }
    h2 {
      font-size: 14pt;
      font-weight: 700;
      margin: 0.65em 0 0.28em;
      color: #5e3344;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.12em;
    }
    p { margin: 0.28em 0; }
    .nota { font-size: 11.5pt; color: #444; }
    .portada {
      min-height: 240mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }
    .portada .marca {
      font-size: 38pt;
      letter-spacing: 0.2em;
      font-weight: 300;
      margin: 0.2em 0;
    }
    .portada .meta { margin-top: 1.4em; font-size: 13.5pt; }
    .portada a { color: #5e3344; word-break: break-all; }
    .pagina-tech {
      page-break-after: always;
    }
    .seccion {
      margin-bottom: 0.8em;
      padding-bottom: 0.4em;
    }
    .seccion-pantalla {
      page-break-before: always;
    }
    .seccion-continua {
      page-break-before: auto;
      margin-top: 1.2em;
      padding-top: 0.6em;
      border-top: 1px solid #e8e8e8;
    }
    /* Título + texto + captura juntos en la misma hoja */
    .cabecera-pantalla {
      break-inside: avoid;
      page-break-inside: avoid;
      -webkit-column-break-inside: avoid;
    }
    table.tech {
      width: 100%;
      border-collapse: collapse;
      margin: 0.5em 0 0;
      font-size: 11.5pt;
    }
    table.tech th, table.tech td {
      border: 1px solid #ccc;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    table.tech th { background: #f3ecef; width: 26%; }
    table.tech tr:nth-child(even) td { background: #fafafa; }
    .shot-wrap {
      margin: 0.35em 0 0.4em;
    }
    img.shot {
      display: block;
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      object-position: top center;
      border: 1px solid #ccc;
      background: #f5f5f5;
    }
    .cabecera-doble img.shot {
      max-height: 195px;
    }
    .ruta { font-size: 11pt; color: #555; margin: 0.12em 0 0.3em; }
    .extra-banner {
      background: #f7f3f0;
      border: 1px solid #ddd;
      padding: 8px 10px;
      margin: 0.35em 0 0.5em;
      font-size: 11.5pt;
    }
    .anexo-titulo {
      page-break-before: always;
      margin-top: 0;
    }
    .cabecera-extra {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    ${hljsCss}
  </style>
</head>
<body>

  <section class="portada">
    <p style="letter-spacing:0.12em; text-transform:uppercase; font-size:11pt; color:#666; margin:0;">
      Examen final MF0493_3
    </p>
    <p class="marca">MIORA</p>
    <h1 style="font-weight:500; font-size:20pt;">Documentación — Tienda virtual</h1>
    <div class="meta">
      <p><strong>Alumna:</strong> Moussi Fako Joelle Charnelle</p>
      <p><strong>Nombre de la tienda:</strong> Miora (vestidos de mujer)</p>
      <p><strong>URL de la tienda:</strong><br />
        <a href="https://tienda-miora-examen-final.vercel.app">https://tienda-miora-examen-final.vercel.app</a>
      </p>
    </div>
  </section>

  <section class="pagina-tech">
    <h1>Tecnologías utilizadas</h1>
    <p>Listado de tecnologías del proyecto y para qué las uso.</p>
    <table class="tech">
      <thead>
        <tr><th>Tecnología</th><th>Para qué la uso</th></tr>
      </thead>
      <tbody>
        <tr><td>Astro (SSR)</td><td>Framework de la tienda. Páginas en servidor con <code>output: 'server'</code>.</td></tr>
        <tr><td>@astrojs/vercel</td><td>Adapter para publicar la app en Vercel.</td></tr>
        <tr><td>PostgreSQL (Supabase)</td><td>Base de datos: categorías, productos, clientes, facturas y líneas.</td></tr>
        <tr><td>Supabase Storage</td><td>Fotos de los vestidos en el bucket público <code>productos</code> (carpetas por categoría). En la BD guardo la URL en <code>url_imagen</code>.</td></tr>
        <tr><td>pg + SQL nativo</td><td>Consultas con prepared statements (<code>$1</code>). No uso el SDK de datos de Supabase.</td></tr>
        <tr><td>Interfaces TypeScript</td><td>Tipar lo que devuelve el SQL en <code>src/lib/</code>.</td></tr>
        <tr><td>Supabase Auth</td><td>Login (Google y email/contraseña) y cookies de sesión.</td></tr>
        <tr><td>Stripe Checkout</td><td>Cobrar la cesta; al volver creo la factura.</td></tr>
        <tr><td>Brevo</td><td>Al registrarme o guardar el perfil, mando el contacto a Brevo si hay <code>BREVO_API_KEY</code>.</td></tr>
        <tr><td>define:vars</td><td>Pasar datos del servidor al JavaScript del navegador (por ejemplo tras el pago).</td></tr>
        <tr><td>Tailwind CSS</td><td>Estilos de la interfaz.</td></tr>
        <tr><td>localStorage</td><td>Cesta y globito del carrito en el navegador.</td></tr>
        <tr><td>Vercel + GitHub</td><td>Hosting y despliegue cuando hago push.</td></tr>
      </tbody>
    </table>
  </section>

  ${pantalla({
    numero: 1,
    titulo: 'Inicio',
    rutas: ['src/pages/index.astro', 'Ruta /'],
    texto:
      'Portada de la tienda con el hero. El menú de categorías lo carga el layout desde la base de datos.',
    imagenes: ['Inicio.png'],
    codigos: [['src/pages/index.astro', archivos.index]],
  })}

  ${pantalla({
    numero: 2,
    titulo: 'Productos de una categoría',
    rutas: ['src/pages/categoria/[id].astro', 'Ruta /categoria/:id'],
    texto:
      'Muestro los productos de una categoría. El id llega por la URL. Consulto Postgres con SQL nativo e interfaces.',
    imagenes: ['categoria.png'],
    codigos: [
      ['src/pages/categoria/[id].astro', archivos.categoria],
      ['src/lib/productos.ts', archivos.productos],
      ['src/lib/categorias.ts', archivos.categorias],
    ],
  })}

  ${pantalla({
    numero: 3,
    titulo: 'Producto seleccionado',
    rutas: ['src/pages/producto/[id].astro', 'Ruta /producto/:id'],
    texto:
      'Ficha del vestido: foto, precio, tallas, cantidad y botón para añadir a la cesta.',
    imagenes: ['productos.png'],
    codigos: [['src/pages/producto/[id].astro', archivos.producto]],
  })}

  ${pantalla({
    numero: 4,
    titulo: 'Carrito de Compras',
    rutas: ['src/pages/carrito.astro', 'Ruta /carrito'],
    texto:
      'Cesta con el globito actualizable. Desde aquí lanzo el pago a Stripe.',
    imagenes: ['carrito.png'],
    codigos: [['src/pages/carrito.astro', archivos.carrito]],
    continuar: true,
  })}

  ${pantalla({
    numero: 5,
    titulo: 'Página de Autenticación',
    rutas: ['src/pages/login.astro', 'Ruta /login'],
    texto:
      'Iniciar sesión (Google o email) y registro de cuenta. La sesión queda en cookies.',
    imagenes: ['login1.png', 'login2.png'],
    codigos: [['src/pages/login.astro', archivos.login]],
    continuar: true,
  })}

  ${pantalla({
    numero: 6,
    titulo: 'Página de Datos Cliente',
    rutas: ['src/pages/perfil.astro', 'Ruta /perfil'],
    texto:
      'Nombre, teléfono y email del cliente. También el listado de facturas si hay compras.',
    imagenes: ['perfil.png'],
    codigos: [
      ['src/pages/perfil.astro', archivos.perfil],
      ['src/lib/clientes.ts', archivos.clientes],
    ],
  })}

  ${pantalla({
    numero: 7,
    titulo: 'Pago con Stripe',
    rutas: ['src/pages/api/crear-checkout.ts', 'Stripe Checkout'],
    texto:
      'Creo la sesión de pago en Stripe (modo prueba). Hay que estar logueada. Si el pago va bien, Stripe vuelve a la tienda.',
    imagenes: ['stripe.png'],
    codigos: [['src/pages/api/crear-checkout.ts', archivos.checkout]],
  })}

  <section class="seccion">
    <h1 class="anexo-titulo">Anexo — Layouts y componentes repetidos</h1>
    <p>
      Según el enunciado, aquí va el código de las piezas que se reutilizan
      en varias pantallas (layout, menú, pool de BD y configuración).
    </p>
    <h2>astro.config.mjs</h2>
    ${bloquearCodigo('astro.config.mjs', archivos.astroConfig)}
    <h2>Pool de base de datos</h2>
    ${bloquearCodigo('src/lib/db.ts', archivos.db)}
    <h2>Menú de categorías</h2>
    ${bloquearCodigo('src/components/MenuCategorias.astro', archivos.menu)}
    <h2>Layout Tienda</h2>
    ${bloquearCodigo('src/layouts/Tienda.astro', archivos.tienda)}
    <h2>Lib de facturas</h2>
    ${bloquearCodigo('src/lib/facturas.ts', archivos.facturas)}
  </section>

  <section class="seccion seccion-pantalla">
    <div class="cabecera-extra">
      <h1>Extra (opcional) — Compra exitosa</h1>
      <div class="extra-banner">
        Esto <strong>no</strong> es una de las 7 pantallas del enunciado. Lo añado como extra
        para mostrar qué pasa cuando el pago de Stripe termina bien.
      </div>
      <figure class="shot-wrap">
        <img class="shot" src="${img('compra con existo.png')}" alt="Compra exitosa" />
      </figure>
    </div>
    <h2>Código</h2>
    ${bloquearCodigo('src/pages/exito.astro', archivos.exito)}
  </section>

  <section class="seccion seccion-continua">
    <div class="cabecera-extra">
      <h1>Extra (opcional) — Factura imprimible</h1>
      <div class="extra-banner">
        Tampoco lo pide el enunciado como pantalla obligatoria. Lo incluyo como extra:
        factura con líneas, IVA y botón de imprimir.
      </div>
      <figure class="shot-wrap">
        <img class="shot" src="${img('factura.png')}" alt="Factura" />
      </figure>
    </div>
    <h2>Código</h2>
    ${bloquearCodigo('src/pages/factura/[id].astro', archivos.factura)}
  </section>

</body>
</html>`

fs.writeFileSync(htmlPath, html, 'utf8')
console.log('HTML:', htmlPath)

const puppeteer = require('puppeteer-core')
const browser = await puppeteer.launch({
  executablePath: edge,
  headless: true,
  args: ['--no-sandbox'],
})

try {
  const page = await browser.newPage()
  await page.goto(pathToFileURL(htmlPath).href, {
    waitUntil: 'networkidle0',
    timeout: 180000,
  })
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%;font-size:9px;color:#555;padding:0 10mm;display:flex;justify-content:space-between;font-family:Segoe UI,Arial,sans-serif;">
        <span>MF0493_3 · Miora · Moussi Fako Joelle Charnelle</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
    margin: {
      top: '11mm',
      bottom: '14mm',
      left: '10mm',
      right: '10mm',
    },
  })
} finally {
  await browser.close()
}

const stat = fs.statSync(pdfPath)
console.log(
  'PDF OK:',
  pdfPath,
  `(${(stat.size / (1024 * 1024)).toFixed(2)} MB)`,
)
