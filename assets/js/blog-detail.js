// Blog Detail Page

document.addEventListener('DOMContentLoaded', () => {
    initBlogDetail();
});

async function initBlogDetail() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    if (!slug) {
        renderError('Không tìm thấy bài viết.');
        return;
    }

    const spinner = new Components.LoadingSpinner();
    spinner.show('Đang tải bài viết...');

    try {
        const res = await fetch('assets/data/blogs.json');
        if (!res.ok) throw new Error('Failed to load blogs');
        const data = await res.json();
        const blogs = data.blogs || [];
        const index = blogs.findIndex(b => b.slug === slug);
        if (index === -1) {
            renderError('Bài viết không tồn tại.');
            return;
        }

        const blog = blogs[index];
        renderBlog(blog);
        renderPrevNext(blogs, index);
        renderRelated(blogs, blog);
        setupShare(blog);
        setupPrint();
        setupProgress();
    } catch (err) {
        console.error(err);
        renderError('Không tải được bài viết.');
    } finally {
        spinner.hide();
    }
}

function renderBlog(blog) {
    document.getElementById('blogTitle').textContent = blog.title;
    document.getElementById('blogAuthor').textContent = blog.author;
    document.getElementById('blogDate').textContent = blog.date;
    document.getElementById('blogReadingTime').textContent = `${blog.readingTime || 3} phút đọc`;
    document.getElementById('blogCategory').textContent = blog.category || 'General';

    const img = document.getElementById('blogImage');
    img.src = blog.image || '';
    img.alt = blog.title;

    const contentEl = document.getElementById('blogContent');
    contentEl.innerHTML = blog.content || '';

    const tagsEl = document.getElementById('blogTags');
    tagsEl.innerHTML = (blog.tags || []).map(t => `<span class="badge bg-secondary me-2">${t}</span>`).join('');
}

function renderPrevNext(blogs, index) {
    const nav = document.getElementById('prevNextNav');
    const prev = blogs[index - 1];
    const next = blogs[index + 1];
    let html = '';
    if (prev) {
        html += `<a class="btn btn-outline-secondary" href="blog-detail.html?slug=${prev.slug}">&laquo; ${prev.title}</a>`;
    }
    if (next) {
        html += `<a class="btn btn-outline-primary" href="blog-detail.html?slug=${next.slug}">${next.title} &raquo;</a>`;
    }
    nav.innerHTML = html;
}

function renderRelated(blogs, blog) {
    const relatedEl = document.getElementById('relatedPosts');
    if (!relatedEl) return;
    const related = blogs.filter(b => b.slug !== blog.slug && b.category === blog.category).slice(0, 3);
    if (!related.length) {
        relatedEl.innerHTML = '<small class="text-muted">Chưa có bài liên quan.</small>';
        return;
    }
    relatedEl.innerHTML = related.map(r => `
        <div class="related-item">
            <a href="blog-detail.html?slug=${r.slug}" class="fw-semibold text-decoration-none">${r.title}</a>
            <div class="text-muted small">${r.date}</div>
        </div>
    `).join('');
}

function setupShare(blog) {
    const shareBtn = document.getElementById('shareBtn');
    if (!shareBtn) return;
    shareBtn.addEventListener('click', async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: blog.title, text: blog.excerpt || blog.title, url });
            } catch (e) {
                // user canceled
            }
        } else {
            navigator.clipboard.writeText(url);
            Components.Toast.success('Đã copy liên kết');
        }
    });
}

function setupPrint() {
    const btn = document.getElementById('printBtn');
    if (!btn) return;
    btn.addEventListener('click', () => window.print());
}

function setupProgress() {
    const progress = document.getElementById('readingProgress');
    const article = document.getElementById('blogContent');
    if (!progress || !article) return;

    function update() {
        const total = article.scrollHeight - window.innerHeight;
        const scrolled = window.pageYOffset - (article.offsetTop - 80);
        const percent = Math.min(100, Math.max(0, (scrolled / total) * 100));
        progress.style.width = `${percent}%`;
    }

    window.addEventListener('scroll', update);
    update();
}

function renderError(message) {
    const main = document.querySelector('main');
    if (!main) return;
    main.innerHTML = `<div class="container py-5"><div class="alert alert-danger">${message}</div></div>`;
}

