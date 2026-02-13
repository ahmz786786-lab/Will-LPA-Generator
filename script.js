// ========================================
// Islamic Will Generator - JavaScript
// ========================================

// Supabase Configuration
const SUPABASE_URL = 'https://gyvzfylmvocrriwoemhf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dnpmeWxtdm9jcnJpd29lbWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjAyOTEsImV4cCI6MjA4NjQ5NjI5MX0.H6E2iAWkqi82szU52_jtbBSyzPKTlAt5jqgRsYt9Kfk';

// Initialize Supabase (with error handling)
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
const totalSteps = 12;
let formData = {};

// Counters for dynamic lists
let childCount = 0;
let debtCount = 0;
let debtOwedCount = 0;
let propertyCount = 0;
let bankCount = 0;
let investmentCount = 0;
let businessCount = 0;
let vehicleCount = 0;
let valuableCount = 0;
let charitableCount = 0;
let nonHeirCount = 0;
let adoptedCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    initSupabase();
    initProgressSteps();
    updateProgress();
    setupEventListeners();
    loadProgress();
    setupToolbarUpdates();
    console.log('Initialization complete');
});

// Setup toolbar auto-updates
function setupToolbarUpdates() {
    const nameInput = document.getElementById('fullName');
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
        titleEl.textContent = name || 'New Will';
    }
}

// Initialize progress steps
function initProgressSteps() {
    const stepsContainer = document.getElementById('progressSteps');
    const stepLabels = [
        'Welcome', 'Personal', 'Executors', 'Funeral', 'Debts',
        'Assets', 'Wasiyyah', 'Family', 'Guardian', 'Special', 'Review', 'Complete'
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

    // Update step indicators
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else if (index + 1 < currentStep) {
            step.classList.add('completed');
        }
    });

    // Update navigation buttons
    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'flex';

    const nextBtn = document.getElementById('nextBtn');
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
    } else if (currentStep === totalSteps - 1) {
        nextBtn.innerHTML = 'Generate Will <span class="icon">✓</span>';
        nextBtn.style.display = 'flex';
    } else {
        nextBtn.innerHTML = 'Next <span class="icon">→</span>';
        nextBtn.style.display = 'flex';
    }
}

// Change step
function changeStep(direction) {
    // Validate current step before proceeding
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }

    // Save current step data
    saveStepData();

    // Move to next/prev step
    currentStep += direction;
    currentStep = Math.max(1, Math.min(totalSteps, currentStep));

    // Update UI
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

    updateProgress();

    // Special handling for review and generate steps
    if (currentStep === 11) {
        generateReview();
    } else if (currentStep === 12) {
        generateWill();
    }

    // Scroll to top
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

    // Step-specific validation
    if (step === 1) {
        const shahadaCheck = document.getElementById('shahadaConfirm');
        if (!shahadaCheck.checked) {
            alert('Please confirm the Declaration of Faith (Shahada) to proceed.');
            return false;
        }
        return true;
    }

    // Check required text/select fields (not checkboxes or radios)
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
                formData[input.name] = input.value;
            }
        } else if (input.type === 'checkbox') {
            formData[input.id] = input.checked;
        } else {
            formData[input.id] = input.value;
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Burial location toggle
    document.querySelectorAll('input[name="burialLocation"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('repatriationCountryGroup').style.display =
                e.target.value === 'repatriate' ? 'block' : 'none';
        });
    });

    // Marital status toggle
    document.getElementById('maritalStatus').addEventListener('change', (e) => {
        document.getElementById('spouseSection').style.display =
            e.target.value === 'married' ? 'block' : 'none';
    });

    // Mahr status toggle
    document.querySelectorAll('input[name="mahrStatus"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('mahrAmountGroup').style.display =
                e.target.value === 'outstanding' ? 'block' : 'none';
        });
    });

    // Children toggle
    document.querySelectorAll('input[name="hasChildren"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('childrenSection').style.display =
                e.target.value === 'yes' ? 'block' : 'none';
        });
    });

    // Parent status toggles
    document.getElementById('fatherStatus').addEventListener('change', (e) => {
        document.getElementById('fatherNameGroup').style.display =
            e.target.value === 'living' ? 'block' : 'none';
    });

    document.getElementById('motherStatus').addEventListener('change', (e) => {
        document.getElementById('motherNameGroup').style.display =
            e.target.value === 'living' ? 'block' : 'none';
    });

    // Hajj status toggle
    document.getElementById('hajjStatus').addEventListener('change', (e) => {
        document.getElementById('hajjBadalSection').style.display =
            e.target.value === 'obligatory-not-performed' ? 'block' : 'none';
    });

    // Crypto toggle
    document.getElementById('hasCrypto').addEventListener('change', (e) => {
        document.getElementById('cryptoSection').style.display =
            e.target.checked ? 'block' : 'none';
    });

    // Wasiyyah toggle
    document.querySelectorAll('input[name="makeWasiyyah"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('wasiyyahSection').style.display =
                e.target.value === 'yes' ? 'block' : 'none';
        });
    });

    // Minor children toggle
    document.querySelectorAll('input[name="hasMinorChildren"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('guardianshipSection').style.display =
                e.target.value === 'yes' ? 'block' : 'none';
        });
    });

    // Non-Muslim relatives toggle
    document.querySelectorAll('input[name="hasNonMuslimRelatives"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('nonMuslimSection').style.display =
                e.target.value === 'yes' ? 'block' : 'none';
        });
    });
}

// Dynamic list functions
function addChild() {
    childCount++;
    const container = document.getElementById('childrenList');
    const html = `
        <div class="list-item" id="child-${childCount}">
            <div class="list-item-header">
                <span class="list-item-title">Child ${childCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('child-${childCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="childName-${childCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Gender</label>
                    <select class="form-input" id="childGender-${childCount}">
                        <option value="male">Male (Son)</option>
                        <option value="female">Female (Daughter)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-input" id="childDOB-${childCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">From Marriage To</label>
                    <input type="text" class="form-input" id="childMother-${childCount}" placeholder="Mother's name">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addDebt() {
    debtCount++;
    const container = document.getElementById('debtsList');
    const html = `
        <div class="list-item" id="debt-${debtCount}">
            <div class="list-item-header">
                <span class="list-item-title">Debt ${debtCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('debt-${debtCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Creditor Name</label>
                    <input type="text" class="form-input" id="debtCreditor-${debtCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-input" id="debtType-${debtCount}">
                        <option value="Mortgage">Mortgage</option>
                        <option value="Loan">Personal Loan</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Car Finance">Car Finance</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Amount Owed</label>
                    <input type="number" class="form-input" id="debtAmount-${debtCount}" placeholder="£">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addDebtOwed() {
    debtOwedCount++;
    const container = document.getElementById('debtsOwedList');
    const html = `
        <div class="list-item" id="debtOwed-${debtOwedCount}">
            <div class="list-item-header">
                <span class="list-item-title">Debt Owed to Me ${debtOwedCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('debtOwed-${debtOwedCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Debtor Name</label>
                    <input type="text" class="form-input" id="debtOwedDebtor-${debtOwedCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Amount</label>
                    <input type="number" class="form-input" id="debtOwedAmount-${debtOwedCount}" placeholder="£">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addProperty() {
    propertyCount++;
    const container = document.getElementById('propertiesList');
    const html = `
        <div class="list-item" id="property-${propertyCount}">
            <div class="list-item-header">
                <span class="list-item-title">Property ${propertyCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('property-${propertyCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label class="form-label">Property Address</label>
                    <textarea class="form-input" id="propertyAddress-${propertyCount}" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Country</label>
                    <input type="text" class="form-input" id="propertyCountry-${propertyCount}" value="United Kingdom">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-input" id="propertyType-${propertyCount}">
                        <option value="Freehold">Freehold</option>
                        <option value="Leasehold">Leasehold</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Ownership</label>
                    <select class="form-input" id="propertyOwnership-${propertyCount}">
                        <option value="Sole">Sole Owner</option>
                        <option value="Joint Tenants">Joint Tenants</option>
                        <option value="Tenants in Common">Tenants in Common</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Estimated Value</label>
                    <input type="number" class="form-input" id="propertyValue-${propertyCount}" placeholder="£">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addBankAccount() {
    bankCount++;
    const container = document.getElementById('bankAccountsList');
    const html = `
        <div class="list-item" id="bank-${bankCount}">
            <div class="list-item-header">
                <span class="list-item-title">Bank Account ${bankCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('bank-${bankCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Bank Name</label>
                    <input type="text" class="form-input" id="bankName-${bankCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Account Type</label>
                    <select class="form-input" id="bankType-${bankCount}">
                        <option value="Current">Current Account</option>
                        <option value="Savings">Savings Account</option>
                        <option value="ISA">ISA</option>
                        <option value="Joint">Joint Account</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Approximate Balance</label>
                    <input type="number" class="form-input" id="bankBalance-${bankCount}" placeholder="£">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addInvestment() {
    investmentCount++;
    const container = document.getElementById('investmentsList');
    const html = `
        <div class="list-item" id="investment-${investmentCount}">
            <div class="list-item-header">
                <span class="list-item-title">Investment ${investmentCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('investment-${investmentCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-input" id="investmentType-${investmentCount}">
                        <option value="Stocks/Shares">Stocks/Shares</option>
                        <option value="Bonds">Bonds</option>
                        <option value="Unit Trusts">Unit Trusts</option>
                        <option value="Pension">Pension</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Provider</label>
                    <input type="text" class="form-input" id="investmentProvider-${investmentCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Estimated Value</label>
                    <input type="number" class="form-input" id="investmentValue-${investmentCount}" placeholder="£">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addBusiness() {
    businessCount++;
    const container = document.getElementById('businessList');
    const html = `
        <div class="list-item" id="business-${businessCount}">
            <div class="list-item-header">
                <span class="list-item-title">Business ${businessCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('business-${businessCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Business Name</label>
                    <input type="text" class="form-input" id="businessName-${businessCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-input" id="businessType-${businessCount}">
                        <option value="Sole Trader">Sole Trader</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Limited Company">Limited Company</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Ownership %</label>
                    <input type="number" class="form-input" id="businessOwnership-${businessCount}" placeholder="%" max="100">
                </div>
                <div class="form-group">
                    <label class="form-label">Estimated Value</label>
                    <input type="number" class="form-input" id="businessValue-${businessCount}" placeholder="£">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addVehicle() {
    vehicleCount++;
    const container = document.getElementById('vehiclesList');
    const html = `
        <div class="list-item" id="vehicle-${vehicleCount}">
            <div class="list-item-header">
                <span class="list-item-title">Vehicle ${vehicleCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('vehicle-${vehicleCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Make & Model</label>
                    <input type="text" class="form-input" id="vehicleMake-${vehicleCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Registration</label>
                    <input type="text" class="form-input" id="vehicleReg-${vehicleCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Estimated Value</label>
                    <input type="number" class="form-input" id="vehicleValue-${vehicleCount}" placeholder="£">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addValuable() {
    valuableCount++;
    const container = document.getElementById('valuablesList');
    const html = `
        <div class="list-item" id="valuable-${valuableCount}">
            <div class="list-item-header">
                <span class="list-item-title">Valuable ${valuableCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('valuable-${valuableCount}')">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Item Description</label>
                    <input type="text" class="form-input" id="valuableDesc-${valuableCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" id="valuableCategory-${valuableCount}">
                        <option value="Jewellery">Jewellery</option>
                        <option value="Gold/Silver">Gold/Silver</option>
                        <option value="Watch">Watch</option>
                        <option value="Art">Art</option>
                        <option value="Antiques">Antiques</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Estimated Value</label>
                    <input type="number" class="form-input" id="valuableValue-${valuableCount}" placeholder="£">
                </div>
                <div class="form-group">
                    <label class="form-label">Specific Recipient (optional)</label>
                    <input type="text" class="form-input" id="valuableRecipient-${valuableCount}" placeholder="Leave blank for Faraid distribution">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addCharitable() {
    charitableCount++;
    const container = document.getElementById('charitableList');
    const html = `
        <div class="list-item" id="charitable-${charitableCount}">
            <div class="list-item-header">
                <span class="list-item-title">Charity ${charitableCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('charitable-${charitableCount}'); updateWasiyyahMeter();">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Charity Name</label>
                    <input type="text" class="form-input" id="charityName-${charitableCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Registration Number (optional)</label>
                    <input type="text" class="form-input" id="charityReg-${charitableCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Percentage of Estate</label>
                    <input type="number" class="form-input" id="charityPercent-${charitableCount}" placeholder="%" max="33" onchange="updateWasiyyahMeter()">
                </div>
                <div class="form-group">
                    <label class="form-label">Purpose (optional)</label>
                    <input type="text" class="form-input" id="charityPurpose-${charitableCount}" placeholder="e.g., Mosque building, education">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addNonHeir() {
    nonHeirCount++;
    const container = document.getElementById('nonHeirList');
    const html = `
        <div class="list-item" id="nonHeir-${nonHeirCount}">
            <div class="list-item-header">
                <span class="list-item-title">Non-Heir ${nonHeirCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('nonHeir-${nonHeirCount}'); updateWasiyyahMeter();">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="nonHeirName-${nonHeirCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Relationship</label>
                    <input type="text" class="form-input" id="nonHeirRelation-${nonHeirCount}" placeholder="e.g., Friend, Nephew">
                </div>
                <div class="form-group">
                    <label class="form-label">Percentage of Estate</label>
                    <input type="number" class="form-input" id="nonHeirPercent-${nonHeirCount}" placeholder="%" max="33" onchange="updateWasiyyahMeter()">
                </div>
                <div class="form-group">
                    <label class="form-label">Reason (optional)</label>
                    <input type="text" class="form-input" id="nonHeirReason-${nonHeirCount}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addAdopted() {
    adoptedCount++;
    const container = document.getElementById('adoptedList');
    const html = `
        <div class="list-item" id="adopted-${adoptedCount}">
            <div class="list-item-header">
                <span class="list-item-title">Adopted Child ${adoptedCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('adopted-${adoptedCount}'); updateWasiyyahMeter();">Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="adoptedName-${adoptedCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Date Adopted</label>
                    <input type="date" class="form-input" id="adoptedDate-${adoptedCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Percentage of Estate</label>
                    <input type="number" class="form-input" id="adoptedPercent-${adoptedCount}" placeholder="%" max="33" onchange="updateWasiyyahMeter()">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function removeItem(id) {
    document.getElementById(id).remove();
}

function updateWasiyyahMeter() {
    let total = 0;

    // Sum all wasiyyah percentages
    document.querySelectorAll('[id^="charityPercent-"], [id^="nonHeirPercent-"], [id^="adoptedPercent-"]').forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    const percentage = Math.min(total, 100);
    document.getElementById('wasiyyahPercentage').textContent = `${total.toFixed(1)}%`;
    document.getElementById('wasiyyahFill').style.width = `${percentage}%`;

    // Change color if over limit
    if (total > 33.33) {
        document.getElementById('wasiyyahFill').style.background = 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)';
    } else {
        document.getElementById('wasiyyahFill').style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
    }
}

// Save progress to localStorage and optionally to Supabase
async function saveProgress() {
    saveStepData();

    // Collect all dynamic list data
    formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
    formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
    formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
    formData.bankAccounts = collectListData('bank', bankCount, ['Name', 'Type', 'Balance']);
    formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
    formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
    formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
    formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value', 'Recipient']);
    formData.charities = collectListData('charity', charitableCount, ['Name', 'Reg', 'Percent', 'Purpose']);
    formData.nonHeirs = collectListData('nonHeir', nonHeirCount, ['Name', 'Relation', 'Percent', 'Reason']);
    formData.adopted = collectListData('adopted', adoptedCount, ['Name', 'Date', 'Percent']);

    formData.currentStep = currentStep;

    // Save to localStorage
    localStorage.setItem('islamicWillData', JSON.stringify(formData));
    alert('Progress saved! You can continue later.');
}

// Save completed will to Supabase
async function saveWillToDatabase(status = 'draft') {
    if (!supabaseClient) {
        console.warn('Supabase not initialized, skipping database save');
        return null;
    }

    saveStepData();

    // Collect all data
    formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
    formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
    formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
    formData.bankAccounts = collectListData('bank', bankCount, ['Name', 'Type', 'Balance']);
    formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
    formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
    formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
    formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value', 'Recipient']);
    formData.charities = collectListData('charity', charitableCount, ['Name', 'Reg', 'Percent', 'Purpose']);
    formData.nonHeirs = collectListData('nonHeir', nonHeirCount, ['Name', 'Relation', 'Percent', 'Reason']);
    formData.adopted = collectListData('adopted', adoptedCount, ['Name', 'Date', 'Percent']);

    try {
        const willRecord = {
            // Testator Personal Info
            testator_name: formData.fullName || '',
            testator_aka: formData.alsoKnownAs || '',
            testator_email: formData.email || '',
            testator_phone: formData.phone || '',
            testator_address: formData.address || '',
            testator_dob: formData.dateOfBirth || null,
            testator_pob: formData.placeOfBirth || '',
            testator_gender: formData.testatorGender || '',
            testator_ni: formData.niNumber || '',
            testator_passport: formData.passportNumber || '',
            testator_country: formData.countryOfOrigin || '',

            // Will Type
            will_type: formData.willType || 'simple',

            // Executor 1
            executor1_name: formData.executor1Name || '',
            executor1_address: formData.executor1Address || '',
            executor1_relationship: formData.executor1Relationship || '',
            executor1_phone: formData.executor1Phone || '',
            executor1_email: formData.executor1Email || '',

            // Executor 2
            executor2_name: formData.executor2Name || '',
            executor2_address: formData.executor2Address || '',
            executor2_relationship: formData.executor2Relationship || '',
            executor2_phone: formData.executor2Phone || '',
            executor2_email: formData.executor2Email || '',

            // Funeral
            burial_location: formData.burialLocation || 'uk',
            repatriation_country: formData.repatriationCountry || '',
            preferred_cemetery: formData.preferredCemetery || '',
            preferred_mosque: formData.preferredMosque || '',
            funeral_instructions: formData.funeralInstructions || '',
            funeral_budget: formData.funeralBudget ? parseFloat(formData.funeralBudget) : 0,

            // Family
            marital_status: formData.maritalStatus || '',
            spouse_name: formData.spouseName || '',
            marriage_date: formData.marriageDate || null,
            mahr_status: formData.mahrStatus || '',
            mahr_amount: formData.mahrAmount ? parseFloat(formData.mahrAmount) : 0,
            has_children: formData.hasChildren === 'yes',
            father_status: formData.fatherStatus || '',
            father_name: formData.fatherName || '',
            mother_status: formData.motherStatus || '',
            mother_name: formData.motherName || '',

            // Religious Obligations
            unpaid_zakat: formData.unpaidZakat ? parseFloat(formData.unpaidZakat) : 0,
            fidyah_days: formData.fidyahDays ? parseInt(formData.fidyahDays) : 0,
            kaffarah: formData.kaffarah ? parseFloat(formData.kaffarah) : 0,
            hajj_status: formData.hajjStatus || '',
            hajj_badal: formData.arrangeHajjBadal || false,
            forgiven_debts: formData.forgivenDebts || '',

            // Wasiyyah
            make_wasiyyah: formData.makeWasiyyah === 'yes',

            // Guardianship
            has_minor_children: formData.hasMinorChildren === 'yes',
            guardian1_name: formData.guardian1Name || '',
            guardian1_address: formData.guardian1Address || '',
            guardian1_relationship: formData.guardian1Relationship || '',
            guardian1_phone: formData.guardian1Phone || '',
            guardian1_religion: formData.guardian1Religion || '',
            guardian2_name: formData.guardian2Name || '',
            guardian2_address: formData.guardian2Address || '',
            guardian2_relationship: formData.guardian2Relationship || '',
            upbringing_wishes: formData.otherUpbringingWishes || '',

            // Special
            organ_donation: formData.organDonation || 'defer',
            has_non_muslim_relatives: formData.hasNonMuslimRelatives === 'yes',
            non_muslim_relatives: formData.nonMuslimRelatives || '',
            preferred_scholar: formData.preferredScholar || '',
            madhab: formData.madhab || '',
            additional_wishes: formData.additionalWishes || '',
            people_forgiven: formData.peopleForgiven || '',

            // All Data as JSON (backup)
            will_data: formData,
            children_data: formData.children || [],
            debts_data: formData.debts || [],
            assets_data: {
                properties: formData.properties || [],
                bankAccounts: formData.bankAccounts || [],
                investments: formData.investments || [],
                businesses: formData.businesses || [],
                vehicles: formData.vehicles || [],
                valuables: formData.valuables || []
            },
            wasiyyah_data: {
                charities: formData.charities || [],
                nonHeirs: formData.nonHeirs || [],
                adopted: formData.adopted || []
            },

            // Status
            status: status
        };

        // Check if we're updating an existing will or creating new
        if (formData.willId) {
            // Update existing
            const { data, error } = await supabaseClient
                .from('islamic_wills')
                .update(willRecord)
                .eq('id', formData.willId)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabaseClient
            .from('islamic_wills')
            .insert(willRecord)
            .select()
            .single();

        if (error) throw error;

        formData.willId = data.id;
        localStorage.setItem('islamicWillData', JSON.stringify(formData));

        return data;
    } catch (error) {
        console.error('Error saving will:', error);
        throw error;
    }
}

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

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('islamicWillData');
    if (saved) {
        formData = JSON.parse(saved);
        // Restore would need more complex logic - simplified for now
    }
}

// Save and start new client
async function saveAndStartNew() {
    if (!formData.fullName) {
        if (!confirm('No client data entered. Start a new will anyway?')) {
            return;
        }
    } else {
        // Save current progress
        saveStepData();

        // Collect all data
        formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
        formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
        formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);

        // Save to database if available
        if (supabaseClient) {
            try {
                await saveWillToDatabase();
                alert(`Will for ${formData.fullName} saved successfully!`);
            } catch (error) {
                console.error('Error saving:', error);
                // Save to localStorage as backup
                const savedWills = JSON.parse(localStorage.getItem('savedWills') || '[]');
                formData.savedAt = new Date().toISOString();
                formData.localId = Date.now();
                savedWills.push(formData);
                localStorage.setItem('savedWills', JSON.stringify(savedWills));
                alert(`Will saved locally for ${formData.fullName}`);
            }
        } else {
            // Save to localStorage
            const savedWills = JSON.parse(localStorage.getItem('savedWills') || '[]');
            formData.savedAt = new Date().toISOString();
            formData.localId = Date.now();
            savedWills.push(formData);
            localStorage.setItem('savedWills', JSON.stringify(savedWills));
            alert(`Will saved locally for ${formData.fullName}`);
        }
    }

    // Reset form
    resetForm();
}

// Reset form for new client
function resetForm() {
    console.log('resetForm called');

    // Confirm if there's data
    if (formData.fullName && !confirm('Are you sure you want to start a new will? Unsaved changes will be lost.')) {
        return;
    }

    // Clear form data
    formData = {};
    localStorage.removeItem('islamicWillData');

    // Update toolbar
    updateToolbar('');

    // Reset counters
    childCount = 0;
    debtCount = 0;
    debtOwedCount = 0;
    propertyCount = 0;
    bankCount = 0;
    investmentCount = 0;
    businessCount = 0;
    vehicleCount = 0;
    valuableCount = 0;
    charitableCount = 0;
    nonHeirCount = 0;
    adoptedCount = 0;

    // Clear all dynamic lists
    document.querySelectorAll('#childrenList, #debtsList, #debtsOwedList, #propertiesList, #bankAccountsList, #investmentsList, #businessList, #vehiclesList, #valuablesList, #charitableList, #nonHeirList, #adoptedList').forEach(el => {
        if (el) el.innerHTML = '';
    });

    // Reset all form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = input.defaultChecked;
        } else {
            input.value = input.defaultValue || '';
        }
    });

    // Go to step 1
    currentStep = 1;
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.querySelector('.step[data-step="1"]').classList.add('active');
    updateProgress();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Variables for load options
let pendingLoadWill = null;

// Load saved wills modal
async function loadSavedWills() {
    console.log('loadSavedWills called');

    const modal = document.getElementById('savedWillsModal');
    const listContainer = document.getElementById('savedWillsList');

    if (!modal) {
        console.error('Modal element not found!');
        alert('Error: Could not open saved wills panel');
        return;
    }

    modal.style.display = 'flex';
    listContainer.innerHTML = '<p>Loading saved wills...</p>';

    let wills = [];

    // Try to load from Supabase
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('islamic_wills')
                .select('id, testator_name, testator_email, will_type, status, created_at, reference_number')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                wills = data.map(w => ({
                    id: w.id,
                    name: w.testator_name,
                    email: w.testator_email,
                    type: w.will_type,
                    status: w.status || 'draft',
                    date: w.created_at,
                    reference: w.reference_number,
                    source: 'database'
                }));
            }
        } catch (e) {
            console.warn('Could not load from database:', e);
        }
    }

    // Also load from localStorage
    const localWills = JSON.parse(localStorage.getItem('savedWills') || '[]');
    localWills.forEach(w => {
        wills.push({
            id: w.localId,
            name: w.fullName,
            email: w.email,
            type: w.willType,
            status: w.isCompleted ? 'completed' : 'draft',
            date: w.savedAt,
            source: 'local'
        });
    });

    if (wills.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #64748b;">No saved wills found.</p>';
        return;
    }

    // Store wills data for button handlers
    window.loadedWillsList = wills;

    listContainer.innerHTML = wills.map((w, index) => `
        <div class="saved-will-card">
            <div class="saved-will-info">
                <h4>${w.name || 'Unnamed'} ${w.reference ? `<small>(${w.reference})</small>` : ''}</h4>
                <p>${w.email || 'No email'} • ${w.type || 'simple'} will • ${new Date(w.date).toLocaleDateString()}</p>
                <span class="status-badge ${w.status}">${w.status === 'completed' ? '✓ Completed' : 'Draft'}</span>
                <span style="font-size: 0.75rem; color: #94a3b8; margin-left: 0.5rem;">${w.source === 'local' ? '(Local)' : '(Database)'}</span>
            </div>
            <div class="saved-will-actions">
                <button class="btn btn-primary" data-action="open" data-index="${index}">
                    ${w.status === 'completed' ? '📄 Open' : '✏️ Edit'}
                </button>
                <button class="btn btn-secondary" data-action="delete" data-index="${index}" style="color: #dc2626;">Delete</button>
            </div>
        </div>
    `).join('');

    // Add event listeners using event delegation
    listContainer.querySelectorAll('button[data-action="open"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const will = window.loadedWillsList[index];
            console.log('Open button clicked, will:', will);
            if (will) {
                showLoadOptions(will.id, will.source, will.name || 'Client');
            }
        });
    });

    listContainer.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const will = window.loadedWillsList[index];
            console.log('Delete button clicked, will:', will);
            if (will) {
                deleteWill(will.id, will.source);
            }
        });
    });
}

// Show load options modal
function showLoadOptions(id, source, name) {
    console.log('showLoadOptions called:', { id, source, name });
    pendingLoadWill = { id: String(id), source: source };
    document.getElementById('loadWillName').textContent = name;
    document.getElementById('savedWillsModal').style.display = 'none';
    document.getElementById('loadOptionsModal').style.display = 'flex';
    console.log('pendingLoadWill set to:', pendingLoadWill);
}

// Close load options modal
function closeLoadOptionsModal() {
    document.getElementById('loadOptionsModal').style.display = 'none';
    pendingLoadWill = null;
}

// Load will and view the document
async function loadWillAndView() {
    if (!pendingLoadWill) {
        console.error('No pending load will');
        return;
    }

    console.log('loadWillAndView called', pendingLoadWill);

    // Save values BEFORE closing modal (which clears pendingLoadWill)
    const willId = pendingLoadWill.id;
    const willSource = pendingLoadWill.source;

    try {
        closeLoadOptionsModal();

        await loadWillData(willId, willSource);

        // Go directly to step 12 and generate the will
        currentStep = 12;
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.querySelector('.step[data-step="12"]').classList.add('active');
        updateProgress();

        // Generate the will document
        generateWillFromData();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error in loadWillAndView:', error);
        alert('Error loading will: ' + error.message);
    }
}

// Load will and edit
async function loadWillAndEdit() {
    if (!pendingLoadWill) {
        console.error('No pending load will');
        return;
    }

    console.log('loadWillAndEdit called', pendingLoadWill);

    // Save values BEFORE closing modal (which clears pendingLoadWill)
    const willId = pendingLoadWill.id;
    const willSource = pendingLoadWill.source;

    try {
        closeLoadOptionsModal();

        await loadWillData(willId, willSource);

        // Go to step 2 (personal details) to continue editing
        currentStep = 2;
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.querySelector('.step[data-step="2"]').classList.add('active');
        updateProgress();

        // Populate form fields
        populateFormFromData();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error in loadWillAndEdit:', error);
        alert('Error loading will: ' + error.message);
    }
}

// Load will data from database or localStorage
async function loadWillData(id, source) {
    console.log('loadWillData called with id:', id, 'source:', source);

    if (source === 'database' && supabaseClient) {
        try {
            console.log('Fetching from database...');
            const { data, error } = await supabaseClient
                .from('islamic_wills')
                .select('*')
                .eq('id', id)
                .single();

            console.log('Database response - data:', data, 'error:', error);

            if (error) throw error;

            if (!data) {
                throw new Error('No data returned from database');
            }

            // Load will_data JSON into formData
            formData = data.will_data || {};
            formData.willId = data.id;

            // Also set individual fields from database columns
            formData.fullName = data.testator_name || formData.fullName;
            formData.email = data.testator_email || formData.email;
            formData.phone = data.testator_phone || formData.phone;
            formData.address = data.testator_address || formData.address;
            formData.testatorGender = data.testator_gender || formData.testatorGender;
            formData.dateOfBirth = data.testator_dob || formData.dateOfBirth;

            // Load children and other data from JSON columns
            if (data.children_data) formData.children = data.children_data;
            if (data.debts_data) formData.debts = data.debts_data;
            if (data.assets_data) {
                formData.properties = data.assets_data.properties || [];
                formData.bankAccounts = data.assets_data.bankAccounts || [];
                formData.investments = data.assets_data.investments || [];
                formData.businesses = data.assets_data.businesses || [];
                formData.vehicles = data.assets_data.vehicles || [];
                formData.valuables = data.assets_data.valuables || [];
            }
            if (data.wasiyyah_data) {
                formData.charities = data.wasiyyah_data.charities || [];
                formData.nonHeirs = data.wasiyyah_data.nonHeirs || [];
                formData.adopted = data.wasiyyah_data.adopted || [];
            }

            // Family data
            formData.maritalStatus = data.marital_status || formData.maritalStatus;
            formData.spouseName = data.spouse_name || formData.spouseName;
            formData.hasChildren = data.has_children ? 'yes' : formData.hasChildren;
            formData.fatherStatus = data.father_status || formData.fatherStatus;
            formData.fatherName = data.father_name || formData.fatherName;
            formData.motherStatus = data.mother_status || formData.motherStatus;
            formData.motherName = data.mother_name || formData.motherName;

            // Update toolbar
            updateToolbar(formData.fullName);

            console.log('Loaded will from database:', formData);
        } catch (e) {
            alert('Error loading will: ' + e.message);
            throw e;
        }
    } else {
        // Load from localStorage
        console.log('Loading from localStorage, id:', id, 'type:', typeof id);
        const localWills = JSON.parse(localStorage.getItem('savedWills') || '[]');
        console.log('Available local wills:', localWills.map(w => ({ localId: w.localId, name: w.fullName })));

        // Compare as strings to handle both string and number IDs
        const will = localWills.find(w => String(w.localId) === String(id));
        if (will) {
            formData = { ...will }; // Clone to avoid mutations
            updateToolbar(formData.fullName);
            console.log('Loaded will from localStorage:', formData);
        } else {
            console.error('Will not found. Looking for id:', id);
            alert('Could not find saved will');
            throw new Error('Will not found');
        }
    }
}

// Generate will document from loaded data (without collecting from form)
function generateWillFromData() {
    console.log('Generating will from loaded data');
    console.log('Testator Gender:', formData.testatorGender);
    console.log('Children Data:', formData.children);
    console.log('Has Children:', formData.hasChildren);

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const willType = formData.willType || 'simple';

    const willDocument = document.getElementById('willDocument');
    willDocument.innerHTML = generateWillHTML(today);
}

// Separate function to generate will HTML (reusable)
function generateWillHTML(today) {
    const t = willTranslations[currentWillLanguage] || willTranslations.en;

    return `
        <h1>${t.title}</h1>
        <p class="will-arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
        <p style="text-align: center; margin-bottom: 2rem;">${t.bismillahTranslation}</p>

        <h2>${t.declarationOfFaith}</h2>
        <p>${t.declarationText(formData.fullName || '[____]', formData.address || '[____]')}</p>
        <p>${t.madeInAccordance}</p>

        <h2>${t.part1}</h2>
        <p>${t.revocationText}</p>

        <h2>${t.part2}</h2>
        <p>${t.executorIntro}</p>
        <p><strong>${t.primaryExecutor}</strong><br>
        ${t.name}: ${formData.executor1Name || '____________________'}<br>
        ${t.address}: ${formData.executor1Address || '____________________'}<br>
        ${t.relationship}: ${formData.executor1Relationship || '____________________'}</p>

        ${formData.executor2Name ? `
        <p><strong>${t.secondaryExecutor}</strong><br>
        ${t.name}: ${formData.executor2Name}<br>
        ${t.address}: ${formData.executor2Address || '____________________'}<br>
        ${t.relationship}: ${formData.executor2Relationship || '____________________'}</p>
        ` : ''}

        <h2>${t.part3}</h2>
        <p>${t.funeralIntro}</p>
        <ol>
            <li>${t.funeral1}</li>
            <li>${t.funeral2}</li>
            <li>${t.funeral3}</li>
            <li>${t.funeral4}</li>
            <li>${t.funeral5}</li>
        </ol>
        ${formData.burialLocation === 'repatriate' ? `<p><strong>${t.repatriation}:</strong> ${t.repatriationText(formData.repatriationCountry || 'my home country')}</p>` : ''}
        ${formData.preferredCemetery ? `<p><strong>${t.preferredCemetery}:</strong> ${formData.preferredCemetery}</p>` : ''}
        ${formData.preferredMosque ? `<p><strong>${t.preferredMosque}:</strong> ${formData.preferredMosque}</p>` : ''}

        <h2>${t.part4}</h2>
        <p>${t.debtsIntro}</p>
        <ol>
            <li>${t.funeralExpenses}</li>
            <li>${t.allDebts}</li>
            ${formData.mahrStatus === 'outstanding' ? `<li><strong>${t.outstandingMahr}:</strong> £${formData.mahrAmount || '____'}</li>` : ''}
            ${formData.unpaidZakat ? `<li><strong>${t.unpaidZakat}:</strong> £${formData.unpaidZakat}</li>` : ''}
            ${formData.fidyahDays ? `<li><strong>${t.fidyah}:</strong> ${formData.fidyahDays} ${t.days}</li>` : ''}
            ${formData.kaffarah ? `<li><strong>${t.kaffarah}:</strong> £${formData.kaffarah}</li>` : ''}
            ${formData.hajjStatus === 'obligatory-not-performed' && formData.arrangeHajjBadal ? `<li>${t.hajjBadal}</li>` : ''}
        </ol>

        <h2>${t.part5}</h2>
        ${formData.makeWasiyyah === 'yes' ? `
        <p>${t.wasiyyahYes}</p>
        <p><em>${t.wasiyyahNote}</em></p>
        <table>
            <tr><th>${t.beneficiary}</th><th>${t.percentage}</th><th>${t.purpose}</th></tr>
            <tr><td colspan="3"><em>—</em></td></tr>
        </table>
        ` : `
        <p>${t.wasiyyahNo}</p>
        `}

        <h2>${t.part6}</h2>
        <p>${t.faraidIntro}</p>

        <div style="background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <h4 style="margin-top: 0; color: #2e7d32;">${t.testatorInfo}</h4>
            <p><strong>${t.testator}:</strong> ${formData.fullName || '____'} (${formData.testatorGender === 'female' ? t.female : t.male})</p>
            <p><strong>${t.maritalStatus}:</strong> ${formData.maritalStatus || t.notSpecified}</p>
            ${formData.maritalStatus === 'married' ? `<p><strong>${t.spouse}:</strong> ${formData.spouseName || '____'} (${formData.testatorGender === 'female' ? t.husband + ' - ' + t.entitledTo + ' ' + (formData.hasChildren === 'yes' ? '1/4 (25%)' : '1/2 (50%)') : t.wife + ' - ' + t.entitledTo + ' ' + (formData.hasChildren === 'yes' ? '1/8 (12.5%)' : '1/4 (25%)')})</p>` : ''}
            <p><strong>${t.hasChildren}:</strong> ${formData.hasChildren === 'yes' ? t.yes : t.no}</p>
            ${formData.children && formData.children.length > 0 ? `<p><strong>${t.children}:</strong> ${formData.children.map(c => c.name + ' (' + (c.gender === 'male' ? t.son : t.daughter) + ')').join(', ')}</p>` : ''}
            <p><strong>${t.father}:</strong> ${formData.fatherStatus === 'living' ? formData.fatherName + ' (' + t.living + ')' : t.deceased}</p>
            <p><strong>${t.mother}:</strong> ${formData.motherStatus === 'living' ? formData.motherName + ' (' + t.living + ')' : t.deceased}</p>
        </div>

        <h3>${t.calculatedShares}</h3>
        <p><em>${t.sharesNote}</em></p>
        ${generateFaraidTable()}

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <h4 style="margin-top: 0; color: #1e3a5f;">${t.faraidReference}</h4>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem;">${t.quranicVerse}</p>
            <table style="font-size: 0.85rem;">
                <tr><th>${t.heir}</th><th>${t.withChildren}</th><th>${t.withoutChildren}</th></tr>
                <tr><td>${t.wife}</td><td>1/8 (12.5%)</td><td>1/4 (25%)</td></tr>
                <tr><td>${t.husband}</td><td>1/4 (25%)</td><td>1/2 (50%)</td></tr>
                <tr><td>${t.father}</td><td>1/6 (16.67%) + ${t.residue}</td><td>${t.residue}</td></tr>
                <tr><td>${t.mother}</td><td>1/6 (16.67%)</td><td>1/3 (33.33%)</td></tr>
                <tr><td>${t.sons}</td><td colspan="2">${t.receivesDouble}</td></tr>
                <tr><td>${t.daughterAlone}</td><td colspan="2">1/2 (50%)</td></tr>
                <tr><td>${t.daughters2plus}</td><td colspan="2">2/3 (66.67%) ${t.sharedEqually}</td></tr>
            </table>
        </div>

        <p><strong>${t.important}:</strong> ${t.faraidImportant}</p>

        ${formData.hasMinorChildren === 'yes' ? `
        <h2>${t.part7}</h2>
        <p>${t.guardianIntro}</p>
        <p><strong>${t.primaryGuardian}:</strong> ${formData.guardian1Name || '____________________'}<br>
        ${t.address}: ${formData.guardian1Address || '____________________'}<br>
        ${t.relationship}: ${formData.guardian1Relationship || '____________________'}</p>
        ${formData.guardian2Name ? `<p><strong>${t.secondaryGuardian}:</strong> ${formData.guardian2Name}</p>` : ''}
        <p>${t.guardianWish}</p>
        ` : ''}

        <h2>${t.part8}</h2>
        <p>${formData.organDonation === 'consent' ? t.organConsent :
             formData.organDonation === 'refuse' ? t.organRefuse :
             t.organDefer}</p>

        <h2>${t.part9}</h2>
        <p>${t.declarationIntro}</p>
        <ol>
            <li>${t.decl1}</li>
            <li>${t.decl2}</li>
            <li>${t.decl3}</li>
            <li>${t.decl4}</li>
            <li>${t.decl5}</li>
            <li>${t.decl6}</li>
        </ol>

        <!-- Signatures Section -->
        <div class="will-signature-section">
            <h2>${t.signatures}</h2>

            <div class="will-signature-block">
                <h4>${t.testatorSig}</h4>
                <div class="signature-line"></div>
                <p class="signature-label">${t.signatureOf}</p>
                <p><strong>${t.fullName}:</strong> ${formData.fullName || '____________________'}</p>
                <p><strong>${t.date}:</strong> ____________________</p>
            </div>

            <div class="will-signature-block">
                <h4>${t.witness1}</h4>
                <p><em>${t.witnessNote}</em></p>
                <div class="signature-line"></div>
                <p class="signature-label">${t.signature}</p>
                <p><strong>${t.fullName}:</strong> ____________________</p>
                <p><strong>${t.address}:</strong> ____________________</p>
                <p><strong>${t.occupation}:</strong> ____________________</p>
                <p><strong>${t.date}:</strong> ____________________</p>
            </div>

            <div class="will-signature-block">
                <h4>${t.witness2}</h4>
                <div class="signature-line"></div>
                <p class="signature-label">${t.signature}</p>
                <p><strong>${t.fullName}:</strong> ____________________</p>
                <p><strong>${t.address}:</strong> ____________________</p>
                <p><strong>${t.occupation}:</strong> ____________________</p>
                <p><strong>${t.date}:</strong> ____________________</p>
            </div>

            <!-- Solicitor Certification -->
            <div class="certification-block">
                <h4>⚖️ ${t.solicitorCert}</h4>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert1"> <label for="cert1">${t.solicitorCert1}</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert2"> <label for="cert2">${t.solicitorCert2}</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert3"> <label for="cert3">${t.solicitorCert3}</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert4"> <label for="cert4">${t.solicitorCert4}</label>
                </div>
                <div class="form-grid" style="margin-top: 1rem;">
                    <div>
                        <p><strong>${t.solicitorName}:</strong> ____________________</p>
                        <p><strong>${t.firm}:</strong> ____________________</p>
                        <p><strong>${t.sraNumber}:</strong> ____________________</p>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <p class="signature-label">${t.signature}</p>
                        <p><strong>${t.date}:</strong> ____________________</p>
                    </div>
                </div>
                <div class="stamp-area">${t.firmStamp}</div>
            </div>

            <!-- Mufti/Imam Certification -->
            <div class="certification-block mufti">
                <h4>🕌 ${t.islamicCert}</h4>
                <p>${t.islamicCertIntro}</p>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic1"> <label for="islamic1">${t.islamicCert1}</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic2"> <label for="islamic2">${t.islamicCert2}</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic3"> <label for="islamic3">${t.islamicCert3}</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic4"> <label for="islamic4">${t.islamicCert4}</label>
                </div>
                <div class="form-grid" style="margin-top: 1rem;">
                    <div>
                        <p><strong>${t.muftiName}:</strong> ____________________</p>
                        <p><strong>${t.mosqueInstitution}:</strong> ____________________</p>
                        <p><strong>${t.contact}:</strong> ____________________</p>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <p class="signature-label">${t.signature}</p>
                        <p><strong>${t.date}:</strong> ____________________</p>
                    </div>
                </div>
                <div class="stamp-area">${t.mosqueStamp}</div>
            </div>
        </div>

        <hr style="margin: 2rem 0;">
        <p style="text-align: center; font-size: 0.875rem; color: #6b7280;">
            ${t.generatedOn(today)}<br>
            ${t.reviewNote}
        </p>
    `;
}

// Close modal
function closeSavedWillsModal() {
    document.getElementById('savedWillsModal').style.display = 'none';
}

// Populate form from loaded data
function populateFormFromData() {
    // Basic fields
    const fieldMappings = [
        'fullName', 'alsoKnownAs', 'dateOfBirth', 'placeOfBirth', 'address',
        'niNumber', 'passportNumber', 'countryOfOrigin', 'phone', 'email',
        'testatorGender', 'executor1Name', 'executor1Relationship', 'executor1Address',
        'executor1Phone', 'executor1Email', 'executor2Name', 'executor2Relationship',
        'executor2Address', 'executor2Phone', 'executor2Email', 'repatriationCountry',
        'preferredCemetery', 'preferredMosque', 'funeralInstructions', 'funeralBudget',
        'maritalStatus', 'spouseName', 'marriageDate', 'mahrAmount',
        'fatherName', 'motherName', 'unpaidZakat', 'fidyahDays', 'kaffarah',
        'guardian1Name', 'guardian1Relationship', 'guardian1Address', 'guardian1Phone',
        'guardian2Name', 'guardian2Relationship', 'guardian2Address',
        'preferredScholar', 'madhab', 'additionalWishes', 'peopleForgiven'
    ];

    fieldMappings.forEach(field => {
        const el = document.getElementById(field);
        if (el && formData[field]) {
            el.value = formData[field];
        }
    });

    // Handle radio buttons
    if (formData.willType) {
        const radio = document.querySelector(`input[name="willType"][value="${formData.willType}"]`);
        if (radio) radio.checked = true;
    }
    if (formData.burialLocation) {
        const radio = document.querySelector(`input[name="burialLocation"][value="${formData.burialLocation}"]`);
        if (radio) radio.checked = true;
    }
    if (formData.hasChildren) {
        const radio = document.querySelector(`input[name="hasChildren"][value="${formData.hasChildren}"]`);
        if (radio) radio.checked = true;
    }

    // Trigger change events to show/hide sections
    document.getElementById('maritalStatus')?.dispatchEvent(new Event('change'));
    document.querySelectorAll('input[name="hasChildren"]').forEach(r => {
        if (r.checked) r.dispatchEvent(new Event('change'));
    });
}

// Delete a will
async function deleteWill(id, source) {
    if (!confirm('Are you sure you want to delete this will?')) return;

    if (source === 'database' && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('islamic_wills')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            alert('Error deleting: ' + e.message);
            return;
        }
    } else {
        // Delete from localStorage
        let localWills = JSON.parse(localStorage.getItem('savedWills') || '[]');
        localWills = localWills.filter(w => w.localId != id);
        localStorage.setItem('savedWills', JSON.stringify(localWills));
    }

    // Refresh the list
    loadSavedWills();
}

// Generate Faraid table HTML
function generateFaraidTable() {
    const shares = calculateFaraid();

    if (shares.length === 0) {
        return '<p><em>No heirs identified. Please ensure family information is complete.</em></p>';
    }

    let totalShare = shares.reduce((sum, s) => sum + s.share, 0);

    let html = `
        <table style="width: 100%; margin: 1rem 0;">
            <tr style="background: #1e3a5f; color: white;">
                <th style="padding: 10px; text-align: left;">Heir</th>
                <th style="padding: 10px; text-align: left;">Name</th>
                <th style="padding: 10px; text-align: center;">Fraction</th>
                <th style="padding: 10px; text-align: center;">Percentage</th>
                <th style="padding: 10px; text-align: left;">Notes</th>
            </tr>
    `;

    shares.forEach((s, idx) => {
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        html += `
            <tr style="background: ${bgColor};">
                <td style="padding: 10px; font-weight: 600;">${s.heir}</td>
                <td style="padding: 10px;">${s.name}</td>
                <td style="padding: 10px; text-align: center;">${s.fraction}</td>
                <td style="padding: 10px; text-align: center; font-weight: 600; color: #1e3a5f;">${s.share.toFixed(2)}%</td>
                <td style="padding: 10px; font-size: 0.85rem; color: #64748b;">${s.note}</td>
            </tr>
        `;
    });

    html += `
            <tr style="background: #1e3a5f; color: white; font-weight: 600;">
                <td colspan="3" style="padding: 10px; text-align: right;">TOTAL:</td>
                <td style="padding: 10px; text-align: center;">${totalShare.toFixed(2)}%</td>
                <td style="padding: 10px;"></td>
            </tr>
        </table>
    `;

    if (Math.abs(totalShare - 100) > 0.1) {
        html += `<p style="color: #dc2626; font-size: 0.9rem;"><strong>Note:</strong> Total does not equal 100%. This may be due to Radd (redistribution) or 'Awl (proportional reduction) rules. Please consult an Islamic scholar.</p>`;
    }

    return html;
}

// Calculate Faraid (Islamic Inheritance) Shares
function calculateFaraid() {
    const hasSpouse = formData.maritalStatus === 'married';
    const hasChildren = formData.hasChildren === 'yes';
    const fatherAlive = formData.fatherStatus === 'living';
    const motherAlive = formData.motherStatus === 'living';

    // Count children by gender
    const children = formData.children || [];
    console.log('Faraid Calculation - Children:', children);

    const sons = children.filter(c => c.gender === 'male').length;
    const daughters = children.filter(c => c.gender === 'female').length;
    const totalChildren = sons + daughters;

    console.log('Faraid Calculation - Sons:', sons, 'Daughters:', daughters);

    // Determine testator gender from form
    const testatorIsMale = formData.testatorGender === 'male';
    console.log('Faraid Calculation - Testator is Male:', testatorIsMale, 'Gender value:', formData.testatorGender);

    const shares = [];
    let remainingShare = 100; // Start with 100%

    // 1. SPOUSE SHARE
    if (hasSpouse) {
        let spouseShare;
        if (testatorIsMale) {
            // Wife's share
            spouseShare = hasChildren ? 12.5 : 25; // 1/8 or 1/4
        } else {
            // Husband's share
            spouseShare = hasChildren ? 25 : 50; // 1/4 or 1/2
        }
        shares.push({
            heir: 'Spouse',
            name: formData.spouseName || '____',
            share: spouseShare,
            fraction: testatorIsMale ? (hasChildren ? '1/8' : '1/4') : (hasChildren ? '1/4' : '1/2'),
            note: testatorIsMale ? 'Wife' : 'Husband'
        });
        remainingShare -= spouseShare;
    }

    // 2. FATHER'S SHARE
    if (fatherAlive) {
        if (hasChildren) {
            // Father gets 1/6 when there are children
            shares.push({
                heir: 'Father',
                name: formData.fatherName || '____',
                share: 16.67,
                fraction: '1/6',
                note: 'Fixed share (with children)'
            });
            remainingShare -= 16.67;
        }
        // If no children, father takes residue (calculated later)
    }

    // 3. MOTHER'S SHARE
    if (motherAlive) {
        let motherShare;
        if (hasChildren || totalChildren >= 2) {
            motherShare = 16.67; // 1/6
        } else {
            motherShare = 33.33; // 1/3
        }
        shares.push({
            heir: 'Mother',
            name: formData.motherName || '____',
            share: motherShare,
            fraction: hasChildren ? '1/6' : '1/3',
            note: hasChildren ? 'Fixed share (with children)' : 'Fixed share (no children)'
        });
        remainingShare -= motherShare;
    }

    // 4. CHILDREN'S SHARES (from residue)
    if (hasChildren && totalChildren > 0) {
        if (sons > 0 && daughters > 0) {
            // Sons get double daughters - calculate units
            const totalUnits = (sons * 2) + daughters;
            const unitValue = remainingShare / totalUnits;
            const sonShare = (unitValue * 2).toFixed(2);
            const daughterShare = unitValue.toFixed(2);

            children.forEach((child, idx) => {
                const isSon = child.gender === 'male';
                shares.push({
                    heir: isSon ? 'Son' : 'Daughter',
                    name: child.name || `Child ${idx + 1}`,
                    share: parseFloat(isSon ? sonShare : daughterShare),
                    fraction: `Residue`,
                    note: isSon ? '2 units (double daughter)' : '1 unit (half of son)'
                });
            });
        } else if (sons > 0) {
            // Only sons - share equally
            const sonShare = (remainingShare / sons).toFixed(2);
            children.forEach((child, idx) => {
                shares.push({
                    heir: 'Son',
                    name: child.name || `Son ${idx + 1}`,
                    share: parseFloat(sonShare),
                    fraction: 'Residue',
                    note: 'Equal share among sons'
                });
            });
        } else if (daughters > 0) {
            // Only daughters
            let daughterTotal;
            if (daughters === 1) {
                daughterTotal = 50; // 1/2
            } else {
                daughterTotal = 66.67; // 2/3
            }
            // Cap at remaining share
            daughterTotal = Math.min(daughterTotal, remainingShare);
            const perDaughter = (daughterTotal / daughters).toFixed(2);

            children.forEach((child, idx) => {
                shares.push({
                    heir: 'Daughter',
                    name: child.name || `Daughter ${idx + 1}`,
                    share: parseFloat(perDaughter),
                    fraction: daughters === 1 ? '1/2' : '2/3 shared',
                    note: daughters === 1 ? 'Only daughter' : `Shared among ${daughters} daughters`
                });
            });

            remainingShare -= daughterTotal;

            // If father alive and there's residue, father gets it
            if (fatherAlive && remainingShare > 0) {
                shares.push({
                    heir: 'Father',
                    name: formData.fatherName || '____',
                    share: parseFloat(remainingShare.toFixed(2)),
                    fraction: 'Residue',
                    note: 'Residue after fixed shares'
                });
            }
        }
    } else if (!hasChildren && fatherAlive) {
        // No children - father takes residue
        shares.push({
            heir: 'Father',
            name: formData.fatherName || '____',
            share: parseFloat(remainingShare.toFixed(2)),
            fraction: 'Residue',
            note: 'As residuary heir (no children)'
        });
    }

    return shares;
}

// Generate review content
function generateReview() {
    saveStepData();

    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = `
        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Personal Details</span>
                <button class="review-section-edit" onclick="goToStep(2)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Full Name:</span><span class="review-value">${formData.fullName || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Date of Birth:</span><span class="review-value">${formData.dateOfBirth || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Address:</span><span class="review-value">${formData.address || 'Not provided'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Executors</span>
                <button class="review-section-edit" onclick="goToStep(3)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Primary Executor:</span><span class="review-value">${formData.executor1Name || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Secondary Executor:</span><span class="review-value">${formData.executor2Name || 'None'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Family</span>
                <button class="review-section-edit" onclick="goToStep(8)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Marital Status:</span><span class="review-value">${formData.maritalStatus || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Spouse:</span><span class="review-value">${formData.spouseName || 'N/A'}</span></div>
                <div class="review-item"><span class="review-label">Has Children:</span><span class="review-value">${formData.hasChildren || 'No'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Wasiyyah (Bequest)</span>
                <button class="review-section-edit" onclick="goToStep(7)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Making Wasiyyah:</span><span class="review-value">${formData.makeWasiyyah === 'yes' ? 'Yes' : 'No - All to Faraid'}</span></div>
            </div>
        </div>

        <div class="info-box info-warning">
            <strong>Important:</strong> Please review all information carefully before generating your Will.
            Once generated, have it reviewed by a qualified solicitor and Islamic scholar.
        </div>
    `;
}

// Generate the will document
async function generateWill() {
    saveStepData();

    // IMPORTANT: Collect all dynamic list data BEFORE generating will
    formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
    formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
    formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
    formData.bankAccounts = collectListData('bank', bankCount, ['Name', 'Type', 'Balance']);
    formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
    formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
    formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
    formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value', 'Recipient']);
    formData.charities = collectListData('charity', charitableCount, ['Name', 'Reg', 'Percent', 'Purpose']);
    formData.nonHeirs = collectListData('nonHeir', nonHeirCount, ['Name', 'Relation', 'Percent', 'Reason']);
    formData.adopted = collectListData('adopted', adoptedCount, ['Name', 'Date', 'Percent']);

    // Mark as completed
    formData.isCompleted = true;
    formData.completedAt = new Date().toISOString();

    console.log('Testator Gender:', formData.testatorGender);
    console.log('Children Data:', formData.children);
    console.log('Has Children:', formData.hasChildren);

    // Save to database with completed status
    try {
        await saveWillToDatabase('completed');
        console.log('Will saved to database as completed');
    } catch (error) {
        console.warn('Could not save to database:', error);
    }

    // Also save to localStorage with completed flag
    const savedWills = JSON.parse(localStorage.getItem('savedWills') || '[]');
    const existingIndex = savedWills.findIndex(w => w.localId === formData.localId);
    formData.savedAt = new Date().toISOString();
    if (!formData.localId) formData.localId = Date.now();

    if (existingIndex >= 0) {
        savedWills[existingIndex] = formData;
    } else {
        savedWills.push(formData);
    }
    localStorage.setItem('savedWills', JSON.stringify(savedWills));

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const willDocument = document.getElementById('willDocument');
    willDocument.innerHTML = generateWillHTML(today);
}

// Print will
function printWill() {
    window.print();
}

// Download PDF (basic implementation - would need a library like jsPDF for proper PDF)
function downloadPDF() {
    alert('For best results, use the Print function and select "Save as PDF" as your printer.\n\nA proper PDF generation feature requires additional libraries.');
    window.print();
}

// ========================================
// LANGUAGE TRANSLATION SYSTEM
// ========================================

let currentWillLanguage = 'en';

const willTranslations = {
    en: {
        title: 'ISLAMIC WILL (WASIYYAH)',
        bismillahTranslation: 'In the Name of Allah, the Most Gracious, the Most Merciful',
        declarationOfFaith: 'DECLARATION OF FAITH',
        declarationText: (name, address) => `I, <strong>${name}</strong>, of <strong>${address}</strong>, being of sound mind and understanding, declare that I bear witness that there is no god but Allah, and that Muhammad (peace be upon him) is His final Messenger.`,
        madeInAccordance: 'I make this Will in accordance with Islamic Law (Shariah) and the laws of England and Wales.',
        part1: 'PART 1: REVOCATION',
        revocationText: 'I hereby revoke all former Wills and Codicils made by me and declare this to be my Last Will and Testament.',
        part2: 'PART 2: APPOINTMENT OF EXECUTORS',
        executorIntro: 'I appoint the following person(s) to be the Executor(s) of this Will:',
        primaryExecutor: 'Primary Executor:',
        secondaryExecutor: 'Secondary Executor (if primary unable to act):',
        name: 'Name',
        address: 'Address',
        relationship: 'Relationship',
        part3: 'PART 3: FUNERAL ARRANGEMENTS',
        funeralIntro: 'I direct that upon my death:',
        funeral1: 'My body shall be washed (Ghusl) and shrouded (Kafan) according to Islamic rites',
        funeral2: 'The Janazah (funeral) prayer shall be performed',
        funeral3: 'I shall be buried (not cremated) in a Muslim cemetery or Muslim section of a cemetery, facing the Qiblah',
        funeral4: 'My burial shall take place as soon as reasonably possible after my death',
        funeral5: 'My funeral shall be conducted simply, without extravagance, in accordance with the Sunnah',
        repatriation: 'Repatriation',
        repatriationText: (country) => `I wish to be buried in ${country}. If repatriation is not possible within 3 days, I should be buried in the UK.`,
        preferredCemetery: 'Preferred Cemetery',
        preferredMosque: 'Preferred Mosque for Janazah',
        part4: 'PART 4: PAYMENT OF DEBTS AND EXPENSES',
        debtsIntro: 'I direct my Executor(s) to pay from my estate in the following order of priority:',
        funeralExpenses: 'My funeral and burial expenses',
        allDebts: 'All my lawful debts',
        outstandingMahr: 'Outstanding Mahr (Dowry) to my wife',
        unpaidZakat: 'Unpaid Zakat',
        fidyah: 'Fidyah for missed fasts',
        kaffarah: 'Kaffarah',
        hajjBadal: 'Arrange Hajj Badal (proxy Hajj) from my estate',
        part5: 'PART 5: ISLAMIC BEQUEST (WASIYYAH)',
        wasiyyahYes: 'In accordance with Islamic Law, I bequeath up to <strong>ONE-THIRD (1/3)</strong> of my net estate (after payment of debts and expenses) as follows:',
        wasiyyahNote: 'Note: This bequest cannot be made to those who are already entitled to inherit under Islamic Law (Faraid)',
        wasiyyahNo: 'I do not wish to make any Wasiyyah. My entire estate shall be distributed according to the Islamic Law of Inheritance (Faraid).',
        beneficiary: 'Beneficiary',
        percentage: 'Percentage',
        purpose: 'Purpose',
        part6: 'PART 6: ISLAMIC INHERITANCE (FARAID)',
        faraidIntro: 'I direct that the remainder of my estate (after payment of debts, expenses, and Wasiyyah) shall be distributed according to the Islamic Law of Inheritance (Faraid) as prescribed in the Holy Quran (Surah An-Nisa 4:11-12) and Sunnah.',
        testatorInfo: 'Testator Information for Faraid Calculation:',
        testator: 'Testator',
        male: 'Male',
        female: 'Female',
        maritalStatus: 'Marital Status',
        spouse: 'Spouse',
        hasChildren: 'Has Children',
        yes: 'Yes',
        no: 'No',
        children: 'Children',
        son: 'Son',
        daughter: 'Daughter',
        father: 'Father',
        mother: 'Mother',
        living: 'Living',
        deceased: 'Deceased',
        calculatedShares: 'Calculated Inheritance Shares According to Shariah:',
        sharesNote: 'Based on the family information provided and Islamic inheritance law, the shares are calculated as follows:',
        faraidReference: 'Faraid Reference (Quranic Shares):',
        quranicVerse: 'As ordained in the Holy Quran - "Allah instructs you concerning your children: for the male, what is equal to the share of two females..." (4:11)',
        heir: 'Heir',
        withChildren: 'With Children',
        withoutChildren: 'Without Children',
        wife: 'Wife',
        husband: 'Husband',
        sons: 'Son(s)',
        residue: 'Residue',
        daughterAlone: 'Daughter (alone)',
        daughters2plus: 'Daughters (2+)',
        sharedEqually: 'shared equally',
        faraidImportant: 'These shares are calculated based on the information provided and in accordance with Islamic Shariah law. I request that my Executor(s) consult with a qualified Islamic scholar (Mufti) for the final calculation of Faraid shares at the time of distribution, as circumstances may change.',
        part7: 'PART 7: GUARDIANSHIP OF MINOR CHILDREN',
        guardianIntro: 'If I have minor children at the time of my death, I appoint:',
        primaryGuardian: 'Primary Guardian',
        secondaryGuardian: 'Secondary Guardian',
        guardianWish: 'I request that my children be raised according to Islamic principles and teachings.',
        part8: 'PART 8: ORGAN DONATION',
        organConsent: 'I consent to organ donation to save lives.',
        organRefuse: 'I do not consent to organ donation.',
        organDefer: 'I defer the decision on organ donation to my family and an Islamic scholar at the time.',
        part9: 'PART 9: DECLARATION',
        declarationIntro: 'I declare that:',
        decl1: 'I am over 18 years of age',
        decl2: 'I am of sound mind',
        decl3: 'I make this Will freely and voluntarily',
        decl4: 'I understand that the Islamic shares are fixed by Allah and cannot be altered',
        decl5: 'I have not made any bequest to an heir from the one-third Wasiyyah portion',
        decl6: 'The total Wasiyyah does not exceed one-third of my estate',
        signatures: 'SIGNATURES',
        testatorSig: 'TESTATOR',
        signatureOf: 'Signature of Testator',
        fullName: 'Full Name',
        date: 'Date',
        witness1: 'WITNESS 1',
        witness2: 'WITNESS 2',
        witnessNote: 'This Will must be signed in the presence of two witnesses who are not beneficiaries',
        signature: 'Signature',
        occupation: 'Occupation',
        solicitorCert: 'SOLICITOR CERTIFICATION',
        solicitorCert1: 'The Testator appeared of sound mind',
        solicitorCert2: 'The Will was explained to the Testator',
        solicitorCert3: 'The Will complies with UK law',
        solicitorCert4: 'Proper witnessing procedures were followed',
        solicitorName: 'Solicitor Name',
        firm: 'Firm',
        sraNumber: 'SRA Number',
        islamicCert: 'ISLAMIC CERTIFICATION (MUFTI/IMAM)',
        islamicCertIntro: 'I certify that I have reviewed this Will and confirm that:',
        islamicCert1: 'The Wasiyyah does not exceed one-third (1/3)',
        islamicCert2: 'No bequests are made to Quranic heirs from the Wasiyyah',
        islamicCert3: 'The Faraid distribution follows Islamic law',
        islamicCert4: 'The funeral wishes comply with Shariah',
        muftiName: 'Mufti/Imam Name',
        mosqueInstitution: 'Mosque/Institution',
        contact: 'Contact',
        firmStamp: 'Firm Stamp',
        mosqueStamp: 'Mosque/Institution Stamp',
        generatedOn: (date) => `This Will was generated on ${date} using the Islamic Will Generator.`,
        reviewNote: 'Please have this document reviewed by a qualified solicitor and Islamic scholar before signing.',
        days: 'days',
        entitledTo: 'entitled to',
        receivesDouble: 'Residue (receives double the share of daughter)',
        notSpecified: 'Not specified',
        important: 'Important'
    },
    ar: {
        title: 'الوصية الإسلامية',
        bismillahTranslation: 'بسم الله الرحمن الرحيم',
        declarationOfFaith: 'شهادة الإيمان',
        declarationText: (name, address) => `أنا، <strong>${name}</strong>، المقيم في <strong>${address}</strong>، وأنا بكامل قواي العقلية والإدراكية، أشهد أن لا إله إلا الله وأن محمداً صلى الله عليه وسلم رسول الله.`,
        madeInAccordance: 'أكتب هذه الوصية وفقاً للشريعة الإسلامية وقوانين إنجلترا وويلز.',
        part1: 'الجزء الأول: الإلغاء',
        revocationText: 'بموجب هذا أُلغي جميع الوصايا والملاحق السابقة وأعلن أن هذه هي وصيتي الأخيرة.',
        part2: 'الجزء الثاني: تعيين المنفذين',
        executorIntro: 'أعين الشخص/الأشخاص التالين منفذين لهذه الوصية:',
        primaryExecutor: 'المنفذ الرئيسي:',
        secondaryExecutor: 'المنفذ الثانوي (إذا تعذر على الرئيسي):',
        name: 'الاسم',
        address: 'العنوان',
        relationship: 'صلة القرابة',
        part3: 'الجزء الثالث: ترتيبات الجنازة',
        funeralIntro: 'أوصي بأنه عند وفاتي:',
        funeral1: 'يُغسّل جثماني ويُكفّن وفقاً للشريعة الإسلامية',
        funeral2: 'تُؤدّى صلاة الجنازة',
        funeral3: 'أُدفن (لا أُحرق) في مقبرة إسلامية أو قسم إسلامي من مقبرة، باتجاه القبلة',
        funeral4: 'يتم الدفن في أقرب وقت ممكن بعد الوفاة',
        funeral5: 'تُقام الجنازة ببساطة دون إسراف، وفقاً للسنة',
        repatriation: 'الإعادة إلى الوطن',
        repatriationText: (country) => `أرغب في أن أُدفن في ${country}. إذا تعذرت الإعادة خلال 3 أيام، يجب أن أُدفن في المملكة المتحدة.`,
        preferredCemetery: 'المقبرة المفضلة',
        preferredMosque: 'المسجد المفضل للجنازة',
        part4: 'الجزء الرابع: سداد الديون والمصاريف',
        debtsIntro: 'أوجه منفذي الوصية بالسداد من تركتي حسب الأولوية التالية:',
        funeralExpenses: 'مصاريف الجنازة والدفن',
        allDebts: 'جميع ديوني المشروعة',
        outstandingMahr: 'المهر المستحق لزوجتي',
        unpaidZakat: 'الزكاة غير المدفوعة',
        fidyah: 'فدية الصيام الفائت',
        kaffarah: 'الكفارة',
        hajjBadal: 'ترتيب حج البدل من تركتي',
        part5: 'الجزء الخامس: الوصية الإسلامية',
        wasiyyahYes: 'وفقاً للشريعة الإسلامية، أوصي بما يصل إلى <strong>الثلث (1/3)</strong> من صافي تركتي (بعد سداد الديون والمصاريف) كالتالي:',
        wasiyyahNote: 'ملاحظة: لا يجوز أن تكون هذه الوصية لمن يرث بالفعل وفق الشريعة الإسلامية (الفرائض)',
        wasiyyahNo: 'لا أرغب في عمل وصية. توزع تركتي بالكامل وفقاً لقانون الميراث الإسلامي (الفرائض).',
        beneficiary: 'المستفيد',
        percentage: 'النسبة',
        purpose: 'الغرض',
        part6: 'الجزء السادس: الميراث الإسلامي (الفرائض)',
        faraidIntro: 'أوجه بأن يوزع باقي تركتي (بعد سداد الديون والمصاريف والوصية) وفقاً لقانون الميراث الإسلامي (الفرائض) كما ورد في القرآن الكريم (سورة النساء 4:11-12) والسنة.',
        testatorInfo: 'معلومات الموصي لحساب الفرائض:',
        testator: 'الموصي',
        male: 'ذكر',
        female: 'أنثى',
        maritalStatus: 'الحالة الاجتماعية',
        spouse: 'الزوج/الزوجة',
        hasChildren: 'لديه أولاد',
        yes: 'نعم',
        no: 'لا',
        children: 'الأولاد',
        son: 'ابن',
        daughter: 'ابنة',
        father: 'الأب',
        mother: 'الأم',
        living: 'على قيد الحياة',
        deceased: 'متوفى',
        calculatedShares: 'الأنصبة المحسوبة وفق الشريعة:',
        sharesNote: 'بناءً على المعلومات المقدمة وقانون الميراث الإسلامي، تم حساب الأنصبة كالتالي:',
        faraidReference: 'مرجع الفرائض (الأنصبة القرآنية):',
        quranicVerse: 'كما أمر الله في القرآن الكريم - "يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ..." (4:11)',
        heir: 'الوارث',
        withChildren: 'مع وجود أولاد',
        withoutChildren: 'بدون أولاد',
        wife: 'الزوجة',
        husband: 'الزوج',
        sons: 'الأبناء',
        residue: 'العصبة',
        daughterAlone: 'البنت (وحيدة)',
        daughters2plus: 'البنات (2+)',
        sharedEqually: 'بالتساوي',
        faraidImportant: 'هذه الأنصبة محسوبة بناءً على المعلومات المقدمة ووفقاً للشريعة الإسلامية. أطلب من منفذي الوصية استشارة عالم إسلامي مؤهل (مفتي) للحساب النهائي عند التوزيع.',
        part7: 'الجزء السابع: الوصاية على القاصرين',
        guardianIntro: 'إذا كان لدي أطفال قاصرون عند وفاتي، أعين:',
        primaryGuardian: 'الوصي الرئيسي',
        secondaryGuardian: 'الوصي الثانوي',
        guardianWish: 'أطلب أن يُربّى أطفالي وفقاً لتعاليم الإسلام ومبادئه.',
        part8: 'الجزء الثامن: التبرع بالأعضاء',
        organConsent: 'أوافق على التبرع بأعضائي لإنقاذ الأرواح.',
        organRefuse: 'لا أوافق على التبرع بأعضائي.',
        organDefer: 'أترك قرار التبرع بالأعضاء لعائلتي وعالم إسلامي في حينه.',
        part9: 'الجزء التاسع: الإقرار',
        declarationIntro: 'أقر بأنني:',
        decl1: 'أبلغ من العمر أكثر من 18 عاماً',
        decl2: 'بكامل قواي العقلية',
        decl3: 'أكتب هذه الوصية بإرادتي الحرة',
        decl4: 'أفهم أن الأنصبة الإسلامية ثابتة بأمر الله ولا يمكن تغييرها',
        decl5: 'لم أوصِ لوارث من ثلث الوصية',
        decl6: 'إجمالي الوصية لا يتجاوز ثلث تركتي',
        signatures: 'التوقيعات',
        testatorSig: 'الموصي',
        signatureOf: 'توقيع الموصي',
        fullName: 'الاسم الكامل',
        date: 'التاريخ',
        witness1: 'الشاهد الأول',
        witness2: 'الشاهد الثاني',
        witnessNote: 'يجب توقيع هذه الوصية بحضور شاهدين ليسا من المستفيدين',
        signature: 'التوقيع',
        occupation: 'المهنة',
        solicitorCert: 'تصديق المحامي',
        solicitorCert1: 'بدا الموصي بكامل قواه العقلية',
        solicitorCert2: 'تم شرح الوصية للموصي',
        solicitorCert3: 'الوصية متوافقة مع قانون المملكة المتحدة',
        solicitorCert4: 'تم اتباع إجراءات الشهادة الصحيحة',
        solicitorName: 'اسم المحامي',
        firm: 'المكتب',
        sraNumber: 'رقم SRA',
        islamicCert: 'التصديق الإسلامي (المفتي/الإمام)',
        islamicCertIntro: 'أشهد أنني راجعت هذه الوصية وأؤكد أن:',
        islamicCert1: 'الوصية لا تتجاوز الثلث (1/3)',
        islamicCert2: 'لا توجد وصية لورثة قرآنيين',
        islamicCert3: 'توزيع الفرائض يتبع الشريعة الإسلامية',
        islamicCert4: 'ترتيبات الجنازة متوافقة مع الشريعة',
        muftiName: 'اسم المفتي/الإمام',
        mosqueInstitution: 'المسجد/المؤسسة',
        contact: 'الاتصال',
        firmStamp: 'ختم المكتب',
        mosqueStamp: 'ختم المسجد/المؤسسة',
        generatedOn: (date) => `تم إنشاء هذه الوصية بتاريخ ${date} باستخدام مولد الوصية الإسلامية.`,
        reviewNote: 'يرجى مراجعة هذه الوثيقة من قبل محامٍ مؤهل وعالم إسلامي قبل التوقيع.',
        days: 'أيام',
        entitledTo: 'يستحق',
        receivesDouble: 'العصبة (يحصل على ضعف نصيب البنت)',
        notSpecified: 'غير محدد',
        important: 'مهم'
    },
    ur: {
        title: 'اسلامی وصیت',
        bismillahTranslation: 'اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے',
        declarationOfFaith: 'شہادت',
        declarationText: (name, address) => `میں، <strong>${name}</strong>، مقیم <strong>${address}</strong>، صحیح عقل اور سمجھ کے ساتھ، گواہی دیتا/دیتی ہوں کہ اللہ کے سوا کوئی معبود نہیں اور محمد صلی اللہ علیہ وسلم اللہ کے آخری رسول ہیں۔`,
        madeInAccordance: 'میں یہ وصیت اسلامی شریعت اور انگلینڈ و ویلز کے قوانین کے مطابق لکھتا/لکھتی ہوں۔',
        part1: 'حصہ اول: منسوخی',
        revocationText: 'میں اپنی تمام سابقہ وصیتیں منسوخ کرتا/کرتی ہوں اور اعلان کرتا/کرتی ہوں کہ یہ میری آخری وصیت ہے۔',
        part2: 'حصہ دوم: وصی کی تعیناتی',
        executorIntro: 'میں درج ذیل شخص/اشخاص کو اس وصیت کا وصی مقرر کرتا/کرتی ہوں:',
        primaryExecutor: 'بنیادی وصی:',
        secondaryExecutor: 'ثانوی وصی:',
        name: 'نام',
        address: 'پتہ',
        relationship: 'رشتہ',
        part3: 'حصہ سوم: جنازے کے انتظامات',
        funeralIntro: 'میں ہدایت دیتا/دیتی ہوں کہ میری وفات پر:',
        funeral1: 'میرے جسم کو اسلامی طریقے سے غسل اور کفن دیا جائے',
        funeral2: 'نماز جنازہ ادا کی جائے',
        funeral3: 'مجھے مسلم قبرستان میں قبلہ رخ دفنایا جائے (جلایا نہ جائے)',
        funeral4: 'دفن جلد از جلد کیا جائے',
        funeral5: 'جنازہ سادگی سے سنت کے مطابق ہو',
        repatriation: 'واپسی',
        repatriationText: (country) => `میں ${country} میں دفنایا جانا چاہتا/چاہتی ہوں۔ اگر 3 دن میں ممکن نہ ہو تو برطانیہ میں دفنایا جائے۔`,
        preferredCemetery: 'پسندیدہ قبرستان',
        preferredMosque: 'جنازے کی پسندیدہ مسجد',
        part4: 'حصہ چہارم: قرضوں اور اخراجات کی ادائیگی',
        debtsIntro: 'میں وصی کو ہدایت دیتا/دیتی ہوں کہ میری جائیداد سے ترجیحی بنیاد پر ادائیگی کرے:',
        funeralExpenses: 'جنازے اور تدفین کے اخراجات',
        allDebts: 'تمام جائز قرضے',
        outstandingMahr: 'بیوی کا بقایا مہر',
        unpaidZakat: 'ادا نہ کی گئی زکوٰۃ',
        fidyah: 'چھوٹے ہوئے روزوں کی فدیہ',
        kaffarah: 'کفارہ',
        hajjBadal: 'حج بدل کا انتظام',
        part5: 'حصہ پنجم: اسلامی وصیت',
        wasiyyahYes: 'اسلامی شریعت کے مطابق، میں اپنی خالص جائیداد کا <strong>ایک تہائی (1/3)</strong> تک درج ذیل کے لیے وصیت کرتا/کرتی ہوں:',
        wasiyyahNote: 'نوٹ: یہ وصیت ان لوگوں کے لیے نہیں ہو سکتی جو اسلامی قانون وراثت کے تحت پہلے سے وارث ہیں',
        wasiyyahNo: 'میں کوئی وصیت نہیں کرنا چاہتا/چاہتی۔ میری پوری جائیداد فرائض کے مطابق تقسیم ہو۔',
        beneficiary: 'مستفید',
        percentage: 'فیصد',
        purpose: 'مقصد',
        part6: 'حصہ ششم: اسلامی وراثت (فرائض)',
        faraidIntro: 'میں ہدایت دیتا/دیتی ہوں کہ میری باقی جائیداد قرآن (سورۃ النساء 4:11-12) اور سنت کے مطابق فرائض کے قانون سے تقسیم ہو۔',
        testatorInfo: 'فرائض کے حساب کے لیے وصیت کنندہ کی معلومات:',
        testator: 'وصیت کنندہ',
        male: 'مرد',
        female: 'عورت',
        maritalStatus: 'ازدواجی حیثیت',
        spouse: 'شریک حیات',
        hasChildren: 'اولاد ہے',
        yes: 'ہاں',
        no: 'نہیں',
        children: 'اولاد',
        son: 'بیٹا',
        daughter: 'بیٹی',
        father: 'والد',
        mother: 'والدہ',
        living: 'زندہ',
        deceased: 'مرحوم',
        calculatedShares: 'شریعت کے مطابق حساب شدہ حصے:',
        sharesNote: 'فراہم کردہ معلومات اور اسلامی قانون وراثت کی بنیاد پر حصے درج ذیل ہیں:',
        faraidReference: 'فرائض حوالہ (قرآنی حصے):',
        quranicVerse: 'جیسا کہ قرآن میں حکم ہے - "اللہ تمہاری اولاد کے بارے میں حکم دیتا ہے: لڑکے کا حصہ دو لڑکیوں کے برابر ہے..." (4:11)',
        heir: 'وارث',
        withChildren: 'اولاد کے ساتھ',
        withoutChildren: 'اولاد کے بغیر',
        wife: 'بیوی',
        husband: 'شوہر',
        sons: 'بیٹے',
        residue: 'عصبہ',
        daughterAlone: 'بیٹی (اکیلی)',
        daughters2plus: 'بیٹیاں (2+)',
        sharedEqually: 'برابر تقسیم',
        faraidImportant: 'یہ حصے فراہم کردہ معلومات کی بنیاد پر اور اسلامی شریعت کے مطابق ہیں۔ میں درخواست کرتا/کرتی ہوں کہ تقسیم کے وقت مفتی سے مشورہ کیا جائے۔',
        part7: 'حصہ ہفتم: نابالغ بچوں کی سرپرستی',
        guardianIntro: 'اگر میری وفات کے وقت نابالغ بچے ہوں تو میں مقرر کرتا/کرتی ہوں:',
        primaryGuardian: 'بنیادی سرپرست',
        secondaryGuardian: 'ثانوی سرپرست',
        guardianWish: 'میں چاہتا/چاہتی ہوں کہ میرے بچوں کی پرورش اسلامی اصولوں کے مطابق ہو۔',
        part8: 'حصہ ہشتم: اعضاء کا عطیہ',
        organConsent: 'میں جان بچانے کے لیے اعضاء عطیہ کرنے پر رضامند ہوں۔',
        organRefuse: 'میں اعضاء عطیہ کرنے پر رضامند نہیں۔',
        organDefer: 'میں اعضاء عطیہ کا فیصلہ اپنے خاندان اور عالم پر چھوڑتا/چھوڑتی ہوں۔',
        part9: 'حصہ نہم: اقرار',
        declarationIntro: 'میں اقرار کرتا/کرتی ہوں:',
        decl1: 'میری عمر 18 سال سے زائد ہے',
        decl2: 'میں صحیح عقل میں ہوں',
        decl3: 'میں یہ وصیت اپنی مرضی سے لکھ رہا/رہی ہوں',
        decl4: 'میں سمجھتا/سمجھتی ہوں کہ اسلامی حصے اللہ کے مقرر کردہ ہیں',
        decl5: 'میں نے وارث کے لیے وصیت کے تہائی سے وصیت نہیں کی',
        decl6: 'کل وصیت میری جائیداد کے تہائی سے زیادہ نہیں',
        signatures: 'دستخط',
        testatorSig: 'وصیت کنندہ',
        signatureOf: 'وصیت کنندہ کے دستخط',
        fullName: 'پورا نام',
        date: 'تاریخ',
        witness1: 'گواہ اول',
        witness2: 'گواہ دوم',
        witnessNote: 'یہ وصیت دو گواہوں کی موجودگی میں دستخط ہونی چاہیے جو مستفید نہ ہوں',
        signature: 'دستخط',
        occupation: 'پیشہ',
        solicitorCert: 'وکیل کی تصدیق',
        solicitorCert1: 'وصیت کنندہ صحیح عقل میں تھے',
        solicitorCert2: 'وصیت کی وضاحت کی گئی',
        solicitorCert3: 'وصیت برطانوی قانون کے مطابق ہے',
        solicitorCert4: 'گواہی کے درست طریقے اپنائے گئے',
        solicitorName: 'وکیل کا نام',
        firm: 'فرم',
        sraNumber: 'SRA نمبر',
        islamicCert: 'اسلامی تصدیق (مفتی/امام)',
        islamicCertIntro: 'میں تصدیق کرتا ہوں کہ میں نے وصیت کا جائزہ لیا:',
        islamicCert1: 'وصیت ایک تہائی سے زیادہ نہیں',
        islamicCert2: 'قرآنی ورثاء کے لیے وصیت نہیں',
        islamicCert3: 'فرائض کی تقسیم اسلامی قانون کے مطابق ہے',
        islamicCert4: 'جنازے کی خواہشات شرعی ہیں',
        muftiName: 'مفتی/امام کا نام',
        mosqueInstitution: 'مسجد/ادارہ',
        contact: 'رابطہ',
        firmStamp: 'فرم کی مہر',
        mosqueStamp: 'مسجد/ادارے کی مہر',
        generatedOn: (date) => `یہ وصیت ${date} کو اسلامی وصیت جنریٹر کے ذریعے بنائی گئی۔`,
        reviewNote: 'دستخط سے پہلے وکیل اور عالم سے جائزہ لیں۔',
        days: 'دن',
        entitledTo: 'کا حقدار',
        receivesDouble: 'عصبہ (بیٹی کے حصے کا دوگنا)',
        notSpecified: 'غیر متعین',
        important: 'اہم'
    },
    bn: {
        title: 'ইসলামী উইল (ওসিয়্যাহ)',
        bismillahTranslation: 'পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে',
        declarationOfFaith: 'ঈমানের ঘোষণা',
        declarationText: (name, address) => `আমি, <strong>${name}</strong>, ঠিকানা <strong>${address}</strong>, সুস্থ মস্তিষ্কে সাক্ষ্য দিচ্ছি যে আল্লাহ ছাড়া কোনো ইলাহ নেই এবং মুহাম্মদ (সা.) তাঁর শেষ রাসূল।`,
        madeInAccordance: 'আমি এই উইল ইসলামী শরিয়াহ এবং ইংল্যান্ড ও ওয়েলসের আইন অনুসারে তৈরি করছি।',
        part1: 'পর্ব ১: বাতিলকরণ',
        revocationText: 'আমি আমার পূর্বের সকল উইল বাতিল করছি এবং ঘোষণা করছি এটি আমার শেষ উইল।',
        part2: 'পর্ব ২: নির্বাহক নিয়োগ',
        executorIntro: 'আমি নিম্নলিখিত ব্যক্তিদের এই উইলের নির্বাহক নিয়োগ করছি:',
        primaryExecutor: 'প্রধান নির্বাহক:',
        secondaryExecutor: 'দ্বিতীয় নির্বাহক:',
        name: 'নাম', address: 'ঠিকানা', relationship: 'সম্পর্ক',
        part3: 'পর্ব ৩: জানাযার ব্যবস্থা',
        funeralIntro: 'আমার মৃত্যুর পর আমি নির্দেশ দিচ্ছি:',
        funeral1: 'আমার দেহ ইসলামী রীতি অনুযায়ী গোসল ও কাফন দেওয়া হোক',
        funeral2: 'জানাযার নামায আদায় করা হোক',
        funeral3: 'কিবলামুখী করে মুসলিম কবরস্থানে দাফন করা হোক (দাহ নয়)',
        funeral4: 'যত দ্রুত সম্ভব দাফন করা হোক',
        funeral5: 'সুন্নাহ অনুযায়ী সাদাসিধেভাবে জানাযা অনুষ্ঠিত হোক',
        repatriation: 'প্রত্যাবাসন',
        repatriationText: (country) => `আমি ${country}-তে দাফন হতে চাই। ৩ দিনের মধ্যে সম্ভব না হলে যুক্তরাজ্যে দাফন করা হোক।`,
        preferredCemetery: 'পছন্দের কবরস্থান', preferredMosque: 'জানাযার পছন্দের মসজিদ',
        part4: 'পর্ব ৪: ঋণ ও খরচ পরিশোধ', debtsIntro: 'আমি নির্বাহককে আমার সম্পত্তি থেকে অগ্রাধিকার ভিত্তিতে পরিশোধের নির্দেশ দিচ্ছি:',
        funeralExpenses: 'জানাযা ও দাফনের খরচ', allDebts: 'সকল বৈধ ঋণ', outstandingMahr: 'স্ত্রীর বকেয়া মোহর',
        unpaidZakat: 'অপরিশোধিত যাকাত', fidyah: 'ছুটে যাওয়া রোযার ফিদিয়া', kaffarah: 'কাফফারা', hajjBadal: 'হজ্জে বদল এর ব্যবস্থা',
        part5: 'পর্ব ৫: ইসলামী ওসিয়্যাহ',
        wasiyyahYes: 'ইসলামী শরিয়াহ অনুসারে, আমি আমার নিট সম্পত্তির <strong>এক-তৃতীয়াংশ (১/৩)</strong> পর্যন্ত নিম্নরূপ ওসিয়্যত করছি:',
        wasiyyahNote: 'দ্রষ্টব্য: ফারায়েযের অধীনে যারা ইতিমধ্যে উত্তরাধিকারী তাদের জন্য ওসিয়্যত করা যায় না',
        wasiyyahNo: 'আমি কোনো ওসিয়্যত করতে চাই না। আমার সমস্ত সম্পত্তি ফারায়েয অনুযায়ী বণ্টিত হবে।',
        beneficiary: 'সুবিধাভোগী', percentage: 'শতাংশ', purpose: 'উদ্দেশ্য',
        part6: 'পর্ব ৬: ইসলামী উত্তরাধিকার (ফারায়েয)', faraidIntro: 'আমি নির্দেশ দিচ্ছি যে অবশিষ্ট সম্পত্তি কুরআন (সূরা আন-নিসা ৪:১১-১২) ও সুন্নাহ অনুযায়ী ফারায়েয আইনে বণ্টিত হবে।',
        testatorInfo: 'ফারায়েয গণনার জন্য ওসিয়্যতকারীর তথ্য:', testator: 'ওসিয়্যতকারী',
        male: 'পুরুষ', female: 'মহিলা', maritalStatus: 'বৈবাহিক অবস্থা', spouse: 'স্বামী/স্ত্রী',
        hasChildren: 'সন্তান আছে', yes: 'হ্যাঁ', no: 'না', children: 'সন্তান', son: 'পুত্র', daughter: 'কন্যা',
        father: 'পিতা', mother: 'মাতা', living: 'জীবিত', deceased: 'মৃত',
        calculatedShares: 'শরিয়াহ অনুযায়ী গণনাকৃত উত্তরাধিকার:', sharesNote: 'প্রদত্ত তথ্য ও ইসলামী উত্তরাধিকার আইনের ভিত্তিতে:',
        faraidReference: 'ফারায়েয রেফারেন্স (কুরআনী অংশ):', quranicVerse: 'কুরআনে আদেশ - "আল্লাহ তোমাদের সন্তানদের সম্পর্কে আদেশ করছেন: পুরুষের অংশ দুই নারীর সমান..." (৪:১১)',
        heir: 'উত্তরাধিকারী', withChildren: 'সন্তানসহ', withoutChildren: 'সন্তান ছাড়া',
        wife: 'স্ত্রী', husband: 'স্বামী', sons: 'পুত্রগণ', residue: 'আসাবা',
        daughterAlone: 'কন্যা (একা)', daughters2plus: 'কন্যাগণ (২+)', sharedEqually: 'সমানভাবে',
        faraidImportant: 'এই অংশগুলো প্রদত্ত তথ্যের ভিত্তিতে। বণ্টনের সময় মুফতির পরামর্শ নিন।',
        part7: 'পর্ব ৭: নাবালক সন্তানদের অভিভাবকত্ব', guardianIntro: 'আমার মৃত্যুর সময় নাবালক সন্তান থাকলে আমি নিয়োগ করছি:',
        primaryGuardian: 'প্রধান অভিভাবক', secondaryGuardian: 'দ্বিতীয় অভিভাবক',
        guardianWish: 'আমি চাই আমার সন্তানদের ইসলামী শিক্ষা অনুযায়ী লালন-পালন হোক।',
        part8: 'পর্ব ৮: অঙ্গ দান', organConsent: 'আমি জীবন রক্ষায় অঙ্গ দানে সম্মত।', organRefuse: 'আমি অঙ্গ দানে সম্মত নই।',
        organDefer: 'আমি অঙ্গ দানের সিদ্ধান্ত পরিবার ও আলেমের উপর ছেড়ে দিচ্ছি।',
        part9: 'পর্ব ৯: ঘোষণা', declarationIntro: 'আমি ঘোষণা করছি:',
        decl1: 'আমার বয়স ১৮ বছরের বেশি', decl2: 'আমি সুস্থ মস্তিষ্কে আছি', decl3: 'আমি স্বেচ্ছায় এই উইল তৈরি করছি',
        decl4: 'আমি জানি ইসলামী অংশ আল্লাহ কর্তৃক নির্ধারিত', decl5: 'আমি ওয়ারিসের জন্য ওসিয়্যত করিনি', decl6: 'মোট ওসিয়্যত এক-তৃতীয়াংশের বেশি নয়',
        signatures: 'স্বাক্ষর', testatorSig: 'ওসিয়্যতকারী', signatureOf: 'ওসিয়্যতকারীর স্বাক্ষর',
        fullName: 'পূর্ণ নাম', date: 'তারিখ', witness1: 'সাক্ষী ১', witness2: 'সাক্ষী ২',
        witnessNote: 'এই উইল দুজন সাক্ষীর উপস্থিতিতে স্বাক্ষর করতে হবে', signature: 'স্বাক্ষর', occupation: 'পেশা',
        solicitorCert: 'আইনজীবীর সনদ', solicitorCert1: 'ওসিয়্যতকারী সুস্থ মস্তিষ্কে ছিলেন',
        solicitorCert2: 'উইল ব্যাখ্যা করা হয়েছে', solicitorCert3: 'উইল যুক্তরাজ্যের আইন মেনে চলে', solicitorCert4: 'সাক্ষ্য পদ্ধতি মানা হয়েছে',
        solicitorName: 'আইনজীবীর নাম', firm: 'ফার্ম', sraNumber: 'SRA নম্বর',
        islamicCert: 'ইসলামী সনদ (মুফতি/ইমাম)', islamicCertIntro: 'আমি সনদ দিচ্ছি যে আমি উইল পর্যালোচনা করেছি:',
        islamicCert1: 'ওসিয়্যত এক-তৃতীয়াংশের বেশি নয়', islamicCert2: 'ওয়ারিসের জন্য ওসিয়্যত নেই',
        islamicCert3: 'ফারায়েয বণ্টন ইসলামী', islamicCert4: 'জানাযার ইচ্ছা শরিয়াহসম্মত',
        muftiName: 'মুফতি/ইমামের নাম', mosqueInstitution: 'মসজিদ/প্রতিষ্ঠান', contact: 'যোগাযোগ',
        firmStamp: 'ফার্মের সিল', mosqueStamp: 'মসজিদের সিল',
        generatedOn: (date) => `এই উইল ${date} তারিখে ইসলামী উইল জেনারেটর দ্বারা তৈরি।`,
        reviewNote: 'স্বাক্ষরের আগে আইনজীবী ও আলেম দ্বারা পর্যালোচনা করান।',
        days: 'দিন', entitledTo: 'প্রাপ্য', receivesDouble: 'আসাবা (কন্যার দ্বিগুণ)', notSpecified: 'উল্লেখ নেই', important: 'গুরুত্বপূর্ণ'
    },
    tr: {
        title: 'İSLAMİ VASİYETNAME',
        bismillahTranslation: 'Rahman ve Rahim olan Allah\'ın adıyla',
        declarationOfFaith: 'İMAN BEYANI',
        declarationText: (name, address) => `Ben, <strong>${name}</strong>, <strong>${address}</strong> adresinde ikamet eden, sağlıklı akıl ve anlayışla, Allah\'tan başka ilah olmadığına ve Muhammed\'in (s.a.v.) O\'nun son elçisi olduğuna şehadet ederim.`,
        madeInAccordance: 'Bu vasiyetnameyi İslam Hukuku (Şeriat) ve İngiltere ve Galler yasalarına uygun olarak hazırlıyorum.',
        part1: 'BÖLÜM 1: İPTAL', revocationText: 'Daha önce yaptığım tüm vasiyetnameleri iptal ediyor ve bunu son vasiyetnamem olarak ilan ediyorum.',
        part2: 'BÖLÜM 2: VASİ ATAMASI', executorIntro: 'Bu vasiyetnamenin vasisi olarak aşağıdaki kişi(ler)i atıyorum:',
        primaryExecutor: 'Birincil Vasi:', secondaryExecutor: 'İkincil Vasi:',
        name: 'Ad', address: 'Adres', relationship: 'İlişki',
        part3: 'BÖLÜM 3: CENAZE DÜZENLEMELERİ', funeralIntro: 'Vefatım halinde şunları vasiyet ediyorum:',
        funeral1: 'Cenazem İslami usullere göre yıkansın ve kefenlensin', funeral2: 'Cenaze namazı kılınsın',
        funeral3: 'Kıbleye yönelik olarak Müslüman mezarlığına defnedileyim (yakılmayacak)', funeral4: 'Defin mümkün olan en kısa sürede yapılsın',
        funeral5: 'Cenaze sünnete uygun sade bir şekilde kaldırılsın',
        repatriation: 'Ülkeye Nakil', repatriationText: (country) => `${country}'da defnedilmek istiyorum. 3 gün içinde mümkün olmazsa Birleşik Krallık'ta defnedileyim.`,
        preferredCemetery: 'Tercih Edilen Mezarlık', preferredMosque: 'Cenaze İçin Tercih Edilen Cami',
        part4: 'BÖLÜM 4: BORÇLARIN ÖDENMESİ', debtsIntro: 'Vasime mirasımdan öncelik sırasına göre ödeme yapmasını vasiyet ediyorum:',
        funeralExpenses: 'Cenaze masrafları', allDebts: 'Tüm meşru borçlarım', outstandingMahr: 'Eşime ödenmeyen mehir',
        unpaidZakat: 'Ödenmemiş zekat', fidyah: 'Tutulamayan oruçlar için fidye', kaffarah: 'Kefaret', hajjBadal: 'Bedel haccı düzenlenmesi',
        part5: 'BÖLÜM 5: İSLAMİ VASİYET', wasiyyahYes: 'İslam hukukuna göre, net mirasımın <strong>üçte birine (1/3)</strong> kadar şu şekilde vasiyet ediyorum:',
        wasiyyahNote: 'Not: Bu vasiyet zaten İslam miras hukukuna göre mirasçı olanlara yapılamaz',
        wasiyyahNo: 'Vasiyet yapmak istemiyorum. Tüm mirasım feraiz hükümlerine göre dağıtılsın.',
        beneficiary: 'Lehtar', percentage: 'Yüzde', purpose: 'Amaç',
        part6: 'BÖLÜM 6: İSLAMİ MİRAS (FERAİZ)', faraidIntro: 'Kalan mirasımın Kur\'an (Nisa 4:11-12) ve Sünnete göre feraiz hükümlerine göre dağıtılmasını vasiyet ediyorum.',
        testatorInfo: 'Feraiz hesabı için vasiyet eden bilgileri:', testator: 'Vasiyet Eden',
        male: 'Erkek', female: 'Kadın', maritalStatus: 'Medeni Durum', spouse: 'Eş',
        hasChildren: 'Çocuk Var', yes: 'Evet', no: 'Hayır', children: 'Çocuklar', son: 'Oğul', daughter: 'Kız',
        father: 'Baba', mother: 'Anne', living: 'Hayatta', deceased: 'Vefat Etmiş',
        calculatedShares: 'Şeriata Göre Hesaplanan Miras Payları:', sharesNote: 'Verilen bilgiler ve İslam miras hukukuna göre paylar:',
        faraidReference: 'Feraiz Referansı (Kur\'ani Paylar):', quranicVerse: 'Kur\'an\'da buyurulduğu üzere - "Allah size çocuklarınız hakkında emreder: Erkeğe iki kadın payı kadar..." (4:11)',
        heir: 'Mirasçı', withChildren: 'Çocuklu', withoutChildren: 'Çocuksuz',
        wife: 'Eş (Kadın)', husband: 'Eş (Erkek)', sons: 'Oğullar', residue: 'Asabe',
        daughterAlone: 'Kız (tek)', daughters2plus: 'Kızlar (2+)', sharedEqually: 'eşit paylaşım',
        faraidImportant: 'Bu paylar verilen bilgilere göre hesaplanmıştır. Dağıtım sırasında müftüye danışılmasını istiyorum.',
        part7: 'BÖLÜM 7: KÜÇÜK ÇOCUKLARIN VELAYETİ', guardianIntro: 'Vefatım sırasında küçük çocuklarım varsa atıyorum:',
        primaryGuardian: 'Birincil Veli', secondaryGuardian: 'İkincil Veli',
        guardianWish: 'Çocuklarımın İslami ilkelere göre yetiştirilmesini istiyorum.',
        part8: 'BÖLÜM 8: ORGAN BAĞIŞI', organConsent: 'Hayat kurtarmak için organ bağışına razıyım.',
        organRefuse: 'Organ bağışına razı değilim.', organDefer: 'Organ bağışı kararını aileme ve bir İslam alimine bırakıyorum.',
        part9: 'BÖLÜM 9: BEYAN', declarationIntro: 'Beyan ederim ki:',
        decl1: '18 yaşından büyüğüm', decl2: 'Sağlıklı akıl sahibiyim', decl3: 'Bu vasiyeti özgür irademle yapıyorum',
        decl4: 'İslami payların Allah tarafından belirlendiğini biliyorum', decl5: 'Mirasçıya üçte birden vasiyet yapmadım', decl6: 'Toplam vasiyet üçte biri aşmıyor',
        signatures: 'İMZALAR', testatorSig: 'VASİYET EDEN', signatureOf: 'Vasiyet Edenin İmzası',
        fullName: 'Tam Ad', date: 'Tarih', witness1: 'ŞAHİT 1', witness2: 'ŞAHİT 2',
        witnessNote: 'Bu vasiyet lehtar olmayan iki şahit huzurunda imzalanmalıdır', signature: 'İmza', occupation: 'Meslek',
        solicitorCert: 'AVUKAT SERTİFİKASI', solicitorCert1: 'Vasiyet eden sağlıklı akıl sahibiydi', solicitorCert2: 'Vasiyet açıklandı',
        solicitorCert3: 'Vasiyet BK yasasına uygun', solicitorCert4: 'Şahitlik prosedürleri izlendi',
        solicitorName: 'Avukat Adı', firm: 'Firma', sraNumber: 'SRA Numarası',
        islamicCert: 'İSLAMİ SERTİFİKA (MÜFTİ/İMAM)', islamicCertIntro: 'Vasiyeti inceledim ve onaylıyorum:',
        islamicCert1: 'Vasiyet üçte biri aşmıyor', islamicCert2: 'Kur\'ani mirasçılara vasiyet yok',
        islamicCert3: 'Feraiz dağıtımı İslam hukukuna uygun', islamicCert4: 'Cenaze dilekleri şeriata uygun',
        muftiName: 'Müftü/İmam Adı', mosqueInstitution: 'Cami/Kurum', contact: 'İletişim',
        firmStamp: 'Firma Mührü', mosqueStamp: 'Cami/Kurum Mührü',
        generatedOn: (date) => `Bu vasiyet ${date} tarihinde İslami Vasiyet Üreteci ile oluşturuldu.`,
        reviewNote: 'İmzalamadan önce avukat ve İslam alimi tarafından incelenmesini sağlayın.',
        days: 'gün', entitledTo: 'hak sahibi', receivesDouble: 'Asabe (kızın payının iki katı)', notSpecified: 'Belirtilmedi', important: 'Önemli'
    },
    ms: {
        title: 'WASIAT ISLAM',
        bismillahTranslation: 'Dengan Nama Allah Yang Maha Pemurah Lagi Maha Mengasihani',
        declarationOfFaith: 'PENGAKUAN IMAN',
        declarationText: (name, address) => `Saya, <strong>${name}</strong>, beralamat di <strong>${address}</strong>, dengan akal yang waras, bersaksi bahawa tiada tuhan selain Allah dan Muhammad s.a.w. adalah utusan-Nya yang terakhir.`,
        madeInAccordance: 'Saya membuat wasiat ini mengikut Hukum Islam (Syariah) dan undang-undang England dan Wales.',
        part1: 'BAHAGIAN 1: PEMBATALAN', revocationText: 'Saya membatalkan semua wasiat terdahulu dan mengisytiharkan ini sebagai wasiat terakhir saya.',
        part2: 'BAHAGIAN 2: PELANTIKAN WASI', executorIntro: 'Saya melantik orang berikut sebagai Wasi wasiat ini:',
        primaryExecutor: 'Wasi Utama:', secondaryExecutor: 'Wasi Kedua:',
        name: 'Nama', address: 'Alamat', relationship: 'Hubungan',
        part3: 'BAHAGIAN 3: URUSAN JENAZAH', funeralIntro: 'Saya mengarahkan apabila kematian saya:',
        funeral1: 'Jenazah saya dimandikan dan dikafankan mengikut syariat Islam',
        funeral2: 'Solat jenazah hendaklah ditunaikan', funeral3: 'Saya dikebumikan di tanah perkuburan Islam menghadap kiblat',
        funeral4: 'Pengebumian dilakukan secepat mungkin', funeral5: 'Urusan jenazah dilakukan dengan sederhana mengikut Sunnah',
        repatriation: 'Penghantaran Pulang', repatriationText: (country) => `Saya ingin dikebumikan di ${country}. Jika tidak dapat dalam 3 hari, kebumikan di UK.`,
        preferredCemetery: 'Tanah Perkuburan Pilihan', preferredMosque: 'Masjid Pilihan untuk Jenazah',
        part4: 'BAHAGIAN 4: PEMBAYARAN HUTANG', debtsIntro: 'Saya mengarahkan Wasi membayar dari harta saya mengikut keutamaan:',
        funeralExpenses: 'Kos jenazah dan pengebumian', allDebts: 'Semua hutang sah', outstandingMahr: 'Mahar tertunggak isteri',
        unpaidZakat: 'Zakat tertunggak', fidyah: 'Fidyah puasa', kaffarah: 'Kaffarah', hajjBadal: 'Haji badal',
        part5: 'BAHAGIAN 5: WASIAT ISLAM', wasiyyahYes: 'Mengikut hukum Islam, saya mewasiatkan sehingga <strong>satu pertiga (1/3)</strong> harta bersih saya:',
        wasiyyahNote: 'Nota: Wasiat tidak boleh dibuat kepada waris faraid',
        wasiyyahNo: 'Saya tidak mahu membuat wasiat. Semua harta diagihkan mengikut faraid.',
        beneficiary: 'Penerima', percentage: 'Peratusan', purpose: 'Tujuan',
        part6: 'BAHAGIAN 6: WARISAN ISLAM (FARAID)', faraidIntro: 'Baki harta saya diagihkan mengikut hukum faraid sebagaimana dalam Al-Quran (Surah An-Nisa 4:11-12) dan Sunnah.',
        testatorInfo: 'Maklumat pewasiat untuk pengiraan faraid:', testator: 'Pewasiat',
        male: 'Lelaki', female: 'Perempuan', maritalStatus: 'Status Perkahwinan', spouse: 'Pasangan',
        hasChildren: 'Ada Anak', yes: 'Ya', no: 'Tidak', children: 'Anak-anak', son: 'Anak lelaki', daughter: 'Anak perempuan',
        father: 'Bapa', mother: 'Ibu', living: 'Hidup', deceased: 'Meninggal dunia',
        calculatedShares: 'Bahagian warisan mengikut syariat:', sharesNote: 'Berdasarkan maklumat yang diberikan:',
        faraidReference: 'Rujukan Faraid (Bahagian Al-Quran):', quranicVerse: 'Sebagaimana firman Allah - "Allah perintahkan kamu mengenai anak-anak: bahagian lelaki sama dengan dua bahagian perempuan..." (4:11)',
        heir: 'Waris', withChildren: 'Ada Anak', withoutChildren: 'Tiada Anak',
        wife: 'Isteri', husband: 'Suami', sons: 'Anak lelaki', residue: 'Asabah',
        daughterAlone: 'Anak perempuan (tunggal)', daughters2plus: 'Anak perempuan (2+)', sharedEqually: 'sama rata',
        faraidImportant: 'Bahagian ini dikira berdasarkan maklumat yang diberikan. Sila rujuk mufti untuk pengiraan muktamad.',
        part7: 'BAHAGIAN 7: PENJAGAAN ANAK', guardianIntro: 'Jika ada anak di bawah umur semasa kematian saya:',
        primaryGuardian: 'Penjaga Utama', secondaryGuardian: 'Penjaga Kedua',
        guardianWish: 'Saya mahu anak-anak dibesarkan mengikut ajaran Islam.',
        part8: 'BAHAGIAN 8: DERMA ORGAN', organConsent: 'Saya bersetuju menderma organ.', organRefuse: 'Saya tidak bersetuju.',
        organDefer: 'Saya serahkan keputusan kepada keluarga dan ulama.',
        part9: 'BAHAGIAN 9: PERISYTIHARAN', declarationIntro: 'Saya mengisytiharkan:',
        decl1: 'Saya berumur lebih 18 tahun', decl2: 'Saya waras', decl3: 'Saya membuat wasiat ini secara sukarela',
        decl4: 'Saya faham bahagian Islam ditetapkan Allah', decl5: 'Tiada wasiat kepada waris', decl6: 'Jumlah wasiat tidak melebihi satu pertiga',
        signatures: 'TANDATANGAN', testatorSig: 'PEWASIAT', signatureOf: 'Tandatangan Pewasiat',
        fullName: 'Nama Penuh', date: 'Tarikh', witness1: 'SAKSI 1', witness2: 'SAKSI 2',
        witnessNote: 'Wasiat mesti ditandatangani di hadapan dua saksi', signature: 'Tandatangan', occupation: 'Pekerjaan',
        solicitorCert: 'SIJIL PEGUAM', solicitorCert1: 'Pewasiat waras', solicitorCert2: 'Wasiat dijelaskan',
        solicitorCert3: 'Wasiat mematuhi undang-undang UK', solicitorCert4: 'Prosedur penyaksian dipatuhi',
        solicitorName: 'Nama Peguam', firm: 'Firma', sraNumber: 'Nombor SRA',
        islamicCert: 'SIJIL ISLAM (MUFTI/IMAM)', islamicCertIntro: 'Saya mengesahkan setelah menyemak wasiat:',
        islamicCert1: 'Wasiat tidak melebihi satu pertiga', islamicCert2: 'Tiada wasiat kepada waris Quran',
        islamicCert3: 'Pembahagian faraid mengikut hukum Islam', islamicCert4: 'Urusan jenazah mematuhi syariat',
        muftiName: 'Nama Mufti/Imam', mosqueInstitution: 'Masjid/Institusi', contact: 'Hubungi',
        firmStamp: 'Cap Firma', mosqueStamp: 'Cap Masjid/Institusi',
        generatedOn: (date) => `Wasiat ini dijana pada ${date} menggunakan Penjana Wasiat Islam.`,
        reviewNote: 'Sila semak oleh peguam dan ulama sebelum menandatangani.',
        days: 'hari', entitledTo: 'berhak', receivesDouble: 'Asabah (dua kali ganda bahagian anak perempuan)', notSpecified: 'Tidak dinyatakan', important: 'Penting'
    },
    fr: {
        title: 'TESTAMENT ISLAMIQUE (WASIYYAH)',
        bismillahTranslation: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux',
        declarationOfFaith: 'DÉCLARATION DE FOI',
        declarationText: (name, address) => `Je, <strong>${name}</strong>, demeurant à <strong>${address}</strong>, sain d'esprit, atteste qu'il n'y a de dieu qu'Allah et que Muhammad (paix sur lui) est Son dernier Messager.`,
        madeInAccordance: 'Je fais ce testament conformément à la loi islamique (Charia) et aux lois d\'Angleterre et du Pays de Galles.',
        part1: 'PARTIE 1 : RÉVOCATION', revocationText: 'Je révoque tous mes testaments antérieurs et déclare ceci comme mon dernier testament.',
        part2: 'PARTIE 2 : NOMINATION DES EXÉCUTEURS', executorIntro: 'Je nomme la/les personne(s) suivante(s) comme exécuteur(s):',
        primaryExecutor: 'Exécuteur principal :', secondaryExecutor: 'Exécuteur secondaire :',
        name: 'Nom', address: 'Adresse', relationship: 'Lien',
        part3: 'PARTIE 3 : DISPOSITIONS FUNÉRAIRES', funeralIntro: 'Je dispose qu\'à mon décès :',
        funeral1: 'Mon corps sera lavé (Ghusl) et enveloppé (Kafan) selon les rites islamiques',
        funeral2: 'La prière funéraire (Janazah) sera accomplie', funeral3: 'Je serai enterré(e) dans un cimetière musulman, face à la Qibla',
        funeral4: 'L\'enterrement aura lieu dès que possible', funeral5: 'Les funérailles seront simples, conformément à la Sunna',
        repatriation: 'Rapatriement', repatriationText: (country) => `Je souhaite être enterré(e) en ${country}. Si impossible dans les 3 jours, enterrement au Royaume-Uni.`,
        preferredCemetery: 'Cimetière préféré', preferredMosque: 'Mosquée préférée pour la Janazah',
        part4: 'PARTIE 4 : PAIEMENT DES DETTES', debtsIntro: 'Je charge mes exécuteurs de payer par ordre de priorité :',
        funeralExpenses: 'Frais funéraires', allDebts: 'Toutes mes dettes', outstandingMahr: 'Mahr impayé à mon épouse',
        unpaidZakat: 'Zakat impayée', fidyah: 'Fidyah pour jeûnes manqués', kaffarah: 'Kaffarah', hajjBadal: 'Hajj Badal',
        part5: 'PARTIE 5 : LEGS ISLAMIQUE (WASIYYAH)',
        wasiyyahYes: 'Conformément au droit islamique, je lègue jusqu\'à <strong>UN TIERS (1/3)</strong> de ma succession nette :',
        wasiyyahNote: 'Note : Ce legs ne peut être fait aux héritiers déjà désignés par le droit islamique',
        wasiyyahNo: 'Je ne souhaite pas faire de Wasiyyah. Ma succession sera distribuée selon le Faraid.',
        beneficiary: 'Bénéficiaire', percentage: 'Pourcentage', purpose: 'Objet',
        part6: 'PARTIE 6 : HÉRITAGE ISLAMIQUE (FARAID)', faraidIntro: 'Le reste de ma succession sera distribué selon le Faraid (Coran, Sourate An-Nisa 4:11-12).',
        testatorInfo: 'Informations pour le calcul du Faraid :', testator: 'Testateur',
        male: 'Homme', female: 'Femme', maritalStatus: 'Situation matrimoniale', spouse: 'Conjoint',
        hasChildren: 'A des enfants', yes: 'Oui', no: 'Non', children: 'Enfants', son: 'Fils', daughter: 'Fille',
        father: 'Père', mother: 'Mère', living: 'Vivant', deceased: 'Décédé',
        calculatedShares: 'Parts calculées selon la Charia :', sharesNote: 'Basé sur les informations fournies :',
        faraidReference: 'Référence Faraid (Parts coraniques) :', quranicVerse: 'Comme ordonné dans le Coran - "Allah vous commande au sujet de vos enfants : au garçon une part égale à celle de deux filles..." (4:11)',
        heir: 'Héritier', withChildren: 'Avec enfants', withoutChildren: 'Sans enfants',
        wife: 'Épouse', husband: 'Époux', sons: 'Fils', residue: 'Résidu',
        daughterAlone: 'Fille (seule)', daughters2plus: 'Filles (2+)', sharedEqually: 'partagé également',
        faraidImportant: 'Ces parts sont calculées selon les informations fournies. Consultez un Mufti pour le calcul final.',
        part7: 'PARTIE 7 : TUTELLE DES ENFANTS MINEURS', guardianIntro: 'Si j\'ai des enfants mineurs à mon décès, je nomme :',
        primaryGuardian: 'Tuteur principal', secondaryGuardian: 'Tuteur secondaire',
        guardianWish: 'Je demande que mes enfants soient élevés selon les principes islamiques.',
        part8: 'PARTIE 8 : DON D\'ORGANES', organConsent: 'Je consens au don d\'organes.', organRefuse: 'Je refuse le don d\'organes.',
        organDefer: 'Je laisse la décision à ma famille et à un savant islamique.',
        part9: 'PARTIE 9 : DÉCLARATION', declarationIntro: 'Je déclare que :',
        decl1: 'J\'ai plus de 18 ans', decl2: 'Je suis sain d\'esprit', decl3: 'Je fais ce testament librement',
        decl4: 'Je comprends que les parts islamiques sont fixées par Allah', decl5: 'Je n\'ai pas fait de legs à un héritier', decl6: 'Le total des legs ne dépasse pas un tiers',
        signatures: 'SIGNATURES', testatorSig: 'TESTATEUR', signatureOf: 'Signature du testateur',
        fullName: 'Nom complet', date: 'Date', witness1: 'TÉMOIN 1', witness2: 'TÉMOIN 2',
        witnessNote: 'Ce testament doit être signé en présence de deux témoins non bénéficiaires', signature: 'Signature', occupation: 'Profession',
        solicitorCert: 'CERTIFICATION DU SOLICITOR', solicitorCert1: 'Le testateur semblait sain d\'esprit',
        solicitorCert2: 'Le testament a été expliqué', solicitorCert3: 'Conforme au droit britannique', solicitorCert4: 'Procédures de témoignage respectées',
        solicitorName: 'Nom du solicitor', firm: 'Cabinet', sraNumber: 'Numéro SRA',
        islamicCert: 'CERTIFICATION ISLAMIQUE (MUFTI/IMAM)', islamicCertIntro: 'Je certifie avoir examiné ce testament :',
        islamicCert1: 'La Wasiyyah ne dépasse pas un tiers', islamicCert2: 'Pas de legs aux héritiers coraniques',
        islamicCert3: 'La distribution Faraid suit la loi islamique', islamicCert4: 'Les souhaits funéraires sont conformes',
        muftiName: 'Nom du Mufti/Imam', mosqueInstitution: 'Mosquée/Institution', contact: 'Contact',
        firmStamp: 'Cachet du cabinet', mosqueStamp: 'Cachet de la mosquée',
        generatedOn: (date) => `Ce testament a été généré le ${date} par le Générateur de Testament Islamique.`,
        reviewNote: 'Faites vérifier ce document par un solicitor et un savant islamique avant de signer.',
        days: 'jours', entitledTo: 'a droit à', receivesDouble: 'Résidu (double de la part de la fille)', notSpecified: 'Non spécifié', important: 'Important'
    },
    so: {
        title: 'DARDAARAN ISLAAMIGA AH (WASIYYAH)',
        bismillahTranslation: 'Magaca Ilaahay ee Naxariista Badan, Naxariista Badan',
        declarationOfFaith: 'SHAHAADADA IIMAANKA',
        declarationText: (name, address) => `Aniga, <strong>${name}</strong>, deggan <strong>${address}</strong>, maskaxda igoo caafimaad ah, waxaan markhaati ka ahay in Ilaah mooyaane aan Ilaah kale jirin, iyo in Muxammad (NNKH) uu yahay Rasuulkiisa ugu dambeeyay.`,
        madeInAccordance: 'Waxaan dardaarannkan sameeyay si waafaqsan Sharciga Islaamiga (Shariicada) iyo sharciyada England iyo Wales.',
        part1: 'QAYBTA 1: BURINTIISA', revocationText: 'Waxaan burinayaa dhammaan dardaarannadii hore oo waxaan ku dhawaaqayaa kani inuu yahay dardaarankaygii ugu dambeeyay.',
        part2: 'QAYBTA 2: MAGACAABISTA FULIYAYAASHA', executorIntro: 'Waxaan u magacaabayaa qofka/qoofka soo socda fuliyaha:',
        primaryExecutor: 'Fuliyaha Koowaad:', secondaryExecutor: 'Fuliyaha Labaad:',
        name: 'Magac', address: 'Cinwaan', relationship: 'Xiriir',
        part3: 'QAYBTA 3: AASIDDA', funeralIntro: 'Waxaan amrayaa in marka aan dhinto:',
        funeral1: 'Meydkayga la maydiyo oo la kafano si Islaamiga ah', funeral2: 'Salaadda Janaasada la tukadiyo',
        funeral3: 'La ii aaso xabaalka Muslimiinta, Qiblada loo jeedsiiyo', funeral4: 'Aasidda si degdeg ah loo fuliyo',
        funeral5: 'Aasidda si fudud loo fuliyo sida Sunnada',
        repatriation: 'Dib u celinta', repatriationText: (country) => `Waxaan doonayaa in la i aaso ${country}. Haddi 3 maalmood lagu awoodin, la i aaso UK.`,
        preferredCemetery: 'Xabaalka La Doorbido', preferredMosque: 'Masjidka Janaasada',
        part4: 'QAYBTA 4: BIXINTA DAYMAHA', debtsIntro: 'Waxaan amrayaa fuliyaha inuu ka bixiyo hantidayda:',
        funeralExpenses: 'Kharashka aasidda', allDebts: 'Dhammaan daymahaygii sharci ah', outstandingMahr: 'Maharka aan la bixin xaaskayda',
        unpaidZakat: 'Zakada aan la bixin', fidyah: 'Fidyaha soonka', kaffarah: 'Kaffaarada', hajjBadal: 'Xajka Badal',
        part5: 'QAYBTA 5: WASIYYADA ISLAAMIGA', wasiyyahYes: 'Si waafaqsan Sharciga Islaamiga, waxaan dardaarannayaa ilaa <strong>saddex meelood (1/3)</strong>:',
        wasiyyahNote: 'Fiiro gaar ah: Wasiyyadani uma suurtowdo kuwa hore u dhaxla sharciga faraid',
        wasiyyahNo: 'Anigu dooni maayo wasiyyad. Hantidayda oo dhan ha loo qaybiyo faraid.',
        beneficiary: 'Ka faa\'iidaysta', percentage: 'Boqolkiiba', purpose: 'Ujeeddo',
        part6: 'QAYBTA 6: DHAXALKA ISLAAMIGA (FARAID)', faraidIntro: 'Inta hadhay hantidayda ha loo qaybiyo faraid sida ku xusan Quraanka (Suuradda An-Nisaa 4:11-12).',
        testatorInfo: 'Macluumaadka xisaabinta faraid:', testator: 'Dardaaranka',
        male: 'Lab', female: 'Dheddig', maritalStatus: 'Xaaladda Guurka', spouse: 'Xaas/Nin',
        hasChildren: 'Carruur', yes: 'Haa', no: 'Maya', children: 'Carruurta', son: 'Wiil', daughter: 'Gabar',
        father: 'Aabbe', mother: 'Hooyo', living: 'Nool', deceased: 'Geeriyooday',
        calculatedShares: 'Qaybaaha la xisaabiyay:', sharesNote: 'Macluumaadka la siiyay iyo sharciga dhaxalka:',
        faraidReference: 'Tixraaca Faraid:', quranicVerse: 'Sida Quraanka ku amray - "Ilaah wuxuu idinku amrayaa carruurtiinna: labka qayb la mid ah laba gabdhood..." (4:11)',
        heir: 'Dhaxle', withChildren: 'Carruur la leeyahay', withoutChildren: 'Carruur la\'aan',
        wife: 'Xaas', husband: 'Nin', sons: 'Wiilal', residue: 'Asabah',
        daughterAlone: 'Gabadh (kali ah)', daughters2plus: 'Gabdho (2+)', sharedEqually: 'si siman',
        faraidImportant: 'Qaybaahani waxay ku salaysan yihiin macluumaadka. Fadlan la tasho Mufti.',
        part7: 'QAYBTA 7: MASRUULNIMADA', guardianIntro: 'Hadii carruur yar ay jiraan marka aan dhinto:',
        primaryGuardian: 'Masruulka Koowaad', secondaryGuardian: 'Masruulka Labaad',
        guardianWish: 'Waxaan doonayaa in carruurta lagu kodsado Islaamiga.',
        part8: 'QAYBTA 8: KU DEEQIDDA XUBNAHA', organConsent: 'Waan ogolahay.', organRefuse: 'Anigu ogoli maayo.',
        organDefer: 'Go\'aanka waxaan u daayaa qoyskayga iyo culimada.',
        part9: 'QAYBTA 9: BAYAAN', declarationIntro: 'Waxaan bayaaminayaa:',
        decl1: 'Da\'daydu waa ka weyn tahay 18', decl2: 'Maskaxdaydu way caafimaad tahay', decl3: 'Si ikhtiyaar ah ayaan sameeyay',
        decl4: 'Waan fahmay in qaybaaha Islaamiga Ilaah uu gooyay', decl5: 'Dhaxle wasiyyad uma samayn', decl6: 'Wadarta wasiyyadu ma dhaafto saddexda meelood',
        signatures: 'SAXIIXYADA', testatorSig: 'DARDAARANKA', signatureOf: 'Saxiixda',
        fullName: 'Magaca Buuxa', date: 'Taariikhda', witness1: 'MARKHAATI 1', witness2: 'MARKHAATI 2',
        witnessNote: 'Laba markhaati oo aan ka faa\'iidaysanin ayaa loo baahan yahay', signature: 'Saxiix', occupation: 'Shaqo',
        solicitorCert: 'SHAHAADADA QAREENKA', solicitorCert1: 'Maskaxdu way caafimaad ahayd', solicitorCert2: 'Dardaarankii waa la sharxay',
        solicitorCert3: 'Sharciga UK waafaqsan', solicitorCert4: 'Nidaamka markhaatiga la raacay',
        solicitorName: 'Magaca Qareenka', firm: 'Shirkadda', sraNumber: 'Lambarka SRA',
        islamicCert: 'SHAHAADADA ISLAAMIGA (MUFTI/IMAAM)', islamicCertIntro: 'Waxaan ku xaqiijinayaa:',
        islamicCert1: 'Wasiyyadu ma dhaafto 1/3', islamicCert2: 'Dhaxlayaasha Quran wasiyyad looma samayn',
        islamicCert3: 'Qaybinta faraid waa Islaami', islamicCert4: 'Aasidda waa Shariicada',
        muftiName: 'Magaca Mufti/Imaam', mosqueInstitution: 'Masjid', contact: 'Xiriir',
        firmStamp: 'Shaabadda Shirkadda', mosqueStamp: 'Shaabadda Masjidka',
        generatedOn: (date) => `Dardaarankani wuxuu la sameeyay ${date}.`,
        reviewNote: 'Fadlan qareen iyo culimo ha dib u eegaan.',
        days: 'maalmood', entitledTo: 'xaq u leh', receivesDouble: 'Asabah (laba jeer qayb gabadha)', notSpecified: 'Lama cayimin', important: 'Muhiim'
    },
    fa: {
        title: 'وصیت‌نامه اسلامی',
        bismillahTranslation: 'به نام خداوند بخشنده مهربان',
        declarationOfFaith: 'شهادت ایمان',
        declarationText: (name, address) => `من، <strong>${name}</strong>، ساکن <strong>${address}</strong>، با عقل سالم شهادت می‌دهم که هیچ معبودی جز الله نیست و محمد (ص) آخرین فرستاده اوست.`,
        madeInAccordance: 'این وصیت‌نامه را مطابق شریعت اسلامی و قوانین انگلستان و ولز تنظیم می‌کنم.',
        part1: 'بخش ۱: ابطال', revocationText: 'تمام وصیت‌نامه‌های قبلی را باطل و اعلام می‌کنم این آخرین وصیت من است.',
        part2: 'بخش ۲: تعیین وصی', executorIntro: 'شخص/اشخاص زیر را به عنوان وصی تعیین می‌کنم:',
        primaryExecutor: 'وصی اصلی:', secondaryExecutor: 'وصی جایگزین:',
        name: 'نام', address: 'نشانی', relationship: 'نسبت',
        part3: 'بخش ۳: مراسم تدفین', funeralIntro: 'پس از فوت من:',
        funeral1: 'جسد من طبق آداب اسلامی غسل و کفن شود', funeral2: 'نماز جنازه خوانده شود',
        funeral3: 'در قبرستان مسلمانان رو به قبله دفن شوم', funeral4: 'دفن در اسرع وقت انجام شود',
        funeral5: 'مراسم ساده و مطابق سنت باشد',
        repatriation: 'انتقال', repatriationText: (country) => `مایلم در ${country} دفن شوم. اگر در ۳ روز ممکن نباشد، در بریتانیا دفن شوم.`,
        preferredCemetery: 'قبرستان مورد نظر', preferredMosque: 'مسجد مورد نظر',
        part4: 'بخش ۴: پرداخت بدهی‌ها', debtsIntro: 'به وصی دستور می‌دهم از اموالم به ترتیب اولویت پرداخت کند:',
        funeralExpenses: 'هزینه‌های تدفین', allDebts: 'تمام بدهی‌ها', outstandingMahr: 'مهریه معوق همسرم',
        unpaidZakat: 'زکات پرداخت نشده', fidyah: 'فدیه روزه', kaffarah: 'کفاره', hajjBadal: 'حج نیابتی',
        part5: 'بخش ۵: وصیت اسلامی', wasiyyahYes: 'مطابق شریعت، تا <strong>یک سوم (۱/۳)</strong> اموال خالص را وصیت می‌کنم:',
        wasiyyahNote: 'توجه: وصیت برای وارثان فرایض مجاز نیست',
        wasiyyahNo: 'وصیتی نمی‌کنم. تمام اموال طبق فرایض تقسیم شود.',
        beneficiary: 'ذینفع', percentage: 'درصد', purpose: 'هدف',
        part6: 'بخش ۶: ارث اسلامی (فرایض)', faraidIntro: 'باقی اموال طبق فرایض قرآن (سوره نساء ۴:۱۱-۱۲) و سنت تقسیم شود.',
        testatorInfo: 'اطلاعات موصی برای محاسبه فرایض:', testator: 'موصی',
        male: 'مرد', female: 'زن', maritalStatus: 'وضعیت تأهل', spouse: 'همسر',
        hasChildren: 'فرزند دارد', yes: 'بله', no: 'خیر', children: 'فرزندان', son: 'پسر', daughter: 'دختر',
        father: 'پدر', mother: 'مادر', living: 'در قید حیات', deceased: 'فوت شده',
        calculatedShares: 'سهام محاسبه شده طبق شریعت:', sharesNote: 'بر اساس اطلاعات ارائه شده:',
        faraidReference: 'مرجع فرایض:', quranicVerse: 'خداوند درباره فرزندانتان سفارش می‌کند: سهم پسر برابر دو دختر است... (۴:۱۱)',
        heir: 'وارث', withChildren: 'با فرزند', withoutChildren: 'بدون فرزند',
        wife: 'همسر (زن)', husband: 'همسر (مرد)', sons: 'پسران', residue: 'عصبه',
        daughterAlone: 'دختر (تنها)', daughters2plus: 'دختران (۲+)', sharedEqually: 'به تساوی',
        faraidImportant: 'این سهام بر اساس اطلاعات ارائه شده محاسبه شده. هنگام تقسیم با مفتی مشورت کنید.',
        part7: 'بخش ۷: سرپرستی فرزندان', guardianIntro: 'اگر فرزندان صغیر داشته باشم:',
        primaryGuardian: 'سرپرست اصلی', secondaryGuardian: 'سرپرست جایگزین',
        guardianWish: 'خواستارم فرزندانم طبق اصول اسلامی تربیت شوند.',
        part8: 'بخش ۸: اهدای عضو', organConsent: 'با اهدای عضو موافقم.', organRefuse: 'موافق نیستم.',
        organDefer: 'تصمیم را به خانواده و عالم واگذار می‌کنم.',
        part9: 'بخش ۹: اقرار', declarationIntro: 'اقرار می‌کنم:',
        decl1: 'بالای ۱۸ سال هستم', decl2: 'عقل سالم دارم', decl3: 'با اراده آزاد وصیت می‌کنم',
        decl4: 'سهام اسلامی توسط خداوند تعیین شده', decl5: 'برای وارث وصیت نکرده‌ام', decl6: 'مجموع وصیت از یک سوم بیشتر نیست',
        signatures: 'امضاها', testatorSig: 'موصی', signatureOf: 'امضای موصی',
        fullName: 'نام کامل', date: 'تاریخ', witness1: 'شاهد ۱', witness2: 'شاهد ۲',
        witnessNote: 'وصیت باید در حضور دو شاهد غیر ذینفع امضا شود', signature: 'امضا', occupation: 'شغل',
        solicitorCert: 'گواهی وکیل', solicitorCert1: 'موصی عاقل بود', solicitorCert2: 'وصیت توضیح داده شد',
        solicitorCert3: 'مطابق قانون بریتانیاست', solicitorCert4: 'رویه شهادت رعایت شد',
        solicitorName: 'نام وکیل', firm: 'دفتر', sraNumber: 'شماره SRA',
        islamicCert: 'گواهی اسلامی (مفتی/امام)', islamicCertIntro: 'تأیید می‌کنم که وصیت را بررسی کردم:',
        islamicCert1: 'وصیت از یک سوم بیشتر نیست', islamicCert2: 'وصیت برای وارثان قرآنی نشده',
        islamicCert3: 'تقسیم فرایض اسلامی است', islamicCert4: 'آداب تدفین شرعی است',
        muftiName: 'نام مفتی/امام', mosqueInstitution: 'مسجد/مؤسسه', contact: 'تماس',
        firmStamp: 'مهر دفتر', mosqueStamp: 'مهر مسجد',
        generatedOn: (date) => `این وصیت در ${date} توسط مولد وصیت اسلامی ایجاد شد.`,
        reviewNote: 'قبل از امضا توسط وکیل و عالم بررسی شود.',
        days: 'روز', entitledTo: 'مستحق', receivesDouble: 'عصبه (دو برابر سهم دختر)', notSpecified: 'مشخص نشده', important: 'مهم'
    }
};

// Get RTL languages
function isRTL(lang) {
    return ['ar', 'ur', 'fa'].includes(lang);
}

// Change will language and regenerate
function changeWillLanguage(lang) {
    currentWillLanguage = lang;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const willDocument = document.getElementById('willDocument');
    if (willDocument) {
        willDocument.innerHTML = generateWillHTML(today);
        // Apply RTL direction if needed
        if (isRTL(lang)) {
            willDocument.style.direction = 'rtl';
            willDocument.style.textAlign = 'right';
        } else {
            willDocument.style.direction = 'ltr';
            willDocument.style.textAlign = 'left';
        }
    }
}
