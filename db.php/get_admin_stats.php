<?php
// get_admin_stats.php - Lấy thống kê cho admin dashboard
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
    
    // Thống kê bài viết
    $postStats = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM posts
    ")->fetch(PDO::FETCH_ASSOC);
    
    // Thống kê người dùng
    $userStats = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
            SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as users
        FROM users
    ")->fetch(PDO::FETCH_ASSOC);
    
    // Hoạt động gần đây (10 bài viết mới nhất)
    $recentPosts = $pdo->query("
        SELECT id, title, author_username as author, status, created_at 
        FROM posts 
        ORDER BY created_at DESC 
        LIMIT 10
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    // Người dùng mới (5 người mới nhất) - với xử lý cột fullname
    $userQuery = $hasFullname ? 
        "SELECT id, username, fullname, email, created_at FROM users ORDER BY created_at DESC LIMIT 5" :
        "SELECT id, username, username as fullname, email, created_at FROM users ORDER BY created_at DESC LIMIT 5";
    
    $recentUsers = $pdo->query($userQuery)->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'posts' => $postStats,
            'users' => $userStats,
            'recent_posts' => $recentPosts,
            'recent_users' => $recentUsers
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Lỗi server: ' . $e->getMessage()
    ]);
}
?>