/* ======================================================================
   AUTENTICAÇÃO (Supabase Auth)
   ====================================================================== */
let currentUser = null;

function showApp(){
  document.getElementById('authScreen').style.display = 'none';
  document.querySelector('.wrap').style.display = '';
}
function showAuthScreen(){
  document.getElementById('authScreen').style.display = 'flex';
  document.querySelector('.wrap').style.display = 'none';
}
function setAuthMsg(text, isError){
  const el = document.getElementById('authMsg');
  el.textContent = text || '';
  el.className = 'auth-msg' + (isError ? ' err' : (text ? ' ok' : ''));
}
function updateUserBadge(){
  const el = document.getElementById('userBadge');
  if(el && currentUser) el.textContent = currentUser.email;
}
function setAuthLoading(loading){
  document.getElementById('authLoginBtn').disabled = loading;
  document.getElementById('authSignupBtn').disabled = loading;
}

async function handleLogin(){
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  if(!email || !password){ setAuthMsg('Preencha e-mail e senha.', true); return; }
  setAuthLoading(true);
  setAuthMsg('Entrando...', false);
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  setAuthLoading(false);
  if(error){ setAuthMsg(traduzErro(error.message), true); return; }
  currentUser = data.user;
  setAuthMsg('', false);
  updateUserBadge();
  showApp();
  await initCollections();
}

async function handleSignup(){
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  if(!email || !password){ setAuthMsg('Preencha e-mail e senha.', true); return; }
  if(password.length < 6){ setAuthMsg('A senha precisa ter pelo menos 6 caracteres.', true); return; }
  setAuthLoading(true);
  setAuthMsg('Criando conta...', false);
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  setAuthLoading(false);
  if(error){ setAuthMsg(traduzErro(error.message), true); return; }
  if(data.session){
    currentUser = data.user;
    setAuthMsg('', false);
    updateUserBadge();
    showApp();
    await initCollections();
  } else {
    setAuthMsg('Conta criada! Verifique seu e-mail e clique no link de confirmação antes de entrar.', false);
  }
}

async function handleLogout(){
  await supabaseClient.auth.signOut();
  currentUser = null;
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  showAuthScreen();
}

function traduzErro(msg){
  if(/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if(/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).';
  if(/User already registered/i.test(msg)) return 'Já existe uma conta com esse e-mail — tente entrar.';
  if(/Password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  return msg;
}

document.getElementById('authLoginBtn').addEventListener('click', handleLogin);
document.getElementById('authSignupBtn').addEventListener('click', handleSignup);
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
document.getElementById('authPassword').addEventListener('keydown', (e) => { if(e.key === 'Enter') handleLogin(); });
document.getElementById('authEmail').addEventListener('keydown', (e) => { if(e.key === 'Enter') document.getElementById('authPassword').focus(); });

(async function initAuth(){
  showAuthScreen();
  const { data } = await supabaseClient.auth.getSession();
  if(data.session){
    currentUser = data.session.user;
    updateUserBadge();
    showApp();
    await initCollections();
  }
})();
