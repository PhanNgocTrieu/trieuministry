// Profile Page JavaScript
(function () {
    const BIRTH_YEAR = 1999;

    function init() {
        // loadProfileData(); // Disabled as profile content is now static/i18n
        initAnimations();
        initCallingToggle();

        // Initial render attempt (safe if i18n is ready)
        if (window.i18n && window.i18n.isReady) {
            renderBioWithAge();
        } else {
            // Fallback if i18n not ready yet
            renderBioWithAge();
        }
    }

    // Run init immediately if DOM is ready (Turbo Router case), otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Listen for i18n events
    window.addEventListener('i18nReady', renderBioWithAge);
    window.addEventListener('languageChanged', renderBioWithAge);

    function renderBioWithAge() {
        console.log('[Profile] renderBioWithAge triggered');
        // We use ID now instead of data-i18n to avoid race condition with i18n.js
        const bioEl = document.getElementById('profileBio');
        if (!bioEl) {
            console.error('[Profile] #profileBio element not found');
            return;
        }
        if (!window.i18n) {
            console.error('[Profile] window.i18n not ready');
            return;
        }

        const currentLang = window.i18n.currentLang;
        console.log('[Profile] Current lang:', currentLang);

        // Get raw translation
        const rawText = window.i18n.t('profile.founder.bio');
        console.log('[Profile] Raw text retrieved:', rawText ? rawText.substring(0, 30) + '...' : 'null');

        if (!rawText) return;

        // Calculate age
        const currentYear = new Date().getFullYear();
        const age = currentYear - BIRTH_YEAR;

        // Replace placeholder
        const finalText = rawText.replace(/\{\{age\}\}/g, age);
        console.log('[Profile] Final text set:', finalText ? finalText.substring(0, 30) + '...' : 'empty');

        // Set content
        bioEl.innerHTML = finalText;
    }

    function initAnimations() {
        // Add fade-in animation
        document.querySelectorAll('.card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });
    }

    // Load profile data from JSON
    async function loadProfileData() {
        try {
            const response = await fetch('assets/data/profile.json');
            if (!response.ok) {
                throw new Error('Failed to load profile data');
            }

            const data = await response.json();
            populateProfile(data);
        } catch (error) {
            console.error('Error loading profile data:', error);
            // Show error toast if available
            if (window.Components && window.Components.Toast) {
                window.Components.Toast.error('Failed to load profile data');
            }
        }
    }

    // Populate profile page with data
    function populateProfile(data) {
        // Hero Section
        if (data.name) {
            document.getElementById('profileName').textContent = data.name;
        }

        if (data.title) {
            document.getElementById('profileTitle').textContent = data.title;
        }

        if (data.location) {
            const locationEl = document.getElementById('profileLocation');
            if (locationEl) {
                locationEl.querySelector('span').textContent = data.location;
            }
        }

        // Profile Image
        if (data.image) {
            document.getElementById('profileImage').src = data.image;
        }

        // Social Links
        if (data.socialLinks) {
            const socialContainer = document.getElementById('socialLinks');
            if (socialContainer) {
                const links = {
                    facebook: socialContainer.querySelector('a[aria-label="Facebook"]'),
                    youtube: socialContainer.querySelector('a[aria-label="YouTube"]'),
                    github: socialContainer.querySelector('a[aria-label="GitHub"]'),
                    email: socialContainer.querySelector('a[aria-label="Email"]'),
                    linkedin: socialContainer.querySelector('a[aria-label="LinkedIn"]')
                };

                if (links.facebook && data.socialLinks.facebook) links.facebook.href = data.socialLinks.facebook;
                if (links.youtube && data.socialLinks.youtube) links.youtube.href = data.socialLinks.youtube;
                if (links.github && data.socialLinks.github) links.github.href = data.socialLinks.github;
                if (links.email && data.socialLinks.email) links.email.href = data.socialLinks.email;
                if (links.linkedin && data.socialLinks.linkedin) links.linkedin.href = data.socialLinks.linkedin;
            }
        }

        // About Section
        if (data.bio) {
            document.getElementById('profileBio').textContent = data.bio;
        }

        // Current Work Section
        if (data.currentWork) {
            if (data.currentWork.position) {
                const positionEl = document.getElementById('workPosition');
                if (positionEl) {
                    positionEl.innerHTML = `<i class="fas fa-building text-primary me-2"></i>${data.currentWork.position}`;
                }
            }
            if (data.currentWork.company) {
                document.getElementById('workCompany').textContent = data.currentWork.company;
            }
            if (data.currentWork.description) {
                document.getElementById('workDescription').textContent = data.currentWork.description;
            }
        }

        // Fundamental Faith Section
        if (data.fundamentalFaith) {
            if (data.fundamentalFaith.title) {
                const titleEl = document.getElementById('faithTitle');
                if (titleEl) {
                    titleEl.innerHTML = `<i class="fas fa-cross text-primary me-2"></i>${data.fundamentalFaith.title}`;
                }
            }
            if (data.fundamentalFaith.description) {
                document.getElementById('faithDescription').textContent = data.fundamentalFaith.description;
            }
        }

        // Interests Section
        if (data.interests && Array.isArray(data.interests)) {
            const interestsContainer = document.getElementById('interestsContainer');
            if (interestsContainer) {
                interestsContainer.innerHTML = '';
                data.interests.forEach(interest => {
                    const interestBadge = document.createElement('span');
                    interestBadge.className = 'badge bg-secondary me-2 mb-2 p-2';
                    interestBadge.style.fontSize = '0.9rem';
                    interestBadge.textContent = interest;
                    interestsContainer.appendChild(interestBadge);
                });
            }
        }
    }

    // Add fade-in animation moved to initAnimations

    // Initialize Calling Section Toggle
    function initCallingToggle() {
        const toggleBtn = document.getElementById('toggleCallingBtn');
        const contentWrapper = document.getElementById('callingContentWrapper');

        if (toggleBtn && contentWrapper) {
            // Remove old listener if any? No, we just add new one.
            // But we need to be careful with Memory Leaks since we re-run this script.
            // A simple cloneNode/replace might be cleaner but for now just adding listener.

            toggleBtn.addEventListener('click', function () {
                const isCollapsed = contentWrapper.classList.contains('collapsed-content');
                const btnTextFn = toggleBtn.querySelector('.btn-text');
                const icon = toggleBtn.querySelector('i');

                if (isCollapsed) {
                    // Expand
                    contentWrapper.classList.remove('collapsed-content');
                    contentWrapper.classList.add('expanded-content');

                    if (btnTextFn) btnTextFn.textContent = window.i18n ? window.i18n.t('common.read_less') : 'Thu gọn';
                    if (icon) icon.className = 'fas fa-chevron-up ms-1';
                } else {
                    // Collapse
                    contentWrapper.classList.remove('expanded-content');
                    contentWrapper.classList.add('collapsed-content');

                    if (btnTextFn) btnTextFn.textContent = window.i18n ? window.i18n.t('common.read_more') : 'Đọc thêm';
                    if (icon) icon.className = 'fas fa-chevron-down ms-1';
                }
            });
        }
    }
})();

