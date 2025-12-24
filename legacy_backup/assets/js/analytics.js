/**
 * Google Analytics 4 Configuration
 * Replace 'G-XXXXXXXXXX' with your actual Measurement ID
 */
const GA_MEASUREMENT_ID = 'G-ZDWXMP9CZ9';

// Load Google Analytics Script dynamically
(function () {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
})();

// Export helper for custom events
window.trackEvent = function (eventName, params = {}) {
    if (window.gtag) {
        window.gtag('event', eventName, params);
    }
};
