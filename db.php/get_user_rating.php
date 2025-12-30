<?php
// get_user_rating.php - Lấy đánh giá của user cho bài viết
include 'db.php';
include 'session_manager.php';
header('Content-Type: application/json');

// Debug logging
error_log("get_user_rating.php called");

$postId = $_GET['post_id'] ?? null;
error_log("Post ID: " . $postId);

if (!$postId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Thiếu ID bài viết.']);
    exit;
}

// Kiểm tra xem user có đăng nhập không
if (!isLoggedIn()) {
    error_log("User not logged in");
    echo json_encode(['success' => true, 'rating' => 0, 'message' => 'Chưa đăng nhập.']);
    exit;
}

$currentUser = getCurrentUser();
$userId = $currentUser['id'];
error_log("User ID: " . $userId);

try {
    // Lấy đánh giá của user cho bài viết này
    $stmt = $pdo->prepare("SELECT rating FROM ratings WHERE user_id = ? AND post_id = ?");
    $stmt->execute([$userId, $postId]);
    $rating = $stmt->fetchColumn();
    
    error_log("Found rating: " . ($rating ? $rating : 'none'));
    
    if ($rating !== false && $rating !== null) {
        echo json_encode(['success' => true, 'rating' => (int)$rating]);
    } else {
        echo json_encode(['success' => true, 'rating' => 0]);
    }
} catch (\PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: ' . $e->getMessage()]);
}
?>