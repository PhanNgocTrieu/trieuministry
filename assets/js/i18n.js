/**
 * Internationalization (i18n) Service
 * Handles language switching and dynamic text translation.
 */
console.log('[i18n] Script loaded');

class I18nService {
    constructor() {
        this.currentLang = 'vi'; // Default
        this.translations = {};
        this.baseDir = 'assets/data/locales/';

        try {
            const saved = localStorage.getItem('app_lang');
            if (saved) this.currentLang = saved;
        } catch (e) {
            console.warn('[i18n] LocalStorage access denied or failed:', e);
        }
    }

    async init() {
        console.log(`[i18n] Initializing language: ${this.currentLang}`);
        await this.loadTranslations(this.currentLang);
        this.translatePage();
        this.updateHtmlLangAttribute();
    }

    async loadTranslations(lang) {
        // If already loaded, skip
        if (this.translations[lang]) return;

        try {
            // Use relative path handling that respects router's base URI if needed, 
            // but standard fetch works fine with 'assets/...' from root.
            // We use standard fetch with cache busting to ensure updates.
            const response = await fetch(`${this.baseDir}${lang}.json?v=${Date.now()}`);
            if (!response.ok) throw new Error(`Failed to load ${lang}`);
            this.translations[lang] = await response.json();
        } catch (error) {
            console.error('[i18n] Error loading translations:', error);
        }
    }

    async switchLanguage(lang) {
        if (lang === this.currentLang) return;

        // Show loading spinner if global spinner is available
        const spinner = window.Components?.LoadingSpinner ? new window.Components.LoadingSpinner() : null;
        if (spinner) spinner.show('Đang chuyển ngôn ngữ / Switching language...');

        try {
            await this.loadTranslations(lang);
            this.currentLang = lang;
            localStorage.setItem('app_lang', lang);

            this.translatePage();
            this.updateHtmlLangAttribute();

            // Dispatch event for other components to react (e.g., re-render dynamic lists)
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

            console.log(`[i18n] Switched to: ${lang}`);
        } catch (error) {
            console.error('[i18n] Switch failed:', error);
        } finally {
            if (spinner) spinner.hide();
        }
    }

    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        const data = this.translations[this.currentLang];

        if (!data) return;

        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = this.getNestedValue(data, key);

            if (value) {
                // If element has value attribute (like inputs), update that too? No, usually placeholders.
                // For now, assume InnerHTML for safe rich text or TextContent.
                // If value contains HTML tags, use innerHTML, otherwise textContent to be safe?
                // For performance and safety, let's default to innerHTML to allow formatting like <b> in JSON.
                el.innerHTML = value;

                // Also update placeholder if it exists
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    // Special handling for placeholders using data-i18n-placeholder? 
                    // Let's keep it simple: data-i18n updates InnerHTML/Text. 
                    // Placeholders need separate attribute or logic.
                }
            }
        });

        // Update placeholders
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const value = this.getNestedValue(data, key);
            if (value) {
                el.setAttribute('placeholder', value);
            }
        });
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    }

    t(key) {
        const data = this.translations[this.currentLang];
        if (!data) return key;
        return this.getNestedValue(data, key) || key;
    }

    updateHtmlLangAttribute() {
        document.documentElement.lang = this.currentLang;
    }

    getCurrentLang() {
        return this.currentLang;
    }
}

// Export instance
window.i18n = new I18nService();

// Auto-init on load
// Note: We might want to await this in main.js, but auto-init is convenient.
document.addEventListener('DOMContentLoaded', () => {
    // If we're strictly SPA, main.js might call this. 
    // But adding it here ensures it runs.
    window.i18n.init();
});
