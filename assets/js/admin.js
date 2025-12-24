import { auth, db, signOut, onAuthStateChanged } from './firebase-config.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Admins List
const ADMIN_EMAILS = ['phantrieu580@gmail.com', 'admin@trieuministry.com'];

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

function initAdmin() {
    onAuthStateChanged(auth, (user) => {
        const authCheck = document.getElementById('authCheck');
        const adminContent = document.getElementById('adminContent');

        if (user && ADMIN_EMAILS.includes(user.email)) {
            // Authorized
            authCheck.style.display = 'none';
            adminContent.style.display = 'block';
            document.getElementById('adminEmail').textContent = user.email;

            setupTabs();
            loadStats();
            setupMigration();
            setupLogout();

        } else {
            // Unauthorized
            console.warn('Unauthorized access attempt:', user?.email);
            // window.location.href = 'index.html'; // Disable auto-redirect for debugging
            // Unauthorized or Guest
            console.warn('Unauthorized access attempt:', user?.email);

            const isGuest = !user;
            const message = isGuest
                ? 'Bạn chưa đăng nhập.'
                : `Tài khoản <strong>${user.email}</strong> không phải là Admin.`;

            const actionBtn = isGuest
                ? `<a href="login.html" class="btn btn-primary btn-sm mt-2">Đăng nhập ngay</a>`
                : `<button class="btn btn-outline-danger btn-sm mt-2" id="tempLogoutBtn">Đăng xuất</button>`;

            authCheck.innerHTML = `
                <div class="alert alert-danger mx-auto" style="max-width:500px">
                    <h4><i class="fas fa-exclamation-triangle"></i> Không có quyền truy cập</h4>
                    <p>${message}</p>
                    <p class="small text-muted">Vui lòng đăng nhập bằng email: phantrieu580@gmail.com</p>
                    ${actionBtn}
                </div>
            `;

            if (!isGuest) {
                document.getElementById('tempLogoutBtn').addEventListener('click', async () => {
                    await signOut(auth);
                    window.location.reload();
                });
            }
        }
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'login.html';
    });
}

function setupTabs() {
    const tabs = document.querySelectorAll('[data-tab]');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = tab.getAttribute('data-tab');

            // Update Nav
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update Panes
            panes.forEach(p => {
                if (p.id === `tab-${targetId}`) {
                    p.classList.remove('d-none');
                } else {
                    p.classList.add('d-none');
                }
            });

            if (targetId === 'blogs') loadBlogsList();
        });
    });
}

// ------ UI HELPERS ------
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const id = 'toast-' + Date.now();
    const colorClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';

    const html = `
        <div id="${id}" class="toast align-items-center ${colorClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const toast = new bootstrap.Toast(el);
    toast.show();

    // Auto remove from DOM
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

function showConfirmModal(message, onConfirm) {
    const modalEl = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    const btn = document.getElementById('confirmBtn');

    if (!modalEl || !msgEl || !btn) return;

    msgEl.innerHTML = message;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Clean up old listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
        modal.hide();
        onConfirm();
    });
}

// ------ MIGRATION LOGIC ------
function setupMigration() {
    const btn = document.getElementById('seedBlogsBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        showConfirmModal(
            'Bạn có chắc muốn chép dữ liệu từ blogs.json vào Firestore?<br>Hành động này sẽ ghi đè lên các ID trùng.',
            async () => {
                btn.disabled = true;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                try {
                    // 1. Fetch JSON
                    const res = await fetch('assets/data/blogs.json');
                    const data = await res.json();
                    const blogs = data.blogs || [];

                    // 2. Write to Firestore
                    let count = 0;
                    const batchPromises = blogs.map(async (blog) => {
                        const docId = blog.slug || 'blog_' + Date.now() + Math.random();
                        await setDoc(doc(db, "blogs", docId), {
                            ...blog,
                            createdAt: new Date().toISOString()
                        });
                        count++;
                    });

                    await Promise.all(batchPromises);

                    showToast(`Thành công! Đã chép ${count} bài viết.`);
                    loadStats(); // Refresh stats

                } catch (error) {
                    console.error(error);
                    showToast('Lỗi: ' + error.message, 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        );
    });
}

// ------ BLOGS MANAGEMENT ------
async function loadStats() {
    const blogsSnap = await getDocs(collection(db, "blogs"));
    document.getElementById('statBlogsCount').textContent = blogsSnap.size;
}

async function loadBlogsList() {
    const tbody = document.getElementById('blogsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    try {
        const snap = await getDocs(collection(db, "blogs"));
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có bài viết nào</td></tr>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const b = doc.data();
            html += `
                <tr>
                    <td class="ps-4">
                        <div class="fw-bold text-truncate" style="max-width: 300px;">${b.title}</div>
                        <small class="text-muted">${b.slug}</small>
                    </td>
                    <td><span class="badge bg-light text-dark border">${b.category || '-'}</span></td>
                    <td>${b.date}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.deleteBlog('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${error.message}</td></tr>`;
    }
}

// Global Actions
window.deleteBlog = function (id) {
    showConfirmModal(
        'Bạn có chắc chắn muốn xóa bài viết này không?',
        async () => {
            try {
                await deleteDoc(doc(db, "blogs", id));
                showToast('Đã xóa bài viết thành công.');
                loadBlogsList(); // Reload
            } catch (e) {
                showToast(e.message, 'error');
            }
        }
    );
};
