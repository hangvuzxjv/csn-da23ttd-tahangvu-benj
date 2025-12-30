// =========================================================
// error-handler.js - XỬ LÝ LỖI TOÀN CỤC CHO WEBSITE
// =========================================================

// Xử lý lỗi JavaScript toàn cục
window.addEventListener('error', function(e) {
    console.warn('JavaScript Error:', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno
    });
    
    // Ngăn hiển thị lỗi trong console cho một số lỗi phổ biến
    if (e.message.includes('404') || 
        e.message.includes('Cannot read property') ||
        e.message.includes('Cannot read properties') ||
        e.message.includes('tailwind') ||
        e.message.includes('undefined') ||
        (e.filename && e.filename.includes('.js'))) {
        e.preventDefault();
        return true;
    }
});

// Xử lý lỗi Promise không được catch
window.addEventListener('unhandledrejection', function(e) {
    console.warn('Unhandled Promise Rejection:', e.reason);
    
    // Ngăn hiển thị lỗi cho các lỗi mạng phổ biến
    if (e.reason && (
        e.reason.message?.includes('fetch') ||
        e.reason.message?.includes('404') ||
        e.reason.message?.includes('Network') ||
        e.reason === undefined ||
        e.reason === null
    )) {
        e.preventDefault();
    }
});

// =========================================================
// HELPER FUNCTIONS AN TOÀN
// =========================================================

// Hàm helper để kiểm tra element tồn tại trước khi thao tác
window.safeElementOperation = function(elementId, operation) {
    const element = document.getElementById(elementId);
    if (element && typeof operation === 'function') {
        try {
            return operation(element);
        } catch (error) {
            console.warn(`Error operating on element ${elementId}:`, error);
            return null;
        }
    }
    return null;
};

// Hàm helper để set text content an toàn
window.safeSetText = function(elementId, text) {
    return window.safeElementOperation(elementId, (element) => {
        element.textContent = text || '';
        return element;
    });
};

// Hàm helper để set innerHTML an toàn
window.safeSetHTML = function(elementId, html) {
    return window.safeElementOperation(elementId, (element) => {
        element.innerHTML = html || '';
        return element;
    });
};

// Hàm helper để fetch API an toàn
window.safeFetch = async function(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        // Try to parse JSON response
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            // If JSON parsing fails, return error
            throw new Error(`Invalid JSON response: ${response.statusText}`);
        }
        
        // Return the parsed result (success or error from server)
        return result;
        
    } catch (error) {
        console.error('Fetch error:', error);
        return { success: false, message: error.message };
    }
};

// Hàm helper để hiển thị thông báo lỗi
window.showError = function(message, elementId = null) {
    if (elementId) {
        window.safeSetHTML(elementId, `<p class="text-red-500 text-center py-4">${message}</p>`);
    } else {
        console.error('Error:', message);
    }
};

// Hàm helper để hiển thị loading
window.showLoading = function(elementId, message = 'Đang tải...') {
    window.safeSetHTML(elementId, `<p class="text-center text-gray-500 py-4">${message}</p>`);
};

// =========================================================
// XỬ LÝ ẢNH LỖI TOÀN CỤC
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    // Thêm xử lý lỗi cho tất cả ảnh hiện tại
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('onerror')) {
            img.onerror = function() {
                this.src = 'img/1.jpg'; // Fallback image
                this.onerror = null; // Prevent infinite loop
                console.warn('Image failed to load, using fallback:', this.src);
            };
        }
    });
    
    // Xử lý ảnh được thêm động
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    const newImages = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
                    newImages.forEach(img => {
                        if (!img.hasAttribute('onerror')) {
                            img.onerror = function() {
                                this.src = 'img/1.jpg';
                                this.onerror = null;
                                console.warn('Dynamic image failed to load, using fallback:', this.src);
                            };
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

console.log('✅ Error handler initialized');