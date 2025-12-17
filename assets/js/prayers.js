import { db } from './firebase-config.js';
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

    // Clear previous listener if any
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    // Start Real-time listener
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

    setupModals(); // Move modals to body to fix positioning
    initializeEventListeners();
};

/**
 * Fix Modal Positioning for SPA
 * Moves modals from inside <main> to <body> so 'position: fixed' works correctly
 */
function setupModals() {
    const modalIds = ['addPrayerModal', 'editPrayerModal', 'viewPrayerModal'];
    modalIds.forEach(id => {
        // 1. Clean up "orphan" modals from previous visits (now in body)
        // We look for direct children of body with this ID to avoid deleting the one in Main before moving
        const orphans = Array.from(document.body.children).filter(child => child.id === id);
        orphans.forEach(orphan => orphan.remove());

        // 2. Move the new modal from Main to Body
        // Note: getElementById finds the first one. Since we removed orphans, this finds the new one in Main.
        const el = document.getElementById(id);
        if (el) {
            document.body.appendChild(el);
        }
    });
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

    // Prevent form submits reloading page
    ['addPrayerForm', 'editPrayerForm'].forEach(id => {
        const form = document.getElementById(id);
        if (form) form.onsubmit = (e) => e.preventDefault();
    });
}

/**
 * Submit new prayer to Firestore
 */
async function submitPrayer() {
    const name = document.getElementById('prayerName').value.trim();
    const content = document.getElementById('prayerContent').value.trim();
    const godAction = document.getElementById('prayerAction').value.trim();
    const category = document.getElementById('prayerCategory').value;

    if (!content) {
        document.getElementById('prayerContent').classList.add('is-invalid');
        return;
    }

    // Disable button
    const btn = document.getElementById('submitPrayerBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang gửi...';

    try {
        // Create 10s Timeout Promise
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Please check your internet or Firebase setup.')), 10000)
        );

        // Race Firestore addDoc against Timeout
        const addPromise = addDoc(collection(db, "prayers"), {
            name: name,
            content: content,
            godAction: godAction,
            category: category,
            status: 'not_prayed',
            date: new Date().toISOString(),
            prayedDate: null,
            answeredDate: null
        });

        await Promise.race([addPromise, timeout]);

        // Close modal safely
        const modalEl = document.getElementById('addPrayerModal');
        // Get existing instance or create new one to ensure we can hide it
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        document.getElementById('addPrayerForm').reset();
        document.getElementById('prayerContent').classList.remove('is-invalid');

        if (window.utils) window.utils.showSuccess('Đã gửi lời cầu nguyện thành công!');
        else alert('Đã gửi lời cầu nguyện thành công!');

    } catch (e) {
        console.error("Error adding document: ", e);
        const msg = e.message && e.message.includes('permission')
            ? 'Lỗi quyền truy cập. Bạn đã tạo Firestore Database và chọn "Test Mode" chưa?'
            : 'Lỗi khi gửi lời cầu nguyện: ' + (e.message || 'Unknown error');

        if (window.utils) window.utils.showError(msg);
        else alert(msg);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
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
        console.error("Error updating document: ", e);
        window.utils.showError('Lỗi khi cập nhật.');
    } finally {
        btn.disabled = false;
    }
}

/**
 * Delete prayer from Firestore
 */
window.deletePrayer = async function (id) {
    if (!confirm('Bạn có chắc chắn muốn xóa lời cầu nguyện này?')) return;

    try {
        await deleteDoc(doc(db, "prayers", id));
        window.utils.showInfo('Đã xóa lời cầu nguyện.');
    } catch (e) {
        console.error("Error deleting document: ", e);
        window.utils.showError('Lỗi khi xóa.');
    }
};

/**
 * Status Change Helper
 */
window.changeStatus = async function (id, newStatus) {
    try {
        const prayerRef = doc(db, "prayers", id);
        const updates = { status: newStatus };

        if (newStatus === 'prayed') {
            updates.prayedDate = new Date().toISOString();
        } else if (newStatus === 'not_prayed') {
            updates.prayedDate = null;
            updates.answeredDate = null;
            updates.answerDescription = '';
        } else if (newStatus === 'answered') {
            // Logic handled in specific function usually, but strictly speaking:
            updates.answeredDate = new Date().toISOString();
            if (!prayers.find(p => p.id === id)?.prayedDate) {
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
    const displayName = prayer.name || 'Ẩn danh';
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
                            <div class="dropdown">
                                <button class="btn btn-sm btn-${statusConfig.badge} dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    <i class="fas ${statusConfig.icon} me-1"></i>${statusConfig.text}
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="changeStatus('${prayer.id}', 'not_prayed')">Chưa cầu nguyện</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="changeStatus('${prayer.id}', 'prayed')">Đã cầu nguyện</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="changeStatus('${prayer.id}', 'answered')">Đã được đáp</a></li>
                                </ul>
                            </div>
                            
                             <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editPrayer('${prayer.id}')"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deletePrayer('${prayer.id}')"><i class="fas fa-trash"></i></button>
                            </div>
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
