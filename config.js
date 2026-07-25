// Credenciais do projeto Supabase — pegue em Project Settings → API no painel do Supabase.
// A "anon public" key é segura para expor no front-end: o acesso real é controlado pelas
// políticas de Row Level Security nas tabelas (cada usuário só vê suas próprias linhas).
const SUPABASE_URL = 'https://zzngtfwongumucdtqwgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bmd0Zndvbmd1bXVjZHRxd2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDU1NzYsImV4cCI6MjEwMDUyMTU3Nn0.7q8vfP0Livc4-GCv48sI7nTfv8oLak5cmQyoHRe1884';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
