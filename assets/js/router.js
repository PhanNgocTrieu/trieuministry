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

                // Close Mobile Menu if open
                const navbarCollapse = document.querySelector('#navbarNav');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse, { toggle: false });
                        bsCollapse.hide();
                    } else {
                        navbarCollapse.classList.remove('show');
                    }
                }

                // Use absolute URL from browser resolution
                this.navigate(link.href);
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
            // Fetch content with cache busting
            const fetchUrl = new URL(url, document.baseURI);
            // FORCE NEW TIMESTAMP to bypass browser cache
            fetchUrl.searchParams.set('v', Date.now());

            console.log('[Router] Fetching:', fetchUrl.href);

            const response = await fetch(fetchUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

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
                currentMain.className = newMain.className;
            } else {
                // Fallback for pages without <main>
                document.body.innerHTML = newDoc.body.innerHTML;
            }

            // Scroll to top
            window.scrollTo(0, 0);

            // Re-run scripts
            this.executeScripts(newDoc);

            // Re-initialize Global Components
            this.reinitGlobal();

            // Track Page View
            if (window.analytics && window.logEvent) {
                window.logEvent(window.analytics, 'page_view', {
                    page_title: document.title,
                    page_location: window.location.href,
                    page_path: window.location.pathname
                });
            }

        } catch (error) {
            console.error('[Router] Navigation failed, forcing reload:', error);
            // FALLBACK: Force standard browser navigation if SPA methods fail
            window.location.assign(url);
            return; // Exit function, browser will reload
        } finally {
            // Animation: Remove Fade Out, Add Fade In
            document.body.classList.remove('page-exit');
            document.body.classList.add('page-transition');
            setTimeout(() => document.body.classList.remove('page-transition'), 500);
        }
    }

    // Log Page View to Firebase Analytics
    logPageView(url) {
        if (window.analytics && window.logEvent) {
            // We need logEvent import? No, it's modular.
            // Wait, window.analytics is the instance. I need the function `logEvent`.
            // I forgot to export/expose logEvent in firebase-config.js.
            // I'll fix firebase-config.js first.
            console.log('Analytics PageView:', url);
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
                !src.includes('i18n.js') &&
                !src.includes('bootstrap'); // Bootstrap bundle usually doesn't need reload
        });

        // Remove old specific scripts? 
        // Actually, re-appending them usually triggers re-execution.
        // We'll clean up old known page scripts to avoid duplicates/memory leaks if possible,
        // but simple re-injection is safer for now.

        newScripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                // Force reload of modules by adding/updating timestamp
                const url = new URL(script.src, window.location.origin);
                url.searchParams.set('t', Date.now());
                newScript.src = url.toString();
                newScript.type = script.type || 'text/javascript'; // Preserve type (e.g. module)
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
        });
    }

    reinitGlobal() {
        // Update active nav link
        if (typeof initNavigation === 'function') initNavigation();
        if (typeof initNavigation === 'function') initNavigation();
        if (typeof initMobileMenu === 'function') initMobileMenu(); // Re-attach mobile menu listeners
        if (typeof initScrollAnimations === 'function') initScrollAnimations();

        // Re-apply translations to new content
        if (window.i18n) {
            window.i18n.translatePage();
        }

        // Bootstrap components might need re-init (dropdowns/modals inside main)
        // Check for modals in new content and init them?
        // Bootstrap 5 triggers usually work via data-bs-toggle, which delegates to document, so it SHOULD work.
    }
}

// Start Router
const router = new TurboRouter();
