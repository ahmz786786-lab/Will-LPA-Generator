// ========================================
// Standard UK Will Generator - JavaScript
// ========================================

// Supabase - reuse shared client from config.js
let supabaseClient = null;

function initSupabase() {
    // Reuse the shared client created by config.js to avoid duplicate instances
    if (typeof getSharedSupabaseClient === 'function') {
        supabaseClient = getSharedSupabaseClient();
    }
    if (supabaseClient) {
        console.log('Supabase initialized (shared client)');
    } else {
        console.warn('Supabase not available, will save locally only');
    }
}

// State
let currentStep = 1;
const totalSteps = 10;
let formData = {};

// Counters for dynamic lists
let childCount = 0;
let debtCount = 0;
let debtOwedCount = 0;
let propertyCount = 0;
let bankAccountCount = 0;
let investmentCount = 0;
let businessCount = 0;
let vehicleCount = 0;
let valuableCount = 0;
let specificGiftCount = 0;
let charityCount = 0;
let beneficiaryCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Standard Will...');
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
        titleEl.textContent = name || 'New Standard Will';
    }
}

// Initialize progress steps
function initProgressSteps() {
    const stepsContainer = document.getElementById('progressSteps');
    const stepLabels = [
        'Welcome', 'Personal', 'Executors', 'Funeral', 'Family',
        'Debts', 'Assets', 'Beneficiaries', 'Guardianship', 'Generate'
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
    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'inline-flex';

    const nextBtn = document.getElementById('nextBtn');
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
    } else if (currentStep === totalSteps - 1) {
        nextBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="16 13 12 17 8 13"></polyline><line x1="12" y1="17" x2="12" y2="9"></line></svg> Generate Will';
        nextBtn.style.display = 'inline-flex';
    } else {
        nextBtn.innerHTML = 'Next Step <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        nextBtn.style.display = 'inline-flex';
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
    if (currentStep === 9) {
        generateReview();
    } else if (currentStep === 10) {
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
        const overAgeCheck = document.getElementById('ageConfirm');
        if (!overAgeCheck || !overAgeCheck.checked) {
            alert('Please confirm that you are over 18 years of age and of sound mind to proceed.');
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
    // Marital status toggle
    const maritalStatusEl = document.getElementById('maritalStatus');
    if (maritalStatusEl) {
        maritalStatusEl.addEventListener('change', (e) => {
            const spouseSection = document.getElementById('spouseSection');
            if (spouseSection) {
                spouseSection.style.display = e.target.value === 'married' ? 'block' : 'none';
            }
        });
    }

    // Children toggle
    document.querySelectorAll('input[name="hasChildren"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const childrenSection = document.getElementById('childrenSection');
            if (childrenSection) {
                childrenSection.style.display = e.target.value === 'yes' ? 'block' : 'none';
            }
        });
    });

    // Parent status toggles
    const fatherStatusEl = document.getElementById('fatherStatus');
    if (fatherStatusEl) {
        fatherStatusEl.addEventListener('change', (e) => {
            const fatherNameGroup = document.getElementById('fatherNameGroup');
            if (fatherNameGroup) {
                fatherNameGroup.style.display = e.target.value === 'living' ? 'block' : 'none';
            }
        });
    }

    const motherStatusEl = document.getElementById('motherStatus');
    if (motherStatusEl) {
        motherStatusEl.addEventListener('change', (e) => {
            const motherNameGroup = document.getElementById('motherNameGroup');
            if (motherNameGroup) {
                motherNameGroup.style.display = e.target.value === 'living' ? 'block' : 'none';
            }
        });
    }

    // Minor children toggle for guardianship
    document.querySelectorAll('input[name="hasMinorChildren"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const guardianshipSection = document.getElementById('guardianshipSection');
            if (guardianshipSection) {
                guardianshipSection.style.display = e.target.value === 'yes' ? 'block' : 'none';
            }
        });
    });

    // Funeral type change
    const funeralTypeEl = document.getElementById('funeralType');
    if (funeralTypeEl) {
        funeralTypeEl.addEventListener('change', (e) => {
            const burialSection = document.getElementById('burialSpecificSection');
            const cremationSection = document.getElementById('cremationSpecificSection');
            if (burialSection) {
                burialSection.style.display = e.target.value === 'burial' ? 'block' : 'none';
            }
            if (cremationSection) {
                cremationSection.style.display = e.target.value === 'cremation' ? 'block' : 'none';
            }
        });
    }

    // Burial location radio listeners
    document.querySelectorAll('input[name="burialLocation"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const repatriationGroup = document.getElementById('repatriationCountryGroup');
            if (repatriationGroup) {
                repatriationGroup.style.display = e.target.value === 'overseas' ? 'block' : 'none';
            }
        });
    });
}

// ========================================
// Dynamic list functions
// ========================================

function addChild() {
    childCount++;
    const container = document.getElementById('childrenList');
    const html = `
        <div class="list-item" id="child-${childCount}">
            <div class="list-item-header">
                <span class="list-item-title">Child ${childCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('child-${childCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
                    <input type="text" class="form-input" id="childMother-${childCount}" placeholder="Other parent's name">
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
                <button type="button" class="list-item-remove" onclick="removeItem('debt-${debtCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
                <button type="button" class="list-item-remove" onclick="removeItem('debtOwed-${debtOwedCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
                <div class="form-group">
                    <label class="form-label">Executor Instruction</label>
                    <select class="form-input" id="debtOwedInstruction-${debtOwedCount}">
                        <option value="collect">Collect this debt for the estate</option>
                        <option value="forgive">Forgive this debt</option>
                        <option value="negotiate">Negotiate a reduced settlement</option>
                        <option value="transfer">Transfer this debt to a named beneficiary</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <input type="text" class="form-input" id="debtOwedNotes-${debtOwedCount}" placeholder="e.g., contact details, evidence of debt...">
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
                <button type="button" class="list-item-remove" onclick="removeItem('property-${propertyCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
    bankAccountCount++;
    const container = document.getElementById('bankAccountsList');
    const html = `
        <div class="list-item" id="bank-${bankAccountCount}">
            <div class="list-item-header">
                <span class="list-item-title">Bank Account ${bankAccountCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('bank-${bankAccountCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Bank Name</label>
                    <input type="text" class="form-input" id="bankName-${bankAccountCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Account Type</label>
                    <select class="form-input" id="bankType-${bankAccountCount}">
                        <option value="Current">Current Account</option>
                        <option value="Savings">Savings Account</option>
                        <option value="ISA">ISA</option>
                        <option value="Joint">Joint Account</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Approximate Balance</label>
                    <input type="number" class="form-input" id="bankBalance-${bankAccountCount}" placeholder="£">
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
                <button type="button" class="list-item-remove" onclick="removeItem('investment-${investmentCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
                <button type="button" class="list-item-remove" onclick="removeItem('business-${businessCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
                <button type="button" class="list-item-remove" onclick="removeItem('vehicle-${vehicleCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
                <button type="button" class="list-item-remove" onclick="removeItem('valuable-${valuableCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
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
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// ========================================
// Step 8: Beneficiaries functions
// ========================================

function addSpecificGift() {
    specificGiftCount++;
    const container = document.getElementById('specificGiftsList');
    const html = `
        <div class="list-item" id="specificGift-${specificGiftCount}">
            <div class="list-item-header">
                <span class="list-item-title">Specific Gift ${specificGiftCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('specificGift-${specificGiftCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Beneficiary Name</label>
                    <input type="text" class="form-input" id="specificGiftBeneficiaryName-${specificGiftCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Relationship</label>
                    <input type="text" class="form-input" id="specificGiftRelationship-${specificGiftCount}" placeholder="e.g., Friend, Niece, Neighbour">
                </div>
                <div class="form-group full-width">
                    <label class="form-label">Gift Description</label>
                    <input type="text" class="form-input" id="specificGiftGiftDescription-${specificGiftCount}" placeholder="e.g., My gold watch, My painting by...">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addCharity() {
    charityCount++;
    const container = document.getElementById('charitiesList');
    const html = `
        <div class="list-item" id="charity-${charityCount}">
            <div class="list-item-header">
                <span class="list-item-title">Charity ${charityCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('charity-${charityCount}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Charity Name</label>
                    <input type="text" class="form-input" id="charityCharityName-${charityCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Amount or Percentage</label>
                    <input type="text" class="form-input" id="charityAmountOrPercent-${charityCount}" placeholder="e.g., £5,000 or 5%">
                </div>
                <div class="form-group">
                    <label class="form-label">Registration Number (optional)</label>
                    <input type="text" class="form-input" id="charityRegistrationNumber-${charityCount}">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function addBeneficiary() {
    beneficiaryCount++;
    const container = document.getElementById('beneficiariesList');
    const html = `
        <div class="list-item" id="beneficiary-${beneficiaryCount}">
            <div class="list-item-header">
                <span class="list-item-title">Beneficiary ${beneficiaryCount}</span>
                <button type="button" class="list-item-remove" onclick="removeItem('beneficiary-${beneficiaryCount}'); updateBeneficiaryTotal();"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Remove</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="beneficiaryName-${beneficiaryCount}">
                </div>
                <div class="form-group">
                    <label class="form-label">Relationship</label>
                    <input type="text" class="form-input" id="beneficiaryRelationship-${beneficiaryCount}" placeholder="e.g., Spouse, Son, Daughter, Brother">
                </div>
                <div class="form-group">
                    <label class="form-label">Percentage of Residuary Estate</label>
                    <input type="number" class="form-input" id="beneficiaryPercentage-${beneficiaryCount}" placeholder="%" max="100" min="0" onchange="updateBeneficiaryTotal()" oninput="updateBeneficiaryTotal()">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    updateBeneficiaryTotal();
}

function updateBeneficiaryTotal() {
    let total = 0;

    // Sum all beneficiary percentages
    document.querySelectorAll('[id^="beneficiaryPercentage-"]').forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    const totalEl = document.getElementById('beneficiaryTotalPercentage');
    const warningEl = document.getElementById('beneficiaryWarning');

    if (totalEl) {
        totalEl.textContent = `${total.toFixed(1)}%`;
        totalEl.style.color = Math.abs(total - 100) < 0.1 ? '#10b981' : '#dc2626';
    }

    if (warningEl) {
        if (Math.abs(total - 100) < 0.1) {
            warningEl.style.display = 'none';
        } else if (total === 0) {
            warningEl.style.display = 'none';
        } else {
            warningEl.style.display = 'block';
            if (total > 100) {
                warningEl.textContent = `Warning: Total beneficiary percentage (${total.toFixed(1)}%) exceeds 100%. Please adjust the percentages.`;
            } else {
                warningEl.textContent = `Note: Total beneficiary percentage is ${total.toFixed(1)}%. It should equal 100% for a complete distribution of the residuary estate.`;
            }
        }
    }
}

// ========================================
// Remove item
// ========================================

function removeItem(id) {
    document.getElementById(id).remove();
}

// ========================================
// Collect list data
// ========================================

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
// Save / Load progress
// ========================================

async function saveProgress() {
    saveStepData();

    // Collect all dynamic list data
    formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
    formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
    formData.debtsOwed = collectListData('debtOwed', debtOwedCount, ['Debtor', 'Amount', 'Instruction', 'Notes']);
    formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
    formData.bankAccounts = collectListData('bank', bankAccountCount, ['Name', 'Type', 'Balance']);
    formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
    formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
    formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
    formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value']);
    formData.specificGifts = collectListData('specificGift', specificGiftCount, ['BeneficiaryName', 'Relationship', 'GiftDescription']);
    formData.charities = collectListData('charity', charityCount, ['CharityName', 'AmountOrPercent', 'RegistrationNumber']);
    formData.beneficiaries = collectListData('beneficiary', beneficiaryCount, ['Name', 'Relationship', 'Percentage']);

    formData.currentStep = currentStep;

    // Save to localStorage
    localStorage.setItem('standardWillProgress', JSON.stringify(formData));
    alert('Progress saved! You can continue later.');
}

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('standardWillProgress');
    if (saved) {
        formData = JSON.parse(saved);
        // Restore would need more complex logic - simplified for now
    }
}

// ========================================
// Database functions
// ========================================

async function saveStandardWillToDatabase(status = 'draft') {
    if (!supabaseClient) {
        console.warn('Supabase not initialized, skipping database save');
        return null;
    }

    saveStepData();

    // Collect all data
    formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
    formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
    formData.debtsOwed = collectListData('debtOwed', debtOwedCount, ['Debtor', 'Amount', 'Instruction', 'Notes']);
    formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
    formData.bankAccounts = collectListData('bank', bankAccountCount, ['Name', 'Type', 'Balance']);
    formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
    formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
    formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
    formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value']);
    formData.specificGifts = collectListData('specificGift', specificGiftCount, ['BeneficiaryName', 'Relationship', 'GiftDescription']);
    formData.charities = collectListData('charity', charityCount, ['CharityName', 'AmountOrPercent', 'RegistrationNumber']);
    formData.beneficiaries = collectListData('beneficiary', beneficiaryCount, ['Name', 'Relationship', 'Percentage']);

    try {
        const willRecord = {
            // Testator Personal Info
            testator_name: formData.fullName || '',
            testator_email: formData.email || '',
            testator_phone: formData.phone || '',
            testator_address: formData.address || '',
            testator_dob: formData.dateOfBirth || null,
            testator_pob: formData.placeOfBirth || '',
            testator_gender: formData.testatorGender || '',
            testator_ni: formData.niNumber || '',
            testator_passport: formData.passportNumber || '',

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
            funeral_type: formData.funeralType || '',
            funeral_location: formData.funeralLocation || '',
            funeral_instructions: formData.funeralInstructions || '',
            funeral_budget: formData.funeralBudget ? parseFloat(formData.funeralBudget) : 0,

            // Family
            marital_status: formData.maritalStatus || '',
            spouse_name: formData.spouseName || '',
            marriage_date: formData.marriageDate || null,
            has_children: formData.hasChildren === 'yes',
            father_status: formData.fatherStatus || '',
            father_name: formData.fatherName || '',
            mother_status: formData.motherStatus || '',
            mother_name: formData.motherName || '',

            // Guardianship
            has_minor_children: formData.hasMinorChildren === 'yes',
            guardian1_name: formData.guardian1Name || '',
            guardian1_address: formData.guardian1Address || '',
            guardian1_relationship: formData.guardian1Relationship || '',
            guardian1_phone: formData.guardian1Phone || '',
            guardian2_name: formData.guardian2Name || '',
            guardian2_address: formData.guardian2Address || '',
            guardian2_relationship: formData.guardian2Relationship || '',
            upbringing_wishes: formData.upbringingWishes || '',

            // Additional
            organ_donation: formData.organDonation || 'defer',
            additional_wishes: formData.additionalWishes || '',

            // JSON data columns
            children_data: formData.children || [],
            debts_data: formData.debts || [],
            debts_owed_data: formData.debtsOwed || [],
            assets_data: {
                properties: formData.properties || [],
                bankAccounts: formData.bankAccounts || [],
                investments: formData.investments || [],
                businesses: formData.businesses || [],
                vehicles: formData.vehicles || [],
                valuables: formData.valuables || []
            },
            beneficiaries_data: {
                specificGifts: formData.specificGifts || [],
                charities: formData.charities || [],
                residuaryBeneficiaries: formData.beneficiaries || []
            },

            // Full backup
            will_data: formData,
            will_html: document.getElementById('willDocument') ? document.getElementById('willDocument').innerHTML : '',
            status: status
        };

        // Check if we're updating an existing will or creating new
        if (formData.willId) {
            const { data, error } = await supabaseClient
                .from('standard_wills')
                .update(willRecord)
                .eq('id', formData.willId)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await supabaseClient
            .from('standard_wills')
            .insert(willRecord)
            .select()
            .single();

        if (error) throw error;

        formData.willId = data.id;
        localStorage.setItem('standardWillProgress', JSON.stringify(formData));

        return data;
    } catch (error) {
        console.error('Error saving standard will:', error);
        throw error;
    }
}

// Load saved wills
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
                .from('standard_wills')
                .select('id, testator_name, testator_email, status, created_at, reference_number')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                wills = data.map(w => ({
                    id: w.id,
                    name: w.testator_name,
                    email: w.testator_email,
                    type: 'standard',
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
    const localWills = JSON.parse(localStorage.getItem('savedStandardWills') || '[]');
    localWills.forEach(w => {
        wills.push({
            id: w.localId,
            name: w.fullName,
            email: w.email,
            type: 'standard',
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
                <p>${w.email || 'No email'} - Standard Will - ${new Date(w.date).toLocaleDateString()}</p>
                <span class="status-badge ${w.status}">${w.status === 'completed' ? 'Completed' : 'Draft'}</span>
                <span style="font-size: 0.75rem; color: #94a3b8; margin-left: 0.5rem;">${w.source === 'local' ? '(Local)' : '(Database)'}</span>
            </div>
            <div class="saved-will-actions">
                <button class="btn btn-primary" data-action="open" data-index="${index}">
                    ${w.status === 'completed' ? 'Open' : 'Edit'}
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

// Variables for load options
let pendingLoadWill = null;

// Show load options modal
function showLoadOptions(id, source, name) {
    console.log('showLoadOptions called:', { id, source, name });
    pendingLoadWill = { id: String(id), source: source };
    document.getElementById('loadWillName').textContent = name;
    document.getElementById('savedWillsModal').style.display = 'none';
    document.getElementById('loadOptionsModal').style.display = 'flex';
    console.log('pendingLoadWill set to:', pendingLoadWill);
}

// Close modals
function closeSavedWillsModal() {
    document.getElementById('savedWillsModal').style.display = 'none';
}

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

    const willId = pendingLoadWill.id;
    const willSource = pendingLoadWill.source;

    try {
        closeLoadOptionsModal();

        await loadWillData(willId, willSource);

        // Go directly to step 10 and generate the will
        currentStep = 10;
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.querySelector('.step[data-step="10"]').classList.add('active');
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
                .from('standard_wills')
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
            if (data.debts_owed_data) formData.debtsOwed = data.debts_owed_data;
            if (data.assets_data) {
                formData.properties = data.assets_data.properties || [];
                formData.bankAccounts = data.assets_data.bankAccounts || [];
                formData.investments = data.assets_data.investments || [];
                formData.businesses = data.assets_data.businesses || [];
                formData.vehicles = data.assets_data.vehicles || [];
                formData.valuables = data.assets_data.valuables || [];
            }
            if (data.beneficiaries_data) {
                formData.specificGifts = data.beneficiaries_data.specificGifts || [];
                formData.charities = data.beneficiaries_data.charities || [];
                formData.beneficiaries = data.beneficiaries_data.residuaryBeneficiaries || [];
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
        const localWills = JSON.parse(localStorage.getItem('savedStandardWills') || '[]');
        console.log('Available local wills:', localWills.map(w => ({ localId: w.localId, name: w.fullName })));

        const will = localWills.find(w => String(w.localId) === String(id));
        if (will) {
            formData = { ...will };
            updateToolbar(formData.fullName);
            console.log('Loaded will from localStorage:', formData);
        } else {
            console.error('Will not found. Looking for id:', id);
            alert('Could not find saved will');
            throw new Error('Will not found');
        }
    }
}

// Populate form from loaded data
function populateFormFromData() {
    const fieldMappings = [
        'fullName', 'dateOfBirth', 'placeOfBirth', 'address',
        'niNumber', 'passportNumber', 'phone', 'email',
        'testatorGender', 'executor1Name', 'executor1Relationship', 'executor1Address',
        'executor1Phone', 'executor1Email', 'executor2Name', 'executor2Relationship',
        'executor2Address', 'executor2Phone', 'executor2Email',
        'funeralType', 'funeralLocation', 'funeralInstructions', 'funeralBudget',
        'maritalStatus', 'spouseName', 'marriageDate',
        'fatherName', 'motherName',
        'guardian1Name', 'guardian1Relationship', 'guardian1Address', 'guardian1Phone',
        'guardian2Name', 'guardian2Relationship', 'guardian2Address',
        'upbringingWishes', 'additionalWishes'
    ];

    fieldMappings.forEach(field => {
        const el = document.getElementById(field);
        if (el && formData[field]) {
            el.value = formData[field];
        }
    });

    // Handle radio buttons
    if (formData.hasChildren) {
        const radio = document.querySelector(`input[name="hasChildren"][value="${formData.hasChildren}"]`);
        if (radio) radio.checked = true;
    }
    if (formData.hasMinorChildren) {
        const radio = document.querySelector(`input[name="hasMinorChildren"][value="${formData.hasMinorChildren}"]`);
        if (radio) radio.checked = true;
    }
    if (formData.burialLocation) {
        const radio = document.querySelector(`input[name="burialLocation"][value="${formData.burialLocation}"]`);
        if (radio) radio.checked = true;
    }

    // Trigger change events to show/hide sections
    const maritalEl = document.getElementById('maritalStatus');
    if (maritalEl) maritalEl.dispatchEvent(new Event('change'));
    document.querySelectorAll('input[name="hasChildren"]').forEach(r => {
        if (r.checked) r.dispatchEvent(new Event('change'));
    });
    document.querySelectorAll('input[name="hasMinorChildren"]').forEach(r => {
        if (r.checked) r.dispatchEvent(new Event('change'));
    });
}

// Delete a will
async function deleteWill(id, source) {
    if (!confirm('Are you sure you want to delete this will?')) return;

    if (source === 'database' && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('standard_wills')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            alert('Error deleting: ' + e.message);
            return;
        }
    } else {
        let localWills = JSON.parse(localStorage.getItem('savedStandardWills') || '[]');
        localWills = localWills.filter(w => w.localId != id);
        localStorage.setItem('savedStandardWills', JSON.stringify(localWills));
    }

    // Refresh the list
    loadSavedWills();
}

// ========================================
// Reset form
// ========================================

function resetForm() {
    console.log('resetForm called');

    if (formData.fullName && !confirm('Are you sure you want to start a new will? Unsaved changes will be lost.')) {
        return;
    }

    // Clear form data
    formData = {};
    localStorage.removeItem('standardWillProgress');

    // Update toolbar
    updateToolbar('');

    // Reset counters
    childCount = 0;
    debtCount = 0;
    debtOwedCount = 0;
    propertyCount = 0;
    bankAccountCount = 0;
    investmentCount = 0;
    businessCount = 0;
    vehicleCount = 0;
    valuableCount = 0;
    specificGiftCount = 0;
    charityCount = 0;
    beneficiaryCount = 0;

    // Clear all dynamic lists
    document.querySelectorAll('#childrenList, #debtsList, #debtsOwedList, #propertiesList, #bankAccountsList, #investmentsList, #businessList, #vehiclesList, #valuablesList, #specificGiftsList, #charitiesList, #beneficiariesList').forEach(el => {
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

// Save and start new
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
        formData.debtsOwed = collectListData('debtOwed', debtOwedCount, ['Debtor', 'Amount', 'Instruction', 'Notes']);
        formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
        formData.bankAccounts = collectListData('bank', bankAccountCount, ['Name', 'Type', 'Balance']);
        formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
        formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
        formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
        formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value']);
        formData.specificGifts = collectListData('specificGift', specificGiftCount, ['BeneficiaryName', 'Relationship', 'GiftDescription']);
        formData.charities = collectListData('charity', charityCount, ['CharityName', 'AmountOrPercent', 'RegistrationNumber']);
        formData.beneficiaries = collectListData('beneficiary', beneficiaryCount, ['Name', 'Relationship', 'Percentage']);

        // Save to database if available
        if (supabaseClient) {
            try {
                await saveStandardWillToDatabase();
                alert(`Will for ${formData.fullName} saved successfully!`);
            } catch (error) {
                console.error('Error saving:', error);
                const savedWills = JSON.parse(localStorage.getItem('savedStandardWills') || '[]');
                formData.savedAt = new Date().toISOString();
                formData.localId = Date.now();
                savedWills.push(formData);
                localStorage.setItem('savedStandardWills', JSON.stringify(savedWills));
                alert(`Will saved locally for ${formData.fullName}`);
            }
        } else {
            const savedWills = JSON.parse(localStorage.getItem('savedStandardWills') || '[]');
            formData.savedAt = new Date().toISOString();
            formData.localId = Date.now();
            savedWills.push(formData);
            localStorage.setItem('savedStandardWills', JSON.stringify(savedWills));
            alert(`Will saved locally for ${formData.fullName}`);
        }
    }

    // Reset form
    resetForm();
}

// ========================================
// Review generation
// ========================================

function generateReview() {
    saveStepData();

    // Collect dynamic data for review
    formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
    formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
    formData.debtsOwed = collectListData('debtOwed', debtOwedCount, ['Debtor', 'Amount', 'Instruction', 'Notes']);
    formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
    formData.bankAccounts = collectListData('bank', bankAccountCount, ['Name', 'Type', 'Balance']);
    formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
    formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
    formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
    formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value']);
    formData.specificGifts = collectListData('specificGift', specificGiftCount, ['BeneficiaryName', 'Relationship', 'GiftDescription']);
    formData.charities = collectListData('charity', charityCount, ['CharityName', 'AmountOrPercent', 'RegistrationNumber']);
    formData.beneficiaries = collectListData('beneficiary', beneficiaryCount, ['Name', 'Relationship', 'Percentage']);

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
                <div class="review-item"><span class="review-label">Email:</span><span class="review-value">${formData.email || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Phone:</span><span class="review-value">${formData.phone || 'Not provided'}</span></div>
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
                <span class="review-section-title">Funeral Wishes</span>
                <button class="review-section-edit" onclick="goToStep(4)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Funeral Type:</span><span class="review-value">${formData.funeralType || 'Not specified'}</span></div>
                <div class="review-item"><span class="review-label">Instructions:</span><span class="review-value">${formData.funeralInstructions || 'None'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Family</span>
                <button class="review-section-edit" onclick="goToStep(5)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Marital Status:</span><span class="review-value">${formData.maritalStatus || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Spouse:</span><span class="review-value">${formData.spouseName || 'N/A'}</span></div>
                <div class="review-item"><span class="review-label">Has Children:</span><span class="review-value">${formData.hasChildren === 'yes' ? 'Yes' : 'No'}</span></div>
                ${formData.children && formData.children.length > 0 ? `
                <div class="review-item"><span class="review-label">Children:</span><span class="review-value">${formData.children.map(c => c.name).join(', ')}</span></div>
                ` : ''}
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Debts</span>
                <button class="review-section-edit" onclick="goToStep(6)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Debts I Owe:</span><span class="review-value">${formData.debts && formData.debts.length > 0 ? formData.debts.length + ' recorded' : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Debts Owed to Me:</span><span class="review-value">${formData.debtsOwed && formData.debtsOwed.length > 0 ? formData.debtsOwed.length + ' recorded' : 'None'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Assets</span>
                <button class="review-section-edit" onclick="goToStep(7)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Properties:</span><span class="review-value">${formData.properties && formData.properties.length > 0 ? formData.properties.length : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Bank Accounts:</span><span class="review-value">${formData.bankAccounts && formData.bankAccounts.length > 0 ? formData.bankAccounts.length : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Investments:</span><span class="review-value">${formData.investments && formData.investments.length > 0 ? formData.investments.length : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Businesses:</span><span class="review-value">${formData.businesses && formData.businesses.length > 0 ? formData.businesses.length : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Vehicles:</span><span class="review-value">${formData.vehicles && formData.vehicles.length > 0 ? formData.vehicles.length : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Valuables:</span><span class="review-value">${formData.valuables && formData.valuables.length > 0 ? formData.valuables.length : 'None'}</span></div>
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Beneficiaries</span>
                <button class="review-section-edit" onclick="goToStep(8)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Specific Gifts:</span><span class="review-value">${formData.specificGifts && formData.specificGifts.length > 0 ? formData.specificGifts.length + ' gifts' : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Charitable Bequests:</span><span class="review-value">${formData.charities && formData.charities.length > 0 ? formData.charities.length + ' charities' : 'None'}</span></div>
                <div class="review-item"><span class="review-label">Residuary Beneficiaries:</span><span class="review-value">${formData.beneficiaries && formData.beneficiaries.length > 0 ? formData.beneficiaries.map(b => b.name + ' (' + b.percentage + '%)').join(', ') : 'None'}</span></div>
            </div>
        </div>

        ${formData.hasMinorChildren === 'yes' ? `
        <div class="review-section">
            <div class="review-section-header">
                <span class="review-section-title">Guardianship</span>
                <button class="review-section-edit" onclick="goToStep(9)">Edit</button>
            </div>
            <div class="review-section-content">
                <div class="review-item"><span class="review-label">Primary Guardian:</span><span class="review-value">${formData.guardian1Name || 'Not provided'}</span></div>
                <div class="review-item"><span class="review-label">Secondary Guardian:</span><span class="review-value">${formData.guardian2Name || 'None'}</span></div>
            </div>
        </div>
        ` : ''}

        <div class="info-box info-warning">
            <strong>Important:</strong> Please review all information carefully before generating your Will.
            Once generated, have it reviewed by a qualified solicitor before signing.
        </div>
    `;
}

// ========================================
// Will document generation
// ========================================

async function generateWill() {
    saveStepData();

    // Collect all dynamic list data
    formData.children = collectListData('child', childCount, ['Name', 'Gender', 'DOB', 'Mother']);
    formData.debts = collectListData('debt', debtCount, ['Creditor', 'Type', 'Amount']);
    formData.debtsOwed = collectListData('debtOwed', debtOwedCount, ['Debtor', 'Amount', 'Instruction', 'Notes']);
    formData.properties = collectListData('property', propertyCount, ['Address', 'Country', 'Type', 'Ownership', 'Value']);
    formData.bankAccounts = collectListData('bank', bankAccountCount, ['Name', 'Type', 'Balance']);
    formData.investments = collectListData('investment', investmentCount, ['Type', 'Provider', 'Value']);
    formData.businesses = collectListData('business', businessCount, ['Name', 'Type', 'Ownership', 'Value']);
    formData.vehicles = collectListData('vehicle', vehicleCount, ['Make', 'Reg', 'Value']);
    formData.valuables = collectListData('valuable', valuableCount, ['Desc', 'Category', 'Value']);
    formData.specificGifts = collectListData('specificGift', specificGiftCount, ['BeneficiaryName', 'Relationship', 'GiftDescription']);
    formData.charities = collectListData('charity', charityCount, ['CharityName', 'AmountOrPercent', 'RegistrationNumber']);
    formData.beneficiaries = collectListData('beneficiary', beneficiaryCount, ['Name', 'Relationship', 'Percentage']);

    // Mark as completed
    formData.isCompleted = true;
    formData.completedAt = new Date().toISOString();

    console.log('Generating Standard Will...');
    console.log('Testator:', formData.fullName);
    console.log('Children Data:', formData.children);
    console.log('Beneficiaries:', formData.beneficiaries);

    // Save to database with completed status
    try {
        await saveStandardWillToDatabase('completed');
        console.log('Standard will saved to database as completed');
    } catch (error) {
        console.warn('Could not save to database:', error);
    }

    // Also save to localStorage
    const savedWills = JSON.parse(localStorage.getItem('savedStandardWills') || '[]');
    const existingIndex = savedWills.findIndex(w => w.localId === formData.localId);
    formData.savedAt = new Date().toISOString();
    if (!formData.localId) formData.localId = Date.now();

    if (existingIndex >= 0) {
        savedWills[existingIndex] = formData;
    } else {
        savedWills.push(formData);
    }
    localStorage.setItem('savedStandardWills', JSON.stringify(savedWills));

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const willDocument = document.getElementById('willDocument');
    willDocument.innerHTML = generateStandardWillHTML(today);
}

// Generate will from loaded data (without collecting from form)
function generateWillFromData() {
    console.log('Generating standard will from loaded data');

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const willDocument = document.getElementById('willDocument');
    willDocument.innerHTML = generateStandardWillHTML(today);
}

// Generate beneficiaries table HTML
function generateBeneficiariesTable() {
    const beneficiaries = formData.beneficiaries || [];

    if (beneficiaries.length === 0) {
        return '<p><em>No residuary beneficiaries specified.</em></p>';
    }

    let totalPercent = beneficiaries.reduce((sum, b) => sum + (parseFloat(b.percentage) || 0), 0);

    let html = `
        <table style="width: 100%; margin: 1rem 0; border-collapse: collapse;">
            <tr style="background: #1e3a5f; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Name</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Relationship</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #334155;">Percentage</th>
            </tr>
    `;

    beneficiaries.forEach((b, idx) => {
        const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        html += `
            <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${b.name || ''}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${b.relationship || ''}</td>
                <td style="padding: 10px; text-align: center; font-weight: 600; border: 1px solid #e2e8f0;">${b.percentage || 0}%</td>
            </tr>
        `;
    });

    html += `
            <tr style="background: #1e3a5f; color: white; font-weight: 600;">
                <td colspan="2" style="padding: 10px; text-align: right; border: 1px solid #334155;">TOTAL:</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #334155;">${totalPercent.toFixed(1)}%</td>
            </tr>
        </table>
    `;

    if (Math.abs(totalPercent - 100) > 0.1) {
        html += `<p style="color: #dc2626; font-size: 0.9rem;"><strong>Note:</strong> Total does not equal 100%. Please review the beneficiary allocations.</p>`;
    }

    return html;
}

// Main will HTML generation
function generateStandardWillHTML(today) {
    const refNumber = 'SW-' + Date.now().toString(36).toUpperCase();

    return `
        <div style="text-align: right; font-size: 0.8rem; color: #94a3b8; margin-bottom: 1rem;">
            Reference: ${refNumber}
        </div>

        <h1 style="text-align: center; font-size: 1.8rem; margin-bottom: 0.25rem;">LAST WILL AND TESTAMENT</h1>
        <p style="text-align: center; font-size: 1.2rem; margin-bottom: 2rem;">OF <strong>${(formData.fullName || '[FULL NAME]').toUpperCase()}</strong></p>

        <!-- Part 1: Declaration -->
        <h2>PART 1: DECLARATION</h2>
        <p>I, <strong>${formData.fullName || '____________________'}</strong>, of <strong>${formData.address || '____________________'}</strong>, born on <strong>${formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '____________________'}</strong>, hereby revoke all former Wills and Codicils made by me and declare this to be my Last Will and Testament.</p>
        <p>I confirm that I am over the age of 18 years and am of sound mind, memory, and understanding.</p>

        <!-- Part 2: Appointment of Executors -->
        <h2>PART 2: APPOINTMENT OF EXECUTORS</h2>
        <p>I appoint the following person(s) to be the Executor(s) and Trustee(s) of this my Will:</p>
        <p><strong>Primary Executor:</strong><br>
        Name: ${formData.executor1Name || '____________________'}<br>
        Relationship: ${formData.executor1Relationship || '____________________'}<br>
        Address: ${formData.executor1Address || '____________________'}</p>

        ${formData.executor2Name ? `
        <p><strong>Secondary Executor (if the Primary Executor is unable or unwilling to act):</strong><br>
        Name: ${formData.executor2Name}<br>
        Relationship: ${formData.executor2Relationship || '____________________'}<br>
        Address: ${formData.executor2Address || '____________________'}</p>
        ` : ''}

        <!-- Part 3: Funeral & Burial Wishes -->
        <h2>PART 3: FUNERAL AND BURIAL WISHES</h2>
        <p>I express the following wishes regarding my funeral arrangements (which I understand are not legally binding but which I ask my Executor(s) to take into account):</p>
        ${formData.funeralType ? `<p><strong>Funeral Type:</strong> ${formData.funeralType === 'burial' ? 'Burial' : formData.funeralType === 'cremation' ? 'Cremation' : formData.funeralType}</p>` : ''}
        ${formData.funeralLocation ? `<p><strong>Location:</strong> ${formData.funeralLocation}</p>` : ''}
        ${formData.funeralInstructions ? `<p><strong>Additional Instructions:</strong> ${formData.funeralInstructions}</p>` : ''}
        ${formData.funeralBudget ? `<p><strong>Funeral Budget:</strong> Up to £${Number(formData.funeralBudget).toLocaleString()}</p>` : ''}

        <!-- Part 4: Payment of Debts -->
        <h2>PART 4: PAYMENT OF DEBTS</h2>
        <p>I direct my Executor(s) to pay from my estate, as soon as practicable after my death:</p>
        <ol>
            <li>All my funeral and testamentary expenses;</li>
            <li>All my just debts; and</li>
            <li>Any taxes payable by reason of my death.</li>
        </ol>

        ${formData.debts && formData.debts.length > 0 ? `
        <h3>Schedule of Known Debts</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <tr style="background: #1e3a5f; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Creditor</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Type</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #334155;">Amount</th>
            </tr>
            ${formData.debts.map((d, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${d.creditor || ''}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${d.type || ''}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">${d.amount ? '£' + Number(d.amount).toLocaleString() : ''}</td>
            </tr>`).join('')}
        </table>
        ` : ''}

        ${formData.debtsOwed && formData.debtsOwed.length > 0 ? `
        <h3>Debts Owed TO Me - Executor Instructions</h3>
        <p>The following debts are owed to me. I instruct my Executor(s) to deal with each as specified below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <tr style="background: #1e3a5f; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Debtor</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #334155;">Amount</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Instruction</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Notes</th>
            </tr>
            ${formData.debtsOwed.map((d, idx) => {
                const instrLabel = d.instruction === 'forgive' ? 'Forgive this debt' :
                    d.instruction === 'negotiate' ? 'Negotiate a reduced settlement' :
                    d.instruction === 'transfer' ? 'Transfer to a named beneficiary' :
                    'Collect this debt for the estate';
                return `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${d.debtor || ''}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">${d.amount ? '£' + Number(d.amount).toLocaleString() : ''}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${instrLabel}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${d.notes || ''}</td>
            </tr>`;
            }).join('')}
        </table>
        <p><em>Any collected debts shall form part of the estate and be distributed in accordance with this Will.</em></p>
        ` : ''}

        <!-- Part 5: Specific Gifts -->
        <h2>PART 5: SPECIFIC GIFTS</h2>
        ${formData.specificGifts && formData.specificGifts.length > 0 ? `
        <p>I give the following specific gifts:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <tr style="background: #1e3a5f; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Beneficiary</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Relationship</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Gift Description</th>
            </tr>
            ${formData.specificGifts.map((g, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${g.beneficiaryname || ''}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${g.relationship || ''}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${g.giftdescription || ''}</td>
            </tr>`).join('')}
        </table>
        <p>If any specific beneficiary named above does not survive me by 28 days, the gift to that person shall fall into the residuary estate.</p>
        ` : `
        <p>I make no specific gifts under this Will.</p>
        `}

        <!-- Part 6: Charitable Bequests -->
        <h2>PART 6: CHARITABLE BEQUESTS</h2>
        ${formData.charities && formData.charities.length > 0 ? `
        <p>I give the following charitable bequests:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <tr style="background: #1e3a5f; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Charity Name</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Amount / Percentage</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #334155;">Registration No.</th>
            </tr>
            ${formData.charities.map((c, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${c.charityname || ''}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${c.amountorpercent || ''}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${c.registrationnumber || ''}</td>
            </tr>`).join('')}
        </table>
        <p>The receipt of the treasurer or other proper officer of any charitable organisation shall be a sufficient discharge to my Executor(s).</p>
        ` : `
        <p>I make no charitable bequests under this Will.</p>
        `}

        <!-- Part 7: Residuary Estate -->
        <h2>PART 7: RESIDUARY ESTATE</h2>
        <p>Subject to the payment of my debts, funeral and testamentary expenses, and the above gifts, I give the residue of my estate (both real and personal) to the following beneficiaries in the shares specified:</p>
        ${generateBeneficiariesTable()}
        <p>If any residuary beneficiary named above does not survive me by 28 days, their share shall be divided equally among the remaining residuary beneficiaries, unless I have specified otherwise.</p>

        <!-- Part 8: Guardianship -->
        ${formData.hasMinorChildren === 'yes' ? `
        <h2>PART 8: GUARDIANSHIP OF MINOR CHILDREN</h2>
        <p>If at the date of my death I have children who are under the age of 18, I appoint the following person(s) to be their Guardian(s):</p>
        <p><strong>Primary Guardian:</strong><br>
        Name: ${formData.guardian1Name || '____________________'}<br>
        Relationship: ${formData.guardian1Relationship || '____________________'}<br>
        Address: ${formData.guardian1Address || '____________________'}</p>
        ${formData.guardian2Name ? `
        <p><strong>Secondary Guardian (if the Primary Guardian is unable or unwilling to act):</strong><br>
        Name: ${formData.guardian2Name}<br>
        Relationship: ${formData.guardian2Relationship || '____________________'}<br>
        Address: ${formData.guardian2Address || '____________________'}</p>
        ` : ''}
        ${formData.upbringingWishes ? `
        <p><strong>Wishes Regarding Upbringing:</strong> ${formData.upbringingWishes}</p>
        ` : ''}
        ` : ''}

        <!-- Part 9: Administrative Powers -->
        <h2>PART ${formData.hasMinorChildren === 'yes' ? '9' : '8'}: ADMINISTRATIVE POWERS</h2>
        <p>In addition to all powers conferred by law, I give my Executor(s) and Trustee(s) the following powers to be exercised at their absolute discretion:</p>
        <ol>
            <li><strong>Power of Investment:</strong> My Executor(s) may invest, vary, and transpose the investments of my estate in any manner as if they were the beneficial owner(s) thereof, and shall not be limited to investments authorised by law for the investment of trust funds.</li>
            <li><strong>Power of Sale:</strong> My Executor(s) may sell, mortgage, charge, or otherwise dispose of all or any part of my estate upon such terms as they think fit.</li>
            <li><strong>Power to Manage Property:</strong> My Executor(s) may manage, improve, develop, or otherwise deal with any property forming part of my estate as they see fit.</li>
            <li><strong>Power to Carry On Business:</strong> My Executor(s) may carry on, or concur in carrying on, any business in which I was engaged at the time of my death for such period as they think fit.</li>
            <li><strong>Power to Appropriate:</strong> My Executor(s) may appropriate any asset to satisfy any share or interest in my estate without requiring the consent of any person.</li>
            <li><strong>Power to Borrow:</strong> My Executor(s) may borrow money on the security of any part of my estate for the purposes of the administration of my estate or any trust arising under this Will.</li>
            <li><strong>Power to Insure:</strong> My Executor(s) may insure any property in my estate against any risk and for any amount.</li>
            <li><strong>Professional Charging:</strong> Any Executor or Trustee who is engaged in a profession or business may charge and be paid for work done by them or their firm on the same basis as if they were not an Executor or Trustee.</li>
        </ol>

        <!-- Part 10: Signature & Attestation -->
        <div class="will-signature-section">
            <h2>PART ${formData.hasMinorChildren === 'yes' ? '10' : '9'}: SIGNATURE AND ATTESTATION</h2>

            <div class="will-signature-block">
                <h4>TESTATOR</h4>
                <p>IN WITNESS WHEREOF I have hereunto set my hand this ______ day of __________________ 20______</p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature of Testator</p>
                <p><strong>Full Name:</strong> ${formData.fullName || '____________________'}</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <div class="will-signature-block">
                <h4>WITNESS 1</h4>
                <p><em>This Will must be signed in the presence of two witnesses, both present at the same time, who are not beneficiaries (or married to/civil partners of beneficiaries) under this Will.</em></p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature of Witness 1</p>
                <p><strong>Full Name:</strong> ____________________</p>
                <p><strong>Address:</strong> ____________________</p>
                <p><strong>Occupation:</strong> ____________________</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <div class="will-signature-block">
                <h4>WITNESS 2</h4>
                <div class="signature-line"></div>
                <p class="signature-label">Signature of Witness 2</p>
                <p><strong>Full Name:</strong> ____________________</p>
                <p><strong>Address:</strong> ____________________</p>
                <p><strong>Occupation:</strong> ____________________</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <!-- Solicitor Certification -->
            <div class="certification-block">
                <h4>SOLICITOR CERTIFICATION (Optional)</h4>
                <p>I certify that:</p>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert1"> <label for="cert1">The Testator appeared to be of sound mind, memory, and understanding</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert2"> <label for="cert2">The Will was read over and explained to the Testator who appeared to understand and approve of its contents</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert3"> <label for="cert3">The Will complies with the requirements of the Wills Act 1837 (as amended)</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert4"> <label for="cert4">Proper witnessing procedures were followed in accordance with Section 9 of the Wills Act 1837</label>
                </div>
                <div class="form-grid" style="margin-top: 1rem;">
                    <div>
                        <p><strong>Solicitor Name:</strong> ____________________</p>
                        <p><strong>Firm:</strong> ____________________</p>
                        <p><strong>SRA Number:</strong> ____________________</p>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <p class="signature-label">Signature</p>
                        <p><strong>Date:</strong> ____________________</p>
                    </div>
                </div>
                <div class="stamp-area">Firm Stamp</div>
            </div>
        </div>

        <hr style="margin: 2rem 0;">
        <p style="text-align: center; font-size: 0.875rem; color: #6b7280;">
            This Will was generated on ${today} using the Standard Will Generator.<br>
            Please have this document reviewed by a qualified solicitor before signing.
        </p>
    `;
}

// ========================================
// Print and Download
// ========================================

function printWill() {
    window.print();
}

function downloadPDF() {
    alert('For best results, use the Print function and select "Save as PDF" as your printer.\n\nA proper PDF generation feature requires additional libraries.');
    window.print();
}
