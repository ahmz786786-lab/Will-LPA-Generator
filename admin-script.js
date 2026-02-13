// ========================================
// Admin Panel - White Label Configuration
// ========================================

const SUPABASE_URL = 'https://gyvzfylmvocrriwoemhf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dnpmeWxtdm9jcnJpd29lbWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjAyOTEsImV4cCI6MjA4NjQ5NjI5MX0.H6E2iAWkqi82szU52_jtbBSyzPKTlAt5jqgRsYt9Kfk';

let supabaseClient = null;
let configId = null; // ID of existing config row (for updates)
let currentUser = null; // Logged-in user

function initSupabase() {
    try {
        if (window.supabase && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized for admin');
        } else {
            console.warn('Supabase library not loaded');
        }
    } catch (e) {
        console.warn('Supabase initialization error:', e);
    }
}

// ========================================
// Authentication
// ========================================

async function checkAuth() {
    if (!supabaseClient) return false;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            showAdminPanel();
            showLoggedInUser();
            return true;
        }
    } catch (e) {
        console.log('Auth check error:', e.message);
    }
    return false;
}

async function adminLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.textContent = 'Please enter your email and password.';
        errorEl.style.display = 'block';
        return;
    }

    if (!supabaseClient) {
        errorEl.textContent = 'Supabase not connected. Please refresh and try again.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
            return;
        }
        if (data.session) {
            currentUser = data.session.user;
            showAdminPanel();
            showLoggedInUser();
            loadConfig();
        }
    } catch (e) {
        errorEl.textContent = 'Login failed: ' + e.message;
        errorEl.style.display = 'block';
    }
}

async function adminLogout() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    currentUser = null;
    configId = null;
    document.getElementById('loginScreen').style.display = '';
    document.getElementById('adminHeader').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('saveBar').style.display = 'none';
    document.getElementById('loginPassword').value = '';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminHeader').style.display = '';
    document.getElementById('adminPanel').style.display = '';
    document.getElementById('saveBar').style.display = '';
}

function showLoggedInUser() {
    const el = document.getElementById('loggedInUser');
    if (el && currentUser) {
        el.textContent = currentUser.email;
    }
}

// Allow Enter key to submit login
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') {
        adminLogin();
    }
});

// Load existing config from database
async function loadConfig() {
    if (!supabaseClient) {
        showStatus('Supabase not connected. Changes will not be saved to database.', 'warning');
        return;
    }

    try {
        // Load config for the logged-in user
        let query = supabaseClient
            .from('business_config')
            .select('*');

        if (currentUser) {
            query = query.eq('user_id', currentUser.id);
        }

        const { data, error } = await query.limit(1).single();

        if (data && !error) {
            configId = data.id;
            populateForm(data);
        } else {
            console.log('No existing config found, using defaults');
        }
    } catch (e) {
        console.log('Config load error (table may not exist yet):', e.message);
    }
}

// Populate form fields from config data
function populateForm(config) {
    if (config.business_name) document.getElementById('businessName').value = config.business_name;
    if (config.business_logo_url) {
        document.getElementById('businessLogoUrl').value = config.business_logo_url;
        updateLogoPreview(config.business_logo_url);
    }
    if (config.primary_color) {
        document.getElementById('primaryColor').value = config.primary_color;
        document.getElementById('primaryColorHex').textContent = config.primary_color;
    }
    if (config.secondary_color) {
        document.getElementById('secondaryColor').value = config.secondary_color;
        document.getElementById('secondaryColorHex').textContent = config.secondary_color;
    }
    if (config.accent_color) {
        document.getElementById('accentColor').value = config.accent_color;
        document.getElementById('accentColorHex').textContent = config.accent_color;
    }

    // Feature toggles
    document.getElementById('enableIslamicWill').checked = config.enable_islamic_will !== false;
    document.getElementById('enableIslamicLpa').checked = config.enable_islamic_lpa !== false;
    document.getElementById('enableStandardWill').checked = config.enable_standard_will !== false;
    document.getElementById('enableStandardLpa').checked = config.enable_standard_lpa !== false;

    // Update toggle card visual states
    updateToggleCard('islamic-will', config.enable_islamic_will !== false);
    updateToggleCard('islamic-lpa', config.enable_islamic_lpa !== false);
    updateToggleCard('standard-will', config.enable_standard_will !== false);
    updateToggleCard('standard-lpa', config.enable_standard_lpa !== false);

    // Contact info
    if (config.contact_email) document.getElementById('contactEmail').value = config.contact_email;
    if (config.contact_phone) document.getElementById('contactPhone').value = config.contact_phone;
    if (config.website_url) document.getElementById('websiteUrl').value = config.website_url;
    if (config.footer_text) document.getElementById('footerText').value = config.footer_text;

    // Update live preview
    updatePreview();
}

// Save config to database
async function saveConfig() {
    const configData = {
        business_name: document.getElementById('businessName').value || 'Will & LPA Generator',
        business_logo_url: document.getElementById('businessLogoUrl').value || null,
        primary_color: document.getElementById('primaryColor').value,
        secondary_color: document.getElementById('secondaryColor').value,
        accent_color: document.getElementById('accentColor').value,
        enable_islamic_will: document.getElementById('enableIslamicWill').checked,
        enable_islamic_lpa: document.getElementById('enableIslamicLpa').checked,
        enable_standard_will: document.getElementById('enableStandardWill').checked,
        enable_standard_lpa: document.getElementById('enableStandardLpa').checked,
        contact_email: document.getElementById('contactEmail').value || null,
        contact_phone: document.getElementById('contactPhone').value || null,
        website_url: document.getElementById('websiteUrl').value || null,
        footer_text: document.getElementById('footerText').value || null
    };

    if (!supabaseClient) {
        showStatus('Supabase not connected. Please check your connection and try again.', 'error');
        return;
    }

    try {
        let result;
        if (configId) {
            // Update existing row
            result = await supabaseClient
                .from('business_config')
                .update(configData)
                .eq('id', configId)
                .select();
        } else {
            // Insert new row linked to current user
            if (currentUser) {
                configData.user_id = currentUser.id;
            }
            result = await supabaseClient
                .from('business_config')
                .insert(configData)
                .select();
        }

        if (result.error) {
            throw result.error;
        }

        if (result.data && result.data[0]) {
            configId = result.data[0].id;
        }

        showStatus('Configuration saved successfully! Changes will apply across all pages.', 'success');
    } catch (e) {
        console.error('Save error:', e);
        showStatus('Error saving configuration: ' + e.message, 'error');
    }
}

// Show status message
function showStatus(message, type) {
    const el = document.getElementById('statusMessage');
    el.style.display = 'block';
    el.textContent = message;

    if (type === 'success') {
        el.style.background = '#d1fae5';
        el.style.color = '#065f46';
        el.style.border = '1px solid #a7f3d0';
    } else if (type === 'error') {
        el.style.background = '#fee2e2';
        el.style.color = '#991b1b';
        el.style.border = '1px solid #fecaca';
    } else if (type === 'warning') {
        el.style.background = '#fef3c7';
        el.style.color = '#92400e';
        el.style.border = '1px solid #fde68a';
    }

    // Auto-hide after 5 seconds
    setTimeout(() => {
        el.style.display = 'none';
    }, 5000);
}

// Update toggle card visual state
function updateToggleCard(name, enabled) {
    const card = document.getElementById('toggleCard-' + name);
    if (card) {
        if (enabled) {
            card.classList.add('enabled');
        } else {
            card.classList.remove('enabled');
        }
    }
}

// Update logo preview
function updateLogoPreview(url) {
    const preview = document.getElementById('logoPreview');
    if (url && url.trim()) {
        preview.innerHTML = `<img src="${url}" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.parentElement.innerHTML='<svg width=20 height=20 viewBox=&quot;0 0 24 24&quot; fill=none stroke=#ccc stroke-width=2><rect x=3 y=3 width=18 height=18 rx=2 ry=2></rect><circle cx=8.5 cy=8.5 r=1.5></circle><polyline points=&quot;21 15 16 10 5 21&quot;></polyline></svg>'">`;
    } else {
        preview.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    }
}

// Update live preview
function updatePreview() {
    const name = document.getElementById('businessName').value || 'Will & LPA Generator';
    const primaryColor = document.getElementById('primaryColor').value;
    const accentColor = document.getElementById('accentColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const logoUrl = document.getElementById('businessLogoUrl').value;

    // Update preview header
    const previewHeader = document.getElementById('previewHeader');
    previewHeader.style.background = primaryColor;
    document.getElementById('previewName').textContent = name;

    // Update preview logo
    const previewLogoIcon = document.getElementById('previewLogoIcon');
    if (logoUrl && logoUrl.trim()) {
        previewLogoIcon.innerHTML = `<img src="${logoUrl}" alt="Logo" style="height:24px;width:auto;" onerror="this.textContent='&#9878;'">`;
    } else {
        previewLogoIcon.textContent = '\u2696';
    }

    // Update preview button
    const previewButton = document.getElementById('previewButton');
    previewButton.style.background = accentColor;

    // Update secondary preview
    const previewSecondary = document.getElementById('previewSecondary');
    previewSecondary.style.color = secondaryColor;
    previewSecondary.style.borderColor = secondaryColor;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    initSupabase();
    const isLoggedIn = await checkAuth();
    if (isLoggedIn) {
        loadConfig();
    }

    // Color picker change events
    document.getElementById('primaryColor').addEventListener('input', function() {
        document.getElementById('primaryColorHex').textContent = this.value;
        updatePreview();
    });

    document.getElementById('secondaryColor').addEventListener('input', function() {
        document.getElementById('secondaryColorHex').textContent = this.value;
        updatePreview();
    });

    document.getElementById('accentColor').addEventListener('input', function() {
        document.getElementById('accentColorHex').textContent = this.value;
        updatePreview();
    });

    // Business name change
    document.getElementById('businessName').addEventListener('input', updatePreview);

    // Logo URL change
    document.getElementById('businessLogoUrl').addEventListener('input', function() {
        updateLogoPreview(this.value);
        updatePreview();
    });
});
