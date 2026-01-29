// 📁 /scripts/ui.js - COMPLETE NEW FILE
import { logout } from './session.js'

// Initialize UI components
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu()
    initModals()
    
    // Only init logout on pages that have logout buttons (not login/signup)
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('signup.html')) {
        initLogoutButtons()
    }
    
    initTableScrollIndicators()
})

// ===== MOBILE MENU =====
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
            document.body.style.overflow = 'hidden'
        }, 10)
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
    
    // Close when clicking outside
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            closeMobileMenu()
        }
    })
    
    // Close with Escape key
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

// ===== MODALS =====
function initModals() {
    // Open modals
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal')
            document.getElementById(modalId).style.display = 'flex'
        })
    })
    
    // Close modals
    document.querySelectorAll('[data-close]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-close')
            document.getElementById(modalId).style.display = 'none'
        })
    })
    
    // Close when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none'
            }
        })
    })
    
    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none'
            })
        }
    })
}

// ===== TABLE SCROLL =====
function initTableScrollIndicators() {
    const tables = document.querySelectorAll('.table-wrap')
    tables.forEach(table => {
        if (table.scrollWidth > table.clientWidth && window.innerWidth <= 768) {
            table.classList.add('scrollable')
        }
    })
    window.addEventListener('resize', initTableScrollIndicators)
}
