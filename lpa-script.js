// ========================================
// Islamic LPA Generator - JavaScript
// ========================================

// Supabase Configuration (same as Will wizard)
const SUPABASE_URL = 'https://gyvzfylmvocrriwoemhf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dnpmeWxtdm9jcnJpd29lbWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjAyOTEsImV4cCI6MjA4NjQ5NjI5MX0.H6E2iAWkqi82szU52_jtbBSyzPKTlAt5jqgRsYt9Kfk';

let supabaseClient = null;

function initSupabase() {
    try {
        if (window.supabase && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized successfully');
        } else {
            console.warn('Supabase library not loaded, will save locally only');
        }
    } catch (e) {
        console.warn('Supabase initialization error:', e);
    }
}

// State
let currentStep = 1;
const totalSteps = 10;
let lpaFormData = {};

// Dynamic list counters
let attorneyCount = 0;
let replacementAttorneyCount = 0;
let notifyPersonCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('LPA DOM loaded, initializing...');
    initSupabase();
    initProgressSteps();
    updateProgress();
    setupEventListeners();
    loadProgress();
    setupToolbarUpdates();
    console.log('LPA initialization complete');
});

// Setup toolbar auto-updates
function setupToolbarUpdates() {
    const nameInput = document.getElementById('donorName');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            updateToolbar(e.target.value);
        });
    }
}

// Update toolbar with client name
function updateToolbar(name) {
    const titleEl = document.getElementById('currentClientName');
    if (titleEl) {
        titleEl.textContent = name || 'New LPA';
    }
}

// Initialize progress steps
function initProgressSteps() {
    const stepsContainer = document.getElementById('progressSteps');
    const stepLabels = [
        'Welcome', 'Donor', 'Attorneys', 'Authority', 'Replacements',
        'Notify', 'Islamic', 'Certificate', 'Review', 'Complete'
    ];

    stepsContainer.innerHTML = stepLabels.map((label, index) => `
        <div class="progress-step ${index + 1 === currentStep ? 'active' : ''}" data-step="${index + 1}">
            <span class="progress-step-number">${index + 1}</span>
            <span class="progress-step-label">${label}</span>
        </div>
    `).join('');
}

// Update progress bar
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = `${percentage}%`;

    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else if (index + 1 < currentStep) {
            step.classList.add('completed');
        }
    });

    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'flex';

    const nextBtn = document.getElementById('nextBtn');
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
    } else if (currentStep === totalSteps - 1) {
        nextBtn.innerHTML = 'Generate LPA <span class="icon">✓</span>';
        nextBtn.style.display = 'flex';
    } else {
        nextBtn.innerHTML = 'Next <span class="icon">→</span>';
        nextBtn.style.display = 'flex';
    }
}

// Change step
function changeStep(direction) {
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }

    saveStepData();

    currentStep += direction;
    currentStep = Math.max(1, Math.min(totalSteps, currentStep));

    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

    updateProgress();

    if (currentStep === 9) {
        generateReview();
    } else if (currentStep === 10) {
        generateLpa();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Go to specific step
function goToStep(step) {
    saveStepData();
    currentStep = step;

    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
    });
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate step
function validateStep(step) {
    let isValid = true;
    const currentStepEl = document.querySelector(`.step[data-step="${step}"]`);

    if (step === 1) {
        const shahadaCheck = document.getElementById('shahadaConfirm');
        if (!shahadaCheck.checked) {
            alert('Please confirm the Declaration of Faith (Shahada) to proceed.');
            return false;
        }
        return true;
    }

    if (step === 3) {
        if (attorneyCount === 0) {
            alert('Please add at least one attorney.');
            return false;
        }
    }

    const requiredFields = currentStepEl.querySelectorAll('input[required]:not([type="checkbox"]):not([type="radio"]), select[required], textarea[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc2626';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });

    if (!isValid) {
        alert('Please fill in all required fields.');
    }

    return isValid;
}

// Save step data
function saveStepData() {
    const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    const inputs = currentStepEl.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.type === 'radio') {
            if (input.checked) {
                lpaFormData[input.name] = input.value;
            }
        } else if (input.type === 'checkbox') {
            lpaFormData[input.id] = input.checked;
        } else {
            lpaFormData[input.id] = input.value;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // LPA type toggle
    document.querySelectorAll('input[name="lpaType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            handleLpaTypeChange(e.target.value);
        });
    });

    // Attorney decision type toggle
    document.querySelectorAll('input[name="attorneyDecision"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mixedDetails = document.getElementById('mixedDecisionDetails');
            if (mixedDetails) {
                mixedDetails.style.display = e.target.value === 'mixed' ? 'block' : 'none';
            }
        });
    });
}

// Handle LPA type change
function handleLpaTypeChange(type) {
    const isProperty = type === 'property';

    // Step 4: Authority sections
    const propDecision = document.getElementById('propertyDecisionSection');
    const healthDecision = document.getElementById('healthDecisionSection');
    if (propDecision) propDecision.style.display = isProperty ? 'block' : 'none';
    if (healthDecision) healthDecision.style.display = isProperty ? 'none' : 'block';

    // Step 7: Instructions sections
    const propInstructions = document.getElementById('propertyInstructions');
    const healthInstructions = document.getElementById('healthInstructions');
    if (propInstructions) propInstructions.style.display = isProperty ? 'block' : 'none';
    if (healthInstructions) healthInstructions.style.display = isProperty ? 'none' : 'block';

    // Gov form preview section 3 title
    const previewTitle = document.getElementById('previewSection3Title');
    const previewDesc = document.getElementById('previewSection3Desc');
    if (previewTitle) {
        previewTitle.textContent = isProperty ? 'When attorneys can act' : 'Life-sustaining treatment';
    }
    if (previewDesc) {
        previewDesc.textContent = isProperty
            ? 'Whether attorneys can act immediately or only when you lack capacity'
            : 'Whether attorneys can make decisions about life-sustaining treatment';
    }
}

// ========================================
// Dynamic List Functions
// ========================================

function addAttorney() {
    attorneyCount++;
    const container = document.getElementById('attorneysList');
    const html = `
        <div class="list-item" id="attorney-${attorneyCount}">
            <div class="list-item-header">
                <span class="list-item-title">Attorney ${attorneyCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('attorney-${attorneyCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label required">Full Name</label>
                    <input type="text" class="form-input" id="attorneyName-${attorneyCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-input" id="attorneyDob-${attorneyCount}">
                </div>
                <div class="form-group full-width">
                    <label class="form-label required">Address (including postcode)</label>
                    <textarea class="form-input" id="attorneyAddress-${attorneyCount}" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="attorneyEmail-${attorneyCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Relationship to Donor</label>
                    <select class="form-input" id="attorneyRelationship-${attorneyCount}">
                        <option value="">Select...</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Friend">Friend</option>
                        <option value="Solicitor">Solicitor</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addReplacementAttorney() {
    replacementAttorneyCount++;
    const container = document.getElementById('replacementAttorneysList');
    const html = `
        <div class="list-item" id="replacementAttorney-${replacementAttorneyCount}">
            <div class="list-item-header">
                <span class="list-item-title">Replacement Attorney ${replacementAttorneyCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('replacementAttorney-${replacementAttorneyCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label required">Full Name</label>
                    <input type="text" class="form-input" id="replacementAttorneyName-${replacementAttorneyCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-input" id="replacementAttorneyDob-${replacementAttorneyCount}">
                </div>
                <div class="form-group full-width">
                    <label class="form-label required">Address (including postcode)</label>
                    <textarea class="form-input" id="replacementAttorneyAddress-${replacementAttorneyCount}" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="replacementAttorneyEmail-${replacementAttorneyCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Relationship to Donor</label>
                    <select class="form-input" id="replacementAttorneyRelationship-${replacementAttorneyCount}">
                        <option value="">Select...</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Friend">Friend</option>
                        <option value="Solicitor">Solicitor</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addNotifyPerson() {
    notifyPersonCount++;
    const container = document.getElementById('notifyPersonsList');
    const html = `
        <div class="list-item" id="notifyPerson-${notifyPersonCount}">
            <div class="list-item-header">
                <span class="list-item-title">Person to Notify ${notifyPersonCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('notifyPerson-${notifyPersonCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label required">Full Name</label>
                    <input type="text" class="form-input" id="notifyPersonName-${notifyPersonCount}">
                </div>
                <div class="form-group full-width">
                    <label class="form-label required">Address (including postcode)</label>
                    <textarea class="form-input" id="notifyPersonAddress-${notifyPersonCount}" rows="2"></textarea>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function removeItem(id) {
    document.getElementById(id).remove();
}

// Collect dynamic list data
function collectListData(prefix, count, fields) {
    const items = [];
    for (let i = 1; i <= count; i++) {
        const el = document.getElementById(`${prefix}-${i}`);
        if (el) {
            const item = {};
            fields.forEach(field => {
                const input = document.getElementById(`${prefix}${field}-${i}`);
                if (input) item[field.toLowerCase()] = input.value;
            });
            items.push(item);
        }
    }
    return items;
}

// ========================================
// Save / Load / Delete
// ========================================

async function saveProgress() {
    saveStepData();

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Name', 'Address']);

    lpaFormData.currentStep = currentStep;

    localStorage.setItem('islamicLpaData', JSON.stringify(lpaFormData));
    alert('Progress saved! You can continue later.');
}

async function saveLpaToDatabase(status = 'draft') {
    if (!supabaseClient) {
        console.warn('Supabase not initialized, skipping database save');
        return null;
    }

    saveStepData();

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Name', 'Address']);

    try {
        const lpaRecord = {
            lpa_type: lpaFormData.lpaType || 'property',

            donor_name: lpaFormData.donorName || '',
            donor_aka: lpaFormData.donorAka || '',
            donor_dob: lpaFormData.donorDob || null,
            donor_address: lpaFormData.donorAddress || '',
            donor_email: lpaFormData.donorEmail || '',
            donor_phone: lpaFormData.donorPhone || '',
            donor_ni: lpaFormData.donorNi || '',

            attorney_decision_type: lpaFormData.attorneyDecision || 'jointly',
            joint_decisions_detail: lpaFormData.jointDecisions || '',

            attorneys_can_act: lpaFormData.attorneysCanAct || 'registered',
            life_sustaining_authority: lpaFormData.lifeSustainingAuthority || 'give',

            certificate_provider_name: lpaFormData.certProviderName || '',
            certificate_provider_address: lpaFormData.certProviderAddress || '',
            certificate_provider_type: lpaFormData.certProviderType || 'knowledge',
            certificate_provider_relationship: lpaFormData.certProviderRelationship || '',

            instruct_no_riba: lpaFormData.instructNoRiba !== false,
            instruct_halal_investments: lpaFormData.instructHalalInvestments !== false,
            instruct_islamic_banking: lpaFormData.instructIslamicBanking !== false,
            instruct_zakat: lpaFormData.instructZakat !== false,
            instruct_consult_scholar: lpaFormData.instructConsultScholar || false,
            additional_instructions: lpaFormData.additionalInstructions || '',
            preferred_islamic_bank: lpaFormData.preferredIslamicBank || '',
            shariah_advisor: lpaFormData.shariahAdvisor || '',
            additional_preferences: lpaFormData.additionalPreferences || '',

            instruct_islamic_care: lpaFormData.instructIslamicCare !== false,
            instruct_halal_food: lpaFormData.instructHalalFood !== false,
            instruct_prayer: lpaFormData.instructPrayer !== false,
            instruct_end_of_life: lpaFormData.instructEndOfLife !== false,
            instruct_no_post_mortem: lpaFormData.instructNoPostMortem || false,
            instruct_muslim_carers: lpaFormData.instructMuslimCarers || false,
            instruct_scholar_consult: lpaFormData.instructScholarConsult || false,
            health_additional_instructions: lpaFormData.healthAdditionalInstructions || '',
            living_preferences: lpaFormData.livingPreferences || '',
            preferred_mosque_lpa: lpaFormData.preferredMosqueLpa || '',
            health_additional_preferences: lpaFormData.healthAdditionalPreferences || '',

            attorneys_are_muslim: lpaFormData.attorneysAreMuslim || false,

            lpa_data: lpaFormData,
            attorneys_data: lpaFormData.attorneys || [],
            replacement_attorneys_data: lpaFormData.replacementAttorneys || [],
            notify_persons_data: lpaFormData.notifyPersons || [],

            status: status
        };

        if (lpaFormData.lpaId) {
            const { data, error } = await supabaseClient
                .from('islamic_lpas')
                .update(lpaRecord)
                .eq('id', lpaFormData.lpaId)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabaseClient
            .from('islamic_lpas')
            .insert(lpaRecord)
            .select()
            .single();

        if (error) throw error;

        lpaFormData.lpaId = data.id;
        localStorage.setItem('islamicLpaData', JSON.stringify(lpaFormData));

        return data;
    } catch (error) {
        console.error('Error saving LPA:', error);
        throw error;
    }
}

function loadProgress() {
    const saved = localStorage.getItem('islamicLpaData');
    if (saved) {
        lpaFormData = JSON.parse(saved);
    }
}

async function saveAndStartNew() {
    if (!lpaFormData.donorName) {
        if (!confirm('No client data entered. Start a new LPA anyway?')) {
            return;
        }
    } else {
        saveStepData();

        lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
        lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
        lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Name', 'Address']);

        if (supabaseClient) {
            try {
                await saveLpaToDatabase();
                alert(`LPA for ${lpaFormData.donorName} saved successfully!`);
            } catch (error) {
                console.error('Error saving:', error);
                const savedLpas = JSON.parse(localStorage.getItem('savedLpas') || '[]');
                lpaFormData.savedAt = new Date().toISOString();
                lpaFormData.localId = Date.now();
                savedLpas.push(lpaFormData);
                localStorage.setItem('savedLpas', JSON.stringify(savedLpas));
                alert(`LPA saved locally for ${lpaFormData.donorName}`);
            }
        } else {
            const savedLpas = JSON.parse(localStorage.getItem('savedLpas') || '[]');
            lpaFormData.savedAt = new Date().toISOString();
            lpaFormData.localId = Date.now();
            savedLpas.push(lpaFormData);
            localStorage.setItem('savedLpas', JSON.stringify(savedLpas));
            alert(`LPA saved locally for ${lpaFormData.donorName}`);
        }
    }

    resetForm();
}

function resetForm() {
    if (lpaFormData.donorName && !confirm('Are you sure you want to start a new LPA? Unsaved changes will be lost.')) {
        return;
    }

    lpaFormData = {};
    localStorage.removeItem('islamicLpaData');

    updateToolbar('');

    attorneyCount = 0;
    replacementAttorneyCount = 0;
    notifyPersonCount = 0;

    document.querySelectorAll('#attorneysList, #replacementAttorneysList, #notifyPersonsList').forEach(el => {
        if (el) el.innerHTML = '';
    });

    document.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = input.defaultChecked;
        } else {
            input.value = input.defaultValue || '';
        }
    });

    currentStep = 1;
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.querySelector('.step[data-step="1"]').classList.add('active');
    updateProgress();

    // Reset LPA type display
    handleLpaTypeChange('property');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// Load Saved LPAs
// ========================================

let pendingLoadLpa = null;

async function loadSavedLpas() {
    const modal = document.getElementById('savedLpasModal');
    const listContainer = document.getElementById('savedLpasList');

    if (!modal) {
        alert('Error: Could not open saved LPAs panel');
        return;
    }

    modal.style.display = 'flex';
    listContainer.innerHTML = '<p>Loading saved LPAs...</p>';

    let lpas = [];

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('islamic_lpas')
                .select('id, donor_name, donor_email, lpa_type, status, created_at, reference_number')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                lpas = data.map(l => ({
                    id: l.id,
                    name: l.donor_name,
                    email: l.donor_email,
                    type: l.lpa_type,
                    status: l.status || 'draft',
                    date: l.created_at,
                    reference: l.reference_number,
                    source: 'database'
                }));
            }
        } catch (e) {
            console.warn('Could not load from database:', e);
        }
    }

    const localLpas = JSON.parse(localStorage.getItem('savedLpas') || '[]');
    localLpas.forEach(l => {
        lpas.push({
            id: l.localId,
            name: l.donorName,
            email: l.donorEmail,
            type: l.lpaType,
            status: l.isCompleted ? 'completed' : 'draft',
            date: l.savedAt,
            source: 'local'
        });
    });

    if (lpas.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #64748b;">No saved LPAs found.</p>';
        return;
    }

    window.loadedLpasList = lpas;

    listContainer.innerHTML = lpas.map((l, index) => `
        <div class="saved-will-card">
            <div class="saved-will-info">
                <h4>${l.name || 'Unnamed'} ${l.reference ? `<small>(${l.reference})</small>` : ''}</h4>
                <p>${l.email || 'No email'} &bull; ${l.type === 'health' ? 'Health & Welfare' : 'Property & Financial'} &bull; ${new Date(l.date).toLocaleDateString()}</p>
                <span class="status-badge ${l.status}">${l.status === 'completed' ? '✓ Completed' : 'Draft'}</span>
                <span style="font-size: 0.75rem; color: #94a3b8; margin-left: 0.5rem;">${l.source === 'local' ? '(Local)' : '(Database)'}</span>
            </div>
            <div class="saved-will-actions">
                <button class="btn btn-primary" data-action="open" data-index="${index}">
                    ${l.status === 'completed' ? '📄 Open' : '✏️ Edit'}
                </button>
                <button class="btn btn-secondary" data-action="delete" data-index="${index}" style="color: #dc2626;">Delete</button>
            </div>
        </div>
    `).join('');

    listContainer.querySelectorAll('button[data-action="open"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const lpa = window.loadedLpasList[index];
            if (lpa) {
                showLoadOptions(lpa.id, lpa.source, lpa.name || 'Client');
            }
        });
    });

    listContainer.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const lpa = window.loadedLpasList[index];
            if (lpa) {
                deleteLpa(lpa.id, lpa.source);
            }
        });
    });
}

function showLoadOptions(id, source, name) {
    pendingLoadLpa = { id: String(id), source: source };
    document.getElementById('loadLpaName').textContent = name;
    document.getElementById('savedLpasModal').style.display = 'none';
    document.getElementById('loadOptionsModal').style.display = 'flex';
}

function closeSavedLpasModal() {
    document.getElementById('savedLpasModal').style.display = 'none';
}

function closeLoadOptionsModal() {
    document.getElementById('loadOptionsModal').style.display = 'none';
    pendingLoadLpa = null;
}

async function loadLpaAndView() {
    if (!pendingLoadLpa) return;

    const lpaId = pendingLoadLpa.id;
    const lpaSource = pendingLoadLpa.source;

    try {
        closeLoadOptionsModal();
        await loadLpaData(lpaId, lpaSource);

        currentStep = 10;
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.querySelector('.step[data-step="10"]').classList.add('active');
        updateProgress();

        generateLpaFromData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        alert('Error loading LPA: ' + error.message);
    }
}

async function loadLpaAndEdit() {
    if (!pendingLoadLpa) return;

    const lpaId = pendingLoadLpa.id;
    const lpaSource = pendingLoadLpa.source;

    try {
        closeLoadOptionsModal();
        await loadLpaData(lpaId, lpaSource);

        currentStep = 2;
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.querySelector('.step[data-step="2"]').classList.add('active');
        updateProgress();

        populateFormFromData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        alert('Error loading LPA: ' + error.message);
    }
}

async function loadLpaData(id, source) {
    if (source === 'database' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('islamic_lpas')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error('No data returned from database');

            lpaFormData = data.lpa_data || {};
            lpaFormData.lpaId = data.id;
            lpaFormData.donorName = data.donor_name || lpaFormData.donorName;
            lpaFormData.donorEmail = data.donor_email || lpaFormData.donorEmail;
            lpaFormData.donorPhone = data.donor_phone || lpaFormData.donorPhone;
            lpaFormData.donorAddress = data.donor_address || lpaFormData.donorAddress;
            lpaFormData.donorDob = data.donor_dob || lpaFormData.donorDob;
            lpaFormData.lpaType = data.lpa_type || lpaFormData.lpaType;

            if (data.attorneys_data) lpaFormData.attorneys = data.attorneys_data;
            if (data.replacement_attorneys_data) lpaFormData.replacementAttorneys = data.replacement_attorneys_data;
            if (data.notify_persons_data) lpaFormData.notifyPersons = data.notify_persons_data;

            updateToolbar(lpaFormData.donorName);
        } catch (e) {
            alert('Error loading LPA: ' + e.message);
            throw e;
        }
    } else {
        const localLpas = JSON.parse(localStorage.getItem('savedLpas') || '[]');
        const lpa = localLpas.find(l => String(l.localId) === String(id));
        if (lpa) {
            lpaFormData = { ...lpa };
            updateToolbar(lpaFormData.donorName);
        } else {
            alert('Could not find saved LPA');
            throw new Error('LPA not found');
        }
    }
}

function populateFormFromData() {
    const fieldMappings = [
        'donorName', 'donorAka', 'donorDob', 'donorAddress', 'donorEmail',
        'donorPhone', 'donorNi', 'jointDecisions', 'certProviderName',
        'certProviderAddress', 'certProviderRelationship',
        'additionalInstructions', 'preferredIslamicBank', 'shariahAdvisor',
        'additionalPreferences', 'healthAdditionalInstructions',
        'livingPreferences', 'preferredMosqueLpa', 'healthAdditionalPreferences'
    ];

    fieldMappings.forEach(field => {
        const el = document.getElementById(field);
        if (el && lpaFormData[field]) {
            el.value = lpaFormData[field];
        }
    });

    // Radio buttons
    if (lpaFormData.lpaType) {
        const radio = document.querySelector(`input[name="lpaType"][value="${lpaFormData.lpaType}"]`);
        if (radio) radio.checked = true;
        handleLpaTypeChange(lpaFormData.lpaType);
    }
    if (lpaFormData.attorneyDecision) {
        const radio = document.querySelector(`input[name="attorneyDecision"][value="${lpaFormData.attorneyDecision}"]`);
        if (radio) radio.checked = true;
    }
    if (lpaFormData.attorneysCanAct) {
        const radio = document.querySelector(`input[name="attorneysCanAct"][value="${lpaFormData.attorneysCanAct}"]`);
        if (radio) radio.checked = true;
    }
    if (lpaFormData.lifeSustainingAuthority) {
        const radio = document.querySelector(`input[name="lifeSustainingAuthority"][value="${lpaFormData.lifeSustainingAuthority}"]`);
        if (radio) radio.checked = true;
    }
    if (lpaFormData.certProviderType) {
        const radio = document.querySelector(`input[name="certProviderType"][value="${lpaFormData.certProviderType}"]`);
        if (radio) radio.checked = true;
    }

    // Checkboxes
    const checkboxes = [
        'attorneysAreMuslim', 'instructNoRiba', 'instructHalalInvestments',
        'instructIslamicBanking', 'instructZakat', 'instructConsultScholar',
        'instructIslamicCare', 'instructHalalFood', 'instructPrayer',
        'instructEndOfLife', 'instructNoPostMortem', 'instructMuslimCarers',
        'instructScholarConsult'
    ];
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el && lpaFormData[id] !== undefined) {
            el.checked = lpaFormData[id];
        }
    });

    // Rebuild dynamic lists
    if (lpaFormData.attorneys) {
        lpaFormData.attorneys.forEach(att => {
            addAttorney();
            const idx = attorneyCount;
            if (att.name) document.getElementById(`attorneyName-${idx}`).value = att.name;
            if (att.dob) document.getElementById(`attorneyDob-${idx}`).value = att.dob;
            if (att.address) document.getElementById(`attorneyAddress-${idx}`).value = att.address;
            if (att.email) document.getElementById(`attorneyEmail-${idx}`).value = att.email;
            if (att.relationship) document.getElementById(`attorneyRelationship-${idx}`).value = att.relationship;
        });
    }
    if (lpaFormData.replacementAttorneys) {
        lpaFormData.replacementAttorneys.forEach(att => {
            addReplacementAttorney();
            const idx = replacementAttorneyCount;
            if (att.name) document.getElementById(`replacementAttorneyName-${idx}`).value = att.name;
            if (att.dob) document.getElementById(`replacementAttorneyDob-${idx}`).value = att.dob;
            if (att.address) document.getElementById(`replacementAttorneyAddress-${idx}`).value = att.address;
            if (att.email) document.getElementById(`replacementAttorneyEmail-${idx}`).value = att.email;
            if (att.relationship) document.getElementById(`replacementAttorneyRelationship-${idx}`).value = att.relationship;
        });
    }
    if (lpaFormData.notifyPersons) {
        lpaFormData.notifyPersons.forEach(person => {
            addNotifyPerson();
            const idx = notifyPersonCount;
            if (person.name) document.getElementById(`notifyPersonName-${idx}`).value = person.name;
            if (person.address) document.getElementById(`notifyPersonAddress-${idx}`).value = person.address;
        });
    }
}

async function deleteLpa(id, source) {
    if (!confirm('Are you sure you want to delete this LPA?')) return;

    if (source === 'database' && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('islamic_lpas')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            alert('Error deleting: ' + e.message);
            return;
        }
    } else {
        let localLpas = JSON.parse(localStorage.getItem('savedLpas') || '[]');
        localLpas = localLpas.filter(l => l.localId != id);
        localStorage.setItem('savedLpas', JSON.stringify(localLpas));
    }

    loadSavedLpas();
}

// ========================================
// Government Form Preview Modal
// ========================================

function showGovFormPreview() {
    document.getElementById('govFormPreviewModal').style.display = 'flex';
}

function closeGovFormPreview() {
    document.getElementById('govFormPreviewModal').style.display = 'none';
}

// ========================================
// Document Generation
// ========================================

function generateReview() {
    saveStepData();

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Name', 'Address']);

    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    const typeLabel = isProperty ? 'Property & Financial Affairs (LP1F)' : 'Health & Welfare (LP1H)';

    const attorneys = lpaFormData.attorneys || [];
    const replacements = lpaFormData.replacementAttorneys || [];
    const notifyPersons = lpaFormData.notifyPersons || [];

    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = `
        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">LPA Type</span>
                <button class="review-section-edit" onclick="goToStep(1)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Type:</span><span class="review-value">${typeLabel}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">The Donor</span>
                <button class="review-section-edit" onclick="goToStep(2)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Full Name:</span><span class="review-value">${lpaFormData.donorName || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Date of Birth:</span><span class="review-value">${lpaFormData.donorDob || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Address:</span><span class="review-value">${lpaFormData.donorAddress || 'Not provided'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Attorneys (${attorneys.length})</span>
                <button class="review-section-edit" onclick="goToStep(3)">Edit</button>
            </div>
            <div class="review-section-content">
                ${attorneys.length > 0 ? attorneys.map((a, i) => `
                    <div class="review-item"><span class="review-label">Attorney ${i + 1}:</span><span class="review-value">${a.name || 'Unnamed'} (${a.relationship || 'N/A'})</span></div>
                `).join('') : '<p>No attorneys added</p>'}
                <div class="review-item"><span class="review-label">Decision type:</span><span class="review-value">${lpaFormData.attorneyDecision || 'Jointly'}</span></div>
                <div class="review-item"><span class="review-label">Muslim attorneys:</span><span class="review-value">${lpaFormData.attorneysAreMuslim ? 'Yes' : 'Not confirmed'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Attorney Authority</span>
                <button class="review-section-edit" onclick="goToStep(4)">Edit</button>
            </div>
            <div class="review-section-content">
                ${isProperty
                    ? `<div class="review-item"><span class="review-label">When can act:</span><span class="review-value">${lpaFormData.attorneysCanAct === 'lack-capacity' ? 'Only when I lack capacity' : 'As soon as registered'}</span></div>`
                    : `<div class="review-item"><span class="review-label">Life-sustaining:</span><span class="review-value">${lpaFormData.lifeSustainingAuthority === 'do-not-give' ? 'NOT given authority' : 'Authority given'}</span></div>`
                }
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Replacement Attorneys (${replacements.length})</span>
                <button class="review-section-edit" onclick="goToStep(5)">Edit</button>
            </div>
            <div class="review-section-content">
                ${replacements.length > 0 ? replacements.map((a, i) => `
                    <div class="review-item"><span class="review-label">Replacement ${i + 1}:</span><span class="review-value">${a.name || 'Unnamed'}</span></div>
                `).join('') : '<p>No replacement attorneys</p>'}
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Islamic Instructions</span>
                <button class="review-section-edit" onclick="goToStep(7)">Edit</button>
            </div>
            <div class="review-section-content">
                ${isProperty ? `
                    <div class="review-item"><span class="review-label">No Riba:</span><span class="review-value">${lpaFormData.instructNoRiba !== false ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Halal Investments:</span><span class="review-value">${lpaFormData.instructHalalInvestments !== false ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Islamic Banking:</span><span class="review-value">${lpaFormData.instructIslamicBanking !== false ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Zakat:</span><span class="review-value">${lpaFormData.instructZakat !== false ? 'Yes' : 'No'}</span></div>
                ` : `
                    <div class="review-item"><span class="review-label">Islamic Care:</span><span class="review-value">${lpaFormData.instructIslamicCare !== false ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Halal Food:</span><span class="review-value">${lpaFormData.instructHalalFood !== false ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Prayer Facilities:</span><span class="review-value">${lpaFormData.instructPrayer !== false ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">End of Life:</span><span class="review-value">${lpaFormData.instructEndOfLife !== false ? 'Yes' : 'No'}</span></div>
                `}
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Certificate Provider</span>
                <button class="review-section-edit" onclick="goToStep(8)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Name:</span><span class="review-value">${lpaFormData.certProviderName || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Type:</span><span class="review-value">${lpaFormData.certProviderType === 'professional' ? 'Professional' : 'Personal knowledge'}</span></div>
            </div>
        </div>

        <div class="info-box info-warning">
            <strong>Important:</strong> Please review all information carefully before generating your LPA.
            Once generated, have it reviewed by a qualified solicitor before signing.
        </div>
    `;
}

// Generate LPA documents
async function generateLpa() {
    saveStepData();

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Name', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Name', 'Address']);

    lpaFormData.isCompleted = true;
    lpaFormData.completedAt = new Date().toISOString();

    try {
        await saveLpaToDatabase('completed');
    } catch (error) {
        console.warn('Could not save to database:', error);
    }

    const savedLpas = JSON.parse(localStorage.getItem('savedLpas') || '[]');
    const existingIndex = savedLpas.findIndex(l => l.localId === lpaFormData.localId);
    lpaFormData.savedAt = new Date().toISOString();
    if (!lpaFormData.localId) lpaFormData.localId = Date.now();

    if (existingIndex >= 0) {
        savedLpas[existingIndex] = lpaFormData;
    } else {
        savedLpas.push(lpaFormData);
    }
    localStorage.setItem('savedLpas', JSON.stringify(savedLpas));

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('islamicLpaDoc').innerHTML = generateIslamicLpaHTML(today);
    document.getElementById('govFormDoc').innerHTML = generateGovFormHTML(today);
}

function generateLpaFromData() {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('islamicLpaDoc').innerHTML = generateIslamicLpaHTML(today);
    document.getElementById('govFormDoc').innerHTML = generateGovFormHTML(today);
}

// ========================================
// Islamic LPA Document HTML
// ========================================

function generateIslamicLpaHTML(today) {
    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    const typeLabel = isProperty ? 'Property & Financial Affairs' : 'Health & Welfare';
    const attorneys = lpaFormData.attorneys || [];
    const replacements = lpaFormData.replacementAttorneys || [];
    const notifyPersons = lpaFormData.notifyPersons || [];

    return `
        <h1>ISLAMIC LASTING POWER OF ATTORNEY</h1>
        <p class="will-arabic" style="text-align: center; font-family: 'Amiri', serif; font-size: 1.5rem; color: #d4af37; margin-bottom: 2rem;">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
        <p style="text-align: center; margin-bottom: 2rem;">In the Name of Allah, the Most Gracious, the Most Merciful</p>

        <h2>PART 1: TYPE OF LPA</h2>
        <p>This is a Lasting Power of Attorney for <strong>${typeLabel}</strong>.</p>
        <p>This LPA is made in accordance with the Mental Capacity Act 2005 and incorporates Islamic principles as instructed by the Donor.</p>

        <h2>PART 2: THE DONOR</h2>
        <p><strong>Full Name:</strong> ${lpaFormData.donorName || '____________________'}</p>
        ${lpaFormData.donorAka ? `<p><strong>Also Known As:</strong> ${lpaFormData.donorAka}</p>` : ''}
        <p><strong>Date of Birth:</strong> ${lpaFormData.donorDob || '____________________'}</p>
        <p><strong>Address:</strong> ${lpaFormData.donorAddress || '____________________'}</p>

        <h2>PART 3: THE ATTORNEYS</h2>
        <p>I appoint the following person(s) as my Attorney(s):</p>
        ${attorneys.map((a, i) => `
            <p><strong>Attorney ${i + 1}:</strong><br>
            Name: ${a.name || '____________________'}<br>
            Date of Birth: ${a.dob || '____________________'}<br>
            Address: ${a.address || '____________________'}<br>
            Relationship: ${a.relationship || '____________________'}</p>
        `).join('')}
        <p><strong>How attorneys should act:</strong> ${
            lpaFormData.attorneyDecision === 'jointly-severally' ? 'Jointly and Severally (can act together or independently)' :
            lpaFormData.attorneyDecision === 'mixed' ? 'Jointly for some decisions, Jointly and Severally for others' :
            'Jointly (must all agree on every decision)'
        }</p>
        ${lpaFormData.attorneyDecision === 'mixed' && lpaFormData.jointDecisions ? `<p><strong>Joint decisions:</strong> ${lpaFormData.jointDecisions}</p>` : ''}
        ${lpaFormData.attorneysAreMuslim ? '<p><em>The Donor confirms that the appointed attorneys are practising Muslims who understand Islamic principles.</em></p>' : ''}

        <h2>PART 4: ${isProperty ? 'WHEN ATTORNEYS CAN ACT' : 'LIFE-SUSTAINING TREATMENT'}</h2>
        ${isProperty
            ? `<p>${lpaFormData.attorneysCanAct === 'lack-capacity'
                ? 'My attorneys can only act when I lack mental capacity to make my own decisions.'
                : 'My attorneys can act as soon as this LPA is registered, even while I have mental capacity.'}</p>`
            : `<p>${lpaFormData.lifeSustainingAuthority === 'do-not-give'
                ? 'I do NOT give my attorneys authority to consent to or refuse life-sustaining treatment on my behalf.'
                : 'I give my attorneys authority to consent to or refuse life-sustaining treatment on my behalf.'}</p>`
        }

        ${replacements.length > 0 ? `
        <h2>PART 5: REPLACEMENT ATTORNEYS</h2>
        ${replacements.map((a, i) => `
            <p><strong>Replacement Attorney ${i + 1}:</strong><br>
            Name: ${a.name || '____________________'}<br>
            Date of Birth: ${a.dob || '____________________'}<br>
            Address: ${a.address || '____________________'}</p>
        `).join('')}
        ` : ''}

        ${notifyPersons.length > 0 ? `
        <h2>PART 6: PEOPLE TO NOTIFY</h2>
        ${notifyPersons.map((p, i) => `
            <p><strong>Person ${i + 1}:</strong> ${p.name || '____'} - ${p.address || '____'}</p>
        `).join('')}
        ` : ''}

        <h2>PART 7: ISLAMIC INSTRUCTIONS & PREFERENCES</h2>
        <div style="background: #f0fdf4; border: 2px solid #1b7340; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="margin-top: 0; color: #1b7340;">Binding Instructions (Your attorneys MUST follow these)</h3>
            <ol>
                ${isProperty ? `
                    ${lpaFormData.instructNoRiba !== false ? '<li>My attorneys must NOT invest in or use any interest-bearing (riba) accounts, products, or instruments.</li>' : ''}
                    ${lpaFormData.instructHalalInvestments !== false ? '<li>All investments must be Shariah-compliant (halal) - no investments in alcohol, gambling, pork, tobacco, weapons, or adult entertainment industries.</li>' : ''}
                    ${lpaFormData.instructIslamicBanking !== false ? '<li>Banking should be conducted through Islamic banking institutions or Shariah-compliant products where available.</li>' : ''}
                    ${lpaFormData.instructZakat !== false ? '<li>My attorneys must ensure annual Zakat obligations are calculated and paid from my wealth.</li>' : ''}
                    ${lpaFormData.instructConsultScholar ? '<li>For complex financial decisions, my attorneys must consult with an Islamic scholar or Shariah advisory board.</li>' : ''}
                ` : `
                    ${lpaFormData.instructIslamicCare !== false ? '<li>All medical and care decisions must be made in accordance with Islamic principles.</li>' : ''}
                    ${lpaFormData.instructHalalFood !== false ? '<li>Only halal food should be provided in any care or hospital setting.</li>' : ''}
                    ${lpaFormData.instructPrayer !== false ? '<li>Ensure facilities and time for daily prayers (Salah) are maintained.</li>' : ''}
                    ${lpaFormData.instructEndOfLife !== false ? '<li>At end of life: Shahada to be recited, body to face towards Qiblah, Surah Yasin to be read.</li>' : ''}
                    ${lpaFormData.instructNoPostMortem ? '<li>No post-mortem examination unless legally required.</li>' : ''}
                    ${lpaFormData.instructMuslimCarers ? '<li>Preference for Muslim medical practitioners and carers where possible.</li>' : ''}
                    ${lpaFormData.instructScholarConsult ? '<li>Consult an Islamic scholar for complex medical or ethical decisions.</li>' : ''}
                `}
                ${lpaFormData.additionalInstructions ? `<li>${lpaFormData.additionalInstructions}</li>` : ''}
                ${lpaFormData.healthAdditionalInstructions ? `<li>${lpaFormData.healthAdditionalInstructions}</li>` : ''}
            </ol>
        </div>

        ${(lpaFormData.preferredIslamicBank || lpaFormData.shariahAdvisor || lpaFormData.additionalPreferences || lpaFormData.livingPreferences || lpaFormData.preferredMosqueLpa || lpaFormData.healthAdditionalPreferences) ? `
        <div style="background: #f0f9ff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="margin-top: 0; color: #1e3a5f;">Preferences (Guidance for attorneys)</h3>
            <ul>
                ${lpaFormData.preferredIslamicBank ? `<li><strong>Preferred Islamic Bank:</strong> ${lpaFormData.preferredIslamicBank}</li>` : ''}
                ${lpaFormData.shariahAdvisor ? `<li><strong>Shariah Advisor:</strong> ${lpaFormData.shariahAdvisor}</li>` : ''}
                ${lpaFormData.additionalPreferences ? `<li>${lpaFormData.additionalPreferences}</li>` : ''}
                ${lpaFormData.livingPreferences ? `<li><strong>Living Arrangements:</strong> ${lpaFormData.livingPreferences}</li>` : ''}
                ${lpaFormData.preferredMosqueLpa ? `<li><strong>Preferred Mosque/Imam:</strong> ${lpaFormData.preferredMosqueLpa}</li>` : ''}
                ${lpaFormData.healthAdditionalPreferences ? `<li>${lpaFormData.healthAdditionalPreferences}</li>` : ''}
            </ul>
        </div>
        ` : ''}

        <h2>PART 8: CERTIFICATE PROVIDER</h2>
        <p><strong>Name:</strong> ${lpaFormData.certProviderName || '____________________'}</p>
        <p><strong>Address:</strong> ${lpaFormData.certProviderAddress || '____________________'}</p>
        <p><strong>Basis:</strong> ${lpaFormData.certProviderType === 'professional' ? 'Professional skills' : 'Personal knowledge (known donor for 2+ years)'}</p>
        ${lpaFormData.certProviderRelationship ? `<p><strong>Details:</strong> ${lpaFormData.certProviderRelationship}</p>` : ''}

        <!-- Signatures -->
        <div class="will-signature-section">
            <h2>SIGNATURES</h2>

            <div class="will-signature-block">
                <h4>DONOR</h4>
                <p><em>I have read (or had read to me) this Lasting Power of Attorney. I want to make this LPA. I understand that this LPA gives my attorneys power to make decisions about ${isProperty ? 'my property and financial affairs' : 'my health and welfare'} and that this may include decisions when I lack mental capacity.</em></p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature of Donor</p>
                <p><strong>Full Name:</strong> ${lpaFormData.donorName || '____________________'}</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            ${attorneys.map((a, i) => `
            <div class="will-signature-block">
                <h4>ATTORNEY ${i + 1}: ${a.name || '____'}</h4>
                <p><em>I understand my role and responsibilities as an attorney under this LPA, including the Islamic instructions provided.</em></p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>
            `).join('')}

            ${replacements.map((a, i) => `
            <div class="will-signature-block">
                <h4>REPLACEMENT ATTORNEY ${i + 1}: ${a.name || '____'}</h4>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>
            `).join('')}

            <div class="certification-block">
                <h4>CERTIFICATE PROVIDER DECLARATION</h4>
                <p>I certify that:</p>
                <div class="certification-checkbox">
                    <input type="checkbox"> <label>The Donor understands the purpose and scope of this LPA</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox"> <label>No fraud or undue pressure is being used to create this LPA</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox"> <label>There is nothing to prevent this LPA from being created</label>
                </div>
                <p><strong>Name:</strong> ${lpaFormData.certProviderName || '____________________'}</p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <div class="certification-block mufti">
                <h4>🕌 ISLAMIC CERTIFICATION (OPTIONAL)</h4>
                <p>I certify that I have reviewed this LPA and confirm that the Islamic instructions and preferences are consistent with Shariah principles.</p>
                <div class="certification-checkbox">
                    <input type="checkbox"> <label>The Islamic instructions are sound and appropriate</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox"> <label>The preferences align with Islamic guidance</label>
                </div>
                <p><strong>Scholar/Imam Name:</strong> ____________________</p>
                <p><strong>Institution:</strong> ____________________</p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Date:</strong> ____________________</p>
                <div class="stamp-area">Institution Stamp</div>
            </div>
        </div>

        <div style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px; text-align: center;">
            <p style="font-weight: 600; color: #1e3a5f;">Registration Information</p>
            <p style="font-size: 0.875rem; color: #6b7280;">This LPA must be registered with the Office of the Public Guardian before it can be used. A registration fee applies. Visit <strong>gov.uk/power-of-attorney</strong> for more information.</p>
        </div>

        <hr style="margin: 2rem 0;">
        <p style="text-align: center; font-size: 0.875rem; color: #6b7280;">
            This LPA was generated on ${today} using the Islamic LPA Generator.<br>
            Please have this document reviewed by a qualified solicitor before signing.
        </p>
    `;
}

// ========================================
// Pre-filled Government Form HTML
// ========================================

function generateGovFormHTML(today) {
    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    const formTitle = isProperty
        ? 'Lasting Power of Attorney - Property and Financial Affairs (LP1F)'
        : 'Lasting Power of Attorney - Health and Welfare (LP1H)';

    const attorneys = lpaFormData.attorneys || [];
    const replacements = lpaFormData.replacementAttorneys || [];
    const notifyPersons = lpaFormData.notifyPersons || [];

    // Build instructions text
    let instructionsText = 'INSTRUCTIONS (binding on my attorneys):\n';
    let instructionNum = 1;
    if (isProperty) {
        if (lpaFormData.instructNoRiba !== false) instructionsText += `${instructionNum++}. My attorneys must NOT invest in or use any interest-bearing (riba) accounts, products, or instruments.\n`;
        if (lpaFormData.instructHalalInvestments !== false) instructionsText += `${instructionNum++}. All investments must be Shariah-compliant (halal) - no alcohol, gambling, pork, tobacco, weapons, or adult entertainment.\n`;
        if (lpaFormData.instructIslamicBanking !== false) instructionsText += `${instructionNum++}. Banking should be through Islamic banking institutions or Shariah-compliant products where available.\n`;
        if (lpaFormData.instructZakat !== false) instructionsText += `${instructionNum++}. Annual Zakat obligations must be calculated and paid from my wealth.\n`;
        if (lpaFormData.instructConsultScholar) instructionsText += `${instructionNum++}. For complex financial decisions, consult with an Islamic scholar or Shariah advisory board.\n`;
    } else {
        if (lpaFormData.instructIslamicCare !== false) instructionsText += `${instructionNum++}. All medical and care decisions must be in accordance with Islamic principles.\n`;
        if (lpaFormData.instructHalalFood !== false) instructionsText += `${instructionNum++}. Only halal food in any care or hospital setting.\n`;
        if (lpaFormData.instructPrayer !== false) instructionsText += `${instructionNum++}. Ensure facilities and time for daily prayers (Salah).\n`;
        if (lpaFormData.instructEndOfLife !== false) instructionsText += `${instructionNum++}. End of life: Shahada to be recited, face Qiblah, Surah Yasin to be read.\n`;
        if (lpaFormData.instructNoPostMortem) instructionsText += `${instructionNum++}. No post-mortem unless legally required.\n`;
        if (lpaFormData.instructMuslimCarers) instructionsText += `${instructionNum++}. Preference for Muslim medical practitioners and carers.\n`;
        if (lpaFormData.instructScholarConsult) instructionsText += `${instructionNum++}. Consult Islamic scholar for complex medical/ethical decisions.\n`;
    }
    if (lpaFormData.additionalInstructions) instructionsText += `${instructionNum++}. ${lpaFormData.additionalInstructions}\n`;
    if (lpaFormData.healthAdditionalInstructions) instructionsText += `${instructionNum++}. ${lpaFormData.healthAdditionalInstructions}\n`;

    let preferencesText = '';
    if (lpaFormData.preferredIslamicBank) preferencesText += `Preferred Islamic Bank: ${lpaFormData.preferredIslamicBank}. `;
    if (lpaFormData.shariahAdvisor) preferencesText += `Preferred Shariah Advisor: ${lpaFormData.shariahAdvisor}. `;
    if (lpaFormData.additionalPreferences) preferencesText += lpaFormData.additionalPreferences + ' ';
    if (lpaFormData.livingPreferences) preferencesText += `Living arrangements: ${lpaFormData.livingPreferences}. `;
    if (lpaFormData.preferredMosqueLpa) preferencesText += `Preferred mosque/imam: ${lpaFormData.preferredMosqueLpa}. `;
    if (lpaFormData.healthAdditionalPreferences) preferencesText += lpaFormData.healthAdditionalPreferences;

    const donorNameParts = (lpaFormData.donorName || '').trim().split(' ');
    const firstName = donorNameParts.slice(0, -1).join(' ') || donorNameParts[0] || '';
    const lastName = donorNameParts.length > 1 ? donorNameParts[donorNameParts.length - 1] : '';

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB');
    };

    return `
        <div class="gov-form" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div class="gov-form-header">
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Office of the Public Guardian</p>
                <h1 style="font-size: 1.25rem; color: #000; margin-bottom: 0.5rem;">${formTitle}</h1>
                <p style="font-size: 0.85rem; color: #666;">Pre-filled from Islamic LPA Generator | ${today}</p>
            </div>

            <!-- Section 1: The Donor -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">1</span></div>
                <div class="gov-section-title">The donor</div>
                <div class="gov-section-content">
                    <div class="gov-field"><label>First names</label><span class="gov-field-value">${firstName}</span></div>
                    <div class="gov-field"><label>Last name</label><span class="gov-field-value">${lastName}</span></div>
                    ${lpaFormData.donorAka ? `<div class="gov-field"><label>Other names</label><span class="gov-field-value">${lpaFormData.donorAka}</span></div>` : ''}
                    <div class="gov-field"><label>Date of birth</label><span class="gov-field-value">${formatDate(lpaFormData.donorDob)}</span></div>
                    <div class="gov-field"><label>Address</label><span class="gov-field-value">${lpaFormData.donorAddress || ''}</span></div>
                </div>
            </div>

            <!-- Section 2: The Attorneys -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">2</span></div>
                <div class="gov-section-title">The attorney(s)</div>
                <div class="gov-section-content">
                    ${attorneys.map((a, i) => {
                        const aParts = (a.name || '').trim().split(' ');
                        const aFirst = aParts.slice(0, -1).join(' ') || aParts[0] || '';
                        const aLast = aParts.length > 1 ? aParts[aParts.length - 1] : '';
                        return `
                            <p style="font-weight: 600; margin-top: ${i > 0 ? '1rem' : '0'}; padding-top: ${i > 0 ? '1rem' : '0'}; border-top: ${i > 0 ? '1px solid #ccc' : 'none'};">Attorney ${i + 1}</p>
                            <div class="gov-field"><label>First names</label><span class="gov-field-value">${aFirst}</span></div>
                            <div class="gov-field"><label>Last name</label><span class="gov-field-value">${aLast}</span></div>
                            <div class="gov-field"><label>Date of birth</label><span class="gov-field-value">${formatDate(a.dob)}</span></div>
                            <div class="gov-field"><label>Address</label><span class="gov-field-value">${a.address || ''}</span></div>
                            <div class="gov-field"><label>Email</label><span class="gov-field-value">${a.email || ''}</span></div>
                        `;
                    }).join('')}
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ccc;">
                        <div class="gov-field"><label>How attorneys act</label><span class="gov-field-value">${
                            lpaFormData.attorneyDecision === 'jointly-severally' ? 'Jointly and severally' :
                            lpaFormData.attorneyDecision === 'mixed' ? 'Jointly for some, jointly and severally for others' :
                            'Jointly'
                        }</span></div>
                        ${lpaFormData.attorneyDecision === 'mixed' && lpaFormData.jointDecisions ? `<div class="gov-field"><label>Joint decisions</label><span class="gov-field-value">${lpaFormData.jointDecisions}</span></div>` : ''}
                    </div>
                </div>
            </div>

            <!-- Section 3 -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">3</span></div>
                <div class="gov-section-title">${isProperty ? 'When can your attorneys make decisions?' : 'Life-sustaining treatment'}</div>
                <div class="gov-section-content">
                    ${isProperty
                        ? `<div class="gov-field"><label>Option selected</label><span class="gov-field-value">${lpaFormData.attorneysCanAct === 'lack-capacity' ? 'Only when I lack mental capacity' : 'As soon as the LPA is registered'}</span></div>`
                        : `<div class="gov-field"><label>Option selected</label><span class="gov-field-value">${lpaFormData.lifeSustainingAuthority === 'do-not-give' ? 'I do NOT give authority for life-sustaining treatment decisions' : 'I give authority for life-sustaining treatment decisions'}</span></div>`
                    }
                </div>
            </div>

            <!-- Section 4: Replacement Attorneys -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">4</span></div>
                <div class="gov-section-title">Replacement attorney(s)</div>
                <div class="gov-section-content">
                    ${replacements.length > 0 ? replacements.map((a, i) => {
                        const rParts = (a.name || '').trim().split(' ');
                        const rFirst = rParts.slice(0, -1).join(' ') || rParts[0] || '';
                        const rLast = rParts.length > 1 ? rParts[rParts.length - 1] : '';
                        return `
                            <p style="font-weight: 600; margin-top: ${i > 0 ? '1rem' : '0'};">Replacement ${i + 1}</p>
                            <div class="gov-field"><label>First names</label><span class="gov-field-value">${rFirst}</span></div>
                            <div class="gov-field"><label>Last name</label><span class="gov-field-value">${rLast}</span></div>
                            <div class="gov-field"><label>Date of birth</label><span class="gov-field-value">${formatDate(a.dob)}</span></div>
                            <div class="gov-field"><label>Address</label><span class="gov-field-value">${a.address || ''}</span></div>
                        `;
                    }).join('') : '<p style="color: #666;">No replacement attorneys appointed.</p>'}
                </div>
            </div>

            <!-- Section 5: People to Notify -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">5</span></div>
                <div class="gov-section-title">People to notify</div>
                <div class="gov-section-content">
                    ${notifyPersons.length > 0 ? notifyPersons.map((p, i) => `
                        <p style="font-weight: 600; margin-top: ${i > 0 ? '1rem' : '0'};">Person ${i + 1}</p>
                        <div class="gov-field"><label>Name</label><span class="gov-field-value">${p.name || ''}</span></div>
                        <div class="gov-field"><label>Address</label><span class="gov-field-value">${p.address || ''}</span></div>
                    `).join('') : '<p style="color: #666;">No people to notify.</p>'}
                </div>
            </div>

            <!-- Section 6: Preferences and Instructions -->
            <div class="gov-form-section" style="border-color: #1b7340;">
                <div><span class="gov-section-number" style="background: #1b7340;">6</span></div>
                <div class="gov-section-title" style="background: #d1fae5; font-weight: 700;">Preferences and instructions</div>
                <div class="gov-section-content">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">Instructions (binding):</p>
                    <div style="white-space: pre-line; background: #f8fafc; padding: 1rem; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 1rem; font-size: 0.9rem;">${instructionsText}</div>

                    ${preferencesText ? `
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">Preferences (guidance):</p>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 0.9rem;">${preferencesText}</div>
                    ` : ''}
                </div>
            </div>

            <!-- Sections 7-8: Signatures (blank) -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">7</span></div>
                <div class="gov-section-title">The donor's signature</div>
                <div class="gov-section-content">
                    <p style="color: #666; font-style: italic;">To be completed when signing the form. The donor must sign in the presence of a witness.</p>
                    <div style="border-bottom: 1px solid #333; height: 40px; margin: 1rem 0;"></div>
                    <p style="font-size: 0.85rem; color: #666;">Signature of donor</p>
                    <p style="font-size: 0.85rem;">Date: ____________________</p>
                </div>
            </div>

            <div class="gov-form-section">
                <div><span class="gov-section-number">8</span></div>
                <div class="gov-section-title">Certificate provider's declaration</div>
                <div class="gov-section-content">
                    <div class="gov-field"><label>Name</label><span class="gov-field-value">${lpaFormData.certProviderName || ''}</span></div>
                    <div class="gov-field"><label>Address</label><span class="gov-field-value">${lpaFormData.certProviderAddress || ''}</span></div>
                    <div class="gov-field"><label>Basis</label><span class="gov-field-value">${lpaFormData.certProviderType === 'professional' ? 'Professional skills' : 'Personal knowledge'}</span></div>
                    <p style="color: #666; font-style: italic; margin-top: 1rem;">Signature to be completed when certifying.</p>
                    <div style="border-bottom: 1px solid #333; height: 40px; margin: 1rem 0;"></div>
                    <p style="font-size: 0.85rem; color: #666;">Signature of certificate provider</p>
                </div>
            </div>

            <!-- Sections 9-10: Attorney Signatures -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">9</span></div>
                <div class="gov-section-title">Attorney(s)' signatures</div>
                <div class="gov-section-content">
                    ${attorneys.map((a, i) => `
                        <p style="font-weight: 600; margin-top: ${i > 0 ? '1.5rem' : '0'};">Attorney ${i + 1}: ${a.name || '____'}</p>
                        <p style="color: #666; font-style: italic;">To be completed when signing.</p>
                        <div style="border-bottom: 1px solid #333; height: 40px; margin: 0.5rem 0;"></div>
                        <p style="font-size: 0.85rem; color: #666;">Signature</p>
                        <p style="font-size: 0.85rem;">Date: ____________________</p>
                    `).join('')}
                </div>
            </div>

            ${replacements.length > 0 ? `
            <div class="gov-form-section">
                <div><span class="gov-section-number">10</span></div>
                <div class="gov-section-title">Replacement attorney(s)' signatures</div>
                <div class="gov-section-content">
                    ${replacements.map((a, i) => `
                        <p style="font-weight: 600; margin-top: ${i > 0 ? '1.5rem' : '0'};">Replacement ${i + 1}: ${a.name || '____'}</p>
                        <div style="border-bottom: 1px solid #333; height: 40px; margin: 0.5rem 0;"></div>
                        <p style="font-size: 0.85rem; color: #666;">Signature</p>
                        <p style="font-size: 0.85rem;">Date: ____________________</p>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Section 11: Registration -->
            <div class="gov-form-section">
                <div><span class="gov-section-number">11</span></div>
                <div class="gov-section-title">Application to register</div>
                <div class="gov-section-content">
                    <p style="color: #666;">This LPA must be registered with the Office of the Public Guardian. Submit this form with the registration fee.</p>
                    <p style="color: #666; font-size: 0.85rem;">For current fees and submission details, visit <strong>gov.uk/power-of-attorney</strong></p>
                </div>
            </div>

            <div class="gov-form-footer">
                <p>This form has been pre-filled using the Islamic LPA Generator.</p>
                <p>Please verify all information before signing and submitting to the Office of the Public Guardian.</p>
            </div>
        </div>
    `;
}

// ========================================
// Document Tab Switching & Print
// ========================================

function showIslamicDoc() {
    document.getElementById('islamicLpaDoc').style.display = 'block';
    document.getElementById('govFormDoc').style.display = 'none';
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.doc-tab[data-tab="islamic"]').classList.add('active');
}

function showGovForm() {
    document.getElementById('islamicLpaDoc').style.display = 'none';
    document.getElementById('govFormDoc').style.display = 'block';
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.doc-tab[data-tab="gov"]').classList.add('active');
}

function printCurrentDoc() {
    window.print();
}

function downloadPDF() {
    alert('For best results, use the Print function and select "Save as PDF" as your printer.\n\nA proper PDF generation feature requires additional libraries.');
    window.print();
}
