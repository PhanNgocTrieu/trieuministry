// Navigation JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initMobileMenu();
    initSmoothScrollNavigation();
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
    
    // Sticky Navigation with enhanced behavior
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
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

// Mobile Menu Toggle - Enhanced for Bootstrap 5
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('#navbarNav');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    if (!mobileMenuBtn || !navbarCollapse) return;
    
    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Use Bootstrap's collapse API to close
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        });
    });
    
    // Update aria-expanded when menu opens/closes
    navbarCollapse.addEventListener('shown.bs.collapse', function() {
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
    });
    
    navbarCollapse.addEventListener('hidden.bs.collapse', function() {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
}

// Smooth Scroll for Navigation Links
function initSmoothScrollNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('#navbarNav');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    }
                }
                
                // Smooth scroll to target
                const offsetTop = target.offsetTop - 76; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}
