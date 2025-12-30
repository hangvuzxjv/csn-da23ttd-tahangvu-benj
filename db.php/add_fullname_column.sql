-- Thêm cột fullname vào bảng users
ALTER TABLE users ADD COLUMN fullname VARCHAR(255) DEFAULT NULL AFTER username;

-- Cập nhật fullname từ display_name hiện có (nếu có)
UPDATE users SET fullname = display_name WHERE display_name IS NOT NULL AND display_name != '';

-- Cập nhật fullname từ username nếu chưa có
UPDATE users SET fullname = username WHERE fullname IS NULL OR fullname = '';