<?php
// get_users.php - Lấy danh sách người dùng (chỉ admin)
include 'db.php';
include 'session_manager.php';
header('Content-Type: application/json');

// Kiểm tra quyền admin
$currentUser = getCurrentUser();
if (!$currentUser || $currentUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Không có quyền truy cập admin.']);
    exit;
}

try {
    // Kiểm tra cột fullname có tồn tại không
    $checkColumn = $pdo->query("SHOW COLUMNS FROM users LIKE 'fullname'");
    $hasFullname = $checkColumn->rowCount() > 0;
    
    // Lấy danh sách người dùng với xử lý cột fullname
    $userQuery = $hasFullname ? 
        "SELECT id, username, fullname, email, role, created_at FROM users ORDER BY created_at DESC" :
        "SELECT id, username, username as fullname, email, role, created_at FROM users ORDER BY created_at DESC";
    
    $stmt = $pdo->prepare($userQuery);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $users
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Lỗi server: ' . $e->getMessage()
    ]);
}
?>