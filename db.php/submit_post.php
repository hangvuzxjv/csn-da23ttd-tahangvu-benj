<?php
// submit_post.php - Xử lý việc đăng bài và lưu vào CSDL (ĐÃ CẢI TIẾN FILE UPLOAD)
include 'db.php'; 
header('Content-Type: application/json');

// Đọc dữ liệu từ POST/FILES
$title = $_POST['title'] ?? '';
$content = $_POST['content'] ?? '';
$category = $_POST['category'] ?? '';
$author_username = $_POST['author'] ?? ''; 
$image_url = null; // Khởi tạo image_url

// --- LOGIC XỬ LÝ TỆP TIN (CHỈ LÀ MÔ HÌNH VÀ CẦN ĐƯỢC PHÁT TRIỂN THÊM) ---
if (isset($_FILES['post-media']) && $_FILES['post-media']['error'] == UPLOAD_ERR_OK) {
    // Đây là nơi bạn sẽ thêm logic lưu trữ file thực tế (ví dụ: move_uploaded_file)
    // Sau khi lưu thành công, gán đường dẫn vào $image_url.
    // VD: $image_url = 'uploads/' . $newFileName;
    
    // TẠM THỜI: Gán một URL ảnh mặc định cho mục đích demo
    $image_url = 'img/default_upload.jpg'; // Dùng 1 ảnh mặc định cho mục đích demo
}
// ------------------ KẾT THÚC LOGIC XỬ LÝ TỆP TIN ------------------


if (empty($title) || empty($content) || empty($category) || empty($author_username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đủ Tiêu đề, Nội dung, Phân loại và đăng nhập.']);
    exit;
}

try {
    // Cần thay đổi câu lệnh INSERT để thêm image_url
    $stmt = $pdo->prepare("
        INSERT INTO posts (author_username, title, content, category, image_url) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$author_username, $title, $content, $category, $image_url]);

    echo json_encode(['success' => true, 'message' => '🎉 Bài viết đã được gửi thành công, đang chờ quản trị viên duyệt!']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể lưu bài viết. Chi tiết: ' . $e->getMessage()]);
}
?>