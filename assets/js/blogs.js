// Blogs List Page
(function () {
    function initBlogsPage() {
        console.log('Blogs Page Initializing...');
        loadBlogs();
        setupFilters();
    }

    function ensureI18n(callback) {
        if (window.i18n && window.i18n.isReady) {
            callback();
        } else {
            window.addEventListener('i18nReady', callback, { once: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ensureI18n(initBlogsPage));
    } else {
        ensureI18n(initBlogsPage);
    }

    async function loadBlogs() {
        const spinner = new Components.LoadingSpinner();
        spinner.show(window.i18n.t('common.loading'));

        try {
            const res = await fetch('assets/data/blogs.json');
            if (!res.ok) throw new Error('Failed to load blogs');
            const data = await res.json();

            // Ensure array
            const blogs = Array.isArray(data.blogs) ? data.blogs : [];

            if (blogs.length === 0) {
                renderEmptyState();
            } else {
                renderBlogs(blogs);
                populateFilters(blogs);
            }
        } catch (err) {
            console.error(err);
            Components.Toast.error(window.i18n.t('blogs.list.error_load'));
            renderEmptyState(window.i18n.t('blogs.list.error_load'));
        } finally {
            spinner.hide();
        }
    }

    function renderEmptyState(message) {
        const msg = message || window.i18n.t('blogs.list.empty');
        const container = document.getElementById('blogsContainer');
        const countLabel = document.getElementById('countLabel');

        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-newspaper fa-4x text-muted mb-3 opacity-25"></i>
                    <p class="text-muted lead">${msg}</p>
                </div>
            `;
        }
        if (countLabel) countLabel.textContent = `0 ${window.i18n.t('blogs.list.count_suffix')}`;
    }

    function renderBlogs(blogs) {
        const container = document.getElementById('blogsContainer');
        const countLabel = document.getElementById('countLabel');
        if (!container) return;

        container.innerHTML = '';

        const filtered = applyFilters(blogs);
        if (countLabel) countLabel.textContent = `${filtered.length} ${window.i18n.t('blogs.list.count_suffix')}`;

        if (filtered.length === 0) {
            renderEmptyState(window.i18n.t('blogs.list.empty_filtered'));
            return;
        }

        filtered.forEach(blog => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';

            const card = document.createElement('div');
            card.className = 'card h-100 shadow-sm';
            card.innerHTML = `
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-light text-dark border">${blog.category || 'General'}</span>
                        <small class="text-muted"><i class="fas fa-clock me-1"></i>${blog.readingTime || 3} ${window.i18n.t('blogs.list.min_read')}</small>
                    </div>
                    <h5 class="card-title fw-bold text-primary">${blog.title}</h5>
                    <p class="card-text text-muted flex-grow-1">${blog.excerpt}</p>
                    <div class="mt-3 pt-3 border-top">
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            ${(blog.tags || []).map(t => `<span class="badge bg-secondary-subtle text-dark border">${t}</span>`).join('')}
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted"><i class="fas fa-calendar me-1"></i>${blog.date}</small>
                            <a class="btn btn-sm btn-outline-primary rounded-pill px-3" href="blog-detail.html?slug=${blog.slug}">${window.i18n.t('blogs.list.read_more')}</a>
                        </div>
                    </div>
                </div>
            `;

            col.appendChild(card);
            container.appendChild(col);
        });
    }

    function setupFilters() {
        ['searchInput', 'categoryFilter', 'tagFilter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', debounce(loadBlogs, 200));
            }
        });
    }

    function populateFilters(blogs) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const categories = Array.from(new Set(blogs.map(b => b.category).filter(Boolean)));
        categoryFilter.innerHTML = `<option value="">${window.i18n.t('blogs.list.category_all')}</option>` + categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function applyFilters(blogs) {
        const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
        const category = document.getElementById('categoryFilter')?.value || '';
        const tag = (document.getElementById('tagFilter')?.value || '').toLowerCase();

        return blogs.filter(blog => {
            const matchesSearch = !search ||
                blog.title.toLowerCase().includes(search) ||
                blog.excerpt.toLowerCase().includes(search) ||
                (blog.content && blog.content.toLowerCase().includes(search));
            const matchesCategory = !category || blog.category === category;
            const matchesTag = !tag || (blog.tags || []).some(t => t.toLowerCase().includes(tag));
            return matchesSearch && matchesCategory && matchesTag;
        });
    }

    function debounce(fn, delay = 200) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
})();
