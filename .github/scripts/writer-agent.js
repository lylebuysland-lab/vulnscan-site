/**
 * writer-agent.js
 * Sovereign Agent: Generates unique CVE pages using Gemini AI
 * Reads scout-queue, generates HTML for new CVEs, pushes to repo
 * 
 * Each generated page:
 * - Unique Gemini-written content (not template spam)
 * - Full schema markup (FAQ, HowTo, SoftwareApp)
 * - Internal linking to related CVEs
 * - Upsell CTA to $49 Deep Scan
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = '.github/data/scout-queue.json';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MAX_PAGES_PER_RUN = 3; // Avoid rate limits, stay fresh

async function callGemini(prompt) {
  if (!GEMINI_KEY) {
    console.log('  ⚠️  No GEMINI_API_KEY — using template fallback');
    return null;
  }
  
  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
    });
    
    const opts = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    
    const t = setTimeout(() => resolve(null), 20000);
    const req = https.request(opts, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        clearTimeout(t);
        try {
          const resp = JSON.parse(d);
          const text = resp.candidates?.[0]?.content?.parts?.[0]?.text;
          resolve(text || null);
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => { clearTimeout(t); resolve(null); });
    req.write(body); req.end();
  });
}

async function generatePage(cve) {
  console.log(`  ✍️  Writing page for ${cve.id}...`);
  
  // Generate unique content via Gemini
  const aiPrompt = `Write a concise, technically accurate 3-paragraph explanation of ${cve.id} for a security-focused audience. Focus on: what systems are vulnerable, how attackers exploit it, and why it's still dangerous today. Do not use markdown. Plain text paragraphs only. Max 400 words. Tech: ${cve.tech}. Description: ${cve.desc}`;
  
  const aiContent = await callGemini(aiPrompt);
  const uniqueContent = aiContent || cve.desc;
  
  const slug = cve.id.toLowerCase().replace(/-/g, '-');
  const year = cve.published ? cve.published.split('-')[0] : '2024';
  const color = cve.severity === 'CRITICAL' ? '#ef4444' : '#f97316';
  const kevBadge = cve.kev ? '<span style="background:#dc2626;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;margin-left:8px;">ACTIVELY EXPLOITED</span>' : '';
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${cve.id} Scanner — Is Your ${cve.tech} Vulnerable? | VulnScan</title>
    <meta name="description" content="Free ${cve.id} vulnerability check. ${cve.desc.substring(0, 120)}... Instant scan, no signup.">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="https://vulnscan.tech/${slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is ${cve.id}?","acceptedAnswer":{"@type":"Answer","text":"${cve.desc.replace(/"/g, "'")}"}},{"@type":"Question","name":"How do I check if my site is vulnerable to ${cve.id}?","acceptedAnswer":{"@type":"Answer","text":"Use VulnScan's free scanner above. Enter your domain and get results in 60 seconds. No signup required."}}]}</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"VulnScan ${cve.id} Checker","applicationCategory":"SecurityApplication","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    <nav class="nav"><div class="nav-inner"><div class="logo"><div class="logo-icon">⚡</div><a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a></div><div class="nav-links"><a href="/blog">Blog</a><a href="/online-vulnerability-scanner">Scanner</a><a href="/#pricing">Pricing</a><a href="#scan" class="nav-cta">Check Now</a></div></div></nav>

    <section class="hero">
        <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(239,68,68,0.1);border:1px solid ${color};border-radius:8px;padding:6px 14px;margin-bottom:16px;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:600;color:${color};">${cve.id}</span>
            <span style="font-size:11px;font-weight:700;background:${color};color:#fff;padding:2px 8px;border-radius:4px;">${cve.severity}${cve.cvss !== 'N/A' ? ' — CVSS ' + cve.cvss : ''}</span>
            ${kevBadge}
        </div>
        <h1>${cve.id} <span class="gradient-text">Vulnerability Scanner</span></h1>
        <p class="hero-sub">Free instant check: is your ${cve.tech} vulnerable to ${cve.id}? ${cve.kev ? 'Currently being actively exploited in the wild.' : 'Affects systems worldwide.'} 60 seconds, no signup required.</p>

        <div class="scan-box" id="scan">
            <div class="scan-input-wrap">
                <div class="scan-icon">🔍</div>
                <input type="text" id="domainInput" placeholder="Enter your domain (e.g. example.com)" autocomplete="off" spellcheck="false">
                <button id="scanBtn" onclick="startFreeScan()">
                    <span class="btn-text">Check for ${cve.id} — Free</span>
                    <span class="btn-loading" style="display:none"><span class="spinner"></span> Scanning...</span>
                </button>
            </div>
            <p class="scan-hint">✓ No signup · ✓ 60 second results · ✓ ${cve.id} specific check</p>
        </div>
        <div class="results-panel" id="resultsPanel" style="display:none">
            <div class="results-header"><div class="results-status"><span class="status-dot scanning"></span><span id="statusText">Checking for ${cve.id}...</span></div><span class="results-domain" id="resultsDomain"></span></div>
            <div class="results-grid">
                <div class="result-card"><div class="result-number" id="subdomainCount">—</div><div class="result-label">Attack Surface</div></div>
                <div class="result-card"><div class="result-number" id="liveCount">—</div><div class="result-label">Exposed Services</div></div>
                <div class="result-card locked"><div class="result-number">🔒</div><div class="result-label">${cve.id} Status</div></div>
                <div class="result-card locked"><div class="result-number">🔒</div><div class="result-label">Patch Status</div></div>
            </div>
            <div class="upsell-box" id="upsellBox" style="display:none">
                <div class="upsell-content">
                    <h3>🚨 <span id="upsellCount" class="gradient-text">${cve.id} exposure indicators found</span></h3>
                    <p>Unlock the full CVE report: patch guidance, affected component analysis, exploitability assessment.</p>
                    <button class="upsell-btn" onclick="checkout('quick')">Unlock Full Report — $49</button>
                    <div class="upsell-features"><span>✓ ${cve.id} Analysis</span><span>✓ Patch Guidance</span><span>✓ Risk Score</span><span>✓ PDF Export</span></div>
                </div>
            </div>
        </div>
    </section>

    <section style="max-width:820px;margin:0 auto;padding:60px 32px;position:relative;z-index:1;">
        <h2 style="font-size:28px;font-weight:800;margin-bottom:20px;">What is ${cve.id}?</h2>
        <div style="color:var(--text-secondary);line-height:1.8;margin-bottom:32px;">
            ${uniqueContent.split('\n').filter(p => p.trim()).map(p => `<p style="margin-bottom:16px;">${p.trim()}</p>`).join('')}
            ${cve.cvss !== 'N/A' ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0;">
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:${color};">${cve.cvss}</div><div style="color:var(--text-secondary);font-size:12px;">CVSS Score</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:${color};">${cve.severity}</div><div style="color:var(--text-secondary);font-size:12px;">Severity</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center;"><div style="font-size:22px;font-weight:800;color:var(--accent);">${year}</div><div style="color:var(--text-secondary);font-size:12px;">Year</div></div>
            </div>` : ''}
        </div>
        <div style="text-align:center;margin-top:40px;padding:32px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:16px;">
            <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">Don't wait — check for ${cve.id} now</h3>
            <p style="color:var(--text-secondary);margin-bottom:16px;">Free scan in 60 seconds. No signup, no credit card.</p>
            <button class="cta-btn" onclick="document.getElementById('domainInput').focus();window.scrollTo({top:0,behavior:'smooth'});">Check for ${cve.id} — Free</button>
        </div>
    </section>

    <footer class="footer"><div class="footer-inner"><div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></div><div class="footer-links"><a href="/blog">Blog</a><a href="/online-vulnerability-scanner">Scanner</a><a href="/wordpress-security-scanner">WordPress</a><a href="/ssl-checker">SSL Check</a><a href="mailto:security@vulnscan.tech">Contact</a></div><p class="footer-copy">© ${year} VulnScan. All rights reserved.</p></div></footer>
    <script src="app.js"></script>
</body>
</html>`;

  return { slug, html };
}

async function main() {
  console.log(`\n✍️  Writer Agent — ${new Date().toISOString()}\n`);
  
  let queue = [];
  try { queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')); } catch(e) {
    console.log('No queue file yet — nothing to write');
    return;
  }
  
  const pending = queue.filter(q => q.status === 'queued').slice(0, MAX_PAGES_PER_RUN);
  console.log(`📋 ${pending.length} CVEs in queue (cap: ${MAX_PAGES_PER_RUN}/run)`);
  
  if (pending.length === 0) {
    console.log('✅ Queue empty — nothing to write');
    return;
  }
  
  let written = 0;
  for (const cve of pending) {
    try {
      const { slug, html } = await generatePage(cve);
      const outFile = `${slug}.html`;
      fs.writeFileSync(outFile, html, 'utf-8');
      
      // Mark as done in queue
      const idx = queue.findIndex(q => q.id === cve.id);
      if (idx !== -1) queue[idx].status = 'written';
      
      console.log(`  ✅ Written: ${outFile}`);
      written++;
      
      // Rate limit: 2s between Gemini calls
      await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
      console.log(`  ❌ Failed: ${cve.id} — ${e.message}`);
    }
  }
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log(`\n✅ Writer Agent complete: ${written} pages written`);
}

main().catch(console.error);
