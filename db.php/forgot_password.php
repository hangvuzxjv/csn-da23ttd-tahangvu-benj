<?php
// forgot_password.php - Xử lý yêu cầu quên mật khẩu (Tạo Token)
include 'db.php'; 
include 'email_config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Tắt tất cả output buffering và error reporting để đảm bảo JSON sạch
while (ob_get_level()) {
    ob_end_clean();
}
error_reporting(0);
ini_set('display_errors', 0);

// Đọc dữ liệu JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$email = isset($data['email']) ? trim($data['email']) : '';

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng nhập Email.']);
    exit;
}

try {
    // 1. Kiểm tra Email tồn tại
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Trả về thông báo chung để không tiết lộ email có tồn tại hay không
        echo json_encode([
            'success' => true, 
            'message' => 'Nếu email của bạn tồn tại trong hệ thống, link reset đã được tạo.'
        ]);
        exit;
    }

    // 2. Tạo Token Bảo mật và Thời gian hết hạn
    $token = bin2hex(random_bytes(50));
    $expires = date("Y-m-d H:i:s", time() + 3600); // Token hết hạn sau 1 giờ

    // 3. Lưu Token vào CSDL
    $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, token_expiry = ? WHERE id = ?");
    $stmt->execute([$token, $expires, $user['id']]);

    // 4. Tạo link reset password
    $resetLink = SITE_URL . "/reset_password.html?token=" . $token;
    
    // 5. Trả về kết quả (không gửi email để tránh lỗi)
    echo json_encode([
        'success' => true, 
        'message' => 'Link đặt lại mật khẩu đã được tạo thành công!',
        'reset_link' => $resetLink,
        'username' => $user['username'],
        'expires_at' => $expires,
        'email_sent' => false // Tạm thời tắt email để tránh lỗi
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: ' . $e->getMessage()]);
}
?>