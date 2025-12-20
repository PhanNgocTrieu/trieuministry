// Document Detail Page Logic
(function () {
    const params = new URLSearchParams(window.location.search);
    const initialDocId = params.get('id');

    document.addEventListener('DOMContentLoaded', () => ensureI18n(() => {
        if (!initialDocId) {
            showError(window.i18n.t('docs.detail.error_id'));
            return;
        }
        loadDocDetails(initialDocId);
    }));

    // Handle Back Button
    window.addEventListener('popstate', () => {
        const newParams = new URLSearchParams(window.location.search);
        const newId = newParams.get('id');
        if (newId) {
            loadDocDetails(newId, false); // No animation on popstate? Or yes? Maybe yes.
        }
    });

    function ensureI18n(callback) {
        if (window.i18n && window.i18n.isReady) {
            callback();
        } else {
            window.addEventListener('i18nReady', callback, { once: true });
        }
    }

    async function loadDocDetails(id, animate = true) {
        try {
            // Cache docs to avoid re-fetching
            if (!window.allDocs) {
                const res = await fetch('assets/data/docs.json');
                if (!res.ok) throw new Error('Failed to load docs data');
                const data = await res.json();
                window.allDocs = data.documents || [];
            }

            const doc = window.allDocs.find(d => d.id === id);

            if (!doc) {
                showError(window.i18n.t('docs.detail.error_not_found'));
                return;
            }

            if (animate) {
                renderDocWithAnimation(doc);
            } else {
                renderDoc(doc);
            }
        } catch (error) {
            console.error(error);
            showError(window.i18n.t('docs.detail.error_fetch'));
        }
    }

    function renderDocWithAnimation(doc) {
        const container = document.getElementById('docDetailContainer');

        // Fade Out
        container.style.opacity = '0';
        container.style.transform = 'translateY(10px)';
        container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        setTimeout(() => {
            renderDoc(doc);

            // Scroll to top of content gently
            // container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Fade In
            setTimeout(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
    }

    function renderDoc(doc) {
        document.getElementById('loadingState').style.display = 'none';
        const container = document.getElementById('docDetailContainer');
        container.style.display = 'block';

        // Ensure reset styles if not animating
        if (container.style.opacity === '0') {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }

        // Update Title & Meta
        document.title = `${doc.title} - TrieuMinistry`;
        document.getElementById('breadcrumbTitle').textContent = doc.title;

        // Populate Fields
        setText('docCategory', doc.category || 'General');
        setText('docTitle', doc.title);
        setText('docAuthor', doc.author || 'Unknown Author');

        updateDescription(doc);
        setText('docSize', doc.size || '—');
        setText('docDate', doc.uploadDate || '—');
        setText('docLang', doc.language || 'Tiếng Việt');

        // Image
        const img = document.getElementById('docCover');
        if (img) {
            img.style.opacity = '0'; // Fade image load
            img.onload = () => { img.style.transition = 'opacity 0.5s'; img.style.opacity = '1'; };
            img.src = doc.thumbnail || 'assets/images/docs/default.jpg';
            img.onerror = () => { img.src = 'assets/images/docs/default.jpg'; img.style.opacity = '1'; };
        }

        // Listen for language change to update description
        window.addEventListener('languageChanged', () => updateDescription(doc));

        // Setup Toggle Button Logic
        setupDescriptionToggle();
        // Remove previous listener to avoid duplicates? 
        // Actually, this adds a new listener every render. Potential leak. 
        // Ideally we name the function or handle it once. 
        // For now, let's just clear old listeners? We can't easily. 
        // Let's rely on the fact that 'languageChanged' is global.
        // Better: define the listener ONCE outside.

        // Download Button
        const btn = document.getElementById('downloadBtn');
        if (btn) {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.onclick = () => {
                downloadFile(doc.path, doc.title);
            };
        }

        // Navigation Logic
        setupNavigation(doc.id, window.allDocs);
    }

    // Global listener for language - but we need reference to current doc.
    // We can store currentDoc globally in this scope.
    let currentRenderedDoc = null;
    window.addEventListener('languageChanged', () => {
        if (currentRenderedDoc) updateDescription(currentRenderedDoc);
    });

    function updateDescription(doc) {
        currentRenderedDoc = doc; // Update reference
        let descText = '';
        if (typeof doc.description === 'object' && doc.description !== null) {
            const currentLang = window.i18n ? window.i18n.currentLang : 'vi';
            descText = doc.description[currentLang] || doc.description['vi'] || '';
        } else {
            descText = doc.description || '';
        }
        setText('docDescription', descText || 'No description available.');

        // Handle Collapse Logic - wait for render
        setTimeout(() => checkDescriptionHeight(), 0);
    }

    function checkDescriptionHeight() {
        const wrapper = document.getElementById('docDescWrapper');
        const descEl = document.getElementById('docDescription');
        const toggleContainer = document.getElementById('docDescToggleContainer');

        if (!wrapper || !descEl || !toggleContainer) return;

        // Reset state to measure
        wrapper.classList.remove('collapsed-content', 'expanded-content');
        toggleContainer.style.display = 'none';

        // Check height (approx > 180px triggers collapse)
        // Note: collapsed-content max-height is 150px
        if (descEl.scrollHeight > 180) {
            wrapper.classList.add('collapsed-content');
            toggleContainer.style.display = 'block';

            // Reset button text
            const btn = document.getElementById('docDescToggleBtn');
            if (btn) {
                const btnText = btn.querySelector('.btn-text');
                const icon = btn.querySelector('i');
                if (btnText) btnText.textContent = window.i18n ? window.i18n.t('common.read_more') : 'Đọc thêm';
                if (icon) icon.className = 'fas fa-chevron-down ms-1 small';
            }
        }
    }

    function setupDescriptionToggle() {
        const btn = document.getElementById('docDescToggleBtn');
        const wrapper = document.getElementById('docDescWrapper');

        if (btn && wrapper) {
            // Clean up old listener if exists? 
            // Better to clone button to be safe
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', function () {
                const isCollapsed = wrapper.classList.contains('collapsed-content');
                const btnText = newBtn.querySelector('.btn-text');
                const icon = newBtn.querySelector('i');

                if (isCollapsed) {
                    wrapper.classList.remove('collapsed-content');
                    wrapper.classList.add('expanded-content');
                    if (btnText) btnText.textContent = window.i18n ? window.i18n.t('common.read_less') : 'Thu gọn';
                    if (icon) icon.className = 'fas fa-chevron-up ms-1 small';
                } else {
                    wrapper.classList.remove('expanded-content');
                    wrapper.classList.add('collapsed-content');
                    if (btnText) btnText.textContent = window.i18n ? window.i18n.t('common.read_more') : 'Đọc thêm';
                    if (icon) icon.className = 'fas fa-chevron-down ms-1 small';
                }
            });
        }
    }

    function setupNavigation(currentId, docs) {
        if (!docs || docs.length === 0) return;

        const index = docs.findIndex(d => d.id === currentId);
        const prevBtn = document.getElementById('prevDocBtn');
        const nextBtn = document.getElementById('nextDocBtn');

        if (index > 0) {
            const prevDoc = docs[index - 1];
            if (prevBtn) {
                prevBtn.href = `doc-detail.html?id=${prevDoc.id}`;
                prevBtn.style.visibility = 'visible';
                prevBtn.title = prevDoc.title;
                prevBtn.onclick = (e) => {
                    e.preventDefault();
                    transitionToDoc(prevDoc.id);
                };
            }
        }
        // Else hide?
        else if (prevBtn) { prevBtn.style.visibility = 'hidden'; }


        if (index < docs.length - 1) {
            const nextDoc = docs[index + 1];
            if (nextBtn) {
                nextBtn.href = `doc-detail.html?id=${nextDoc.id}`;
                nextBtn.style.visibility = 'visible';
                nextBtn.title = nextDoc.title;
                nextBtn.onclick = (e) => {
                    e.preventDefault();
                    transitionToDoc(nextDoc.id);
                };
            }
        }
        // Else hide?
        else if (nextBtn) { nextBtn.style.visibility = 'hidden'; }
    }

    function transitionToDoc(id) {
        // Update URL
        const newUrl = `${window.location.pathname}?id=${id}`;
        history.pushState({ id: id }, '', newUrl);

        // Load with animation
        loadDocDetails(id, true);
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function showError(msg) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('docDetailContainer').style.display = 'none';
        const errState = document.getElementById('errorState');
        const errMsg = document.getElementById('errorMessage');
        if (errState) errState.style.display = 'block';
        if (errMsg) errMsg.textContent = msg;
    }

    function downloadFile(path, filename) {
        const link = document.createElement('a');
        link.href = path;
        link.download = filename || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
})();
