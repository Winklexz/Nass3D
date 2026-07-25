// Credenciais do projeto Supabase — pegue em Project Settings → API no painel do Supabase.
// A "anon public" key é segura para expor no front-end: o acesso real é controlado pelas
// políticas de Row Level Security nas tabelas (cada usuário só vê suas próprias linhas).
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
