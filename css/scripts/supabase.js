// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://jpjybbldgtwlmisjnzkc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwanliYmxkZ3R3bG1pc2puemtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTcxODksImV4cCI6MjA4NDkzMzE4OX0.qTU0G7PM5xlIr5ozNTob0glv8w_iQvTeldrGNuhczkw'

export const supabase = createClient(supabaseUrl, supabaseKey)
