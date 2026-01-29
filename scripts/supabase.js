// Supabase Client Configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Replace with your Supabase project credentials
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'

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
