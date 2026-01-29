// Session Management & Authentication Guards
import { supabase } from './supabase.js'

// Redirect to login if not authenticated
export async function requireAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
        // Store the current page to redirect back after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname)
        window.location.replace('/login.html')
        return false
    }
    
    return true
}

// Logout function
export async function logout() {
    try {
        // Show confirmation
        const confirmed = confirm('Are you sure you want to logout?')
        if (!confirmed) return
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut()
        
        if (error) {
            throw error
        }
        
        // Clear any stored data
        localStorage.removeItem('redirectAfterLogin')
        
        // Redirect to login page
        window.location.replace('/login.html')
        
    } catch (error) {
        console.error('Logout error:', error)
        alert('Logout failed. Please try again.')
    }
}

// Initialize logout buttons on page load
export function initLogoutButtons() {
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

// Check if user has accepted terms
export async function checkLegalAcceptance() {
    const user = await supabase.auth.getUser()
    if (!user) return false
    
    const { data, error } = await supabase
        .from('legal_acceptance')
        .select('*')
        .eq('user_id', user.id)
        .single()
    
    if (error || !data) {
        return false
    }
    
    return data.terms_accepted && data.privacy_accepted
}

// Redirect to terms acceptance if needed
export async function requireLegalAcceptance() {
    const accepted = await checkLegalAcceptance()
    
    if (!accepted) {
        window.location.replace('/legal.html') // Create this page if needed
        return false
    }
    
    return true
}
