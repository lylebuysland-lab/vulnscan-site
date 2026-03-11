// VulnScan — Frontend Logic
// MVP: Free recon scan → upsell to paid report via Stripe Payment Link

// ============================================
// SECURITY UTILITIES
// ============================================
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function isValidDomain(d) {
    return /^[a-zA-Z0-9][a-zA-Z0-9\-\.]{1,253}\.[a-zA-Z]{2,}$/.test(d);
}

// Rate limiter: max 3 scans per minute
const scanTimes = [];
function isRateLimited() {
    const now = Date.now();
    scanTimes.push(now);
    while (scanTimes.length > 0 && scanTimes[0] < now - 60000) scanTimes.shift();
    return scanTimes.length > 3;
}

// ============================================
// CONFIGURATION — Update these after setup
// ============================================
const CONFIG = {
    // Live Stripe Payment Links
    STRIPE_QUICK_SCAN_LINK: 'https://buy.stripe.com/fZu4gz8OV13MfeW1xa2oE00', // $49 one-time
    STRIPE_DEEP_SCAN_LINK: 'https://buy.stripe.com/14A14ne9f4fY4Ai7Vy2oE01',  // $199 one-time
    
    // Contact email for enterprise inquiries
    CONTACT_EMAIL: 'security@vulnscan.tech',
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
    const domain = input.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    
    if (!domain || !isValidDomain(domain)) {
        input.style.borderColor = '#ef4444';
        input.placeholder = 'Please enter a valid domain';
        setTimeout(() => { input.style.borderColor = ''; input.placeholder = 'Enter your domain (e.g. example.com)'; }, 2000);
        return;
    }
    
    if (isRateLimited()) {
        input.value = '';
        input.placeholder = 'Too many scans. Please wait a minute.';
        input.style.borderColor = '#ef4444';
        setTimeout(() => { input.style.borderColor = ''; input.placeholder = 'Enter your domain (e.g. example.com)'; }, 3000);
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
    
    saveLead({ type: 'free_scan', domain, subs, live, vulnEstimate });
}

// Check for returning buyers on page load
(function checkReturningBuyer() {
    const order = JSON.parse(localStorage.getItem('vulnscan_pending_order') || 'null');
    // Only show banner if: valid order exists, has a real domain, and is within 24h
    if (order && order.domain && order.domain.length > 3 && order.ts && Date.now() - order.ts < 86400000) {
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:12px 20px;text-align:center;font-size:14px;font-weight:600;color:#fff;font-family:Inter,sans-serif;';
        banner.innerHTML = `📧 Your <strong>${sanitize(order.tier)}</strong> report for <strong>${sanitize(order.domain)}</strong> is being prepared — typically delivered within 2-6 hours. <a href="mailto:security@vulnscan.tech" style="color:#fde68a;margin-left:8px;">Questions?</a> <button onclick="this.parentElement.remove();localStorage.removeItem('vulnscan_pending_order')" style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;margin-left:12px;font-size:16px;">✕</button>`;
        document.body.prepend(banner);
    } else {
        // Clear stale/invalid banner data
        localStorage.removeItem('vulnscan_pending_order');
    }
})();

// ============================================
// CHECKOUT — Stripe Payment Links (no backend needed!)
// ============================================
function checkout(tier) {
    const data = window.__scanData || {};
    const domain = data.domain || '';
    
    if (tier === 'quick') {
        const url = CONFIG.STRIPE_QUICK_SCAN_LINK + 
            `?prefilled_email=&client_reference_id=${encodeURIComponent(domain)}`;
        window.open(url, '_blank');
        saveLead({ type: 'checkout_quick', domain, ...data });
        localStorage.setItem('vulnscan_pending_order', JSON.stringify({ tier: 'Quick Scan', domain, ts: Date.now() }));
        showPostPurchaseConfirmation('Quick Scan', domain);
        return;
    }
    
    if (tier === 'deep') {
        const url = CONFIG.STRIPE_DEEP_SCAN_LINK + 
            `?prefilled_email=&client_reference_id=${encodeURIComponent(domain)}`;
        window.open(url, '_blank');
        saveLead({ type: 'checkout_deep', domain, ...data });
        localStorage.setItem('vulnscan_pending_order', JSON.stringify({ tier: 'Deep Scan', domain, ts: Date.now() }));
        showPostPurchaseConfirmation('Deep Scan', domain);
        return;
    }
    
    showContactModal({ ...data, plan: 'Enterprise Assessment' });
}

function showPostPurchaseConfirmation(tier, domain) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div class="modal-content" style="text-align:center;">
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            <div style="font-size:56px;margin-bottom:16px;">🎯</div>
            <h3 style="font-size:24px;font-weight:800;margin-bottom:8px;">You're Almost There!</h3>
            <p style="color:#8888a0;font-size:15px;line-height:1.7;margin-bottom:20px;">
                Complete your payment in the Stripe tab that just opened.
            </p>
            <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:14px;padding:24px;margin-bottom:20px;">
                <div style="font-size:13px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">📋 ${tier} — ${sanitize(domain || 'Your Domain')}</div>
                <div style="font-size:15px;color:#fff;font-weight:600;margin-bottom:8px;">Report Delivery Timeline</div>
                <div style="display:flex;justify-content:center;gap:24px;margin:16px 0;">
                    <div style="text-align:center;">
                        <div style="font-size:28px;font-weight:900;color:#22c55e;">2-6h</div>
                        <div style="font-size:11px;color:#8888a0;margin-top:2px;">Typical delivery</div>
                    </div>
                    <div style="width:1px;background:rgba(255,255,255,0.1);"></div>
                    <div style="text-align:center;">
                        <div style="font-size:28px;font-weight:900;color:#f59e0b;">24h</div>
                        <div style="font-size:11px;color:#8888a0;margin-top:2px;">Maximum wait</div>
                    </div>
                </div>
                <p style="font-size:12px;color:#8888a0;line-height:1.6;margin-top:12px;">
                    Our scanning engines will analyze your entire attack surface. You'll receive your professional PDF report via email as soon as it's ready.
                </p>
            </div>
            <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:10px;padding:14px;margin-bottom:16px;">
                <div style="font-size:13px;color:#22c55e;font-weight:600;">✅ What happens next:</div>
                <div style="font-size:12px;color:#8888a0;line-height:1.8;margin-top:6px;text-align:left;padding-left:20px;">
                    1. Complete payment in the Stripe tab<br>
                    2. Check your email for order confirmation<br>
                    3. Our engines begin scanning immediately<br>
                    4. PDF report delivered to your inbox (2-6 hours typical)
                </div>
            </div>
            <p style="font-size:11px;color:#55556a;">
                Questions? Email <a href="mailto:security@vulnscan.tech" style="color:#6366f1;">security@vulnscan.tech</a>
            </p>
        </div>
    `;
    document.body.appendChild(modal);
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
                    <span class="mono accent">${sanitize(data.domain || '—')}</span>
                </div>
                <div class="modal-row">
                    <span>Attack Surface</span>
                    <span>${sanitize(String(data.subs || '—'))} subdomains, ${sanitize(String(data.live || '—'))} live</span>
                </div>
                <div class="modal-row">
                    <span>Est. Findings</span>
                    <span class="warning">${sanitize(String(data.vulnEstimate || '—'))} potential vulns</span>
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
                <strong style="color: #6366f1;">${sanitize(lead.email)}</strong><br>within 2 hours.
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
    const leads = JSON.parse(localStorage.getItem('VulnScan_leads') || '[]');
    leads.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem('VulnScan_leads', JSON.stringify(leads));
    console.log('📧 Lead saved:', data);
}

function notifyNewLead(lead) {
    // Option 1: Free webhook notification via Discord
    // Create a Discord webhook and paste URL here:
    const DISCORD_WEBHOOK = '';  // paste your Discord webhook URL
    
    if (DISCORD_WEBHOOK) {
        const msg = {
            embeds: [{
                title: '🚨 New VulnScan Lead!',
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
    const leads = JSON.parse(localStorage.getItem('VulnScan_leads') || '[]');
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
console.log('%c⚡ VulnScan Engine v1.0', 'font-size: 20px; font-weight: bold; color: #6366f1;');
console.log('%cType viewLeads() to see captured leads', 'color: #8888a0;');
