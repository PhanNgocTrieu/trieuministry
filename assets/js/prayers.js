/**
 * Prayers Page JavaScript
 * Manages prayer requests with localStorage
 */

// Prayer data storage key
const PRAYERS_STORAGE_KEY = 'prayers_data';

// Prayer state
let prayers = [];
let filteredPrayers = [];

// Category labels
const categoryLabels = {
    health: 'Sức khỏe',
    family: 'Gia đình',
    work: 'Công việc',
    faith: 'Đức tin',
    other: 'Khác'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    loadPrayers();
    renderPrayers();
    updateStatistics();
    initializeEventListeners();
});

/**
 * Load prayers from localStorage
 */
function loadPrayers() {
    const stored = localStorage.getItem(PRAYERS_STORAGE_KEY);
    if (stored) {
        try {
            prayers = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading prayers:', e);
            prayers = [];
        }
    } else {
        // Initialize with sample prayers
        prayers = getSamplePrayers();
        savePrayers();
    }
    filteredPrayers = [...prayers];
}

/**
 * Save prayers to localStorage
 */
function savePrayers() {
    try {
        localStorage.setItem(PRAYERS_STORAGE_KEY, JSON.stringify(prayers));
    } catch (e) {
        console.error('Error saving prayers:', e);
        showToast('Lỗi khi lưu dữ liệu', 'error');
    }
}

/**
 * Get sample prayers for initial data
 */
function getSamplePrayers() {
    return [
        {
            id: Date.now() + 1,
            name: 'Nguyễn Văn A',
            content: 'Cầu nguyện cho sức khỏe của gia đình trong mùa dịch bệnh. Xin Chúa ban phước lành và bảo vệ mọi người.',
            godAction: '',
            category: 'health',
            status: 'not_prayed',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            prayedDate: null,
            answeredDate: null
        },
        {
            id: Date.now() + 2,
            name: 'Trần Thị B',
            content: 'Xin Chúa ban cho con công việc mới phù hợp với năng lực và sở thích của con.',
            godAction: 'Đã nhận được công việc mới tại công ty ABC với vị trí phù hợp. Chúa đã mở đường và ban phước.',
            category: 'work',
            status: 'answered',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            prayedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            answeredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: Date.now() + 3,
            name: '',
            content: 'Cầu nguyện cho hòa bình trong gia đình và sự hiểu biết lẫn nhau giữa các thành viên.',
            godAction: 'Chúa đang làm việc trong lòng mỗi người.',
            category: 'family',
            status: 'prayed',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            prayedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            answeredDate: null
        }
    ];
}

/**
 * Render prayers to the page
 */
function renderPrayers() {
    const container = document.getElementById('prayersContainer');
    const emptyState = document.getElementById('emptyState');
    const countLabel = document.getElementById('prayersCountLabel');

    if (filteredPrayers.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        countLabel.textContent = '0 lời cầu nguyện';
        return;
    }

    emptyState.style.display = 'none';
    countLabel.textContent = `${filteredPrayers.length} lời cầu nguyện`;

    // Sort prayers: not_prayed first, then prayed, then answered, within each group by date (newest first)
    const statusOrder = { 'not_prayed': 0, 'prayed': 1, 'answered': 2 };
    const sortedPrayers = [...filteredPrayers].sort((a, b) => {
        if (a.status !== b.status) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(b.date) - new Date(a.date);
    });

    container.innerHTML = sortedPrayers.map(prayer => createPrayerCard(prayer)).join('');
}

/**
 * Create HTML for a prayer card
 */
function createPrayerCard(prayer) {
    const displayName = prayer.name || 'Ẩn danh';
    const categoryLabel = prayer.category ? categoryLabels[prayer.category] : '';

    // Status badge and button
    let statusBadge = '';
    let statusBtnClass = '';
    let statusBtnText = '';
    let statusIcon = '';

    if (prayer.status === 'not_prayed') {
        statusBadge = '<span class="badge bg-secondary">Chưa cầu nguyện</span>';
        statusBtnClass = 'btn-secondary';
        statusBtnText = 'Chưa cầu nguyện';
        statusIcon = 'fa-circle';
    } else if (prayer.status === 'prayed') {
        statusBadge = '<span class="badge bg-warning">Đã cầu nguyện</span>';
        statusBtnClass = 'btn-warning';
        statusBtnText = 'Đã cầu nguyện';
        statusIcon = 'fa-praying-hands';
    } else if (prayer.status === 'answered') {
        statusBadge = '<span class="badge bg-success">Đã được đáp</span>';
        statusBtnClass = 'btn-success';
        statusBtnText = 'Đã được đáp';
        statusIcon = 'fa-check-circle';
    }

    const formattedDate = formatDate(prayer.date);

    // Truncate content for card display
    const truncatedContent = prayer.content.length > 120
        ? prayer.content.substring(0, 120) + '...'
        : prayer.content;

    const truncatedGodAction = prayer.godAction && prayer.godAction.length > 120
        ? prayer.godAction.substring(0, 120) + '...'
        : prayer.godAction;

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
                        <p class="card-text small mb-0">${truncatedContent}</p>
                    </div>
                    
                    ${prayer.godAction ? `
                    <div class="mb-2">
                        <strong class="text-success small">Chúa hành động:</strong>
                        <p class="card-text small mb-0">${truncatedGodAction}</p>
                    </div>
                    ` : ''}
                    
                    <!-- Status and Actions Row -->
                    <div class="mt-auto pt-3 border-top">
                        <div class="d-flex justify-content-between align-items-center">
                            <!-- Status Dropdown Button -->
                            <div class="dropdown">
                                <button class="btn btn-sm ${statusBtnClass} dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas ${statusIcon} me-1"></i>${statusBtnText}
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item ${prayer.status === 'not_prayed' ? 'active' : ''}" href="#" onclick="event.preventDefault(); changeStatus(${prayer.id}, 'not_prayed')">
                                        <i class="fas fa-circle me-2"></i>Chưa cầu nguyện
                                    </a></li>
                                    <li><a class="dropdown-item ${prayer.status === 'prayed' ? 'active' : ''}" href="#" onclick="event.preventDefault(); changeStatus(${prayer.id}, 'prayed')">
                                        <i class="fas fa-praying-hands me-2"></i>Đã cầu nguyện
                                    </a></li>
                                    <li><a class="dropdown-item ${prayer.status === 'answered' ? 'active' : ''}" href="#" onclick="event.preventDefault(); changeStatus(${prayer.id}, 'answered')">
                                        <i class="fas fa-check-circle me-2"></i>Đã được đáp
                                    </a></li>
                                </ul>
                            </div>
                            
                            <!-- View Button -->
                            <button class="btn btn-sm btn-outline-primary" onclick="viewPrayer(${prayer.id})">
                                <i class="fas fa-eye me-1"></i>Xem
                            </button>
                            
                            <!-- Edit/Delete/Share Buttons -->
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editPrayer(${prayer.id})" title="Sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deletePrayer(${prayer.id})" title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-info" onclick="sharePrayer(${prayer.id})" title="Chia sẻ">
                                    <i class="fas fa-share"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update statistics
 */
function updateStatistics() {
    const total = prayers.length;
    const notPrayed = prayers.filter(p => p.status === 'not_prayed').length;
    const prayed = prayers.filter(p => p.status === 'prayed').length;
    const answered = prayers.filter(p => p.status === 'answered').length;

    document.getElementById('totalPrayersCount').textContent = total;
    document.getElementById('answeredPrayersCount').textContent = answered;
    document.getElementById('unansweredPrayersCount').textContent = notPrayed + prayed;
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Add prayer form
    document.getElementById('submitPrayerBtn').addEventListener('click', submitPrayer);

    // Update prayer form
    document.getElementById('updatePrayerBtn').addEventListener('click', updatePrayer);

    // Search and filter
    document.getElementById('searchPrayerInput').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Form validation
    const addForm = document.getElementById('addPrayerForm');
    addForm.addEventListener('submit', function (e) {
        e.preventDefault();
    });

    const editForm = document.getElementById('editPrayerForm');
    editForm.addEventListener('submit', function (e) {
        e.preventDefault();
    });
}

/**
 * Submit new prayer
 */
function submitPrayer() {
    const name = document.getElementById('prayerName').value.trim();
    const content = document.getElementById('prayerContent').value.trim();
    const godAction = document.getElementById('prayerAction').value.trim();
    const category = document.getElementById('prayerCategory').value;

    // Validation
    if (!content) {
        document.getElementById('prayerContent').classList.add('is-invalid');
        return;
    }

    const newPrayer = {
        id: Date.now(),
        name: name,
        content: content,
        godAction: godAction,
        category: category,
        status: 'not_prayed',
        date: new Date().toISOString(),
        prayedDate: null,
        answeredDate: null
    };

    prayers.unshift(newPrayer);
    savePrayers();
    applyFilters();
    updateStatistics();

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPrayerModal'));
    modal.hide();
    document.getElementById('addPrayerForm').reset();
    document.getElementById('prayerContent').classList.remove('is-invalid');

    showToast('Đã thêm lời cầu nguyện thành công', 'success');
}

/**
 * Edit prayer
 */
function editPrayer(id) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    document.getElementById('editPrayerId').value = prayer.id;
    document.getElementById('editPrayerName').value = prayer.name;
    document.getElementById('editPrayerContent').value = prayer.content;
    document.getElementById('editPrayerAction').value = prayer.godAction || '';
    document.getElementById('editPrayerCategory').value = prayer.category || '';

    const modal = new bootstrap.Modal(document.getElementById('editPrayerModal'));
    modal.show();
}

/**
 * Update prayer
 */
function updatePrayer() {
    const id = parseInt(document.getElementById('editPrayerId').value);
    const name = document.getElementById('editPrayerName').value.trim();
    const content = document.getElementById('editPrayerContent').value.trim();
    const godAction = document.getElementById('editPrayerAction').value.trim();
    const category = document.getElementById('editPrayerCategory').value;

    if (!content) {
        document.getElementById('editPrayerContent').classList.add('is-invalid');
        return;
    }

    const prayerIndex = prayers.findIndex(p => p.id === id);
    if (prayerIndex !== -1) {
        prayers[prayerIndex].name = name;
        prayers[prayerIndex].content = content;
        prayers[prayerIndex].godAction = godAction;
        prayers[prayerIndex].category = category;

        savePrayers();
        applyFilters();

        const modal = bootstrap.Modal.getInstance(document.getElementById('editPrayerModal'));
        modal.hide();

        showToast('Đã cập nhật lời cầu nguyện', 'success');
    }
}

/**
 * View prayer details
 */
function viewPrayer(id) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    const displayName = prayer.name || 'Ẩn danh';
    const categoryLabel = prayer.category ? categoryLabels[prayer.category] : 'Không có';

    let statusLabel = '';
    let statusClass = '';
    if (prayer.status === 'not_prayed') {
        statusLabel = 'Chưa cầu nguyện';
        statusClass = 'secondary';
    } else if (prayer.status === 'prayed') {
        statusLabel = 'Đã cầu nguyện';
        statusClass = 'warning';
    } else if (prayer.status === 'answered') {
        statusLabel = 'Đã được đáp';
        statusClass = 'success';
    }

    const prayedInfo = prayer.prayedDate
        ? `<p><strong>Ngày cầu nguyện:</strong> ${formatDate(prayer.prayedDate)}</p>`
        : '';

    const answeredInfo = prayer.status === 'answered' && prayer.answeredDate
        ? `<p><strong>Ngày được đáp:</strong> ${formatDate(prayer.answeredDate)}</p>`
        : '';

    const answerDescription = prayer.status === 'answered' && prayer.answerDescription
        ? `<p><strong>Mô tả đáp lời:</strong></p><p class="text-justify">${prayer.answerDescription}</p><hr>`
        : '';

    const content = `
        <div class="prayer-detail">
            <div class="mb-3">
                <span class="badge bg-${statusClass}">${statusLabel}</span>
                ${prayer.category ? `<span class="badge bg-secondary ms-2">${categoryLabel}</span>` : ''}
            </div>
            <p><strong>Người cầu nguyện:</strong> ${displayName}</p>
            <p><strong>Ngày tạo:</strong> ${formatDate(prayer.date)}</p>
            ${prayedInfo}
            ${answeredInfo}
            <hr>
            <p><strong>Nội dung cầu nguyện:</strong></p>
            <p class="text-justify">${prayer.content}</p>
            ${answerDescription}
        </div>
    `;

    document.getElementById('viewPrayerContent').innerHTML = content;
    const modal = new bootstrap.Modal(document.getElementById('viewPrayerModal'));
    modal.show();
}

/**
 * Mark prayer as prayed
 */
function markAsPrayed(id) {
    const prayerIndex = prayers.findIndex(p => p.id === id);
    if (prayerIndex !== -1) {
        prayers[prayerIndex].status = 'prayed';
        prayers[prayerIndex].prayedDate = new Date().toISOString();

        savePrayers();
        applyFilters();
        updateStatistics();

        showToast('Đã đánh dấu là đã cầu nguyện', 'info');
    }
}

/**
 * Mark prayer as not prayed
 */
function markAsNotPrayed(id) {
    const prayerIndex = prayers.findIndex(p => p.id === id);
    if (prayerIndex !== -1) {
        prayers[prayerIndex].status = 'not_prayed';
        prayers[prayerIndex].prayedDate = null;
        prayers[prayerIndex].answeredDate = null;
        prayers[prayerIndex].answerDescription = '';

        savePrayers();
        applyFilters();
        updateStatistics();

        showToast('Đã đánh dấu là chưa cầu nguyện', 'info');
    }
}

/**
 * Mark prayer as answered - opens modal to input answer description
 */
function markAsAnswered(id) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    // Prompt for answer description
    const answerDescription = prompt('Mô tả cách Chúa đáp lời cầu nguyện này:');

    if (answerDescription === null) {
        // User cancelled
        return;
    }

    const prayerIndex = prayers.findIndex(p => p.id === id);
    if (prayerIndex !== -1) {
        prayers[prayerIndex].status = 'answered';
        prayers[prayerIndex].answeredDate = new Date().toISOString();
        prayers[prayerIndex].answerDescription = answerDescription.trim();

        // Set prayed date if not already set
        if (!prayers[prayerIndex].prayedDate) {
            prayers[prayerIndex].prayedDate = new Date().toISOString();
        }

        savePrayers();
        applyFilters();
        updateStatistics();

        showToast('Đã đánh dấu là được đáp', 'success');
    }
}

/**
 * Delete prayer
 */
function deletePrayer(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa lời cầu nguyện này?')) {
        return;
    }

    prayers = prayers.filter(p => p.id !== id);
    savePrayers();
    applyFilters();
    updateStatistics();

    showToast('Đã xóa lời cầu nguyện', 'info');
}

/**
 * Share prayer
 */
function sharePrayer(id) {
    const prayer = prayers.find(p => p.id === id);
    if (!prayer) return;

    const displayName = prayer.name || 'Ẩn danh';
    const shareText = `Lời cầu nguyện từ ${displayName}:\n\n${prayer.content}`;

    // Try Web Share API first
    if (navigator.share) {
        navigator.share({
            title: 'Lời cầu nguyện',
            text: shareText
        }).then(() => {
            showToast('Đã chia sẻ thành công', 'success');
        }).catch((error) => {
            if (error.name !== 'AbortError') {
                copyToClipboard(shareText);
            }
        });
    } else {
        // Fallback to clipboard
        copyToClipboard(shareText);
    }
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Đã sao chép vào clipboard', 'success');
        }).catch(() => {
            showToast('Không thể sao chép', 'error');
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Đã sao chép vào clipboard', 'success');
        } catch (err) {
            showToast('Không thể sao chép', 'error');
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Apply filters
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchPrayerInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    filteredPrayers = prayers.filter(prayer => {
        // Search filter
        const matchesSearch = !searchTerm ||
            prayer.name.toLowerCase().includes(searchTerm) ||
            prayer.content.toLowerCase().includes(searchTerm);

        // Status filter
        const matchesStatus = statusFilter === 'all' || prayer.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderPrayers();
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('searchPrayerInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    applyFilters();
}

/**
 * Format date to Vietnamese format
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Use the global toast function from components.js if available
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
}
