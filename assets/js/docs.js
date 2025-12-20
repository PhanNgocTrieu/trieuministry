// Docs Page Logic
(function () {
    window.initDocsPage = function () {
        console.log('Docs Page Initializing...');
        loadDocs();
        setupDocFilters();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ensureI18n(window.initDocsPage));
    } else {
        ensureI18n(window.initDocsPage);
    }

    function ensureI18n(callback) {
        if (window.i18n && window.i18n.isReady) {
            callback();
        } else {
            window.addEventListener('i18nReady', callback, { once: true });
        }
    }

    async function loadDocs() {
        const spinner = new Components.LoadingSpinner();
        spinner.show(window.i18n.t('common.loading'));

        try {
            const res = await fetch('assets/data/docs.json');
            if (!res.ok) throw new Error('Failed to load docs');
            const data = await res.json();
            const docs = Array.isArray(data.documents) ? data.documents : [];

            if (docs.length === 0) {
                renderEmptyState();
            } else {
                renderDocsGrid(docs);
                populateDocFilters(docs);
            }
        } catch (err) {
            console.error(err);
            renderEmptyState(window.i18n.t('docs.list.error_load'));
        } finally {
            spinner.hide();
        }
    }

    function renderEmptyState(message) {
        const msg = message || window.i18n.t('docs.list.empty');
        const container = document.getElementById('docsSectionsContainer');
        const countLabel = document.getElementById('docsCountLabel');

        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-folder-open fa-4x text-muted mb-3 opacity-25"></i>
                    <p class="text-muted lead">${msg}</p>
                </div>
            `;
        }
        if (countLabel) countLabel.textContent = `0 ${window.i18n.t('docs.list.count_suffix')}`;
    }

    function renderDocsGrid(docs) {
        const container = document.getElementById('docsSectionsContainer');
        const countLabel = document.getElementById('docsCountLabel');
        if (!container) return;

        // Filter logic 
        const search = (document.getElementById('searchDocInput')?.value || '').toLowerCase();
        const categoryFilter = document.getElementById('categoryDocFilter')?.value || '';

        const filtered = docs.filter(doc => {
            const matchesSearch = !search ||
                doc.title.toLowerCase().includes(search) ||
                (doc.description && doc.description.toLowerCase().includes(search));
            const matchesCategory = !categoryFilter || doc.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        if (countLabel) countLabel.textContent = `${filtered.length} ${window.i18n.t('docs.list.count_suffix')}`;

        if (filtered.length === 0) {
            renderEmptyState(window.i18n.t('docs.list.empty_filtered'));
            return;
        }

        // Single Grid Container
        container.innerHTML = `<div class="row g-4 justify-content-center" id="docsGridRow"></div>`;
        const gridRow = document.getElementById('docsGridRow');

        // Render all docs in one grid
        filtered.forEach(doc => {
            gridRow.innerHTML += createDocCard(doc);
        });
    }

    function createDocCard(doc) {
        const thumb = doc.thumbnail || 'assets/images/docs/default.jpg';

        // Handle localized description
        let descText = '';
        if (typeof doc.description === 'object' && doc.description !== null) {
            const currentLang = window.i18n ? window.i18n.currentLang : 'vi';
            descText = doc.description[currentLang] || doc.description['vi'] || '';
        } else {
            descText = doc.description || '';
        }

        const desc = descText ? (descText.substring(0, 100) + '...') : '';

        return `
            <div class="col-sm-6 col-lg-4 col-xl-3">
                <div class="card h-100 border-0 shadow-sm hover-card transition-all" 
                     style="cursor: pointer; overflow: hidden;"
                     onclick="window.location.href='doc-detail.html?id=${doc.id}'">
                    
                    <!-- Image Container with Aspect Ratio -->
                    <div class="position-relative overflow-hidden" style="padding-top: 140%; background: #f8f9fa;">
                        <img src="${thumb}" 
                             class="position-absolute top-0 start-0 w-100 h-100 object-fit-cover transition-transform" 
                             style="transition: transform 0.5s ease;"
                             alt="${doc.title}"
                             onerror="this.src='assets/images/docs/default.jpg'">
                        
                        <!-- Overlay on Hover -->
                        <div class="card-img-overlay d-flex align-items-center justify-content-center bg-dark bg-opacity-25 opacity-0 hover-opacity transition-all">
                            <span class="btn btn-light rounded-pill px-4 shadow-sm">
                                <i class="fas fa-eye me-2"></i>Chi tiết
                            </span>
                        </div>
                    </div>

                    <div class="card-body d-flex flex-column p-3">
                        <div class="mb-2">
                             <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1" style="font-size: 0.75rem;">
                                ${doc.category || 'General'}
                             </span>
                        </div>
                        <h6 class="card-title fw-bold text-dark mb-2 text-truncate-2" style="min-height: 2.4rem; line-height: 1.2;">
                            ${doc.title}
                        </h6>
                        <p class="card-text text-muted small mb-3 text-truncate-3 flex-grow-1" style="line-height: 1.4;">
                            ${desc}
                        </p>
                        
                        <div class="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
                            <div class="d-flex align-items-center text-secondary small">
                                <i class="fas fa-user-circle me-2"></i>
                                <span class="text-truncate" style="max-width: 100px;">${doc.author || 'Unknown'}</span>
                            </div>
                            <small class="text-muted"><i class="fas fa-download me-1"></i> PDF</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function setupDocFilters() {
        const search = document.getElementById('searchDocInput');
        const category = document.getElementById('categoryDocFilter');
        const resetBtn = document.getElementById('resetFilters');

        [search, category].forEach(el => el && el.addEventListener('input', debounce(() => loadDocs(), 300)));
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (search) search.value = '';
                if (category) category.value = '';
                loadDocs(); // Reload
            });
        }
    }

    function populateDocFilters(docs) {
        const category = document.getElementById('categoryDocFilter');
        if (!category) return;
        const categories = Array.from(new Set(docs.map(d => d.category).filter(Boolean)));
        // Preserve "All" option
        category.innerHTML = `<option value="">${window.i18n.t('docs.list.category_all')}</option>` +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

})();
