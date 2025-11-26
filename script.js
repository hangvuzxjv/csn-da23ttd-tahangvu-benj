// =========================================================
// script.js - SCRIPT VẬN HÀNH TOÀN TRANG (FRONTEND HOÀN CHỈNH)
// =========================================================

// Hằng số chứa tiền tố thư mục cần thiết để truy cập ảnh công khai
// Dựa trên cấu trúc file: db.php/uploads/
const PUBLIC_UPLOAD_PREFIX = 'db.php/'; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHỞI TẠO CÁC PHẦN TỬ CHUNG
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenu = document.getElementById('user-menu');
    
    // 2. XỬ LÝ FORM ĐĂNG KÝ/ĐĂNG NHẬP/ĐĂNG TIN (Cần lắng nghe sự kiện)
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', handleSubmitPost); 
    }
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPasswordSubmit);
    }
    // Thêm lắng nghe cho form reset password
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
    }

    // 3. HIỂN THỊ BÀI ĐĂNG TRÊN CÁC TRANG (DÙNG API MỚI)
    // FIX: Bổ sung logic kiểm tra đường dẫn linh hoạt hơn cho môi trường localhost
    const currentPath = window.location.pathname;
    // Kiểm tra /index.html, / hoặc /ten_thu_muc/
    const isIndexPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.match(/\/csn-tahangvu\/(\/)?$/i);

    if (isIndexPage) {
        renderPostsToContainer('post-list', { status: 'approved', limit: 6 }); // Trang Chủ: 6 bài đã duyệt
    }
    if (window.location.pathname.endsWith('tintuc.html')) {
        renderPostsToContainer('news-list', { status: 'approved' }); // Trang Tin Tức: Tất cả bài đã duyệt
    }
    
    // Tải nội dung chi tiết bài viết
    if (window.location.pathname.endsWith('chitiet.html')) {
        renderPostDetail();
    }
    
    // RENDER BÀI VIẾT TRÊN TRANG PROFILE (LOGIC MỚI)
    if (window.location.pathname.endsWith('profile.html')) {
        renderMyPosts(); 
    }
    
    
    // =========================================================================
    // FIX QUAN TRỌNG: GỌI HÀM KHỞI TẠO Ở CUỐI ĐỂ ĐẢM BẢO TẤT CẢ HÀM ĐƯỢC LOAD
    // =========================================================================
    initializeMobileMenu(mobileMenuToggle, mobileMenu);
    initializeUserMenu(userMenuBtn, userMenu);
    checkLoginStatus(); 
    initializeCarousel(); 
    
    // FIX: Gắn lại event listener cho các nút động sau khi DOMContentLoaded hoàn tất
    if (window.location.pathname.endsWith('admin.html')) {
        initializeAdminButtonDelegation();
    }
    
});

// THÊM HÀM MỚI ĐỂ GẮN SỰ KIỆN CHO CÁC NÚT ADMIN ĐỘNG
function initializeAdminButtonDelegation() {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    mainContent.addEventListener('click', (e) => {
        const target = e.target.closest('button'); // Tìm nút BUTTON gần nhất
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        // Lấy postId từ thẻ cha chứa data-post-id (div admin-post-item hoặc div p-6)
        const postIdContainer = target.closest('[data-post-id]'); 
        
        if (action && postIdContainer) {
            const postId = postIdContainer.getAttribute('data-post-id');

            if (action === 'approve' || action === 'reject') {
                // Dùng handleApproval cho tab Pending
                const adminNote = document.getElementById(`admin-note-${postId}`).value.trim();
                handleApproval(postId, action, adminNote);
            } else if (action === 'delete') {
                // Dùng deletePost cho tab All Posts và Profile
                deletePost(postId); 
            }
        }
    });
}


// =========================================================
// CHỨC NĂNG A: HEADER & NAVIGATION
// =========================================================
function initializeMobileMenu(toggle, menu) {
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }
}

function initializeUserMenu(btn, menu) {
    if (btn && menu) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            menu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    // FIX: Đảm bảo lấy giá trị từ province-select nếu có
    const provinceSelect = document.getElementById('province-select');
    const province = provinceSelect ? provinceSelect.value : 'travinh';
    
    if (query.length === 0) {
        alert('Vui lòng nhập từ khóa tìm kiếm.');
        return; 
    }

    const encodedQuery = encodeURIComponent(query);
    window.location.href = `search.html?q=${encodedQuery}&province=${province}`;
}
window.performSearch = performSearch; 

// TRONG script.js, HÀM checkLoginStatus (Đã sửa)
function checkLoginStatus() {
    const authButtons = document.getElementById('auth-buttons');
    const userProfileDiv = document.getElementById('user-profile');

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || 'Người Dùng';
    const userRole = localStorage.getItem('role') || 'user'; // LẤY ROLE MỚI
    
    // LẤY POST COUNT TỪ LOCALSTORAGE (Đã được cập nhật trong handleLoginSubmit và renderMyPosts)
    const postCount = localStorage.getItem('postCount') || 0; 
    
    // Cập nhật thông tin trên trang profile
    // FIX: Đã thêm kiểm tra tồn tại của các phần tử HTML để tránh TypeError trên các trang khác
    if (window.location.pathname.endsWith('profile.html')) {
        const profileUsernameElement = document.getElementById('profile-username');
        const profilePostCountElement = document.getElementById('profile-post-count');
        const profileEmailElement = document.getElementById('profile-email');

        if (profileUsernameElement) {
             profileUsernameElement.textContent = username; 
        }

        if (profilePostCountElement) {
             profilePostCountElement.textContent = postCount; 
        }

        const email = localStorage.getItem('email');
        if (profileEmailElement && email) {
            profileEmailElement.textContent = email; 
        }
    }

    if (authButtons && userProfileDiv) {
        if (isLoggedIn) {
            authButtons.classList.add('hidden');
            userProfileDiv.classList.remove('hidden');
            
            userProfileDiv.querySelector('span').textContent = username;
            
            // FIX: Cập nhật số bài viết trên menu
            const profileLink = userProfileDiv.querySelector('a[href="profile.html"]');
            if(profileLink) {
                 profileLink.textContent = `👤 Profile (${postCount} bài)`;
            }

            // LOGIC MỚI: THÊM NÚT ADMIN CHO ADMIN
            const userMenu = document.getElementById('user-menu');
            if (userRole === 'admin' && userMenu) {
                // Kiểm tra nếu nút admin chưa có thì thêm vào
                if (!userMenu.querySelector('a[href="admin.html"]')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = 'admin.html';
                    adminLink.className = 'block px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50';
                    adminLink.textContent = '🛠️ Quản Trị Bài Viết';
                    // Thêm vào vị trí đầu tiên
                    userMenu.insertBefore(adminLink, userMenu.firstChild); 
                }
            }
           
        } else {
            authButtons.classList.remove('hidden');
            userProfileDiv.classList.add('hidden');
        }
    }
    
    
}
    
    
// =========================================================
// CHỨC NĂNG B: XỬ LÝ FORM AUTH
// =========================================================

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp.');
        return;
    }
    
    const formData = {
        username: document.getElementById('reg-username').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: password
    };
    
    try {
        const response = await fetch('db.php/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert(result.message + ' Chuyển hướng đến trang Đăng nhập.');
            window.location.href = 'dangnhap.html'; 
        } else {
            alert('Lỗi Đăng ký: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log để xem lỗi.');
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-password').value;
    
    if (!user || !pass) {
        alert('Vui lòng nhập tên tài khoản/email và mật khẩu.');
        return;
    }

    const formData = {
        user: user,
        password: pass
    };
    
    try {
        const response = await fetch('db.php/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Đăng nhập thành công
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', result.username); 
            localStorage.setItem('role', result.role || 'user'); 
            
            // FIX QUAN TRỌNG: Lưu email và postCount mới nhận từ PHP
            localStorage.setItem('email', result.email);
            localStorage.setItem('postCount', result.postCount); 

            alert(result.message);
            window.location.href = 'index.html'; 
        } else {
            alert('Lỗi Đăng nhập: ' + (result.message || 'Tên tài khoản/Email hoặc Mật khẩu không đúng.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log để xem lỗi.');
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('postCount');
    localStorage.removeItem('role'); // Xóa role khi logout
    localStorage.removeItem('email'); // Xóa email khi logout
    alert('➡️ Bạn đã đăng xuất.');
    window.location.reload();
}
window.logout = logout; 


async function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('fp-email').value.trim();
    
    if (!email) {
        alert('Vui lòng nhập email của bạn.');
        return;
    }

    const formData = {
        email: email
    };
    
    try {
        const response = await fetch('db.php/forgot_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            // Vẫn cho người dùng quay lại trang đăng nhập sau khi gửi yêu cầu
            window.location.href = 'dangnhap.html'; 
        } else {
            alert('Lỗi: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log để xem lỗi.');
    }
}


    // =========================================================
    // CHỨC NĂNG C: XỬ LÝ BÀI ĐĂNG VÀ HIỂN THỊ
    // =========================================================
async function fetchPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
        const response = await fetch(`db.php/get_posts.php?${query}`);
        const result = await response.json();
        
        if (result.success) {
            return result.posts;
        } else {
            console.error('Lỗi API fetchPosts:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Lỗi kết nối server khi tải bài viết:', error);
        return [];
    }
}

function createPostCard(post) {
    // Tạo tóm tắt tạm thời
    const summary = post.content.substring(0, 150) + '...'; 

    // SỬA LỖI 404: Bổ sung PUBLIC_UPLOAD_PREFIX
    let imageUrl = post.image_url;
    if (imageUrl && !imageUrl.startsWith(PUBLIC_UPLOAD_PREFIX)) {
        imageUrl = PUBLIC_UPLOAD_PREFIX + imageUrl;
    } else if (!imageUrl) {
        imageUrl = 'img/1.jpg'; // Ảnh mặc định nếu không có URL
    }
    // END FIX

    // Định dạng lại ngày tháng
    const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
    
    // Logic nút xóa (chỉ hiển thị trên trang profile)
    const currentUser = localStorage.getItem('username');
    // FIX: Đảm bảo nút xóa chỉ hiện cho bài chưa duyệt trên trang tin tức/trang chủ
    const deleteButtonHtml = (window.location.pathname.endsWith('profile.html') && post.status !== 'approved' && currentUser === post.author_username) ? 
        `<button data-action="delete" data-post-id="${post.id}" class="text-xs text-red-500 hover:text-red-700 transition font-medium ml-3">🗑️ Xóa</button>` : 
        '';
        
    // Hiển thị trạng thái duyệt trên Card
    const statusText = post.status === 'pending' ? 'Chờ Duyệt' : (post.status === 'rejected' ? 'Bị Từ Chối' : 'Đã Duyệt');
    const statusClass = post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : (post.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-600');
    // Nếu không phải trang profile, chỉ hiển thị bài đã duyệt, nên ẩn trạng thái
    const statusBadge = (window.location.pathname.endsWith('profile.html')) ? 
        `<span class="text-xs font-semibold ${statusClass} px-2 py-0.5 rounded">${post.category} - ${statusText}</span>` : 
        `<span class="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">${post.category}</span>`;


    return `
        <article class="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden">
            <img src="${imageUrl}" alt="${post.title}" class="w-full h-48 object-cover">
            <div class="p-5">
                ${statusBadge}
                <h3 class="text-xl font-semibold text-gray-800 my-2 hover:text-teal-600">
                    <a href="chitiet.html?id=${post.id}">${post.title}</a>
                </h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${summary}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                    <span class="flex items-center">
                        Ngày đăng: ${postDate}
                        ${deleteButtonHtml} 
                    </span>
                    <span class="font-medium text-teal-600">👤 Tác giả: ${post.author_username}</span>
                </div>
            </div>
        </article>
    `;
}

async function renderPostsToContainer(targetElementId, params = {}) {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải bài viết...</p>';

    // Dùng hàm fetchPosts mới
    const posts = await fetchPosts(params);
    
    if (posts.length === 0) {
         container.innerHTML = `<p class="text-center text-gray-500 py-10">Chưa có bài đăng nào từ cộng đồng.</p>`;
         return;
    }
    
    const postsHtml = posts.map(createPostCard).join('');
    container.innerHTML = postsHtml; 
}


// LOGIC MỚI: RENDER BÀI VIẾT CỦA USER TRÊN TRANG PROFILE
async function renderMyPosts() {
    const container = document.getElementById('my-posts-list');
    const currentUser = localStorage.getItem('username');
    if (!container || !currentUser) return;

    // Fetch bài viết theo tác giả, bao gồm tất cả trạng thái 
    // FIX: Đảm bảo fetch với status: 'all' khi có authorFilter
    const myPosts = await fetchPosts({ author: currentUser, status: 'all' });
    
    // Cập nhật số lượng bài đăng TRONG LOCALSTORAGE
    localStorage.setItem('postCount', myPosts.length);
    // Sau khi cập nhật, cần gọi lại checkLoginStatus để cập nhật header
    checkLoginStatus(); 
    
    // Cập nhật số lượng bài đăng trên giao diện
    const profilePostCount = document.getElementById('profile-post-count');
    if(profilePostCount) {
         profilePostCount.textContent = myPosts.length;
    }

    if (myPosts.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-6">Bạn chưa có bài viết nào. Hãy <a href="dangtin.html" class="text-teal-600 hover:underline">Đăng Tin</a> để chia sẻ kinh nghiệm!</p>`;
        return;
    }

    // Tạo HTML cho các bài viết trong danh sách Profile
    const postsHtml = myPosts.map(post => {
        const statusClass = post.status === 'approved' ? 'text-green-600' : (post.status === 'pending' ? 'text-yellow-600' : 'text-red-600');
        const statusText = post.status === 'approved' ? '✅ Đã Duyệt' : (post.status === 'pending' ? '⏳ Chờ Duyệt' : '❌ Bị Từ Chối');
        
        // Nút xóa chỉ hiển thị nếu KHÔNG phải là bài đã duyệt VÀ là TÁC GIẢ
        const deleteButton = (post.status !== 'approved' && post.author_username === currentUser) ?
            // FIX: Sử dụng data-action và data-post-id
            `<button data-action="delete" data-post-id="${post.id}" class="text-sm text-red-500 hover:text-red-700 transition font-medium ml-3">🗑️ Xóa</button>` : '';

        return `
            <div class="bg-white p-4 rounded-lg shadow flex justify-between items-center hover:shadow-md transition" data-post-id="${post.id}">
                <div>
                    <a href="chitiet.html?id=${post.id}" class="text-lg font-semibold text-gray-800 hover:text-teal-600">${post.title}</a>
                    <p class="text-sm text-gray-500 mt-1">Đăng ngày: ${new Date(post.created_at).toLocaleDateString('vi-VN')} | <span class="${statusClass} font-medium">${statusText}</span></p>
                </div>
                ${deleteButton}
            </div>
        `;
    }).join('');

    container.innerHTML = postsHtml;
}

// Cập nhật renderPostDetail để dùng API và hiển thị Admin Note
async function renderPostDetail() {
    const container = document.getElementById('post-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        if(container) container.innerHTML = '<h1 class="text-3xl font-bold text-red-500 text-center">Lỗi: Không tìm thấy ID bài viết!</h1>';
        return;
    }
    
    // Fetch bài viết chi tiết
    // GỌI API MỚI (truyền cả username để kiểm tra quyền tác giả)
    const currentUser = localStorage.getItem('username') || '';
    const posts = await fetchPosts({ id: postId, author: currentUser });
    const post = posts[0];
    
    // SỬA LỖI 404: Bổ sung PUBLIC_UPLOAD_PREFIX
    let imageUrl = post.image_url;
    if (imageUrl && !imageUrl.startsWith(PUBLIC_UPLOAD_PREFIX)) {
        imageUrl = PUBLIC_UPLOAD_PREFIX + imageUrl;
    } else if (!imageUrl) {
        imageUrl = 'img/1.jpg'; // Ảnh mặc định nếu không có URL
    }
    // END FIX
    
    if (!post) {
         if(container) container.innerHTML = '<h1 class="text-3xl font-bold text-red-500 text-center">Bài viết không tồn tại.</h1>';
         return;
    }
    
    // Logic kiểm tra quyền truy cập đã được chuyển sang PHP, nhưng vẫn kiểm tra lại ở frontend 
    // để xử lý trường hợp API trả về lỗi 403 (dù fetchPosts sẽ trả về posts rỗng)
    // Nếu post tồn tại (nghĩa là user có quyền xem), ta tiếp tục
    const isAuthor = currentUser === post.author_username;
    const isAdmin = localStorage.getItem('role') === 'admin';
    
    if (post.status !== 'approved' && !isAuthor && !isAdmin) {
         // Trường hợp fetchPosts trả về bài viết nhưng không phải 'approved' và user không phải tác giả/admin
         if(container) container.innerHTML = '<h1 class="text-3xl font-bold text-red-500 text-center">Bài viết này chưa được phê duyệt hoặc đã bị từ chối.</h1>';
         return;
    }
    
    // --- Bắt đầu tạo HTML ---
    document.title = post.title + ' | SeaTech';
    const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
    
    // Xử lý Admin Note (Phân tích/Hướng dẫn)
    let adminNoteHtml = '';
    if (post.status === 'approved' && post.admin_note) {
        adminNoteHtml = `
            <div class="mt-8 p-6 bg-teal-50 border-l-4 border-teal-600 rounded-lg">
                <h2 class="text-xl font-bold text-teal-700 mb-2">💡 Phân Tích & Hướng Dẫn từ Quản Trị Viên</h2>
                <div class="prose max-w-none text-gray-700 leading-relaxed">
                    <p>${post.admin_note.replace(/\n/g, '</p><p>')}</p>
                </div>
                <p class="text-xs text-gray-500 mt-2">Được phê duyệt bởi: ${post.approved_by_admin}</p>
            </div>
        `;
    }
    
    // Thẻ trạng thái (cho tác giả/admin xem)
    let statusBadge = '';
    if (post.status !== 'approved') {
        const statusClass = post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
        statusBadge = `<span class="ml-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">${post.status === 'pending' ? 'Đang Chờ Duyệt' : 'Đã Bị Từ Chối'}</span>`;
    }

    const contentHtml = `
        <div class="max-w-4xl mx-auto">
            <div id="post-detail-content">
                <span class="text-sm font-semibold text-teal-600 bg-teal-100 px-3 py-1 rounded">${post.category}</span>
                ${statusBadge}
                <h1 class="text-4xl font-extrabold text-teal-700 mb-3">${post.title}</h1>
                <p class="text-sm text-gray-500">
                    Ngày đăng: ${postDate} | Tác giả: <span class="font-medium text-teal-600">${post.author_username}</span>
                </p>
            </div>

            <figure class="mb-8">
                <img src="${imageUrl}" alt="${post.title}" class="w-full h-auto rounded-xl shadow-lg object-cover">
                <figcaption class="text-center text-sm text-gray-500 mt-2">Ảnh minh họa (Tạm thời)</figcaption>
            </figure>

            <div class="prose max-w-none bg-white p-6 rounded-xl shadow-md">
                <div class="text-gray-700 leading-relaxed">
                    <p>${post.content.replace(/\n/g, '</p><p>')}</p>
                </div>
            </div>
            
            ${adminNoteHtml}

            <div class="mt-8 pt-4 border-t-2 border-dashed border-gray-300 flex items-center justify-end space-x-4">
                <div class="text-right">
                    <p class="text-sm text-gray-500">Bài viết được chia sẻ bởi:</p>
                    <a href="profile.html" class="text-lg font-bold text-teal-600 hover:text-teal-800">${post.author_username}</a>
                    <p class="text-xs text-gray-500">Người nuôi có kinh nghiệm</p>
                </div>
                <a href="profile.html">
                    <img src="img/avt1.jpg" alt="Avatar" class="w-16 h-16 rounded-full border-2 border-teal-500">
                </a>
            </div>

            <div class="mt-10 pt-6 border-t">
                <a href="tintuc.html" class="inline-flex items-center text-teal-600 hover:text-teal-800 font-medium">
                    ← Quay lại trang Tin Tức
                </a>
            </div>
        </div>
    `;
    
    container.innerHTML = contentHtml;
}
window.renderPostDetail = renderPostDetail;


// Hàm xóa bài viết (Sử dụng lại logic từ trang Profile)
async function deletePost(postId) {
    const currentUser = localStorage.getItem('username');
    const userRole = localStorage.getItem('role');
    
    if (!currentUser) {
        alert('Bạn cần đăng nhập để thực hiện hành động này.');
        return;
    }
    
    if (!confirm('Bạn có chắc chắn muốn XÓA bài viết này không? Hành động này không thể hoàn tác.')) {
        return;
    }

    const formData = {
        post_id: postId,
        username: currentUser,
        role: userRole
    };
    
    try {
        const response = await fetch('db.php/delete_post.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            
            // Tải lại tab Admin đang xem
            if (window.location.pathname.endsWith('admin.html')) {
                // Kiểm tra tab nào đang active và tải lại tab đó
                const pendingTab = document.querySelector('.admin-tab[data-tab="pending"]');
                if (pendingTab && pendingTab.classList.contains('active')) {
                    renderAdminDashboard();
                } else {
                    renderAllPostsForAdmin();
                }
            } else if (window.location.pathname.endsWith('profile.html')) {
                renderMyPosts(); 
            }
            
        } else {
            alert('Lỗi Xóa bài viết: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log.');
    }
}
window.deletePost = deletePost;


// --- LOGIC MỚI: Hiển thị TẤT CẢ Bài viết cho Admin (Bao gồm nút xóa Admin) ---

async function renderAllPostsForAdmin() {
    const container = document.getElementById('all-posts-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải TẤT CẢ bài viết...</p>';

    // SỬA LỖI: Bỏ authorFilter để Admin có thể thấy TẤT CẢ bài viết.
    const allPosts = await fetchPosts({ status: 'all' }); 

    if (allPosts.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-10">Không có bài viết nào trong hệ thống.</p>`;
        return;
    }

    const postsHtml = allPosts.map(post => {
        const statusClass = post.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            (post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700');
        const statusBorder = post.status === 'approved' ? 'border-green-500' : 
                             (post.status === 'pending' ? 'border-yellow-500' : 'border-red-500');
        const statusText = post.status === 'approved' ? 'Đã Duyệt' : (post.status === 'pending' ? 'Chờ Duyệt' : 'Bị Từ Chối');
        
        // Nút Xóa dành cho ADMIN (Admin có quyền xóa mọi bài)
        const adminDeleteButton = 
            // FIX: Sử dụng data-action và data-post-id
            `<button data-action="delete" data-post-id="${post.id}" class="text-sm px-3 py-1 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition">
                🗑️ Xóa Bài
            </button>`;

        return `
            <div class="admin-post-item bg-white p-4 rounded-xl shadow-md space-y-3 mb-4 border-l-4 ${statusBorder}" data-post-id="${post.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <a href="chitiet.html?id=${post.id}" class="text-lg font-bold text-gray-800 hover:text-red-600">${post.title}</a>
                        <p class="text-xs text-gray-500 mt-1">Tác giả: ${post.author_username} | Phân loại: ${post.category}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-semibold ${statusClass} px-2 py-0.5 rounded">${statusText}</span>
                    </div>
                </div>
                <div class="flex justify-end mt-3 border-t pt-2">
                    ${adminDeleteButton}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = postsHtml;
}
window.renderAllPostsForAdmin = renderAllPostsForAdmin;

// --- LOGIC HIỂN THỊ BÀI CHỜ DUYỆT (Đã có sẵn, chỉ sửa để dùng CSS mới) ---

async function renderAdminDashboard() {
    const container = document.getElementById('pending-posts-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải bài viết đang chờ duyệt...</p>';

    // SỬA LỖI: Bỏ authorFilter để Admin có thể thấy TẤT CẢ bài viết CHỜ DUYỆT
    const pendingPosts = await fetchPosts({ status: 'pending' });

    if (pendingPosts.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-10">Không có bài viết nào đang chờ duyệt. 🎉</p>`;
        return;
    }

    const postsHtml = pendingPosts.map(post => {
        return `
            <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500" data-post-id="${post.id}">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${post.title}</h3>
                <p class="text-sm text-gray-600 mb-3">Tác giả: ${post.author_username} | Phân loại: ${post.category}</p>
                <div class="prose max-w-none text-gray-700 leading-relaxed mb-4 border p-3 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>

                <div class="mb-4">
                    <label for="admin-note-${post.id}" class="block text-sm font-medium text-gray-700 mb-1">Phân Tích & Hướng Dẫn (Tùy chọn)</label>
                    <textarea id="admin-note-${post.id}" rows="3" class="w-full p-2 border rounded-lg focus:ring-teal-500"></textarea>
                </div>

                <div class="flex justify-end space-x-3">
                    <button data-action="reject" data-post-id="${post.id}" class="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
                        ❌ Từ Chối
                    </button>
                    <button data-action="approve" data-post-id="${post.id}" class="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition">
                        ✅ Phê Duyệt
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = postsHtml;
}
    window.handleApproval = handleApproval;
    window.renderAdminDashboard = renderAdminDashboard;

async function handleSubmitPost(event) {
    event.preventDefault();

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const category = document.getElementById('post-category').value;
    const author = localStorage.getItem('username');
    // THÊM: Lấy file đầu tiên từ input
    const postMedia = document.getElementById('post-media').files[0]; 

    if (!author) {
        alert('Bạn cần đăng nhập để đăng bài viết. Chuyển hướng đến trang Đăng nhập.');
        window.location.href = 'dangnhap.html';
        return;
    }

    if (title.length < 5 || content.length < 10 || category.length === 0) {
        alert('Vui lòng điền đủ Tiêu đề (tối thiểu 5 ký tự), Nội dung (tối thiểu 10 ký tự) và chọn Phân loại.');
        return;
    }

    // THAY THẾ: Chuyển từ JSON sang FormData để có thể gửi file
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('author', author);
    if (postMedia) {
        formData.append('post-media', postMedia); // Tên trường file phải khớp với PHP
    }

    try {
        const response = await fetch('db.php/submit_post.php', {
            method: 'POST',
            // BỎ DÒNG headers: {'Content-Type': 'application/json'}
            body: formData // Truyền trực tiếp đối tượng FormData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            // FIX: Chuyển hướng về trang profile sau khi đăng bài để kích hoạt renderMyPosts() cập nhật postCount
            window.location.href = 'profile.html'; 
        } else {
            alert('Lỗi Đăng bài: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log để xem lỗi.');
    }
}
window.handleSubmitPost = handleSubmitPost;


// Thêm hàm này vào script.js
async function handleApproval(postId, action, adminNote) {
    const adminUsername = localStorage.getItem('username'); // Lấy admin đang đăng nhập
    if (localStorage.getItem('role') !== 'admin') {
        alert('Chỉ admin mới có quyền thực hiện hành động này.');
        return;
    }
    
    if (!confirm(`Bạn có chắc muốn ${action === 'approve' ? 'Phê duyệt' : 'Từ chối'} bài viết ID: ${postId}?`)) {
        return;
    }

    const formData = {
        post_id: postId,
        action: action, // 'approve' hoặc 'reject'
        admin_note: adminNote,
        admin_username: adminUsername
    };
    
    try {
        const response = await fetch('db.php/approve_post.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            // Tải lại bảng điều khiển để cập nhật danh sách
            renderAdminDashboard(); 
        } else {
            alert('Lỗi: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log.');
    }
}
window.handleApproval = handleApproval; // Đảm bảo gọi được
// =========================================================
// CHỨC NĂNG D: XỬ LÝ ĐẶT LẠI MẬT KHẨU
// =========================================================

async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (!token) {
        alert('Liên kết đặt lại mật khẩu không hợp lệ.');
        return;
    }

    if (newPassword.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp.');
        return;
    }

    const formData = {
        token: token,
        new_password: newPassword
    };
    
    try {
        const response = await fetch('db.php/reset_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message + ' Chuyển hướng đến trang đăng nhập.');
            window.location.href = 'dangnhap.html'; 
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể đặt lại mật khẩu.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        alert('Lỗi kết nối server. Vui lòng thử lại sau.');
    }
}





// Thêm khối chức năng này vào file script.js (ví dụ: ở cuối file)

function initializeCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    // Đặt slide đầu tiên hiển thị
    slides[currentSlide].classList.add('opacity-100');
    slides[currentSlide].classList.remove('opacity-0');
    
    function nextSlide() {
        // Ẩn slide hiện tại
        slides[currentSlide].classList.add('opacity-0');
        slides[currentSlide].classList.remove('opacity-100');
        
        // Chuyển sang slide kế tiếp
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Hiển thị slide mới
        slides[currentSlide].classList.add('opacity-100');
        slides[currentSlide].classList.remove('opacity-0');
    }

    // Tự động chuyển slide mỗi 5 giây
    setInterval(nextSlide, 5000); 
}
window.initializeCarousel = initializeCarousel; // Cần thiết để hàm được gọi