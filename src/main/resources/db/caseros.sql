-- 56 caseros adicionales (14 por categoria) con un producto peruano coherente cada uno.
-- Idempotente. Nro. de puesto aleatorio entre 1 y 35, igual que las caseras de la entrevista.

INSERT INTO productos (nombre, sector_id, unidad, icono)
SELECT v.nombre, s.id, v.unidad, v.icono
FROM (VALUES
    ('Mango Kent', 'Frutas', 'kg', '🥭'),
    ('Maracuyá', 'Frutas', 'kg', '🍈'),
    ('Lúcuma', 'Frutas', 'kg', '🍈'),
    ('Chirimoya', 'Frutas', 'kg', '🍈'),
    ('Aguaymanto', 'Frutas', 'kg', '🍒'),
    ('Piña golden', 'Frutas', 'unidad', '🍍'),
    ('Granadilla', 'Frutas', 'kg', '🍊'),
    ('Papa amarilla', 'Verduras', 'kg', '🥔'),
    ('Camote amarillo', 'Verduras', 'kg', '🍠'),
    ('Choclo serrano', 'Verduras', 'unidad', '🌽'),
    ('Ají amarillo', 'Verduras', 'kg', '🌶️'),
    ('Rocoto', 'Verduras', 'kg', '🌶️'),
    ('Olluco', 'Verduras', 'kg', '🥔'),
    ('Cebolla roja arequipeña', 'Verduras', 'kg', '🧅'),
    ('Cuy', 'Carnes', 'unidad', '🥩'),
    ('Trucha', 'Carnes', 'kg', '🐟'),
    ('Camarón de río', 'Carnes', 'kg', '🦐'),
    ('Pejerrey', 'Carnes', 'kg', '🐟'),
    ('Costillar de cerdo', 'Carnes', 'kg', '🥓'),
    ('Pierna de cordero', 'Carnes', 'kg', '🥩'),
    ('Hígado de res', 'Carnes', 'kg', '🥩'),
    ('Chocolate Sol del Cusco', 'Abarrotes', 'unidad', '🍫'),
    ('Aceite Primor', 'Abarrotes', 'litro', '🛢️'),
    ('Quinua blanca', 'Abarrotes', 'kg', '🌾'),
    ('Leche evaporada Gloria', 'Abarrotes', 'unidad', '🥛'),
    ('Atún Florida en aceite', 'Abarrotes', 'unidad', '🐟'),
    ('Azúcar rubia Cartavio', 'Abarrotes', 'kg', '🍬'),
    ('Café Altomayo', 'Abarrotes', 'unidad', '☕')
) AS v(nombre, sector, unidad, icono)
JOIN sectores s ON s.nombre = v.sector
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO comerciantes (nombre, nro_puesto, pasillo, seccion, sector_id, metodos_pago, tiene_caseros, calificacion, num_calificaciones, cotizaciones, horario)
SELECT v.nombre, v.nro, v.pasillo, v.seccion, s.id, v.pagos, v.caseros, v.cal, v.ncal, v.cot, v.horario
FROM (VALUES
    ('Rosa Quispe', 32, 10, 'Frutas', 'Frutas', 'Yape', 'Algunas veces', 4.7, 76, 28, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Carmen Huamán', 35, 11, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.5, 96, 131, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Julia Mamani', 22, 12, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.5, 70, 100, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Elena Condori', 27, 13, 'Frutas', 'Frutas', 'Yape', 'Sí', 4.3, 80, 86, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Sofía Chambi', 6, 10, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.5, 34, 70, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Teresa Apaza', 19, 11, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.9, 36, 38, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Gladys Ccama', 20, 12, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.4, 93, 49, 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.'),
    ('Flor Mayta', 1, 13, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.1, 16, 128, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Pilar Turpo', 11, 10, 'Frutas', 'Frutas', 'Yape y Plin', 'Algunas veces', 4.5, 14, 74, 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.'),
    ('Rocío Vilca', 5, 11, 'Frutas', 'Frutas', 'Yape', 'Algunas veces', 4.9, 73, 33, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Marleni Ramos', 1, 12, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.5, 38, 11, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Yesenia Cutipa', 20, 13, 'Frutas', 'Frutas', 'Yape', 'Algunas veces', 4.4, 64, 63, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Doris Flores', 5, 10, 'Frutas', 'Frutas', 'Plin', 'Sí', 4.4, 99, 8, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Norma Choque', 25, 11, 'Frutas', 'Frutas', 'Yape y Plin', 'Sí', 4.9, 65, 45, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Víctor Salas', 27, 14, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Algunas veces', 4.8, 39, 16, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Hugo Paredes', 32, 15, 'Verduras y tubérculos', 'Verduras', 'Yape y Plin', 'Algunas veces', 4.5, 45, 150, 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.'),
    ('Raúl Cáceres', 1, 16, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Sí', 4.8, 109, 146, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Wilber Quiroz', 27, 17, 'Verduras y tubérculos', 'Verduras', 'Yape y Plin', 'Algunas veces', 4.6, 38, 89, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Edgar Zeballos', 34, 14, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Sí', 4.6, 60, 6, 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.'),
    ('Néstor Valdivia', 33, 15, 'Verduras y tubérculos', 'Verduras', 'Plin', 'Sí', 4.1, 55, 89, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Jorge Ccori', 35, 16, 'Verduras y tubérculos', 'Verduras', 'Plin', 'Algunas veces', 4.7, 99, 28, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Ángel Meza', 30, 17, 'Verduras y tubérculos', 'Verduras', 'Plin', 'Sí', 4.4, 25, 36, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Percy Gutiérrez', 29, 14, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Sí', 4.0, 16, 67, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Mario Laura', 28, 15, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Algunas veces', 4.9, 87, 120, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Dante Rondón', 27, 16, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Sí', 4.9, 64, 113, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Alex Cusi', 22, 17, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Sí', 4.1, 25, 142, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Fidel Sucapuca', 35, 14, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Sí', 4.6, 29, 90, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Saúl Béjar', 16, 15, 'Verduras y tubérculos', 'Verduras', 'Yape', 'Sí', 4.8, 53, 87, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Beatriz Arce', 24, 20, 'Carnes y pescados', 'Carnes', 'Plin', 'Sí', 4.8, 39, 136, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Luz Marina Roque', 33, 21, 'Carnes y pescados', 'Carnes', 'Yape y Plin', 'Algunas veces', 4.1, 40, 84, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Mery Colque', 7, 22, 'Carnes y pescados', 'Carnes', 'Yape', 'Sí', 4.0, 58, 122, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Sonia Pacheco', 9, 23, 'Carnes y pescados', 'Carnes', 'Yape', 'Sí', 4.9, 16, 145, 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.'),
    ('Delia Yucra', 3, 20, 'Carnes y pescados', 'Carnes', 'Plin', 'Sí', 4.3, 61, 113, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Ana Luque', 20, 21, 'Carnes y pescados', 'Carnes', 'Yape y Plin', 'Algunas veces', 4.5, 49, 42, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Cecilia Nina', 22, 22, 'Carnes y pescados', 'Carnes', 'Yape y Plin', 'Sí', 4.9, 39, 133, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Maribel Soncco', 20, 23, 'Carnes y pescados', 'Carnes', 'Yape', 'Algunas veces', 4.0, 99, 12, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Dina Aguilar', 23, 20, 'Carnes y pescados', 'Carnes', 'Yape', 'Algunas veces', 4.9, 25, 133, 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.'),
    ('Olga Pinto', 18, 21, 'Carnes y pescados', 'Carnes', 'Plin', 'Sí', 4.8, 39, 114, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Vilma Cahuana', 4, 22, 'Carnes y pescados', 'Carnes', 'Yape y Plin', 'Sí', 4.1, 28, 32, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Zoila Bernal', 25, 23, 'Carnes y pescados', 'Carnes', 'Yape', 'Algunas veces', 4.9, 55, 18, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Hilda Rodríguez', 8, 20, 'Carnes y pescados', 'Carnes', 'Yape y Plin', 'Algunas veces', 4.9, 36, 136, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Fanny Ticona', 19, 21, 'Carnes y pescados', 'Carnes', 'Plin', 'Sí', 4.2, 49, 147, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Ruth Huanca', 1, 24, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Sí', 4.6, 111, 31, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Paola Mendoza', 31, 25, 'Abarrotes', 'Abarrotes', 'Yape', 'Algunas veces', 4.7, 64, 92, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Silvia Arapa', 33, 26, 'Abarrotes', 'Abarrotes', 'Yape', 'Algunas veces', 4.2, 118, 96, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Liz Tapia', 17, 27, 'Abarrotes', 'Abarrotes', 'Yape', 'Sí', 4.3, 119, 12, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Marco Callo', 25, 24, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Sí', 4.8, 68, 49, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Óscar Delgado', 4, 25, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Algunas veces', 4.3, 35, 99, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Pablo Vargas', 29, 26, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Sí', 4.0, 27, 68, 'Lunes a sábado · 5:00 a. m. a 2:00 p. m.'),
    ('Iván Salcedo', 16, 27, 'Abarrotes', 'Abarrotes', 'Yape', 'Sí', 4.1, 55, 70, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.'),
    ('Ramiro Puma', 32, 24, 'Abarrotes', 'Abarrotes', 'Plin', 'Algunas veces', 4.7, 83, 97, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Celso Yanqui', 12, 25, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Sí', 4.7, 57, 15, 'Lunes a domingo · 5:00 a. m. a 1:00 p. m.'),
    ('Gonzalo Pari', 28, 26, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Algunas veces', 4.2, 59, 100, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Rubén Esquivel', 34, 27, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Algunas veces', 4.7, 108, 39, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Tito Ancco', 9, 24, 'Abarrotes', 'Abarrotes', 'Yape y Plin', 'Algunas veces', 4.1, 46, 128, 'Lunes a sábado · 6:00 a. m. a 3:00 p. m.'),
    ('Lucho Cano', 35, 25, 'Abarrotes', 'Abarrotes', 'Yape', 'Sí', 4.1, 47, 150, 'Martes a domingo · 5:30 a. m. a 2:00 p. m.')
) AS v(nombre, nro, pasillo, seccion, sector, pagos, caseros, cal, ncal, cot, horario)
JOIN sectores s ON s.nombre = v.sector
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO precios (comerciante_id, producto_id, precio)
SELECT c.id, p.id, v.precio
FROM (VALUES
    ('Rosa Quispe', 'Mango Kent', 5.30),
    ('Carmen Huamán', 'Maracuyá', 5.50),
    ('Julia Mamani', 'Lúcuma', 7.85),
    ('Elena Condori', 'Chirimoya', 8.80),
    ('Sofía Chambi', 'Aguaymanto', 11.95),
    ('Teresa Apaza', 'Piña golden', 5.55),
    ('Gladys Ccama', 'Granadilla', 9.85),
    ('Flor Mayta', 'Mango Kent', 5.80),
    ('Pilar Turpo', 'Maracuyá', 6.15),
    ('Rocío Vilca', 'Lúcuma', 8.20),
    ('Marleni Ramos', 'Chirimoya', 8.95),
    ('Yesenia Cutipa', 'Aguaymanto', 13.25),
    ('Doris Flores', 'Piña golden', 6.40),
    ('Norma Choque', 'Granadilla', 8.40),
    ('Víctor Salas', 'Papa amarilla', 3.50),
    ('Hugo Paredes', 'Camote amarillo', 2.35),
    ('Raúl Cáceres', 'Choclo serrano', 1.65),
    ('Wilber Quiroz', 'Ají amarillo', 6.30),
    ('Edgar Zeballos', 'Rocoto', 7.35),
    ('Néstor Valdivia', 'Olluco', 4.35),
    ('Jorge Ccori', 'Cebolla roja arequipeña', 3.05),
    ('Ángel Meza', 'Papa amarilla', 3.30),
    ('Percy Gutiérrez', 'Camote amarillo', 2.20),
    ('Mario Laura', 'Choclo serrano', 1.50),
    ('Dante Rondón', 'Ají amarillo', 6.15),
    ('Alex Cusi', 'Rocoto', 7.50),
    ('Fidel Sucapuca', 'Olluco', 4.10),
    ('Saúl Béjar', 'Cebolla roja arequipeña', 3.35),
    ('Beatriz Arce', 'Cuy', 39.40),
    ('Luz Marina Roque', 'Trucha', 16.50),
    ('Mery Colque', 'Camarón de río', 40.60),
    ('Sonia Pacheco', 'Pejerrey', 20.65),
    ('Delia Yucra', 'Costillar de cerdo', 23.00),
    ('Ana Luque', 'Pierna de cordero', 29.45),
    ('Cecilia Nina', 'Hígado de res', 13.65),
    ('Maribel Soncco', 'Cuy', 37.05),
    ('Dina Aguilar', 'Trucha', 19.45),
    ('Olga Pinto', 'Camarón de río', 50.30),
    ('Vilma Cahuana', 'Pejerrey', 18.60),
    ('Zoila Bernal', 'Costillar de cerdo', 22.90),
    ('Hilda Rodríguez', 'Pierna de cordero', 31.80),
    ('Fanny Ticona', 'Hígado de res', 13.30),
    ('Ruth Huanca', 'Chocolate Sol del Cusco', 4.20),
    ('Paola Mendoza', 'Aceite Primor', 8.80),
    ('Silvia Arapa', 'Quinua blanca', 13.30),
    ('Liz Tapia', 'Leche evaporada Gloria', 4.05),
    ('Marco Callo', 'Atún Florida en aceite', 6.30),
    ('Óscar Delgado', 'Azúcar rubia Cartavio', 4.30),
    ('Pablo Vargas', 'Café Altomayo', 13.35),
    ('Iván Salcedo', 'Chocolate Sol del Cusco', 3.90),
    ('Ramiro Puma', 'Aceite Primor', 9.50),
    ('Celso Yanqui', 'Quinua blanca', 13.20),
    ('Gonzalo Pari', 'Leche evaporada Gloria', 4.55),
    ('Rubén Esquivel', 'Atún Florida en aceite', 6.55),
    ('Tito Ancco', 'Azúcar rubia Cartavio', 4.65),
    ('Lucho Cano', 'Café Altomayo', 15.50)
) AS v(casero, producto, precio)
JOIN comerciantes c ON c.nombre = v.casero
JOIN productos p ON p.nombre = v.producto
ON CONFLICT (comerciante_id, producto_id) DO NOTHING;

INSERT INTO promociones (comerciante_id, producto_id, descuento_pct)
SELECT c.id, p.id, v.pct
FROM (VALUES ('Rosa Quispe','Mango Kent',20), ('Víctor Salas','Papa amarilla',15),
             ('Beatriz Arce','Cuy',10), ('Ruth Huanca','Chocolate Sol del Cusco',15)) AS v(casero, producto, pct)
JOIN comerciantes c ON c.nombre = v.casero
JOIN productos p ON p.nombre = v.producto
ON CONFLICT (comerciante_id, producto_id) DO NOTHING;
