-- Tạo bảng ratings để lưu đánh giá của user
CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_post (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Thêm cột rating_total và rating_count vào bảng posts nếu chưa có
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS rating_total INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;