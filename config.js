// ========================================
// Shared Config Loader - White Label Support
// ========================================

const CONFIG_SUPABASE_URL = 'https://gyvzfylmvocrriwoemhf.supabase.co';
const CONFIG_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dnpmeWxtdm9jcnJpd29lbWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjAyOTEsImV4cCI6MjA4NjQ5NjI5MX0.H6E2iAWkqi82szU52_jtbBSyzPKTlAt5jqgRsYt9Kfk';

// Default configuration
const DEFAULT_CONFIG = {
    business_name: 'Will & LPA Generator',
    business_logo_url: '',
    primary_color: '#1e3a5f',
    secondary_color: '#d4af37',
    accent_color: '#1b7340',
    enable_islamic_will: true,
    enable_islamic_lpa: true,
    enable_standard_will: true,
    enable_standard_lpa: true,
    contact_email: '',
    contact_phone: '',
    website_url: '',
    footer_text: ''
};

// Global config object
let siteConfig = { ...DEFAULT_CONFIG };

// Shared Supabase client (reused by page scripts to avoid duplicate instances)
let sharedSupabaseClient = null;

function getSharedSupabaseClient() {
    if (!sharedSupabaseClient && window.supabase && window.supabase.createClient) {
        sharedSupabaseClient = window.supabase.createClient(CONFIG_SUPABASE_URL, CONFIG_SUPABASE_ANON_KEY);
    }
    return sharedSupabaseClient;
}

// Load config from Supabase (reads ?b=BUSINESS_ID from URL)
async function loadSiteConfig() {
    try {
        const client = getSharedSupabaseClient();
        if (!client) { applyConfig(); return; }

        // Check for business ID in URL: ?b=UUID or from sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        let businessId = urlParams.get('b') || sessionStorage.getItem('businessId');

        let query = client.from('business_config').select('*');

        if (businessId) {
            query = query.eq('id', businessId);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (data && !error) {
            siteConfig = { ...DEFAULT_CONFIG, ...data };

            // Persist business ID so inner pages keep the branding
            if (data.id) {
                sessionStorage.setItem('businessId', data.id);
            }
        }
    } catch (e) {
        console.warn('Config load failed, using defaults:', e.message);
    }

    applyConfig();
}

// Apply config to the page
function applyConfig() {
    // Apply CSS variables for branding
    const root = document.documentElement;
    root.style.setProperty('--primary', siteConfig.primary_color);
    root.style.setProperty('--primary-light', lightenColor(siteConfig.primary_color, 20));
    root.style.setProperty('--primary-dark', darkenColor(siteConfig.primary_color, 20));
    root.style.setProperty('--accent', siteConfig.accent_color);
    root.style.setProperty('--accent-light', lightenColor(siteConfig.accent_color, 15));
    root.style.setProperty('--secondary', siteConfig.secondary_color);
    root.style.setProperty('--secondary-light', lightenColor(siteConfig.secondary_color, 15));

    // Apply business name to header
    const brandNameEls = document.querySelectorAll('.brand-name');
    brandNameEls.forEach(el => {
        el.textContent = siteConfig.business_name;
    });

    // Apply logo if provided
    if (siteConfig.business_logo_url) {
        const logoIcons = document.querySelectorAll('.logo-icon');
        logoIcons.forEach(el => {
            el.innerHTML = `<img src="${siteConfig.business_logo_url}" alt="Logo" style="height:40px;width:auto;">`;
        });
    }

    // Apply footer text
    if (siteConfig.footer_text) {
        const footerEls = document.querySelectorAll('.brand-footer');
        footerEls.forEach(el => {
            el.textContent = siteConfig.footer_text;
        });
    }

    // Hide disabled tool cards on home page
    if (document.querySelector('.home-grid')) {
        toggleCard('card-islamic-will', siteConfig.enable_islamic_will);
        toggleCard('card-islamic-lpa', siteConfig.enable_islamic_lpa);
        toggleCard('card-standard-will', siteConfig.enable_standard_will);
        toggleCard('card-standard-lpa', siteConfig.enable_standard_lpa);
    }

    // Hide disabled nav links
    toggleNavLink('nav-islamic-will', siteConfig.enable_islamic_will);
    toggleNavLink('nav-islamic-lpa', siteConfig.enable_islamic_lpa);
    toggleNavLink('nav-standard-will', siteConfig.enable_standard_will);
    toggleNavLink('nav-standard-lpa', siteConfig.enable_standard_lpa);

    // Block access to disabled tool pages (redirect to home)
    const page = window.location.pathname.split('/').pop();
    const pageAccessMap = {
        'islamic-will.html': siteConfig.enable_islamic_will,
        'lpa.html': siteConfig.enable_islamic_lpa,
        'will-standard.html': siteConfig.enable_standard_will,
        'lpa-standard.html': siteConfig.enable_standard_lpa
    };

    if (page in pageAccessMap && pageAccessMap[page] === false) {
        // Show a brief message then redirect
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;background:#f8fafc;">
                <div style="text-align:center;padding:2rem;background:white;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:400px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" style="margin-bottom:1rem;"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    <h2 style="margin:0 0 0.5rem;color:#1e293b;">Service Not Available</h2>
                    <p style="color:#64748b;margin:0 0 1.5rem;">This tool is not enabled for your organisation.</p>
                    <a href="index.html" style="display:inline-block;padding:0.75rem 2rem;background:#1e3a5f;color:white;border-radius:8px;text-decoration:none;font-weight:500;">Go to Home</a>
                </div>
            </div>`;
    }
}

function toggleCard(id, enabled) {
    const card = document.getElementById(id);
    if (card) {
        card.style.display = enabled ? '' : 'none';
    }
}

function toggleNavLink(id, enabled) {
    const link = document.getElementById(id);
    if (link) {
        link.style.display = enabled ? '' : 'none';
    }
}

// Color utility functions
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
    const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent));
    const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * percent));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent));
    const b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Auto-load config when DOM is ready
document.addEventListener('DOMContentLoaded', loadSiteConfig);
