// Reusable Components JavaScript

// Loading Spinner Component
class LoadingSpinner {
    constructor(container = null) {
        this.container = container || document.body;
        this.spinner = null;
    }
    
    show(message = 'Loading...') {
        if (this.spinner) return; // Already showing
        
        this.spinner = document.createElement('div');
        this.spinner.className = 'loading-overlay';
        this.spinner.innerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
        
        this.container.appendChild(this.spinner);
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        if (this.spinner) {
            this.spinner.remove();
            this.spinner = null;
            document.body.style.overflow = '';
        }
    }
}

// Toast Notification Component - Enhanced
class Toast {
    static show(message, type = 'info', duration = 3000) {
        // Remove existing toasts if any
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        // Icon based on type
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        const autoRemove = setTimeout(() => {
            Toast.remove(toast);
        }, duration);
        
        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            Toast.remove(toast);
        });
        
        return toast;
    }
    
    static remove(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }
    
    static success(message, duration) {
        return Toast.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        return Toast.show(message, 'error', duration);
    }
    
    static warning(message, duration) {
        return Toast.show(message, 'warning', duration);
    }
    
    static info(message, duration) {
        return Toast.show(message, 'info', duration);
    }
}

// Card Component Helper
class Card {
    static create(title, content, footer = null, classes = '') {
        const card = document.createElement('div');
        card.className = `card ${classes}`;
        
        let cardHTML = `
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <div class="card-text">${content}</div>
            </div>
        `;
        
        if (footer) {
            cardHTML += `<div class="card-footer">${footer}</div>`;
        }
        
        card.innerHTML = cardHTML;
        return card;
    }
}

// Modal Component Helper
class Modal {
    static show(title, content, size = 'modal-lg', showFooter = true) {
        const modalId = 'customModal_' + Date.now();
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', modalId + 'Label');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog ${size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${modalId}Label">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${showFooter ? `
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Remove from DOM when hidden
        modal.addEventListener('hidden.bs.modal', function() {
            modal.remove();
        });
        
        return modal;
    }
}

// Export to window for global access
window.Components = {
    LoadingSpinner,
    Toast,
    Card,
    Modal
};

// Also update utils for backward compatibility
window.utils = window.utils || {};
window.utils.showToast = Toast.show;
window.utils.showSuccess = Toast.success;
window.utils.showError = Toast.error;
window.utils.showWarning = Toast.warning;
window.utils.showInfo = Toast.info;

