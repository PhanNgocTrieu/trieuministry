/**
 * Newsletter Handler
 * Sends form data to Google Apps Script
 */

// Thay thế URL này bằng Web App URL của bạn từ bước Deploy Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydfKAri-SVOAnBv5nsZFibjzsxjo9nEc5JF0L4VzDJQy1kl2kJE4wA-5NPcWP6ZXTy/exec';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#newsletterForm');
    const input = document.querySelector('#newsletterEmail');
    const btn = document.querySelector('#newsletterBtn');
    const message = document.querySelector('#newsletterMessage');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!input.value) return;

        // UI Loading
        const originalBtnText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        message.style.display = 'none';

        try {
            // Check if script URL is configured
            if (SCRIPT_URL.includes('SAMPLE_URL')) {
                throw new Error('Chưa cấu hình Google Script URL');
            }

            // Use URLSearchParams for maximum compatibility with Google Apps Script
            const params = new URLSearchParams();
            params.append('email', input.value);
            // Date is handled by the script itself

            // Send to Google Sheet
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString()
            });

            // Success UI
            message.className = 'text-warning fw-bold small mt-2';
            message.textContent = 'Đăng ký thành công! Cảm ơn bạn.';
            message.style.display = 'block';
            form.reset();

        } catch (error) {
            console.error('Newsletter Error:', error);
            message.className = 'text-white bg-danger badge mt-2';
            message.textContent = 'Có lỗi xảy ra. ' + (error.message || 'Vui lòng thử lại.');
            message.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtnText;
        }
    });
});
