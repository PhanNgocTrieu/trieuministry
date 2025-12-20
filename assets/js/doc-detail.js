// Document Detail Page Logic
(function () {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    document.addEventListener('DOMContentLoaded', () => ensureI18n(() => {
        if (!docId) {
            showError(window.i18n.t('docs.detail.error_id'));
            return;
        }
        loadDocDetails(docId);
    }));

    function ensureI18n(callback) {
        if (window.i18n && window.i18n.isReady) {
            callback();
        } else {
            window.addEventListener('i18nReady', callback, { once: true });
        }
    }

    async function loadDocDetails(id) {
        try {
            const res = await fetch('assets/data/docs.json');
            if (!res.ok) throw new Error('Failed to load docs data');
            const data = await res.json();
            window.allDocs = data.documents || [];

            const doc = data.documents.find(d => d.id === id);

            if (!doc) {
                showError(window.i18n.t('docs.detail.error_not_found'));
                return;
            }

            renderDoc(doc);
        } catch (error) {
            console.error(error);
            showError(window.i18n.t('docs.detail.error_fetch'));
        }
    }

    function renderDoc(doc) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('docDetailContainer').style.display = 'block';

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
            img.src = doc.thumbnail || 'assets/images/docs/default.jpg';
            img.onerror = () => { img.src = 'assets/images/docs/default.jpg'; };
        }

        // Listen for language change to update description
        window.addEventListener('languageChanged', () => updateDescription(doc));
    }

    function updateDescription(doc) {
        let descText = '';
        if (typeof doc.description === 'object' && doc.description !== null) {
            const currentLang = window.i18n ? window.i18n.currentLang : 'vi';
            descText = doc.description[currentLang] || doc.description['vi'] || '';
        } else {
            descText = doc.description || '';
        }
        setText('docDescription', descText || 'No description available.');
    }

    // Download Button
    const btn = document.getElementById('downloadBtn');
    if (btn) {
        btn.onclick = () => {
            downloadFile(doc.path, doc.title);
        };
    }

    // Navigation Logic
    setupNavigation(doc.id, window.allDocs);

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
            }
        }

        if (index < docs.length - 1) {
            const nextDoc = docs[index + 1];
            if (nextBtn) {
                nextBtn.href = `doc-detail.html?id=${nextDoc.id}`;
                nextBtn.style.visibility = 'visible';
                nextBtn.title = nextDoc.title;
            }
        }
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
