<?php
// send_email.php - Helper function để gửi email

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'email_config.php';

// Nếu dùng Composer
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
} 
// Nếu download thủ công
elseif (file_exists(__DIR__ . '/PHPMailer/src/Exception.php')) {
    require __DIR__ . '/PHPMailer/src/Exception.php';
    require __DIR__ . '/PHPMailer/src/PHPMailer.php';
    require __DIR__ . '/PHPMailer/src/SMTP.php';
} else {
    throw new Exception('PHPMailer not found. Please install via Composer or download manually.');
}

/**
 * Gửi email
 * 
 * @param string $to Email người nhận
 * @param string $subject Tiêu đề email
 * @param string $body Nội dung email (HTML)
 * @param string $altBody Nội dung text thuần (optional)
 * @return array ['success' => bool, 'message' => string]
 */
function sendEmail($to, $subject, $body, $altBody = '') {
    // Bắt đầu output buffering để tránh output không mong muốn
    ob_start();
    
    $mail = new PHPMailer(true);
    
    try {
        // Cấu hình SMTP
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        
        // Debug (tắt để tránh làm hỏng JSON response)
        $mail->SMTPDebug = 0; // Luôn tắt debug để tránh output không mong muốn
        
        // Người gửi
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        
        // Người nhận
        $mail->addAddress($to);
        
        // Nội dung email
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = $altBody ?: strip_tags($body);
        
        // Gửi email
        $mail->send();
        
        // Xóa output buffer và trả về kết quả
        ob_end_clean();
        
        return [
            'success' => true,
            'message' => 'Email đã được gửi thành công!'
        ];
        
    } catch (Exception $e) {
        // Xóa output buffer và trả về lỗi
        ob_end_clean();
        
        return [
            'success' => false,
            'message' => 'Lỗi gửi email: ' . $mail->ErrorInfo
        ];
    }
}

/**
 * Gửi email reset password
 */
function sendPasswordResetEmail($email, $username, $token) {
    $resetLink = SITE_URL . '/reset_password.html?token=' . $token;
    
    $subject = 'Đặt lại mật khẩu - ' . SITE_NAME;
    
    $body = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #0d9488, #06b6d4); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Đặt Lại Mật Khẩu</h1>
            </div>
            <div class="content">
                <p>Xin chào <strong>' . htmlspecialchars($username) . '</strong>,</p>
                
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>' . SITE_NAME . '</strong>.</p>
                
                <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
                
                <div style="text-align: center;">
                    <a href="' . $resetLink . '" class="button">Đặt Lại Mật Khẩu</a>
                </div>
                
                <p>Hoặc copy link sau vào trình duyệt:</p>
                <p style="background: #e5e7eb; padding: 10px; word-break: break-all; font-size: 12px;">
                    ' . $resetLink . '
                </p>
                
                <div class="warning">
                    <strong>⚠️ Lưu ý:</strong>
                    <ul>
                        <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                        <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                        <li>Không chia sẻ link này với bất kỳ ai</li>
                    </ul>
                </div>
                
                <p>Trân trọng,<br><strong>Đội ngũ ' . SITE_NAME . '</strong></p>
            </div>
            <div class="footer">
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                <p>&copy; 2025 ' . SITE_NAME . '. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ';
    
    $altBody = "Xin chào $username,\n\n"
             . "Vui lòng truy cập link sau để đặt lại mật khẩu:\n"
             . "$resetLink\n\n"
             . "Link có hiệu lực trong 1 giờ.\n\n"
             . "Trân trọng,\n" . SITE_NAME;
    
    return sendEmail($email, $subject, $body, $altBody);
}

/**
 * Gửi email chào mừng khi đăng ký
 */
function sendWelcomeEmail($email, $username) {
    $subject = 'Chào mừng đến với ' . SITE_NAME;
    
    $body = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #0d9488, #06b6d4); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Chào Mừng!</h1>
            </div>
            <div class="content">
                <p>Xin chào <strong>' . htmlspecialchars($username) . '</strong>,</p>
                
                <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>' . SITE_NAME . '</strong>!</p>
                
                <p>Bạn có thể bắt đầu:</p>
                <ul>
                    <li>📝 Đăng bài viết chia sẻ kinh nghiệm</li>
                    <li>💬 Bình luận và tương tác với cộng đồng</li>
                    <li>📊 Theo dõi giá thủy sản</li>
                    <li>🤖 Chat với AI tư vấn kỹ thuật</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="' . SITE_URL . '" class="button">Khám Phá Ngay</a>
                </div>
                
                <p>Chúc bạn có trải nghiệm tuyệt vời!</p>
                
                <p>Trân trọng,<br><strong>Đội ngũ ' . SITE_NAME . '</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2025 ' . SITE_NAME . '. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ';
    
    return sendEmail($email, $subject, $body);
}
?>
