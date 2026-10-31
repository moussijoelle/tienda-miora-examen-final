# Apuntes Miora — Explicaciones para el informe (revisión)

Documento de estudio con las explicaciones de las preguntas del día.
No es un resumen corto: está pensado para releer y entender con calma.
Puedes copiar frases al informe de la UF (MF0492 / SQL nativo + Astro SSR).

Proyecto: tienda **Miora** (`21.miora paso a paso`).

---

## 1. SDK bueno para el informe, SQL para el examen

Hay dos sitios distintos donde “hablar” de tecnología:

### En el código de la tienda (lo que corrige la profe)

Tiene que verse **SQL nativo**: consultas escritas por ti (`SELECT`, `INSERT`…) con la librería `pg`, en archivos tipo:

- `src/lib/categorias.ts`
- `src/lib/productos.ts`
- `src/lib/clientes.ts`
- `src/lib/facturas.ts`

El SDK de Supabase (`supabase.from('tabla').select()`) **no sustituye** eso.
Si solo entregas SDK, parece que no demuestras la parte de base de datos de la unidad formativa.

### En el informe (el documento escrito)

Ahí **sí** puedes hablar del SDK. Queda bien explicar:

1. **Qué es** — una librería cómoda para hablar con Supabase.
2. **Ventaja** — más rápido al escribir; menos SQL a mano.
3. **Por qué en este proyecto no lo usamos como acceso principal** — el curso pide SQL nativo para demostrar que sabes hablar con la base.

Así el informe se ve completo: conoces el ecosistema, pero justificas la decisión técnica del proyecto.

**Frase lista para el informe:**  
El SDK de Supabase es útil y se puede describir en la memoria del proyecto; sin embargo, la implementación de Miora usa SQL nativo con `pg` porque es el requisito de la guía y demuestra el manejo directo de la base de datos.

---

## 2. Si no pone `output: 'server'`, no es un backend (en el sentido de la guía)

Astro puede trabajar de dos maneras principales:

### Sin `output: 'server'` (modo estático / por defecto)

Al hacer el build se generan páginas HTML.
Eso es sobre todo **frontend**: archivos listos para servir.
No hay un servidor que, en cada visita, ejecute código tuyo para leer la base de datos en tiempo real como en la guía SSR (Server-Side Rendering).

### Con `output: 'server'` + un adapter (en Miora: Vercel)

Ahí Astro actúa también como **backend**: en cada petición (o en las rutas de servidor) puede ejecutarse código:

- conectar con Postgres,
- hacer `SELECT`,
- crear facturas con `INSERT`,
- etc.

Sin servidor SSR, cosas como `getCategorias()`, `DATABASE_URL` y `pg` no encajan en el modelo que pide el curso para “tienda con backend”.

### Cómo está en Miora

En `astro.config.mjs` debe haber algo equivalente a:

- `output: 'server'`
- `adapter: vercel()`

| Config | Qué es |
|--------|--------|
| Sin `output: 'server'` (o `output: 'static'`) | Solo **front**: HTML al construir. |
| `output: 'server'` + adapter | **Back** también: el servidor puede leer BD y APIs. |

**Frase lista para el informe:**  
Astro funciona como backend cuando se configura `output: 'server'` junto a un adapter (por ejemplo Vercel); si no, el proyecto es esencialmente un sitio estático (frontend).

---

## 3. Por qué estaba mal usar un array de objetos (como `db.json`)

Al principio los productos y categorías estaban en un **array de objetos** dentro de un JSON del proyecto (`src/data/db.json`).
Cada vestido era un objeto `{ id, nombre, precio, ... }` dentro de una lista.

Eso **sirve para maquetar** (ver la tienda bonita), pero **no es una base de datos**.

### Por qué no valía

**1. No se puede cambiar de verdad desde la aplicación**  
Para cambiar un precio o añadir un producto había que editar el archivo a mano y volver a publicar.
No hay un `INSERT` / `UPDATE` persistente que deje el cambio guardado para todos los usuarios.

**2. No es un almacén compartido y persistente**  
En Postgres / Supabase el dato vive en el servidor.
Lo cambias una vez y lo ve cualquiera que entre.
El array solo vive en esa copia del código del proyecto.

**3. No demuestra el backend del curso**  
La unidad pide SQL nativo y tablas.
Leer un JSON no es consultar una base de datos ni guardar facturas reales.

**4. No escala**  
Con unos 40 vestidos se aguanta.
Con clientes, stock, facturas y relaciones, el array se vuelve un lío y no hay modelo relacional real (cliente → factura → líneas).

### Contraste

| Array de objetos (JSON) | Base de datos (SQL / Postgres) |
|-------------------------|--------------------------------|
| Datos dentro del proyecto | Datos en el servidor |
| Cambiar = editar archivo | Cambiar = `INSERT` / `UPDATE` |
| Bien para maqueta | Bien para tienda real y examen |
| No hay relaciones serias | Tablas y relaciones |

**Frase lista para el informe:**  
Al inicio usamos un array de objetos en JSON solo para el desarrollo visual de la tienda. Esos datos no se pueden modificar de forma persistente desde la aplicación; por eso pasamos a Postgres con SQL nativo.

---

## 4. Diferencia total entre SDK y SQL

### Tabla comparativa

| | SQL nativo | SDK (ej. Supabase) |
|---|------------|---------------------|
| Qué es | El **idioma** de la base de datos | Una **librería** que habla con la BD por ti |
| Quién escribe la consulta | Tú | El SDK (tú llamas a métodos) |
| Ejemplo leer | `SELECT * FROM categorias` | `supabase.from('categorias').select('*')` |
| Ejemplo insertar | `INSERT INTO facturas (...) VALUES ($1, $2)` | `supabase.from('facturas').insert({ ... })` |
| ¿Se ve el SQL en tu código? | Sí | Casi no; queda oculto |
| Qué demuestra en el examen | Que sabes base de datos | Que usas una herramienta cómoda |
| En Miora | Lo que pide la guía (`pg` + SQL) | Bien para explicar en el informe |

### En una frase

- **SQL** = tú mandas la orden exacta a Postgres.
- **SDK** = tú usas métodos; el SDK traduce eso a SQL por detrás.

Misma meta (leer / guardar datos), **camino distinto**.

Para la **nota práctica**: SQL nativo.  
Para el **informe**: puedes decir que el SDK existe y es más fácil, pero el proyecto usa SQL nativo.

---

## 5. Qué es un lenguaje y qué es una librería

### Idea clave

Una **librería** es una herramienta que puede pasar de moda: hoy se usa mucho, mañana puede haber otra.  
Un **lenguaje** es el idioma base: tarda años en cambiar; lo que aprendes sigue valiendo.

### Lenguaje (language)

Es el **idioma** con el que programas o hablas con la máquina / la base de datos.
Tiene reglas (gramática): cómo se escribe un `if`, un `SELECT`, etc.
El compilador, el intérprete o el motor de la BD lo entienden.
No “instalas el lenguaje” como un paquete de moda de la misma forma que una librería: lo usas en muchos sitios distintos.

**Ejemplos de lenguajes:**

| Lenguaje | Para qué |
|----------|----------|
| JavaScript | Web, navegador, a veces servidor (Node) |
| TypeScript | JavaScript + tipos (usado en Astro / Miora) |
| Python | Scripts, datos, IA, backends |
| Java | Aplicaciones grandes, entorno empresarial |
| C / C++ | Sistemas, juegos, rendimiento |
| C# | Aplicaciones .NET / Windows |
| PHP | Muchas webs clásicas (WordPress, etc.) |
| **SQL** | Hablar con bases de datos (Postgres, MySQL…) |
| HTML | Estructura de la página (lenguaje de marcado) |
| CSS | Estilos |
| Go, Rust, Kotlin, Swift… | Otros idiomas de programación |

En Miora:

- **TypeScript / JavaScript** = lenguaje de la aplicación.
- **SQL** = lenguaje de la base de datos.

### Librería (library)

Es un **paquete de código ya hecho** que alguien escribió para no reinventar la rueda.

- La **instalas** (`npm install pg`, etc.).
- Te da **funciones listas**: conectar a Postgres, pintar interfaces, validar datos, pagos…
- **Depende** de un lenguaje: una librería de JavaScript no sirve en Python tal cual.
- Puede **pasar de moda** o ser sustituida por otra que hace lo mismo.

**Ejemplos de librerías:**

| Librería | Lenguaje | Qué hace |
|----------|----------|----------|
| `pg` | JS / TS | Conectar a Postgres y lanzar SQL (Miora) |
| SDK de Supabase | JS / TS | Hablar con Supabase sin escribir tanto SQL |
| Stripe | JS | Pagos |
| lodash | JS | Utilidades de arrays / objetos |
| axios | JS | Llamar a APIs HTTP |
| dayjs / moment | JS | Fechas (moment ya casi no se usa → ejemplo de moda) |
| jQuery | JS | Antes era el rey del DOM; hoy casi nadie lo empieza |
| NumPy / Pandas | Python | Matemáticas y tablas de datos |
| Requests | Python | Llamadas HTTP |

### Librería vs framework (para no liarte)

- **Librería:** tú llamas al código (`pool.query('SELECT…')`).
- **Framework:** el framework te llama a ti y te organiza el proyecto (Astro, Next, Angular: rutas, estructura, etc.).

Ambos pueden pasar de moda. El **lenguaje** (JS, SQL, Python) aguanta más.

### Analogía sencilla

- Lenguaje = aprender **español**.
- Librería = aprender a usar el **microondas** (botones concretos de un aparato).

### Por qué “una librería pasa de moda y un lenguaje no”

jQuery fue el rey del front y luego casi nadie lo empieza en proyectos nuevos.  
SQL y JavaScript siguen ahí.  
Por eso la profe empuja SQL nativo: aunque mañana cambie el SDK, el idioma de la BD sigue sirviendo.

**Frase lista para el informe:**  
Un lenguaje es el idioma estable del programador (JavaScript, SQL…). Una librería es código reutilizable que facilita tareas concretas; las librerías cambian con el tiempo, mientras que saber el lenguaje permite adaptarse aunque la herramienta de moda cambie.

---

## 6. Migración (WordPress → Astro), velocidad y por qué SQL ayuda

### Qué significa migrar

**Migrar** = cambiar la tecnología del sitio (lenguaje, CMS, framework, hosting) **sin querer tirar los datos**.

Ejemplos:

- WordPress (PHP) → Astro (JavaScript / TypeScript)
- Un framework viejo → uno nuevo
- Servidor propio → Vercel

Lo que **no** debería cambiar si el diseño de datos está bien hecho:

- Postgres (o la BD)
- las tablas
- el SQL como forma de acceso

### Por qué SQL nativo facilita la migración

La base de datos queda **separada** del “traje” de la web:

```text
[ Postgres + tablas + SQL ]   ← se mantiene
        ↑           ↑
   WordPress      Astro
     (PHP)       (JS + pg)
```

Cualquier stack serio puede hablar SQL.  
Si el código solo sabe el SDK (`supabase.from(...)`), al cambiar de herramienta hay que reescribir más la capa de datos.

**WordPress → Astro (ejemplo típico de clase):**

- WordPress: PHP + su BD (a menudo MySQL) + plugins y su forma de guardar contenidos.
- Astro: JS/TS + páginas + `pg` (u otro cliente SQL).

Si los productos están en **tablas claras** con SQL, en Astro puedes **reutilizar o conectar** a un modelo de datos limpio.  
Si todo estaba metido solo en “el modo WordPress” (posts raros, plugins, sin modelo SQL claro), migrar duele más.

Un **array / JSON en el proyecto** es peor para migrar “en serio”: los datos van pegados al código viejo.

### El tema de la velocidad (varios significados)

La profe puede referirse a más de una cosa; las tres encajan:

**A) Velocidad de la web (rendimiento)**  
WordPress clásico con muchos plugins suele ser más pesado.  
Astro (estático o SSR controlado) puede servir HTML más ligero → páginas más rápidas, mejor experiencia y a menudo mejor SEO.

**B) Velocidad de la migración (cuánto tarda el cambio)**  
Con SQL nativo y tablas claras: conectas Astro a la BD → migrar el “sitio” es más rápido.  
Con solo SDK o solo CMS acoplado: hay que rehacer auth, acceso a datos, etc. → migración más lenta y cara.

**C) Velocidad / autonomía a largo plazo**  
Saber SQL permite cambiar de librería o de framework sin empezar de cero en la parte de datos.

**Frases listas para el informe:**

1. Una librería o un CMS pueden pasar de moda; SQL permanece como lenguaje de acceso a datos.  
2. Usar SQL nativo facilita migrar de una tecnología a otra (por ejemplo WordPress a Astro) porque los datos no dependen del framework.  
3. Se puede migrar por rendimiento (webs más rápidas con Astro) o por modernizar el stack; si la BD está en SQL claro, el cambio es más sencillo.  
4. El SDK acelera el desarrollo inicial, pero acopla el proyecto a esa herramienta y dificulta la migración.

---

## 7. “Aprender una librería es más fácil que aprender un lenguaje”

Es una idea que suele decir la profe, y tiene sentido.

| | Lenguaje | Librería |
|---|----------|----------|
| Qué aprendes | Un idioma completo: lógica, sintaxis, formas de pensar | Un conjunto de métodos de un paquete concreto |
| Esfuerzo | Más alto (meses / años para usarlo bien) | Más bajo (días / semanas para lo básico) |
| Requisito | Es la base | Casi siempre **ya hay que saber** el lenguaje |

Ejemplos:

- El SDK es “fácil” *si* ya conoces JavaScript.
- `SELECT … FROM …` pide entender el **idioma** de la base de datos: cuesta más al principio, pero te da autonomía.

Por eso el curso insiste en SQL nativo: cuesta más al inicio, pero sirve al migrar (WordPress → Astro) y aunque cambie el SDK de moda.

**Frase lista para el informe:**  
Aprender una librería es más sencillo porque se memorizan métodos de un paquete concreto. Aprender un lenguaje es más exigente, pero da autonomía: se puede cambiar de librería o de framework sin empezar de cero.

---

## 8. Cómo encaja todo en el proyecto Miora (cierre)

1. **Maqueta inicial** con array / `db.json` → útil para ver la tienda, insuficiente como base de datos.  
2. **Paso correcto según la guía:** Postgres + SQL nativo + `pg` + interfaces en `src/lib/` + `output: 'server'` (SSR) + adapter Vercel.  
3. **SDK:** explicarlo en el informe; no usarlo como sustituto del SQL en la entrega práctica.  
4. **Objetivo pedagógico:** el lenguaje estable (SQL) importa más que la moda de una librería; facilita migraciones y demuestra criterio profesional.

### Mapa mental rápido

```text
Lenguaje SQL  →  datos portables, examen, migración
Librería SDK  →  comodidad, informe, puede pasar de moda
output:server →  Astro como backend (SSR)
Array JSON    →  solo maqueta, no BD real
```

---

## 9. Hosting compartido vs Node (lo de la profe)

Se puede contratar un **servidor / hosting compartido** barato, pensado sobre todo para **PHP** (WordPress, páginas PHP clásicas).

Para **Node.js** (Astro SSR, APIs en Node) ese modelo **no encaja bien** y un alojamiento propio tipo VPS suele salir **más caro** o más complicado que el hosting PHP compartido.

Por eso en el curso se usa **Vercel** con Astro en modo servidor (`output: 'server'` + `adapter: vercel()`):

- no hace falta alquilar un VPS Node “todo el día”,
- el código corre cuando hay peticiones,
- para un proyecto de clase suele bastar el plan gratuito o muy económico.

**Frase lista para el informe:**  
El hosting compartido tradicional es económico para PHP, pero no encaja bien con aplicaciones Node.js, cuyo alojamiento propio suele ser más caro. Por eso Miora se despliega en Vercel con Astro SSR.

---

## 10. Rúbrica del examen: qué restó puntos

Según la hoja de corrección (prova pràctica):

### UF1844 — 7,5 / 10
- **Bien:** existe `MenuCategorias.astro` y lee categorías de la BD.
- **Mal (0 / 2,5):** “Uso de buenas prácticas en el código del componente” — el patrón del componente no coincidía del todo con la guía.

### UF1845 — 10 / 10
SQL, tipos, restricciones, FK, `ON UPDATE` / `ON DELETE`: correcto.

### UF1846 — 8,5 / 10
- **Mal (0,5 / 1):** dependencias — nota a mano: *“El adaptador debe ser vercel”*.
- **Mal (0 / 1):** “Se definen interfaces para las consultas SQL”.

### Cómo queda corregido en el proyecto
| Fallo | Estado |
|-------|--------|
| Adapter Vercel | Hecho (`astro.config.mjs` + `@astrojs/vercel`) |
| Interfaces en `src/lib/` | Hecho (`Categoria`, `Producto`, `Cliente`, `Factura`…) |
| `import type` en páginas / menú | Hecho (cambio seguro, sin reescribir el menú) |
| Buenas prácticas menú “a la letra” del PDF | Revisar con capturas de la guía si la profe pide más |

---

## 11. Guía a la letra + nombres de la tienda

- De la **guía** se copia el **método**: SSR, Vercel, `pg`, SQL nativo, un `lib` por tabla, interface, estilo de `import`.
- Del **enunciado / Miora** van los **nombres**: vestidos, categorías propias, textos, fotos, rutas de la tienda.

La guía es el molde; el enunciado es el contenido.

---

## 12. Interfaces e `import type` (cómo se ve en el código)

En cada `lib` de consulta:

```ts
export interface Categoria { ... }
export async function getCategorias(): Promise<Categoria[]> { ... }
```

En el componente o página (como en la guía, visible para la profe):

```ts
import { getCategorias, type Categoria } from '../lib/categorias'

const categorias: Categoria[] = await getCategorias()
```

Así se tipa el resultado del SQL y se cumple el factor de interfaces de la rúbrica.

---

## 13. Ruta dinámica vs query en la URL (pizarra)

La profe puso en la pizarra algo como:

`/productos?categoria=1`

Eso es un **query string** (parámetros después de `?`):

| Estilo | Ejemplo | Cómo se lee en Astro |
|--------|---------|----------------------|
| Ruta dinámica | `/categoria/fiesta-gala` | `Astro.params.id` |
| Query (pizarra) | `/productos?categoria=1` | `Astro.url.searchParams.get('categoria')` |

- `?` = empiezan los parámetros.
- `categoria=1` = filtrar productos de esa categoría.
- En SQL: `WHERE fk_categoria = $1` con ese valor.

En Miora hoy se usa sobre todo la **ruta** `/categoria/[id]`.  
La query de la pizarra es otra forma válida de pasar el filtro; si el enunciado la exige a la letra, habría que tener una página `/productos` que lea `searchParams`. Si es solo ejemplo de clase, se puede mantener `/categoria/...` y explicar el filtro por categoría.

**No sustituye** la conexión a la BD: solo indica **cómo llega** el id de categoría a la página.

Sobre volver a pegar las consignas de conexión: no hace falta si `DATABASE_URL`, `Pool` en `db.ts` y SSL Supabase ya están hechos. Solo si la profe cambia algo en la pizarra.

---

*Fin del documento. Revisar este archivo cuando prepares el informe o antes de la defensa del proyecto.*