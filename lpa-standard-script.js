// ========================================
// Standard LPA Generator - JavaScript
// ========================================

// Supabase - reuse shared client from config.js
let supabaseClient = null;

function initSupabase() {
    if (typeof getSharedSupabaseClient === 'function') {
        supabaseClient = getSharedSupabaseClient();
    }
    if (supabaseClient) {
        console.log('Supabase initialized (shared client)');
    } else {
        console.warn('Supabase not available, will save locally only');
    }
}

// Helper: combine title, first, last into full name string
function fullName(title, first, last) { return [title, first, last].filter(Boolean).join(' '); }

// State
let currentStep = 1;
const totalSteps = 9;
let lpaFormData = {};

// Dynamic list counters
let attorneyCount = 0;
let replacementAttorneyCount = 0;
let notifyPersonCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Standard LPA DOM loaded, initializing...');
    initSupabase();
    initProgressSteps();
    updateProgress();
    setupEventListeners();
    loadProgress();
    setupToolbarUpdates();
    console.log('Standard LPA initialization complete');
});

// Setup toolbar auto-updates
function setupToolbarUpdates() {
    const firstInput = document.getElementById('donorFirstNames');
    const lastInput = document.getElementById('donorLastName');
    const updateName = () => {
        const first = firstInput ? firstInput.value : '';
        const last = lastInput ? lastInput.value : '';
        updateToolbar((first + ' ' + last).trim());
    };
    if (firstInput) firstInput.addEventListener('input', updateName);
    if (lastInput) lastInput.addEventListener('input', updateName);
}

// Update toolbar with client name
function updateToolbar(name) {
    const titleEl = document.getElementById('currentClientName');
    if (titleEl) {
        titleEl.textContent = name || 'New Standard LPA';
    }
}

// Initialize progress steps
function initProgressSteps() {
    const stepsContainer = document.getElementById('progressSteps');
    const stepLabels = [
        'Welcome', 'Donor', 'Attorneys', 'Decisions', 'Replacement',
        'Notify', 'Preferences', 'Certificate', 'Generate'
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
        nextBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="16 13 12 17 8 13"></polyline><line x1="12" y1="17" x2="12" y2="9"></line></svg> Generate LPA';
        nextBtn.style.display = 'inline-flex';
    } else {
        nextBtn.innerHTML = 'Next Step <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        nextBtn.style.display = 'inline-flex';
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

    if (currentStep === 8) {
        generateReview();
    } else if (currentStep === 9) {
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
        // Standard LPA welcome - no Shahada check needed
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

    // Step 7: Preferences sections
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
                <button type="button" class="list-item-remove" onclick="removeItem('attorney-${attorneyCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <select class="form-input" id="attorneyTitle-${attorneyCount}" onchange="updateItemTitle('attorney', ${attorneyCount})">
                        <option value="">Select...</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                        <option value="Rev">Rev</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label required">First Names</label>
                    <input type="text" class="form-input" id="attorneyFirstNames-${attorneyCount}" oninput="updateItemTitle('attorney', ${attorneyCount})">
                </div>
                <div class="form-group">
                    <label class="form-label required">Last Name</label>
                    <input type="text" class="form-input" id="attorneyLastName-${attorneyCount}" oninput="updateItemTitle('attorney', ${attorneyCount})">
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
                <button type="button" class="list-item-remove" onclick="removeItem('replacementAttorney-${replacementAttorneyCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <select class="form-input" id="replacementAttorneyTitle-${replacementAttorneyCount}" onchange="updateItemTitle('replacementAttorney', ${replacementAttorneyCount})">
                        <option value="">Select...</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                        <option value="Rev">Rev</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label required">First Names</label>
                    <input type="text" class="form-input" id="replacementAttorneyFirstNames-${replacementAttorneyCount}" oninput="updateItemTitle('replacementAttorney', ${replacementAttorneyCount})">
                </div>
                <div class="form-group">
                    <label class="form-label required">Last Name</label>
                    <input type="text" class="form-input" id="replacementAttorneyLastName-${replacementAttorneyCount}" oninput="updateItemTitle('replacementAttorney', ${replacementAttorneyCount})">
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
                <button type="button" class="list-item-remove" onclick="removeItem('notifyPerson-${notifyPersonCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <select class="form-input" id="notifyPersonTitle-${notifyPersonCount}" onchange="updateItemTitle('notifyPerson', ${notifyPersonCount})">
                        <option value="">Select...</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                        <option value="Rev">Rev</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label required">First Names</label>
                    <input type="text" class="form-input" id="notifyPersonFirstNames-${notifyPersonCount}" oninput="updateItemTitle('notifyPerson', ${notifyPersonCount})">
                </div>
                <div class="form-group">
                    <label class="form-label required">Last Name</label>
                    <input type="text" class="form-input" id="notifyPersonLastName-${notifyPersonCount}" oninput="updateItemTitle('notifyPerson', ${notifyPersonCount})">
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

function updateItemTitle(prefix, index) {
    const title = document.getElementById(`${prefix}Title-${index}`)?.value || '';
    const first = document.getElementById(`${prefix}FirstNames-${index}`)?.value || '';
    const last = document.getElementById(`${prefix}LastName-${index}`)?.value || '';
    const name = [title, first, last].filter(Boolean).join(' ');
    const labels = { attorney: 'Attorney', replacementAttorney: 'Replacement Attorney', notifyPerson: 'Person to Notify' };
    const label = labels[prefix] || prefix;
    const el = document.querySelector(`#${prefix}-${index} .list-item-title`);
    if (el) el.textContent = name ? `${label} ${index} — ${name}` : `${label} ${index}`;
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

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Title', 'FirstNames', 'LastName', 'Address']);

    lpaFormData.currentStep = currentStep;

    localStorage.setItem('standardLpaProgress', JSON.stringify(lpaFormData));
    alert('Progress saved! You can continue later.');
}

async function saveStandardLpaToDatabase(status = 'draft') {
    if (!supabaseClient) {
        console.warn('Supabase not initialized, skipping database save');
        return null;
    }

    saveStepData();

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Title', 'FirstNames', 'LastName', 'Address']);

    // Build financial preferences JSON
    const financialPreferences = {};
    if (lpaFormData.prefEthicalInvestments) financialPreferences.ethical_invest = true;
    if (lpaFormData.prefPayDebts) financialPreferences.debt_priority = true;
    if (lpaFormData.prefPropertyMaintained) financialPreferences.property_mgmt = true;
    if (lpaFormData.prefCharitableDonations) financialPreferences.charitable_donations = true;
    if (lpaFormData.prefFinancialAdvisor) financialPreferences.consult_advisor = true;
    if (lpaFormData.preferredAdvisorBank) financialPreferences.preferred_advisor = lpaFormData.preferredAdvisorBank;
    if (lpaFormData.consultThreshold) financialPreferences.consult_threshold = lpaFormData.consultThreshold;
    if (lpaFormData.additionalFinancialInstructions) financialPreferences.additional_instructions = lpaFormData.additionalFinancialInstructions;
    if (lpaFormData.additionalFinancialPreferences) financialPreferences.additional_preferences = lpaFormData.additionalFinancialPreferences;

    // Build care preferences JSON
    const carePreferences = {};
    if (lpaFormData.prefHomeCare) carePreferences.home_care = true;
    if (lpaFormData.prefCareFacility) carePreferences.care_facility = true;
    if (lpaFormData.prefDietaryRequirements) carePreferences.dietary_requirements = true;
    if (lpaFormData.prefRegularVisitors) carePreferences.regular_visitors = true;
    if (lpaFormData.prefCulturalPractices) carePreferences.cultural_practices = true;
    if (lpaFormData.prefMentalHealthTreatment) carePreferences.mental_health = true;
    if (lpaFormData.dietaryDetails) carePreferences.dietary_details = lpaFormData.dietaryDetails;
    if (lpaFormData.endOfLifePreferences) carePreferences.end_of_life = lpaFormData.endOfLifePreferences;
    if (lpaFormData.namedMedicalProfessional) carePreferences.named_professional = lpaFormData.namedMedicalProfessional;
    if (lpaFormData.livingArrangements) carePreferences.living_preferences = lpaFormData.livingArrangements;
    if (lpaFormData.additionalCareInstructions) carePreferences.additional_instructions = lpaFormData.additionalCareInstructions;
    if (lpaFormData.additionalCarePreferences) carePreferences.additional_preferences = lpaFormData.additionalCarePreferences;

    // Build burial preferences
    const burialPreferences = {};
    if (lpaFormData.prefBurialArrangements) burialPreferences.specific_burial = true;
    if (lpaFormData.prefNoEmbalming) burialPreferences.no_embalming = true;
    if (lpaFormData.prefFuneralType) burialPreferences.specific_funeral = true;
    if (lpaFormData.emergencyEndOfLifeContact) burialPreferences.burial_contact = lpaFormData.emergencyEndOfLifeContact;

    try {
        const lpaRecord = {
            lpa_type: lpaFormData.lpaType || 'property',

            donor_title: lpaFormData.donorTitle || '',
            donor_first_names: lpaFormData.donorFirstNames || '',
            donor_last_name: lpaFormData.donorLastName || '',
            donor_name: fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName) || '',
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

            certificate_provider_title: lpaFormData.certProviderTitle || '',
            certificate_provider_first_names: lpaFormData.certProviderFirstNames || '',
            certificate_provider_last_name: lpaFormData.certProviderLastName || '',
            certificate_provider_name: fullName(lpaFormData.certProviderTitle, lpaFormData.certProviderFirstNames, lpaFormData.certProviderLastName) || '',
            certificate_provider_address: lpaFormData.certProviderAddress || '',
            certificate_provider_type: lpaFormData.certProviderType || 'knowledge',
            certificate_provider_relationship: lpaFormData.certProviderRelationship || '',

            // Standard preferences
            financial_preferences: JSON.stringify(financialPreferences),
            care_preferences: JSON.stringify(carePreferences),
            dietary_requirements: lpaFormData.dietaryDetails || '',
            organ_donation: lpaFormData.organDonation || '',
            additional_instructions: lpaFormData.additionalInstructions || '',
            additional_preferences: lpaFormData.additionalPreferences || '',

            lpa_data: lpaFormData,
            attorneys_data: lpaFormData.attorneys || [],
            replacement_attorneys_data: lpaFormData.replacementAttorneys || [],
            notify_persons_data: lpaFormData.notifyPersons || [],

            status: status
        };

        if (lpaFormData.lpaId) {
            const { data, error } = await supabaseClient
                .from('standard_lpas')
                .update(lpaRecord)
                .eq('id', lpaFormData.lpaId)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabaseClient
            .from('standard_lpas')
            .insert(lpaRecord)
            .select()
            .single();

        if (error) throw error;

        lpaFormData.lpaId = data.id;
        localStorage.setItem('standardLpaProgress', JSON.stringify(lpaFormData));

        return data;
    } catch (error) {
        console.error('Error saving Standard LPA:', error);
        throw error;
    }
}

function loadProgress() {
    const saved = localStorage.getItem('standardLpaProgress');
    if (saved) {
        lpaFormData = JSON.parse(saved);
    }
}

async function saveAndStartNew() {
    const donorFullName = fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName);
    if (!donorFullName) {
        if (!confirm('No client data entered. Start a new LPA anyway?')) {
            return;
        }
    } else {
        saveStepData();

        lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
        lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
        lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Title', 'FirstNames', 'LastName', 'Address']);

        if (supabaseClient) {
            try {
                await saveStandardLpaToDatabase();
                alert(`LPA for ${donorFullName} saved successfully!`);
            } catch (error) {
                console.error('Error saving:', error);
                const savedLpas = JSON.parse(localStorage.getItem('savedStandardLpas') || '[]');
                lpaFormData.savedAt = new Date().toISOString();
                lpaFormData.localId = Date.now();
                savedLpas.push(lpaFormData);
                localStorage.setItem('savedStandardLpas', JSON.stringify(savedLpas));
                alert(`LPA saved locally for ${donorFullName}`);
            }
        } else {
            const savedLpas = JSON.parse(localStorage.getItem('savedStandardLpas') || '[]');
            lpaFormData.savedAt = new Date().toISOString();
            lpaFormData.localId = Date.now();
            savedLpas.push(lpaFormData);
            localStorage.setItem('savedStandardLpas', JSON.stringify(savedLpas));
            alert(`LPA saved locally for ${donorFullName}`);
        }
    }

    resetForm();
}

function resetForm() {
    if (fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName) && !confirm('Are you sure you want to start a new LPA? Unsaved changes will be lost.')) {
        return;
    }

    lpaFormData = {};
    localStorage.removeItem('standardLpaProgress');

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
                .from('standard_lpas')
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

    const localLpas = JSON.parse(localStorage.getItem('savedStandardLpas') || '[]');
    localLpas.forEach(l => {
        lpas.push({
            id: l.localId,
            name: fullName(l.donorTitle, l.donorFirstNames, l.donorLastName),
            email: l.donorEmail,
            type: l.lpaType,
            status: l.isCompleted ? 'completed' : 'draft',
            date: l.savedAt,
            source: 'local'
        });
    });

    if (lpas.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #64748b;">No saved Standard LPAs found.</p>';
        return;
    }

    window.loadedLpasList = lpas;

    listContainer.innerHTML = lpas.map((l, index) => `
        <div class="saved-will-card">
            <div class="saved-will-info">
                <h4>${l.name || 'Unnamed'} ${l.reference ? `<small>(${l.reference})</small>` : ''}</h4>
                <p>${l.email || 'No email'} &bull; ${l.type === 'health' ? 'Health & Welfare' : 'Property & Financial'} &bull; ${new Date(l.date).toLocaleDateString()}</p>
                <span class="status-badge ${l.status}">${l.status === 'completed' ? 'Completed' : 'Draft'}</span>
                <span style="font-size: 0.75rem; color: #94a3b8; margin-left: 0.5rem;">${l.source === 'local' ? '(Local)' : '(Database)'}</span>
            </div>
            <div class="saved-will-actions">
                <button class="btn btn-primary" data-action="open" data-index="${index}">
                    ${l.status === 'completed' ? 'Open' : 'Edit'}
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

        currentStep = 9;
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.querySelector('.step[data-step="9"]').classList.add('active');
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
                .from('standard_lpas')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error('No data returned from database');

            lpaFormData = data.lpa_data || {};
            lpaFormData.lpaId = data.id;
            lpaFormData.donorEmail = data.donor_email || lpaFormData.donorEmail;
            lpaFormData.donorPhone = data.donor_phone || lpaFormData.donorPhone;
            lpaFormData.donorAddress = data.donor_address || lpaFormData.donorAddress;
            lpaFormData.donorDob = data.donor_dob || lpaFormData.donorDob;
            lpaFormData.lpaType = data.lpa_type || lpaFormData.lpaType;

            if (data.attorneys_data) lpaFormData.attorneys = data.attorneys_data;
            if (data.replacement_attorneys_data) lpaFormData.replacementAttorneys = data.replacement_attorneys_data;
            if (data.notify_persons_data) lpaFormData.notifyPersons = data.notify_persons_data;

            updateToolbar(fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName));
        } catch (e) {
            alert('Error loading LPA: ' + e.message);
            throw e;
        }
    } else {
        const localLpas = JSON.parse(localStorage.getItem('savedStandardLpas') || '[]');
        const lpa = localLpas.find(l => String(l.localId) === String(id));
        if (lpa) {
            lpaFormData = { ...lpa };
            updateToolbar(fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName));
        } else {
            alert('Could not find saved LPA');
            throw new Error('LPA not found');
        }
    }
}

function populateFormFromData() {
    const fieldMappings = [
        'donorTitle', 'donorFirstNames', 'donorLastName', 'donorAka', 'donorDob', 'donorAddress', 'donorEmail',
        'donorPhone', 'donorNi', 'jointDecisions', 'certProviderTitle', 'certProviderFirstNames', 'certProviderLastName',
        'certProviderAddress', 'certProviderRelationship',
        'additionalInstructions', 'preferredAdvisor', 'consultThreshold',
        'additionalPreferences', 'dietaryDetails', 'endOfLifePreferences',
        'namedProfessional', 'livingPreferences', 'burialContact'
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

    // Checkboxes - Standard preferences
    const checkboxes = [
        // Financial preferences
        'ethical_invest', 'debt_priority', 'property_mgmt',
        'charitable_donations', 'consult_advisor',
        // Care preferences
        'home_care', 'care_facility', 'dietary_requirements',
        'regular_visitors', 'cultural_practices', 'mental_health',
        // Burial preferences
        'specific_burial', 'no_embalming', 'specific_funeral'
    ];
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el && lpaFormData[id] !== undefined) {
            el.checked = lpaFormData[id];
        }
    });

    // Select fields
    ['organDonation'].forEach(id => {
        const el = document.getElementById(id);
        if (el && lpaFormData[id]) el.value = lpaFormData[id];
    });

    // Rebuild dynamic lists
    if (lpaFormData.attorneys) {
        lpaFormData.attorneys.forEach(att => {
            addAttorney();
            const idx = attorneyCount;
            if (att.title) document.getElementById(`attorneyTitle-${idx}`).value = att.title;
            if (att.firstnames) document.getElementById(`attorneyFirstNames-${idx}`).value = att.firstnames;
            if (att.lastname) document.getElementById(`attorneyLastName-${idx}`).value = att.lastname;
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
            if (att.title) document.getElementById(`replacementAttorneyTitle-${idx}`).value = att.title;
            if (att.firstnames) document.getElementById(`replacementAttorneyFirstNames-${idx}`).value = att.firstnames;
            if (att.lastname) document.getElementById(`replacementAttorneyLastName-${idx}`).value = att.lastname;
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
            if (person.title) document.getElementById(`notifyPersonTitle-${idx}`).value = person.title;
            if (person.firstnames) document.getElementById(`notifyPersonFirstNames-${idx}`).value = person.firstnames;
            if (person.lastname) document.getElementById(`notifyPersonLastName-${idx}`).value = person.lastname;
            if (person.address) document.getElementById(`notifyPersonAddress-${idx}`).value = person.address;
        });
    }
}

async function deleteLpa(id, source) {
    if (!confirm('Are you sure you want to delete this LPA?')) return;

    if (source === 'database' && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('standard_lpas')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            alert('Error deleting: ' + e.message);
            return;
        }
    } else {
        let localLpas = JSON.parse(localStorage.getItem('savedStandardLpas') || '[]');
        localLpas = localLpas.filter(l => l.localId != id);
        localStorage.setItem('savedStandardLpas', JSON.stringify(localLpas));
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

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Title', 'FirstNames', 'LastName', 'Address']);

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
                <div class="review-item"><span class="review-label">Full Name:</span><span class="review-value">${fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName) || 'Not provided'}</span></div>
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
                    <div class="review-item"><span class="review-label">Attorney ${i + 1}:</span><span class="review-value">${fullName(a.title, a.firstnames, a.lastname) || 'Unnamed'} (${a.relationship || 'N/A'})</span></div>
                `).join('') : '<p>No attorneys added</p>'}
                <div class="review-item"><span class="review-label">Decision type:</span><span class="review-value">${lpaFormData.attorneyDecision || 'Jointly'}</span></div>
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
                    <div class="review-item"><span class="review-label">Replacement ${i + 1}:</span><span class="review-value">${fullName(a.title, a.firstnames, a.lastname) || 'Unnamed'}</span></div>
                `).join('') : '<p>No replacement attorneys</p>'}
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">People to Notify (${notifyPersons.length})</span>
                <button class="review-section-edit" onclick="goToStep(6)">Edit</button>
            </div>
            <div class="review-section-content">
                ${notifyPersons.length > 0 ? notifyPersons.map((p, i) => `
                    <div class="review-item"><span class="review-label">Person ${i + 1}:</span><span class="review-value">${fullName(p.title, p.firstnames, p.lastname) || 'Unnamed'}</span></div>
                `).join('') : '<p>No people to notify</p>'}
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Preferences & Instructions</span>
                <button class="review-section-edit" onclick="goToStep(7)">Edit</button>
            </div>
            <div class="review-section-content">
                ${isProperty ? `
                    <div class="review-item"><span class="review-label">Ethical Investments:</span><span class="review-value">${lpaFormData.prefEthicalInvestments ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Debt Priority:</span><span class="review-value">${lpaFormData.prefPayDebts ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Property Management:</span><span class="review-value">${lpaFormData.prefPropertyMaintained ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Charitable Donations:</span><span class="review-value">${lpaFormData.prefCharitableDonations ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Consult Financial Advisor:</span><span class="review-value">${lpaFormData.prefFinancialAdvisor ? 'Yes' : 'No'}${lpaFormData.consultThreshold ? ` (over £${lpaFormData.consultThreshold})` : ''}</span></div>
                    ${lpaFormData.preferredAdvisorBank ? `<div class="review-item"><span class="review-label">Preferred Advisor:</span><span class="review-value">${lpaFormData.preferredAdvisorBank}</span></div>` : ''}
                ` : `
                    <div class="review-item"><span class="review-label">Home Care:</span><span class="review-value">${lpaFormData.prefHomeCare ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Care Facility Preference:</span><span class="review-value">${lpaFormData.prefCareFacility ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Dietary Requirements:</span><span class="review-value">${lpaFormData.prefDietaryRequirements ? 'Yes' : 'No'}${lpaFormData.dietaryDetails ? ` (${lpaFormData.dietaryDetails})` : ''}</span></div>
                    <div class="review-item"><span class="review-label">Regular Visitors:</span><span class="review-value">${lpaFormData.prefRegularVisitors ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Cultural Practices:</span><span class="review-value">${lpaFormData.prefCulturalPractices ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Mental Health Support:</span><span class="review-value">${lpaFormData.prefMentalHealthTreatment ? 'Yes' : 'No'}</span></div>
                    <div class="review-item"><span class="review-label">Organ Donation:</span><span class="review-value">${lpaFormData.organDonation === 'consent' ? 'Consented' : lpaFormData.organDonation === 'no-consent' ? 'NOT consented' : 'Not specified'}</span></div>
                    <div class="review-item"><span class="review-label">Specific Burial Wishes:</span><span class="review-value">${lpaFormData.prefBurialArrangements ? 'Yes' : 'No'}</span></div>
                `}
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Certificate Provider</span>
                <button class="review-section-edit" onclick="goToStep(8)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Name:</span><span class="review-value">${fullName(lpaFormData.certProviderTitle, lpaFormData.certProviderFirstNames, lpaFormData.certProviderLastName) || 'Not provided'}</span></div>
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

    lpaFormData.attorneys = collectListData('attorney', attorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.replacementAttorneys = collectListData('replacementAttorney', replacementAttorneyCount, ['Title', 'FirstNames', 'LastName', 'Dob', 'Address', 'Email', 'Relationship']);
    lpaFormData.notifyPersons = collectListData('notifyPerson', notifyPersonCount, ['Title', 'FirstNames', 'LastName', 'Address']);

    lpaFormData.isCompleted = true;
    lpaFormData.completedAt = new Date().toISOString();

    // Generate reference number
    if (!lpaFormData.referenceNumber) {
        lpaFormData.referenceNumber = 'SLPA-' + Date.now().toString(36).toUpperCase();
    }

    try {
        await saveStandardLpaToDatabase('completed');
    } catch (error) {
        console.warn('Could not save to database:', error);
    }

    const savedLpas = JSON.parse(localStorage.getItem('savedStandardLpas') || '[]');
    const existingIndex = savedLpas.findIndex(l => l.localId === lpaFormData.localId);
    lpaFormData.savedAt = new Date().toISOString();
    if (!lpaFormData.localId) lpaFormData.localId = Date.now();

    if (existingIndex >= 0) {
        savedLpas[existingIndex] = lpaFormData;
    } else {
        savedLpas.push(lpaFormData);
    }
    localStorage.setItem('savedStandardLpas', JSON.stringify(savedLpas));

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('standardLpaDoc').innerHTML = generateStandardLpaHTML(today);
    generateGovFormHTML(today);
}

function generateLpaFromData() {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('standardLpaDoc').innerHTML = generateStandardLpaHTML(today);
    generateGovFormHTML(today);
}

// ========================================
// Standard LPA Document HTML
// ========================================

function generateStandardLpaHTML(today) {
    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    const typeLabel = isProperty ? 'Property & Financial Affairs' : 'Health & Welfare';
    const attorneys = lpaFormData.attorneys || [];
    const replacements = lpaFormData.replacementAttorneys || [];
    const notifyPersons = lpaFormData.notifyPersons || [];

    return `
        <h1>LASTING POWER OF ATTORNEY</h1>
        <p style="text-align: center; font-size: 1.1rem; color: #1e3a5f; margin-bottom: 2rem;"><strong>${typeLabel}</strong></p>
        ${lpaFormData.referenceNumber ? `<p style="text-align: center; font-size: 0.9rem; color: #6b7280; margin-bottom: 2rem;">Reference: ${lpaFormData.referenceNumber}</p>` : ''}

        <h2>PART 1: THE DONOR</h2>
        <p><strong>Full Name:</strong> ${fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName) || '____________________'}</p>
        ${lpaFormData.donorAka ? `<p><strong>Also Known As:</strong> ${lpaFormData.donorAka}</p>` : ''}
        <p><strong>Date of Birth:</strong> ${lpaFormData.donorDob || '____________________'}</p>
        <p><strong>Address:</strong> ${lpaFormData.donorAddress || '____________________'}</p>
        ${lpaFormData.donorEmail ? `<p><strong>Email:</strong> ${lpaFormData.donorEmail}</p>` : ''}
        ${lpaFormData.donorPhone ? `<p><strong>Phone:</strong> ${lpaFormData.donorPhone}</p>` : ''}
        ${lpaFormData.donorNi ? `<p><strong>NI Number:</strong> ${lpaFormData.donorNi}</p>` : ''}

        <h2>PART 2: THE ATTORNEYS</h2>
        <p>I appoint the following person(s) as my Attorney(s):</p>
        ${attorneys.map((a, i) => `
            <p><strong>Attorney ${i + 1}:</strong><br>
            Name: ${fullName(a.title, a.firstnames, a.lastname) || '____________________'}<br>
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

        ${isProperty ? `
        <h2>PART 2A: WHEN ATTORNEYS CAN ACT</h2>
        <p>${lpaFormData.attorneysCanAct === 'lack-capacity'
            ? 'My attorneys can only act when I lack mental capacity to make my own decisions.'
            : 'My attorneys can act as soon as this LPA is registered, even while I have mental capacity.'}</p>
        ` : `
        <h2>PART 2A: LIFE-SUSTAINING TREATMENT</h2>
        <p>${lpaFormData.lifeSustainingAuthority === 'do-not-give'
            ? 'I do NOT give my attorneys authority to consent to or refuse life-sustaining treatment on my behalf.'
            : 'I give my attorneys authority to consent to or refuse life-sustaining treatment on my behalf.'}</p>
        `}

        ${replacements.length > 0 ? `
        <h2>PART 2B: REPLACEMENT ATTORNEYS</h2>
        ${replacements.map((a, i) => `
            <p><strong>Replacement Attorney ${i + 1}:</strong><br>
            Name: ${fullName(a.title, a.firstnames, a.lastname) || '____________________'}<br>
            Date of Birth: ${a.dob || '____________________'}<br>
            Address: ${a.address || '____________________'}</p>
        `).join('')}
        ` : ''}

        ${notifyPersons.length > 0 ? `
        <h2>PART 2C: PEOPLE TO NOTIFY</h2>
        ${notifyPersons.map((p, i) => `
            <p><strong>Person ${i + 1}:</strong> ${fullName(p.title, p.firstnames, p.lastname) || '____'} - ${p.address || '____'}</p>
        `).join('')}
        ` : ''}

        <h2>PART 3: PREFERENCES AND INSTRUCTIONS</h2>
        <div style="background: #f0fdf4; border: 2px solid #166534; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="margin-top: 0; color: #166534;">Instructions (Your attorneys MUST follow these)</h3>
            <ol>
                ${isProperty ? `
                    ${lpaFormData.prefEthicalInvestments ? '<li><strong>Ethical Investments:</strong> My attorney should ensure that all investments are made ethically. Investments should avoid companies involved in activities that conflict with my values, as outlined in any additional instructions below.</li>' : ''}
                    ${lpaFormData.prefPayDebts ? '<li><strong>Debt Priority:</strong> If I have outstanding debts, my attorney must prioritise settling these debts before making any new financial commitments or investments.</li>' : ''}
                    ${lpaFormData.prefPropertyMaintained ? '<li><strong>Property Management:</strong> My attorney must manage my property in accordance with my wishes. They should not sell, lease, or otherwise dispose of my property without careful consideration of my best interests and any specific instructions provided.</li>' : ''}
                    ${lpaFormData.prefFinancialAdvisor ? `<li><strong>Consult Financial Advisor:</strong> For any significant financial decision, my attorney must first consult with a qualified financial advisor. A written record of consultations should be maintained.${lpaFormData.consultThreshold ? ` Consultation required for any transaction over £${lpaFormData.consultThreshold}.` : ''}</li>` : ''}
                    ${lpaFormData.additionalFinancialInstructions ? `<li>${lpaFormData.additionalFinancialInstructions}</li>` : ''}
                ` : `
                    ${lpaFormData.prefHomeCare ? '<li><strong>Home Care:</strong> I would prefer to be cared for at home rather than in a care facility, for as long as practically and financially feasible.</li>' : ''}
                    ${lpaFormData.prefCareFacility ? '<li><strong>Care Facility:</strong> If residential care becomes necessary, I would prefer a care facility that meets specific standards of care and is located conveniently for my family and friends to visit.</li>' : ''}
                    ${lpaFormData.prefDietaryRequirements ? `<li><strong>Dietary Requirements:</strong> My dietary requirements must be observed at all times.${lpaFormData.dietaryDetails ? ` Details: ${lpaFormData.dietaryDetails}` : ''}</li>` : ''}
                    ${lpaFormData.prefMentalHealthTreatment ? '<li><strong>Mental Health:</strong> If mental health treatment is required, my attorney must ensure that appropriate and sensitive treatment is sought, including counselling or therapy that aligns with my preferences.</li>' : ''}
                    ${lpaFormData.organDonation === 'consent' ? '<li><strong>Organ Donation:</strong> I consent to organ donation after my death.</li>' : ''}
                    ${lpaFormData.organDonation === 'no-consent' ? '<li><strong>Organ Donation:</strong> I do NOT consent to organ donation after my death.</li>' : ''}
                    ${lpaFormData.additionalCareInstructions ? `<li>${lpaFormData.additionalCareInstructions}</li>` : ''}
                `}
            </ol>
        </div>

        <div style="background: #f0f9ff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="margin-top: 0; color: #1e3a5f;">Preferences (Guidance for attorneys)</h3>
            <ul>
                ${isProperty ? `
                    ${lpaFormData.prefCharitableDonations ? '<li>I would prefer that my attorney maintains any existing charitable donation commitments on my behalf.</li>' : ''}
                    ${lpaFormData.preferredAdvisorBank ? `<li><strong>Preferred Financial Advisor:</strong> ${lpaFormData.preferredAdvisorBank}</li>` : ''}
                    ${lpaFormData.additionalFinancialPreferences ? `<li>${lpaFormData.additionalFinancialPreferences}</li>` : ''}
                ` : `
                    ${lpaFormData.prefRegularVisitors ? '<li>I would prefer that friends and family are encouraged to visit regularly.</li>' : ''}
                    ${lpaFormData.prefCulturalPractices ? '<li>My cultural and personal practices should be respected and maintained wherever possible.</li>' : ''}
                    ${lpaFormData.namedMedicalProfessional ? `<li><strong>Named Healthcare Professional:</strong> ${lpaFormData.namedMedicalProfessional}</li>` : ''}
                    ${lpaFormData.livingArrangements ? `<li><strong>Living Arrangements:</strong> ${lpaFormData.livingArrangements}</li>` : ''}
                    ${lpaFormData.endOfLifePreferences ? `<li><strong>End of Life Preferences:</strong> ${lpaFormData.endOfLifePreferences}</li>` : ''}
                    ${lpaFormData.additionalCarePreferences ? `<li>${lpaFormData.additionalCarePreferences}</li>` : ''}
                `}
            </ul>
        </div>

        ${!isProperty && (lpaFormData.prefBurialArrangements || lpaFormData.prefNoEmbalming || lpaFormData.prefFuneralType) ? `
        <div style="background: #fefce8; border: 2px solid #92400e; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
            <h3 style="margin-top: 0; color: #92400e;">Burial and Funeral Wishes</h3>
            <ul>
                ${lpaFormData.prefBurialArrangements ? '<li><strong>Specific Burial Wishes:</strong> I have specific wishes regarding my burial arrangements. My attorney should ensure these are followed as closely as possible.</li>' : ''}
                ${lpaFormData.prefNoEmbalming ? '<li>Embalming should be avoided unless legally required.</li>' : ''}
                ${lpaFormData.prefFuneralType ? `<li><strong>Specific Funeral Arrangements:</strong> I have specific wishes regarding my funeral. My attorney should ensure these are arranged accordingly.${lpaFormData.emergencyEndOfLifeContact ? ` Contact for funeral arrangements: ${lpaFormData.emergencyEndOfLifeContact}.` : ''}</li>` : ''}
            </ul>
        </div>
        ` : ''}

        <h2>PART 4: CERTIFICATE PROVIDER</h2>
        <p><strong>Name:</strong> ${fullName(lpaFormData.certProviderTitle, lpaFormData.certProviderFirstNames, lpaFormData.certProviderLastName) || '____________________'}</p>
        <p><strong>Address:</strong> ${lpaFormData.certProviderAddress || '____________________'}</p>
        <p><strong>Basis:</strong> ${lpaFormData.certProviderType === 'professional' ? 'Professional skills' : 'Personal knowledge (known donor for 2+ years)'}</p>
        ${lpaFormData.certProviderRelationship ? `<p><strong>Details:</strong> ${lpaFormData.certProviderRelationship}</p>` : ''}

        <!-- Signatures -->
        <div class="will-signature-section">
            <h2>PART 5: SIGNATURES</h2>

            <div class="will-signature-block">
                <h4>DONOR</h4>
                <p><em>I have read (or had read to me) this Lasting Power of Attorney. I want to make this LPA. I understand that this LPA gives my attorneys power to make decisions about ${isProperty ? 'my property and financial affairs' : 'my health and welfare'} and that this may include decisions when I lack mental capacity.</em></p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature of Donor</p>
                <p><strong>Full Name:</strong> ${fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName) || '____________________'}</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <div class="will-signature-block">
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
                <p><strong>Name:</strong> ${fullName(lpaFormData.certProviderTitle, lpaFormData.certProviderFirstNames, lpaFormData.certProviderLastName) || '____________________'}</p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            ${attorneys.map((a, i) => `
            <div class="will-signature-block">
                <h4>ATTORNEY ${i + 1}: ${fullName(a.title, a.firstnames, a.lastname) || '____'}</h4>
                <p><em>I understand my role and responsibilities as an attorney under this LPA.</em></p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>
            `).join('')}

            ${replacements.map((a, i) => `
            <div class="will-signature-block">
                <h4>REPLACEMENT ATTORNEY ${i + 1}: ${fullName(a.title, a.firstnames, a.lastname) || '____'}</h4>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>
            `).join('')}
        </div>

        <div style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px; text-align: center;">
            <p style="font-weight: 600; color: #1e3a5f;">Registration Information</p>
            <p style="font-size: 0.875rem; color: #6b7280;">This LPA must be registered with the Office of the Public Guardian before it can be used. A registration fee applies. Visit <strong>gov.uk/power-of-attorney</strong> for more information.</p>
        </div>

        <hr style="margin: 2rem 0;">
        <p style="text-align: center; font-size: 0.875rem; color: #6b7280;">
            This LPA was generated on ${today} using the Standard LPA Generator.<br>
            Please have this document reviewed by a qualified solicitor before signing.
        </p>
    `;
}

// ========================================
// Pre-filled Government Form (PDF)
// ========================================

// Helper: Parse full name into title, first names, last name
function parseName(fullName) {
    const titles = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Rev', 'Sir', 'Dame'];
    const parts = (fullName || '').trim().split(/\s+/);
    let title = '';
    let firstName = '';
    let lastName = '';

    if (parts.length > 0 && titles.includes(parts[0].replace('.', ''))) {
        title = parts[0].replace('.', '');
        const remaining = parts.slice(1);
        if (remaining.length > 1) {
            lastName = remaining[remaining.length - 1];
            firstName = remaining.slice(0, -1).join(' ');
        } else if (remaining.length === 1) {
            lastName = remaining[0];
        }
    } else {
        if (parts.length > 1) {
            lastName = parts[parts.length - 1];
            firstName = parts.slice(0, -1).join(' ');
        } else {
            firstName = parts[0] || '';
        }
    }
    return { title, firstName, lastName };
}

// Helper: Parse date string (YYYY-MM-DD) into day, month, year
function parseDate(dateStr) {
    if (!dateStr) return { day: '', month: '', year: '' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: '', month: '', year: '' };
    return {
        day: String(d.getDate()).padStart(2, '0'),
        month: String(d.getMonth() + 1).padStart(2, '0'),
        year: String(d.getFullYear())
    };
}

// Helper: Parse address string to extract postcode
function parseAddress(addrStr) {
    if (!addrStr) return { address: '', postcode: '' };
    const postcodeRegex = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\s*$/i;
    const match = addrStr.match(postcodeRegex);
    if (match) {
        return {
            address: addrStr.substring(0, match.index).trim().replace(/,\s*$/, ''),
            postcode: match[1].toUpperCase()
        };
    }
    return { address: addrStr, postcode: '' };
}

// Helper: Split address into lines (max 3 lines)
function splitAddress(addrStr) {
    if (!addrStr) return ['', '', ''];
    const parts = addrStr.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
    while (parts.length < 3) parts.push('');
    return parts.slice(0, 3);
}

// Build instructions text for Section 7 (Standard version)
function buildInstructionsText() {
    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    let lines = [];
    if (isProperty) {
        if (lpaFormData.prefEthicalInvestments) {
            lines.push('My attorney should ensure that all investments are made ethically. Investments should avoid companies involved in activities that conflict with my values.');
        }
        if (lpaFormData.prefPayDebts) {
            lines.push('If I have outstanding debts, my attorney must prioritise settling these debts before making any new financial commitments or investments.');
        }
        if (lpaFormData.prefPropertyMaintained) {
            lines.push('My attorney must manage my property in accordance with my wishes. They should not sell, lease, or otherwise dispose of my property without careful consideration of my best interests and any specific instructions provided.');
        }
        if (lpaFormData.prefFinancialAdvisor) {
            let consultText = 'For any significant financial decision, my attorney must first consult with a qualified financial advisor. A written record of consultations should be maintained.';
            if (lpaFormData.consultThreshold) consultText += ` Consultation required for any transaction over £${lpaFormData.consultThreshold}.`;
            lines.push(consultText);
        }
        if (lpaFormData.additionalFinancialInstructions) lines.push(lpaFormData.additionalFinancialInstructions);
    } else {
        if (lpaFormData.prefHomeCare) {
            lines.push('I would prefer to be cared for at home rather than in a care facility, for as long as practically and financially feasible.');
        }
        if (lpaFormData.prefCareFacility) {
            lines.push('If residential care becomes necessary, I would prefer a care facility that meets specific standards of care and is located conveniently for my family and friends to visit.');
        }
        if (lpaFormData.prefDietaryRequirements) {
            let dietText = 'My dietary requirements must be observed at all times.';
            if (lpaFormData.dietaryDetails) dietText += ` Details: ${lpaFormData.dietaryDetails}`;
            lines.push(dietText);
        }
        if (lpaFormData.prefMentalHealthTreatment) {
            lines.push('If mental health treatment is required, my attorney must ensure that appropriate and sensitive treatment is sought, including counselling or therapy that aligns with my preferences.');
        }
        if (lpaFormData.organDonation === 'consent') {
            lines.push('I consent to organ donation after my death.');
        } else if (lpaFormData.organDonation === 'no-consent') {
            lines.push('I do NOT consent to organ donation after my death.');
        }
        if (lpaFormData.additionalCareInstructions) lines.push(lpaFormData.additionalCareInstructions);
    }
    return lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
}

// Build preferences text for Section 7 (Standard version)
function buildPreferencesText() {
    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    let parts = [];

    if (isProperty) {
        if (lpaFormData.prefCharitableDonations) {
            parts.push('I would prefer that my attorney maintains any existing charitable donation commitments on my behalf.');
        }
        if (lpaFormData.preferredAdvisorBank) parts.push(`Preferred Financial Advisor: ${lpaFormData.preferredAdvisorBank}.`);
        if (lpaFormData.additionalFinancialPreferences) parts.push(lpaFormData.additionalFinancialPreferences);
    } else {
        if (lpaFormData.prefRegularVisitors) {
            parts.push('I would prefer that friends and family are encouraged to visit regularly.');
        }
        if (lpaFormData.prefCulturalPractices) {
            parts.push('My cultural and personal practices should be respected and maintained wherever possible.');
        }
        if (lpaFormData.namedMedicalProfessional) parts.push(`Named Healthcare Professional: ${lpaFormData.namedMedicalProfessional}.`);
        if (lpaFormData.livingArrangements) parts.push(`Living arrangements: ${lpaFormData.livingArrangements}`);
        if (lpaFormData.endOfLifePreferences) parts.push(`End of life preferences: ${lpaFormData.endOfLifePreferences}`);
        // Burial wishes as preferences
        if (lpaFormData.prefBurialArrangements) {
            parts.push('I have specific wishes regarding my burial arrangements. My attorney should ensure these are followed as closely as possible.');
        }
        if (lpaFormData.prefNoEmbalming) {
            parts.push('Embalming should be avoided unless legally required.');
        }
        if (lpaFormData.prefFuneralType) {
            let funeralText = 'I have specific wishes regarding my funeral. My attorney should ensure these are arranged accordingly.';
            if (lpaFormData.emergencyEndOfLifeContact) funeralText += ` Contact for funeral arrangements: ${lpaFormData.emergencyEndOfLifeContact}.`;
            parts.push(funeralText);
        }
        if (lpaFormData.additionalCarePreferences) parts.push(lpaFormData.additionalCarePreferences);
    }

    return parts.join('\n');
}

// Generate summary HTML for the gov form tab
function generateGovFormHTML(today) {
    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    const formLabel = isProperty ? 'LP1F - Property and Financial Affairs' : 'LP1H - Health and Welfare';
    const attorneys = lpaFormData.attorneys || [];
    const replacements = lpaFormData.replacementAttorneys || [];
    const notifyPersons = lpaFormData.notifyPersons || [];

    // Update Section 5 info text
    const s5Info = document.getElementById('govFormSection5Info');
    if (s5Info) {
        s5Info.textContent = isProperty
            ? 'Section 5: When attorneys can act'
            : 'Section 5: Life-sustaining treatment decision';
    }

    const summaryEl = document.getElementById('govFormSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div style="background: #f0f9ff; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem;">
                <h3 style="color: var(--primary); margin-bottom: 1rem;">Pre-fill Summary: ${formLabel}</h3>
                <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 0.5rem; font-weight: 600; width: 40%;">Donor</td>
                        <td style="padding: 0.5rem;">${fullName(lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName) || 'Not provided'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 0.5rem; font-weight: 600;">Attorneys</td>
                        <td style="padding: 0.5rem;">${attorneys.map(a => fullName(a.title, a.firstnames, a.lastname)).filter(n => n).join(', ') || 'None'} (${attorneys.length})</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 0.5rem; font-weight: 600;">Decision type</td>
                        <td style="padding: 0.5rem;">${lpaFormData.attorneyDecision === 'jointly-severally' ? 'Jointly and severally' : lpaFormData.attorneyDecision === 'mixed' ? 'Mixed' : 'Jointly'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 0.5rem; font-weight: 600;">Replacements</td>
                        <td style="padding: 0.5rem;">${replacements.map(a => fullName(a.title, a.firstnames, a.lastname)).filter(n => n).join(', ') || 'None'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 0.5rem; font-weight: 600;">${isProperty ? 'When attorneys can act' : 'Life-sustaining treatment'}</td>
                        <td style="padding: 0.5rem;">${isProperty
                            ? (lpaFormData.attorneysCanAct === 'lack-capacity' ? 'Only when I lack capacity' : 'As soon as registered')
                            : (lpaFormData.lifeSustainingAuthority === 'do-not-give' ? 'Authority NOT given' : 'Authority given')
                        }</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 0.5rem; font-weight: 600;">People to notify</td>
                        <td style="padding: 0.5rem;">${notifyPersons.map(p => fullName(p.title, p.firstnames, p.lastname)).filter(n => n).join(', ') || 'None'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 0.5rem; font-weight: 600;">Certificate provider</td>
                        <td style="padding: 0.5rem;">${fullName(lpaFormData.certProviderTitle, lpaFormData.certProviderFirstNames, lpaFormData.certProviderLastName) || 'Not provided'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem; font-weight: 600;">Preferences & Instructions</td>
                        <td style="padding: 0.5rem;">Included in Section 7</td>
                    </tr>
                </table>
            </div>
        `;
    }

    return '';
}

// Fill and download the official PDF form
async function fillAndDownloadPdf() {
    const isProperty = lpaFormData.lpaType === 'property' || !lpaFormData.lpaType;
    const pdfPath = isProperty ? 'pdfs/LP1F.pdf' : 'pdfs/LP1H.pdf';
    const fileName = isProperty ? 'LP1F-Pre-filled.pdf' : 'LP1H-Pre-filled.pdf';

    const btn = document.getElementById('downloadPdfBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Preparing PDF...';
    }

    try {
        // Load the PDF
        const response = await fetch(pdfPath);
        if (!response.ok) throw new Error(`Could not load ${pdfPath}`);
        const pdfBytes = await response.arrayBuffer();

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const form = pdfDoc.getForm();

        // Helper to safely set text field
        const setText = (fieldName, value) => {
            try {
                const field = form.getTextField(fieldName);
                if (field && value) field.setText(String(value).toUpperCase());
            } catch (e) {
                console.warn(`Field not found: ${fieldName}`, e.message);
            }
        };

        // Helper to safely check checkbox
        const setCheck = (fieldName) => {
            try {
                const field = form.getCheckBox(fieldName);
                if (field) field.check();
            } catch (e) {
                console.warn(`Checkbox not found: ${fieldName}`, e.message);
            }
        };

        // Helper: fill a name/address block
        const fillPerson = (fields, title, firstName, lastName, dob, addr, email) => {
            const d = parseDate(dob);
            const a = parseAddress(addr);
            const al = splitAddress(a.address);
            setText(fields.title, title);
            setText(fields.first, firstName);
            setText(fields.last, lastName);
            if (fields.day) setText(fields.day, d.day);
            if (fields.month) setText(fields.month, d.month);
            if (fields.year) setText(fields.year, d.year);
            setText(fields.addr1, al[0]);
            setText(fields.addr2, al[1]);
            setText(fields.addr3, al[2]);
            setText(fields.postcode, a.postcode);
            if (fields.email && email) setText(fields.email, email);
        };

        // ==========================================
        // SECTION 1: THE DONOR (Page 3)
        // ==========================================
        fillPerson(
            { title: 'Title', first: 'First names', last: 'Last name',
              day: 'Day', month: 'Month', year: 'Year',
              addr1: 'Address 1a', addr2: 'Address 1b', addr3: 'Address 1cc',
              postcode: 'Postcode', email: 'Email address optional' },
            lpaFormData.donorTitle, lpaFormData.donorFirstNames, lpaFormData.donorLastName,
            lpaFormData.donorDob, lpaFormData.donorAddress, lpaFormData.donorEmail
        );
        setText('Any other names youre known by optional  eg your married name', lpaFormData.donorAka);

        // ==========================================
        // SECTION 2: ATTORNEYS (Pages 4-5)
        // Page 4: Attorneys 1 & 2
        // Page 5: Attorneys 3 & 4
        // ==========================================
        const attorneys = lpaFormData.attorneys || [];

        const attorneyFields = [
            // Attorney 1 (Page 4) - postcode is undefined_2
            { title: 'Title_2', first: 'First names_2', last: 'Last name_2',
              day: 'Day_3', month: 'Month_3', year: 'Year_3',
              addr1: 'Address 1_2', addr2: 'Address 1_2b', addr3: 'Address 1_2c',
              postcode: 'undefined_2', email: 'Email address optional_2' },
            // Attorney 2 (Page 4) - postcode is undefined_3
            { title: 'Title_3', first: 'First names_3', last: 'Last name_3',
              day: 'Day_4', month: 'Month_4', year: 'Year_4',
              addr1: 'Address 1_3', addr2: 'Address 1_3b', addr3: 'Address 1_3c',
              postcode: 'undefined_3', email: 'Email address optional_3' },
            // Attorney 3 (Page 5) - postcode is undefined_4
            { title: 'Title_4', first: 'First names_4', last: 'Last name_4',
              day: 'Day_5', month: 'Month_5', year: 'Year_5',
              addr1: 'Address 1_4a', addr2: 'Address 1_4b', addr3: 'Address 1_4c',
              postcode: 'undefined_4', email: 'Email address optional_4' },
            // Attorney 4 (Page 5) - postcode is undefined_5
            { title: 'Title_5', first: 'First names_5', last: 'Last name_5',
              day: 'Day_6', month: 'Month_6', year: 'Year_6',
              addr1: 'Address 1_5a', addr2: 'Address 1_5b', addr3: 'Address 1_5c',
              postcode: 'undefined_5', email: 'Email address optional_5' },
        ];

        attorneys.forEach((att, i) => {
            if (i >= 4) return;
            fillPerson(attorneyFields[i], att.title, att.firstnames, att.lastname, att.dob, att.address, att.email);
        });

        // ==========================================
        // SECTION 3: HOW ATTORNEYS MAKE DECISIONS (Page 6)
        // ==========================================
        const decision = lpaFormData.attorneyDecision;
        if (attorneys.length > 1) {
            if (decision === 'jointly-severally') {
                setCheck('Jointly and severally');
            } else if (decision === 'jointly') {
                setCheck('Jointly and severally');
            } else if (decision === 'mixed') {
                setCheck('Jointly and severally');
            }
        }

        // ==========================================
        // SECTION 4: REPLACEMENT ATTORNEYS (Page 7)
        // ==========================================
        const replacements = lpaFormData.replacementAttorneys || [];

        const replacementFields = [
            // Replacement 1 (Page 7) - postcode is undefined_6
            { title: 'Title_6', first: 'First names_6', last: 'Last name_6',
              day: 'Day_7', month: 'Month_7', year: 'Year_7',
              addr1: 'Address 1_6a', addr2: 'Address 1_6b', addr3: 'Address 1_6c',
              postcode: 'undefined_6' },
            // Replacement 2 - postcode is undefined_7
            { title: 'Title_7', first: 'First names_7', last: 'Last name_7',
              day: 'Day_8', month: 'Month_8', year: 'Year_8',
              addr1: 'Address 1_7a', addr2: 'Address 1_7b', addr3: 'Address 1_7c',
              postcode: 'undefined_7' },
        ];

        replacements.forEach((att, i) => {
            if (i >= 2) return;
            fillPerson(replacementFields[i], att.title, att.firstnames, att.lastname, att.dob, att.address);
        });

        // ==========================================
        // SECTION 5: LP1F - When attorneys can act (Page 8)
        //             LP1H - Life-sustaining treatment
        // ==========================================
        if (isProperty) {
            if (lpaFormData.attorneysCanAct === 'registered' || !lpaFormData.attorneysCanAct) {
                setCheck('As soon as my LPA has been registered');
            }
        }

        // ==========================================
        // SECTION 6: PEOPLE TO NOTIFY (Page 9)
        // ==========================================
        const notifyPersons = lpaFormData.notifyPersons || [];

        const notifyFields = [
            // Person 1 - postcode is undefined_8
            { title: 'Title_8', first: 'First names_8', last: 'Last name_8',
              addr1: 'Address 1_8a', addr2: 'Address 1_8b', addr3: 'Address 1_8c',
              postcode: 'undefined_8' },
            // Person 2 - postcode is undefined_9
            { title: 'Title_9', first: 'First names_9', last: 'Last name_9',
              addr1: 'Address 1_9a', addr2: 'Address 1_9b', addr3: 'Address 1_9c',
              postcode: 'undefined_9' },
            // Person 3 - postcode is undefined_10
            { title: 'Title_10', first: 'First names_10', last: 'Last name_10',
              addr1: 'Address 1_10a', addr2: 'Address 1_10b', addr3: 'Address 1_10c',
              postcode: 'undefined_10' },
            // Person 4 - postcode is undefined_11
            { title: 'Title_11', first: 'First names_11', last: 'Last name_11',
              addr1: 'Address 1_11a', addr2: 'Address 1_11b', addr3: 'Address 1_11c',
              postcode: 'undefined_11' },
        ];

        notifyPersons.forEach((person, i) => {
            if (i >= 4) return;
            fillPerson(notifyFields[i], person.title, person.firstnames, person.lastname, null, person.address);
        });

        // ==========================================
        // SECTION 7: PREFERENCES AND INSTRUCTIONS (Page 10)
        // ==========================================
        const instructionsText = buildInstructionsText();
        const preferencesText = buildPreferencesText();

        const MAIN_FIELD_LIMIT = 600;

        // Helper: split text at a line break near the limit
        const splitAtLimit = (text, limit) => {
            if (text.length <= limit) return { main: text, overflow: '' };
            let splitPos = text.lastIndexOf('\n', limit);
            if (splitPos < limit * 0.3) splitPos = limit;
            return {
                main: text.substring(0, splitPos).trim() + '\n(continued on Continuation Sheet 2)',
                overflow: text.substring(splitPos).trim()
            };
        };

        // Helper: distribute overflow text across continuation fields
        const fillOverflow = (text, fieldNames) => {
            if (!text) return;
            const CONT_LIMIT = 500;
            let remaining = text;
            fieldNames.forEach(fieldName => {
                if (!remaining) return;
                const lastBreak = remaining.length > CONT_LIMIT ? remaining.lastIndexOf('\n', CONT_LIMIT) : -1;
                const splitAt = (lastBreak > CONT_LIMIT * 0.3) ? lastBreak : Math.min(CONT_LIMIT, remaining.length);
                setText(fieldName, remaining.substring(0, splitAt).trim());
                remaining = remaining.substring(splitAt).trim();
            });
        };

        // Instructions
        if (instructionsText.length > MAIN_FIELD_LIMIT) {
            const split = splitAtLimit(instructionsText, MAIN_FIELD_LIMIT);
            setText('Instructions  use words like must and have to', split.main);
            fillOverflow(split.overflow, ['Text5', 'Text5a', 'Text5b', 'Text5c']);
            setCheck('I need more space  use Continuation sheet 2_2');
        } else {
            setText('Instructions  use words like must and have to', instructionsText);
        }

        // Preferences
        if (preferencesText.length > MAIN_FIELD_LIMIT) {
            const split = splitAtLimit(preferencesText, MAIN_FIELD_LIMIT);
            setText('Preferences  use words like prefer and would like', split.main);
            fillOverflow(split.overflow, ['Text4', 'Text4a', 'Text4b', 'Text4c']);
            setCheck('I need more space  use Continuation sheet 2');
        } else {
            setText('Preferences  use words like prefer and would like', preferencesText);
        }

        // ==========================================
        // SECTION 10: CERTIFICATE PROVIDER (Page 13)
        // ==========================================
        const certAddr = parseAddress(lpaFormData.certProviderAddress);
        const certAddrLines = splitAddress(certAddr.address);

        setText('Title_12', lpaFormData.certProviderTitle);
        setText('First names_12', lpaFormData.certProviderFirstNames);
        setText('Last name_12', lpaFormData.certProviderLastName);
        setText('Address 1_13a', certAddrLines[0]);
        setText('Address 1_13b', certAddrLines[1]);
        setText('Address 1_13c', certAddrLines[2]);
        setText('undefined_15', certAddr.postcode);

        // ==========================================
        // SECTION 11: ATTORNEY SIGNATURE PAGES (Pages 14-17)
        // ==========================================
        const allSigners = [...attorneys, ...replacements];
        const s11Fields = [
            { title: 'Title_13', first: 'First names_13', last: 'Last name_13' },
            { title: 'Title_14', first: 'First names_14', last: 'Last name_14' },
            { title: 'Title_15', first: 'First names_15', last: 'Last name_15' },
            { title: 'Title_16', first: 'First names_16', last: 'Last name_16' },
        ];

        allSigners.forEach((signer, i) => {
            if (i >= 4) return;
            setText(s11Fields[i].title, signer.title);
            setText(s11Fields[i].first, signer.firstnames);
            setText(s11Fields[i].last, signer.lastname);
        });

        // ==========================================
        // SECTION 12: THE APPLICANT (Page 19)
        // ==========================================
        setText('Title_17', lpaFormData.donorTitle);
        setText('First names_17', lpaFormData.donorFirstNames);
        setText('Last name_17', lpaFormData.donorLastName);
        const donorDobForReg = parseDate(lpaFormData.donorDob);
        setText('Day_9', donorDobForReg.day);
        setText('Month_15', donorDobForReg.month);
        setText('Year_15', donorDobForReg.year);
        setCheck('Donor the donor needs to sign section 15');

        // ==========================================
        // SECTION 13: WHO RECEIVES THE LPA (Page 20)
        // ==========================================
        setText('Title_21', lpaFormData.donorTitle);
        setText('First names_21', lpaFormData.donorFirstNames);
        setText('Last name_21', lpaFormData.donorLastName);
        const corrAddr = parseAddress(lpaFormData.donorAddress);
        const corrAddrLines = splitAddress(corrAddr.address);
        setText('Address 1_18a', corrAddrLines[0]);
        setText('Address 1_18b', corrAddrLines[1]);
        setText('Address 1_18c', corrAddrLines[2]);
        setText('undefined_29', corrAddr.postcode);
        if (lpaFormData.donorEmail) setCheck('Email');
        if (lpaFormData.donorPhone) setText('Your phone number', lpaFormData.donorPhone);

        // Save and download
        const filledPdfBytes = await pdfDoc.save();
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Download Pre-filled PDF';
        }

    } catch (error) {
        console.error('PDF fill error:', error);
        alert('Error preparing PDF: ' + error.message + '\n\nPlease make sure you are viewing the page from a web server (not opening the file directly).');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Download Pre-filled PDF';
        }
    }
}

// ========================================
// Document Tab Switching & Print
// ========================================

function showStandardDoc() {
    document.getElementById('standardLpaDoc').style.display = 'block';
    document.getElementById('govFormDoc').style.display = 'none';
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.doc-tab[data-tab="standard"]').classList.add('active');
}

function showGovForm() {
    document.getElementById('standardLpaDoc').style.display = 'none';
    document.getElementById('govFormDoc').style.display = 'block';
    document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.doc-tab[data-tab="gov"]').classList.add('active');
}

function printCurrentDoc() {
    window.print();
}

function downloadPDF() {
    fillAndDownloadPdf();
}
