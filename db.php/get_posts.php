<?php
// db.php/get_posts.php - Lấy danh sách bài viết từ CSDL (ĐÃ CẢI TIẾN BẢO MẬT)
include 'db.php'; 
header('Content-Type: application/json');

// Đọc tham số tùy chọn từ URL query string
$statusFilter = $_GET['status'] ?? 'approved';
$authorFilter = $_GET['author'] ?? null; // Chứa username của người dùng hiện tại khi gọi từ frontend
$postId = $_GET['id'] ?? null;
$limit = $_GET['limit'] ?? null;

// --- BẢO MẬT: XỬ LÝ YÊU CẦU XEM CHI TIẾT ĐỘC LẬP VÀ BẢO MẬT ---
if ($postId) {
    // 1. Lấy vai trò của người dùng hiện tại (nếu đăng nhập)
    $role = 'user';
    if ($authorFilter) {
        $stmtRole = $pdo->prepare("SELECT role FROM users WHERE username = ?");
        $stmtRole->execute([$authorFilter]);
        $userRow = $stmtRole->fetch();
        if ($userRow) {
            $role = $userRow['role'];
        }
    }

    // 2. Lấy bài viết dựa trên ID, bao gồm image_url (Đã cập nhật cho tính năng tiếp theo)
    $stmtPost = $pdo->prepare("SELECT id, author_username, title, content, category, created_at, status, admin_note, approved_by_admin, image_url FROM posts WHERE id = ?");
    $stmtPost->execute([$postId]);
    $post = $stmtPost->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
         http_response_code(404);
         echo json_encode(['success' => false, 'message' => 'Bài viết không tồn tại.']);
         exit;
    }

    // 3. Kiểm tra quyền truy cập
    $isAuthor = $post['author_username'] === $authorFilter;
    $isAdmin = $role === 'admin';
    $isApproved = $post['status'] === 'approved';

    if ($isApproved || $isAuthor || $isAdmin) {
        // Cho phép hiển thị
        echo json_encode(['success' => true, 'posts' => [$post], 'debug' => ['query_type' => 'single_secure']]);
        exit;
    } else {
        // Không có quyền truy cập
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Bài viết này chưa được phê duyệt hoặc bạn không có quyền xem.']);
        exit;
    }
}
// --- KẾT THÚC XỬ LÝ YÊU CẦU XEM CHI TIẾT ---


$sql = "SELECT id, author_username, title, content, category, created_at, status, admin_note, approved_by_admin, image_url FROM posts WHERE 1=1";
$params = [];

// Lọc theo tác giả (cho trang profile) - Logic danh sách
if ($authorFilter) {
    $sql .= " AND author_username = ?";
    $params[] = $authorFilter;
    
    // LOGIC FIX LỖI: Nếu lọc theo Tác giả VÀ status là 'all' thì không cần thêm status vào mệnh đề WHERE
    if ($statusFilter !== 'all') {
        $sql .= " AND status = ?";
        $params[] = $statusFilter;
    }
} else {
    // Nếu không có authorFilter, chỉ lấy bài APPROVED cho các trang công cộng (index, tintuc)
    if ($statusFilter === 'approved') {
        $sql .= " AND status = 'approved'";
    } else if ($statusFilter !== 'all') {
        // Áp dụng các trạng thái khác (pending, rejected) nếu được truyền rõ ràng
        $sql .= " AND status = ?";
        $params[] = $statusFilter;
    }
}


$sql .= " ORDER BY created_at DESC";

// Giới hạn số lượng (cho trang chủ)
if ($limit && !$postId) {
    $sql .= " LIMIT ?";
    $params[] = (int)$limit;
}

try {
    // Sử dụng prepare và execute để bảo mật
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Bổ sung username vào kết quả trả về cho mục đích debug
    echo json_encode(['success' => true, 'posts' => $posts, 'debug' => ['sql' => $sql, 'params' => $params]]); 

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể tải bài viết.']);
}
?>