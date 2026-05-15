<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$sql = "SELECT id_prenda, nombre, descripcion, categoria, precio, stock, tallas, colores, imagen_url, imagen2, imagen3 
        FROM mprendas 
        WHERE stock > 0 
        ORDER BY id_prenda DESC";

$result = $conn->query($sql);
$productos = array();

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $imagen_url = $row['imagen_url'];
        if (empty($imagen_url)) {
            $imagen_url = 'https://placehold.co/400x400/faf0ea/d48c8c?text=' . urlencode($row['nombre']);
        }
        
        $productos[] = array(
            'id_prenda' => intval($row['id_prenda']),
            'nombre' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'categoria' => $row['categoria'],
            'precio' => floatval($row['precio']),
            'stock' => intval($row['stock']),
            'tallas' => $row['tallas'],
            'colores' => $row['colores'],
            'imagen_url' => $imagen_url,
            'imagen2' => $row['imagen2'] ?? '',
            'imagen3' => $row['imagen3'] ?? ''
        );
    }
}

echo json_encode($productos, JSON_UNESCAPED_UNICODE);
$conn->close();
?>