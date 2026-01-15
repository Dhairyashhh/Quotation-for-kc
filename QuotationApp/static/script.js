// Global State
let companies = [];
let products = [];
let cart = [];
let selectedProducts = new Set();
let selectedDiscountProducts = new Set();
let selectedBillingProducts = new Set(); // NEW: Billing tab selections
let currentCompanyId = null;
let currentDiscountCompanyId = null;
let currentBillingCompanyId = null; // NEW: Track billing company
let billingProducts = []; // NEW: Products for billing dropdown

// Initialize
window.addEventListener('load', () => {
    loadCompanies();
    loadProductsForCompany(); // Load all products to populate subcategory dropdown
    updateBillSummary();
});

// ============ TAB NAVIGATION ============
function switchTab(tabName, element) {
    document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    if (element) element.classList.add('active');
}

function switchProductTab(tabName, element) {
    document.querySelectorAll('.product-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    if (element) element.classList.add('active');
}

// ============ COMPANIES ============
async function loadCompanies() {
    try {
        const response = await fetch('/api/companies');
        companies = await response.json();
        displayCompanies();
        populateAllCompanySelects();
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function displayCompanies() {
    const list = document.getElementById('companiesList');
    
    if (companies.length === 0) {
        list.innerHTML = '<div class="empty-state">No companies yet</div>';
        return;
    }

    list.innerHTML = companies.map(company => `
        <div class="company-card">
            <div class="company-name">${company.name}</div>
            <div class="company-actions">
                <button class="btn btn-secondary" onclick="editCompanySubcategories(${company.id})">Manage</button>
                <button class="btn btn-danger" onclick="deleteCompanyConfirm(${company.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function addCompany() {
    const name = document.getElementById('newCompanyInput').value.trim();
    
    if (!name) {
        alert('Enter company name');
        return;
    }

    try {
        const response = await fetch('/api/add-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            document.getElementById('newCompanyInput').value = '';
            await loadCompanies();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteCompanyConfirm(companyId) {
    const company = companies.find(c => c.id === companyId);
    
    if (!confirm(`Delete "${company.name}" and all its products?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/delete-company/${companyId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadCompanies();
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ SUBCATEGORIES ============
function editCompanySubcategories(companyId) {
    currentCompanyId = companyId;
    document.getElementById('subcompanySelect').value = companyId;
    loadSubcategoriesForCompany();
    switchTab('subcategories-tab');
}

async function loadSubcategoriesForCompany() {
    const companyId = parseInt(document.getElementById('subcompanySelect').value);
    
    if (!companyId) {
        document.getElementById('subcategoriesContent').style.display = 'none';
        document.getElementById('selectCompanyMsg').style.display = 'block';
        return;
    }

    currentCompanyId = companyId;
    document.getElementById('subcategoriesContent').style.display = 'block';
    document.getElementById('selectCompanyMsg').style.display = 'none';

    const company = companies.find(c => c.id === companyId);
    const list = document.getElementById('subcategoriesList');

    if (!company || company.subcategories.length === 0) {
        list.innerHTML = '<div class="empty-state">No subcategories yet</div>';
    } else {
        list.innerHTML = company.subcategories.map(sub => `
            <div class="subcategory-card">
                <span>${sub}</span>
                <button class="btn btn-danger" onclick="deleteSubcategoryConfirm(${companyId}, '${sub.replace(/'/g, "\\'")}')">Delete</button>
            </div>
        `).join('');
    }
}

async function addSubcategory() {
    if (!currentCompanyId) {
        alert('Select company first');
        return;
    }

    const subcategory = document.getElementById('newSubcategoryInput').value.trim();
    
    if (!subcategory) {
        alert('Enter subcategory name');
        return;
    }

    try {
        const response = await fetch(`/api/add-subcategory/${currentCompanyId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subcategory })
        });

        if (response.ok) {
            document.getElementById('newSubcategoryInput').value = '';
            await loadCompanies();
            await loadSubcategoriesForCompany();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteSubcategoryConfirm(companyId, subcategory) {
    if (!confirm(`Delete "${subcategory}"?`)) return;

    try {
        const response = await fetch(`/api/delete-subcategory/${companyId}/${encodeURIComponent(subcategory)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadCompanies();
            await loadSubcategoriesForCompany();
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ PRODUCTS ============
let allProductsFromAPI = []; // Store all products from API without filters

// PRODUCTS TAB - Load and populate subcategories
async function loadProductsForCompany() {
    const companySelect = document.getElementById('productcompanySelect');
    if (!companySelect) return;
    
    const companyId = parseInt(companySelect.value) || null;
    
    try {
        let url = '/api/products';
        if (companyId) {
            url += `?company_id=${companyId}`;
        }
        
        console.log('=== LOADING PRODUCTS ===');
        console.log('Company ID:', companyId);
        console.log('URL:', url);
        
        const response = await fetch(url);
        allProductsFromAPI = await response.json();
        
        console.log('Products received:', allProductsFromAPI.length);
        console.log('Full products data:', JSON.stringify(allProductsFromAPI, null, 2));
        
        selectedProducts.clear();
        
        // Reset and populate subcategory dropdown
        const subSelect = document.getElementById('productSubcategorySelect');
        if (subSelect) {
            console.log('Found productSubcategorySelect element');
            subSelect.value = '';
            updateProductSubcategoryDropdown();
        } else {
            console.error('productSubcategorySelect element NOT found');
        }
        
        applyProductFilters();
    } catch (error) {
        console.error('Error loading products:', error);
        allProductsFromAPI = [];
        applyProductFilters();
    }
}

function updateProductSubcategoryDropdown() {
    const select = document.getElementById('productSubcategorySelect');
    if (!select) {
        console.error('ERROR: productSubcategorySelect not found');
        return;
    }
    
    console.log('=== UPDATING PRODUCT SUBCATEGORY DROPDOWN ===');
    console.log('Total products to check:', allProductsFromAPI.length);
    
    // Log each product
    allProductsFromAPI.forEach((p, index) => {
        console.log(`Product ${index}:`, p.name, 'Subcategory:', p.subcategory);
    });
    
    // Extract subcategories - include empty string handler
    const subcategoriesSet = new Set();
    allProductsFromAPI.forEach(product => {
        if (product && product.subcategory) {
            const sub = String(product.subcategory).trim();
            if (sub && sub.length > 0) {
                subcategoriesSet.add(sub);
            }
        }
    });
    
    const subcategoriesArray = Array.from(subcategoriesSet).sort();
    
    // Clear dropdown completely
    select.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- All Subcategories --';
    select.appendChild(defaultOption);
    
    // Add subcategories
    subcategoriesArray.forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory;
        option.textContent = subcategory;
        select.appendChild(option);
    });
    
    // If no subcategories found, add info message
    if (subcategoriesArray.length === 0) {
        const infoOption = document.createElement('option');
        infoOption.value = '';
        infoOption.textContent = '(No subcategories assigned)';
        infoOption.disabled = true;
        select.appendChild(infoOption);
    }
}

function applyProductFilters() {
    const subSelect = document.getElementById('productSubcategorySelect');
    const subcategoryFilter = subSelect ? subSelect.value : '';
    
    if (subcategoryFilter && subcategoryFilter.trim() !== '') {
        products = allProductsFromAPI.filter(p => p.subcategory === subcategoryFilter);
    } else {
        products = [...allProductsFromAPI];
    }
    
    updateProductCheckboxes();
    displayProducts(products);
}

function filterProducts() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    const subSelect = document.getElementById('productSubcategorySelect');
    const subcategoryFilter = subSelect ? subSelect.value : '';
    
    // Start with all products from API
    let filtered = [...allProductsFromAPI];
    
    // Apply subcategory filter first
    if (subcategoryFilter && subcategoryFilter.trim() !== '') {
        filtered = filtered.filter(p => p.subcategory === subcategoryFilter);
    }
    
    // Then apply search filter
    if (filter) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(filter)
        );
    }
    
    displayProducts(filtered);
    updateProductCheckboxes();
}

function displayProducts(productsToShow = products) {
    const list = document.getElementById('productsList');
    
    if (productsToShow.length === 0) {
        list.innerHTML = '<div class="empty-state">No products</div>';
        return;
    }

    list.innerHTML = productsToShow.map(product => {
        const finalPrice = product.price * (1 - (product.discount || 0) / 100);
        return `
        <div class="product-item">
            <input type="checkbox" class="product-checkbox" data-id="${product.id}" onchange="toggleSelection(${product.id})">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    ${product.discount ? `<span style="text-decoration: line-through;">₹${product.price.toFixed(2)}</span> ` : ''}
                    <strong>₹${finalPrice.toFixed(2)}</strong>
                </div>
                ${product.subcategory ? `<div class="product-subcategory">📂 ${product.subcategory}</div>` : ''}
            </div>
            <button class="btn btn-primary" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price}, ${product.discount || 0})">Add</button>
        </div>
    `; }).join('');
}

function toggleSelection(id) {
    selectedProducts.has(id) ? selectedProducts.delete(id) : selectedProducts.add(id);
}

function selectAllProducts() {
    products.forEach(p => selectedProducts.add(p.id));
    updateProductCheckboxes();
}

function deselectAllProducts() {
    selectedProducts.clear();
    updateProductCheckboxes();
}

function updateProductCheckboxes() {
    document.querySelectorAll('.product-checkbox').forEach(cb => {
        cb.checked = selectedProducts.has(parseInt(cb.dataset.id));
    });
}

async function addSelectedToCart() {
    if (selectedProducts.size === 0) {
        alert('Select products to add to cart');
        return;
    }

    let addedCount = 0;
    selectedProducts.forEach(productId => {
        const product = products.find(p => p.id === productId);
        if (product) {
            addToCart(product.id, product.name, product.price, product.discount || 0);
            addedCount++;
        }
    });

    alert(`✅ Added ${addedCount} product(s) to cart`);
    selectedProducts.clear();
    updateProductCheckboxes();
}

async function deleteSelectedProducts() {
    if (selectedProducts.size === 0) {
        alert('Select products to delete');
        return;
    }

    if (!confirm(`Delete ${selectedProducts.size} product(s)?`)) return;

    try {
        for (const id of selectedProducts) {
            await fetch(`/api/delete-product/${id}`, { method: 'DELETE' });
        }
        selectedProducts.clear();
        await loadProductsForCompany();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ PRODUCT PARSING ============
function parseProducts(text, separator) {
    const products = [];
    const lines = text.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Primary method: Look for ₹ symbol and extract price backwards
        if (separator === '₹') {
            const rupeeIndex = line.lastIndexOf('₹');
            if (rupeeIndex !== -1) {
                const priceStr = line.substring(rupeeIndex + 1).trim();
                const priceMatch = priceStr.match(/[\d,]+\.?\d*/);
                if (priceMatch) {
                    const price = parseFloat(priceMatch[0].replace(/,/g, ''));
                    let name = line.substring(0, rupeeIndex).trim();
                    name = name.replace(/[\s\-—–:|→=]*$/, '');
                    
                    if (name.length > 0 && !isNaN(price) && price > 0) {
                        products.push({ name, price });
                        continue;
                    }
                }
            }
        }
        
        // Separator-based parsing
        const separators = [separator, '—', '–', '|', '-', ':', '→', '='];
        let found = false;
        
        for (let sep of separators) {
            if (sep && line.includes(sep)) {
                const parts = line.split(sep);
                if (parts.length >= 2) {
                    let name = parts[0].trim();
                    const priceStr = parts[parts.length - 1].trim();
                    const priceMatch = priceStr.match(/[\d,]+\.?\d*/);
                    if (priceMatch && name.length > 0) {
                        const price = parseFloat(priceMatch[0].replace(/,/g, ''));
                        if (!isNaN(price) && price > 0) {
                            products.push({ name, price });
                            found = true;
                            break;
                        }
                    }
                }
            }
        }
    }
    
    return products;
}

async function parsePastedData() {
    const companyId = parseInt(document.getElementById('pastecompanySelect').value);
    
    if (!companyId) {
        showParseStatus('❌ Select company first', 'error');
        return;
    }

    const text = document.getElementById('pasteArea').value.trim();
    if (!text) {
        showParseStatus('❌ Paste data first', 'error');
        return;
    }

    const separator = document.getElementById('separatorSelect').value;
    const parsedProducts = parseProducts(text, separator);
    
    if (parsedProducts.length === 0) {
        showParseStatus('❌ No products found', 'error');
        return;
    }

    try {
        let added = 0;
        const subcategory = document.getElementById('pasteSubcategorySelect').value || '';

        for (let product of parsedProducts) {
            const response = await fetch('/api/add-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: product.name,
                    price: product.price,
                    company_id: companyId,
                    subcategory
                })
            });
            
            if (response.ok) added++;
        }

        showParseStatus(`✅ Added ${added}/${parsedProducts.length}`, 'success');
        document.getElementById('pasteArea').value = '';
        await loadProductsForCompany();
    } catch (error) {
        showParseStatus(`❌ ${error.message}`, 'error');
    }
}

async function addProductManually() {
    const companyId = parseInt(document.getElementById('manualcompanySelect').value);
    
    if (!companyId) {
        showManualStatus('❌ Select company first', 'error');
        return;
    }

    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const subcategory = document.getElementById('manualSubcategorySelect').value || '';
    
    if (!name || !price || price <= 0) {
        showManualStatus('❌ Invalid data', 'error');
        return;
    }

    try {
        const response = await fetch('/api/add-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                price,
                company_id: companyId,
                subcategory
            })
        });

        if (response.ok) {
            showManualStatus(`✅ Added "${name}"`, 'success');
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            await loadProductsForCompany();
        } else {
            const error = await response.json();
            showManualStatus(`❌ ${error.error}`, 'error');
        }
    } catch (error) {
        showManualStatus(`❌ ${error.message}`, 'error');
    }
}

function showParseStatus(msg, type) {
    const el = document.getElementById('parseStatus');
    el.textContent = msg;
    el.className = `status-message ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function showManualStatus(msg, type) {
    const el = document.getElementById('manualStatus');
    el.textContent = msg;
    el.className = `status-message ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function updateManualSubcategoryDropdown() {
    const companySelect = document.getElementById('manualcompanySelect');
    const selector = document.getElementById('manualSubcategorySelect');
    
    if (!selector || !companySelect) return;
    
    const companyId = parseInt(companySelect.value);
    if (!companyId) {
        selector.innerHTML = '<option value="">No subcategory</option>';
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    selector.innerHTML = '<option value="">No subcategory</option>';
    
    if (company && company.subcategories && company.subcategories.length > 0) {
        company.subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            selector.appendChild(option);
        });
    }
}

function updatePasteSubcategoryDropdown() {
    const companySelect = document.getElementById('pastecompanySelect');
    const selector = document.getElementById('pasteSubcategorySelect');
    
    if (!selector || !companySelect) return;
    
    const companyId = parseInt(companySelect.value);
    if (!companyId) {
        selector.innerHTML = '<option value="">No subcategory</option>';
        return;
    }
    
    const company = companies.find(c => c.id === companyId);
    selector.innerHTML = '<option value="">No subcategory</option>';
    
    if (company && company.subcategories && company.subcategories.length > 0) {
        company.subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            selector.appendChild(option);
        });
    }
}

// ============ DISCOUNTS ============
async function loadProductsForDiscount() {
    const companyId = parseInt(document.getElementById('discountcompanySelect').value);
    
    if (!companyId) {
        document.getElementById('discountContent').style.display = 'none';
        document.getElementById('selectCompanyDiscountMsg').style.display = 'block';
        return;
    }

    currentDiscountCompanyId = companyId;
    document.getElementById('discountContent').style.display = 'block';
    document.getElementById('selectCompanyDiscountMsg').style.display = 'none';

    try {
        const response = await fetch(`/api/products?company_id=${companyId}`);
        products = await response.json();
        selectedDiscountProducts.clear();
        displayDiscountProducts();
        updateDiscountCheckboxes();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function filterDiscountProducts() {
    const filter = document.getElementById('discountSearchInput').value.toLowerCase();
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(filter)
    );
    displayDiscountProducts(filtered);
    updateDiscountCheckboxes();
}

function displayDiscountProducts(productsToShow = products) {
    const list = document.getElementById('discountList');
    
    if (productsToShow.length === 0) {
        list.innerHTML = '<div class="empty-state">No products</div>';
        return;
    }

    list.innerHTML = productsToShow.map(product => `
        <div class="discount-product-item">
            <input type="checkbox" class="discount-checkbox" data-id="${product.id}" onchange="toggleDiscountSelection(${product.id})">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
            </div>
            <div>${product.discount || 0}%</div>
            <input type="number" class="discount-input" data-id="${product.id}" value="${product.discount || 0}" min="0" max="100" step="0.1" onchange="updateSingleDiscount(${product.id}, this.value)">
        </div>
    `).join('');
}

function toggleDiscountSelection(id) {
    selectedDiscountProducts.has(id) ? selectedDiscountProducts.delete(id) : selectedDiscountProducts.add(id);
}

function selectAllDiscountProducts() {
    products.forEach(p => selectedDiscountProducts.add(p.id));
    updateDiscountCheckboxes();
}

function deselectAllDiscountProducts() {
    selectedDiscountProducts.clear();
    updateDiscountCheckboxes();
}

function updateDiscountCheckboxes() {
    document.querySelectorAll('.discount-checkbox').forEach(cb => {
        cb.checked = selectedDiscountProducts.has(parseInt(cb.dataset.id));
    });
}

async function applyBulkDiscount() {
    if (selectedDiscountProducts.size === 0) {
        alert('Select products first');
        return;
    }

    const discount = parseFloat(document.getElementById('bulkDiscountInput').value);
    
    if (isNaN(discount) || discount < 0 || discount > 100) {
        alert('Enter valid discount (0-100)');
        return;
    }

    try {
        const response = await fetch('/api/update-discount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_ids: Array.from(selectedDiscountProducts),
                discount
            })
        });

        if (response.ok) {
            alert(`✅ Applied ${discount}% discount to ${selectedDiscountProducts.size} product(s)`);
            document.getElementById('bulkDiscountInput').value = '';
            selectedDiscountProducts.clear();
            await loadProductsForDiscount();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function updateSingleDiscount(productId, discount) {
    try {
        await fetch('/api/update-discount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_ids: [productId],
                discount: parseFloat(discount)
            })
        });
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ BILLING - NEW FEATURES ============

let allBillingProductsFromAPI = []; // Store all billing products without filters

// Load subcategories for billing tab
async function loadSubcategoriesForBilling() {
    const billCompanySelect = document.getElementById('billcompanySelect');
    if (!billCompanySelect) {
        console.error('billcompanySelect not found');
        return;
    }
    
    const companyId = parseInt(billCompanySelect.value);
    
    console.log('=== LOADING BILLING SUBCATEGORIES ===');
    console.log('Company ID:', companyId);
    
    if (!companyId) {
        document.getElementById('billProductsContainer').style.display = 'none';
        const subSelect = document.getElementById('billSubcategorySelect');
        if (subSelect) {
            subSelect.innerHTML = '<option value="">-- Choose a subcategory --</option>';
        }
        return;
    }

    currentBillingCompanyId = companyId;
    document.getElementById('billProductsContainer').style.display = 'block';
    
    try {
        const response = await fetch(`/api/products?company_id=${companyId}`);
        allBillingProductsFromAPI = await response.json();
        
        console.log('Billing products received:', allBillingProductsFromAPI.length);
        console.log('Full billing products data:', JSON.stringify(allBillingProductsFromAPI, null, 2));
        
        selectedBillingProducts.clear();
        
        const subSelect = document.getElementById('billSubcategorySelect');
        if (subSelect) {
            console.log('Found billSubcategorySelect element');
            subSelect.value = '';
            updateBillingSubcategoryDropdown();
        } else {
            console.error('billSubcategorySelect element NOT found');
        }
        
        applyBillingFilters();
    } catch (error) {
        console.error('Error loading billing products:', error);
        allBillingProductsFromAPI = [];
        applyBillingFilters();
    }
}

function updateBillingSubcategoryDropdown() {
    const select = document.getElementById('billSubcategorySelect');
    if (!select) {
        console.error('ERROR: billSubcategorySelect not found');
        return;
    }
    
    console.log('=== UPDATING BILLING SUBCATEGORY DROPDOWN ===');
    console.log('Total billing products to check:', allBillingProductsFromAPI.length);
    
    // Log each product
    allBillingProductsFromAPI.forEach((p, index) => {
        console.log(`Billing Product ${index}:`, p.name, 'Subcategory:', p.subcategory);
    });
    
    // Extract subcategories
    const subcategoriesSet = new Set();
    allBillingProductsFromAPI.forEach(product => {
        if (product && product.subcategory) {
            const sub = String(product.subcategory).trim();
            if (sub && sub.length > 0) {
                subcategoriesSet.add(sub);
            }
        }
    });
    
    const subcategoriesArray = Array.from(subcategoriesSet).sort();
    
    // Clear dropdown completely
    select.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Choose a subcategory --';
    select.appendChild(defaultOption);
    
    // Add subcategories
    subcategoriesArray.forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory;
        option.textContent = subcategory;
        select.appendChild(option);
    });
    
    // If no subcategories found, add info message
    if (subcategoriesArray.length === 0) {
        const infoOption = document.createElement('option');
        infoOption.value = '';
        infoOption.textContent = '(No subcategories assigned)';
        infoOption.disabled = true;
        select.appendChild(infoOption);
    }
}

function applyBillingFilters() {
    const subSelect = document.getElementById('billSubcategorySelect');
    const subcategoryFilter = subSelect ? subSelect.value : '';
    
    let filtered = allBillingProductsFromAPI;
    
    if (subcategoryFilter && subcategoryFilter.trim() !== '') {
        filtered = filtered.filter(p => p.subcategory === subcategoryFilter);
    }
    
    billingProducts = filtered;
    selectedBillingProducts.clear();
    displayBillingProducts(billingProducts);
}

// Display billing products with checkboxes
function displayBillingProducts(productsToShow = billingProducts) {
    const list = document.getElementById('billProductsList');
    
    if (productsToShow.length === 0) {
        list.innerHTML = '<div class="empty-state">No products available</div>';
        return;
    }

    list.innerHTML = productsToShow.map(product => {
        const finalPrice = product.price * (1 - (product.discount || 0) / 100);
        return `
        <div class="product-item">
            <input type="checkbox" class="bill-checkbox" data-id="${product.id}" onchange="toggleBillingSelection(${product.id})">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    ${product.discount ? `<span style="text-decoration: line-through;">₹${product.price.toFixed(2)}</span> ` : ''}
                    <strong>₹${finalPrice.toFixed(2)}</strong>
                </div>
                ${product.discount ? `<div style="color: #27ae60; font-weight: bold;">-${product.discount}% discount</div>` : ''}
            </div>
        </div>
    `; }).join('');
}

// Toggle checkbox selection for billing
function toggleBillingSelection(id) {
    selectedBillingProducts.has(id) ? selectedBillingProducts.delete(id) : selectedBillingProducts.add(id);
    updateBillingCheckboxes();
}

// Select all visible billing products
function selectAllBillingProducts() {
    const checkboxes = document.querySelectorAll('.bill-checkbox');
    checkboxes.forEach(cb => {
        const id = parseInt(cb.dataset.id);
        selectedBillingProducts.add(id);
        cb.checked = true;
    });
}

// Deselect all billing products
function deselectAllBillingProducts() {
    const checkboxes = document.querySelectorAll('.bill-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    selectedBillingProducts.clear();
}

// Update billing checkbox UI state
function updateBillingCheckboxes() {
    document.querySelectorAll('.bill-checkbox').forEach(cb => {
        cb.checked = selectedBillingProducts.has(parseInt(cb.dataset.id));
    });
}

// Add selected billing products to cart
async function addSelectedBillingToCart() {
    if (selectedBillingProducts.size === 0) {
        alert('Select products to add to cart');
        return;
    }

    let addedCount = 0;
    selectedBillingProducts.forEach(productId => {
        const product = billingProducts.find(p => p.id === productId);
        if (product) {
            addToCart(product.id, product.name, product.price, product.discount || 0);
            addedCount++;
        }
    });

    alert(`✅ Added ${addedCount} product(s) to cart`);
    selectedBillingProducts.clear();
    updateBillingCheckboxes();
}

// ============ BILLING - CART MANAGEMENT ============

function addToCart(id, name, price, discount = 0) {
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, discount: discount || 0, quantity: 1 });
    }

    displayCart();
    updateBillSummary();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    displayCart();
    updateBillSummary();
}

function updateQuantity(id, qty) {
    const item = cart.find(item => item.id === id);
    if (item) {
        const newQty = Math.max(0, parseInt(qty) || 0);
        
        // Remove item if quantity is 0 or less
        if (newQty <= 0) {
            removeFromCart(id);
        } else {
            item.quantity = newQty;
            displayCart();
            updateBillSummary();
        }
    }
}

function displayCart() {
    const container = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-state">Add items to cart</p>';
        return;
    }

    container.innerHTML = cart.map(item => {
        const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
        const total = discountedPrice * item.quantity;
        
        return `
        <div class="cart-item">
            <div class="cart-item-header">
                <div class="cart-item-name">${item.name}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">−</button>
                    <input type="number" class="qty-input" value="${item.quantity}" onchange="updateQuantity(${item.id}, this.value)">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-price">₹${total.toFixed(2)}</div>
            </div>
        </div>
    `; }).join('');
}

function updateBillSummary() {
    const subtotal = cart.reduce((sum, item) => {
        const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
        return sum + (discountedPrice * item.quantity);
    }, 0);
    
    const gstPercent = parseFloat(document.getElementById('gstRate').value) || 18;
    const gst = (subtotal * gstPercent) / 100;
    const total = subtotal + gst;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gstAmount').textContent = `₹${gst.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

function clearCart() {
    if (confirm('Clear cart?')) {
        cart = [];
        displayCart();
        updateBillSummary();
    }
}

async function generateBill() {
    if (cart.length === 0) {
        alert('Add items to cart!');
        return;
    }

    try {
        document.getElementById('generateBillBtn').disabled = true;
        document.getElementById('generateBillBtn').textContent = '⏳ Generating...';

        const response = await fetch('/api/generate-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                gst_rate: parseFloat(document.getElementById('gstRate').value) || 18
            })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'quotation.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            alert('✅ Bill downloaded!');
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        document.getElementById('generateBillBtn').disabled = false;
        document.getElementById('generateBillBtn').textContent = '📥 Generate Bill';
    }
}

// ============ UTILITY FUNCTIONS ============
async function populateAllCompanySelects() {
    const selects = [
        'subcompanySelect',
        'productcompanySelect',
        'pastecompanySelect',
        'manualcompanySelect',
        'discountcompanySelect',
        'billcompanySelect'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">-- Select company --</option>';
            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                select.appendChild(option);
            });
            if (currentValue) select.value = currentValue;
        }
    });

    // Setup event listeners for subcategory dropdown updates
    const pasteSelect = document.getElementById('pastecompanySelect');
    const manualSelect = document.getElementById('manualcompanySelect');
    const billSelect = document.getElementById('billcompanySelect');
    
    if (pasteSelect) {
        pasteSelect.onchange = updatePasteSubcategoryDropdown;
    }
    
    if (manualSelect) {
        manualSelect.onchange = updateManualSubcategoryDropdown;
    }
    
    if (billSelect) {
        billSelect.onchange = loadSubcategoriesForBilling;
    }
}
