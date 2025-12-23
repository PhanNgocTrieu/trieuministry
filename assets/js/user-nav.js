import { auth, onAuthStateChanged, signOut } from './firebase-config.js';

/**
 * Updates the Navbar based on User Auth State
 */
function initUserNav() {
    const navList = document.querySelector('.navbar-nav');
    if (!navList) return;

    // Create container for User Button if it doesn't exist
    // We try to place it before the Language selector if possible, or at the end
    let userContainer = document.getElementById('userNavContainer');
    if (!userContainer) {
        userContainer = document.createElement('li');
        userContainer.id = 'userNavContainer';
        userContainer.className = 'nav-item ms-lg-2 mt-2 mt-lg-0';
        navList.appendChild(userContainer);
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is Logged In
            const displayName = user.displayName || user.email.split('@')[0];
            const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=0D6EFD&color=fff`;

            userContainer.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-primary dropdown-toggle rounded-pill px-3 d-flex align-items-center gap-2" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <img src="${photoURL}" class="rounded-circle" width="24" height="24" alt="User">
                        <span class="d-none d-lg-inline max-w-150 text-truncate" style="max-width: 100px;">${displayName}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="userDropdown">
                        <li><h6 class="dropdown-header text-muted">Xin chào, ${displayName}!</h6></li>
                        <li><a class="dropdown-item" href="admin.html" id="adminLink" style="display:none;"><i class="fas fa-cog me-2 text-secondary"></i>Quản trị</a></li>
                         <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Đăng xuất</a></li>
                    </ul>
                </div>
            `;

            // Setup Logout
            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await signOut(auth);
                    window.location.reload();
                } catch (error) {
                    console.error('Logout error', error);
                }
            });

            // Show Admin Link if email matches
            // Note: This is client-side only. Real security is in Firestore Rules.
            const admins = ['phantrieu580@gmail.com', 'admin@trieuministry.com'];
            if (admins.includes(user.email)) {
                const adminLink = document.getElementById('adminLink');
                if (adminLink) adminLink.style.display = 'block';
            }

        } else {
            // User is Not Logged In
            userContainer.innerHTML = `
                <a href="login.html" class="btn btn-primary rounded-pill px-4 shadow-sm">
                    <i class="fas fa-user me-2"></i>Đăng nhập
                </a>
            `;
        }
    });
}

// Auto-run if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserNav);
} else {
    initUserNav();
}
