// Navigation JavaScript

document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initMobileMenu();
    initSmoothScrollNavigation();
    initPageTransitions();
});

// Initialize Navigation
function initNavigation() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        const linkPage = linkPath.split('/').pop();

        // Remove active class first
        link.classList.remove('active');

        // Highlight active page
        if (linkPage === currentPage ||
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPath === '/' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Sticky Navigation logic
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let lastScroll = 0;
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
            lastScroll = currentScroll;
        });
    }
}

// Handle Smooth Page Exits
function initPageTransitions() {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const target = this.getAttribute('target');

            // Skip if external, hash, or blank target
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || target === '_blank') return;

            // Check if it's a local internal link
            if (window.location.hostname === this.hostname) {
                e.preventDefault();

                // Add exit animation class
                document.body.classList.add('page-exit');

                // Wait for animation then navigate
                // Increased wait time to 400ms to allow fadeOut to complete partially
                setTimeout(() => {
                    window.location.href = href;
                }, 400);
            }
        });
    });
}

// Mobile Menu Toggle - Enhanced for Bootstrap 5
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('#navbarNav');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    if (!mobileMenuBtn || !navbarCollapse) return;

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
        });
    });

    // ARIA updates
    navbarCollapse.addEventListener('shown.bs.collapse', () => mobileMenuBtn.setAttribute('aria-expanded', 'true'));
    navbarCollapse.addEventListener('hidden.bs.collapse', () => mobileMenuBtn.setAttribute('aria-expanded', 'false'));
}

// Smooth Scroll for Navigation Links (ID anchors)
function initSmoothScrollNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navbarCollapse = document.querySelector('#navbarNav');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }

                const offsetTop = target.offsetTop - 76;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });
}
