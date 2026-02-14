// ========================================
// Auth Module - Login/Signup/Session Management
// ========================================

let currentUser = null;
let currentProfile = null;

// Reuse the shared Supabase client from config.js (avoids duplicate instances)
function getAuthSupabase() {
    if (typeof getSharedSupabaseClient === 'function') {
        return getSharedSupabaseClient();
    }
    // Fallback if config.js not loaded
    if (!window._authSupabaseFallback && window.supabase && window.supabase.createClient) {
        window._authSupabaseFallback = window.supabase.createClient(
            'https://gyvzfylmvocrriwoemhf.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dnpmeWxtdm9jcnJpd29lbWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjAyOTEsImV4cCI6MjA4NjQ5NjI5MX0.H6E2iAWkqi82szU52_jtbBSyzPKTlAt5jqgRsYt9Kfk'
        );
    }
    return window._authSupabaseFallback || null;
}

// ========================================
// Session Management
// ========================================

async function checkAuthSession() {
    const sb = getAuthSupabase();
    if (!sb) return null;

    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) {
        currentUser = null;
        currentProfile = null;
        return null;
    }

    currentUser = session.user;
    await loadUserProfile();
    return session;
}

async function loadUserProfile() {
    if (!currentUser) return null;
    const sb = getAuthSupabase();

    const { data, error } = await sb
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (data && !error) {
        currentProfile = data;
    }
    return currentProfile;
}

// ========================================
// Sign Up
// ========================================

async function authSignUp(fullName, email, password, role) {
    const sb = getAuthSupabase();
    if (!sb) return { error: { message: 'Service unavailable' } };

    const { data, error } = await sb.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName,
                role: role || 'client'
            }
        }
    });

    if (error) return { error };

    currentUser = data.user;
    if (currentUser) {
        await loadUserProfile();
    }

    return { data };
}

// ========================================
// Sign In
// ========================================

async function authSignIn(email, password) {
    const sb = getAuthSupabase();
    if (!sb) return { error: { message: 'Service unavailable' } };

    const { data, error } = await sb.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) return { error };

    currentUser = data.user;
    await loadUserProfile();
    return { data };
}

// ========================================
// Sign Out
// ========================================

async function authSignOut() {
    const sb = getAuthSupabase();
    if (!sb) return;

    await sb.auth.signOut();
    currentUser = null;
    currentProfile = null;
}

// ========================================
// Auth Guard - redirect to home if not logged in
// ========================================

async function requireAuth() {
    const session = await checkAuthSession();
    if (!session) {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'index.html' && currentPage !== '') {
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

// ========================================
// User Header - renders user name + logout in the header nav
// ========================================

function renderUserHeader() {
    if (!currentUser || !currentProfile) return;

    const nav = document.querySelector('.header-nav');
    if (!nav) return;

    // Remove existing user info if any
    const existing = document.getElementById('user-header-info');
    if (existing) existing.remove();

    const userDiv = document.createElement('div');
    userDiv.id = 'user-header-info';
    userDiv.style.cssText = 'display:flex;align-items:center;gap:0.75rem;margin-left:1rem;';

    const roleBadge = currentProfile.role === 'admin' ? ' (Admin)' :
                      currentProfile.role === 'solicitor' ? ' (Solicitor)' : '';

    userDiv.innerHTML = `
        <span style="color:rgba(255,255,255,0.9);font-size:0.85rem;font-weight:500;">
            ${currentProfile.full_name || currentUser.email}${roleBadge}
        </span>
        <button onclick="handleLogout()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white;padding:0.35rem 0.75rem;border-radius:6px;font-size:0.8rem;cursor:pointer;font-family:inherit;transition:all 0.2s;">
            Logout
        </button>
    `;

    nav.parentElement.appendChild(userDiv);
}

async function handleLogout() {
    await authSignOut();
    window.location.href = 'index.html';
}

// ========================================
// Get current user ID (for saving documents)
// ========================================

function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

function getCurrentUserRole() {
    return currentProfile ? currentProfile.role : null;
}
