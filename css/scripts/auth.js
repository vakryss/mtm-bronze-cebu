// auth.js
import { supabase } from './supabase.js'

document.addEventListener('DOMContentLoaded', () => {
    // Flip between login and signup
    const authContainer = document.getElementById('authContainer')
    const goToSignup = document.getElementById('goToSignup')
    const goToLogin = document.getElementById('goToLogin')

    goToSignup.addEventListener('click', (e) => {
        e.preventDefault()
        authContainer.classList.add('flipped')
    })

    goToLogin.addEventListener('click', (e) => {
        e.preventDefault()
        authContainer.classList.remove('flipped')
    })

    // Toggle password visibility
    function setupPasswordToggle(inputId, toggleId) {
        const input = document.getElementById(inputId)
        const toggle = document.getElementById(toggleId)
        if (input && toggle) {
            toggle.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password'
            })
        }
    }

    setupPasswordToggle('loginPassword', 'toggleLoginPassword')
    setupPasswordToggle('signupPassword', 'toggleSignupPassword')

    // Terms and Privacy modals
    document.querySelectorAll('.terms-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault()
            const modalId = link.getAttribute('data-modal')
            document.getElementById(modalId).style.display = 'flex'
        })
    })

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close')
            document.getElementById(modalId).style.display = 'none'
        })
    })

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none'
            }
        })
    })

    // Login function
    const loginBtn = document.getElementById('loginBtn')
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value
        const password = document.getElementById('loginPassword').value

        if (!email || !password) {
            alert('Please enter email and password')
            return
        }

        loginBtn.disabled = true
        loginBtn.querySelector('.btn-text').textContent = 'Logging in...'

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            alert(error.message)
            loginBtn.disabled = false
            loginBtn.querySelector('.btn-text').textContent = 'LOGIN'
            return
        }

        // Show loading modal
        const loadingModal = document.getElementById('loadingModal')
        loadingModal.style.display = 'flex'

        // Simulate loading for 5-10 seconds
        setTimeout(() => {
            window.location.href = '/index.html'
        }, 5000 + Math.random() * 5000) // Random between 5-10 seconds
    })

    // Signup function
    const signupBtn = document.getElementById('signupBtn')
    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('signupEmail').value
        const password = document.getElementById('signupPassword').value
        const country = document.getElementById('country').value
        const termsAccepted = document.getElementById('termsCheck').checked
        const privacyAccepted = document.getElementById('privacyCheck').checked

        if (!email || !password || !country) {
            alert('Please fill in all fields')
            return
        }

        if (!termsAccepted || !privacyAccepted) {
            alert('You must accept the terms and privacy policy')
            return
        }

        signupBtn.disabled = true
        signupBtn.querySelector('.btn-text').textContent = 'Creating account...'

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        })

        if (authError) {
            alert(authError.message)
            signupBtn.disabled = false
            signupBtn.querySelector('.btn-text').textContent = 'CREATE ACCOUNT'
            return
        }

        const user = authData.user

        // 2. Create user profile
        const { error: profileError } = await supabase
            .from('users_profile')
            .insert({
                id: user.id,
                email,
                country,
                full_name: 'N/A',
                currency_code: country === 'PH' ? 'PHP' : 'USD',
                currency_symbol: country === 'PH' ? '₱' : '$'
            })

        if (profileError) {
            alert(profileError.message)
            signupBtn.disabled = false
            signupBtn.querySelector('.btn-text').textContent = 'CREATE ACCOUNT'
            return
        }

        // 3. Record legal acceptance
        const { error: legalError } = await supabase
            .from('legal_acceptance')
            .insert({
                user_id: user.id,
                terms_accepted: true,
                privacy_accepted: true,
                accepted_at: new Date().toISOString()
            })

        if (legalError) {
            alert(legalError.message)
            signupBtn.disabled = false
            signupBtn.querySelector('.btn-text').textContent = 'CREATE ACCOUNT'
            return
        }

        // Show success message and flip to login
        alert('Account created successfully! Please login.')
        authContainer.classList.remove('flipped')
        signupBtn.disabled = false
        signupBtn.querySelector('.btn-text').textContent = 'CREATE ACCOUNT'
    })
})
