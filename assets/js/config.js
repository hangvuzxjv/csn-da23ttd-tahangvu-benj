// config.js - Cấu hình đường dẫn cho project

// HARDCODE base URL để tránh lỗi chữ hoa/thường
// Thay đổi giá trị này nếu bạn deploy ở nơi khác
const BASE_URL = '/Project/'; // Chữ P hoa vì thư mục là C:\xampp\htdocs\Project

// Export để dùng trong script.js
window.APP_CONFIG = {
    BASE_URL: BASE_URL,
    API_URL: BASE_URL + 'db.php/',
    IMG_URL: BASE_URL + 'img/',
    UPLOADS_URL: BASE_URL + 'uploads/'
};

// Helper function để tạo URL đầy đủ
window.apiUrl = function(path) {
    return window.APP_CONFIG.BASE_URL + path;
};

console.log('Base URL:', BASE_URL);
console.log('Full API URL example:', window.APP_CONFIG.API_URL + 'check_session.php');