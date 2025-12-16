// Docs Page Logic

document.addEventListener('DOMContentLoaded', () => {
    loadDocs();
    setupDocFilters();
});

async function loadDocs() {
    const spinner = new Components.LoadingSpinner();
    spinner.show('Đang tải tài liệu...');

    try {
        const res = await fetch('assets/data/docs.json');
        if (!res.ok) throw new Error('Failed to load docs');
        const data = await res.json();
        renderDocs(data.documents || []);
        populateDocFilters(data.documents || []);
    } catch (err) {
        console.error(err);
        Components.Toast.error('Không tải được danh sách tài liệu');
    } finally {
        spinner.hide();
    }
}

function renderDocs(docs) {
    const container = document.getElementById('docsContainer');
    const countLabel = document.getElementById('docsCountLabel');
    if (!container) return;
    container.innerHTML = '';

    const filtered = applyDocFilters(docs);
    if (countLabel) countLabel.textContent = `${filtered.length} tài liệu`;

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-muted">Chưa có tài liệu phù hợp.</p>';
        return;
    }

    filtered.forEach(doc => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm';
        card.innerHTML = `
            <div class="doc-thumb-wrapper">
                <img src="${doc.thumbnail || ''}" alt="${doc.title}" class="card-img-top doc-thumb" onerror="this.src='https://via.placeholder.com/600x360?text=PDF'">
                <span class="doc-badge">${doc.category || 'General'}</span>
            </div>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${doc.title}</h5>
                <p class="card-text text-muted">${doc.description || ''}</p>
                <div class="mt-auto d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div class="text-muted small">
                        <i class="fas fa-file-pdf me-1"></i>${doc.size || '—'}<br>
                        <i class="fas fa-calendar me-1"></i>${doc.uploadDate || ''}
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="previewDoc('${encodeURIComponent(doc.path)}', '${encodeURIComponent(doc.title)}')"><i class="fas fa-eye me-1"></i>Preview</button>
                        <button class="btn btn-sm btn-primary" onclick="downloadDoc('${encodeURIComponent(doc.path)}')"><i class="fas fa-download me-1"></i>Download</button>
                    </div>
                </div>
            </div>
        `;

        col.appendChild(card);
        container.appendChild(col);
    });
}

function setupDocFilters() {
    const search = document.getElementById('searchDocInput');
    const category = document.getElementById('categoryDocFilter');
    const resetBtn = document.getElementById('resetFilters');

    [search, category].forEach(el => el && el.addEventListener('input', debounce(loadDocs, 200)));
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (search) search.value = '';
            if (category) category.value = '';
            loadDocs();
        });
    }
}

function populateDocFilters(docs) {
    const category = document.getElementById('categoryDocFilter');
    if (!category) return;
    const categories = Array.from(new Set(docs.map(d => d.category).filter(Boolean)));
    category.innerHTML = '<option value=\"\">Tất cả</option>' + categories.map(c => `<option value=\"${c}\">${c}</option>`).join('');
}

function applyDocFilters(docs) {
    const search = (document.getElementById('searchDocInput')?.value || '').toLowerCase();
    const category = document.getElementById('categoryDocFilter')?.value || '';

    return docs.filter(doc => {
        const matchesSearch = !search ||
            doc.title.toLowerCase().includes(search) ||
            (doc.description && doc.description.toLowerCase().includes(search));
        const matchesCategory = !category || doc.category === category;
        return matchesSearch && matchesCategory;
    });
}

function previewDoc(pathEncoded, titleEncoded) {
    const path = decodeURIComponent(pathEncoded);
    const title = decodeURIComponent(titleEncoded);
    const modalTitle = document.getElementById('pdfPreviewTitle');
    const iframe = document.getElementById('pdfPreviewFrame');
    const downloadBtn = document.getElementById('downloadFromModal');
    const modalBody = document.getElementById('pdfModalBody');

    if (modalTitle) modalTitle.textContent = title || 'Xem trước tài liệu';
    if (downloadBtn) downloadBtn.href = path;

    // Use PDF.js viewer for better preview (works when served via http/https)
    // PDF.js viewer already includes: zoom controls, page navigation, fullscreen, download, etc.
    const fullUrl = `${window.location.origin}/${path}`;
    const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(fullUrl)}`;
    
    if (iframe) {
        iframe.src = viewerUrl;
        // Ensure iframe can go fullscreen
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('webkitallowfullscreen', 'true');
        iframe.setAttribute('mozallowfullscreen', 'true');
    }

    // Setup fullscreen button
    setupFullscreenButton();

    const modalEl = document.getElementById('pdfPreviewModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        
        // Reset iframe size when modal is shown
        modalEl.addEventListener('shown.bs.modal', () => {
            if (iframe && modalBody) {
                // Set iframe height based on viewport
                const vh = window.innerHeight * 0.8;
                iframe.style.height = `${vh}px`;
            }
        });
    }
}

function setupFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const iframe = document.getElementById('pdfPreviewFrame');
    const modal = document.getElementById('pdfPreviewModal');
    
    if (!fullscreenBtn || !iframe) return;

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
            // Enter fullscreen
            const modalContent = modal?.querySelector('.modal-content');
            if (modalContent) {
                if (modalContent.requestFullscreen) {
                    modalContent.requestFullscreen();
                } else if (modalContent.webkitRequestFullscreen) {
                    modalContent.webkitRequestFullscreen();
                } else if (modalContent.mozRequestFullScreen) {
                    modalContent.mozRequestFullScreen();
                } else if (modalContent.msRequestFullscreen) {
                    modalContent.msRequestFullscreen();
                }
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    });

    // Update button icon based on fullscreen state
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
    document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

    function updateFullscreenIcon() {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
        const icon = fullscreenBtn.querySelector('i');
        if (icon) {
            icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
        }
    }
}

function downloadDoc(pathEncoded) {
    const path = decodeURIComponent(pathEncoded);
    incrementDownloadCount(path);
    const link = document.createElement('a');
    link.href = path;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
    Components.Toast.success('Đã bắt đầu tải xuống');
}

function incrementDownloadCount(path) {
    const key = 'docDownloads';
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    data[path] = (data[path] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(data));
}

function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

