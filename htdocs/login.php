<?php
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$error = '';
$success = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$email || !$password) {
        $error = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
    } else {
        $ch = curl_init('https://lamarapp.onrender.com/api/auth/login');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['email' => $email, 'password' => $password]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $resp = curl_exec($ch);
        $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($resp, true);

        if ($http === 200 && ($result['success'] ?? false)) {
            $token = $result['data'][0]['token'] ?? '';
            if ($token) {
                setcookie('auth_token', $token, time() + 86400 * 30, '/', '', true, true);
                header('Location: /');
                exit;
            }
        }
        $error = $result['message'] ?? 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور';
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تسجيل الدخول - لمار للمياه</title>
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
.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px 40px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 25px 80px rgba(0,0,0,0.2);
}
.logo {
  text-align: center;
  margin-bottom: 8px;
}
.logo-icon {
  font-size: 48px;
  line-height: 1;
}
.logo-text {
  font-size: 28px;
  font-weight: 800;
  color: #059669;
  display: block;
  margin-bottom: 4px;
}
.logo-sub {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 28px;
  display: block;
}
h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}
.form-desc {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 24px;
}
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}
.form-group input {
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
.form-group input:focus {
  border-color: #059669;
  background: #fff;
}
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  font-size: 13px;
}
.form-options a {
  color: #059669;
  text-decoration: none;
  font-weight: 600;
}
.form-options a:hover { text-decoration: underline; }
.btn-login {
  width: 100%;
  padding: 14px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.btn-login:hover { background: #047857; }
.btn-login:active { transform: scale(0.98); }
.btn-login:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  color: #9ca3af;
  font-size: 13px;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}
.btn-google {
  width: 100%;
  padding: 13px;
  background: #fff;
  color: #1f2937;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
}
.btn-google:hover {
  border-color: #059669;
  background: #f0fdf4;
}
.btn-google img { width: 20px; height: 20px; }
.register-link {
  text-align: center;
  margin-top: 22px;
  font-size: 14px;
  color: #6b7280;
}
.register-link a {
  color: #059669;
  text-decoration: none;
  font-weight: 700;
}
.register-link a:hover { text-decoration: underline; }
.alert {
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
@media (max-width: 480px) {
  .login-card { padding: 32px 24px; }
}
</style>
</head>
<body>
<div class="login-card">
  <div class="logo">
    <div class="logo-icon">💧</div>
    <span class="logo-text">لمار</span>
    <span class="logo-sub">توصيل مياه شرب نقية</span>
  </div>

  <h1>تسجيل الدخول</h1>
  <p class="form-desc">مرحباً بعودتك! أدخل بياناتك للمتابعة</p>

  <?php if ($error): ?>
    <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>

  <form method="POST" action="" id="loginForm">
    <div class="form-group">
      <label for="email">البريد الإلكتروني</label>
      <input type="email" id="email" name="email" placeholder="example@email.com" required value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
    </div>
    <div class="form-group">
      <label for="password">كلمة المرور</label>
      <input type="password" id="password" name="password" placeholder="أدخل كلمة المرور" required>
    </div>
    <div class="form-options">
      <a href="/forgot-password.php">نسيت كلمة المرور؟</a>
    </div>
    <button type="submit" class="btn-login" id="loginBtn">دخول</button>
  </form>

  <div class="divider">أو</div>

  <a href="/auth/google.php" class="btn-google">
    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
    تسجيل الدخول باستخدام Google
  </a>

  <div class="register-link">
    ليس لديك حساب؟ <a href="/register">سجل الآن</a>
  </div>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', function(e) {
  var btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'جاري تسجيل الدخول...';
});
</script>
</body>
</html>
