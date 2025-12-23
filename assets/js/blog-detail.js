// Blog Detail Page

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogDetail);
} else {
    initBlogDetail();
}

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

    document.getElementById('blogCategory').textContent = blog.category || 'General';

    const contentEl = document.getElementById('blogContent');
    contentEl.innerHTML = blog.content || '<p class="text-muted fst-italic">Nội dung đang cập nhật...</p>';

    const tagsEl = document.getElementById('blogTags');
    tagsEl.innerHTML = (blog.tags || []).map(t => `<span class="badge bg-secondary-subtle text-dark border me-2">${t}</span>`).join('');

    // Update Facebook Comments URL
    const commentsPlugin = document.querySelector('.fb-comments');
    if (commentsPlugin) {
        commentsPlugin.setAttribute('data-href', window.location.href);
        // Re-parse Facebook plugins if FB SDK is loaded
        if (window.FB && window.FB.XFBML) {
            window.FB.XFBML.parse();
        }
    }
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
            try {
                await navigator.clipboard.writeText(url);
                // Requires Components.Toast or alert
                if (window.Components && window.Components.Toast) {
                    window.Components.Toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
                } else {
                    alert('Đã sao chép liên kết: ' + url);
                }
            } catch (err) {
                prompt('Copy liên kết này:', url);
            }
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

