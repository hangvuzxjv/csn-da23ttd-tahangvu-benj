<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

try {
    // Đếm tổng số người dùng
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_users FROM users");
    $stmt->execute();
    $userCount = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];
    
    // Đếm số người dùng đăng ký hôm nay
    $stmt = $pdo->prepare("SELECT COUNT(*) as today_users FROM users WHERE DATE(created_at) = CURDATE()");
    $stmt->execute();
    $todayUsers = $stmt->fetch(PDO::FETCH_ASSOC)['today_users'];
    
    // Đếm tổng số bài viết đã duyệt
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_posts FROM posts WHERE status = 'approved'");
    $stmt->execute();
    $totalPosts = $stmt->fetch(PDO::FETCH_ASSOC)['total_posts'];
    
    // Đếm số bài viết đăng hôm nay
    $stmt = $pdo->prepare("SELECT COUNT(*) as today_posts FROM posts WHERE DATE(created_at) = CURDATE() AND status = 'approved'");
    $stmt->execute();
    $todayPosts = $stmt->fetch(PDO::FETCH_ASSOC)['today_posts'];
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_users' => $userCount,
            'today_users' => $todayUsers,
            'total_posts' => $totalPosts,
            'today_posts' => $todayPosts
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi database: ' . $e->getMessage()
    ]);
}
?>