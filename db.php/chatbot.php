<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Xử lý preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Chỉ cho phép POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Chỉ cho phép POST request']);
    exit;
}

// Lấy dữ liệu từ request
$input = json_decode(file_get_contents('php://input'), true);
$message = isset($input['message']) ? trim($input['message']) : '';

if (empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Tin nhắn không được để trống']);
    exit;
}

// Chuyển tin nhắn thành chữ thường để dễ xử lý
$messageLower = mb_strtolower($message, 'UTF-8');

// Hệ thống trả lời tự động dựa trên từ khóa
function generateResponse($message) {
    $responses = [
        // Chào hỏi
        'chào|xin chào|hello|hi|hey' => [
            'Xin chào! 👋 Tôi là trợ lý AI của website Thủy Sản Trà Vinh. Tôi có thể giúp bạn về:
            🐟 Kỹ thuật nuôi trồng thủy sản
            💰 Thông tin giá cả thị trường  
            🏥 Bệnh và cách phòng chống
            📰 Tin tức ngành thủy sản
            
            Bạn muốn hỏi về vấn đề gì?',
            'Chào bạn! 😊 Tôi có thể tư vấn về nuôi trồng thủy sản, giá cả thị trường và các vấn đề kỹ thuật. Bạn cần hỗ trợ gì?'
        ],
        
        // Kỹ thuật nuôi tôm
        'tôm|nuôi tôm|kỹ thuật tôm|tôm sú|tôm thẻ' => [
            '🦐 **Kỹ thuật nuôi tôm hiệu quả:**
            
            📋 **Chuẩn bị ao:**
            - Diện tích: 3000-5000m²/ao
            - Độ sâu: 1.2-1.5m
            - Xử lý đáy ao bằng vôi bột 200-300kg/ha
            - Lắp đặt hệ thống sục khí
            
            🌊 **Chất lượng nước:**
            - pH: 7.5-8.5 (tối ưu 8.0-8.2)
            - Độ mặn: 15-25‰ (tôm sú), 0-15‰ (tôm thẻ)
            - Oxy hòa tan: >4mg/l (tối ưu 5-7mg/l)
            - Nhiệt độ: 26-30°C
            
            🍤 **Thả giống:**
            - Mật độ tôm sú: 8-12 con/m²
            - Mật độ tôm thẻ: 15-25 con/m²
            - Kích thước: PL12-PL15
            
            Bạn muốn biết thêm về khâu nào cụ thể?',
            
            '🦐 **Bí quyết nuôi tôm thành công:**
            
            ✅ **3 yếu tố quan trọng nhất:**
            1. Chất lượng nước ổn định
            2. Mật độ thả hợp lý
            3. Chế độ cho ăn khoa học
            
            🔬 **Kiểm tra hàng ngày:**
            - Đo pH, oxy, nhiệt độ
            - Quan sát tôm ăn uống
            - Kiểm tra màu nước
            
            💡 **Mẹo hay:** Sử dụng men vi sinh 2-3 lần/tuần để cải thiện môi trường nước!
            
            Bạn đang gặp khó khăn gì trong nuôi tôm?'
        ],
        
        // Kỹ thuật nuôi cá
        'cá|nuôi cá|kỹ thuật cá|cá tra|cá basa|cá lóc' => [
            '🐟 **Kỹ thuật nuôi cá chuyên nghiệp:**
            
            🏊 **Chuẩn bị ao nuôi:**
            - Diện tích: 1000-5000m² (tùy loại cá)
            - Độ sâu: 1.5-3m
            - Hệ thống cấp thoát nước độc lập
            - Lưới che chống chim ăn cá
            
            🌡️ **Điều kiện nước:**
            - Nhiệt độ: 26-30°C (cá tra), 24-28°C (cá chép)
            - pH: 6.5-8.0
            - Oxy: >3mg/l (tối ưu 4-6mg/l)
            - NH3: <0.1mg/l
            
            🐠 **Mật độ thả:**
            - Cá tra: 8-15 con/m²
            - Cá basa: 10-20 con/m²
            - Cá lóc: 5-8 con/m²
            
            🍽️ **Thức ăn:**
            - Protein: 28-35% (tùy giai đoạn)
            - Cho ăn 2-3 lần/ngày
            - Lượng ăn: 2-5% trọng lượng thân
            
            Bạn nuôi loại cá nào và cần tư vấn gì?',
            
            '🐟 **Lịch trình nuôi cá hiệu quả:**
            
            📅 **Giai đoạn 1 (0-30 ngày):**
            - Cá giống 3-5cm
            - Cho ăn 6-8 lần/ngày
            - Protein 35-40%
            
            📅 **Giai đoạn 2 (30-90 ngày):**
            - Cá 50-200g
            - Cho ăn 4-5 lần/ngày  
            - Protein 30-35%
            
            📅 **Giai đoạn 3 (90+ ngày):**
            - Cá thương phẩm
            - Cho ăn 2-3 lần/ngày
            - Protein 28-32%
            
            🎯 **Mục tiêu:** Thu hoạch sau 6-8 tháng với trọng lượng 0.8-1.2kg/con
            
            Bạn đang ở giai đoạn nào?'
        ],
        
        // Giá cả thị trường
        'giá|giá cả|thị trường|bán|mua' => [
            '💰 **Bảng giá thủy sản hôm nay:**
            
            🦐 **TÔM SÚ (VND/kg):**
            - Size 13-15: 350,000-380,000đ
            - Size 16-20: 280,000-320,000đ
            - Size 21-25: 250,000-280,000đ
            - Size 26-30: 220,000-250,000đ
            
            🦐 **TÔM THẺ (VND/kg):**
            - Size 30-40: 200,000-230,000đ
            - Size 41-50: 170,000-200,000đ
            - Size 51-60: 150,000-180,000đ
            
            🐟 **CÁ TRA (VND/kg):**
            - Cá thương phẩm (0.8-1.2kg): 22,000-26,000đ
            - Cá xuất khẩu (1.5kg+): 28,000-32,000đ
            
            🐟 **CÁ BASA:** 20,000-24,000đ/kg
            🐟 **CÁ LÓC:** 45,000-55,000đ/kg
            
            📈 **Xu hướng:** Giá tôm đang tăng nhẹ do nhu cầu xuất khẩu tốt
            
            Bạn cần biết giá loại nào cụ thể?',
            
            '💰 **Phân tích thị trường:**
            
            📊 **Giá tôm:** Ổn định, có xu hướng tăng
            - Nguyên nhân: Nhu cầu xuất khẩu tăng
            - Dự báo: Tăng 5-10% trong 2 tuần tới
            
            📊 **Giá cá tra:** Dao động nhẹ
            - Nguyên nhân: Thời tiết thuận lợi
            - Dự báo: Ổn định trong tháng này
            
            🌍 **Thị trường xuất khẩu:**
            - Mỹ: Nhu cầu tôm tăng 15%
            - EU: Nhu cầu cá tra ổn định
            - Nhật Bản: Tăng nhập khẩu tôm sú
            
            � **LPời khuyên:** Đây là thời điểm tốt để bán tôm, giữ cá tra thêm 2-3 tuần
            
            Bạn có sản phẩm nào cần tư vấn bán không?'
        ],
        
        // Bệnh thủy sản
        'bệnh|chết|điều trị|phòng bệnh|virus|vi khuẩn|đốm trắng' => [
            '🏥 **Chẩn đoán bệnh thủy sản:**

🔴 **Đốm trắng (WSSV):**
- Triệu chứng: Đốm trắng trên mai, tôm bơi lờ đờ
- Nguyên nhân: Virus
- Phòng ngừa: Kiểm soát chất lượng nước, cách ly

🟡 **Hoại tử gan tụy (AHPND):**
- Triệu chứng: Ruột trống, gan tụy teo
- Nguyên nhân: Vi khuẩn Vibrio
- Điều trị: Kháng sinh theo chỉ định

🟠 **Xuất huyết ở cá:**
- Triệu chứng: Đốm đỏ trên thân, vây
- Điều trị: Kháng sinh + cải thiện nước

💊 **Tủ thuốc cần có:**
- Men vi sinh
- Vitamin C, E
- Thuốc sát trùng (Iodine)

Bạn thấy triệu chứng gì ở tôm/cá?',
            
            '🏥 **Phòng bệnh hiệu quả:**

✅ **Hàng ngày:**
- Kiểm tra tôm/cá ăn uống
- Đo chất lượng nước
- Quan sát hành vi bất thường

✅ **Hàng tuần:**
- Sử dụng men vi sinh
- Bổ sung vitamin C
- Vệ sinh dụng cụ

🚨 **Báo động khi:**
- Tỷ lệ chết >5%/ngày
- Tôm/cá không ăn >2 ngày
- Nước đổi màu bất thường

Bạn cần hỗ trợ gì về phòng bệnh?'
        ],
        
        // Thức ăn
        'thức ăn|cho ăn|dinh dưỡng|protein' => [
            '🍽️ **Hệ thống dinh dưỡng thủy sản:**
            
            🦐 **THỨC ĂN TÔM:**
            - Protein: 35-42% (giai đoạn nhỏ), 30-38% (giai đoạn lớn)
            - Lipid: 6-10%
            - Carbohydrate: 20-35%
            
            ⏰ **Lịch cho ăn:**
            - PL-30 ngày: 8-10 lần/ngày (5-7% trọng lượng)
            - 30-60 ngày: 4-6 lần/ngày (4-6% trọng lượng)
            - 60+ ngày: 3-4 lần/ngày (3-5% trọng lượng)
            
            🐟 **THỨC ĂN CÁ:**
            - Cá giống (0-100g): Protein 35-40%
            - Cá thương phẩm (100g+): Protein 28-32%
            - Lipid: 4-8%, Carbohydrate: 25-40%
            
            💡 **Mẹo hay:**
            - Cho ăn khi trời mát (sáng sớm, chiều tối)
            - Quan sát tôm/cá ăn trong 30 phút đầu
            - Điều chỉnh lượng thức ăn theo thời tiết
            
            Bạn cần tư vấn về thức ăn cho giai đoạn nào?'
        ],
        
        // Chất lượng nước
        'nước|chất lượng nước|ph|oxy|độ mặn|amoniac' => [
            '🌊 **Hệ thống quản lý chất lượng nước:**
            
            �  **pH (độ acid/base):**
            - Tôm: 7.5-8.5 (tối ưu 8.0-8.2)
            - Cá: 6.5-8.0 (tối ưu 7.0-7.5)
            - Đo: 2 lần/ngày (sáng 6h, chiều 18h)
            
            💨 **Oxy hòa tan (DO):**
            - Tôm: >4mg/l (tối ưu 5-7mg/l)
            - Cá: >3mg/l (tối ưu 4-6mg/l)
            - Đo: Sáng sớm (5-6h) khi oxy thấp nhất
            
            🧂 **Độ mặn:**
            - Tôm sú: 15-25‰
            - Tôm thẻ: 0-15‰
            - Cá nước ngọt: 0-3‰
            
            ☠️ **Amoniac (NH3):**
            - An toàn: <0.1mg/l
            - Cảnh báo: 0.1-0.5mg/l
            - Nguy hiểm: >0.5mg/l
            
            🌡️ **Nhiệt độ:**
            - Tôm: 26-30°C
            - Cá: 24-30°C (tùy loài)
            
            Bạn đang gặp vấn đề gì về chất lượng nước?'
        ],
        
        // Mùa vụ
        'mùa vụ|thời vụ|khi nào|lịch nuôi' => [
            '📅 **Lịch mùa vụ nuôi trồng thủy sản:**
            
            🦐 **TÔM:**
            
            🌱 **Vụ 1 (Xuân-Hè):**
            - Thả giống: Tháng 2-3
            - Thu hoạch: Tháng 6-7
            - Ưu điểm: Nhiệt độ ổn định, ít bão
            
            🍂 **Vụ 2 (Thu-Đông):**
            - Thả giống: Tháng 8-9
            - Thu hoạch: Tháng 12-1
            - Ưu điểm: Giá cao, ít bệnh tật
            
            🐟 **CÁ:**
            - Nuôi quanh năm
            - Tốt nhất: Tháng 3-10
            - Tránh: Tháng 12-2 (quá lạnh)
            
            🌊 **Lưu ý theo mùa:**
            ☀️ **Mùa khô (11-4):** Ít mưa, dễ quản lý
            🌧️ **Mùa mưa (5-10):** Nhiều nước ngọt
            🌀 **Mùa bão (8-11):** Cần gia cố ao
            
            Bạn định bắt đầu vụ nào?'
        ],
        
        // Kinh tế
        'lãi|lỗ|chi phí|đầu tư|vốn|kinh tế' => [
            '💰 **Phân tích kinh tế nuôi trồng thủy sản:**
            
            🦐 **NUÔI TÔM (1000m²):**
            
            💸 **Chi phí đầu tư:**
            - Đào ao, cải tạo: 15-20 triệu
            - Hệ thống sục khí: 8-12 triệu
            - Máy móc, dụng cụ: 5-8 triệu
            - Tổng đầu tư: 30-40 triệu
            
            💸 **Chi phí vận hành/vụ:**
            - Con giống: 3-5 triệu
            - Thức ăn: 15-25 triệu
            - Điện, xăng: 2-3 triệu
            - Thuốc, hóa chất: 1-2 triệu
            - Tổng chi phí: 23-38 triệu/vụ
            
            💰 **Doanh thu dự kiến:**
            - Sản lượng: 800-1200kg/vụ
            - Giá bán: 200-300k/kg
            - Doanh thu: 160-360 triệu/vụ
            
            📈 **Lợi nhuận:**
            - Lãi gộp: 122-322 triệu/vụ
            - Tỷ suất lợi nhuận: 60-85%
            - Hoàn vốn: 6-12 tháng
            
            Bạn muốn phân tích chi tiết loại nào?'
        ],
        
        // Công nghệ
        'công nghệ|biofloc|probiotics|men vi sinh' => [
            '🔬 **Công nghệ nuôi trồng tiên tiến:**
            
            🧪 **Hệ thống Biofloc:**
            - Nguyên lý: Vi sinh vật chuyển hóa chất thải thành protein
            - Ưu điểm: Tiết kiệm nước 90%, giảm chi phí thức ăn 20-30%
            - Mật độ: Tăng 3-5 lần so với truyền thống
            - Đầu tư: 50-80 triệu/1000m²
            
            🧬 **Probiotics (Men vi sinh):**
            - Bacillus subtilis: Phân hủy chất hữu cơ
            - Lactobacillus: Tăng cường miễn dịch
            - Nitrosomonas: Chuyển hóa amoniac
            - Liều dùng: 1-2g/m³ nước, 2-3 lần/tuần
            
            🌱 **Nuôi trồng hữu cơ:**
            - Không sử dụng kháng sinh, hóa chất
            - Thức ăn tự nhiên, men vi sinh
            - Giá bán cao hơn 30-50%
            - Thị trường xuất khẩu EU, Mỹ
            
            Bạn quan tâm công nghệ nào?'
        ],
        
        // Hỗ trợ chung
        'help|giúp|hỗ trợ|tư vấn' => [
            '🤝 **Tôi có thể hỗ trợ bạn về:**
            
            🔹 **Kỹ thuật nuôi trồng:** Tôm, cá, công nghệ mới
            🔹 **Thông tin thị trường:** Giá cả, xuất khẩu, dự báo
            🔹 **Phòng chống bệnh:** Chẩn đoán, điều trị, phòng ngừa
            🔹 **Chất lượng nước:** pH, oxy, amoniac, xử lý
            🔹 **Dinh dưỡng:** Thức ăn, FCR, lịch cho ăn
            🔹 **Kinh tế:** Chi phí, lợi nhuận, đầu tư
            🔹 **Công nghệ:** Biofloc, RAS, men vi sinh
            
            💬 **Cách hỏi hiệu quả:**
            - Nêu rõ loại tôm/cá bạn nuôi
            - Mô tả cụ thể vấn đề gặp phải
            - Cho biết quy mô, điều kiện nuôi
            
            🎯 **Ví dụ câu hỏi hay:**
            ✅ "Tôm sú size 30 bị chết nhiều, nước có mùi hôi, pH 9.2"
            ✅ "Cá tra 500g/con, FCR 2.1, cách cải thiện?"
            
            Hãy đặt câu hỏi cụ thể để tôi có thể tư vấn tốt nhất!',
            
            '🤝 **Menu hỗ trợ nhanh:**
            
            Gõ từ khóa để được tư vấn ngay:
            
            🦐 **"tôm"** - Kỹ thuật nuôi tôm
            🐟 **"cá"** - Kỹ thuật nuôi cá  
            💰 **"giá"** - Thông tin giá thị trường
            🏥 **"bệnh"** - Chẩn đoán và điều trị
            🌊 **"nước"** - Quản lý chất lượng nước
            🍽️ **"thức ăn"** - Dinh dưỡng và cho ăn
            📅 **"mùa vụ"** - Lịch nuôi trồng
            💰 **"lãi"** - Phân tích kinh tế
            🔬 **"công nghệ"** - Kỹ thuật tiên tiến
            
            🔥 **Câu hỏi hot:**
            - "Tôm chết hàng loạt phải làm sao?"
            - "Giá tôm hôm nay bao nhiêu?"
            - "Cách tính lãi lỗ nuôi tôm?"
            - "Biofloc có thực sự hiệu quả?"
            
            Bạn quan tâm chủ đề nào nhất?'
        ]
    ];
    
    // Tìm phản hồi phù hợp
    foreach ($responses as $pattern => $responseList) {
        if (preg_match('/(' . $pattern . ')/ui', $message)) {
            return $responseList[array_rand($responseList)];
        }
    }
    
    // Phản hồi mặc định
    $defaultResponses = [
        'Hmm, câu hỏi thú vị! 🤔 Tôi chuyên về thủy sản nên có thể chưa hiểu rõ ý bạn. 
        
        Bạn có thể hỏi về:
        🦐 **Nuôi tôm:** "cách nuôi tôm sú", "tôm bị bệnh gì"
        🐟 **Nuôi cá:** "kỹ thuật nuôi cá tra", "cá chết nhiều"  
        💰 **Giá cả:** "giá tôm hôm nay", "thị trường xuất khẩu"
        🏥 **Bệnh tật:** "tôm đốm trắng", "cá xuất huyết"
        
        Hoặc gõ **"help"** để xem menu đầy đủ!',
        
        'Tôi là chuyên gia AI về thủy sản, nhưng câu hỏi này hơi khó hiểu. 😅
        
        Thử hỏi cụ thể hơn như:
        ✅ "Tôm size 30 giá bao nhiêu?"
        ✅ "Cá tra bị bệnh gì khi có đốm đỏ?"
        ✅ "pH nước 9.0 có cao không?"
        ✅ "Chi phí nuôi tôm 1000m² là bao nhiêu?"
        
        Câu hỏi càng cụ thể, tôi tư vấn càng chính xác! 🎯',
        
        'Xin lỗi, tôi cần thêm thông tin để trả lời chính xác. 🙏
        
        💡 **Mẹo đặt câu hỏi hiệu quả:**
        - Nói rõ loại tôm/cá (tôm sú, cá tra...)
        - Mô tả triệu chứng cụ thể
        - Cho biết quy mô nuôi
        - Đề cập điều kiện môi trường
        
        🔥 **Ví dụ câu hỏi tốt:**
        "Ao tôm sú 2000m², nước pH 8.5, tôm ăn ít, có cách nào tăng cường không?"
        
        Hãy thử lại với câu hỏi cụ thể hơn nhé! 😊'
    ];
    
    return $defaultResponses[array_rand($defaultResponses)];
}

// Tạo phản hồi
$response = generateResponse($messageLower);

// Thêm delay ngẫu nhiên để giống người thật
usleep(rand(500000, 1500000)); // 0.5-1.5 giây

// Trả về kết quả
echo json_encode([
    'success' => true,
    'message' => $response,
    'timestamp' => date('H:i')
]);
?>