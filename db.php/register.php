<?php
// register.php - Đăng ký tài khoản với thông tin đầy đủ
include 'db.php';
header('Content-Type: application/json');

// Đọc dữ liệu JSON từ frontend
$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$fullname = trim($data['fullname'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$location = trim($data['location'] ?? '');
$password = $data['password'] ?? '';

// Kiểm tra dữ liệu bắt buộc
if (empty($username) || empty($fullname) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đầy đủ thông tin bắt buộc.']);
    exit;
}

// Kiểm tra định dạng email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Địa chỉ email không hợp lệ.']);
    exit;
}

// Kiểm tra độ dài mật khẩu
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Mật khẩu phải có ít nhất 6 ký tự.']);
    exit;
}

// Kiểm tra tên tài khoản (chỉ chữ cái, số, gạch dưới)
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới.']);
    exit;
}

try {
    // Kiểm tra bảng users có đủ cột chưa
    $checkColumns = $pdo->query("SHOW COLUMNS FROM users LIKE 'fullname'");
    if ($checkColumns->rowCount() == 0) {
        // Thêm các cột mới nếu chưa có
        $pdo->exec("ALTER TABLE users ADD COLUMN fullname VARCHAR(100) DEFAULT NULL AFTER username");
        $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email");
        $pdo->exec("ALTER TABLE users ADD COLUMN location VARCHAR(100) DEFAULT NULL AFTER phone");
    }

    // Kiểm tra username hoặc email đã tồn tại chưa
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Tên tài khoản hoặc Email đã được sử dụng.']);
        exit;
    }

    // Mã hóa mật khẩu
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Thêm người dùng mới
    $stmt = $pdo->prepare("INSERT INTO users (username, fullname, email, phone, location, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$username, $fullname, $email, $phone ?: null, $location ?: null, $passwordHash]);

    echo json_encode([
        'success' => true, 
        'message' => 'Đăng ký thành công! Chào mừng bạn đến với cộng đồng Thủy Sản Trà Vinh.'
    ]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Lỗi hệ thống: Không thể tạo tài khoản. Vui lòng thử lại sau.',
        'debug' => $e->getMessage() // Chỉ để debug, có thể xóa trong production
    ]);
}
?>