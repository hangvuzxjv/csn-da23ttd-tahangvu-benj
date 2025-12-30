<?php
// update_profile.php - Cập nhật thông tin profile đầy đủ
include 'db.php';
include 'session_manager.php';
header('Content-Type: application/json');

// Yêu cầu đăng nhập
requireLogin();

$currentUser = getCurrentUser();
$userId = $currentUser['id'];

// Lấy dữ liệu từ POST (JSON)
$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$fullname = $input['fullname'] ?? '';
$email = $input['email'] ?? '';
$phone = $input['phone'] ?? '';
$currentPassword = $input['current_password'] ?? '';
$newPassword = $input['new_password'] ?? '';

// Validate dữ liệu bắt buộc
if (empty($username) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đủ thông tin bắt buộc.']);
    exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email không hợp lệ.']);
    exit;
}

// Validate phone (nếu có)
if (!empty($phone) && !preg_match('/^[0-9]{10,11}$/', $phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Số điện thoại không hợp lệ (10-11 số).']);
    exit;
}

// Kiểm tra email đã tồn tại chưa (trừ user hiện tại)
try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $userId]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email này đã được sử dụng bởi tài khoản khác.']);
        exit;
    }
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi kiểm tra email: ' . $e->getMessage()]);
    exit;
}

// Kiểm tra xem cột fullname có tồn tại không
$hasFullnameColumn = false;
try {
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'fullname'");
    $hasFullnameColumn = $stmt->rowCount() > 0;
} catch (\PDOException $e) {
    // Nếu lỗi, giả sử cột không tồn tại
    $hasFullnameColumn = false;
}

// Nếu cột fullname không tồn tại, tạo nó
if (!$hasFullnameColumn) {
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN fullname VARCHAR(255) DEFAULT NULL AFTER username");
        $hasFullnameColumn = true;
    } catch (\PDOException $e) {
        // Nếu không thể tạo cột, sử dụng display_name thay thế
        $hasFullnameColumn = false;
    }
}

// Xử lý đổi mật khẩu (nếu có)
$passwordHash = null;
if (!empty($newPassword)) {
    if (empty($currentPassword)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.']);
        exit;
    }
    
    // Kiểm tra mật khẩu hiện tại
    if (!password_verify($currentPassword, $currentUser['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mật khẩu hiện tại không đúng.']);
        exit;
    }
    
    // Validate mật khẩu mới
    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Mật khẩu mới phải có ít nhất 6 ký tự.']);
        exit;
    }
    
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
}

try {
    // Cập nhật thông tin
    if ($hasFullnameColumn) {
        // Sử dụng cột fullname
        if ($passwordHash) {
            $stmt = $pdo->prepare("UPDATE users SET fullname = ?, email = ?, phone = ?, password = ? WHERE id = ?");
            $stmt->execute([$fullname, $email, $phone, $passwordHash, $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET fullname = ?, email = ?, phone = ? WHERE id = ?");
            $stmt->execute([$fullname, $email, $phone, $userId]);
        }
        $_SESSION['fullname'] = $fullname;
    } else {
        // Sử dụng cột display_name thay thế
        if ($passwordHash) {
            $stmt = $pdo->prepare("UPDATE users SET display_name = ?, email = ?, phone = ?, password = ? WHERE id = ?");
            $stmt->execute([$fullname, $email, $phone, $passwordHash, $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET display_name = ?, email = ?, phone = ? WHERE id = ?");
            $stmt->execute([$fullname, $email, $phone, $userId]);
        }
        $_SESSION['display_name'] = $fullname;
    }

    // Cập nhật session
    $_SESSION['email'] = $email;
    $_SESSION['phone'] = $phone;

    $message = $passwordHash ? 'Cập nhật thông tin và mật khẩu thành công!' : 'Cập nhật thông tin thành công!';
    echo json_encode(['success' => true, 'message' => $message]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: ' . $e->getMessage()]);
}
?>
