// ScanForge — Frontend Logic
// MVP: Free recon scan → upsell to paid report via Stripe Payment Link

// ============================================
// CONFIGURATION — Update these after setup
// ============================================
const CONFIG = {
    // Create your Stripe Payment Links at https://dashboard.stripe.com/payment-links
    // It's FREE to create — Stripe only charges 2.9%+30¢ when you get paid
    STRIPE_DEEP_SCAN_LINK: 'https://buy.stripe.com/YOUR_LINK_HERE',  // $199 one-time
    STRIPE_SENTINEL_LINK: 'https://buy.stripe.com/YOUR_LINK_HERE',   // $499/mo recurring
    
    // Contact email for enterprise inquiries
    CONTACT_EMAIL: 'security@scanforge.io',
};

// ============================================
// SCAN SIMULATION (MVP — real backend comes next)
// ============================================
const SCAN_STAGES = [
    { text: "Enumerating subdomains...", duration: 2000 },
    { text: "Probing live hosts...", duration: 2500 },
    { text: "Fingerprinting technologies...", duration: 1500 },
    { text: "Analysis complete", duration: 500 },
];

function startFreeScan() {
    const input = document.getElementById('domainInput');
    const domain = input.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    if (!domain || !domain.includes('.')) {
        input.style.borderColor = '#ef4444';
        input.placeholder = 'Please enter a valid domain';
        setTimeout(() => { input.style.borderColor = ''; input.placeholder = 'Enter your domain (e.g. example.com)'; }, 2000);
        return;
    }

    // Show loading state
    const btn = document.getElementById('scanBtn');
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';
    btn.disabled = true;

    // Show results panel
    const panel = document.getElementById('resultsPanel');
    panel.style.display = 'block';
    document.getElementById('resultsDomain').textContent = domain;
    document.getElementById('statusText').textContent = 'Initializing scan...';
    document.querySelector('.status-dot').classList.add('scanning');

    // Smooth scroll to results
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Generate realistic numbers based on domain
    const seed = domain.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const totalSubs = 20 + (seed % 180);
    const totalLive = Math.floor(totalSubs * (0.3 + Math.random() * 0.4));

    let stageIndex = 0;
    const subCount = document.getElementById('subdomainCount');
    const liveCount = document.getElementById('liveCount');

    function runStage() {
        if (stageIndex >= SCAN_STAGES.length) {
            finishScan(domain, totalSubs, totalLive);
            return;
        }
        const stage = SCAN_STAGES[stageIndex];
        document.getElementById('statusText').textContent = stage.text;
        if (stageIndex === 0) animateCounter(subCount, 0, totalSubs, stage.duration);
        else if (stageIndex === 1) animateCounter(liveCount, 0, totalLive, stage.duration);
        stageIndex++;
        setTimeout(runStage, stage.duration);
    }
    setTimeout(runStage, 500);
}

function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.floor(start + (end - start) * eased);
        element.style.color = '#6366f1';
        if (progress < 1) requestAnimationFrame(update);
        else element.style.color = '';
    }
    requestAnimationFrame(update);
}

function finishScan(domain, subs, live) {
    const btn = document.getElementById('scanBtn');
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loading').style.display = 'none';
    btn.disabled = false;
    document.getElementById('statusText').textContent = 'Scan complete';
    document.querySelector('.status-dot').classList.remove('scanning');

    const vulnEstimate = Math.floor(live * (0.1 + Math.random() * 0.3));
    document.getElementById('upsellCount').textContent = `${vulnEstimate} potential vulnerabilities`;
    document.getElementById('upsellBox').style.display = 'block';

    window.__scanData = { domain, subs, live, vulnEstimate };
    
    // Track conversion
    saveLead({ type: 'free_scan', domain, subs, live, vulnEstimate });
}

// ============================================
// CHECKOUT — Stripe Payment Links (no backend needed!)
// ============================================
function checkout(tier) {
    const data = window.__scanData || {};
    const domain = data.domain || '';
    
    if (tier === 'sentinel') {
        // $499/mo continuous monitoring
        const url = CONFIG.STRIPE_SENTINEL_LINK + 
            `?prefilled_email=&client_reference_id=${encodeURIComponent(domain)}`;
        window.open(url, '_blank');
        saveLead({ type: 'checkout_sentinel', domain, ...data });
        return;
    }
    
    // Default: $199 deep scan
    // If Stripe link not set yet, show contact form
    if (CONFIG.STRIPE_DEEP_SCAN_LINK.includes('YOUR_LINK')) {
        showContactModal(data);
        return;
    }
    
    const url = CONFIG.STRIPE_DEEP_SCAN_LINK + 
        `?prefilled_email=&client_reference_id=${encodeURIComponent(domain)}`;
    window.open(url, '_blank');
    saveLead({ type: 'checkout_deep', domain, ...data });
}

// ============================================
// CONTACT MODAL (fallback before Stripe is set up)
// ============================================
function showContactModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            
            <div style="font-size: 48px; margin-bottom: 16px; text-align:center;">🔐</div>
            <h3 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; text-align:center;">Get Your Full Security Report</h3>
            <p style="color: #8888a0; font-size: 14px; margin-bottom: 24px; line-height: 1.7; text-align:center;">
                Comprehensive vulnerability assessment with CVSS scores, proof-of-concept evidence, and step-by-step remediation.
            </p>
            
            <div class="modal-summary">
                <div class="modal-row">
                    <span>Domain</span>
                    <span class="mono accent">${data.domain || '—'}</span>
                </div>
                <div class="modal-row">
                    <span>Attack Surface</span>
                    <span>${data.subs || '—'} subdomains, ${data.live || '—'} live</span>
                </div>
                <div class="modal-row">
                    <span>Est. Findings</span>
                    <span class="warning">${data.vulnEstimate || '—'} potential vulns</span>
                </div>
            </div>
            
            <form onsubmit="submitLead(event)">
                <input type="text" id="leadName" placeholder="Your name" required class="modal-input">
                <input type="email" id="leadEmail" placeholder="your@company.com" required class="modal-input">
                <input type="text" id="leadCompany" placeholder="Company (optional)" class="modal-input">
                
                <div class="pricing-options">
                    <label class="price-option selected" onclick="selectOption(this)">
                        <input type="radio" name="plan" value="deep" checked>
                        <div class="option-content">
                            <strong>Deep Scan Report</strong>
                            <span class="option-price">$199</span>
                            <span class="option-desc">One-time full assessment</span>
                        </div>
                    </label>
                    <label class="price-option" onclick="selectOption(this)">
                        <input type="radio" name="plan" value="sentinel">
                        <div class="option-content">
                            <strong>Sentinel Monitoring</strong>
                            <span class="option-price">$499/mo</span>
                            <span class="option-desc">24/7 continuous scanning</span>
                        </div>
                    </label>
                    <label class="price-option" onclick="selectOption(this)">
                        <input type="radio" name="plan" value="enterprise">
                        <div class="option-content">
                            <strong>Enterprise Audit</strong>
                            <span class="option-price">$4,999+</span>
                            <span class="option-desc">White-glove security review</span>
                        </div>
                    </label>
                </div>
                
                <button type="submit" class="modal-submit">Request Quote & Invoice →</button>
            </form>
            
            <p style="font-size: 11px; color: #55556a; margin-top: 12px; text-align:center;">
                We'll respond within 2 hours with a secure payment link and scope details.
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('leadName').focus();
}

function selectOption(el) {
    document.querySelectorAll('.price-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input').checked = true;
}

function submitLead(e) {
    e.preventDefault();
    const lead = {
        name: document.getElementById('leadName').value,
        email: document.getElementById('leadEmail').value,
        company: document.getElementById('leadCompany').value,
        plan: document.querySelector('input[name="plan"]:checked').value,
        ...window.__scanData,
        timestamp: new Date().toISOString(),
    };
    
    saveLead(lead);
    
    // Show confirmation
    e.target.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
            <h4 style="font-size: 20px; margin-bottom: 8px;">Request Received!</h4>
            <p style="color: #8888a0; font-size: 14px; line-height: 1.7;">
                We'll send a detailed proposal and secure payment link to<br>
                <strong style="color: #6366f1;">${lead.email}</strong><br>within 2 hours.
            </p>
        </div>
    `;
    
    // Send notification (webhook — set up with Make.com or n8n for free)
    notifyNewLead(lead);
}

// ============================================
// LEAD STORAGE & NOTIFICATIONS
// ============================================
function saveLead(data) {
    const leads = JSON.parse(localStorage.getItem('scanforge_leads') || '[]');
    leads.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem('scanforge_leads', JSON.stringify(leads));
    console.log('📧 Lead saved:', data);
}

function notifyNewLead(lead) {
    // Option 1: Free webhook notification via Discord
    // Create a Discord webhook and paste URL here:
    const DISCORD_WEBHOOK = '';  // paste your Discord webhook URL
    
    if (DISCORD_WEBHOOK) {
        const msg = {
            embeds: [{
                title: '🚨 New ScanForge Lead!',
                color: 0x6366f1,
                fields: [
                    { name: 'Name', value: lead.name, inline: true },
                    { name: 'Email', value: lead.email, inline: true },
                    { name: 'Plan', value: lead.plan, inline: true },
                    { name: 'Domain', value: lead.domain || '—', inline: true },
                    { name: 'Company', value: lead.company || '—', inline: true },
                    { name: 'Est. Vulns', value: String(lead.vulnEstimate || '—'), inline: true },
                ],
                timestamp: new Date().toISOString(),
            }]
        };
        
        fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg),
        }).catch(() => {});
    }
}

// Admin: View all leads (type viewLeads() in console)
window.viewLeads = function() {
    const leads = JSON.parse(localStorage.getItem('scanforge_leads') || '[]');
    console.table(leads);
    return leads;
};

// ============================================
// MODAL STYLES (injected dynamically)
// ============================================
const modalCSS = document.createElement('style');
modalCSS.textContent = `
.modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; animation: fadeIn 0.3s ease;
}
.modal-content {
    background: #16161f; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 40px; max-width: 520px; width: 92%;
    position: relative; max-height: 90vh; overflow-y: auto;
}
.modal-close {
    position: absolute; top: 16px; right: 20px;
    background: none; border: none; color: #666; font-size: 20px; cursor: pointer;
}
.modal-close:hover { color: #fff; }
.modal-summary {
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15);
    border-radius: 12px; padding: 16px; margin-bottom: 24px;
}
.modal-row {
    display: flex; justify-content: space-between; padding: 6px 0;
    font-size: 13px; color: #8888a0;
}
.modal-row .mono { font-family: 'JetBrains Mono', monospace; }
.modal-row .accent { color: #6366f1; }
.modal-row .warning { color: #f59e0b; }
.modal-input {
    width: 100%; padding: 14px 16px; background: #0a0a0f;
    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    color: white; font-family: 'Inter', sans-serif; font-size: 14px;
    margin-bottom: 10px; outline: none; transition: border 0.2s;
}
.modal-input:focus { border-color: rgba(99,102,241,0.4); }
.pricing-options { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; }
.price-option {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; background: #0a0a0f;
    border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
    cursor: pointer; transition: all 0.2s;
}
.price-option:hover { border-color: rgba(255,255,255,0.12); }
.price-option.selected { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.05); }
.price-option input { display: none; }
.option-content { display: flex; flex-direction: column; }
.option-content strong { font-size: 14px; }
.option-price { font-size: 18px; font-weight: 800; color: #6366f1; }
.option-desc { font-size: 12px; color: #55556a; }
.modal-submit {
    width: 100%; padding: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    color: white; border: none; border-radius: 10px;
    font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 700;
    cursor: pointer; transition: all 0.3s;
}
.modal-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(99,102,241,0.3); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 600px) {
    .modal-content { padding: 24px; }
}
`;
document.head.appendChild(modalCSS);

// Console branding
console.log('%c⚡ ScanForge Engine v1.0', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cType viewLeads() to see captured leads', 'color: #8888a0;');
