<?php
// db.php/login.php
include 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['user']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đủ thông tin đăng nhập.']);
    exit;
}

$user = $data['user']; 
$password = $data['password'];

try {
    // 1. Tìm kiếm user theo email HOẶC username
    $stmt = $pdo->prepare("SELECT id, username, password_hash, role FROM users WHERE email = ? OR username = ?");
    $stmt->execute([$user, $user]);
    $userRow = $stmt->fetch();

    if ($userRow && password_verify($password, $userRow['password_hash'])) {
        
        // 2. LẤY SỐ LƯỢNG BÀI VIẾT (MỚI)
        $postCountStmt = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE author_username = ?");
        $postCountStmt->execute([$userRow['username']]);
        $postCount = $postCountStmt->fetchColumn();
        
        // 3. Đăng nhập thành công và trả về Post Count
    echo json_encode(['success' => true, 'message' => 'Đăng nhập thành công!', 'username' => $userRow['username'], 'role' => $userRow['role'], 'postCount' => $postCount]);
   
    }
     else {
        // Sai thông tin
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Tên tài khoản/Email hoặc Mật khẩu không đúng.']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server.']);
}
?>