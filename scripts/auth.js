// Authentication Logic - Login & Signup with Flip Transition
import { supabase } from './supabase.js'
import { showLoading, hideLoading, showToast } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
    // Redirect to dashboard if already logged in
    checkAuthStatus()
    
    // Initialize all auth components
    initFlipTransition()
    initPasswordToggles()
    initModals()
    initLogin()
    initSignup()
})

// ============================================
// CHECK AUTH STATUS
// ============================================
async function checkAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
        // If on login page, redirect to dashboard
        if (window.location.pathname.includes('login.html')) {
            window.location.href = '/index.html'
        }
    }
}

// ============================================
// FLIP TRANSITION BETWEEN LOGIN/SIGNUP
// ============================================
function initFlipTransition() {
    const authContainer = document.querySelector('.auth-container')
    const goToSignup = document.getElementById('goToSignup')
    const goToLogin = document.getElementById('goToLogin')
    
    if (!authContainer) return
    
    // Flip to signup
    if (goToSignup) {
        goToSignup.addEventListener('click', (e) => {
            e.preventDefault()
            authContainer.classList.add('flipped')
        })
    }
    
    // Flip to login
    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault()
            authContainer.classList.remove('flipped')
        })
    }
}

// ============================================
// PASSWORD VISIBILITY TOGGLE
// ============================================
function initPasswordToggles() {
    // Login password toggle
    const toggleLoginPassword = document.getElementById('toggleLoginPassword')
    const loginPassword = document.getElementById('loginPassword')
    
    if (toggleLoginPassword && loginPassword) {
        toggleLoginPassword.addEventListener('click', () => {
            loginPassword.type = loginPassword.type === 'password' ? 'text' : 'password'
            toggleLoginPassword.textContent = loginPassword.type === 'password' ? '👁' : '👁️‍🗨️'
        })
    }
    
    // Signup password toggle
    const toggleSignupPassword = document.getElementById('toggleSignupPassword')
    const signupPassword = document.getElementById('signupPassword')
    
    if (toggleSignupPassword && signupPassword) {
        toggleSignupPassword.addEventListener('click', () => {
            signupPassword.type = signupPassword.type === 'password' ? 'text' : 'password'
            toggleSignupPassword.textContent = signupPassword.type === 'password' ? '👁' : '👁️‍🗨️'
        })
    }
}

// ============================================
// TERMS & PRIVACY MODALS
// ============================================
function initModals() {
    // Terms modal
    const termsLinks = document.querySelectorAll('.terms-link[data-modal="termsModal"]')
    termsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            document.getElementById('termsModal').style.display = 'flex'
        })
    })
    
    // Privacy modal
    const privacyLinks = document.querySelectorAll('.terms-link[data-modal="privacyModal"]')
    privacyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            document.getElementById('privacyModal').style.display = 'flex'
        })
    })
    
    // Close buttons
    document.querySelectorAll('[data-close]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-close')
            document.getElementById(modalId).style.display = 'none'
        })
    })
    
    // Close on outside click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none'
            }
        })
    })
}

// ============================================
// LOGIN FUNCTIONALITY
// ============================================
function initLogin() {
    const loginBtn = document.getElementById('loginBtn')
    if (!loginBtn) return
    
    loginBtn.addEventListener('click', handleLogin)
    
    // Also allow Enter key in form
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !document.querySelector('.auth-container').classList.contains('flipped')) {
            handleLogin()
        }
    })
}

async function handleLogin() {
    const loginBtn = document.getElementById('loginBtn')
    const email = document.getElementById('loginEmail')?.value.trim()
    const password = document.getElementById('loginPassword')?.value
    
    // Validation
    if (!email || !password) {
        showToast('Please enter email and password', 'error')
        return
    }
    
    // Show loading state
    showLoading(loginBtn)
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        
        if (error) {
            throw error
        }
        
        // Show loading modal
        showLoadingModal()
        
        // Wait 5-10 seconds before redirect
        const delay = 5000 + Math.random() * 5000 // 5-10 seconds
        setTimeout(() => {
            window.location.href = '/index.html'
        }, delay)
        
    } catch (error) {
        console.error('Login error:', error)
        showToast(error.message || 'Login failed. Please check your credentials.', 'error')
        hideLoading(loginBtn)
    }
}

// ============================================
// SIGNUP FUNCTIONALITY
// ============================================
function initSignup() {
    const signupBtn = document.getElementById('signupBtn')
    if (!signupBtn) return
    
    signupBtn.addEventListener('click', handleSignup)
    
    // Also allow Enter key in form
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && document.querySelector('.auth-container').classList.contains('flipped')) {
            handleSignup()
        }
    })
}

async function handleSignup() {
    const signupBtn = document.getElementById('signupBtn')
    const email = document.getElementById('signupEmail')?.value.trim()
    const password = document.getElementById('signupPassword')?.value
    const country = document.getElementById('country')?.value
    const termsAccepted = document.getElementById('termsCheck')?.checked
    const privacyAccepted = document.getElementById('privacyCheck')?.checked
    
    // Validation
    if (!email || !password || !country) {
        showToast('Please fill in all required fields', 'error')
        return
    }
    
    if (!termsAccepted || !privacyAccepted) {
        showToast('You must accept the Terms and Privacy Policy', 'error')
        return
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error')
        return
    }
    
    // Show loading state
    showLoading(signupBtn)
    
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    country: country
                }
            }
        })
        
        if (authError) throw authError
        
        const user = authData.user
        
        // 2. Create user profile
        const { error: profileError } = await supabase
            .from('users_profile')
            .insert({
                id: user.id,
                email,
                country,
                city: country === 'PH' ? 'Cebu' : null,
                tier: 'bronze',
                currency_code: country === 'PH' ? 'PHP' : 'USD',
                currency_symbol: country === 'PH' ? '₱' : '$'
            })
        
        if (profileError) throw profileError
        
        // 3. Record legal acceptance
        const { error: legalError } = await supabase
            .from('legal_acceptance')
            .insert({
                user_id: user.id,
                terms_accepted: true,
                privacy_accepted: true,
                accepted_at: new Date().toISOString()
            })
        
        if (legalError) throw legalError
        
        // Success - flip back to login
        showToast('Account created successfully! Please login.', 'success')
        
        // Reset form
        document.getElementById('signupForm')?.reset()
        
        // Flip back to login
        document.querySelector('.auth-container').classList.remove('flipped')
        
    } catch (error) {
        console.error('Signup error:', error)
        showToast(error.message || 'Signup failed. Please try again.', 'error')
    } finally {
        hideLoading(signupBtn)
    }
}

// ============================================
// LOADING MODAL (After Login)
// ============================================
function showLoadingModal() {
    const loadingModal = document.getElementById('loadingModal')
    if (!loadingModal) return
    
    // Show modal
    loadingModal.style.display = 'flex'
    
    // Update progress steps
    const steps = document.querySelectorAll('.loading-steps .step')
    
    // Step 1: Authenticating (immediate)
    setTimeout(() => {
        steps[0].classList.add('completed')
        steps[1].classList.add('active')
    }, 1000)
    
    // Step 2: Loading Data (after 2.5s)
    setTimeout(() => {
        steps[1].classList.remove('active')
        steps[1].classList.add('completed')
        steps[2].classList.add('active')
    }, 3500)
}

// ============================================
// AUTO-REDIRECT IF LOGGED IN
// ============================================
async function autoRedirectIfLoggedIn() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session && window.location.pathname.includes('login.html')) {
        // Already logged in, redirect to dashboard
        window.location.href = '/index.html'
    }
}

// Initialize
autoRedirectIfLoggedIn()
