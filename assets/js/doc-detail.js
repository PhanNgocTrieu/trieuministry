// Document Detail Page Logic
(function () {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');

    document.addEventListener('DOMContentLoaded', () => {
        if (!docId) {
            showError('Không tìm thấy ID tài liệu.');
            return;
        }
        loadDocDetails(docId);
    });

    async function loadDocDetails(id) {
        try {
            const res = await fetch('assets/data/docs.json');
            if (!res.ok) throw new Error('Failed to load docs data');
            const data = await res.json();

            const doc = data.documents.find(d => d.id === id);

            if (!doc) {
                showError('Không tìm thấy tài liệu này.');
                return;
            }

            renderDoc(doc);
        } catch (error) {
            console.error(error);
            showError('Đã xảy ra lỗi khi tải thông tin tài liệu.');
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
        setText('docDescription', doc.description || 'No description available.');
        setText('docSize', doc.size || '—');
        setText('docDate', doc.uploadDate || '—');
        setText('docLang', doc.language || 'Tiếng Việt');

        // Image
        const img = document.getElementById('docCover');
        if (img) {
            img.src = doc.thumbnail || 'assets/images/docs/default.jpg';
            img.onerror = () => { img.src = 'assets/images/docs/default.jpg'; };
        }

        // Download Button
        const btn = document.getElementById('downloadBtn');
        if (btn) {
            btn.onclick = () => {
                downloadFile(doc.path, doc.title);
            };
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
