<?php
/**
 * API Proxy with file-based caching for lamarapp.onrender.com
 * Hit this via: /api-proxy.php?url=/api/products
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://lamarapp.site.je');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$targetUrl = $_GET['url'] ?? '';
if (!$targetUrl) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing url param', 'data' => []]);
    exit;
}

$targetUrl = 'https://lamarapp.onrender.com' . $targetUrl;
$method = $_SERVER['REQUEST_METHOD'];

$cacheDir = __DIR__ . '/cache';
$cacheKey = 'api_' . md5($method . ':' . $targetUrl);
$cacheFile = $cacheDir . '/' . $cacheKey . '.json';
$cacheTTL = 300; // 5 minutes

// Only cache GET requests to public endpoints
$shouldCache = ($method === 'GET' && (
    strpos($targetUrl, '/api/products') !== false ||
    strpos($targetUrl, '/api/categories') !== false
));

// Serve from cache if fresh
if ($shouldCache && file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = file_get_contents($cacheFile);
    header('X-Cache: HIT');
    header('Cache-Control: public, max-age=300, s-maxage=300');
    echo $cached;
    exit;
}

// Forward to Render
$ch = curl_init($targetUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: ' . ($_SERVER['HTTP_AUTHORIZATION'] ?? ''),
        'Origin: https://lamarapp.site.je',
    ],
]);

if ($method === 'POST' || $method === 'PUT') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo $response ?: json_encode(['success' => false, 'message' => 'Proxy error', 'data' => []]);
    exit;
}

// Cache the response
if ($shouldCache && $response) {
    if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
    file_put_contents($cacheFile, $response);
}

header('X-Cache: MISS');
header('Cache-Control: public, max-age=300, s-maxage=300');
echo $response;
