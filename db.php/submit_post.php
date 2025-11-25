<?php
// submit_post.php - Xử lý việc đăng bài và lưu vào CSDL (CẢI TIẾN DEBUG)
include 'db.php'; 
header('Content-Type: application/json');

// Đọc dữ liệu từ POST/FILES
$title = $_POST['title'] ?? '';
$content = $_POST['content'] ?? '';
$category = $_POST['category'] ?? '';
$author_username = $_POST['author'] ?? ''; 
$image_url = null; 

// Thư mục lưu trữ ảnh
$target_dir = realpath(__DIR__ . '/../uploads') . '/';

// --- LOGIC XỬ LÝ TỆP TIN ---
if (isset($_FILES['post-media']) && $_FILES['post-media']['error'] != UPLOAD_ERR_NO_FILE) {
    
    // Kiểm tra các lỗi upload cơ bản
    $upload_error = $_FILES['post-media']['error'];

    if ($upload_error != UPLOAD_ERR_OK) {
        // Trả về mã lỗi upload PHP chi tiết (ví dụ: file quá lớn, lỗi server,...)
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Lỗi Upload File Code: ' . $upload_error . '. Vui lòng kiểm tra dung lượng file.']);
        exit;
    }

    // 1. Tạo tên file duy nhất
        $new_file_name = uniqid() . time() . "." . strtolower($file_extension);
        // Sử dụng đường dẫn tuyệt đối cho việc di chuyển tệp
        $upload_path_absolute = realpath(__DIR__ . '/../uploads') . '/';
    $target_file = $upload_path_absolute . $new_file_name;
    // 2. Chỉ cho phép các định dạng ảnh phổ biến
    $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array(strtolower($file_extension), $allowed_types)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Lỗi: Chỉ cho phép tải lên file ảnh (JPG, JPEG, PNG, GIF).']);
        exit;
    }
    
    // 3. Thực hiện di chuyển file
    if (move_uploaded_file($_FILES['post-media']['tmp_name'], $target_file)) {
        $image_url = "uploads/" . $new_file_name;
    } else {
        // Lỗi thường do quyền ghi (Permission Denied)
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể lưu tệp tin. Vui lòng kiểm tra quyền GHI thư mục "' . $target_dir . '".']);
        exit;
    }
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
    // Sử dụng $image_url đã được cập nhật
    $stmt->execute([$author_username, $title, $content, $category, $image_url]);

    echo json_encode(['success' => true, 'message' => '🎉 Bài viết đã được gửi thành công, đang chờ quản trị viên duyệt!']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể lưu bài viết. Chi tiết: ' . $e->getMessage()]);
}