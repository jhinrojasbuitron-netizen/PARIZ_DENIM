<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

// Validar datos recibidos
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Datos no válidos']);
    exit;
}

// Validar campos obligatorios
if (empty($data['nombre']) || empty($data['apellido']) || empty($data['email']) || empty($data['telefono'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios: nombre, apellido, email, teléfono']);
    exit;
}

// Validar email
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email no válido']);
    exit;
}

// Validar que haya productos
if (empty($data['productos']) || !is_array($data['productos'])) {
    echo json_encode(['success' => false, 'message' => 'No hay productos en el pedido']);
    exit;
}

// Validar total
if (!isset($data['total']) || $data['total'] <= 0) {
    echo json_encode(['success' => false, 'message' => 'El total del pedido no es válido']);
    exit;
}

$conn->begin_transaction();

try {
    // Sanitizar datos
    $nombre = $conn->real_escape_string($data['nombre']);
    $apellido = $conn->real_escape_string($data['apellido']);
    $email = $conn->real_escape_string($data['email']);
    $telefono = $conn->real_escape_string($data['telefono']);
    $direccion = $conn->real_escape_string($data['direccion'] ?? '');
    $total = floatval($data['total']);
    $metodo_pago = $conn->real_escape_string($data['metodo_pago'] ?? 'efectivo');
    $id_vendedor = 1;
    
    // Buscar o crear cliente
    $sql_cliente = "SELECT id_cliente FROM mclientes WHERE email = ?";
    $stmt = $conn->prepare($sql_cliente);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $id_cliente = $row['id_cliente'];
        
        // Actualizar datos del cliente existente
        $sql_update = "UPDATE mclientes SET nombre = ?, apellido = ?, telefono = ?, direccion = ? WHERE id_cliente = ?";
        $stmt = $conn->prepare($sql_update);
        $stmt->bind_param("ssssi", $nombre, $apellido, $telefono, $direccion, $id_cliente);
        $stmt->execute();
    } else {
        $sql_insert = "INSERT INTO mclientes (nombre, apellido, email, telefono, direccion) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql_insert);
        $stmt->bind_param("sssss", $nombre, $apellido, $email, $telefono, $direccion);
        $stmt->execute();
        $id_cliente = $conn->insert_id;
    }
    
    // Crear pedido
    $sql_pedido = "INSERT INTO mtpedidos (id_cliente, id_vendedor, total, metodo_pago, estado) VALUES (?, ?, ?, ?, 'pendiente')";
    $stmt = $conn->prepare($sql_pedido);
    $stmt->bind_param("iids", $id_cliente, $id_vendedor, $total, $metodo_pago);
    $stmt->execute();
    $id_pedido = $conn->insert_id;
    
    // Insertar detalles y actualizar stock
    foreach ($data['productos'] as $producto) {
        $id_prenda = intval($producto['id']);
        $cantidad = intval($producto['cantidad']);
        $precio_unitario = floatval($producto['precio']);
        $talla = $conn->real_escape_string($producto['talla'] ?? '');
        $color = $conn->real_escape_string($producto['color'] ?? '');
        $subtotal = floatval($producto['subtotal']);
        
        // Verificar stock disponible
        $sql_stock = "SELECT stock FROM mprendas WHERE id_prenda = ?";
        $stmt = $conn->prepare($sql_stock);
        $stmt->bind_param("i", $id_prenda);
        $stmt->execute();
        $stock_result = $stmt->get_result();
        
        if ($stock_result->num_rows > 0) {
            $stock_row = $stock_result->fetch_assoc();
            if ($stock_row['stock'] < $cantidad) {
                throw new Exception("Stock insuficiente para el producto ID: $id_prenda");
            }
        } else {
            throw new Exception("Producto no encontrado: $id_prenda");
        }
        
        // Insertar detalle
        $sql_detalle = "INSERT INTO mtdetallepedidos (id_pedido, id_prenda, cantidad, precio_unitario, talla, color, subtotal) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql_detalle);
        $stmt->bind_param("iiidssd", $id_pedido, $id_prenda, $cantidad, $precio_unitario, $talla, $color, $subtotal);
        $stmt->execute();
        
        // Actualizar stock
        $sql_update_stock = "UPDATE mprendas SET stock = stock - ? WHERE id_prenda = ? AND stock >= ?";
        $stmt = $conn->prepare($sql_update_stock);
        $stmt->bind_param("iii", $cantidad, $id_prenda, $cantidad);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            throw new Exception("No se pudo actualizar el stock del producto ID: $id_prenda");
        }
    }
    
    $conn->commit();
    echo json_encode([
        'success' => true,
        'message' => 'Pedido registrado exitosamente',
        'id_pedido' => $id_pedido
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Error al procesar el pedido: ' . $e->getMessage()]);
}

$conn->close();
?>