<?php
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$token = $_GET['token'] ?? '';
$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $token = $_POST['token'] ?? '';
  $password = $_POST['password'] ?? '';
  $confirm = $_POST['confirm'] ?? '';

  if (strlen($password) < 8) {
    $message = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  } elseif (!preg_match('/[A-Z]/', $password)) {
    $message = 'كلمة المرور يجب أن تحتوي على حرف كبير';
  } elseif (!preg_match('/[a-z]/', $password)) {
    $message = 'كلمة المرور يجب أن تحتوي على حرف صغير';
  } elseif (!preg_match('/[0-9]/', $password)) {
    $message = 'كلمة المرور يجب أن تحتوي على رقم';
  } elseif ($password !== $confirm) {
    $message = 'كلمتا المرور غير متطابقتين';
  } else {
    $ch = curl_init('https://lamarapp.onrender.com/api/auth/reset-password');
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_POSTFIELDS => json_encode(['token' => $token, 'password' => $password]),
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
      $message = 'تم إعادة تعيين كلمة المرور بنجاح!';
    } else {
      $message = $data['message'] ?? 'فشل إعادة التعيين. الرابط غير صالح أو منتهي الصلاحية';
    }
  }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>إعادة تعيين كلمة المرور - لمار للمياه</title>
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
}
.logo { text-align: center; margin-bottom: 24px; }
.logo-icon { font-size: 48px; line-height: 1; }
h1 { font-size: 24px; color: #1f2937; text-align: center; margin-bottom: 8px; }
.desc { text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 28px; }
.alert {
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
.alert-info { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.field { margin-bottom: 18px; }
.field label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.field input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Cairo', sans-serif;
  transition: border-color 0.2s;
  outline: none;
  background: #f9fafb;
}
.field input:focus { border-color: #059669; background: #fff; }
.btn {
  display: inline-block;
  padding: 13px 32px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  transition: all 0.3s;
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: center;
}
.btn-primary { background: #059669; color: #fff; }
.btn-primary:hover { background: #047857; transform: translateY(-1px); }
.back-link { text-align: center; margin-top: 18px; }
.back-link a { color: #059669; text-decoration: none; font-size: 14px; font-weight: 600; }
.back-link a:hover { text-decoration: underline; }
@media (max-width: 480px) {
  .card { padding: 32px 24px; }
}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon"><?= $success ? '✅' : '🔑' ?></div>
  </div>

  <h1><?= $success ? 'تم بنجاح' : 'إعادة تعيين كلمة المرور' ?></h1>

  <?php if ($message): ?>
    <div class="alert <?= $success ? 'alert-info' : 'alert-error' ?>">
      <?= htmlspecialchars($message) ?>
    </div>
  <?php endif; ?>

  <?php if ($success): ?>
    <a href="/login.php" class="btn btn-primary">تسجيل الدخول الآن</a>
  <?php elseif ($token): ?>
    <p class="desc">أدخل كلمة المرور الجديدة</p>
    <form method="POST" onsubmit="var btn=this.querySelector('button');btn.disabled=true;btn.textContent='جاري إعادة التعيين...'">
      <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">
      <div class="field">
        <label for="password">كلمة المرور الجديدة</label>
        <input type="password" id="password" name="password" required minlength="8" placeholder="8 أحرف + حرف كبير + رقم">
      </div>
      <div class="field">
        <label for="confirm">تأكيد كلمة المرور</label>
        <input type="password" id="confirm" name="confirm" required minlength="8" placeholder="أعد إدخال كلمة المرور">
      </div>
      <button type="submit" class="btn btn-primary">إعادة تعيين كلمة المرور</button>
    </form>
  <?php else: ?>
    <p class="desc">رمز إعادة التعيين غير صالح أو منتهي الصلاحية</p>
    <a href="/forgot-password.php" class="btn btn-primary">طلب رابط جديد</a>
  <?php endif; ?>

  <div class="back-link">
    <a href="/login.php">← العودة لتسجيل الدخول</a>
  </div>
</div>
</body>
</html>
