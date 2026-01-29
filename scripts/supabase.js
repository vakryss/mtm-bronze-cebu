// Supabase Client Configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Replace with your Supabase project credentials
const SUPABASE_URL = 'https://mtm-bronze-cebu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeXRvdmZwZmhwaHJ2YXJ1eXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzkxNDMsImV4cCI6MjA4NTIxNTE0M30.vTAlWw1_eGP2L2WAkcRakGRax6Uikh_zxucCCicbIgg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
})

// Helper function to get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
        console.error('Error getting current user:', error)
        return null
    }
    return user
}

// Helper function to get user profile
export async function getUserProfile() {
    const user = await getCurrentUser()
    if (!user) return null
    
    const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single()
    
    if (error) {
        console.error('Error getting user profile:', error)
        return null
    }
    
    return data
}
