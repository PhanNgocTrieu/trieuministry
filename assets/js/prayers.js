import { db, auth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from './firebase-config.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Prayers Page JavaScript - Firebase Edition
 */

// State
let prayers = [];
let filteredPrayers = [];
let unsubscribe = null;
let currentUser = null;
let isAdmin = false;

const categoryLabels = {
    health: 'Sức khỏe',
    family: 'Gia đình',
    work: 'Công việc',
    faith: 'Đức tin',
    other: 'Khác'
};

// Global Init Function for Router support
window.initPrayersPage = function () {
    console.log('Prayers Page Initializing (Firebase)...');

    // 1. Initialize Auth State Listener
    initAuth();

    // 2. Clear known listeners
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    // 3. Start Real-time listener
    const q = query(collection(db, "prayers"), orderBy("date", "desc"));
    unsubscribe = onSnapshot(q, (querySnapshot) => {
        prayers = [];
        querySnapshot.forEach((doc) => {
            prayers.push({ id: doc.id, ...doc.data() });
        });

        applyFilters(); // Renders UI
        updateStatistics();
    }, (error) => {
        console.error("Error getting prayers:", error);
        window.utils.showError('Không thể tải dữ liệu cầu nguyện.');
    });

    // Ensure DOM is fully parsed & cleaned up before binding events
    setTimeout(() => {
        setupModals();
        initializeEventListeners();
        setupAdminTrigger();
    }, 300);
};

function initAuth() {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            // Check if admin (Hardcoded logic for client-side UI only)
            isAdmin = user.email === 'admin@trieuministry.com' || user.email === 'phantrieu580@gmail.com';
            console.log('User:', user.uid, 'IsAdmin:', isAdmin);
        } else {
            isAdmin = false;
            // Auto sign-in anonymously if not logged in
            signInAnonymously(auth).catch((error) => {
                console.error("Anon Auth Failed", error);
            });
        }
        // Re-render to update buttons based on permissions
        renderPrayers();
    });
}

function setupAdminTrigger() {
    // 1. Hidden Trigger (Triple Click)
    const hiddenTrigger = document.getElementById('adminTrigger');
    if (hiddenTrigger) {
        let clickCount = 0;
        let timer;
        hiddenTrigger.onclick = () => {
            clickCount++;
            clearTimeout(timer);
            timer = setTimeout(() => { clickCount = 0; }, 500);
            if (clickCount === 3) {
                clickCount = 0;
                openAdminModal();
            }
        };
    }

    // 2. Visible Trigger (Footer Lock Icon)
    const visibleTrigger = document.getElementById('visibleAdminTrigger');
    if (visibleTrigger) {
        visibleTrigger.onclick = (e) => {
            e.preventDefault();
            openAdminModal();
        };
    }
}

function openAdminModal() {
    const modalEl = document.getElementById('adminLoginModal');
    if (!modalEl) return;

    const modalBody = modalEl.querySelector('.modal-body');
    const originalForm = document.getElementById('adminLoginForm');

    // Check if we are already logged in as Admin
    if (isAdmin) {
        // Show Logout UI
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-user-check fa-3x text-success mb-3"></i>
                <h5>Bạn đang đăng nhập với quyền Admin</h5>
                <p class="text-secondary">${currentUser.email}</p>
                <button class="btn btn-danger mt-2" onclick="handleAdminLogout()">
                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                </button>
            </div>
        `;
    } else {
        // Show Login Form (Restore if needed, but usually static HTML is fine unless overwritten)
        // If we overwrote it previously, we need to restore logic. 
        // Best approach: Toggle visibility between a Login Form and Logout Div if both exist, 
        // BUT simpler: Reload page resets HTML, so dynamic overwrite is fine for this session.
        // Wait, if user logs out, we need to show form again without reload.
        // Let's reload page on Logout for simplicity and security.
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Global expose for the onclick handler in string HTML
window.handleAdminLogout = async function () {
    try {
        await signOut(auth);
        window.utils.showInfo('Đã đăng xuất Admin.');
        window.location.reload(); // Reload to reset state and UI
    } catch (error) {
        console.error('Logout error', error);
        window.utils.showError('Đăng xuất thất bại.');
    }
};

/**
 * Fix Modal Positioning for SPA
 * Ensures modals are moved to body to allow fixed positioning
 */
function setupModals() {
    const modalIds = ['addPrayerModal', 'editPrayerModal', 'viewPrayerModal', 'adminLoginModal'];

    modalIds.forEach(id => {
        // Find ALL elements with this ID
        const elements = document.querySelectorAll(`#${id}`);

        // If we have more than 1, or if the single one is NOT in body:
        // We need to decide which one is the "new" one. 
        // Usage: The one inside 'main' is usually the new/swapped one.
        // The one in 'body' (direct child) is likely old residue.

        let targetModal = null;

        // Priority: Find one inside MAIN
        // Note: Using a specific selector to ensure we get the one in main
        const inMain = document.querySelector(`main #${id}`);

        if (inMain) {
            targetModal = inMain;
        } else if (elements.length > 0) {
            // If none in main, maybe it's already in body or footer?
            // Take the LAST one (assuming latest appended)
            targetModal = elements[elements.length - 1];
        }

        if (!targetModal) return;

        // Cleanup: Remove ALL others
        elements.forEach(el => {
            if (el !== targetModal) el.remove();
        });

        // Move target to body if not already there
        if (targetModal.parentElement !== document.body) {
            document.body.appendChild(targetModal);
        }
    });

    // Admin Login Handler
    const adminForm = document.getElementById('adminLoginForm');
    if (adminForm) {
        const newForm = adminForm.cloneNode(true);
        if (adminForm.parentNode) adminForm.parentNode.replaceChild(newForm, adminForm);

        newForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const pass = document.getElementById('adminPassword').value;
            const btn = document.getElementById('adminLoginBtn');

            try {
                btn.disabled = true;
                btn.innerHTML = 'Logging in...';
                await signInWithEmailAndPassword(auth, email, pass);
                window.utils.showSuccess('Admin Logged In');

                // Close modal
                const modalEl = document.getElementById('adminLoginModal');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();

                // IMPORTANT: Reload to apply admin permissions globally and cleanly
                setTimeout(() => window.location.reload(), 500);

            } catch (err) {
                console.error(err);
                window.utils.showError('Login failed: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Login';
            }
        };
    }
}

// Auto-run logic
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initPrayersPage);
} else {
    window.initPrayersPage();
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    const submitBtn = document.getElementById('submitPrayerBtn');
    const updateBtn = document.getElementById('updatePrayerBtn');
    const searchInput = document.getElementById('searchPrayerInput');
    const statusFilter = document.getElementById('statusFilter');
    const resetBtn = document.getElementById('resetFilters');

    if (submitBtn) submitBtn.onclick = submitPrayer;
    if (updateBtn) updateBtn.onclick = updatePrayer;

    if (searchInput) searchInput.oninput = applyFilters;
    if (statusFilter) statusFilter.onchange = applyFilters;
    if (resetBtn) resetBtn.onclick = resetFilters;

    // Button Feedback Fix: Blur all "Add Prayer" buttons after click
    const addBtns = document.querySelectorAll('[data-bs-target="#addPrayerModal"]');
    addBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            setTimeout(() => this.blur(), 200);
        });
    });

    ['addPrayerForm', 'editPrayerForm'].forEach(id => {
        const form = document.getElementById(id);
        if (form) form.onsubmit = (e) => e.preventDefault();
    });
}

/**
 * Submit new prayer to Firestore
 */
async function submitPrayer() {
    // 0. Auth Check: Wait for anonymous login
    if (!auth.currentUser && !currentUser) {
        window.utils.showInfo('Đang kết nối hệ thống... Vui lòng thử lại sau 2 giây.');
        // Optional: Trigger auth check again or just return
        return;
    }

    // 1. Spam Prevention: Honey Pot
    const honeyPot = document.getElementById('website')?.value;
    if (honeyPot) {
        console.warn('Spam detected (Honey Pot)');
        // Fake success to fool bot
        closeAddModal();
        return;
    }

    // 2. Spam Prevention: Rate Limit (1 min)
    const lastSubmit = localStorage.getItem('lastPrayerSubmit');
    const now = Date.now();
    if (lastSubmit && (now - parseInt(lastSubmit)) < 60000) {
        window.utils.showWarning('Bạn gửi quá nhanh. Vui lòng đợi 1 phút.');
        return;
    }

    const name = document.getElementById('prayerName').value.trim();
    const content = document.getElementById('prayerContent').value.trim();
    const godAction = document.getElementById('prayerAction').value.trim();
    const category = document.getElementById('prayerCategory').value;

    if (!content) {
        document.getElementById('prayerContent').classList.add('is-invalid');
        return;
    }

    const btn = document.getElementById('submitPrayerBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang gửi...';

    try {
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out.')), 10000)
        );

        // Include userId for security
        const activeUser = auth.currentUser || currentUser;
        const userId = activeUser ? activeUser.uid : null;

        const addPromise = addDoc(collection(db, "prayers"), {
            name: name,
            content: content,
            godAction: godAction,
            category: category,
            status: 'not_prayed',
            date: new Date().toISOString(),
            prayedDate: null,
            answeredDate: null,
            userId: userId
        });

        await Promise.race([addPromise, timeout]);

        localStorage.setItem('lastPrayerSubmit', now.toString()); // Update Rate Limit
        closeAddModal();

        if (window.utils) window.utils.showSuccess('Đã gửi lời cầu nguyện thành công!');
        else alert('Đã gửi lời cầu nguyện thành công!');

    } catch (e) {
        console.error("Error adding document: ", e);
        const msg = e.message && e.message.includes('permission')
            ? 'Lỗi quyền truy cập.'
            : 'Lỗi khi gửi: ' + (e.message || 'Unknown error');

        if (window.utils) window.utils.showError(msg);
        else alert(msg);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function closeAddModal() {
    const modalEl = document.getElementById('addPrayerModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();
    document.getElementById('addPrayerForm').reset();
    document.getElementById('prayerContent').classList.remove('is-invalid');
}

/**
 * Update prayer in Firestore
 */
async function updatePrayer() {
    const id = document.getElementById('editPrayerId').value;
    const name = document.getElementById('editPrayerName').value.trim();
    const content = document.getElementById('editPrayerContent').value.trim();
    const godAction = document.getElementById('editPrayerAction').value.trim();
    const category = document.getElementById('editPrayerCategory').value;

    // Permissions Check
    const prayer = prayers.find(p => p.id === id);
    if (!isAdmin && (!currentUser || prayer.userId !== currentUser.uid)) {
        window.utils.showError('Bạn không có quyền chỉnh sửa lời này.');
        return;
    }

    if (!content) {
        document.getElementById('editPrayerContent').classList.add('is-invalid');
        return;
    }

    const btn = document.getElementById('updatePrayerBtn');
    btn.disabled = true;

    try {
        const prayerRef = doc(db, "prayers", id);
        await updateDoc(prayerRef, {
            name: name,
            content: content,
            godAction: godAction,
            category: category
        });

        const modal = bootstrap.Modal.getInstance(document.getElementById('editPrayerModal'));
        modal.hide();
        window.utils.showSuccess('Đã cập nhật thành công!');
    } catch (e) {
        console.error("Error updating: ", e);
        window.utils.showError('Lỗi cập nhật. Có thể bạn không có quyền.');
    } finally {
        btn.disabled = false;
    }
}

/**
 * Delete prayer from Firestore
 */
window.deletePrayer = async function (id) {
    if (!isAdmin) {
        window.utils.showError('Chỉ Admin mới có quyền xóa.');
        return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa lời cầu nguyện này?')) return;

    try {
        await deleteDoc(doc(db, "prayers", id));
        window.utils.showInfo('Đã xóa lời cầu nguyện.');
    } catch (e) {
        console.error("Error deleting: ", e);
        window.utils.showError('Lỗi khi xóa.');
    }
};

/**
 * Status Change Helper
 */
window.changeStatus = async function (id, newStatus) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    if (!isAdmin) {
        window.utils.showError('Chỉ Admin mới có quyền thay đổi trạng thái.');
        return;
    }

    try {
        const prayerRef = doc(db, "prayers", id);
        const updates = { status: newStatus };

        if (newStatus === 'prayed') {
            updates.prayedDate = new Date().toISOString();
        } else if (newStatus === 'not_prayed') {
            updates.prayedDate = null;
            updates.answeredDate = null;
        } else if (newStatus === 'answered') {
            updates.answeredDate = new Date().toISOString();
            if (!prayer.prayedDate) {
                updates.prayedDate = new Date().toISOString();
            }
        }

        await updateDoc(prayerRef, updates);
        window.utils.showSuccess('Đã cập nhật trạng thái!');
    } catch (e) {
        console.error("Error updating status: ", e);
        window.utils.showError('Lỗi cập nhật trạng thái.');
    }
};

/**
 * View/Edit/Share helpers exposed to window
 */
window.editPrayer = function (id) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    // Check permissions
    if (!isAdmin && (!currentUser || prayer.userId !== currentUser.uid)) {
        window.utils.showError('Bạn chỉ có thể sửa lời cầu nguyện của chính mình.');
        return;
    }

    document.getElementById('editPrayerId').value = prayer.id;
    document.getElementById('editPrayerName').value = prayer.name || '';
    document.getElementById('editPrayerContent').value = prayer.content || '';
    document.getElementById('editPrayerAction').value = prayer.godAction || '';
    document.getElementById('editPrayerCategory').value = prayer.category || '';

    const modal = new bootstrap.Modal(document.getElementById('editPrayerModal'));
    modal.show();
};

window.viewPrayer = function (id) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    const displayName = prayer.name || 'Ẩn danh';
    const categoryLabel = prayer.category ? categoryLabels[prayer.category] : 'Không có';

    let statusLabel = '', statusClass = '';
    if (prayer.status === 'not_prayed') { statusLabel = 'Chưa cầu nguyện'; statusClass = 'secondary'; }
    else if (prayer.status === 'prayed') { statusLabel = 'Đã cầu nguyện'; statusClass = 'warning'; }
    else if (prayer.status === 'answered') { statusLabel = 'Đã được đáp'; statusClass = 'success'; }

    const content = `
        <div class="prayer-detail">
            <div class="mb-3">
                <span class="badge bg-${statusClass}">${statusLabel}</span>
                ${prayer.category ? `<span class="badge bg-secondary ms-2">${categoryLabel}</span>` : ''}
            </div>
            <p><strong>Người cầu nguyện:</strong> ${displayName}</p>
            <p><strong>Ngày tạo:</strong> ${formatDate(prayer.date)}</p>
            <hr>
            <p><strong>Nội dung cầu nguyện:</strong></p>
            <p class="text-justify">${prayer.content}</p>
             ${prayer.godAction ? `<hr><strong class="text-success">Chúa hành động:</strong><p>${prayer.godAction}</p>` : ''}
        </div>
    `;

    document.getElementById('viewPrayerContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('viewPrayerModal'));
    modal.show();
};

window.sharePrayer = function (id) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;
    const shareText = `Lời cầu nguyện từ ${prayer.name || 'Ẩn danh'}:\n\n${prayer.content}`;

    if (navigator.share) {
        navigator.share({ title: 'Lời cầu nguyện', text: shareText }).catch(console.error);
    } else {
        navigator.clipboard.writeText(shareText).then(() => window.utils.showSuccess('Đã sao chép!'));
    }
};

/**
 * Rendering & Filtering
 */
function applyFilters() {
    const searchInput = document.getElementById('searchPrayerInput');
    const statusFilter = document.getElementById('statusFilter');

    // Setup listener if lost (redundancy check)
    if (searchInput && !searchInput.oninput) searchInput.oninput = applyFilters;

    const searchTerm = (searchInput?.value || '').toLowerCase();
    const statusVal = statusFilter?.value || 'all';

    filteredPrayers = prayers.filter(prayer => {
        const matchesSearch = !searchTerm ||
            (prayer.name || '').toLowerCase().includes(searchTerm) ||
            (prayer.content || '').toLowerCase().includes(searchTerm);
        const matchesStatus = statusVal === 'all' || prayer.status === statusVal;
        return matchesSearch && matchesStatus;
    });

    renderPrayers();
}

function resetFilters() {
    const searchInput = document.getElementById('searchPrayerInput');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    applyFilters();
}

function renderPrayers() {
    const container = document.getElementById('prayersContainer');
    const emptyState = document.getElementById('emptyState');
    const countLabel = document.getElementById('prayersCountLabel');

    if (!container) return;

    if (filteredPrayers.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (countLabel) countLabel.textContent = '0 lời cầu nguyện';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (countLabel) countLabel.textContent = `${filteredPrayers.length} lời cầu nguyện`;

    // Sort: Not Prayed -> Prayed -> Answered. Then by Date Desc.
    const statusOrder = { 'not_prayed': 0, 'prayed': 1, 'answered': 2 };
    const sorted = [...filteredPrayers].sort((a, b) => {
        if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
        return new Date(b.date) - new Date(a.date);
    });

    container.innerHTML = sorted.map(prayer => createPrayerCard(prayer)).join('');
}

function createPrayerCard(prayer) {
    const displayName = prayer.name || window.i18n.t('common.anonymous');
    const categoryLabel = prayer.category ? categoryLabels[prayer.category] : '';
    const formattedDate = formatDate(prayer.date);

    // Determines Button Logic
    // Using window.changeStatus(id, status)

    // Icons/Classes based on status
    let statusConfig = {
        not_prayed: { badge: 'secondary', text: 'Chưa cầu nguyện', icon: 'fa-circle' },
        prayed: { badge: 'warning', text: 'Đã cầu nguyện', icon: 'fa-praying-hands' },
        answered: { badge: 'success', text: 'Đã được đáp', icon: 'fa-check-circle' }
    }[prayer.status] || {};

    // Check permissions for buttons
    // Use auth.currentUser directly to avoid race conditions with local variable
    const activeUser = auth.currentUser || currentUser;
    const canEdit = isAdmin || (activeUser && prayer.userId === activeUser.uid);
    const canDelete = isAdmin;

    // Status change button - RESTRICTED TO ADMIN ONLY
    const canChangeStatus = isAdmin;

    // Build Action Buttons
    let actionButtons = '';
    if (canChangeStatus) {
        actionButtons += `
            <div class="dropdown">
                <button class="btn btn-sm btn-${statusConfig.badge} dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas ${statusConfig.icon} me-1"></i>${statusConfig.text}
                </button>
                <ul class="dropdown-menu shadow border-0">
                    <li><h6 class="dropdown-header text-muted text-uppercase small ls-1">${window.i18n.t('prayers.status.update_header')}</h6></li>
                    <li><a class="dropdown-item d-flex align-items-center gap-2" href="javascript:void(0)" onclick="changeStatus('${prayer.id}', 'not_prayed')">
                        <i class="fas fa-circle text-secondary fa-fw"></i> ${window.i18n.t('prayers.status.not_prayed')}
                    </a></li>
                    <li><a class="dropdown-item d-flex align-items-center gap-2" href="javascript:void(0)" onclick="changeStatus('${prayer.id}', 'prayed')">
                        <i class="fas fa-praying-hands text-warning fa-fw"></i> ${window.i18n.t('prayers.status.prayed')}
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item d-flex align-items-center gap-2" href="javascript:void(0)" onclick="changeStatus('${prayer.id}', 'answered')">
                        <i class="fas fa-check-circle text-success fa-fw"></i> ${window.i18n.t('prayers.status.answered')}
                    </a></li>
                </ul>
            </div>
        `;
    } else {
        // Read-only status badge
        actionButtons += `
            <span class="badge bg-${statusConfig.badge}">
                <i class="fas ${statusConfig.icon} me-1"></i>${statusConfig.text}
            </span>
        `;
    }

    let editButtons = '<div class="d-flex gap-1">';
    if (canEdit) {
        editButtons += `<button class="btn btn-sm btn-outline-secondary" onclick="editPrayer('${prayer.id}')"><i class="fas fa-edit"></i></button>`;
    }
    if (canDelete) {
        editButtons += `<button class="btn btn-sm btn-outline-danger" onclick="deletePrayer('${prayer.id}')"><i class="fas fa-trash"></i></button>`;
    }
    editButtons += '</div>';

    // If no buttons, show minimal
    if (!canEdit && !canDelete) editButtons = '';

    return `
        <div class="col-md-6 col-lg-4 fade-in">
            <div class="card prayer-card ${prayer.status} h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="flex-grow-1">
                            <h6 class="mb-1 fw-bold">
                                <i class="fas fa-user-circle me-1 text-primary"></i>${displayName}
                            </h6>
                            <small class="text-muted">
                                <i class="far fa-calendar me-1"></i>${formattedDate}
                            </small>
                        </div>
                        ${categoryLabel ? `<span class="badge bg-secondary">${categoryLabel}</span>` : ''}
                    </div>
                    
                    <div class="mb-2">
                        <strong class="text-primary small">Nội dung CN:</strong>
                        <p class="card-text small mb-0">${prayer.content}</p>
                    </div>
                    
                    ${prayer.godAction ? `
                    <div class="mb-2">
                        <strong class="text-success small">Chúa hành động:</strong>
                        <p class="card-text small mb-0">${prayer.godAction}</p>
                    </div>` : ''}
                    
                    <div class="mt-auto pt-3 border-top">
                        <div class="d-flex justify-content-between align-items-center">
                            ${actionButtons}
                            ${editButtons}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    } catch (e) { return dateString; }
}

function updateStatistics() {
    const total = prayers.length;
    const answered = prayers.filter(p => p.status === 'answered').length;
    const ongoing = total - answered;

    const totalEl = document.getElementById('totalPrayersCount');
    const answeredEl = document.getElementById('answeredPrayersCount');
    const ongoingEl = document.getElementById('unansweredPrayersCount');

    if (totalEl) totalEl.textContent = total;
    if (answeredEl) answeredEl.textContent = answered;
    if (ongoingEl) ongoingEl.textContent = ongoing;
}
