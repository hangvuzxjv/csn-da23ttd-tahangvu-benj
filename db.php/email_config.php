<?php
// email_config.php - Cấu hình email

// Cấu hình SMTP
define('SMTP_HOST', 'smtp.gmail.com');  // Gmail SMTP
define('SMTP_PORT', 587);                // Port TLS
define('SMTP_USERNAME', 'hangvuzxjv@gmail.com');  // Email của bạn
define('SMTP_PASSWORD', 'xaiu oksf vrwu oruf');     // App Password (không phải mật khẩu Gmail)
define('SMTP_FROM_EMAIL', 'hangvuzxjv@gmail.com');  // Phải giống SMTP_USERNAME
define('SMTP_FROM_NAME', 'Thủy Sản Trà Vinh');

// Cấu hình khác
define('SITE_URL', 'http://localhost/Project');  // URL website của bạn
define('SITE_NAME', 'Thủy Sản Trà Vinh');

// Debug mode (true = hiển thị lỗi chi tiết, false = ẩn lỗi)
define('EMAIL_DEBUG', false);  // Tắt debug để tránh lỗi hiển thị
?>
