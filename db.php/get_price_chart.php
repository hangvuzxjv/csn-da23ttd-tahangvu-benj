<?php
// get_price_chart.php - Lấy dữ liệu giá thủy sản
include 'db.php';
header('Content-Type: application/json');

$species = $_GET['species'] ?? 'Tôm Thẻ';
$days = $_GET['days'] ?? 30;

try {
    // Kiểm tra xem bảng price_tracking có tồn tại không
    $checkTable = $pdo->query("SHOW TABLES LIKE 'price_tracking'");
    if ($checkTable->rowCount() == 0) {
        // Tạo bảng nếu chưa có
        $createTable = "CREATE TABLE IF NOT EXISTS price_tracking (
            id INT AUTO_INCREMENT PRIMARY KEY,
            species VARCHAR(50) NOT NULL COMMENT 'Loài thủy sản',
            price DECIMAL(10,2) NOT NULL COMMENT 'Giá (VNĐ/kg)',
            location VARCHAR(100) DEFAULT 'Trà Vinh',
            recorded_at DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        $pdo->exec($createTable);
        
        // Thêm dữ liệu mẫu
        $sampleData = [
            ['Tôm Thẻ', 180000, 'Trà Vinh', '2025-12-25'],
            ['Tôm Thẻ', 185000, 'Trà Vinh', '2025-12-26'],
            ['Tôm Thẻ', 190000, 'Trà Vinh', '2025-12-27'],
            ['Tôm Thẻ', 188000, 'Trà Vinh', '2025-12-28'],
            ['Tôm Thẻ', 192000, 'Trà Vinh', '2025-12-29'],
            ['Tôm Thẻ', 195000, 'Trà Vinh', '2025-12-30'],
            ['Cá Tra', 32000, 'Trà Vinh', '2025-12-25'],
            ['Cá Tra', 33000, 'Trà Vinh', '2025-12-26'],
            ['Cá Tra', 31000, 'Trà Vinh', '2025-12-27'],
            ['Cá Tra', 34000, 'Trà Vinh', '2025-12-28'],
            ['Cá Tra', 33500, 'Trà Vinh', '2025-12-29'],
            ['Cá Tra', 35000, 'Trà Vinh', '2025-12-30'],
            ['Cá Basa', 28000, 'Trà Vinh', '2025-12-25'],
            ['Cá Basa', 29000, 'Trà Vinh', '2025-12-26'],
            ['Cá Basa', 27500, 'Trà Vinh', '2025-12-27'],
            ['Tôm Sú', 220000, 'Trà Vinh', '2025-12-25'],
            ['Tôm Sú', 225000, 'Trà Vinh', '2025-12-26'],
            ['Tôm Sú', 230000, 'Trà Vinh', '2025-12-27'],
            ['Cua Biển', 150000, 'Trà Vinh', '2025-12-25'],
            ['Cua Biển', 155000, 'Trà Vinh', '2025-12-26']
        ];
        
        $insertStmt = $pdo->prepare("INSERT INTO price_tracking (species, price, location, recorded_at) VALUES (?, ?, ?, ?)");
        foreach ($sampleData as $data) {
            $insertStmt->execute($data);
        }
    }
    
    $stmt = $pdo->prepare("SELECT species, price, location, recorded_at 
                           FROM price_tracking 
                           WHERE species = ? 
                           AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                           ORDER BY recorded_at ASC");
    $stmt->execute([$species, $days]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $data,
        'species' => $species,
        'count' => count($data)
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Lỗi Database: ' . $e->getMessage(),
        'species' => $species,
        'days' => $days
    ]);
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Lỗi Server: ' . $e->getMessage()
    ]);
}
?>
