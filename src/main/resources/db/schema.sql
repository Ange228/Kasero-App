-- Kasero - Mercado del Altiplano | Esquema para Supabase (PostgreSQL)
-- Idempotente: se puede ejecutar varias veces.

CREATE TABLE IF NOT EXISTS sectores (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(40) NOT NULL UNIQUE,
    icono   VARCHAR(10) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS usuarios (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(80)  NOT NULL,
    correo         VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    rol            VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE',
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Una fila por casera / encargado de puesto (datos de Entrevista FA.xlsx)
CREATE TABLE IF NOT EXISTS comerciantes (
    id                SERIAL PRIMARY KEY,
    nombre            VARCHAR(80) NOT NULL UNIQUE,
    nro_puesto        INT         NOT NULL CHECK (nro_puesto BETWEEN 1 AND 35),
    pasillo           INT         NOT NULL,
    seccion           VARCHAR(60) NOT NULL,
    sector_id         INT         NOT NULL REFERENCES sectores(id),
    metodos_pago      VARCHAR(80) NOT NULL,
    tiene_caseros     VARCHAR(20) NOT NULL,
    calificacion      NUMERIC(2,1) NOT NULL DEFAULT 4.5,
    num_calificaciones INT        NOT NULL DEFAULT 0,
    cotizaciones      INT         NOT NULL DEFAULT 0,
    activo            BOOLEAN     NOT NULL DEFAULT TRUE
);

-- La calificacion se recalcula como promedio con 2 decimales al llegar reseñas
ALTER TABLE comerciantes ALTER COLUMN calificacion TYPE NUMERIC(3,2);

-- Cuenta de comerciante: un usuario puede estar vinculado a un puesto (responde chats)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS comerciante_id INT REFERENCES comerciantes(id);

-- Chat entre un cliente y un comerciante (una conversacion por pareja)
CREATE TABLE IF NOT EXISTS chats (
    id             SERIAL PRIMARY KEY,
    usuario_id     INT       NOT NULL REFERENCES usuarios(id)     ON DELETE CASCADE,
    comerciante_id INT       NOT NULL REFERENCES comerciantes(id) ON DELETE CASCADE,
    creado_en      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, comerciante_id)
);

CREATE TABLE IF NOT EXISTS mensajes (
    id         SERIAL PRIMARY KEY,
    chat_id    INT          NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    autor      VARCHAR(12)  NOT NULL CHECK (autor IN ('CLIENTE','COMERCIANTE')),
    texto      VARCHAR(500) NOT NULL,
    enviado_en TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mensajes_chat ON mensajes (chat_id, id);

-- Una reseña por cliente y comerciante (solo clientes con pedido en ese puesto)
CREATE TABLE IF NOT EXISTS resenas (
    id             SERIAL PRIMARY KEY,
    comerciante_id INT       NOT NULL REFERENCES comerciantes(id) ON DELETE CASCADE,
    usuario_id     INT       NOT NULL REFERENCES usuarios(id)     ON DELETE CASCADE,
    puntaje        INT       NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
    comentario     VARCHAR(300),
    creada_en      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (comerciante_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS productos (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(60) NOT NULL UNIQUE,
    sector_id  INT         NOT NULL REFERENCES sectores(id),
    unidad     VARCHAR(10) NOT NULL DEFAULT 'kg',
    icono      VARCHAR(10) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS precios (
    comerciante_id INT          NOT NULL REFERENCES comerciantes(id) ON DELETE CASCADE,
    producto_id    INT          NOT NULL REFERENCES productos(id)    ON DELETE CASCADE,
    precio         NUMERIC(8,2) NOT NULL CHECK (precio > 0),
    actualizado_en DATE         NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (comerciante_id, producto_id)
);

CREATE TABLE IF NOT EXISTS cotizaciones (
    id             SERIAL PRIMARY KEY,
    usuario_id     INT          NOT NULL REFERENCES usuarios(id),
    comerciante_id INT          NOT NULL REFERENCES comerciantes(id),
    clave_solicitud VARCHAR(60) NOT NULL UNIQUE,
    estado         VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    total          NUMERIC(10,2) NOT NULL,
    creada_en      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cotizacion_items (
    id            SERIAL PRIMARY KEY,
    cotizacion_id INT           NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    producto_id   INT           NOT NULL REFERENCES productos(id),
    cantidad      NUMERIC(8,2)  NOT NULL CHECK (cantidad > 0),
    precio_unit   NUMERIC(8,2)  NOT NULL,
    subtotal      NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id             SERIAL PRIMARY KEY,
    cotizacion_id  INT          NOT NULL UNIQUE REFERENCES cotizaciones(id),
    modalidad      VARCHAR(30)  NOT NULL CHECK (modalidad IN ('ENVIO','RECOJO','TERCERO')),
    direccion      VARCHAR(160),
    tercero_nombre VARCHAR(80),
    codigo_entrega VARCHAR(12),
    estado         VARCHAR(20)  NOT NULL DEFAULT 'EN_PREPARACION',
    creado_en      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promociones (
    id             SERIAL PRIMARY KEY,
    comerciante_id INT          NOT NULL REFERENCES comerciantes(id),
    producto_id    INT          NOT NULL REFERENCES productos(id),
    descuento_pct  INT          NOT NULL CHECK (descuento_pct BETWEEN 1 AND 90),
    UNIQUE (comerciante_id, producto_id)
);

CREATE TABLE IF NOT EXISTS noticias (
    id      SERIAL PRIMARY KEY,
    titulo  VARCHAR(100) NOT NULL UNIQUE,
    detalle VARCHAR(200) NOT NULL
);

-- Comerciantes favoritos de cada cliente
CREATE TABLE IF NOT EXISTS favoritos (
    usuario_id     INT       NOT NULL REFERENCES usuarios(id)     ON DELETE CASCADE,
    comerciante_id INT       NOT NULL REFERENCES comerciantes(id) ON DELETE CASCADE,
    creado_en      TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (usuario_id, comerciante_id)
);

-- Historial de precios: cada vez que un comerciante guarda un precio queda un registro
CREATE TABLE IF NOT EXISTS precios_historial (
    id             SERIAL PRIMARY KEY,
    comerciante_id INT          NOT NULL REFERENCES comerciantes(id) ON DELETE CASCADE,
    producto_id    INT          NOT NULL REFERENCES productos(id)    ON DELETE CASCADE,
    precio         NUMERIC(8,2) NOT NULL CHECK (precio > 0),
    registrado_en  DATE         NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON precios_historial (registrado_en);
