// UI Utilities - Mobile Menu, Modals, Animations
import { logout } from './session.js'

// Initialize all UI components
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu()
    initModals()
    initLogoutButtons()
    initTableScrollIndicators()
})

// ============================================
// MOBILE MENU FUNCTIONALITY
// ============================================
function initMobileMenu() {
    const openMenuBtn = document.getElementById('openMenu')
    const closeMenuBtn = document.getElementById('closeMenu')
    const mobileMenu = document.getElementById('mobileMenu')
    
    if (!openMenuBtn || !mobileMenu) return
    
    // Open mobile menu
    openMenuBtn.addEventListener('click', () => {
        mobileMenu.style.display = 'block'
        setTimeout(() => {
            mobileMenu.style.opacity = '1'
        }, 10)
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden'
    })
    
    // Close mobile menu
    function closeMobileMenu() {
        mobileMenu.style.opacity = '0'
        setTimeout(() => {
            mobileMenu.style.display = 'none'
            document.body.style.overflow = ''
        }, 200)
    }
    
    // Close button
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMobileMenu)
    }
    
    // Close when clicking outside menu content
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            closeMobileMenu()
        }
    })
    
    // Close when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.style.display === 'block') {
            closeMobileMenu()
        }
    })
}

// ============================================
// MODAL MANAGEMENT
// ============================================
function initModals() {
    // Open modals via data-modal attribute
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal')
            openModal(modalId)
        })
    })
    
    // Close modals via data-close attribute
    document.querySelectorAll('[data-close]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-close')
            closeModal(modalId)
        })
    })
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none'
            }
        })
    })
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none'
            })
        }
    })
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.style.display = 'flex'
        
        // Trigger animation
        setTimeout(() => {
            modal.style.opacity = '1'
        }, 10)
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.style.opacity = '0'
        setTimeout(() => {
            modal.style.display = 'none'
        }, 200)
    }
}

// ============================================
// TABLE SCROLL INDICATORS (Mobile)
// ============================================
function initTableScrollIndicators() {
    const tables = document.querySelectorAll('.table-wrap')
    
    tables.forEach(table => {
        if (table.scrollWidth > table.clientWidth) {
            // Add scroll indicator for mobile
            if (window.innerWidth <= 768) {
                table.classList.add('scrollable')
            }
        }
    })
    
    // Update on resize
    window.addEventListener('resize', initTableScrollIndicators)
}

// ============================================
// FORM VALIDATION HELPERS
// ============================================
export function validateForm(formId) {
    const form = document.getElementById(formId)
    if (!form) return true
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]')
    let isValid = true
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error')
            isValid = false
            
            // Add error message
            if (!input.nextElementSibling?.classList.contains('error-message')) {
                const error = document.createElement('div')
                error.className = 'error-message'
                error.textContent = 'This field is required'
                error.style.color = '#dc2626'
                error.style.fontSize = '0.8rem'
                error.style.marginTop = '0.25rem'
                input.parentNode.insertBefore(error, input.nextSibling)
            }
        } else {
            input.classList.remove('error')
            const error = input.nextElementSibling
            if (error?.classList.contains('error-message')) {
                error.remove()
            }
        }
    })
    
    return isValid
}

// ============================================
// LOADING STATES
// ============================================
export function showLoading(button) {
    if (!button) return
    
    button.classList.add('loading')
    button.disabled = true
    
    // Store original text
    const originalText = button.innerHTML
    button.setAttribute('data-original-text', originalText)
    
    // Add spinner
    button.innerHTML = `
        <span class="loading-spinner"></span>
        <span style="margin-left: 0.5rem;">Processing...</span>
    `
}

export function hideLoading(button) {
    if (!button) return
    
    button.classList.remove('loading')
    button.disabled = false
    
    // Restore original text
    const originalText = button.getAttribute('data-original-text')
    if (originalText) {
        button.innerHTML = originalText
    }
}

// ============================================
// NOTIFICATION TOASTS
// ============================================
export function showToast(message, type = 'success') {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: ${type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#e0f2fe'};
        color: ${type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#0369a1'};
        padding: 0.75rem 1rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        border: 1px solid ${type === 'success' ? '#bbf7d0' : type === 'error' ? '#fecaca' : '#bae6fd'};
    `
    
    document.body.appendChild(toast)
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease'
        setTimeout(() => toast.remove(), 300)
    }, 3000)
    
    // Add animations
    const style = document.createElement('style')
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `
    document.head.appendChild(style)
}

// ============================================
// PAYMENT METHODS UI
// ============================================
export function initPaymentMethods() {
    // GCash QR Code
    const gcashButtons = document.querySelectorAll('[data-gcash]')
    gcashButtons.forEach(button => {
        button.addEventListener('click', () => {
            openModal('gcashModal')
        })
    })
    
    // SMS Payment
    const smsButtons = document.querySelectorAll('[data-sms]')
    smsButtons.forEach(button => {
        button.addEventListener('click', () => {
            const phone = button.getAttribute('data-phone') || '09171234567'
            const message = `PAY ${button.getAttribute('data-amount') || '0'}`
            window.open(`sms:${phone}&body=${encodeURIComponent(message)}`, '_blank')
        })
    })
}

// ============================================
// RESPONSIVE HELPERS
// ============================================
export function isMobile() {
    return window.innerWidth <= 768
}

export function isDesktop() {
    return window.innerWidth > 768
}

// Initialize on window load
window.addEventListener('load', () => {
    // Add loaded class for transition animations
    document.body.classList.add('loaded')
    
    // Initialize payment methods if present
    if (document.querySelector('[data-gcash]') || document.querySelector('[data-sms]')) {
        initPaymentMethods()
    }
})
