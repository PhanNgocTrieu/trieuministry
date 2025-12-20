// Blogs List Page
(function () {
    let allBlogs = []; // Store blogs globally for filtering

    function initBlogsPage() {
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
        if (allBlogs.length > 0) {
            renderBlogs(allBlogs);
            return;
        }

        try {
            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 5000)
            );

            // Fetch with timeout
            const response = await Promise.race([
                fetch('assets/data/blogs.json'),
                timeout
            ]);

            if (!response.ok) throw new Error('Failed to load blogs');
            const data = await response.json();

            // Ensure array
            allBlogs = Array.isArray(data.blogs) ? data.blogs : [];

            if (allBlogs.length === 0) {
                renderEmptyState();
            } else {
                renderBlogs(allBlogs);
                populateFilters(allBlogs);
            }
        } catch (err) {
            console.error('[Blogs] Error:', err);
            // Ensure error state is shown so spinner disappears
            renderEmptyState(window.i18n.t('blogs.list.error_load') + ': ' + err.message);
        }
    }

    function renderEmptyState(message) {
        const msg = message || window.i18n.t('blogs.list.empty');
        const container = document.getElementById('blogsContainer');
        const countLabel = document.getElementById('countLabel');

        if (container) {
            // This acts as hiding the spinner because it overwrites the container content
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-newspaper fa-4x text-muted mb-3 opacity-25"></i>
                    <p class="text-muted lead">${msg}</p>
                    <button class="btn btn-outline-primary mt-3" onclick="location.reload()">
                        <i class="fas fa-sync me-2"></i>Thử lại
                    </button>
                </div>
            `;
        }
        if (countLabel) countLabel.textContent = `0`;
    }

    function renderBlogs(blogs) {
        const container = document.getElementById('blogsContainer');
        const countLabel = document.getElementById('countLabel');
        if (!container) return;

        container.innerHTML = ''; // This removes the spinner

        const filtered = applyFilters(blogs);
        if (countLabel) countLabel.textContent = `${filtered.length}`;

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
        const handleFilter = debounce(() => renderBlogs(allBlogs), 200);

        ['searchInput', 'categoryFilter', 'tagFilter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', handleFilter);
            }
        });

        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                document.getElementById('categoryFilter').value = '';
                const tagFilter = document.getElementById('tagFilter');
                if (tagFilter) tagFilter.value = '';

                renderBlogs(allBlogs);
            });
        }
    }

    function populateFilters(blogs) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        // Check if options are already populated (length > 1 means more than just placeholder)
        if (categoryFilter.options.length > 1) return;

        const categories = Array.from(new Set(blogs.map(b => b.category).filter(Boolean)));
        // Preserve existing first option (placeholder)
        const placeholder = categoryFilter.options[0].outerHTML;
        categoryFilter.innerHTML = placeholder + categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function applyFilters(blogs) {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');

        // Safety check if elements are missing
        const search = (searchInput?.value || '').toLowerCase();
        const category = categoryFilter?.value || '';

        return blogs.filter(blog => {
            const matchesSearch = !search ||
                blog.title.toLowerCase().includes(search) ||
                blog.excerpt.toLowerCase().includes(search) ||
                (blog.content && blog.content.toLowerCase().includes(search));
            const matchesCategory = !category || blog.category === category;
            return matchesSearch && matchesCategory;
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
