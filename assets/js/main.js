// Main JavaScript File

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Website loaded successfully!');

    // Initialize all components
    initBackToTop();
    initSmoothScroll();
    initScrollAnimations();
});

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

// Back to Top Button
function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');

    if (!backToTopBtn) return;

    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Smooth Scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Note: Toast functionality moved to components.js for better organization
// Keeping this for backward compatibility - will use Components.Toast if available


/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {string} successMessage - Message to show on success (optional)
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text, successMessage = 'Đã sao chép vào bộ nhớ tạm') {
    if (!text) return false;

    try {
        await navigator.clipboard.writeText(text);

        // Show success toast if Components exists
        if (typeof Components !== 'undefined' && Components.Toast) {
            Components.Toast.success(successMessage);
        } else {
            // Fallback alert if Toast not available
            alert(successMessage);
        }

        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);

        // Show error toast
        if (typeof Components !== 'undefined' && Components.Toast) {
            Components.Toast.error('Không thể sao chép nội dung');
        } else {
            alert('Không thể sao chép nội dung');
        }

        return false;
    }
}

// Make it globally available
window.copyToClipboard = copyToClipboard;
