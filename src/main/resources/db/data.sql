-- Datos iniciales (idempotentes). Fuente: Entrevista FA.xlsx
-- Reglas aplicadas: "Nro. del puesto" = numero aleatorio 1-35; secciones no
-- comestibles (Tecnologia, ropa) reemplazadas por rubros de comida.

INSERT INTO sectores (nombre, icono) VALUES
    ('Verduras','🥬'), ('Frutas','🍓'), ('Carnes','🥩'), ('Pescados','🐟'),
    ('Abarrotes','🛒'), ('Comida','🍲'), ('Otros','🧺')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO comerciantes (nombre, nro_puesto, pasillo, seccion, sector_id, metodos_pago, tiene_caseros, calificacion, num_calificaciones, cotizaciones)
SELECT v.nombre, v.nro, v.pasillo, v.seccion, s.id, v.pagos, v.caseros, v.cal, v.ncal, v.cot
FROM (VALUES
    ('Oscar',        27, 18, 'Abarrotes y panadería', 'Abarrotes', 'Yape',        'Algunas veces', 4.4,  52,  60),
    ('Eduardo',      14, 19, 'Abarrotes',             'Abarrotes', 'Yape',        'Sí',            4.6,  89,  95),
    ('Micaela',       8,  1, 'Carnes',                'Carnes',    'Yape',        'Sí',            4.7, 110, 140),
    ('María',        31,  2, 'Carnes',                'Carnes',    'Yape y Plin', 'Sí',            4.7,  76,  98),
    ('Melany',       22,  3, 'Carnes (pollos)',       'Carnes',    'Yape',        'Algunas veces', 4.5,  64,  87),
    ('Nilda',         5,  4, 'Verduras',              'Verduras',  'Yape',        'Sí',            4.8, 128, 324),
    ('Angela',       19,  5, 'Frutas',                'Frutas',    'Yape',        'Sí',            4.6,  97, 150),
    ('Lourdes',      33,  6, 'Frutas',                'Frutas',    'Yape y Plin', 'Sí',            4.7,  81, 120),
    ('Judith',       11,  7, 'Golosinas',             'Abarrotes', 'Plin',        'Sí',            4.5,  43,  40),
    ('Luis Alberto', 26,  9, 'Comida preparada',      'Comida',    'Yape',        'Algunas veces', 4.6,  70,  75)
) AS v(nombre, nro, pasillo, seccion, sector, pagos, caseros, cal, ncal, cot)
JOIN sectores s ON s.nombre = v.sector
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO productos (nombre, sector_id, unidad, icono)
SELECT v.nombre, s.id, v.unidad, v.icono
FROM (VALUES
    ('Papa','Verduras','kg','🥔'), ('Cebolla','Verduras','kg','🧅'),
    ('Tomate','Verduras','kg','🍅'), ('Zanahoria','Verduras','kg','🥕'),
    ('Fresa','Frutas','kg','🍓'), ('Plátano de seda','Frutas','kg','🍌'),
    ('Manzana','Frutas','kg','🍎'), ('Palta','Frutas','kg','🥑'),
    ('Pollo entero','Carnes','unidad','🍗'), ('Carne de res','Carnes','kg','🥩'),
    ('Carne de cerdo','Carnes','kg','🥓'),
    ('Arroz','Abarrotes','kg','🍚'), ('Azúcar','Abarrotes','kg','🍬'),
    ('Fideos','Abarrotes','kg','🍝'), ('Pan francés','Abarrotes','unidad','🥖'),
    ('Chocolate','Abarrotes','unidad','🍫'),
    ('Almuerzo del día','Comida','unidad','🍲'), ('Pollo a la brasa','Comida','unidad','🍗'),
    ('Jugo de naranja','Comida','unidad','🧃')
) AS v(nombre, sector, unidad, icono)
JOIN sectores s ON s.nombre = v.sector
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO precios (comerciante_id, producto_id, precio)
SELECT c.id, p.id, v.precio
FROM (VALUES
    ('Nilda','Papa',2.00), ('Nilda','Cebolla',2.50), ('Nilda','Tomate',4.00), ('Nilda','Zanahoria',2.00),
    ('Angela','Papa',2.20), ('Angela','Cebolla',2.60), ('Angela','Tomate',4.20), ('Angela','Zanahoria',2.10),
    ('Angela','Fresa',8.00), ('Angela','Plátano de seda',2.50), ('Angela','Manzana',5.00), ('Angela','Palta',9.00),
    ('Lourdes','Papa',2.40), ('Lourdes','Cebolla',2.70), ('Lourdes','Tomate',4.50), ('Lourdes','Zanahoria',2.30),
    ('Lourdes','Fresa',7.50), ('Lourdes','Plátano de seda',2.60), ('Lourdes','Manzana',5.20), ('Lourdes','Palta',8.50),
    ('Micaela','Carne de res',28.00), ('Micaela','Carne de cerdo',18.00), ('Micaela','Pollo entero',16.00),
    ('María','Carne de res',29.00), ('María','Carne de cerdo',17.50),
    ('Melany','Pollo entero',15.50), ('Melany','Carne de cerdo',18.50),
    ('Oscar','Arroz',4.20), ('Oscar','Azúcar',3.90), ('Oscar','Fideos',4.50), ('Oscar','Pan francés',0.30),
    ('Eduardo','Arroz',4.00), ('Eduardo','Azúcar',3.80), ('Eduardo','Fideos',4.60),
    ('Judith','Chocolate',2.50),
    ('Luis Alberto','Almuerzo del día',10.00), ('Luis Alberto','Pollo a la brasa',16.00), ('Luis Alberto','Jugo de naranja',3.00)
) AS v(casera, producto, precio)
JOIN comerciantes c ON c.nombre = v.casera
JOIN productos p ON p.nombre = v.producto
ON CONFLICT (comerciante_id, producto_id) DO NOTHING;

INSERT INTO promociones (comerciante_id, producto_id, descuento_pct)
SELECT c.id, p.id, v.pct
FROM (VALUES ('Angela','Fresa',30), ('Luis Alberto','Pollo a la brasa',10), ('Nilda','Papa',15)) AS v(casera, producto, pct)
JOIN comerciantes c ON c.nombre = v.casera
JOIN productos p ON p.nombre = v.producto
ON CONFLICT (comerciante_id, producto_id) DO NOTHING;

INSERT INTO noticias (titulo, detalle) VALUES
    ('Gran sorteo por aniversario', '20 de septiembre · Mercado del Altiplano'),
    ('Nuevo horario este domingo', 'El mercado atenderá de 6 a. m. a 5 p. m.')
ON CONFLICT (titulo) DO NOTHING;

-- Historial de EJEMPLO para la grafica de evolucion (3 semanas anteriores).
-- Solo se carga una vez, cuando la tabla esta vacia. La semana actual sale de los precios vigentes.
INSERT INTO precios_historial (comerciante_id, producto_id, precio, registrado_en)
SELECT pr.comerciante_id, pr.producto_id,
       ROUND(pr.precio * (f.factor + ((p.id % 4) - 1.5) * 0.02), 2),
       (date_trunc('week', current_date) - make_interval(weeks => f.semanas))::date + 2
FROM precios pr
JOIN productos p ON p.id = pr.producto_id
JOIN (VALUES (1, 1.03), (2, 1.07), (3, 1.04)) AS f(semanas, factor) ON TRUE
WHERE p.nombre IN ('Papa', 'Cebolla', 'Tomate', 'Zanahoria', 'Fresa', 'Plátano de seda')
  AND NOT EXISTS (SELECT 1 FROM precios_historial);

-- Horario por defecto (se puede ajustar por casero con los datos reales de la entrevista)
UPDATE comerciantes SET horario = 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.' WHERE horario IS NULL;

-- La app clasifica solo en Frutas, Verduras, Carnes y Abarrotes: la comida preparada se reubica en esas categorias
UPDATE comerciantes SET sector_id = (SELECT id FROM sectores WHERE nombre = 'Carnes')
 WHERE nombre = 'Luis Alberto' AND sector_id = (SELECT id FROM sectores WHERE nombre = 'Comida');
UPDATE productos SET sector_id = (SELECT id FROM sectores WHERE nombre = 'Carnes') WHERE nombre = 'Pollo a la brasa' AND sector_id = (SELECT id FROM sectores WHERE nombre = 'Comida');
UPDATE productos SET sector_id = (SELECT id FROM sectores WHERE nombre = 'Abarrotes') WHERE sector_id = (SELECT id FROM sectores WHERE nombre = 'Comida');
