/**
 * Turbo Router for TrieuMinistry
 * Handles SPA-like navigation without full page reloads.
 */

class TurboRouter {
    constructor() {
        this.init();
    }

    init() {
        // Intercept clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (this.shouldIntercept(link)) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });

        // Handle Back/Forward buttons
        window.addEventListener('popstate', () => {
            this.loadPage(window.location.href, false);
        });
    }

    shouldIntercept(link) {
        if (!link || !link.getAttribute('href')) return false;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Ignore external, hash, mailto, tel, or new tab links
        if (href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('http') && !href.includes(window.location.hostname) ||
            target === '_blank') {
            return false;
        }

        // Ignore same page links
        if (href === window.location.pathname.split('/').pop()) {
            return false;
        }

        return true;
    }

    async navigate(url) {
        // Push state
        history.pushState(null, '', url);
        await this.loadPage(url, true);
    }

    async loadPage(url, animate = true) {
        // Animation: Fade Out
        if (animate) {
            document.body.classList.add('page-exit');
        }

        try {
            // Fetch content
            const response = await fetch(url);
            const html = await response.text();

            // Parse content
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            // Wait for fade out (400ms match CSS)
            if (animate) {
                await new Promise(r => setTimeout(r, 400));
            }

            // Swap Title
            document.title = newDoc.title;

            // Swap Body Content (specifically <main>)
            const newMain = newDoc.querySelector('main');
            const currentMain = document.querySelector('main');

            if (newMain && currentMain) {
                currentMain.innerHTML = newMain.innerHTML;
                // Copy classes if any (e.g., specific page styling)
                currentMain.className = newMain.className;
            } else {
                // Fallback for pages without <main>
                document.body.innerHTML = newDoc.body.innerHTML;
            }

            // Scroll to top
            window.scrollTo(0, 0);

            // Re-run scripts
            this.executeScripts(newDoc);

            // Animation: Remove Fade Out, Add Fade In
            document.body.classList.remove('page-exit');
            document.body.classList.add('page-transition');
            setTimeout(() => document.body.classList.remove('page-transition'), 500);

            // Re-initialize Global Components
            this.reinitGlobal();

        } catch (error) {
            console.error('Navigation failed:', error);
            window.location.reload(); // Fallback
        }
    }

    executeScripts(newDoc) {
        // Find page-specific scripts in the new document
        // We look for scripts in 'assets/js/' that are NOT main.js, components.js, navigation.js, router.js
        const newScripts = Array.from(newDoc.querySelectorAll('script')).filter(script => {
            const src = script.src;
            return src &&
                !src.includes('main.js') &&
                !src.includes('components.js') &&
                !src.includes('navigation.js') &&
                !src.includes('router.js') &&
                !src.includes('bootstrap'); // Bootstrap bundle usually doesn't need reload
        });

        // Remove old specific scripts? 
        // Actually, re-appending them usually triggers re-execution.
        // We'll clean up old known page scripts to avoid duplicates/memory leaks if possible,
        // but simple re-injection is safer for now.

        newScripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
                // Force reload by adding timestamp? No, cache is fine, just need execution.
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
        });
    }

    reinitGlobal() {
        // Update active nav link
        if (typeof initNavigation === 'function') initNavigation();
        if (typeof initScrollAnimations === 'function') initScrollAnimations();

        // Bootstrap components might need re-init (dropdowns/modals inside main)
        // Check for modals in new content and init them?
        // Bootstrap 5 triggers usually work via data-bs-toggle, which delegates to document, so it SHOULD work.
    }
}

// Start Router
const router = new TurboRouter();
