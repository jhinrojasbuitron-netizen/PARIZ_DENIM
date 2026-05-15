<?php
$host     = 'sql309.infinityfree.com';
$user     = 'if0_41930689';
$password = '8LGWHsmUqw'; 
$database = 'if0_41930689_tienda';

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

$conn->set_charset("utf8");
?>