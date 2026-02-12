// ========================================
// Islamic Will Generator - JavaScript
// ========================================

// Supabase Configuration
const SUPABASE_URL = 'https://gyvzfylmvocrriwoemhf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dnpmeWxtdm9jcnJpd29lbWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjAyOTEsImV4cCI6MjA4NjQ5NjI5MX0.H6E2iAWkqi82szU52_jtbBSyzPKTlAt5jqgRsYt9Kfk';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    initProgressSteps();
    updateProgress();
    setupEventListeners();
    loadProgress();
});

// Initialize progress steps
function initProgressSteps() {
    const stepsContainer = document.getElementById('progressSteps');
    const stepLabels = [
        'Welcome', 'Personal', 'Executors', 'Funeral', 'Family',
        'Debts', 'Assets', 'Wasiyyah', 'Guardian', 'Special', 'Review', 'Complete'
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

    // Check required fields
    const requiredFields = currentStepEl.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc2626';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });

    // Step-specific validation
    if (step === 1) {
        const shahadaCheck = document.getElementById('shahadaConfirm');
        if (!shahadaCheck.checked) {
            alert('Please confirm the Declaration of Faith (Shahada) to proceed.');
            isValid = false;
        }
    }

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
async function saveWillToDatabase() {
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
            testator_name: formData.fullName || '',
            testator_email: formData.email || '',
            testator_phone: formData.phone || '',
            testator_address: formData.address || '',
            testator_dob: formData.dateOfBirth || null,
            will_type: formData.willType || 'simple',
            marital_status: formData.maritalStatus || '',
            spouse_name: formData.spouseName || '',
            mahr_status: formData.mahrStatus || '',
            mahr_amount: formData.mahrAmount ? parseFloat(formData.mahrAmount) : 0,
            has_children: formData.hasChildren === 'yes',
            executor1_name: formData.executor1Name || '',
            executor1_address: formData.executor1Address || '',
            executor1_relationship: formData.executor1Relationship || '',
            executor2_name: formData.executor2Name || '',
            burial_location: formData.burialLocation || 'uk',
            repatriation_country: formData.repatriationCountry || '',
            preferred_cemetery: formData.preferredCemetery || '',
            organ_donation: formData.organDonation || 'defer',
            make_wasiyyah: formData.makeWasiyyah === 'yes',
            guardian_name: formData.guardian1Name || '',
            will_data: formData, // Store full form data as JSON
            status: 'draft',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
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
                <button class="review-section-edit" onclick="goToStep(5)">Edit</button>
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
                <button class="review-section-edit" onclick="goToStep(8)">Edit</button>
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

    // Save to database
    try {
        await saveWillToDatabase();
        console.log('Will saved to database');
    } catch (error) {
        console.warn('Could not save to database:', error);
    }

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const willType = formData.willType || 'simple';

    const willDocument = document.getElementById('willDocument');
    willDocument.innerHTML = `
        <h1>ISLAMIC WILL (WASIYYAH)</h1>
        <p class="will-arabic">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
        <p style="text-align: center; margin-bottom: 2rem;">In the Name of Allah, the Most Gracious, the Most Merciful</p>

        <h2>DECLARATION OF FAITH</h2>
        <p>I, <strong>${formData.fullName || '[FULL NAME]'}</strong>, of <strong>${formData.address || '[ADDRESS]'}</strong>,
        being of sound mind and understanding, declare that I bear witness that there is no god but Allah,
        and that Muhammad (peace be upon him) is His final Messenger.</p>
        <p>I make this Will in accordance with Islamic Law (Shariah) and the laws of England and Wales.</p>

        <h2>PART 1: REVOCATION</h2>
        <p>I hereby revoke all former Wills and Codicils made by me and declare this to be my Last Will and Testament.</p>

        <h2>PART 2: APPOINTMENT OF EXECUTORS</h2>
        <p>I appoint the following person(s) to be the Executor(s) of this Will:</p>
        <p><strong>Primary Executor:</strong><br>
        Name: ${formData.executor1Name || '____________________'}<br>
        Address: ${formData.executor1Address || '____________________'}<br>
        Relationship: ${formData.executor1Relationship || '____________________'}</p>

        ${formData.executor2Name ? `
        <p><strong>Secondary Executor (if primary unable to act):</strong><br>
        Name: ${formData.executor2Name}<br>
        Address: ${formData.executor2Address || '____________________'}<br>
        Relationship: ${formData.executor2Relationship || '____________________'}</p>
        ` : ''}

        <h2>PART 3: FUNERAL ARRANGEMENTS</h2>
        <p>I direct that upon my death:</p>
        <ol>
            <li>My body shall be washed (Ghusl) and shrouded (Kafan) according to Islamic rites</li>
            <li>The Janazah (funeral) prayer shall be performed</li>
            <li>I shall be buried (not cremated) in a Muslim cemetery or Muslim section of a cemetery, facing the Qiblah</li>
            <li>My burial shall take place as soon as reasonably possible after my death</li>
            <li>My funeral shall be conducted simply, without extravagance, in accordance with the Sunnah</li>
        </ol>
        ${formData.burialLocation === 'repatriate' ? `<p><strong>Repatriation:</strong> I wish to be buried in ${formData.repatriationCountry || 'my home country'}. If repatriation is not possible within 3 days, I should be buried in the UK.</p>` : ''}
        ${formData.preferredCemetery ? `<p><strong>Preferred Cemetery:</strong> ${formData.preferredCemetery}</p>` : ''}
        ${formData.preferredMosque ? `<p><strong>Preferred Mosque for Janazah:</strong> ${formData.preferredMosque}</p>` : ''}

        <h2>PART 4: PAYMENT OF DEBTS AND EXPENSES</h2>
        <p>I direct my Executor(s) to pay from my estate in the following order of priority:</p>
        <ol>
            <li>My funeral and burial expenses</li>
            <li>All my lawful debts</li>
            ${formData.mahrStatus === 'outstanding' ? `<li><strong>Outstanding Mahr (Dowry) to my wife:</strong> £${formData.mahrAmount || '____'}</li>` : ''}
            ${formData.unpaidZakat ? `<li><strong>Unpaid Zakat:</strong> £${formData.unpaidZakat}</li>` : ''}
            ${formData.fidyahDays ? `<li><strong>Fidyah for missed fasts:</strong> ${formData.fidyahDays} days</li>` : ''}
            ${formData.kaffarah ? `<li><strong>Kaffarah:</strong> £${formData.kaffarah}</li>` : ''}
            ${formData.hajjStatus === 'obligatory-not-performed' && formData.arrangeHajjBadal ? '<li>Arrange Hajj Badal (proxy Hajj) from my estate</li>' : ''}
        </ol>

        <h2>PART 5: ISLAMIC BEQUEST (WASIYYAH)</h2>
        ${formData.makeWasiyyah === 'yes' ? `
        <p>In accordance with Islamic Law, I bequeath up to <strong>ONE-THIRD (1/3)</strong> of my net estate (after payment of debts and expenses) as follows:</p>
        <p><em>Note: This bequest cannot be made to those who are already entitled to inherit under Islamic Law (Faraid)</em></p>
        <table>
            <tr><th>Beneficiary</th><th>Percentage</th><th>Purpose</th></tr>
            <tr><td colspan="3"><em>Charitable bequests and non-heir bequests as recorded</em></td></tr>
        </table>
        ` : `
        <p>I do not wish to make any Wasiyyah. My entire estate shall be distributed according to the Islamic Law of Inheritance (Faraid).</p>
        `}

        <h2>PART 6: ISLAMIC INHERITANCE (FARAID)</h2>
        <p>I direct that the remainder of my estate shall be distributed according to the Islamic Law of Inheritance (Faraid) as prescribed in the Holy Quran and Sunnah.</p>

        <h3>My Heirs:</h3>
        <table>
            <tr><th>Heir</th><th>Name</th><th>Share</th></tr>
            ${formData.maritalStatus === 'married' ? `<tr><td>Spouse</td><td>${formData.spouseName || '____'}</td><td>As per Faraid</td></tr>` : ''}
            ${formData.fatherStatus === 'living' ? `<tr><td>Father</td><td>${formData.fatherName || '____'}</td><td>As per Faraid</td></tr>` : ''}
            ${formData.motherStatus === 'living' ? `<tr><td>Mother</td><td>${formData.motherName || '____'}</td><td>As per Faraid</td></tr>` : ''}
            <tr><td colspan="3"><em>Children as recorded</em></td></tr>
        </table>

        <p>I request that my Executor(s) consult with a qualified Islamic scholar for the correct calculation of Faraid shares.</p>

        ${formData.hasMinorChildren === 'yes' ? `
        <h2>PART 7: GUARDIANSHIP OF MINOR CHILDREN</h2>
        <p>If I have minor children at the time of my death, I appoint:</p>
        <p><strong>Primary Guardian:</strong> ${formData.guardian1Name || '____________________'}<br>
        Address: ${formData.guardian1Address || '____________________'}<br>
        Relationship: ${formData.guardian1Relationship || '____________________'}</p>
        ${formData.guardian2Name ? `<p><strong>Secondary Guardian:</strong> ${formData.guardian2Name}</p>` : ''}
        <p>I request that my children be raised according to Islamic principles and teachings.</p>
        ` : ''}

        <h2>PART 8: ORGAN DONATION</h2>
        <p>${formData.organDonation === 'consent' ? 'I consent to organ donation to save lives.' :
             formData.organDonation === 'refuse' ? 'I do not consent to organ donation.' :
             'I defer the decision on organ donation to my family and an Islamic scholar at the time.'}</p>

        <h2>PART 9: DECLARATION</h2>
        <p>I declare that:</p>
        <ol>
            <li>I am over 18 years of age</li>
            <li>I am of sound mind</li>
            <li>I make this Will freely and voluntarily</li>
            <li>I understand that the Islamic shares are fixed by Allah and cannot be altered</li>
            <li>I have not made any bequest to an heir from the one-third Wasiyyah portion</li>
            <li>The total Wasiyyah does not exceed one-third of my estate</li>
        </ol>

        <!-- Signatures Section -->
        <div class="will-signature-section">
            <h2>SIGNATURES</h2>

            <div class="will-signature-block">
                <h4>TESTATOR</h4>
                <div class="signature-line"></div>
                <p class="signature-label">Signature of Testator</p>
                <p><strong>Full Name:</strong> ${formData.fullName || '____________________'}</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <div class="will-signature-block">
                <h4>WITNESS 1</h4>
                <p><em>This Will must be signed in the presence of two witnesses who are not beneficiaries</em></p>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Full Name:</strong> ____________________</p>
                <p><strong>Address:</strong> ____________________</p>
                <p><strong>Occupation:</strong> ____________________</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <div class="will-signature-block">
                <h4>WITNESS 2</h4>
                <div class="signature-line"></div>
                <p class="signature-label">Signature</p>
                <p><strong>Full Name:</strong> ____________________</p>
                <p><strong>Address:</strong> ____________________</p>
                <p><strong>Occupation:</strong> ____________________</p>
                <p><strong>Date:</strong> ____________________</p>
            </div>

            <!-- Solicitor Certification -->
            <div class="certification-block">
                <h4>⚖️ SOLICITOR CERTIFICATION</h4>
                <p>I certify that:</p>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert1"> <label for="cert1">The Testator appeared of sound mind</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert2"> <label for="cert2">The Will was explained to the Testator</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert3"> <label for="cert3">The Will complies with UK law</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="cert4"> <label for="cert4">Proper witnessing procedures were followed</label>
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

            <!-- Mufti/Imam Certification -->
            <div class="certification-block mufti">
                <h4>🕌 ISLAMIC CERTIFICATION (MUFTI/IMAM)</h4>
                <p>I certify that I have reviewed this Will and confirm that:</p>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic1"> <label for="islamic1">The Wasiyyah does not exceed one-third (1/3)</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic2"> <label for="islamic2">No bequests are made to Quranic heirs from the Wasiyyah</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic3"> <label for="islamic3">The Faraid distribution follows Islamic law</label>
                </div>
                <div class="certification-checkbox">
                    <input type="checkbox" id="islamic4"> <label for="islamic4">The funeral wishes comply with Shariah</label>
                </div>
                <div class="form-grid" style="margin-top: 1rem;">
                    <div>
                        <p><strong>Mufti/Imam Name:</strong> ____________________</p>
                        <p><strong>Mosque/Institution:</strong> ____________________</p>
                        <p><strong>Contact:</strong> ____________________</p>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <p class="signature-label">Signature</p>
                        <p><strong>Date:</strong> ____________________</p>
                    </div>
                </div>
                <div class="stamp-area">Mosque/Institution Stamp</div>
            </div>
        </div>

        <hr style="margin: 2rem 0;">
        <p style="text-align: center; font-size: 0.875rem; color: #6b7280;">
            This Will was generated on ${today} using the Islamic Will Generator.<br>
            Please have this document reviewed by a qualified solicitor and Islamic scholar before signing.
        </p>
    `;
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
