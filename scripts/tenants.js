// ============================================
// TENANTS MANAGEMENT - Complete with All Features
// ============================================
import { supabase } from './supabase.js'
import { showToast, showLoading, hideLoading, openModal, closeModal } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
    // Initialize tenants management
    initTenantsPage()
})

async function initTenantsPage() {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Load initial data
    await loadTenants()
    
    // Setup event listeners
    setupEventListeners()
    
    // Check for URL parameters (for success redirects)
    checkUrlParams()
}

// ============================================
// STATUS PILL GENERATOR
// ============================================
function getStatusPill(status) {
    const statusConfig = {
        'Active': {
            gradient: 'linear-gradient(135deg, #16a34a, #22c55e)',
            icon: '✓'
        },
        'Moved Out': {
            gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
            icon: '🚚'
        },
        'Left Without Notice': {
            gradient: 'linear-gradient(135deg, #000000, #374151)',
            icon: '🚪'
        }
    }
    
    const config = statusConfig[status] || statusConfig['Active']
    
    return `
        <span class="status-pill" style="
            background: ${config.gradient};
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        ">
            <span>${config.icon}</span>
            <span>${status}</span>
        </span>
    `
}

// ============================================
// FORMAT UTILITIES WITH COMMAS
// ============================================
function formatUtilities(utilities) {
    if (!utilities || utilities.length === 0) {
        return '<span class="text-muted">—</span>'
    }
    
    let utilitiesArray
    if (Array.isArray(utilities)) {
        utilitiesArray = utilities
    } else if (typeof utilities === 'string') {
        utilitiesArray = utilities.split(',').map(u => u.trim())
    } else {
        utilitiesArray = []
    }
    
    const icons = {
        'Electric': '⚡',
        'Water': '💧',
        'Wi-Fi': '📶'
    }
    
    return utilitiesArray
        .map(utility => {
            const icon = icons[utility] || '📋'
            return `<span class="utility-tag">${icon} ${utility}</span>`
        })
        .join(', ')
}

// ============================================
// LOAD TENANTS FROM DATABASE
// ============================================
async function loadTenants() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const filter = document.getElementById('statusFilter').value
        let query = supabase
            .from('tenants')
            .select('*')
            .eq('user_id', user.id)
            .order('tenant_name')
        
        if (filter !== 'all') {
            query = query.eq('status', filter)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        renderTenantsTable(data || [])
        
    } catch (error) {
        console.error('Error loading tenants:', error)
        showToast('Failed to load tenants', 'error')
    }
}

// ============================================
// RENDER TENANTS TABLE
// ============================================
function renderTenantsTable(tenants) {
    const tbody = document.getElementById('tenantTableBody')
    if (!tbody) return
    
    if (!tenants || tenants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-5">
                    <div class="d-flex flex-column align-center gap-3">
                        <div style="font-size: 3rem; opacity: 0.3;">👤</div>
                        <div>
                            <h4 class="mb-2">No tenants found</h4>
                            <p class="text-muted">Add your first tenant to get started</p>
                        </div>
                        <button id="addFirstTenant" class="btn-primary">
                            + Add First Tenant
                        </button>
                    </div>
                </td>
            </tr>
        `
        
        document.getElementById('addFirstTenant')?.addEventListener('click', () => {
            openModal('addTenantWarning')
        })
        
        return
    }
    
    let html = ''
    
    tenants.forEach(tenant => {
        const monthlyRent = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(tenant.monthly_rent || 0)
        
        html += `
            <tr data-tenant-id="${tenant.id}">
                <td>
                    <div class="d-flex flex-column">
                        <strong>${tenant.tenant_name}</strong>
                        <small class="text-muted">Added: ${new Date(tenant.created_at).toLocaleDateString()}</small>
                    </div>
                </td>
                <td>${getStatusPill(tenant.status || 'Active')}</td>
                <td>
                    <strong>${monthlyRent}</strong>
                    <div class="text-muted">Monthly</div>
                </td>
                <td>
                    <div class="due-day">
                        <span class="day-badge">${tenant.rent_due_day}</span>
                        <div class="text-muted">of each month</div>
                    </div>
                </td>
                <td>${formatUtilities(tenant.utilities)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-secondary btn-sm btn-edit" 
                                data-id="${tenant.id}"
                                data-tenant='${JSON.stringify(tenant).replace(/'/g, "\\'")}'>
                            Edit
                        </button>
                    </div>
                </td>
            </tr>
        `
    })
    
    tbody.innerHTML = html
    
    // Add edit button event listeners
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const tenantData = JSON.parse(button.getAttribute('data-tenant'))
            openEditModal(tenantData)
        })
    })
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Filter change
    document.getElementById('statusFilter')?.addEventListener('change', loadTenants)
    
    // Add Tenant Button
    document.getElementById('openAddModal')?.addEventListener('click', () => {
        openModal('addTenantWarning')
    })
    
    // Add Tenant Warning Modal
    const cancelWarning = document.getElementById('cancelAddWarning')
    const confirmWarning = document.getElementById('confirmAddWarning')
    
    if (cancelWarning) {
        cancelWarning.addEventListener('click', () => {
            closeModal('addTenantWarning')
            showToast('Tenant addition cancelled', 'info')
        })
    }
    
    if (confirmWarning) {
        confirmWarning.addEventListener('click', () => {
            closeModal('addTenantWarning')
            resetAddForm()
            openModal('addModal')
        })
    }
    
    // Save New Tenant
    const submitAdd = document.getElementById('submitAdd')
    if (submitAdd) {
        submitAdd.addEventListener('click', saveNewTenant)
    }
    
    // Edit Tenant Form
    const editStatus = document.getElementById('editTenantStatus')
    if (editStatus) {
        editStatus.addEventListener('change', updateEditFormFields)
    }
    
    // Save Edit
    const submitEdit = document.getElementById('submitEdit')
    if (submitEdit) {
        submitEdit.addEventListener('click', updateTenant)
    }
    
    // Delete Tenant
    const deleteBtn = document.getElementById('deleteTenantBtn')
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteTenant)
    }
    
    // Close modals
    document.querySelectorAll('[data-close]').forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-close')
            closeModal(modalId)
        })
    })
    
    // Auto-close success modal
    const successModal = document.getElementById('successModal')
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeModal('successModal')
            }
        })
    }
}

// ============================================
// RESET ADD FORM
// ============================================
function resetAddForm() {
    const form = document.getElementById('addModal')
    if (!form) return
    
    // Reset inputs
    form.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.value = ''
    })
    
    // Uncheck all checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false
    })
    
    // Set default due day to 1
    const dueDayInput = document.getElementById('addRentDueDay')
    if (dueDayInput) dueDayInput.value = '1'
}

// ============================================
// SAVE NEW TENANT TO DATABASE
// ============================================
async function saveNewTenant() {
    const submitBtn = document.getElementById('submitAdd')
    if (!submitBtn) return
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        showToast('You must be logged in to add tenants', 'error')
        return
    }
    
    // Get form values
    const tenantName = document.getElementById('addTenantName')?.value.trim()
    const monthlyRent = document.getElementById('addMonthlyRent')?.value
    const rentDueDay = document.getElementById('addRentDueDay')?.value
    
    // Validation
    if (!tenantName || !monthlyRent || !rentDueDay) {
        showToast('Please fill in all required fields', 'error')
        return
    }
    
    // Get selected utilities
    const utilities = Array.from(
        document.querySelectorAll('#addUtilities input:checked')
    ).map(checkbox => checkbox.value)
    
    // Prepare tenant data
    const tenantData = {
        user_id: user.id,
        tenant_name: tenantName,
        status: 'Active',
        monthly_rent: parseFloat(monthlyRent),
        rent_due_day: parseInt(rentDueDay),
        utilities: utilities,
        created_at: new Date().toISOString()
    }
    
    // Show loading
    showLoading(submitBtn)
    
    try {
        // Save to database
        const { data, error } = await supabase
            .from('tenants')
            .insert([tenantData])
            .select()
        
        if (error) throw error
        
        // Success!
        closeModal('addModal')
        
        // Show success modal
        openModal('successModal')
        
        // Auto-close success modal after 2 seconds
        setTimeout(() => {
            closeModal('successModal')
            loadTenants() // Refresh the list
        }, 2000)
        
        showToast(`Tenant "${tenantName}" added successfully!`, 'success')
        
    } catch (error) {
        console.error('Error saving tenant:', error)
        showToast('Failed to save tenant: ' + error.message, 'error')
    } finally {
        hideLoading(submitBtn)
    }
}

// ============================================
// OPEN EDIT MODAL
// ============================================
function openEditModal(tenant) {
    // Set form values
    document.getElementById('editTenantId').value = tenant.id
    document.getElementById('editTenantName').value = tenant.tenant_name
    document.getElementById('editMonthlyRent').value = tenant.monthly_rent
    document.getElementById('editRentDueDay').value = tenant.rent_due_day
    
    // Set status
    const statusSelect = document.getElementById('editTenantStatus')
    statusSelect.value = tenant.status || 'Active'
    
    // Set utilities checkboxes
    const utilities = Array.isArray(tenant.utilities) ? tenant.utilities : []
    document.querySelectorAll('#editUtilities input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = utilities.includes(checkbox.value)
    })
    
    // Set dates if they exist
    if (tenant.moved_out_date) {
        document.getElementById('editMovedOutDate').value = tenant.moved_out_date
    }
    if (tenant.last_seen_date) {
        document.getElementById('editLastSeenDate').value = tenant.last_seen_date
    }
    
    // Update form fields based on status
    updateEditFormFields()
    
    // Open modal
    openModal('editModal')
}

// ============================================
// UPDATE EDIT FORM FIELDS (Show/Hide dates)
// ============================================
function updateEditFormFields() {
    const status = document.getElementById('editTenantStatus')?.value
    const movedOutWrap = document.getElementById('movedOutDateWrap')
    const lastSeenWrap = document.getElementById('lastSeenDateWrap')
    
    if (!movedOutWrap || !lastSeenWrap) return
    
    // Reset both
    movedOutWrap.style.display = 'none'
    lastSeenWrap.style.display = 'none'
    
    // Show appropriate field
    if (status === 'Moved Out') {
        movedOutWrap.style.display = 'block'
        // Set default date to today if empty
        const dateInput = document.getElementById('editMovedOutDate')
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0]
        }
    } else if (status === 'Left Without Notice') {
        lastSeenWrap.style.display = 'block'
        // Set default date to today if empty
        const dateInput = document.getElementById('editLastSeenDate')
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0]
        }
    }
}

// ============================================
// UPDATE TENANT IN DATABASE
// ============================================
async function updateTenant() {
    const submitBtn = document.getElementById('submitEdit')
    const tenantId = document.getElementById('editTenantId')?.value
    
    if (!submitBtn || !tenantId) return
    
    // Get updated values
    const updateData = {
        tenant_name: document.getElementById('editTenantName')?.value.trim(),
        status: document.getElementById('editTenantStatus')?.value,
        monthly_rent: parseFloat(document.getElementById('editMonthlyRent')?.value || 0),
        rent_due_day: parseInt(document.getElementById('editRentDueDay')?.value || 1),
        utilities: Array.from(
            document.querySelectorAll('#editUtilities input:checked')
        ).map(checkbox => checkbox.value),
        updated_at: new Date().toISOString()
    }
    
    // Add dates based on status
    const status = updateData.status
    if (status === 'Moved Out') {
        updateData.moved_out_date = document.getElementById('editMovedOutDate')?.value
        updateData.last_seen_date = null
    } else if (status === 'Left Without Notice') {
        updateData.last_seen_date = document.getElementById('editLastSeenDate')?.value
        updateData.moved_out_date = null
    } else {
        updateData.moved_out_date = null
        updateData.last_seen_date = null
    }
    
    // Validation
    if (!updateData.tenant_name || !updateData.monthly_rent) {
        showToast('Please fill in all required fields', 'error')
        return
    }
    
    showLoading(submitBtn)
    
    try {
        const { error } = await supabase
            .from('tenants')
            .update(updateData)
            .eq('id', tenantId)
        
        if (error) throw error
        
        // Close modal and refresh
        closeModal('editModal')
        loadTenants()
        
        showToast('Tenant updated successfully!', 'success')
        
    } catch (error) {
        console.error('Error updating tenant:', error)
        showToast('Failed to update tenant: ' + error.message, 'error')
    } finally {
        hideLoading(submitBtn)
    }
}

// ============================================
// DELETE TENANT
// ============================================
async function deleteTenant() {
    const tenantId = document.getElementById('editTenantId')?.value
    const tenantName = document.getElementById('editTenantName')?.value
    
    if (!tenantId || !tenantName) return
    
    // Confirm deletion
    const confirmed = confirm(`Are you sure you want to delete "${tenantName}"? This will also remove all related rent charges, utility charges, and payment records. This action cannot be undone.`)
    
    if (!confirmed) return
    
    try {
        const { error } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenantId)
        
        if (error) throw error
        
        // Close modal and refresh
        closeModal('editModal')
        loadTenants()
        
        showToast(`Tenant "${tenantName}" deleted successfully`, 'success')
        
    } catch (error) {
        console.error('Error deleting tenant:', error)
        showToast('Failed to delete tenant: ' + error.message, 'error')
    }
}

// ============================================
// CHECK URL PARAMETERS
// ============================================
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search)
    
    // Check for success parameter
    if (urlParams.has('success')) {
        showToast('Tenant saved successfully!', 'success')
        
        // Remove parameter from URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
    }
    
    // Check for tenant ID to edit
    const editId = urlParams.get('edit')
    if (editId) {
        // Load and edit tenant
        loadAndEditTenant(editId)
    }
}

// ============================================
// LOAD AND EDIT TENANT
// ============================================
async function loadAndEditTenant(tenantId) {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .eq('user_id', user.id)
            .single()
        
        if (error) throw error
        
        if (data) {
            openEditModal(data)
            
            // Remove parameter from URL
            const newUrl = window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
        }
        
    } catch (error) {
        console.error('Error loading tenant for edit:', error)
        showToast('Could not load tenant for editing', 'error')
    }
}

// ============================================
// EXPORT/IMPORT FUNCTIONS
// ============================================
async function exportTenants() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('user_id', user.id)
        
        if (error) throw error
        
        // Convert to CSV
        const csv = convertToCSV(data)
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tenants_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        showToast('Tenants exported successfully!', 'success')
        
    } catch (error) {
        console.error('Error exporting tenants:', error)
        showToast('Failed to export tenants', 'error')
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return ''
    
    const headers = Object.keys(data[0]).filter(key => key !== 'user_id')
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header]
                if (Array.isArray(value)) {
                    return `"${value.join(', ')}"`
                }
                return `"${value}"`
            }).join(',')
        )
    ]
    
    return csvRows.join('\n')
}

// Make functions available globally for buttons
window.exportTenants = exportTenants
