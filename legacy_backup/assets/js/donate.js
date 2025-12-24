/**
 * Donate Page Logic
 * Handles dynamic appeals loading (Read-Only) and Request submission
 */

(function () {
    // State management
    let appealsData = [];

    // Global Init Function
    window.initDonatePage = async function () {
        console.log('Donate Page Initializing...');

        setupDonateModals(); // Fix Modal Positioning

        // Hide spinner if it exists
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) {
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 500);
        }

        await loadAppeals();
        renderAppeals();
        setupEventListeners();
        initializeDonateEvents();
    };

    /**
     * Fix Modal Positioning for SPA
     */
    /**
     * Fix Modal Positioning for SPA
     * Robustly handles duplicates and double-execution
     */
    function setupDonateModals() {
        const modalIds = ['requestAppealModal', 'imagePreviewModal'];
        modalIds.forEach(id => {
            // 1. Find the "New" modal that just arrived in <main>
            const mainModal = document.querySelector(`main #${id}`);

            // 2. Find any "Old" modals already in <body> (from previous nav or double-run)
            // Note: Use querySelectorAll to find all generic matches, then filter for direct body children
            const allModals = document.querySelectorAll(`#${id}`);
            const bodyModals = Array.from(allModals).filter(el => el.parentNode === document.body);

            if (mainModal) {
                // Scenario: Navigation or Fresh Load. We have a new modal source.
                // Action: Cleanup ALL old body modals (zombies) and move the new one.
                bodyModals.forEach(el => el.remove());
                document.body.appendChild(mainModal);
            } else {
                // Scenario: Double Run (modal already moved) OR Missing Modal.
                if (bodyModals.length > 1) {
                    // It's already in body. Just ensure we don't have duplicates.
                    // Keep the first one, remove others.
                    for (let i = 1; i < bodyModals.length; i++) {
                        bodyModals[i].remove();
                    }
                } else if (bodyModals.length === 0) {
                    console.warn(`Modal ${id} not found in Main or Body!`);
                }
            }
        });
    }

    /**
     * Initialize specific donate page events (Copy buttons)
     */
    function initializeDonateEvents() {
        const copyBtns = document.querySelectorAll('.copy-btn');
        copyBtns.forEach(btn => {
            // Remove old listeners to prevent duplicates if any, though replaceWith is better but complex here.
            // Since we re-run init on navigation, we might duplicate listeners if elements persist? 
            // No, 'main' content is swapped, so elements are new. Listeners are gone.

            btn.addEventListener('click', function () {
                const textToCopy = this.getAttribute('data-clipboard-text') || this.parentElement.querySelector('.account-number')?.innerText;
                if (!textToCopy) return;

                navigator.clipboard.writeText(textToCopy).then(() => {
                    if (window.utils) {
                        window.utils.showSuccess('Đã sao chép số tài khoản!');
                    } else {
                        // Fallback UI change
                        const icon = this.querySelector('i');
                        const originalClass = icon.className;
                        icon.className = 'fas fa-check';
                        setTimeout(() => {
                            icon.className = originalClass;
                        }, 2000);
                    }
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    if (window.utils) window.utils.showError('Không thể sao chép.');
                });
            });
        });
    }

    /**
     * Load appeals from JSON file
     */
    async function loadAppeals() {
        try {
            const response = await fetch('assets/data/appeals.json');
            const data = await response.json();
            appealsData = data.appeals || [];
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
                    <p class="text-muted">${window.i18n.t('donate.js_appeals.empty')}</p>
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
        const bankName = bankInfo.bankName || 'MB Bank';
        const acctNum = bankInfo.accountNumber || '0974210249';
        const acctName = bankInfo.accountName || 'PHAN NGOC TRIEU';
        const content = bankInfo.content || `Ung ho ${appeal.id}`;
        const qrImage = appeal.qrImage || 'assets/images/qr-placeholder.svg';

        const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

        col.innerHTML = `
            <div class="card h-100 shadow-sm border-0 appeal-card">
                <div class="card-body p-4">
                    <h4 class="card-title fw-bold text-primary mb-3">${appeal.title}</h4>
                    <p class="card-text text-muted mb-4">${appeal.description}</p>
                    
                    <div class="mb-4">
                        <div class="d-flex justify-content-between text-small mb-1">
                            <span class="fw-bold">${formatMoney(appeal.currentAmount)}</span>
                            <span class="text-muted">${window.i18n.t('donate.js_appeals.target')}: ${formatMoney(appeal.targetAmount)}</span>
                        </div>
                        <div class="progress text-small">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <small class="text-muted text-end d-block mt-1">${progress}% ${window.i18n.t('donate.js_appeals.completed')}</small>
                    </div>
                    
                    <div class="bg-light p-3 rounded">
                        <h6 class="fw-bold small text-uppercase text-muted mb-2"><i class="fas fa-info-circle me-1"></i>${window.i18n.t('donate.js_appeals.bank_info_title')}</h6>
                        <div class="row align-items-center">
                            <div class="col-8">
                                <div class="small">
                                    <div><strong>NH:</strong> ${bankName}</div>
                                    <div class="d-flex align-items-center mt-1">
                                        <span class="me-2"><strong>STK:</strong> <span class="font-monospace">${acctNum}</span></span>
                                        <button class="btn btn-sm btn-outline-primary p-0 text-decoration-none copy-btn" data-clipboard-text="${acctNum}">
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
                    ${appeal.deadline ? `<div class="mt-3 text-danger small"><i class="fas fa-clock me-1"></i>${window.i18n.t('donate.js_appeals.deadline')}: ${new Date(appeal.deadline).toLocaleDateString('vi-VN')}</div>` : ''}
                </div>
            </div>
        `;
        return col;
    }

    /**
     * Image Preview
     */
    window.viewImage = function (src) {
        const modalImg = document.getElementById('previewModalImage');
        const modalEl = document.getElementById('imagePreviewModal');
        if (modalImg && modalEl) {
            modalImg.src = src;
            new bootstrap.Modal(modalEl).show();
        }
    }

    // Expose Modal Opener Globally
    // Expose Modal Opener Globally
    window.openDonateModal = function () {
        const modalEl = document.getElementById('requestAppealModal');

        if (!modalEl || !window.bootstrap) {
            console.error('Modal element or Bootstrap not found');
            alert('Lỗi: Không tìm thấy form đăng ký.');
            return;
        }

        try {
            // Check for existing instance and dispose
            const existingModal = bootstrap.Modal.getInstance(modalEl);
            if (existingModal) {
                existingModal.dispose();
            }

            // Create fresh instance
            const modal = new bootstrap.Modal(modalEl, {
                backdrop: true,
                keyboard: true,
                focus: true
            });
            modal.show();

        } catch (err) {
            console.error('Failed to open modal:', err);
            alert('Không thể mở form: ' + err.message);
        }
    };

    function setupEventListeners() {
        // Send Appeal Button
        const sendRequestBtn = document.getElementById('sendRequestBtn');
        if (sendRequestBtn) {
            sendRequestBtn.addEventListener('click', handleRequestAppeal);
        }
    }

    function handleRequestAppeal() {
        console.log('Sending Request Appeal...');
        try {
            const form = document.getElementById('requestAppealForm');
            if (!form) {
                console.error('Form not found!');
                return;
            }
            const formData = new FormData(form);

            // Required fields
            const requiredFn = ['requesterName', 'requesterPhone', 'appealTitle', 'appealContent'];
            const missing = requiredFn.filter(field => !formData.get(field));

            if (missing.length > 0) {
                const msg = window.i18n.t('donate.js_form.error_required');
                if (window.utils && window.utils.showError) window.utils.showError(msg);
                else alert(msg);
                return;
            }

            // Email Logic
            const subject = encodeURIComponent(`[Yêu cầu Dâng hiến] - ${formData.get('appealTitle')}`);
            const body = encodeURIComponent(
                `Người gửi: ${formData.get('requesterName')} (${formData.get('requesterPhone')})\n` +
                `Nội dung: ${formData.get('appealContent')}\n` +
                `Ngân hàng: ${formData.get('bankName') || 'N/A'}\n` +
                `STK: ${formData.get('accountNumber') || 'N/A'}\n` +
                `Chủ TK: ${formData.get('accountName') || 'N/A'}`
            );

            // Open Mail Client
            window.location.href = `mailto:phantrieu580@gmail.com?subject=${subject}&body=${body}`;

            // Close Modal Robustly
            const modalEl = document.getElementById('requestAppealModal');
            if (modalEl) {
                try {
                    // Try Bootstrap method
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.hide();
                } catch (bsError) {
                    console.warn('Bootstrap hide failed, forcing close...', bsError);
                    // Force close
                    modalEl.classList.remove('show');
                    modalEl.style.display = 'none';
                    modalEl.setAttribute('aria-hidden', 'true');
                    modalEl.removeAttribute('aria-modal');
                    modalEl.removeAttribute('role');

                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';

                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    backdrops.forEach(bd => bd.remove());
                }
            }

            form.reset();

            if (window.utils && window.utils.showSuccess) window.utils.showSuccess(window.i18n.t('donate.js_form.success_email'));

        } catch (error) {
            console.error('Error handling appeal request:', error);
            alert(window.i18n.t('donate.js_form.error_generic') + ': ' + error.message);
        }
    }

    function ensureI18n(callback) {
        if (window.i18n && window.i18n.isReady) {
            callback();
        } else {
            // Check if i18n is present but just not ready, or wait for event
            window.addEventListener('i18nReady', callback, { once: true });
        }
    }

    // Auto-run condition - CRITICAL for SPA
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ensureI18n(window.initDonatePage));
    } else {
        ensureI18n(window.initDonatePage);
    }

})();
