// Docs Page Logic
(function () {
    // State variables (Scoped to this execution context)
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let scale = 1.0;
    const scaleDelta = 0.2;

    function initDocsPage() {
        console.log('Docs Page Initializing...');
        loadDocs();
        setupDocFilters();
    }

    // Auto-init logic
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDocsPage);
    } else {
        initDocsPage();
    }

    async function loadDocs() {
        const spinner = new Components.LoadingSpinner();
        spinner.show('Đang tải tài liệu...');

        try {
            const res = await fetch('assets/data/docs.json');
            if (!res.ok) throw new Error('Failed to load docs');
            const data = await res.json();

            // Ensure array
            const docs = Array.isArray(data.documents) ? data.documents : [];

            if (docs.length === 0) {
                renderEmptyState();
            } else {
                renderDocs(docs);
                populateDocFilters(docs);
            }
        } catch (err) {
            console.error(err);
            Components.Toast.error('Không tải được danh sách tài liệu');
            renderEmptyState('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        } finally {
            spinner.hide();
        }
    }

    function renderEmptyState(message = 'Hiện không có dữ liệu.') {
        const container = document.getElementById('docsContainer');
        const countLabel = document.getElementById('docsCountLabel');

        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-folder-open fa-4x text-muted mb-3 opacity-25"></i>
                    <p class="text-muted lead">${message}</p>
                </div>
            `;
        }
        if (countLabel) countLabel.textContent = '0 tài liệu';
    }

    function renderDocs(docs) {
        const container = document.getElementById('docsContainer');
        const countLabel = document.getElementById('docsCountLabel');
        if (!container) return;
        container.innerHTML = '';

        const filtered = applyDocFilters(docs);
        if (countLabel) countLabel.textContent = `${filtered.length} tài liệu`;

        if (filtered.length === 0) {
            renderEmptyState('Không tìm thấy tài liệu phù hợp.');
            return;
        }

        filtered.forEach(doc => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';

            const card = document.createElement('div');
            card.className = 'card h-100 shadow-sm';
            // Note: We use window.previewDoc and window.downloadDoc in onclick
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

    // --- PDF Logic ---

    // Expose Global Functions for HTML onClick
    window.previewDoc = function (pathEncoded, titleEncoded) {
        const path = decodeURIComponent(pathEncoded);
        const title = decodeURIComponent(titleEncoded);
        const modalTitle = document.getElementById('pdfPreviewTitle');
        const downloadBtn = document.getElementById('downloadFromModal');
        const canvasContainer = document.getElementById('pdfCanvasContainer');
        const iframe = document.getElementById('pdfPreviewFrame');
        const loading = document.getElementById('pdfLoading');

        if (modalTitle) modalTitle.textContent = title || 'Xem trước tài liệu';
        if (downloadBtn) downloadBtn.href = path;

        // Reset state
        pageNum = 1;
        scale = 1.0;
        pdfDoc = null;

        // Show loading, hide others
        if (loading) loading.style.display = 'block';
        if (canvasContainer) canvasContainer.style.display = 'none';
        if (iframe) iframe.style.display = 'none';

        // Setup fullscreen button
        setupFullscreenButton();

        const modalEl = document.getElementById('pdfPreviewModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('shown.bs.modal', () => {
                loadPDF(path);
            });
        }
    };

    window.downloadDoc = function (pathEncoded) {
        const path = decodeURIComponent(pathEncoded);
        incrementDownloadCount(path);
        const link = document.createElement('a');
        link.href = path;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        link.remove();
        Components.Toast.success('Đã bắt đầu tải xuống');
    };

    async function loadPDF(path) {
        const loading = document.getElementById('pdfLoading');
        const canvasContainer = document.getElementById('pdfCanvasContainer');
        const iframe = document.getElementById('pdfPreviewFrame');

        try {
            // Wait for PDF.js to be available
            let retries = 0;
            while (typeof pdfjsLib === 'undefined' && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded. Please refresh the page.');
            }

            // Set up PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            // Use absolute URL if needed (for GitHub Pages)
            let pdfPath = path;
            if (!path.startsWith('http')) {
                // If path is relative, make it absolute
                pdfPath = path.startsWith('/') ? path : '/' + path;
            }

            // Load PDF
            const loadingTask = pdfjsLib.getDocument({
                url: pdfPath,
                httpHeaders: {},
                withCredentials: false
            });

            pdfDoc = await loadingTask.promise;

            // Hide loading, show canvas
            if (loading) loading.style.display = 'none';
            if (canvasContainer) canvasContainer.style.display = 'block';

            // Update page count
            const pageCountEl = document.getElementById('pageCount');
            if (pageCountEl) pageCountEl.textContent = pdfDoc.numPages;

            // Render first page
            renderPage(pageNum);

            // Setup controls
            setupPDFControls();

        } catch (error) {
            console.error('Error loading PDF:', error);

            // Hide loading
            if (loading) loading.style.display = 'none';

            // Show error message
            const errorMsg = error.message || 'Không thể tải PDF';
            Components.Toast.error(errorMsg);

            // Fallback to iframe with direct PDF link
            if (iframe) {
                iframe.src = path;
                iframe.style.display = 'block';
                iframe.setAttribute('allowfullscreen', 'true');
            }
        }
    }

    function renderPage(num) {
        if (!pdfDoc) {
            console.error('PDF document not loaded');
            return;
        }

        pageRendering = true;

        pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.getElementById('pdfCanvas');

            if (!canvas) {
                console.error('Canvas element not found');
                pageRendering = false;
                return;
            }

            const ctx = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }

                // Update page number
                const pageNumEl = document.getElementById('pageNum');
                const zoomLevelEl = document.getElementById('zoomLevel');
                if (pageNumEl) pageNumEl.textContent = num;
                if (zoomLevelEl) zoomLevelEl.textContent = Math.round(scale * 100) + '%';
            }).catch((error) => {
                console.error('Error rendering page:', error);
                pageRendering = false;
                Components.Toast.error('Lỗi khi render trang PDF');
            });
        }).catch((error) => {
            console.error('Error getting page:', error);
            pageRendering = false;
            Components.Toast.error('Lỗi khi tải trang PDF');
        });
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    function setupPDFControls() {
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const fitWidthBtn = document.getElementById('fitWidth');

        if (prevPageBtn) {
            // Remove old listeners? No need if elements are new.
            // But if elements are reused, we might stack listeners.
            // With SPA swapping <main>, elements are new.
            prevPageBtn.onclick = () => { // Use onclick to overwrite prev listener if any
                if (pageNum <= 1) return;
                pageNum--;
                queueRenderPage(pageNum);
            };
        }

        if (nextPageBtn) {
            nextPageBtn.onclick = () => {
                if (pageNum >= pdfDoc.numPages) return;
                pageNum++;
                queueRenderPage(pageNum);
            };
        }

        if (zoomInBtn) {
            zoomInBtn.onclick = () => {
                scale += scaleDelta;
                queueRenderPage(pageNum);
            };
        }

        if (zoomOutBtn) {
            zoomOutBtn.onclick = () => {
                if (scale <= scaleDelta) return;
                scale -= scaleDelta;
                queueRenderPage(pageNum);
            };
        }

        if (fitWidthBtn) {
            fitWidthBtn.onclick = () => {
                pdfDoc.getPage(pageNum).then((page) => {
                    const container = document.querySelector('.pdf-canvas-wrapper');
                    const containerWidth = container.clientWidth - 40; // padding
                    const viewport = page.getViewport({ scale: 1.0 });
                    scale = containerWidth / viewport.width;
                    queueRenderPage(pageNum);
                });
            };
        }
    }

    function setupFullscreenButton() {
        // ... simplified for brevity, similar refactor ...
        // Keeping it simple as it is just UI logic
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const modal = document.getElementById('pdfPreviewModal');

        if (!fullscreenBtn) return;

        fullscreenBtn.onclick = () => {
            if (!document.fullscreenElement) {
                const modalContent = modal?.querySelector('.modal-content');
                if (modalContent?.requestFullscreen) modalContent.requestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        };
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

})();
