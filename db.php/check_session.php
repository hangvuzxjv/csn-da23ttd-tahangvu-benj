<?php
// check_session.php - API để frontend kiểm tra trạng thái đăng nhập
include 'session_manager.php';
include 'db.php';

header('Content-Type: application/json');

// Kiểm tra session timeout
checkSessionTimeout();

if (isLoggedIn()) {
    $user = getCurrentUser();
    
    // Lấy thông tin đầy đủ từ database
    try {
        // Kiểm tra cột có tồn tại không
        $checkColumns = $pdo->query("SHOW COLUMNS FROM users");
        $columns = $checkColumns->fetchAll(PDO::FETCH_COLUMN);
        
        $selectFields = "username, email";
        if (in_array('fullname', $columns)) $selectFields .= ", fullname";
        if (in_array('phone', $columns)) $selectFields .= ", phone";
        if (in_array('avatar', $columns)) $selectFields .= ", avatar";
        
        $stmt = $pdo->prepare("SELECT $selectFields FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Lấy số lượng bài viết
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE author_username = ?");
        $stmt->execute([$user['username']]);
        $postCount = $stmt->fetchColumn();
        
        // Debug: Log post count
        error_log("Post count for user " . $user['username'] . ": " . $postCount);
        
        echo json_encode([
            'success' => true,
            'isLoggedIn' => true,
            'username' => $userInfo['username'],
            'fullname' => isset($userInfo['fullname']) ? $userInfo['fullname'] : $userInfo['username'],
            'display_name' => isset($userInfo['fullname']) ? $userInfo['fullname'] : $userInfo['username'], // Để tương thích
            'email' => $userInfo['email'] ?? '',
            'phone' => $userInfo['phone'] ?? '',
            'avatar' => $userInfo['avatar'] ?? '',
            'role' => $user['role'],
            'postCount' => $postCount,
            'csrfToken' => generateCSRFToken()
        ]);
    } catch (\PDOException $e) {
        echo json_encode([
            'success' => true,
            'isLoggedIn' => true,
            'username' => $user['username'],
            'fullname' => $user['username'],
            'display_name' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'postCount' => 0,
            'csrfToken' => generateCSRFToken()
        ]);
    }
} else {
    echo json_encode([
        'success' => true,
        'isLoggedIn' => false
    ]);
}
?>
