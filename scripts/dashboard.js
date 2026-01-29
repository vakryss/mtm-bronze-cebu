// ============================================
// DASHBOARD - Read-Only Data Aggregation
// ============================================
import { supabase } from './supabase.js'
import { showToast } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard
    initDashboard()
})

async function initDashboard() {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Load all dashboard data
    await Promise.all([
        loadFinancialSummary(),
        loadAttentionItems(),
        loadRecentActivity()
    ])
    
    // Setup payment methods
    setupPaymentMethods()
    
    // Update every 30 seconds (for real-time updates)
    setInterval(updateDashboard, 30000)
}

// ============================================
// LOAD FINANCIAL SUMMARY
// ============================================
async function loadFinancialSummary() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Get current month dates
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        
        // Load data in parallel
        const [
            activeTenants,
            rentCharges,
            utilityCharges,
            payments,
            ledgerEntries
        ] = await Promise.all([
            // Active tenants count
            supabase
                .from('tenants')
                .select('id, monthly_rent')
                .eq('user_id', user.id)
                .eq('status', 'Active'),
            
            // Rent charges for current month
            supabase
                .from('rent_charges')
                .select('amount')
                .eq('user_id', user.id)
                .gte('charge_month', firstDay.toISOString())
                .lte('charge_month', lastDay.toISOString()),
            
            // Utility charges for current month
            supabase
                .from('utility_charges')
                .select('amount')
                .eq('user_id', user.id)
                .gte('charge_date', firstDay.toISOString())
                .lte('charge_date', lastDay.toISOString()),
            
            // Payments for current month
            supabase
                .from('payments')
                .select('amount')
                .eq('user_id', user.id)
                .gte('payment_date', firstDay.toISOString())
                .lte('payment_date', lastDay.toISOString()),
            
            // Ledger entries for balance calculation
            supabase
                .from('ledger_entries')
                .select('amount')
                .eq('user_id', user.id)
        ])
        
        // Calculate totals
        const totalRent = activeTenants.data?.reduce((sum, tenant) => 
            sum + (parseFloat(tenant.monthly_rent) || 0), 0) || 0
        
        const rentChargesTotal = rentCharges.data?.reduce((sum, charge) => 
            sum + (parseFloat(charge.amount) || 0), 0) || 0
        
        const utilitiesTotal = utilityCharges.data?.reduce((sum, charge) => 
            sum + (parseFloat(charge.amount) || 0), 0) || 0
        
        const paymentsTotal = payments.data?.reduce((sum, payment) => 
            sum + (parseFloat(payment.amount) || 0), 0) || 0
        
        const outstandingBalance = ledgerEntries.data?.reduce((sum, entry) => 
            sum + (parseFloat(entry.amount) || 0), 0) || 0
        
        // Format as currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2
            }).format(amount)
        }
        
        // Update UI
        updateElement('totalRent', formatCurrency(totalRent))
        updateElement('utilitiesDue', formatCurrency(utilitiesTotal))
        updateElement('paymentsReceived', formatCurrency(paymentsTotal))
        updateElement('outstandingBalance', formatCurrency(Math.abs(outstandingBalance)))
        updateElement('activeTenants', activeTenants.data?.length || 0)
        
        // Add color to outstanding balance
        const balanceElement = document.getElementById('outstandingBalance')
        if (balanceElement) {
            if (outstandingBalance < 0) {
                balanceElement.style.color = '#dc2626' // Red for negative
            } else if (outstandingBalance > 0) {
                balanceElement.style.color = '#16a34a' // Green for positive
            }
        }
        
    } catch (error) {
        console.error('Error loading financial summary:', error)
        showToast('Failed to load financial data', 'error')
    }
}

// ============================================
// LOAD ATTENTION ITEMS
// ============================================
async function loadAttentionItems() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Get tenants with overdue payments
        const { data: ledgerEntries, error } = await supabase
            .from('ledger_entries')
            .select(`
                amount,
                tenant_id,
                tenants!inner(tenant_name)
            `)
            .eq('user_id', user.id)
        
        if (error) throw error
        
        // Calculate balances per tenant
        const tenantBalances = {}
        ledgerEntries?.forEach(entry => {
            const tenantId = entry.tenant_id
            if (!tenantBalances[tenantId]) {
                tenantBalances[tenantId] = {
                    name: entry.tenants?.tenant_name || 'Unknown',
                    balance: 0
                }
            }
            tenantBalances[tenantId].balance += parseFloat(entry.amount) || 0
        })
        
        // Filter tenants with negative balance (overdue)
        const overdueTenants = Object.values(tenantBalances)
            .filter(tenant => tenant.balance < 0)
            .sort((a, b) => a.balance - b.balance) // Most negative first
        
        // Update UI
        const attentionList = document.getElementById('attentionList')
        const attentionCount = document.getElementById('attentionCount')
        
        if (!attentionList) return
        
        if (overdueTenants.length === 0) {
            attentionList.innerHTML = `
                <div class="attention-item success">
                    <strong>✓ All Good</strong>
                    <p>No outstanding balances at the moment.</p>
                </div>
            `
            if (attentionCount) attentionCount.textContent = '0'
            return
        }
        
        // Update count
        if (attentionCount) {
            attentionCount.textContent = overdueTenants.length
            attentionCount.style.background = overdueTenants.length > 0 ? '#dc2626' : '#16a34a'
        }
        
        // Build attention items
        let html = ''
        overdueTenants.forEach(tenant => {
            const amount = new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2
            }).format(Math.abs(tenant.balance))
            
            html += `
                <div class="attention-item warning">
                    <div class="d-flex justify-between align-center">
                        <div>
                            <strong>${tenant.name}</strong>
                            <p>Overdue balance</p>
                        </div>
                        <div style="text-align: right;">
                            <strong>${amount}</strong>
                            <p>Past due</p>
                        </div>
                    </div>
                </div>
            `
        })
        
        attentionList.innerHTML = html
        
    } catch (error) {
        console.error('Error loading attention items:', error)
    }
}

// ============================================
// LOAD RECENT ACTIVITY
// ============================================
async function loadRecentActivity() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Get recent ledger entries
        const { data, error } = await supabase
            .from('ledger_entries')
            .select(`
                entry_date,
                entry_type,
                category,
                amount,
                notes,
                tenants!inner(tenant_name)
            `)
            .eq('user_id', user.id)
            .order('entry_date', { ascending: false })
            .limit(10)
        
        if (error) throw error
        
        // Update UI
        const activityTable = document.getElementById('recentActivity')
        if (!activityTable) return
        
        if (!data || data.length === 0) {
            activityTable.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4">
                        <div class="text-muted">No recent activity</div>
                    </td>
                </tr>
            `
            return
        }
        
        let html = ''
        data.forEach(entry => {
            const amount = new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2
            }).format(Math.abs(entry.amount))
            
            const typeIcon = entry.entry_type === 'payment' ? '💵' : '📝'
            const typeClass = entry.entry_type === 'payment' ? 'text-success' : 'text-muted'
            
            html += `
                <tr>
                    <td>${formatDate(entry.entry_date)}</td>
                    <td>${entry.tenants?.tenant_name || 'N/A'}</td>
                    <td class="${typeClass}">
                        <span style="margin-right: 6px;">${typeIcon}</span>
                        ${entry.entry_type === 'payment' ? 'Payment' : 'Charge'}
                    </td>
                    <td>
                        <strong class="${entry.amount >= 0 ? 'text-success' : 'text-danger'}">
                            ${entry.amount >= 0 ? '+' : ''}${amount}
                        </strong>
                        <div class="text-muted" style="font-size: 0.8rem;">
                            ${entry.category}
                        </div>
                    </td>
                </tr>
            `
        })
        
        activityTable.innerHTML = html
        
    } catch (error) {
        console.error('Error loading recent activity:', error)
    }
}

// ============================================
// SETUP PAYMENT METHODS
// ============================================
function setupPaymentMethods() {
    // GCash QR Code
    const gcashButtons = document.querySelectorAll('[data-gcash]')
    gcashButtons.forEach(button => {
        button.addEventListener('click', showGCashQR)
    })
    
    // SMS Payment
    const smsButtons = document.querySelectorAll('[data-sms]')
    smsButtons.forEach(button => {
        button.addEventListener('click', sendPaymentLink)
    })
    
    // Bank Transfer
    const bankButtons = document.querySelectorAll('[data-bank]')
    bankButtons.forEach(button => {
        button.addEventListener('click', showBankDetails)
    })
    
    // Cash Payment
    const cashButtons = document.querySelectorAll('[data-cash]')
    cashButtons.forEach(button => {
        button.addEventListener('click', showCashInstructions)
    })
}

// ============================================
// PAYMENT METHOD FUNCTIONS
// ============================================
function showGCashQR() {
    const modal = document.getElementById('gcashModal')
    if (!modal) return
    
    modal.style.display = 'flex'
}

function copyGCashNumber() {
    const gcashNumber = '0917-XXX-XXXX'
    navigator.clipboard.writeText(gcashNumber)
        .then(() => {
            showToast('GCash number copied to clipboard!', 'success')
        })
        .catch(() => {
            showToast('Failed to copy to clipboard', 'error')
        })
}

function sendPaymentLink() {
    const phone = '09171234567'
    const message = 'Pay your rent via this link: https://pay.mtm-cebu.com'
    
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // Mobile devices
        window.open(`sms:${phone}&body=${encodeURIComponent(message)}`, '_blank')
    } else {
        // Desktop - show modal
        const modal = document.getElementById('smsModal') || createSMSModal()
        modal.style.display = 'flex'
    }
}

function createSMSModal() {
    const modal = document.createElement('div')
    modal.id = 'smsModal'
    modal.className = 'modal-overlay'
    modal.innerHTML = `
        <div class="modal">
            <h2>SMS Payment Link</h2>
            <p>Send an SMS to: <strong>0917-XXX-XXXX</strong></p>
            <p>Message: <code>PAY [AMOUNT] [TENANT NAME]</code></p>
            <p class="text-muted">Example: PAY 5000 John Doe</p>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="document.getElementById('smsModal').style.display='none'">
                    Close
                </button>
                <button class="btn-primary" onclick="window.open('sms:09171234567&body=PAY%20RENT', '_blank')">
                    Send SMS
                </button>
            </div>
        </div>
    `
    document.body.appendChild(modal)
    return modal
}

function showBankDetails() {
    const modal = document.getElementById('bankModal') || createBankModal()
    modal.style.display = 'flex'
}

function createBankModal() {
    const modal = document.createElement('div')
    modal.id = 'bankModal'
    modal.className = 'modal-overlay'
    modal.innerHTML = `
        <div class="modal">
            <h2>Bank Transfer Details</h2>
            <div class="qr-container">
                <div class="qr-placeholder">
                    <div>🏦</div>
                    <p>Bank QR Code</p>
                </div>
                <p><strong>Bank:</strong> BDO (Banco de Oro)</p>
                <p><strong>Account Name:</strong> My Tenant Manager</p>
                <p><strong>Account Number:</strong> 00-123-456-789</p>
                <p><strong>Branch:</strong> Cebu Business Park</p>
                <p class="text-muted">Include tenant name as reference</p>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="document.getElementById('bankModal').style.display='none'">
                    Close
                </button>
                <button class="btn-primary" onclick="copyToClipboard('00-123-456-789')">
                    Copy Account Number
                </button>
            </div>
        </div>
    `
    document.body.appendChild(modal)
    return modal
}

function showCashInstructions() {
    showToast('Cash payments accepted at our Cebu office: 123 Business St, Cebu City', 'info')
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Copied to clipboard!', 'success')
        })
        .catch(() => {
            showToast('Failed to copy', 'error')
        })
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function updateElement(id, content) {
    const element = document.getElementById(id)
    if (element) {
        element.textContent = content
    }
}

function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

async function updateDashboard() {
    // Refresh dashboard data
    await loadFinancialSummary()
    await loadAttentionItems()
    await loadRecentActivity()
}

// Make functions available globally
window.showGCashQR = showGCashQR
window.copyGCashNumber = copyGCashNumber
window.showBankDetails = showBankDetails
window.sendPaymentLink = sendPaymentLink
window.showCashInstructions = showCashInstructions
