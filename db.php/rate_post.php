<?php
// rate_post.php - Đánh giá bài viết
include 'db.php';
include 'session_manager.php';
header('Content-Type: application/json');

// Debug logging
error_log("rate_post.php called");

// Kiểm tra đăng nhập
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Bạn cần đăng nhập để đánh giá bài viết.']);
    exit;
}

$currentUser = getCurrentUser();
$userId = $currentUser['id'];

// Lấy dữ liệu từ request
$input = file_get_contents('php://input');
error_log("Raw input: " . $input);

$data = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dữ liệu JSON không hợp lệ.']);
    exit;
}

$postId = $data['post_id'] ?? null;
$rating = $data['rating'] ?? 0;

error_log("Parsed data - postId: $postId, rating: $rating, userId: $userId");

// Validate dữ liệu
if (!$postId || $rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dữ liệu không hợp lệ. Post ID: ' . $postId . ', Rating: ' . $rating]);
    exit;
}

try {
    // Kiểm tra bài viết có tồn tại không
    $stmt = $pdo->prepare("SELECT id FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Bài viết không tồn tại.']);
        exit;
    }
    
    // Insert hoặc update rating
    $stmt = $pdo->prepare("INSERT INTO ratings (user_id, post_id, rating) VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE rating = VALUES(rating)");
    $result = $stmt->execute([$userId, $postId, $rating]);
    
    if (!$result) {
        throw new Exception("Failed to insert/update rating");
    }
    
    error_log("Rating inserted/updated successfully");
    
    // Cập nhật tổng điểm trong bảng posts
    $stmt = $pdo->prepare("UPDATE posts SET 
                           rating_total = (SELECT COALESCE(SUM(rating), 0) FROM ratings WHERE post_id = ?),
                           rating_count = (SELECT COUNT(*) FROM ratings WHERE post_id = ?)
                           WHERE id = ?");
    $result = $stmt->execute([$postId, $postId, $postId]);
    
    if (!$result) {
        throw new Exception("Failed to update post ratings");
    }
    
    error_log("Post ratings updated successfully");
    
    echo json_encode(['success' => true, 'message' => '⭐ Cảm ơn bạn đã đánh giá!']);
    
} catch (\PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi cơ sở dữ liệu: ' . $e->getMessage()]);
} catch (\Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: ' . $e->getMessage()]);
}
?>
