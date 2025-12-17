/**
 * Donate Page Logic
 * Handles dynamic appeals loading (Read-Only) and Request submission
 */

document.addEventListener('DOMContentLoaded', () => {
    initDonate();
});

// State management
let appealsData = [];

async function initDonate() {
    await loadAppeals();
    renderAppeals();
    setupEventListeners();
}

/**
 * Load appeals from JSON file
 */
async function loadAppeals() {
    try {
        const response = await fetch('assets/data/appeals.json');
        const data = await response.json();
        appealsData = data.appeals || [];
        console.log('Loaded appeals from JSON');
    } catch (error) {
        console.error('Error loading appeals:', error);
        appealsData = [];
    }
}

/**
 * Render all appeals to the container
 */
function renderAppeals() {
    const container = document.getElementById('appealsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (appealsData.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="text-muted mb-3"><i class="fas fa-heart-broken fa-3x"></i></div>
                <p class="text-muted">Hiện chưa có lời kêu gọi nào.</p>
            </div>`;
        return;
    }

    appealsData.forEach(appeal => {
        const card = createAppealCard(appeal);
        container.appendChild(card);
    });
}

/**
 * Create HTML element for a single appeal card
 */
function createAppealCard(appeal) {
    const col = document.createElement('div');
    col.className = 'col-lg-6';

    // Calculate progress
    const progress = appeal.targetAmount > 0
        ? Math.min(100, Math.round((appeal.currentAmount / appeal.targetAmount) * 100))
        : 0;

    const bankInfo = appeal.bankInfo || {};
    // Use default bank info if not provided specifically
    const bankName = bankInfo.bankName || 'MB Bank';
    const acctNum = bankInfo.accountNumber || '0974210249';
    const acctName = bankInfo.accountName || 'PHAN NGOC TRIEU';
    const content = bankInfo.content || `Ung ho ${appeal.id}`;
    const qrImage = appeal.qrImage || 'assets/images/qr-placeholder.svg';

    // Format currency
    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    col.innerHTML = `
        <div class="card h-100 shadow-sm border-0 appeal-card">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h4 class="card-title fw-bold text-primary mb-0">${appeal.title}</h4>
                </div>
                
                <p class="card-text text-muted mb-4">${appeal.description}</p>
                
                <div class="mb-4">
                    <div class="d-flex justify-content-between text-small mb-1">
                        <span class="fw-bold">${formatMoney(appeal.currentAmount)}</span>
                        <span class="text-muted">Mục tiêu: ${formatMoney(appeal.targetAmount)}</span>
                    </div>
                    <div class="progress text-small">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small class="text-muted text-end d-block mt-1">${progress}% hoàn thành</small>
                </div>
                
                <div class="bg-light p-3 rounded">
                    <h6 class="fw-bold small text-uppercase text-muted mb-2"><i class="fas fa-info-circle me-1"></i>Thông tin chuyển khoản</h6>
                    <div class="row align-items-center">
                        <div class="col-8">
                            <div class="small">
                                <div><strong>NH:</strong> ${bankName}</div>
                                <div class="d-flex align-items-center mt-1">
                                    <span class="me-2"><strong>STK:</strong> <span class="font-monospace">${acctNum}</span></span>
                                    <button class="btn btn-sm btn-link p-0 text-decoration-none" onclick="copyToClipboard('${acctNum}', 'Đã sao chép STK cho ${appeal.title}!')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                                <div class="mt-1"><strong>Chủ TK:</strong> ${acctName}</div>
                                <div class="mt-1"><strong>ND:</strong> ${content}</div>
                            </div>
                        </div>
                        <div class="col-4 text-center">
                            <img src="${qrImage}" alt="QR Bank" class="img-fluid rounded shadow-sm border" style="max-height: 100px; cursor: pointer;" onclick="viewImage(this.src)">
                        </div>
                    </div>
                </div>
                
                ${appeal.deadline ? `<div class="mt-3 text-danger small"><i class="fas fa-clock me-1"></i>Hạn chót: ${new Date(appeal.deadline).toLocaleDateString('vi-VN')}</div>` : ''}
            </div>
        </div>
    `;

    return col;
}

/**
 * Open Image Preview
 */
window.viewImage = function (src) {
    const modalImg = document.getElementById('previewModalImage');
    const modalEl = document.getElementById('imagePreviewModal');

    if (modalImg && modalEl) {
        modalImg.src = src;
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

/**
 * Event Listeners setup
 */
function setupEventListeners() {
    // Request Appeal Button
    const sendRequestBtn = document.getElementById('sendRequestBtn');
    if (sendRequestBtn) {
        sendRequestBtn.addEventListener('click', handleRequestAppeal);
    }
}

/**
 * Handle Request Appeal Submission
 */
function handleRequestAppeal() {
    const form = document.getElementById('requestAppealForm');
    const formData = new FormData(form);

    const name = formData.get('requesterName');
    const phone = formData.get('requesterPhone');
    const title = formData.get('appealTitle');
    const amount = formData.get('targetAmount');
    const content = formData.get('appealContent');

    // Bank details
    const bankName = formData.get('bankName');
    const accountNumber = formData.get('accountNumber');
    const accountName = formData.get('accountName');

    if (!name || !phone || !title || !content) {
        if (window.Components && Components.Toast) {
            Components.Toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        } else {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        }
        return;
    }

    let bankDetailsText = "";
    if (bankName || accountNumber || accountName) {
        bankDetailsText = `\n\n------------------------------\nTHÔNG TIN TÀI KHOẢN NHẬN:\n` +
            `Ngân hàng: ${bankName || 'Trống'}\n` +
            `Số tài khoản: ${accountNumber || 'Trống'}\n` +
            `Chủ tài khoản: ${accountName || 'Trống'}`;
    }

    // Construct Email
    const subject = encodeURIComponent(`[Yêu cầu Dâng hiến] - ${title}`);
    const body = encodeURIComponent(
        `Xin chào,\n\nTôi muốn gửi yêu cầu kêu gọi dâng hiến với thông tin sau:\n\n` +
        `Họ tên: ${name}\n` +
        `SĐT/Zalo: ${phone}\n` +
        `Tiêu đề: ${title}\n` +
        `Mục tiêu: ${amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) : 'Không xác định'}\n\n` +
        `Nội dung chi tiết:\n${content}` +
        bankDetailsText +
        `\n\n(Tôi có đính kèm ảnh QR Code nếu có trong email này)\n\n` +
        `Xin cảm ơn và mong được duyệt.`
    );

    // Open Mail Client
    // Use location.href instead of window.open to avoid "popup blocked" or flashing blank tabs
    window.location.href = `mailto:phantrieu580@gmail.com?subject=${subject}&body=${body}`;

    // Close Modal
    const modalEl = document.getElementById('requestAppealModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    form.reset();

    // Show polite success message
    // Use a slight delay to ensure the UI transition is smooth after the mail app logic triggers
    setTimeout(() => {
        if (window.Components && Components.Toast) {
            Components.Toast.success("Đang mở ứng dụng Email của bạn...");
        } else {
            alert("Hệ thống đang mở ứng dụng Email để bạn gửi yêu cầu.\nHãy kiểm tra và nhấn Gửi trong Email nhé!");
        }
    }, 1000);
}
