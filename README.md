# Miora — tienda online (examen MF0493)

Proyecto de examen: una tienda web con catálogo, cuenta de usuario, carrito y pago. Está pensada para enseñar el flujo completo de una compra, no solo una maqueta estática.

## Qué hace

- Enseña productos (home, categorías, ficha, búsqueda, rebajas)
- Permite registrarse e iniciar sesión (perfil incluido)
- Guarda favoritos y gestiona el carrito
- Cobra con Stripe y muestra una página de éxito
- Genera / consulta facturas ligadas al pago
- Incluye páginas de contacto y “nosotros”

## Cómo probarlo

Necesitas Node 22 o superior, pnpm y un `.env` con las claves del proyecto (hay un `.env.example` de referencia).

```sh
pnpm install
pnpm dev
```

Para revisar el build de producción:

```sh
pnpm build
pnpm preview
```

Versión online: https://tienda-miora-examen-final.vercel.app

## Cómo lo construí

Monté la tienda con **Astro** y **Tailwind**. La autenticación va con **Supabase**. Los datos de negocio (productos, clientes, facturas…) los consulto con **PostgreSQL** (`pg`). El pago lo resolví con **Stripe** y unas rutas API en `src/pages/api/` (checkout, auth, factura, crear cliente). El deploy está en **Vercel**.

No inventé capas raras: páginas Astro para la UI, `src/lib/` para la lógica de datos, y las APIs solo donde hacía falta el servidor.

## Cómo verificarlo

No hay batería de tests automatizados. Lo compruebo a mano:

1. Navegar catálogo y abrir un producto  
2. Añadir al carrito  
3. Entrar con usuario de prueba (o registrarse)  
4. Pasar por el checkout de Stripe en modo test  
5. Confirmar que llega a la página de éxito / factura  

Si algo del entorno falta (env, base de datos), el flujo de pago no se puede completar en local.

---

Moussi Joelle  
https://github.com/moussijoelle/tienda-miora-examen-final
