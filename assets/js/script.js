// =========================================================
// script.js - SCRIPT VẬN HÀNH TOÀN TRANG (FRONTEND HOÀN CHỈNH)
// =========================================================

    //const PUBLIC_UPLOAD_PREFIX = 'db.php/'; 

// Helper function to safely check API response
function isValidPostsResponse(result) {
    return result && 
           result.success && 
           Array.isArray(result.posts) && 
           result.posts.length > 0;
}

// Helper function to safely process post object
function safeProcessPost(post) {
    if (!post || typeof post !== 'object') {
        return null;
    }
    
    return {
        id: post.id || 0,
        title: post.title || 'Không có tiêu đề',
        content: post.content || '',
        author_username: post.author_username || post.author || 'Ẩn danh',
        category: post.category || 'Khác',
        status: post.status || 'pending',
        created_at: post.created_at || new Date().toISOString(),
        image_url: post.image_url || '',
        views: post.views || 0,
        rating_total: post.rating_total || 0,
        rating_count: post.rating_count || 0
    };
} 

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHỞI TẠO CÁC PHẦN TỬ CHUNG - Thêm kiểm tra null
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
    // Xử lý form quên mật khẩu (email)
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm && document.getElementById('fp-email')) {
        // Chỉ xử lý email nếu có trường email (không phải SMS)
        console.log('✅ Attaching email forgot password handler');
        forgotPasswordForm.addEventListener('submit', handleForgotPasswordEmailSubmit);
    } else if (forgotPasswordForm) {
        console.log('ℹ️ Forgot password form found but no email field detected');
    }
    
    // Thêm lắng nghe cho form reset password
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
    }

    // 3. HIỂN THỊ BÀI ĐĂNG TRÊN CÁC TRANG (DÙNG API MỚI)
    const currentPath = window.location.pathname;
    
    // Kiểm tra trang chủ
    if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
        console.log('Loading posts for homepage');
        setTimeout(() => {
            console.log('Calling renderPostsToContainer for homepage');
            console.log('Post-list element exists:', !!document.getElementById('post-list'));
            renderPostsToContainer('post-list', { status: 'approved', limit: 6 });
            // Load sidebar content
            loadHomeStats();
            loadLatestPosts();
            loadNewsPreview();
        }, 100); // Delay nhỏ để đảm bảo DOM ready
    }
    if (window.location.pathname.endsWith('tintuc.html')) {
        console.log('Loading posts for news page');
        setTimeout(() => {
            loadNews(); // Sử dụng hàm phân trang thay vì renderPostsToContainer
        }, 100);
    }
    
    // Tải nội dung chi tiết bài viết
    if (window.location.pathname.endsWith('chitiet.html')) {
        console.log('Loading post detail');
        setTimeout(() => {
            try {
                renderPostDetail();
            } catch (error) {
                console.error('Error in renderPostDetail:', error);
                const container = document.getElementById('post-detail-container');
                if (container) {
                    container.innerHTML = `
                        <div class="p-8 text-center">
                            <h1 class="text-3xl font-bold text-red-500">Lỗi tải bài viết</h1>
                            <p class="mt-4 text-gray-600">Có lỗi xảy ra khi tải nội dung. Vui lòng thử lại.</p>
                            <div class="mt-6 space-x-4">
                                <button onclick="location.reload()" class="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">Tải lại</button>
                                <a href="tintuc.html" class="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">← Quay lại tin tức</a>
                            </div>
                        </div>
                    `;
                }
            }
        }, 100);
    }
    
    // RENDER BÀI VIẾT TRÊN TRANG PROFILE (LOGIC MỚI)
    if (window.location.pathname.endsWith('profile.html')) {
        console.log('Loading posts for profile page');
        setTimeout(() => {
            renderMyPostsPaginated(); // Sử dụng hàm phân trang
        }, 100);
    }
    
    // Tải trang kỹ thuật nuôi với phân trang
    if (window.location.pathname.endsWith('kythuat-nuoi.html')) {
        console.log('Loading technical posts');
        setTimeout(() => {
            loadKyThuatNuoi(); // Sử dụng hàm có sẵn thay vì loadTechnicalPosts
        }, 100);
    }
    
    
    // =========================================================================
    // FIX QUAN TRỌNG: GỌI HÀM KHỞI TẠO Ở CUỐI ĐỂ ĐẢM BẢO TẤT CẢ HÀM ĐƯỢC LOAD
    // =========================================================================
    if (mobileMenuToggle && mobileMenu) {
        initializeMobileMenu(mobileMenuToggle, mobileMenu);
    }
    if (userMenuBtn && userMenu) {
        initializeUserMenu(userMenuBtn, userMenu);
    }
    checkLoginStatus(); 
    initializeCarousel(); 
    
    // Đảm bảo profile được cập nhật đúng cách
    if (window.location.pathname.endsWith('profile.html')) {
        setTimeout(() => {
            console.log('Re-checking login status for profile page...');
            checkLoginStatus();
            
            // Kiểm tra xem có parameter openEdit không
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('openEdit') === 'true') {
                console.log('🔧 Auto-opening edit modal from URL parameter');
                // Xóa parameter khỏi URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
                // Mở modal sau một chút để đảm bảo DOM đã sẵn sàng
                setTimeout(() => {
                    openEditModal();
                }, 500);
            }
        }, 500);
    }
    
    // Đảm bảo tên user được cập nhật trên tất cả trang
    setTimeout(() => {
        console.log('Re-checking login status for all pages...');
        checkLoginStatus();
    }, 1000); 
    
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
// CHỨC NĂNG: TẠO AVATAR TỰ ĐỘNG
// =========================================================

function generateAvatar(username, size = 'w-16 h-16', textSize = 'text-xl') {
    const firstLetter = username.charAt(0).toUpperCase();
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'];
    const colorIndex = username.length % colors.length;
    const bgColor = colors[colorIndex];
    
    return `<div class="${size} rounded-full border-3 border-teal-500 shadow-lg ${bgColor} flex items-center justify-center text-white font-bold ${textSize}">${firstLetter}</div>`;
}

function updateAllAvatars(displayName) {
    // Cập nhật avatar trong header button (nếu có)
    const headerAvatar = document.querySelector('#user-menu-btn .bg-gradient-to-br');
    if (headerAvatar) {
        const avatarText = headerAvatar.querySelector('span');
        if (avatarText) {
            avatarText.textContent = displayName.charAt(0).toUpperCase();
        }
    }
    
    // Cập nhật tên trong header button
    const headerNameSpan = document.querySelector('#user-menu-btn div.flex.flex-col span.text-sm.font-bold');
    if (headerNameSpan) {
        headerNameSpan.textContent = displayName;
    }
    
    // Cập nhật avatar trong dropdown header
    const dropdownAvatar = document.querySelector('#user-menu .bg-gradient-to-br span');
    if (dropdownAvatar) {
        dropdownAvatar.textContent = displayName.charAt(0).toUpperCase();
    }
    
    // Cập nhật avatar trong profile
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
        profileAvatar.outerHTML = generateAvatar(displayName, 'w-32 h-32', 'text-4xl');
    }
    
    // Cập nhật avatar trong author card
    const authorAvatar = document.getElementById('author-avatar');
    if (authorAvatar) {
        authorAvatar.outerHTML = generateAvatar(displayName, 'w-16 h-16', 'text-xl');
    }
}

window.generateAvatar = generateAvatar;
window.updateAllAvatars = updateAllAvatars;
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
            
            // Toggle dropdown với animation mượt
            if (menu.classList.contains('hidden')) {
                // Show menu
                menu.classList.remove('hidden');
                // Force reflow để animation hoạt động
                menu.offsetHeight;
                menu.classList.remove('opacity-0', 'scale-95');
                menu.classList.add('opacity-100', 'scale-100');
            } else {
                // Hide menu
                menu.classList.remove('opacity-100', 'scale-100');
                menu.classList.add('opacity-0', 'scale-95');
                // Delay để animation hoàn thành trước khi ẩn
                setTimeout(() => {
                    menu.classList.add('hidden');
                }, 200);
            }
        });
        
        // Click outside để đóng menu
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                if (!menu.classList.contains('hidden')) {
                    menu.classList.remove('opacity-100', 'scale-100');
                    menu.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        menu.classList.add('hidden');
                    }, 200);
                }
            }
        });
        
        // ESC key để đóng menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
                menu.classList.remove('opacity-100', 'scale-100');
                menu.classList.add('opacity-0', 'scale-95');
                setTimeout(() => {
                    menu.classList.add('hidden');
                }, 200);
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

// Function để toggle mobile menu (cần cho các trang khác)
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}
window.toggleMobileMenu = toggleMobileMenu;

// Function để toggle user menu
function toggleUserMenu() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('hidden');
    }
}
window.toggleUserMenu = toggleUserMenu;

// Function logout
function logout() {
    fetch(apiUrl('db.php/logout.php'), {
        method: 'POST'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    });
}
window.logout = logout; 

// TRONG script.js, HÀM checkLoginStatus (ĐÃ SỬA - DÙNG SESSION)
async function checkLoginStatus() {
    console.log('checkLoginStatus called');
    const authButtons = document.getElementById('auth-buttons');
    const userProfileDiv = document.getElementById('user-profile');

    if (!authButtons || !userProfileDiv) {
        // This is normal on pages like login, register, forgot password, etc.
        console.log('Auth elements not found (normal for auth pages):', { 
            page: window.location.pathname,
            authButtons: !!authButtons, 
            userProfileDiv: !!userProfileDiv 
        });
        return;
    }

    try {
        console.log('Calling check_session API...');
        // Gọi API kiểm tra session
        const response = await fetch(apiUrl('db.php/check_session.php'));
        const result = await response.json();
        
        console.log('Check session API response:', result);
        
        if (!result.success) {
            // Nếu API lỗi, hiển thị nút đăng nhập
            authButtons.classList.remove('hidden');
            userProfileDiv.classList.add('hidden');
            return;
        }

        const isLoggedIn = result.isLoggedIn;
        const username = result.username || 'Người Dùng';
        const fullname = result.fullname || result.display_name || username;
        const userRole = result.role || 'user';
        const postCount = result.postCount || 0;
        
        console.log('Processed user data:', { isLoggedIn, username, fullname, userRole, postCount }); 
        
        // Cập nhật thông tin trên trang profile
        if (window.location.pathname.endsWith('profile.html')) {
            console.log('Updating profile page with user data:', { fullname, postCount, email: result.email });
            
            const profileUsernameElement = document.getElementById('profile-username');
            const profilePostCountElement = document.getElementById('profile-post-count');
            const profileEmailElement = document.getElementById('profile-email');
            const profileAvatarElement = document.getElementById('profile-avatar');

            // Hiển thị username (tên đăng nhập) trong profile
            if (profileUsernameElement) {
                console.log('Updating profile username to:', fullname);
                profileUsernameElement.textContent = fullname; // Hiển thị tên thật thay vì username
            }

            if (profilePostCountElement) {
                console.log('Updating profile post count to:', postCount);
                profilePostCountElement.textContent = postCount; 
            }

            if (profileEmailElement && result.email) {
                console.log('Updating profile email to:', result.email);
                profileEmailElement.textContent = result.email; 
            }
            
            // Hiển thị email chi tiết
            const profileEmailDetailElement = document.getElementById('profile-email-detail');
            if (profileEmailDetailElement && result.email) {
                profileEmailDetailElement.textContent = result.email;
            }

            // Hiển thị số điện thoại
            const profilePhoneElement = document.getElementById('profile-phone');
            if (profilePhoneElement) {
                profilePhoneElement.textContent = result.phone || 'Chưa cập nhật';
            }
        }

        if (isLoggedIn) {
            authButtons.classList.add('hidden');
            userProfileDiv.classList.remove('hidden');
            
            // Cập nhật tên user trong header và dropdown
            const userButton = userProfileDiv.querySelector('#user-menu-btn');
            if (userButton) {
                // Tìm span chứa text "Đang tải..." - đây là span thứ 2 trong cấu trúc
                const nameSpan = userButton.querySelector('div.flex.flex-col span.text-sm.font-bold');
                if (nameSpan) {
                    nameSpan.textContent = fullname;
                    console.log('Updated display name to:', fullname);
                }
            }
            
            // Cập nhật thông tin trong dropdown menu
            const dropdownUsername = document.getElementById('dropdown-username');
            const dropdownEmail = document.getElementById('dropdown-email');
            const dropdownPostCount = document.getElementById('dropdown-post-count');
            
            if (dropdownUsername) {
                dropdownUsername.textContent = fullname; // Hiển thị tên thật
            }
            if (dropdownEmail && result.email) {
                dropdownEmail.textContent = result.email;
            }
            if (dropdownPostCount) {
                dropdownPostCount.textContent = `📝 ${postCount} bài`;
            }
            
            // Cập nhật tất cả avatar (sử dụng fullname để tạo avatar)
            updateAllAvatars(fullname);
            
            // Cập nhật role display trong dropdown
            updateUserRoleDisplay(userRole);
            
            // Thêm notification badge nếu cần (ví dụ: số bài chờ duyệt cho admin)
            if (userRole === 'admin') {
                // Có thể thêm logic để đếm bài chờ duyệt và hiển thị badge
                // addNotificationBadge(pendingPostsCount);
            }
            
            // Enhance dropdown menu
            setTimeout(() => {
                enhanceDropdownMenu();
            }, 100);
            
            // Cập nhật số bài viết trên menu
            const profileLink = userProfileDiv.querySelector('a[href="profile.html"]');
            if(profileLink) {
                profileLink.textContent = `👤 Profile (${postCount} bài)`;
            }

            // THÊM NÚT ADMIN CHO ADMIN trong dropdown menu mới
            const userMenu = document.getElementById('user-menu');
            if (userRole === 'admin' && userMenu) {
                // Tìm vị trí để chèn admin link (sau profile link)
                const profileSection = userMenu.querySelector('a[href="profile.html"]').parentElement;
                if (profileSection && !userMenu.querySelector('a[href="admin.html"]')) {
                    const adminLinkContainer = document.createElement('div');
                    adminLinkContainer.className = 'px-2 mt-1';
                    adminLinkContainer.innerHTML = `
                        <a href="admin.html" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 rounded-lg transition-all duration-200 group">
                            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <div class="font-medium">🛠️ Quản Trị Viên</div>
                                <div class="text-xs text-gray-500">Duyệt bài viết, quản lý</div>
                            </div>
                            <svg class="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </a>
                    `;
                    profileSection.parentNode.insertBefore(adminLinkContainer, profileSection.nextSibling);
                }
            }
           
        } else {
            authButtons.classList.remove('hidden');
            userProfileDiv.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Lỗi kiểm tra session:', error);
        // Nếu lỗi, hiển thị nút đăng nhập
        authButtons.classList.remove('hidden');
        userProfileDiv.classList.add('hidden');
    }
}
    
    
// =========================================================
// CHỨC NĂNG B: XỬ LÝ FORM AUTH
// =========================================================

async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    // Lấy dữ liệu từ form
    const username = document.getElementById('reg-username').value.trim();
    const fullname = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const location = document.getElementById('reg-location').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const agreeTerms = document.getElementById('agree-terms').checked;

    // Kiểm tra các trường bắt buộc
    if (!username || !fullname || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
        return;
    }

    // Kiểm tra tên tài khoản
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        alert('Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới.');
        return;
    }

    // Kiểm tra email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Địa chỉ email không hợp lệ.');
        return;
    }

    // Kiểm tra mật khẩu
    if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp.');
        return;
    }

    // Kiểm tra đồng ý điều khoản
    if (!agreeTerms) {
        alert('Bạn cần đồng ý với điều khoản sử dụng để tiếp tục.');
        return;
    }
    
    const formData = {
        username: username,
        fullname: fullname,
        email: email,
        phone: phone,
        location: location,
        password: password
    };
    
    // Disable submit button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang tạo tài khoản...';
    
    try {
        const response = await fetch(apiUrl('db.php/register.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert(result.message + '\n\nBạn sẽ được chuyển đến trang đăng nhập.');
            window.location.href = 'dangnhap.html'; 
        } else {
            alert('Lỗi đăng ký: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng thử lại sau.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
        const response = await fetch(apiUrl('db.php/login.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Đăng nhập thành công - Session được tạo ở server
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

async function logout() {
    try {
        const response = await fetch(apiUrl('db.php/logout.php'), {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            alert('➡️ Bạn đã đăng xuất.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        alert('Có lỗi xảy ra khi đăng xuất.');
    }
}
window.logout = logout; 


// Hàm handleForgotPasswordSubmit cũ đã được thay thế bằng handleSendOTP (SMS) ở cuối file


    // =========================================================
    // CHỨC NĂNG C: XỬ LÝ BÀI ĐĂNG VÀ HIỂN THỊ
    // =========================================================
async function fetchPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    
    // Đảm bảo apiUrl function tồn tại
    const baseUrl = (typeof window.apiUrl === 'function') ? 
        apiUrl('db.php/get_posts.php') : 
        '/Project/db.php/get_posts.php';
    
    const url = query ? `${baseUrl}?${query}` : baseUrl;
    console.log('Fetching posts from:', url);
    
    try {
        // Sử dụng safeFetch nếu có, nếu không thì dùng fetch thường
        let result;
        if (typeof window.safeFetch === 'function') {
            result = await window.safeFetch(url);
        } else {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            result = await response.json();
        }
        
        console.log('API response:', result);
        
        if (result.success) {
            // API trả về 'data' thay vì 'posts'
            const posts = result.data || result.posts || [];
            console.log(`Successfully fetched ${posts.length} posts`);
            return posts;
        } else {
            console.error('API returned error:', result.message);
            // Nếu là lỗi 403 hoặc 404, vẫn trả về array rỗng để function khác xử lý
            return [];
        }
    } catch (error) {
        console.error('Error in fetchPosts:', error);
        return [];
    }
}

function createPostCard(post) {
    // Sử dụng helper function để xử lý post an toàn
    const safePost = safeProcessPost(post);
    if (!safePost) {
        console.warn('Invalid post object:', post);
        return '';
    }
    
    // Tạo tóm tắt tạm thời
    const summary = safePost.content.substring(0, 150) + '...'; 

    // Xử lý ảnh - ảnh được lưu trong thư mục uploads/
    let imageUrl;
    if (safePost.image_url && safePost.image_url.trim() !== '') {
        // Có ảnh upload - lấy từ thư mục uploads/
        imageUrl = 'uploads/' + safePost.image_url;
    } else {
        // Không có ảnh - dùng ảnh mặc định dựa trên ID của post (1-5)
        const imageNum = ((safePost.id - 1) % 5) + 1;
        imageUrl = 'img/' + imageNum + '.jpg';
    }

    // Định dạng lại ngày tháng
    const postDate = new Date(safePost.created_at).toLocaleDateString('vi-VN');
    
    // Logic nút xóa (chỉ hiển thị trên trang profile)
    const currentUser = localStorage.getItem('username');
    // FIX: Đảm bảo nút xóa chỉ hiện cho bài chưa duyệt trên trang profile
    const deleteButtonHtml = (window.location.pathname.endsWith('profile.html') && safePost.status !== 'approved' && currentUser === safePost.author_username) ? 
        `<button data-action="delete" data-post-id="${safePost.id}" class="text-xs text-red-500 hover:text-red-700 transition font-medium ml-3">🗑️ Xóa</button>` : 
        '';
        
    // Hiển thị trạng thái duyệt trên Card
    const statusText = safePost.status === 'pending' ? 'Chờ Duyệt' : (safePost.status === 'rejected' ? 'Bị Từ Chối' : 'Đã Duyệt');
    const statusClass = safePost.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : (safePost.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-600');
    // Nếu không phải trang profile, chỉ hiển thị bài đã duyệt, nên ẩn trạng thái
    const statusBadge = (window.location.pathname.endsWith('profile.html')) ? 
        `<span class="text-xs font-semibold ${statusClass} px-2 py-0.5 rounded">${safePost.category} - ${statusText}</span>` : 
        `<span class="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">${safePost.category}</span>`;


    return `
        <article class="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden">
            <img src="${imageUrl}" alt="${safePost.title}" class="w-full h-48 object-cover">
            <div class="p-5">
                ${statusBadge}
                <h3 class="text-xl font-semibold text-gray-800 my-2 hover:text-teal-600">
                    <a href="chitiet.html?id=${safePost.id}">${safePost.title}</a>
                </h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${summary}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                    <span class="flex items-center">
                        Ngày đăng: ${postDate}
                        ${deleteButtonHtml} 
                    </span>
                    <span class="font-medium text-teal-600">👤 Tác giả: ${safePost.author_username}</span>
                </div>
            </div>
        </article>
    `;
}

async function renderPostsToContainer(targetElementId, params = {}) {
    const container = document.getElementById(targetElementId);
    if (!container) {
        console.warn(`Container with id '${targetElementId}' not found`);
        return;
    }

    console.log(`Starting to load posts for container '${targetElementId}' with params:`, params);
    window.showLoading(targetElementId, 'Đang tải bài viết...');

    const posts = await fetchPosts(params);
    console.log(`Loaded ${posts.length} posts for container '${targetElementId}'`);
    
    if (posts.length === 0) {
         container.innerHTML = `<p class="text-center text-gray-500 py-10">Chưa có bài đăng nào từ cộng đồng.</p>`;
         return;
    }
    
    const postsHtml = posts.map(createPostCard).join('');
    container.innerHTML = postsHtml; 
    console.log(`Successfully rendered ${posts.length} posts to container '${targetElementId}'`);
}


// LOGIC MỚI: RENDER BÀI VIẾT CỦA USER TRÊN TRANG PROFILE
// Cập nhật renderPostDetail để dùng API và hiển thị Admin Note với layout mới
async function renderPostDetail() {
    console.log('🔍 renderPostDetail called');
    const container = document.getElementById('post-detail-container');
    const contentLoading = document.getElementById('content-loading');
    const authorCard = document.getElementById('author-card');
    
    console.log('📦 Elements found:', { 
        container: !!container, 
        contentLoading: !!contentLoading, 
        authorCard: !!authorCard 
    });
    
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    console.log('🆔 Post ID from URL:', postId);

    if (!postId) {
        console.error('❌ No post ID found in URL');
        if(container) {
            container.innerHTML = '<div class="p-8 text-center"><h1 class="text-3xl font-bold text-red-500">Lỗi: Không tìm thấy ID bài viết!</h1><a href="tintuc.html" class="mt-4 inline-block bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">← Quay lại tin tức</a></div>';
        }
        return;
    }
    
    // Fetch bài viết chi tiết (session được kiểm tra ở server)
    console.log('🌐 Fetching post with ID:', postId);
    let posts = await fetchPosts({ id: postId });
    console.log('📄 Fetch result:', posts);
    let post = posts[0];
    
    // Nếu không lấy được bài viết, thử lấy từ danh sách công khai
    if (!post) {
        console.log('⚠️ Post not found with ID, trying public posts...');
        const publicPosts = await fetchPosts({ status: 'approved' });
        post = publicPosts.find(p => p.id == postId);
        
        if (!post) {
            console.error('❌ No post found for ID:', postId);
            if(container) {
                container.innerHTML = `
                    <div class="p-8 text-center">
                        <h1 class="text-3xl font-bold text-red-500">Bài viết không tồn tại</h1>
                        <p class="mt-4 text-gray-600">Bài viết có thể chưa được phê duyệt, đã bị xóa, hoặc bạn không có quyền xem.</p>
                        <div class="mt-6 space-x-4">
                            <a href="tintuc.html" class="inline-block bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">← Quay lại tin tức</a>
                            <a href="index.html" class="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">Trang chủ</a>
                        </div>
                    </div>
                `;
            }
            return;
        }
    }
    
    console.log('✅ Post found:', post.title);
    
    // Xử lý ảnh - ảnh được lưu trong thư mục uploads/
    let imageUrl;
    if (post.image_url && post.image_url.trim() !== '') {
        // Có ảnh upload - lấy từ thư mục uploads/
        imageUrl = 'uploads/' + post.image_url;
    } else {
        // Không có ảnh - dùng ảnh mặc định dựa trên ID
        const imageNum = ((post.id - 1) % 5) + 1;
        imageUrl = 'img/' + imageNum + '.jpg';
    }
    
    console.log('🖼️ Image URL:', imageUrl);
    
    // Cập nhật title trang
    document.title = post.title + ' | Thủy Sản Trà Vinh';
    const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
    
    // Ẩn loading và hiển thị nội dung
    if (contentLoading) {
        contentLoading.classList.add('hidden');
        console.log('🔄 Loading hidden');
    }
    
    // Xử lý Admin Note (Phân tích/Hướng dẫn)
    let adminNoteHtml = '';
    if (post.status === 'approved' && post.admin_note) {
        adminNoteHtml = `
            <div class="bg-teal-50 border-l-4 border-teal-600 rounded-lg p-6 mb-8">
                <div class="flex items-start space-x-3">
                    <div class="bg-teal-600 text-white rounded-full p-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-teal-700 mb-3">💡 Phân Tích & Hướng Dẫn từ Chuyên Gia</h3>
                        <div class="prose max-w-none text-gray-700 leading-relaxed">
                            <p>${post.admin_note.replace(/\n/g, '</p><p>')}</p>
                        </div>
                        <div class="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Được phê duyệt bởi: ${post.approved_by_admin}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Thẻ trạng thái (cho tác giả/admin xem)
    let statusBadge = '';
    if (post.status !== 'approved') {
        const statusClass = post.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500';
        const statusText = post.status === 'pending' ? 'Đang Chờ Duyệt' : 'Đã Bị Từ Chối';
        statusBadge = `<div class="mb-4"><span class="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${statusClass}">${statusText}</span></div>`;
    }

    // Tạo nội dung chính
    const contentHtml = `
        <!-- Article Content -->
        <div class="p-8">
            ${statusBadge}
            
            <!-- Article Header -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">${post.category}</span>
                    <span class="text-sm text-gray-500">${postDate}</span>
                </div>
                <h1 class="text-4xl font-bold text-gray-900 mb-4">${post.title}</h1>
            </div>

            <!-- Featured Image -->
            <div class="mb-6">
                <img src="${imageUrl}" alt="${post.title}" class="w-full h-64 object-cover rounded-lg shadow-md">
            </div>

            <!-- Article Meta -->
            <div class="flex flex-wrap items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>Tác giả: ${post.author_username}</span>
                    </span>
                    <span class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span>${post.views || 0} lượt xem</span>
                    </span>
                    <span class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>${Math.ceil(post.content.length / 200)} phút đọc</span>
                    </span>
                </div>
                
                <div class="flex items-center space-x-2">
                    <div id="rating-container">
                        <!-- Rating will be loaded here -->
                    </div>
                    <span id="rating-display" class="text-sm text-gray-500">${post.rating_count > 0 ? (post.rating_total / post.rating_count).toFixed(1) : '0'}/5 (${post.rating_count || 0} đánh giá)</span>
                </div>
            </div>

            <!-- Main Content -->
            <div class="prose prose-lg max-w-none">
                <div class="text-gray-700 leading-relaxed text-lg">
                    ${post.content.split('\n').map(paragraph => 
                        paragraph.trim() ? `<p class="mb-6">${paragraph}</p>` : ''
                    ).join('')}
                </div>
            </div>
            
            ${adminNoteHtml}

            <!-- Tags -->
            <div class="mt-8 pt-6 border-t border-gray-200">
                <div class="flex flex-wrap items-center space-x-2">
                    <span class="text-sm font-medium text-gray-500">Từ khóa:</span>
                    <span class="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">${post.category}</span>
                    <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Thủy sản</span>
                    <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Trà Vinh</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-8 pt-6 border-t border-gray-200 flex justify-center space-x-4">
                <button onclick="shareArticle()" class="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                    </svg>
                    <span>Chia sẻ</span>
                </button>
                <button onclick="bookmarkArticle()" class="flex items-center space-x-2 text-gray-500 hover:text-yellow-600 transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                    </svg>
                    <span>Lưu bài</span>
                </button>
            </div>
        </div>
    `;
    
    console.log('🎨 Setting container HTML');
    container.innerHTML = contentHtml;
    
    // Cập nhật thông tin tác giả
    if (authorCard) {
        authorCard.classList.remove('hidden');
        const authorName = authorCard.querySelector('#author-name');
        const authorAvatar = authorCard.querySelector('#author-avatar');
        
        if (authorName) {
            authorName.textContent = post.author_username;
        }
        
        // Tạo avatar tự động từ tên
        if (authorAvatar) {
            authorAvatar.outerHTML = generateAvatar(post.author_username, 'w-16 h-16', 'text-xl');
        }
        console.log('👤 Author card updated');
    }
    
    // Load related articles
    console.log('🔗 Loading related articles');
    loadRelatedArticles(post.category, post.id);
    
    // Load and display rating UI
    console.log('⭐ Loading rating UI');
    loadRatingUI(post.id);
    
    console.log('✅ renderPostDetail completed successfully');
}
window.renderPostDetail = renderPostDetail;

// Load và hiển thị UI đánh giá
// Load và hiển thị UI đánh giá
async function loadRatingUI(postId) {
    console.log('⭐ loadRatingUI called for postId:', postId);
    
    const ratingContainer = document.getElementById('rating-container');
    if (!ratingContainer) {
        console.warn('❌ Rating container not found');
        return;
    }
    
    try {
        // Kiểm tra trạng thái đăng nhập trước
        const sessionResponse = await fetch(apiUrl('db.php/check_session.php'), {
            credentials: 'include'
        });
        const sessionResult = await sessionResponse.json();
        
        console.log('🔐 Session check result:', sessionResult);
        
        if (!sessionResult.success || !sessionResult.isLoggedIn) {
            console.log('ℹ️ User not logged in, showing login prompt');
            ratingContainer.innerHTML = `
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">
                        <a href="dangnhap.html" class="text-teal-600 hover:text-teal-700 underline">Đăng nhập</a> 
                        để đánh giá bài viết
                    </span>
                </div>
            `;
            return;
        }
        
        // Lấy đánh giá hiện tại của user
        const userRating = await getUserRating(postId);
        console.log('Current user rating:', userRating);
        
        // Tạo UI đánh giá
        if (userRating > 0) {
            // User đã đánh giá - hiển thị đánh giá hiện tại
            ratingContainer.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="flex items-center space-x-1">
                        ${Array.from({length: 5}, (_, i) => {
                            const filled = i < userRating;
                            return `
                                <svg class="w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                            `;
                        }).join('')}
                    </div>
                    <span class="text-sm text-green-600 font-medium">Bạn đã đánh giá ${userRating} sao</span>
                    <button onclick="showRatingModal()" class="text-xs text-blue-600 hover:text-blue-700 underline">Thay đổi</button>
                </div>
            `;
        } else {
            // User chưa đánh giá - hiển thị nút đánh giá
            ratingContainer.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="flex items-center space-x-1">
                        ${Array.from({length: 5}, (_, i) => {
                            const starRating = i + 1;
                            return `
                                <button onclick="rateArticle(${starRating})" class="rating-star text-gray-300 hover:text-yellow-400 transition-colors duration-200" title="Đánh giá ${starRating} sao">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                    </svg>
                                </button>
                            `;
                        }).join('')}
                    </div>
                    <span class="text-sm text-gray-500">Đánh giá bài viết</span>
                </div>
            `;
            
            // Thêm hover effect cho stars
            const stars = ratingContainer.querySelectorAll('.rating-star');
            stars.forEach((star, index) => {
                star.addEventListener('mouseenter', () => {
                    // Highlight stars up to current one
                    stars.forEach((s, i) => {
                        if (i <= index) {
                            s.classList.remove('text-gray-300');
                            s.classList.add('text-yellow-400');
                        } else {
                            s.classList.remove('text-yellow-400');
                            s.classList.add('text-gray-300');
                        }
                    });
                });
                
                star.addEventListener('mouseleave', () => {
                    // Reset all stars to default
                    stars.forEach(s => {
                        s.classList.remove('text-yellow-400');
                        s.classList.add('text-gray-300');
                    });
                });
            });
        }
    } catch (error) {
        console.error('❌ Error loading rating UI:', error);
        // Fallback UI
        ratingContainer.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-sm text-red-500">Lỗi tải đánh giá</span>
                <button onclick="loadRatingUI(${postId})" class="text-xs text-blue-600 hover:text-blue-700 underline">Thử lại</button>
            </div>
        `;
    }
}

// Hiển thị modal đánh giá (cho user đã đánh giá muốn thay đổi)
function showRatingModal() {
    const postId = new URLSearchParams(window.location.search).get('id');
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div class="text-center">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Thay đổi đánh giá</h3>
                <p class="text-gray-600 mb-6">Chọn số sao bạn muốn đánh giá cho bài viết này:</p>
                
                <div class="flex justify-center space-x-2 mb-6">
                    ${Array.from({length: 5}, (_, i) => {
                        const starRating = i + 1;
                        return `
                            <button onclick="rateArticle(${starRating}); document.body.removeChild(this.closest('.fixed'))" class="text-gray-300 hover:text-yellow-400 transition-colors duration-200" title="Đánh giá ${starRating} sao">
                                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                            </button>
                        `;
                    }).join('')}
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="document.body.removeChild(this.closest('.fixed'))" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add hover effects to modal stars
    const modalStars = modal.querySelectorAll('button svg');
    modalStars.forEach((star, index) => {
        const button = star.parentElement;
        button.addEventListener('mouseenter', () => {
            modalStars.forEach((s, i) => {
                const btn = s.parentElement;
                if (i <= index) {
                    btn.classList.remove('text-gray-300');
                    btn.classList.add('text-yellow-400');
                } else {
                    btn.classList.remove('text-yellow-400');
                    btn.classList.add('text-gray-300');
                }
            });
        });
        
        button.addEventListener('mouseleave', () => {
            modalStars.forEach(s => {
                const btn = s.parentElement;
                btn.classList.remove('text-yellow-400');
                btn.classList.add('text-gray-300');
            });
        });
    });
}


// Hàm xóa bài viết (Sử dụng lại logic từ trang Profile)
async function deletePost(postId) {
    if (!confirm('Bạn có chắc chắn muốn XÓA bài viết này không? Hành động này không thể hoàn tác.')) {
        return;
    }

    const formData = {
        post_id: postId
    };
    
    try {
        const response = await fetch(apiUrl('db.php/delete_post.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            
            // Tải lại tab Admin đang xem
            if (window.location.pathname.endsWith('admin.html')) {
                const pendingTab = document.querySelector('.admin-tab[data-tab="pending"]');
                if (pendingTab && pendingTab.classList.contains('active')) {
                    renderAdminDashboard();
                } else {
                    renderAllPostsForAdmin();
                }
            } else if (window.location.pathname.endsWith('profile.html')) {
                renderMyPosts(); 
            }
            
        } else if (response.status === 401) {
            alert('Bạn cần đăng nhập để thực hiện hành động này.');
            window.location.href = 'dangnhap.html';
        } else if (response.status === 403) {
            alert('Bạn không có quyền xóa bài viết này.');
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
    
    try {
        container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải TẤT CẢ bài viết...</p>';

        // SỬA LỖI: Bỏ authorFilter để Admin có thể thấy TẤT CẢ bài viết.
        const allPosts = await fetchPosts({ status: 'all' }); 

        if (!Array.isArray(allPosts) || allPosts.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-10">Không có bài viết nào trong hệ thống.</p>`;
            return;
        }

        const postsHtml = allPosts.map(post => {
            if (!post) return '';
            
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
                            <a href="chitiet.html?id=${post.id}" class="text-lg font-bold text-gray-800 hover:text-red-600">${post.title || 'Không có tiêu đề'}</a>
                            <p class="text-xs text-gray-500 mt-1">Tác giả: ${post.author_username || 'N/A'} | Phân loại: ${post.category || 'N/A'}</p>
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
        
    } catch (error) {
        console.error('Error in renderAllPostsForAdmin:', error);
        container.innerHTML = `<p class="text-center text-red-500 py-10">Lỗi tải bài viết: ${error.message}</p>`;
    }
}
window.renderAllPostsForAdmin = renderAllPostsForAdmin;

// --- LOGIC HIỂN THỊ BÀI CHỜ DUYỆT (Đã có sẵn, chỉ sửa để dùng CSS mới) ---

async function renderAdminDashboard() {
    const container = document.getElementById('pending-posts-list');
    if (!container) return;
    
    try {
        container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải bài viết đang chờ duyệt...</p>';

        // SỬA LỖI: Bỏ authorFilter để Admin có thể thấy TẤT CẢ bài viết CHỜ DUYỆT
        const pendingPosts = await fetchPosts({ status: 'pending' });

        if (!Array.isArray(pendingPosts) || pendingPosts.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-10">Không có bài viết nào đang chờ duyệt. 🎉</p>`;
            return;
        }

        const postsHtml = pendingPosts.map(post => {
            if (!post) return '';
            
            return `
                <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500" data-post-id="${post.id}">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${post.title || 'Không có tiêu đề'}</h3>
                    <p class="text-sm text-gray-600 mb-3">Tác giả: ${post.author_username || 'N/A'} | Phân loại: ${post.category || 'N/A'}</p>
                    <div class="prose max-w-none text-gray-700 leading-relaxed mb-4 border p-3 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                        ${(post.content || '').replace(/\n/g, '<br>')}
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
        
    } catch (error) {
        console.error('Error in renderAdminDashboard:', error);
        container.innerHTML = `<p class="text-center text-red-500 py-10">Lỗi tải bài viết: ${error.message}</p>`;
    }
}
    window.handleApproval = handleApproval;
    window.renderAdminDashboard = renderAdminDashboard;

async function handleSubmitPost(event) {
    event.preventDefault();

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const category = document.getElementById('post-category').value;
    const postMedia = document.getElementById('post-media').files[0];

    if (title.length < 5 || content.length < 10 || category.length === 0) {
        alert('Vui lòng điền đủ Tiêu đề (tối thiểu 5 ký tự), Nội dung (tối thiểu 10 ký tự) và chọn Phân loại.');
        return;
    }

    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    if (postMedia) {
        formData.append('post-media', postMedia);
    }

    try {
        const response = await fetch(apiUrl('db.php/submit_post.php'), {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            window.location.href = 'profile.html'; 
        } else if (response.status === 401) {
            alert('Bạn cần đăng nhập để đăng bài viết.');
            window.location.href = 'dangnhap.html';
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
    if (!confirm(`Bạn có chắc muốn ${action === 'approve' ? 'Phê duyệt' : 'Từ chối'} bài viết ID: ${postId}?`)) {
        return;
    }

    const formData = {
        post_id: postId,
        action: action,
        admin_note: adminNote
    };
    
    try {
        const response = await fetch(apiUrl('db.php/approve_post.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            renderAdminDashboard(); 
        } else if (response.status === 403) {
            alert('Bạn không có quyền thực hiện hành động này.');
            window.location.href = 'index.html';
        } else {
            alert('Lỗi: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log.');
    }
}
window.handleApproval = handleApproval;
// =========================================================
// CHỨC NĂNG D: XỬ LÝ QUÊN MẬT KHẨU (EMAIL)
// =========================================================

async function handleForgotPasswordEmailSubmit(event) {
    event.preventDefault();
    
    console.log('🔄 Forgot password form submitted');
    
    const email = document.getElementById('fp-email').value.trim();
    const messageDiv = document.getElementById('forgot-message');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    console.log('📧 Email entered:', email);
    
    if (!email) {
        showForgotMessage(messageDiv, 'Vui lòng nhập địa chỉ email.', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showForgotMessage(messageDiv, 'Địa chỉ email không hợp lệ.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang gửi...';
    
    try {
        console.log('🌐 Sending request to:', apiUrl('db.php/forgot_password.php'));
        
        // Sử dụng fetch thông thường thay vì safeFetch để debug
        const response = await fetch(apiUrl('db.php/forgot_password.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📋 Response data:', result);
        
        if (result.success) {
            if (result.reset_link) {
                // Hiển thị link reset trực tiếp
                const linkMessage = `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center mb-3">
                            <span class="text-green-600 text-lg">✅</span>
                            <span class="ml-2 font-semibold text-green-800">Link đặt lại mật khẩu đã được tạo!</span>
                        </div>
                        
                        <div class="mb-3">
                            <p class="text-sm text-gray-700 mb-2">👤 <strong>Tài khoản:</strong> ${result.username}</p>
                            <p class="text-sm text-gray-700 mb-2">⏰ <strong>Hết hạn:</strong> ${result.expires_at}</p>
                            <p class="text-sm text-gray-700 mb-3">📧 <strong>Email gửi:</strong> ${result.email_sent ? 'Thành công' : 'Thất bại (dùng link bên dưới)'}</p>
                        </div>
                        
                        <div class="bg-white border border-green-300 rounded p-3 mb-3">
                            <p class="text-sm font-medium text-gray-700 mb-2">🔗 Link đặt lại mật khẩu:</p>
                            <a href="${result.reset_link}" 
                               class="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                               target="_blank">
                               ${result.reset_link}
                            </a>
                        </div>
                        
                        <div class="flex space-x-2">
                            <a href="${result.reset_link}" 
                               class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-medium"
                               target="_blank">
                               🔧 Đặt Lại Mật Khẩu Ngay
                            </a>
                            <button onclick="copyResetLink('${result.reset_link}')" 
                                    class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition text-sm font-medium">
                                📋 Copy Link
                            </button>
                        </div>
                    </div>
                `;
                showForgotMessage(messageDiv, linkMessage, 'success', true);
            } else {
                showForgotMessage(messageDiv, '✅ ' + result.message, 'success');
            }
            
            // Disable form after successful submission
            document.getElementById('fp-email').disabled = true;
        } else {
            showForgotMessage(messageDiv, '❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Lỗi gửi email quên mật khẩu:', error);
        showForgotMessage(messageDiv, '❌ Lỗi kết nối server. Vui lòng thử lại sau.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Gửi Hướng Dẫn';
    }
}

function showForgotMessage(messageDiv, message, type, isHTML = false) {
    if (!messageDiv) return;
    
    messageDiv.className = `mt-4 p-3 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`;
    
    if (isHTML) {
        messageDiv.innerHTML = message;
    } else {
        messageDiv.textContent = message;
    }
    
    messageDiv.classList.remove('hidden');
    
    // Auto hide after 30 seconds for success messages (longer for links)
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 30000);
    }
}

// Hàm copy link reset password
function copyResetLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        alert('✅ Đã copy link reset password!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('✅ Đã copy link reset password!');
    });
}

// =========================================================
// CHỨC NĂNG E: XỬ LÝ ĐẶT LẠI MẬT KHẨU
// =========================================================

async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const messageDiv = document.getElementById('reset-message');
    
    if (!token) {
        showResetMessage('Liên kết đặt lại mật khẩu không hợp lệ.', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showResetMessage('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showResetMessage('Mật khẩu xác nhận không khớp.', 'error');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang xử lý...';

    const formData = {
        token: token,
        new_password: newPassword
    };
    
    try {
        // safeFetch already returns parsed JSON, no need to call .json() again
        const result = await safeFetch(apiUrl('db.php/reset_password.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (result.success) {
            showResetMessage('✅ ' + result.message, 'success');
            
            // Disable form after success
            document.getElementById('new-password').disabled = true;
            document.getElementById('confirm-new-password').disabled = true;
            submitBtn.style.display = 'none';
            
            // Redirect after 3 seconds
            setTimeout(() => {
                window.location.href = 'dangnhap.html';
            }, 3000);
        } else {
            showResetMessage('❌ ' + (result.message || 'Không thể đặt lại mật khẩu.'), 'error');
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        showResetMessage('❌ Lỗi kết nối server. Vui lòng thử lại sau.', 'error');
    } finally {
        if (!submitBtn.style.display) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Đặt Lại Mật Khẩu';
        }
    }
}

function showResetMessage(message, type) {
    let messageDiv = document.getElementById('reset-message');
    if (!messageDiv) {
        // Create message div if it doesn't exist
        messageDiv = document.createElement('div');
        messageDiv.id = 'reset-message';
        const form = document.getElementById('reset-password-form');
        form.insertBefore(messageDiv, form.firstChild);
    }
    
    messageDiv.className = `mb-4 p-3 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
}

// Validate token on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('reset_password.html')) {
        validateResetToken();
    }
});

async function validateResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const loadingDiv = document.getElementById('loading-message');
    const errorDiv = document.getElementById('token-error');
    const passwordFields = document.getElementById('password-fields');
    
    if (!token) {
        if (loadingDiv) loadingDiv.classList.add('hidden');
        if (errorDiv) {
            errorDiv.textContent = 'Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.';
            errorDiv.classList.remove('hidden');
        }
        if (passwordFields) passwordFields.style.display = 'none';
        return;
    }
    
    if (loadingDiv) {
        loadingDiv.textContent = 'Đang xác minh liên kết...';
        loadingDiv.classList.remove('hidden');
    }
    
    try {
        // Validate token by making a request to reset_password.php with empty password
        // safeFetch already returns parsed JSON, no need to call .json() again
        const result = await safeFetch(apiUrl('db.php/reset_password.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, new_password: '' })
        });
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        
        if (!result.success) {
            // Token invalid or expired
            if (errorDiv) {
                errorDiv.textContent = 'Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.';
                errorDiv.classList.remove('hidden');
            }
            if (passwordFields) passwordFields.style.display = 'none';
        } else {
            // Token valid, show password fields
            if (errorDiv) errorDiv.classList.add('hidden');
            if (passwordFields) passwordFields.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Lỗi xác minh token:', error);
        if (loadingDiv) loadingDiv.classList.add('hidden');
        if (errorDiv) {
            errorDiv.textContent = 'Lỗi kết nối server. Vui lòng thử lại sau.';
            errorDiv.classList.remove('hidden');
        }
        if (passwordFields) passwordFields.style.display = 'none';
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
window.initializeCarousel = initializeCarousel;

// Load thống kê cho sidebar
// Load thống kê cho sidebar
async function loadHomeStats() {
    try {
        // Load thống kê từ API mới
        const statsResponse = await fetch(apiUrl('db.php/get_user_stats.php'));
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
            const stats = statsResult.stats;
            
            // Cập nhật tổng số bài viết
            const totalPostsElement = document.getElementById('total-posts');
            if (totalPostsElement) {
                totalPostsElement.textContent = stats.total_posts;
            }
            
            // Cập nhật tổng số thành viên (dùng số liệu thật)
            const totalUsersElement = document.getElementById('total-users');
            if (totalUsersElement) {
                totalUsersElement.textContent = stats.total_users;
            }
            
            // Cập nhật số bài viết hôm nay
            const todayPostsElement = document.getElementById('today-posts');
            if (todayPostsElement) {
                todayPostsElement.textContent = stats.today_posts;
            }
        } else {
            console.error('Lỗi API thống kê:', statsResult.message);
            // Fallback: hiển thị dấu gạch ngang nếu lỗi
            const totalPostsElement = document.getElementById('total-posts');
            const totalUsersElement = document.getElementById('total-users');
            const todayPostsElement = document.getElementById('today-posts');
            
            if (totalPostsElement) totalPostsElement.textContent = '-';
            if (totalUsersElement) totalUsersElement.textContent = '-';
            if (todayPostsElement) todayPostsElement.textContent = '-';
        }
        
    } catch (error) {
        console.error('Lỗi load thống kê:', error);
        // Fallback: hiển thị dấu gạch ngang nếu lỗi
        const totalPostsElement = document.getElementById('total-posts');
        const totalUsersElement = document.getElementById('total-users');
        const todayPostsElement = document.getElementById('today-posts');
        
        if (totalPostsElement) totalPostsElement.textContent = '-';
        if (totalUsersElement) totalUsersElement.textContent = '-';
        if (todayPostsElement) todayPostsElement.textContent = '-';
    }
}

// Load tin tức preview cho trang chủ
async function loadNewsPreview() {
    try {
        const response = await fetch(apiUrl('db.php/get_posts.php?status=approved&limit=3'));
        const result = await response.json();
        
        const newsPreviewElement = document.getElementById('news-preview');
        if (!newsPreviewElement) return;
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const newsHtml = result.data.map(post => {
                if (!post) return '';
                
                const postDate = post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'N/A';
                const shortTitle = (post.title && post.title.length > 60) ? post.title.substring(0, 60) + '...' : (post.title || 'Không có tiêu đề');
                const shortContent = (post.content && post.content.length > 100) ? post.content.substring(0, 100) + '...' : (post.content || '');
                
                // Xử lý ảnh
                let imageUrl;
                if (post.image_url && post.image_url.trim() !== '') {
                    imageUrl = 'uploads/' + post.image_url;
                } else {
                    const imageNum = ((post.id - 1) % 5) + 1;
                    imageUrl = 'img/' + imageNum + '.jpg';
                }
                
                return `
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                        <img src="${imageUrl}" alt="${post.title}" class="w-full h-32 object-cover">
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">${post.category}</span>
                                <span class="text-xs text-gray-500">${postDate}</span>
                            </div>
                            <h3 class="font-bold text-gray-800 mb-2 text-sm leading-tight">${shortTitle}</h3>
                            <p class="text-gray-600 text-xs mb-3 leading-relaxed">${shortContent}</p>
                            <a href="chitiet.html?id=${post.id}" class="text-teal-600 hover:text-teal-700 text-xs font-medium">
                                Đọc thêm →
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
            
            newsPreviewElement.innerHTML = newsHtml;
        } else {
            newsPreviewElement.innerHTML = '<div class="col-span-3 text-center text-gray-500 py-8">Chưa có tin tức mới</div>';
        }
    } catch (error) {
        console.error('Lỗi load tin tức preview:', error);
        const newsPreviewElement = document.getElementById('news-preview');
        if (newsPreviewElement) {
            newsPreviewElement.innerHTML = '<div class="col-span-3 text-center text-red-500 py-8">Lỗi tải tin tức</div>';
        }
    }
}

window.openEditModal = function() {
    console.log('🔧 openEditModal called from page:', window.location.pathname);
    
    // Kiểm tra xem có đang ở trang profile không
    const isProfilePage = window.location.pathname.endsWith('profile.html');
    
    if (!isProfilePage) {
        console.log('🔄 Not on profile page, redirecting to profile...');
        // Hiển thị thông báo loading ngắn gọn nếu có hàm showLoading
        if (typeof window.showLoading === 'function') {
            window.showLoading('Đang chuyển đến trang cài đặt...');
        } else {
            // Fallback: hiển thị thông báo đơn giản
            console.log('📍 Chuyển hướng đến trang cài đặt tài khoản...');
        }
        // Chuyển hướng ngay lập tức đến trang profile với parameter để tự động mở modal
        window.location.href = 'profile.html?openEdit=true';
        return;
    }
    
    // Đảm bảo DOM đã load xong
    if (document.readyState !== 'complete') {
        console.log('⏳ DOM not ready, waiting...');
        setTimeout(() => openEditModal(), 100);
        return;
    }
    
    // Kiểm tra các element cần thiết
    const modal = document.getElementById('edit-modal');
    const usernameField = document.getElementById('edit-username');
    const emailField = document.getElementById('edit-email');
    const fullnameField = document.getElementById('edit-fullname');
    const phoneField = document.getElementById('edit-phone');
    
    console.log('📋 Elements check:', {
        modal: !!modal,
        usernameField: !!usernameField,
        emailField: !!emailField,
        fullnameField: !!fullnameField,
        phoneField: !!phoneField
    });
    
    if (!modal) {
        console.error('❌ Edit modal not found in DOM');
        console.log('🔍 Available elements with "edit" in ID:', 
            Array.from(document.querySelectorAll('[id*="edit"]')).map(el => el.id)
        );
        // Thay vì hiển thị alert lỗi, chuyển hướng về trang profile
        console.log('🔄 Modal not found, redirecting to profile page...');
        window.location.href = 'profile.html?openEdit=true';
        return;
    }
    
    // Lấy thông tin hiện tại từ session
    const url = window.apiUrl ? apiUrl('db.php/check_session.php') : '/Project/db.php/check_session.php';
    console.log('🌐 Fetching user info from:', url);
    
    fetch(url, {
        method: 'GET',
        credentials: 'include', // Đảm bảo gửi cookies session
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('📡 Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            console.log('📄 API result:', result);
            
            if (result.success && result.isLoggedIn) {
                // Điền thông tin vào form
                if (usernameField) usernameField.value = result.username || '';
                if (emailField) emailField.value = result.email || '';
                if (fullnameField) fullnameField.value = result.fullname || result.display_name || '';
                if (phoneField) phoneField.value = result.phone || '';
                
                console.log('✅ Opening modal with user data:', {
                    username: result.username,
                    email: result.email,
                    fullname: result.fullname || result.display_name
                });
                
                // Hiển thị modal
                modal.classList.remove('hidden');
                modal.style.display = 'flex'; // Đảm bảo hiển thị
                
                // Focus vào trường đầu tiên có thể edit
                setTimeout(() => {
                    if (fullnameField) fullnameField.focus();
                }, 100);
                
            } else {
                console.error('❌ User not logged in or API error');
                alert('Bạn cần đăng nhập để sử dụng chức năng này. Vui lòng đăng nhập lại.');
                // Chuyển hướng đến trang đăng nhập
                window.location.href = 'dangnhap.html';
            }
        })
        .catch(error => {
            console.error('❌ Error loading user info:', error);
            // Thay vì hiển thị alert lỗi, chuyển hướng về trang đăng nhập
            console.log('🔄 Error loading user info, redirecting to login...');
            window.location.href = 'dangnhap.html';
        });
};

window.closeEditModal = function() {
    console.log('🔒 closeEditModal called');
    
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Đảm bảo ẩn hoàn toàn
        console.log('✅ Modal closed');
    }
    
    // Reset form
    const form = document.getElementById('edit-profile-form');
    if (form) {
        form.reset();
        console.log('📝 Form reset');
    }
};

// Xử lý submit form chỉnh sửa
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Form submit triggered');

            const username = document.getElementById('edit-username').value.trim();
            const fullname = document.getElementById('edit-fullname').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const phone = document.getElementById('edit-phone').value.trim();
            const currentPassword = document.getElementById('edit-current-password').value;
            const newPassword = document.getElementById('edit-new-password').value;

            console.log('📋 Form data:', { username, fullname, email, phone, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });

            // Validate
            if (!username || !email) {
                alert('Vui lòng điền đủ thông tin bắt buộc (tên tài khoản và email).');
                return;
            }

            if (newPassword && newPassword.length < 6) {
                alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
                return;
            }

            if (newPassword && !currentPassword) {
                alert('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.');
                return;
            }

            const formData = {
                username: username,
                fullname: fullname,
                email: email,
                phone: phone,
                current_password: currentPassword,
                new_password: newPassword
            };

            try {
                const url = window.apiUrl ? apiUrl('db.php/update_profile.php') : '/Project/db.php/update_profile.php';
                console.log('🌐 Sending update to:', url);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });

                console.log('📡 Update response status:', response.status);
                const result = await response.json();
                console.log('📄 Update result:', result);

                if (response.ok && result.success) {
                    alert('✅ ' + result.message);
                    closeEditModal();
                    // Reload trang để cập nhật thông tin
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                } else {
                    alert('❌ Lỗi: ' + (result.message || 'Không thể cập nhật thông tin.'));
                }

            } catch (error) {
                console.error('❌ Connection error:', error);
                alert('Lỗi kết nối server: ' + error.message);
            }
        });
    }
});

// Functions đã được export ở trên


// =========================================================
// CHỨC NĂNG: CHATBOT AI
// =========================================================

let chatbotVisible = false;

function toggleChatbot() {
    const window = document.getElementById('chatbot-window');
    if (!window) return;
    
    chatbotVisible = !chatbotVisible;
    
    if (chatbotVisible) {
        window.classList.remove('hidden');
    } else {
        window.classList.add('hidden');
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    console.log('🤖 Sending message:', message);
    
    // Hiển thị tin nhắn của user
    addChatMessage(message, 'user');
    input.value = '';
    
    // Hiển thị typing indicator
    addChatMessage('Đang suy nghĩ...', 'bot', true);
    
    try {
        const url = window.apiUrl ? apiUrl('db.php/chatbot.php') : '/Project/db.php/chatbot.php';
        console.log('🌐 API URL:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        
        console.log('📡 Response status:', response.status);
        const result = await response.json();
        console.log('📦 Response data:', result);
        
        // Xóa typing indicator
        removeTypingIndicator();
        
        if (result.success) {
            addChatMessage(result.message, 'bot');
        } else {
            addChatMessage('Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Lỗi: ' + (result.message || 'Không xác định'), 'bot');
        }
    } catch (error) {
        console.error('❌ Lỗi chatbot:', error);
        removeTypingIndicator();
        addChatMessage('Lỗi kết nối. Vui lòng thử lại sau. Chi tiết: ' + error.message, 'bot');
    }
}

function addChatMessage(message, sender, isTyping = false) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    
    if (sender === 'user') {
        messageDiv.className = 'bg-teal-600 text-white p-3 rounded-lg ml-8 shadow-sm';
    } else {
        messageDiv.className = 'bg-white p-3 rounded-lg mr-8 shadow-sm border border-gray-200';
        if (isTyping) {
            messageDiv.id = 'typing-indicator';
        }
    }
    
    // Format markdown-like text
    let formattedMessage = message;
    if (sender === 'bot') {
        formattedMessage = formatBotMessage(message);
    }
    
    messageDiv.innerHTML = `<div class="text-sm">${formattedMessage}</div>`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function formatBotMessage(message) {
    // Convert markdown-like formatting to HTML
    let formatted = message
        // Bold text: **text** -> <strong>text</strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-teal-700">$1</strong>')
        // Emoji bullets: 🔹 -> proper spacing
        .replace(/🔹/g, '<span class="inline-block mr-2">🔹</span>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Sections with emojis
        .replace(/📋 \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><span class="text-lg">📋</span> <strong class="font-semibold text-gray-800">$1</strong></div>')
        .replace(/🌊 \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><span class="text-lg">🌊</span> <strong class="font-semibold text-blue-600">$1</strong></div>')
        .replace(/🦐 \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><span class="text-lg">🦐</span> <strong class="font-semibold text-orange-600">$1</strong></div>')
        .replace(/🐟 \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><span class="text-lg">🐟</span> <strong class="font-semibold text-blue-500">$1</strong></div>')
        .replace(/🏥 \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><span class="text-lg">🏥</span> <strong class="font-semibold text-red-600">$1</strong></div>')
        .replace(/💰 \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><span class="text-lg">💰</span> <strong class="font-semibold text-green-600">$1</strong></div>')
        .replace(/🔬 \*\*(.*?)\*\*/g, '<div class="mt-3 mb-2"><span class="text-lg">🔬</span> <strong class="font-semibold text-purple-600">$1</strong></div>')
        // List items with dashes
        .replace(/- (.*?)(?=<br>|$)/g, '<div class="ml-4 mb-1">• $1</div>')
        // Checkmarks
        .replace(/✅ \*\*(.*?)\*\*/g, '<div class="mt-2 mb-1"><span class="text-green-500">✅</span> <strong class="font-medium">$1</strong></div>')
        // Color codes for different statuses
        .replace(/🔴 \*\*(.*?)\*\*/g, '<div class="mt-2 mb-1 p-2 bg-red-50 rounded border-l-4 border-red-400"><span class="text-red-500">🔴</span> <strong class="font-medium text-red-700">$1</strong></div>')
        .replace(/🟡 \*\*(.*?)\*\*/g, '<div class="mt-2 mb-1 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400"><span class="text-yellow-500">🟡</span> <strong class="font-medium text-yellow-700">$1</strong></div>')
        .replace(/🟠 \*\*(.*?)\*\*/g, '<div class="mt-2 mb-1 p-2 bg-orange-50 rounded border-l-4 border-orange-400"><span class="text-orange-500">🟠</span> <strong class="font-medium text-orange-700">$1</strong></div>');
    
    return formatted;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Export functions
window.toggleChatbot = toggleChatbot;
window.handleChatKeyPress = handleChatKeyPress;
window.sendChatMessage = sendChatMessage;

// =========================================================
// CHỨC NĂNG: CÁC HÀNH ĐỘNG CHO TRANG CHI TIẾT
// =========================================================

// Chia sẻ bài viết
function shareArticle() {
    const url = window.location.href;
    const title = document.title;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('Đã sao chép link bài viết vào clipboard!');
        }).catch(() => {
            // Fallback cho trình duyệt cũ
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Đã sao chép link bài viết!');
        });
    }
}

// Lưu bài viết
function bookmarkArticle() {
    const postId = new URLSearchParams(window.location.search).get('id');
    const titleElement = document.querySelector('h1');
    const title = titleElement ? titleElement.textContent : 'Bài viết';
    
    // Lưu vào localStorage (có thể mở rộng thành API sau)
    let bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
    
    const bookmark = {
        id: postId,
        title: title,
        url: window.location.href,
        savedAt: new Date().toISOString()
    };
    
    // Kiểm tra đã lưu chưa
    if (bookmarks.find(b => b.id === postId)) {
        alert('Bài viết đã được lưu trước đó!');
        return;
    }
    
    bookmarks.push(bookmark);
    localStorage.setItem('bookmarkedArticles', JSON.stringify(bookmarks));
    alert('✅ Đã lưu bài viết vào danh sách yêu thích!');
}

// In bài viết
function printArticle() {
    window.print();
}

// Đánh giá bài viết
async function rateArticle(rating) {
    console.log('🌟 rateArticle called with rating:', rating);
    
    const postId = new URLSearchParams(window.location.search).get('id');
    
    if (!postId) {
        console.error('❌ No post ID found');
        alert('Không tìm thấy ID bài viết.');
        return;
    }

    console.log('📝 Sending rating request:', { post_id: postId, rating: rating });

    try {
        const response = await fetch(apiUrl('db.php/rate_post.php'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                post_id: parseInt(postId),
                rating: parseInt(rating)
            })
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📄 Response result:', result);

        if (result.success) {
            // Cập nhật UI để hiển thị đánh giá đã chọn
            updateRatingUI(rating);
            
            // Hiển thị thông báo thành công
            showRatingSuccess(result.message);
            
            // Tải lại thông tin bài viết để cập nhật điểm trung bình
            setTimeout(() => {
                renderPostDetail();
            }, 1000);
        } else {
            console.error('❌ Rating failed:', result.message);
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('❌ Error in rateArticle:', error);
        alert('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.\nLỗi: ' + error.message);
    }
}

// Cập nhật UI đánh giá
function updateRatingUI(selectedRating) {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        const starRating = index + 1;
        if (starRating <= selectedRating) {
            star.classList.add('text-yellow-400');
            star.classList.remove('text-gray-300');
        } else {
            star.classList.add('text-gray-300');
            star.classList.remove('text-yellow-400');
        }
    });
    
    // Disable rating buttons after rating
    const ratingContainer = document.getElementById('rating-container');
    if (ratingContainer) {
        ratingContainer.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="flex items-center space-x-1">
                    ${Array.from({length: 5}, (_, i) => {
                        const filled = i < selectedRating;
                        return `
                            <svg class="w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        `;
                    }).join('')}
                </div>
                <span class="text-sm text-green-600 font-medium">Bạn đã đánh giá ${selectedRating} sao</span>
            </div>
        `;
    }
}

// Hiển thị thông báo thành công
function showRatingSuccess(message) {
    // Tạo toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Lấy đánh giá hiện tại của user cho bài viết
async function getUserRating(postId) {
    console.log('🔍 getUserRating called for postId:', postId);
    
    try {
        const url = apiUrl(`db.php/get_user_rating.php?post_id=${postId}`);
        console.log('📡 Fetching from:', url);
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📄 getUserRating result:', result);
        
        if (result.success && result.rating !== undefined) {
            console.log('✅ User rating found:', result.rating);
            return parseInt(result.rating);
        }
        
        console.log('ℹ️ No rating found, returning 0');
        return 0;
    } catch (error) {
        console.error('❌ Error in getUserRating:', error);
        return 0;
    }
}

// Xem hồ sơ tác giả
function viewAuthorProfile() {
    // Chuyển đến trang profile (có thể mở rộng để xem profile của tác giả khác)
    window.location.href = 'profile.html';
}

// Load bài viết liên quan
async function loadRelatedArticles(category, currentPostId) {
    const container = document.getElementById('related-articles');
    if (!container) return;
    
    try {
        // Lấy 3 bài viết cùng category, khác ID hiện tại
        const posts = await fetchPosts({ 
            status: 'approved', 
            limit: 3,
            category: category 
        });
        
        const relatedPosts = posts.filter(post => post.id != currentPostId).slice(0, 3);
        
        if (relatedPosts.length > 0) {
            const relatedHtml = relatedPosts.map(post => {
                const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
                const shortTitle = post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title;
                
                return `
                    <div class="border-b border-gray-100 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                        <a href="chitiet.html?id=${post.id}" class="block hover:bg-gray-50 p-2 rounded transition">
                            <h4 class="font-medium text-gray-800 text-sm leading-tight mb-1">${shortTitle}</h4>
                            <div class="flex items-center justify-between text-xs text-gray-500">
                                <span>${post.author_username}</span>
                                <span>${postDate}</span>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = relatedHtml;
        } else {
            container.innerHTML = '<p class="text-sm text-gray-500">Không có bài viết liên quan.</p>';
        }
    } catch (error) {
        console.error('Lỗi load bài viết liên quan:', error);
        container.innerHTML = '<p class="text-sm text-red-500">Lỗi tải bài viết liên quan.</p>';
    }
}

// Export các hàm mới
window.shareArticle = shareArticle;
window.bookmarkArticle = bookmarkArticle;
window.printArticle = printArticle;
window.rateArticle = rateArticle;
window.showRatingModal = showRatingModal;
window.loadRatingUI = loadRatingUI;
window.viewAuthorProfile = viewAuthorProfile;
window.loadRelatedArticles = loadRelatedArticles;


// =========================================================
// CHỨC NĂNG: TRANG TIN TỨC
// =========================================================

let newsCurrentPage = 1;

// Lọc tin tức
async function filterNews() {
    const category = document.getElementById('category-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'created_at';
    const keyword = document.getElementById('keyword-filter')?.value || '';
    
    newsCurrentPage = 1;
    await loadNews(category, sort, keyword, 1);
}

// Load tin tức
async function loadNews(category = '', sort = 'created_at', keyword = '', page = 1) {
    const container = document.getElementById('news-list');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-8"><div class="text-gray-500">Đang tải...</div></div>';
    
    try {
        const params = new URLSearchParams({
            category: category,
            sort: sort,
            keyword: keyword,
            page: page,
            limit: 10,
            status: 'approved'
        });
        
        const url = window.apiUrl ? apiUrl(`db.php/get_posts.php?${params}`) : `/Project/db.php/get_posts.php?${params}`;
        const response = await fetch(url);
        const result = await response.json();
        
        console.log('loadNews API response:', result);
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const newsHtml = result.data.map(post => {
                if (!post) return '';
                
                // Xử lý ảnh
                let imageUrl;
                if (post.image_url && post.image_url.trim() !== '') {
                    imageUrl = 'uploads/' + post.image_url;
                } else {
                    const imageNum = ((post.id - 1) % 5) + 1;
                    imageUrl = 'img/' + imageNum + '.jpg';
                }
                
                const summary = (post.content || '').substring(0, 150) + '...';
                const postDate = post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'N/A';
                
                const categoryNames = {
                    'kinh-nghiem': 'Kinh Nghiệm',
                    'tin-tuc': 'Tin Tức',
                    'hoi-dap': 'Hỏi Đáp',
                    'thi-truong': 'Thị Trường',
                    'kythuat-nuoi': 'Kỹ Thuật Nuôi'
                };
                const categoryName = categoryNames[post.category] || post.category;
                
                return `
                    <article class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <img src="${imageUrl}" alt="${post.title}" 
                                     class="w-32 h-24 object-cover rounded-l-lg">
                            </div>
                            <div class="flex-1 p-4">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2 mb-2">
                                            <span class="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">
                                                ${categoryName}
                                            </span>
                                            <span class="text-xs text-gray-500">${postDate}</span>
                                        </div>
                                        <h3 class="text-lg font-semibold text-gray-800 mb-2 hover:text-teal-600 transition-colors">
                                            <a href="chitiet.html?id=${post.id}">${post.title}</a>
                                        </h3>
                                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${summary}</p>
                                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>Tác giả: ${post.author || post.author_username}</span>
                                            <span>${post.views || 0} lượt xem</span>
                                            <span>${post.rating_count > 0 ? (post.rating_total / post.rating_count).toFixed(1) : '0'} ⭐</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
            
            container.innerHTML = newsHtml;
            
            // Tạo phân trang
            if (result.pagination && result.pagination.totalPages > 1) {
                createNewsPagination(result.pagination.totalPages, result.pagination.currentPage);
            } else {
                const paginationContainer = document.getElementById('news-pagination');
                if (paginationContainer) {
                    paginationContainer.innerHTML = '';
                }
            }
        } else {
            container.innerHTML = '<div class="text-center py-12"><div class="text-gray-500">Không tìm thấy tin tức nào.</div></div>';
            const paginationContainer = document.getElementById('news-pagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = '<div class="text-center py-12"><div class="text-red-500">Lỗi kết nối server.</div></div>';
    }
}

// Tạo phân trang cho tin tức
function createNewsPagination(totalPages, currentPage = newsCurrentPage) {
    const container = document.getElementById('news-pagination');
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    
    newsCurrentPage = currentPage;
    
    let paginationHtml = '<div class="flex items-center justify-center space-x-1">';
    
    // Previous button
    if (newsCurrentPage > 1) {
        paginationHtml += `<button onclick="changeNewsPage(${newsCurrentPage - 1})" 
                          class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition">
                          Trước
                          </button>`;
    }
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(1, newsCurrentPage - 2);
    const endPage = Math.min(totalPages, newsCurrentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === newsCurrentPage;
        const buttonClass = isActive 
            ? 'px-3 py-2 text-sm font-medium bg-teal-600 text-white border border-teal-600 rounded-md'
            : 'px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition';
        
        paginationHtml += `<button onclick="changeNewsPage(${i})" class="${buttonClass}">${i}</button>`;
    }
    
    // Next button
    if (newsCurrentPage < totalPages) {
        paginationHtml += `<button onclick="changeNewsPage(${newsCurrentPage + 1})" 
                          class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition">
                          Tiếp
                          </button>`;
    }
    
    paginationHtml += '</div>';
    
    // Page info
    paginationHtml += `<div class="text-center mt-3 text-sm text-gray-500">
                       Trang ${newsCurrentPage} / ${totalPages}
                       </div>`;
    
    container.innerHTML = paginationHtml;
}

// Chuyển trang tin tức
function changeNewsPage(page) {
    newsCurrentPage = page;
    const category = document.getElementById('category-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'created_at';
    const keyword = document.getElementById('keyword-filter')?.value || '';
    loadNews(category, sort, keyword, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions
window.filterNews = filterNews;
window.changeNewsPage = changeNewsPage;

// Auto load khi vào trang tin tức
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('tintuc.html')) {
        loadNews();
    }
});

// =========================================================
// PHÂN TRANG CHO TRANG KỸ THUẬT NUÔI
// =========================================================

let kyThuatNuoiCurrentPage = 1;

// =========================================================
// CHỨC NĂNG: TRANG KỸ THUẬT NUÔI
// =========================================================

// Lọc kỹ thuật nuôi
async function filterKyThuatNuoi() {
    // Lấy giá trị từ radio button
    const topicRadio = document.querySelector('input[name="topic"]:checked');
    const topic = topicRadio ? topicRadio.value : '';
    const keyword = document.getElementById('keyword-search')?.value || '';
    
    kyThuatNuoiCurrentPage = 1;
    await loadKyThuatNuoi(topic, keyword, 1);
}

// Reset filter
function resetFilter() {
    document.getElementById('keyword-search').value = '';
    document.querySelector('input[name="topic"][value=""]').checked = true;
    filterKyThuatNuoi();
}

// Xử lý URL parameters khi load trang kỹ thuật nuôi
function handleKyThuatNuoiParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        // Tự động chọn radio button tương ứng
        const topicValue = category === 'tom' ? 'tôm' : (category === 'ca' ? 'cá' : '');
        const radioButton = document.querySelector(`input[name="topic"][value="${topicValue}"]`);
        
        if (radioButton) {
            radioButton.checked = true;
            // Tự động lọc theo category
            filterKyThuatNuoi();
        }
    }
}

// Load kỹ thuật nuôi
async function loadKyThuatNuoi(topic = '', keyword = '', page = 1) {
    const container = document.getElementById('kythuat-nuoi-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-center text-gray-500 py-10">Đang tải...</p>';
    
    try {
        const params = new URLSearchParams({
            topic: topic,
            keyword: keyword,
            page: page,
            limit: 10,
            status: 'approved'
        });
        
        const url = window.apiUrl ? apiUrl(`db.php/get_posts.php?${params}`) : `/Project/db.php/get_posts.php?${params}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const postsHtml = result.data.map(post => {
                if (!post) return '';
                
                const summary = (post.content || '').substring(0, 150) + '...';
                const postDate = post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'N/A';
                
                const colors = ['blue', 'green', 'purple', 'orange', 'red'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                return `
                    <article class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-${color}-600">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <span class="text-xs font-semibold text-${color}-600 bg-${color}-100 px-2 py-0.5 rounded">${post.category || 'Kỹ Thuật'}</span>
                                <h3 class="text-2xl font-bold text-gray-800 mt-1 mb-2 hover:text-teal-600">
                                    <a href="chitiet.html?id=${post.id}">${post.title}</a>
                                </h3>
                            </div>
                            <span class="text-sm text-gray-500">Ngày: ${postDate}</span>
                        </div>
                        <p class="text-gray-600 line-clamp-3 text-sm mt-2">${summary}</p>
                        <div class="flex justify-between items-center mt-3">
                            <a href="chitiet.html?id=${post.id}" class="text-teal-600 font-medium hover:underline text-sm">Xem chi tiết →</a>
                            <div class="flex items-center space-x-3 text-xs text-gray-500">
                                <span>👁️ ${post.views || 0}</span>
                                <span>⭐ ${post.rating_count > 0 ? (post.rating_total / post.rating_count).toFixed(1) : '0'}</span>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
            
            container.innerHTML = postsHtml;
            
            // Tạo phân trang với thông tin từ API
            if (result.pagination) {
                createKyThuatNuoiPagination(result.pagination.totalPages, result.pagination.currentPage);
            }
        } else {
            container.innerHTML = '<p class="text-center text-gray-500 py-10">Không tìm thấy bài viết nào.</p>';
        }
    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = '<p class="text-center text-red-500 py-10">Lỗi kết nối server.</p>';
    }
}

// Tạo phân trang cho kỹ thuật nuôi
function createKyThuatNuoiPagination(totalPages, currentPage = kyThuatNuoiCurrentPage) {
    const container = document.getElementById('kythuat-nuoi-pagination');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    kyThuatNuoiCurrentPage = currentPage;
    
    let paginationHtml = '<div class="flex items-center justify-center space-x-2">';
    
    // Nút Previous
    if (kyThuatNuoiCurrentPage > 1) {
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${kyThuatNuoiCurrentPage - 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">‹ Trước</button>`;
    }
    
    // Hiển thị trang đầu nếu cần
    if (kyThuatNuoiCurrentPage > 3) {
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(1)" class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg">1</button>`;
        if (kyThuatNuoiCurrentPage > 4) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
    }
    
    // Các số trang xung quanh trang hiện tại
    for (let i = Math.max(1, kyThuatNuoiCurrentPage - 2); i <= Math.min(totalPages, kyThuatNuoiCurrentPage + 2); i++) {
        const activeClass = i === kyThuatNuoiCurrentPage ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100';
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${i})" class="px-3 py-2 text-sm font-medium ${activeClass} border rounded-lg transition">${i}</button>`;
    }
    
    // Hiển thị trang cuối nếu cần
    if (kyThuatNuoiCurrentPage < totalPages - 2) {
        if (kyThuatNuoiCurrentPage < totalPages - 3) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${totalPages})" class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg">${totalPages}</button>`;
    }
    
    // Nút Next
    if (kyThuatNuoiCurrentPage < totalPages) {
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${kyThuatNuoiCurrentPage + 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">Tiếp ›</button>`;
    }
    
    paginationHtml += '</div>';
    
    // Thêm thông tin trang
    paginationHtml += `<div class="text-center mt-4 text-sm text-gray-600">Trang ${kyThuatNuoiCurrentPage} / ${totalPages}</div>`;
    
    container.innerHTML = paginationHtml;
}

// Chuyển trang kỹ thuật nuôi
function changeKyThuatNuoiPage(page) {
    kyThuatNuoiCurrentPage = page;
    const topicRadio = document.querySelector('input[name="topic"]:checked');
    const topic = topicRadio ? topicRadio.value : '';
    const keyword = document.getElementById('keyword-search')?.value || '';
    loadKyThuatNuoi(topic, keyword, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions
window.filterKyThuatNuoi = filterKyThuatNuoi;
window.changeKyThuatNuoiPage = changeKyThuatNuoiPage;
window.resetFilter = resetFilter;

// Auto load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('kythuat-nuoi.html')) {
        // Xử lý URL parameters trước khi load
        handleKyThuatNuoiParams();
        // Nếu không có parameters, load tất cả
        if (!window.location.search) {
            loadKyThuatNuoi();
        }
    }
});


// =========================================================
// CHỨC NĂNG AVATAR ĐÃ TẠM THỜI VÔ HIỆU HÓA
// =========================================================
// Các chức năng avatar đã được tạm thời vô hiệu hóa để tránh lỗi


// =========================================================
// HELPER FUNCTION: SHOW MESSAGE
// =========================================================

function showMessage(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = 'mt-4 p-3 rounded-lg';
    
    if (type === 'success') {
        element.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-300');
    } else if (type === 'error') {
        element.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
    }
    
    element.classList.remove('hidden');
}

// =========================================================
// CHỨC NĂNG: QUÊN MẬT KHẨU QUA SMS
// =========================================================

let userPhone = '';  // Lưu số điện thoại để dùng cho verify OTP

// Xử lý form gửi OTP (chỉ cho SMS)
document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-password-form');
    const verifyForm = document.getElementById('verify-otp-form');
    
    // Chỉ xử lý SMS nếu có trường phone (không phải email)
    if (forgotForm && document.getElementById('fp-phone')) {
        forgotForm.addEventListener('submit', handleSendOTP);
    }
    
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerifyOTP);
    }
});

async function handleSendOTP(event) {
    event.preventDefault();
    
    const phone = document.getElementById('fp-phone').value.trim();
    const messageDiv = document.getElementById('forgot-message');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!phone) {
        showMessage(messageDiv, 'Vui lòng nhập số điện thoại.', 'error');
        return;
    }
    
    // Validate số điện thoại Việt Nam
    if (!validateVietnamesePhone(phone)) {
        showMessage(messageDiv, 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.', 'error');
        return;
    }
    
    userPhone = phone;  // Lưu lại
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang gửi...';
    
    try {
        const url = window.apiUrl ? apiUrl('db.php/forgot_password_sms.php') : '/Project/db.php/forgot_password_sms.php';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(messageDiv, '✅ ' + result.message, 'success');
            
            // Chuyển sang form nhập OTP sau 2 giây
            setTimeout(() => {
                showOTPForm();
            }, 2000);
        } else {
            showMessage(messageDiv, '❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showMessage(messageDiv, '❌ Lỗi kết nối server.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📨 Gửi Mã OTP';
    }
}

async function handleVerifyOTP(event) {
    event.preventDefault();
    
    const otp = document.getElementById('otp-code').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageDiv = document.getElementById('verify-message');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!otp || !newPassword || !confirmPassword) {
        showMessage(messageDiv, 'Vui lòng điền đầy đủ thông tin.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage(messageDiv, 'Mật khẩu xác nhận không khớp.', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage(messageDiv, 'Mật khẩu phải có ít nhất 6 ký tự.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang xử lý...';
    
    try {
        const url = window.apiUrl ? apiUrl('db.php/verify_otp.php') : '/Project/db.php/verify_otp.php';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: userPhone,
                otp: otp,
                new_password: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(messageDiv, '✅ ' + result.message, 'success');
            
            // Redirect về trang đăng nhập sau 2 giây
            setTimeout(() => {
                window.location.href = 'dangnhap.html';
            }, 2000);
        } else {
            showMessage(messageDiv, '❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showMessage(messageDiv, '❌ Lỗi kết nối server.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '✅ Đặt Lại Mật Khẩu';
    }
}

function showOTPForm() {
    document.getElementById('forgot-password-form').classList.add('hidden');
    document.getElementById('verify-otp-form').classList.remove('hidden');
}

function showPhoneForm() {
    document.getElementById('verify-otp-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.remove('hidden');
    document.getElementById('forgot-message').classList.add('hidden');
}

function validateVietnamesePhone(phone) {
    // Số điện thoại Việt Nam: 10 số, bắt đầu bằng 0
    const regex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    return regex.test(phone.replace(/[\s\-]/g, ''));
}

// Export functions
window.handleSendOTP = handleSendOTP;
window.handleVerifyOTP = handleVerifyOTP;
window.showOTPForm = showOTPForm;
window.showPhoneForm = showPhoneForm;

// =========================================================
// CHỨC NĂNG: WIDGETS CHO TRANG CHỦ
// =========================================================

// Duplicate loadHomeStats function removed - using the one with get_user_stats.php API

// Load bài viết mới nhất cho sidebar
async function loadLatestPosts() {
    try {
        const response = await fetch(apiUrl('db.php/get_posts.php?status=approved&limit=5'));
        const result = await response.json();
        
        const latestPostsElement = document.getElementById('latest-posts');
        if (!latestPostsElement) return;
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const latestHtml = result.data.map(post => {
                if (!post) return '';
                
                const postDate = post.created_at ? new Date(post.created_at).toLocaleDateString('vi-VN') : 'N/A';
                const shortTitle = (post.title && post.title.length > 40) ? post.title.substring(0, 40) + '...' : (post.title || 'Không có tiêu đề');
                
                return `
                    <div class="border-b border-gray-100 pb-2 mb-2 last:border-b-0">
                        <a href="chitiet.html?id=${post.id}" class="block hover:text-teal-600 transition">
                            <div class="text-sm font-medium text-gray-800 leading-tight">${shortTitle}</div>
                            <div class="text-xs text-gray-500 mt-1">${postDate}</div>
                        </a>
                    </div>
                `;
            }).join('');
            
            latestPostsElement.innerHTML = latestHtml;
        } else {
            latestPostsElement.innerHTML = '<div class="text-sm text-gray-500">Chưa có bài viết</div>';
        }
    } catch (error) {
        console.error('Lỗi load bài mới:', error);
        const latestPostsElement = document.getElementById('latest-posts');
        if (latestPostsElement) {
            latestPostsElement.innerHTML = '<div class="text-sm text-red-500">Lỗi tải dữ liệu</div>';
        }
    }
}

// Load bài viết phổ biến (giả lập - có thể cải thiện với view count thực tế)
async function loadPopularPosts() {
    try {
        const response = await fetch(apiUrl('db.php/get_posts.php?status=approved&limit=5'));
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            // Giả lập popularity bằng cách sắp xếp ngẫu nhiên
            const shuffled = result.data.sort(() => 0.5 - Math.random()).slice(0, 4);
            
            const popularHtml = shuffled.map((post, index) => {
                if (!post) return '';
                
                const shortTitle = (post.title && post.title.length > 35) ? post.title.substring(0, 35) + '...' : (post.title || 'Không có tiêu đề');
                const views = Math.floor(Math.random() * 500) + 100; // Giả lập view count
                
                return `
                    <div class="border-b border-gray-100 pb-2 mb-2 last:border-b-0">
                        <a href="chitiet.html?id=${post.id}" class="block hover:text-teal-600 transition">
                            <div class="flex items-start space-x-2">
                                <span class="text-xs font-bold text-orange-500 mt-1">#${index + 1}</span>
                                <div class="flex-1">
                                    <div class="text-sm font-medium text-gray-800 leading-tight">${shortTitle}</div>
                                    <div class="text-xs text-gray-500 mt-1">👁️ ${views} lượt xem</div>
                                </div>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');
            
            const popularPostsElement = document.getElementById('popular-posts');
            if (popularPostsElement) {
                popularPostsElement.innerHTML = popularHtml;
            }
        }
    } catch (error) {
        console.error('Lỗi load bài phổ biến:', error);
        const popularPostsElement = document.getElementById('popular-posts');
        if (popularPostsElement) {
            popularPostsElement.innerHTML = '<div class="text-sm text-red-500">Lỗi tải dữ liệu</div>';
        }
    }
}

// =========================================================
// PHÂN TRANG CHO PROFILE
// =========================================================

let profileCurrentPage = 1;

// Cập nhật renderMyPosts để hỗ trợ phân trang
async function renderMyPostsPaginated(page = 1) {
    const container = document.getElementById('my-posts-list');
    if (!container) return;

    container.innerHTML = '<p class="text-center text-gray-500 py-6">Đang tải...</p>';

    try {
        const params = new URLSearchParams({
            author: 'me',
            status: 'all',
            page: page,
            limit: 5
        });
        
        const url = window.apiUrl ? apiUrl(`db.php/get_posts.php?${params}`) : `/Project/db.php/get_posts.php?${params}`;
        console.log('Profile posts URL:', url);
        
        const response = await fetch(url, {
            credentials: 'same-origin' // Đảm bảo session được gửi
        });
        const result = await response.json();
        
        console.log('Profile posts result:', result);
        
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const postsHtml = result.data.map(post => {
                if (!post) return '';
                
                const statusClass = post.status === 'approved' ? 'text-green-600' : (post.status === 'pending' ? 'text-yellow-600' : 'text-red-600');
                const statusText = post.status === 'approved' ? '✅ Đã Duyệt' : (post.status === 'pending' ? '⏳ Chờ Duyệt' : '❌ Bị Từ Chối');
                
                const deleteButton = (post.status !== 'approved') ?
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
            
            // Tạo phân trang
            if (result.pagination && result.pagination.totalPages > 1) {
                createProfilePagination(result.pagination.totalPages, result.pagination.currentPage);
            } else {
                document.getElementById('profile-pagination').innerHTML = '';
            }
            
        } else {
            console.log('No posts found or API error:', result);
            if (result.message) {
                container.innerHTML = `<p class="text-center text-red-500 py-6">Lỗi: ${result.message}</p>`;
            } else {
                container.innerHTML = `<p class="text-center text-gray-500 py-6">Bạn chưa có bài viết nào. Hãy <a href="dangtin.html" class="text-teal-600 hover:underline">Đăng Tin</a> để chia sẻ kinh nghiệm!</p>`;
            }
            const paginationContainer = document.getElementById('profile-pagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
        }
        
    } catch (error) {
        console.error('Lỗi load bài viết profile:', error);
        container.innerHTML = '<p class="text-center text-red-500 py-6">Lỗi tải dữ liệu</p>';
    }
}

// Tạo phân trang cho profile
function createProfilePagination(totalPages, currentPage = profileCurrentPage) {
    const container = document.getElementById('profile-pagination');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    profileCurrentPage = currentPage;
    
    let paginationHtml = '<div class="flex items-center justify-center space-x-2">';
    
    if (profileCurrentPage > 1) {
        paginationHtml += `<button onclick="changeProfilePage(${profileCurrentPage - 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">‹ Trước</button>`;
    }
    
    for (let i = Math.max(1, profileCurrentPage - 2); i <= Math.min(totalPages, profileCurrentPage + 2); i++) {
        const activeClass = i === profileCurrentPage ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100';
        paginationHtml += `<button onclick="changeProfilePage(${i})" class="px-3 py-2 text-sm font-medium ${activeClass} border rounded-lg transition">${i}</button>`;
    }
    
    if (profileCurrentPage < totalPages) {
        paginationHtml += `<button onclick="changeProfilePage(${profileCurrentPage + 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">Tiếp ›</button>`;
    }
    
    paginationHtml += '</div>';
    paginationHtml += `<div class="text-center mt-4 text-sm text-gray-600">Trang ${profileCurrentPage} / ${totalPages}</div>`;
    
    container.innerHTML = paginationHtml;
}

// Chuyển trang profile
function changeProfilePage(page) {
    profileCurrentPage = page;
    renderMyPostsPaginated(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions
window.changeProfilePage = changeProfilePage;

// Cập nhật renderMyPosts gốc để sử dụng phiên bản có phân trang
window.renderMyPosts = function() {
    renderMyPostsPaginated(1);
};
// =========================================================
// ENHANCED DROPDOWN MENU FUNCTIONALITY
// =========================================================

// Add professional dropdown enhancements
function enhanceDropdownMenu() {
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (!userMenuBtn || !userMenu) return;
    
    // Add status indicator
    const avatar = userMenuBtn.querySelector('.bg-gradient-to-br');
    if (avatar && !avatar.querySelector('.user-status-indicator')) {
        avatar.classList.add('user-status-indicator');
    }
    
    // Add smooth scroll to dropdown if content is long
    userMenu.style.maxHeight = '80vh';
    userMenu.style.overflowY = 'auto';
    
    // Add keyboard navigation
    const menuItems = userMenu.querySelectorAll('a, button');
    let currentFocus = -1;
    
    userMenuBtn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && !userMenu.classList.contains('hidden')) {
            e.preventDefault();
            currentFocus = 0;
            menuItems[currentFocus]?.focus();
        }
    });
    
    menuItems.forEach((item, index) => {
        item.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentFocus = (currentFocus + 1) % menuItems.length;
                    menuItems[currentFocus]?.focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentFocus = currentFocus <= 0 ? menuItems.length - 1 : currentFocus - 1;
                    menuItems[currentFocus]?.focus();
                    break;
                case 'Escape':
                    e.preventDefault();
                    closeDropdownMenu();
                    userMenuBtn.focus();
                    break;
            }
        });
    });
}

// Close dropdown menu function
function closeDropdownMenu() {
    const userMenu = document.getElementById('user-menu');
    if (userMenu && !userMenu.classList.contains('hidden')) {
        userMenu.classList.remove('opacity-100', 'scale-100');
        userMenu.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            userMenu.classList.add('hidden');
        }, 200);
    }
}

// Add notification badge (example function)
function addNotificationBadge(count = 0) {
    const userMenuBtn = document.getElementById('user-menu-btn');
    if (!userMenuBtn) return;
    
    // Remove existing badge
    const existingBadge = userMenuBtn.querySelector('.notification-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Add new badge if count > 0
    if (count > 0) {
        const badge = document.createElement('div');
        badge.className = 'notification-badge';
        badge.textContent = count > 99 ? '99+' : count.toString();
        userMenuBtn.style.position = 'relative';
        userMenuBtn.appendChild(badge);
    }
}

// Update user role display in dropdown
function updateUserRoleDisplay(role = 'user') {
    const roleElements = document.querySelectorAll('#user-menu .text-teal-800');
    roleElements.forEach(element => {
        if (element.textContent.includes('Thành viên')) {
            const roleText = role === 'admin' ? 'Quản trị viên' : 'Thành viên';
            const roleColor = role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800';
            element.className = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColor}`;
            element.innerHTML = `
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                </svg>
                ${roleText}
            `;
        }
    });
}

// Initialize enhanced dropdown when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        enhanceDropdownMenu();
    }, 100);
});

// Export functions for global use
window.enhanceDropdownMenu = enhanceDropdownMenu;
window.closeDropdownMenu = closeDropdownMenu;
window.addNotificationBadge = addNotificationBadge;
window.updateUserRoleDisplay = updateUserRoleDisplay;