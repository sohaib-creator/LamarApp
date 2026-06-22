<?php
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$token = $_GET['token'] ?? '';
$message = '';
$success = false;

if ($token) {
  $ch = curl_init('https://lamarapp.onrender.com/api/auth/verify-email');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['token' => $token]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
  ]);
  $resp = curl_exec($ch);
  $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $data = json_decode($resp, true);
  if ($http === 200 && ($data['success'] ?? false)) {
    $success = true;
    $message = 'تم تأكيد بريدك الإلكتروني بنجاح!';
  } else {
    $message = $data['message'] ?? 'رمز التحقق غير صالح أو منتهي الصلاحية';
  }
} else {
  $message = 'رمز التحقق مفقود';
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تأكيد البريد - لمار للمياه</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Cairo', sans-serif;
  background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 25px 80px rgba(0,0,0,0.2);
  text-align: center;
}
.icon { font-size: 64px; margin-bottom: 16px; }
h1 { font-size: 24px; color: #1f2937; margin-bottom: 12px; }
p { color: #6b7280; font-size: 16px; margin-bottom: 28px; line-height: 1.7; }
.btn {
  display: inline-block;
  padding: 13px 36px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  transition: all 0.3s;
  cursor: pointer;
  border: none;
}
.btn-primary { background: #059669; color: #fff; }
.btn-primary:hover { background: #047857; transform: translateY(-1px); }
@media (max-width: 480px) {
  .card { padding: 36px 24px; }
}
</style>
</head>
<body>
<div class="card">
  <div class="icon"><?= $success ? '✅' : '❌' ?></div>
  <h1>تأكيد البريد الإلكتروني</h1>
  <p><?= htmlspecialchars($message) ?></p>
  <a href="/login.php" class="btn btn-primary">
    <?= $success ? 'تسجيل الدخول' : 'العودة لتسجيل الدخول' ?>
  </a>
</div>
</body>
</html>
