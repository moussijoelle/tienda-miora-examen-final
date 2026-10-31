-- Joelle Moussi — ejercicios SELECT (UF1845)
-- Sobre la base de Miora. Primero simples, luego joins, luego agrupadas.

-- 1) Las 5 categorías del menú
SELECT pk_categoria, nom_categoria
FROM categorias
ORDER BY nom_categoria;

-- 2) Vestidos que siguen a la venta (sin fecha de baja)
SELECT nombre_producto, precio, stock, fk_categoria
FROM productos
WHERE fecha_baja IS NULL
ORDER BY precio;

-- 3) Solo yo debería salir aquí
SELECT nombres_cliente, apellido1_cliente, apellido2_cliente, email, rol
FROM clientes
WHERE rol = 'administrador';

-- 4) Clientes de los que sí tenemos móvil (el resto en el INSERT iba a NULL)
SELECT nombres_cliente, apellido1_cliente, telefono_movil
FROM clientes
WHERE telefono_movil IS NOT NULL
ORDER BY apellido1_cliente;

-- 5) Reponer: stock por debajo del punto de reposición
SELECT nombre_producto, stock, punto_reposicion
FROM productos
WHERE stock <= punto_reposicion;

-- 6) Producto + categoría (join de toda la vida)
SELECT p.nombre_producto, c.nom_categoria, p.precio, p.descuento
FROM productos p
JOIN categorias c ON c.pk_categoria = p.fk_categoria
ORDER BY c.nom_categoria, p.nombre_producto;

-- 7) Lo que se ha comprado, con nombre del cliente
SELECT
  f.pk_factura,
  cl.nombres_cliente,
  cl.apellido1_cliente,
  p.nombre_producto,
  d.cantidad,
  d.precio_unitario,
  d.precio_total
FROM facturas f
JOIN clientes cl ON cl.pk_cliente = f.fk_cliente
JOIN detalle_factura d ON d.fk_factura = f.pk_factura
JOIN productos p ON p.pk_producto = d.fk_producto
ORDER BY f.pk_factura;

-- 8) Rita: sus facturas (ella es cliente, no admin)
SELECT f.pk_factura, f.fecha_compra, f.stripe_payment_intent_id, f.iva
FROM facturas f
JOIN clientes cl ON cl.pk_cliente = f.fk_cliente
WHERE cl.email = 'pblcddinbox@gmail.com';

-- 9) Cuántos vestidos hay en cada categoría
SELECT c.nom_categoria, COUNT(*) AS cuantos
FROM categorias c
JOIN productos p ON p.fk_categoria = c.pk_categoria
GROUP BY c.nom_categoria
ORDER BY cuantos DESC;

-- 10) Importe de cada factura (precio_total ya viene calculado en la línea)
SELECT f.pk_factura, cl.nombres_cliente, SUM(d.precio_total) AS importe
FROM facturas f
JOIN clientes cl ON cl.pk_cliente = f.fk_cliente
JOIN detalle_factura d ON d.fk_factura = f.pk_factura
GROUP BY f.pk_factura, cl.nombres_cliente
ORDER BY f.pk_factura;

-- 11) Categorías con más de 5 vestidos (deberían salir las cinco)
SELECT c.nom_categoria, COUNT(*) AS cuantos
FROM categorias c
JOIN productos p ON p.fk_categoria = c.pk_categoria
GROUP BY c.nom_categoria
HAVING COUNT(*) > 5;

-- 12) Media de precio por categoría, redondeada
SELECT c.nom_categoria, ROUND(AVG(p.precio), 2) AS precio_medio
FROM categorias c
JOIN productos p ON p.fk_categoria = c.pk_categoria
GROUP BY c.nom_categoria
ORDER BY precio_medio DESC;
