// UI Utilities - Mobile Menu, Modals, Animations
import { logout } from './session.js'

// Initialize all UI components
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu()
    initModals()
    
    // Only init logout buttons if we're not on login/signup pages
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('signup.html')) {
        initLogoutButtons()
    }
    
    initTableScrollIndicators()
})

// ===== MOBILE MENU FUNCTIONALITY =====
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

// ===== LOGOUT BUTTONS =====
function initLogoutButtons() {
    // Desktop logout
    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout)
    }
    
    // Mobile logout
    const mobileLogout = document.getElementById('mobileLogout')
    if (mobileLogout) {
        mobileLogout.addEventListener('click', logout)
    }
}

// ===== MODAL MANAGEMENT =====
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

function openModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.style.display = 'flex'
        
        // Trigger animation
        setTimeout(() => {
            modal.style.opacity = '1'
        }, 10)
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
        modal.style.opacity = '0'
        setTimeout(() => {
            modal.style.display = 'none'
        }, 200)
    }
}

// ===== TABLE SCROLL INDICATORS (Mobile) =====
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

// ===== LOADING STATES =====
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

// ===== NOTIFICATION TOASTS =====
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
