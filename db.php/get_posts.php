<?php
// db.php/get_posts.php - Lấy danh sách bài viết từ CSDL
include 'db.php'; 
header('Content-Type: application/json');

// Đọc tham số tùy chọn từ URL query string
$statusFilter = $_GET['status'] ?? 'approved'; // Mặc định chỉ lấy bài đã duyệt
$authorFilter = $_GET['author'] ?? null;
$postId = $_GET['id'] ?? null;
$limit = $_GET['limit'] ?? null;

$sql = "SELECT id, author_username, title, content, category, created_at, status, admin_note, approved_by_admin FROM posts WHERE 1=1";
$params = [];

// Lọc theo ID bài viết (cho trang chi tiết)
if ($postId) {
    $sql .= " AND id = ?";
    $params[] = $postId;
}

// Lọc theo tác giả (cho trang profile)
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