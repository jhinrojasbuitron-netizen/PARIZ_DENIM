-- ============================================
-- PARIZ DENIM - BASE DE DATOS COMPLETA
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS pariz_denim;
USE pariz_denim;

-- ============================================
-- TABLA: Vendedores
-- ============================================
CREATE TABLE IF NOT EXISTS mvendedores (
    id_vendedor INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Clientes
-- ============================================
CREATE TABLE IF NOT EXISTS mclientes (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Productos/Prendas
-- ============================================
CREATE TABLE IF NOT EXISTS mprendas (
    id_prenda INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    tallas VARCHAR(100) DEFAULT 'S,M,L,XL',
    colores VARCHAR(200) DEFAULT 'Negro,Blanco,Beige',
    imagen VARCHAR(255),
    imagen_url VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Pedidos
-- ============================================
CREATE TABLE IF NOT EXISTS mtpedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    id_vendedor INT,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','pagado','enviado','entregado','cancelado') DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    FOREIGN KEY (id_cliente) REFERENCES mclientes(id_cliente),
    FOREIGN KEY (id_vendedor) REFERENCES mvendedores(id_vendedor)
);

-- ============================================
-- TABLA: Detalle de Pedidos
-- ============================================
CREATE TABLE IF NOT EXISTS mtdetallepedidos (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT,
    id_prenda INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    talla VARCHAR(20),
    color VARCHAR(30),
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES mtpedidos(id_pedido),
    FOREIGN KEY (id_prenda) REFERENCES mprendas(id_prenda)
);

-- ============================================
-- TABLA: Documentos de Venta
-- ============================================
CREATE TABLE IF NOT EXISTS mtdocumentoventa (
    id_documento INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT,
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(50),
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES mtpedidos(id_pedido)
);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Vendedor (contraseña: admin123)
INSERT INTO mvendedores (nombre, email, password, telefono) VALUES 
('Admin Pariz', 'admin@parizdenim.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '999999999');

-- Productos
INSERT INTO mprendas (nombre, descripcion, categoria, precio, stock, tallas, colores, imagen, imagen_url) VALUES
('Jeans Skinny Azul', 'Jeans ajustados de color azul oscuro, ideales para un look casual y moderno.', 'Jeans', 89.90, 50, 'S,M,L,XL', 'Azul,Denim,Negro', 'jeans1.jpg', 'imagen/jeans1.jpg'),
('Blusa Blanca Elegante', 'Blusa de algodón con cuello elegante, perfecta para la oficina o eventos formales.', 'Blusas', 59.90, 35, 'S,M,L,XL', 'Blanco,Beige,Negro', 'blusa1.jpg', 'imagen/blusa1.jpg'),
('Chaleco de Lana', 'Chaleco tejido de lana de oveja, cálido y sofisticado para los días fríos.', 'Chalecos', 79.90, 25, 'S,M,L', 'Beige,Gris,Negro', 'chaleco1.jpg', 'imagen/chaleco1.jpg'),
('Top Negro Básico', 'Top de algodón color negro, básico y versátil para cualquier temporada.', 'Tops', 39.90, 60, 'S,M,L,XL', 'Negro,Blanco,Rosa', 'top1.jpg', 'imagen/top1.jpg'),
('Pullover Beige', 'Pullover tejido color beige, suave y cómodo para un estilo casual elegante.', 'Pullover', 99.90, 30, 'S,M,L,XL', 'Beige,Gris,Claro', 'pullover1.jpg', 'imagen/pullover1.jpg');

-- Actualizar productos con imágenes
UPDATE mprendas SET imagen_url = 'imagen/jeans1.jpg' WHERE id_prenda = 1;
UPDATE mprendas SET imagen_url = 'imagen/blusa1.jpg' WHERE id_prenda = 2;
UPDATE mprendas SET imagen_url = 'imagen/chaleco1.jpg' WHERE id_prenda = 3;
UPDATE mprendas SET imagen_url = 'imagen/top1.jpg' WHERE id_prenda = 4;
UPDATE mprendas SET imagen_url = 'imagen/pullover1.jpg' WHERE id_prenda = 5;