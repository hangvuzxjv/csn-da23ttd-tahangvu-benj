<?php
// setup_ratings.php - Thiết lập bảng ratings và cột rating cho posts
include 'db.php';

try {
    // Tạo bảng ratings
    $sql = "CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_post (user_id, post_id),
        INDEX idx_user_id (user_id),
        INDEX idx_post_id (post_id)
    )";
    
    $pdo->exec($sql);
    echo "✅ Bảng ratings đã được tạo thành công.<br>";
    
    // Kiểm tra và thêm cột rating_total vào bảng posts
    $stmt = $pdo->query("SHOW COLUMNS FROM posts LIKE 'rating_total'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE posts ADD COLUMN rating_total INT DEFAULT 0");
        echo "✅ Đã thêm cột rating_total vào bảng posts.<br>";
    } else {
        echo "ℹ️ Cột rating_total đã tồn tại trong bảng posts.<br>";
    }
    
    // Kiểm tra và thêm cột rating_count vào bảng posts
    $stmt = $pdo->query("SHOW COLUMNS FROM posts LIKE 'rating_count'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE posts ADD COLUMN rating_count INT DEFAULT 0");
        echo "✅ Đã thêm cột rating_count vào bảng posts.<br>";
    } else {
        echo "ℹ️ Cột rating_count đã tồn tại trong bảng posts.<br>";
    }
    
    echo "<br>🎉 Thiết lập hệ thống đánh giá hoàn tất!";
    
} catch (\PDOException $e) {
    echo "❌ Lỗi: " . $e->getMessage();
}
?>