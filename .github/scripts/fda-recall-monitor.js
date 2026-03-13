#!/usr/bin/env node
/**
 * SOVEREIGN: FDA Drug & Food Recall Monitor
 * 
 * The FDA recalls drugs and food products daily. Each recall triggers a search spike:
 * "Tylenol recall 2026" = 200K searches/day the moment it's announced.
 * The openFDA API is 100% free, no key required.
 * 
 * This bot: fetches new recalls → generates VulnScan pages → ranks for recall searches
 * → affiliates or Pro CTAs convert the traffic.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const brain = require('./sovereign-brain');

const ROOT = process.cwd();
const TODAY = new Date().toISOString().split('T')[0];
const THIS_YEAR = new Date().getFullYear();
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'vulnscan-indexnow-key-2026';

function httpGet(url) {
    return new Promise((resolve) => {
        try {
            const u = new URL(url);
            https.get({ hostname: u.hostname, path: u.pathname + u.search, timeout: 30000, headers: { 'User-Agent': 'VulnScan-Sovereign/1.0', Accept: 'application/json' } }, res => {
                let d = ''; res.on('data', c => d += c);
                res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
            }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
        } catch { resolve(null); }
    });
}

function httpPost(hostname, pathStr, body, headers = {}) {
    return new Promise((resolve) => {
        const d = JSON.stringify(body);
        const req = https.request({ hostname, path: pathStr, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'User-Agent': 'VulnScan-Sovereign/1.0', ...headers } }, res => {
            let s = ''; res.on('data', c => s += c); res.on('end', () => resolve({ status: res.statusCode }));
        });
        req.on('error', () => resolve({ status: 0 }));
        req.write(d); req.end();
    });
}

function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80); }

function classRecallSeverity(classification) {
    if (!classification) return { label: 'Unknown', color: '#94a3b8', desc: 'Classification pending' };
    if (classification.includes('I')) return { label: 'CLASS I', color: '#ef4444', desc: 'Dangerous or defective — could cause serious health consequences or death' };
    if (classification.includes('II')) return { label: 'CLASS II', color: '#f97316', desc: 'May cause temporary adverse health consequences' };
    return { label: 'CLASS III', color: '#eab308', desc: 'Unlikely to cause adverse health consequences' };
}

async function generateRecallPage(recall, type) {
    const product = recall.product_description || recall.brand_name || 'Recalled Product';
    const company = recall.recalling_firm || recall.company || 'Manufacturer';
    const reason = recall.reason_for_recall || recall.voluntary_mandated || 'See FDA notice';
    const date = recall.recall_initiation_date || recall.report_date || TODAY;
    const classification = recall.classification || '';
    const sev = classRecallSeverity(classification);
    const states = recall.distribution_pattern || 'Nationwide';
    const codeInfo = recall.code_info || '';
    
    const slug = `${slugify(company)}-recall-${THIS_YEAR}`;
    const title = `${company} Recall ${THIS_YEAR} — ${sev.label} FDA ${type === 'drug' ? 'Drug' : 'Food'} Recall Alert`;
    const metaDesc = `${company} issued a ${sev.label} ${type} recall on ${date}. Product: ${product.substring(0, 80)}. Reason: ${reason.substring(0, 100)}. Distribution: ${states.substring(0, 50)}. Full details and what to do.`;

    // AI-enhanced analysis (if Gemini key available)
    let aiAnalysis = null;
    if (process.env.GEMINI_API_KEY) {
        aiAnalysis = await brain.geminiCall(
            `Write a 100-word plain-English explanation for consumers about this FDA ${type} recall:
Company: ${company}
Product: ${product.substring(0, 150)}
Reason: ${reason.substring(0, 200)}
Class: ${sev.label} — ${sev.desc}

Explain: what this recall means, who is affected, what to do with the product, and any health risks in plain language. No markdown. No headers. Just one clear paragraph.`, 180
        );
    }

    const analysisSection = aiAnalysis 
        ? `<h2 style="font-size:20px;font-weight:800;margin:32px 0 12px;">What This Means for You</h2>
           <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:32px;">${aiAnalysis}</p>`
        : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${title} | VulnScan Intelligence</title>
    <meta name="description" content="${metaDesc}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="https://vulnscan.tech/${slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org", "@type": "NewsArticle",
        "headline": title, "description": metaDesc,
        "datePublished": date + "T00:00:00+00:00", "dateModified": TODAY + "T00:00:00+00:00",
        "author": { "@type": "Organization", "name": "VulnScan Intelligence" },
        "publisher": { "@type": "Organization", "name": "VulnScan", "url": "https://vulnscan.tech" }
    })}</script>
    <script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": `What did ${company} recall?`, "acceptedAnswer": { "@type": "Answer", "text": `${company} recalled ${product.substring(0, 200)} due to: ${reason.substring(0, 200)}. This is a ${sev.label} recall affecting distribution area: ${states.substring(0, 100)}.` } },
            { "@type": "Question", "name": `Is the ${company} recall serious?`, "acceptedAnswer": { "@type": "Answer", "text": `This is a ${sev.label} FDA recall. ${sev.desc}. Follow FDA guidance and stop using the recalled product immediately if you have it.` } }
        ]
    })}</script>
</head>
<body>
    <div class="bg-grid"></div><div class="bg-glow bg-glow-1"></div><div class="bg-glow bg-glow-2"></div>
    <nav class="nav">
        <div class="nav-inner">
            <div class="logo"><div class="logo-icon">⚡</div><a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a></div>
            <div class="nav-links"><a href="/blog">Blog</a><a href="/cve-scanner">CVE DB</a><a href="/fda-recalls">FDA Recalls</a><a href="/pro">Pro</a><a href="/" class="nav-cta">Free Scan</a></div>
        </div>
    </nav>
    <main style="max-width:860px;margin:0 auto;padding:100px 32px 60px;position:relative;z-index:1;">
        <nav style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">
            <a href="/" style="color:var(--text-muted);text-decoration:none;">Home</a> /
            <a href="/fda-recalls" style="color:var(--text-muted);text-decoration:none;">FDA Recalls</a> /
            <span style="color:var(--accent);">${company} Recall</span>
        </nav>
        <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:100px;background:rgba(${sev.color.includes('4444')?'239,68,68':sev.color.includes('7316')?'249,115,22':'234,179,8'},0.12);border:1px solid rgba(${sev.color.includes('4444')?'239,68,68':sev.color.includes('7316')?'249,115,22':'234,179,8'},0.3);font-size:12px;font-weight:700;color:${sev.color};margin-bottom:16px;">🚨 ${sev.label} FDA RECALL — ${date}</div>
        <h1 style="font-size:clamp(24px,4vw,42px);font-weight:800;line-height:1.2;letter-spacing:-0.5px;margin-bottom:16px;">${company} <span class="gradient-text">Recall ${THIS_YEAR}</span></h1>
        <p style="font-size:16px;color:var(--text-secondary);line-height:1.8;margin-bottom:32px;"><strong>${sev.label}</strong> — ${sev.desc}. Issued: ${date}. Distribution: ${states.substring(0, 100)}.</p>

        <div style="padding:16px 20px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;margin-bottom:32px;">
            <strong>⚠️ Recall Reason:</strong> <span style="color:var(--text-secondary);">${reason}</span>
        </div>

        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:24px;margin-bottom:32px;">
            <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">Recall Details</h2>
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);width:35%;">Company</td><td style="padding:10px 0;font-weight:700;">${company}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);">Product</td><td style="padding:10px 0;font-weight:600;">${product.substring(0, 200)}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);">Classification</td><td style="padding:10px 0;font-weight:700;color:${sev.color};">${sev.label}</td></tr>
                ${codeInfo ? `<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);">Lot/Code Info</td><td style="padding:10px 0;">${codeInfo.substring(0, 200)}</td></tr>` : ''}
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);">Distribution</td><td style="padding:10px 0;">${states.substring(0, 150)}</td></tr>
                <tr><td style="padding:10px 0;color:var(--text-secondary);">Official Source</td><td style="padding:10px 0;"><a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" target="_blank" rel="noopener noreferrer" style="color:var(--accent);">FDA.gov Recalls Database ↗</a></td></tr>
            </table>
        </div>

        ${analysisSection}

        <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">What To Do</h2>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:40px;">
            <ol style="color:var(--text-secondary);line-height:2.2;padding-left:20px;">
                <li>Stop using the recalled product immediately</li>
                <li>Check the lot number / code info matches yours (see above)</li>
                <li>Do not use or consume the product — return to point of purchase or dispose</li>
                <li>Contact ${company} for refund/return information</li>
                <li>If you've experienced adverse effects, contact your healthcare provider and report to FDA at 1-800-FDA-1088</li>
            </ol>
        </div>

        <div style="padding:32px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1));border:1px solid rgba(99,102,241,0.2);border-radius:16px;text-align:center;">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Stay Ahead of Every Recall</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;">Get instant alerts when the FDA announces recalls before news sites pick it up.</p>
            <a href="/pro" class="cta-btn" style="text-decoration:none;display:inline-block;">Get Recall Alerts — $9/mo →</a>
        </div>
    </main>
    <footer class="footer">
        <div class="footer-inner">
            <div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></div>
            <div class="footer-links"><a href="/">Home</a><a href="/fda-recalls">FDA Recalls</a><a href="/cve-scanner">CVE DB</a><a href="/pro">Pro</a></div>
            <p class="footer-copy">© ${THIS_YEAR} VulnScan Intelligence. Data from openFDA public API. Not medical advice.</p>
        </div>
    </footer>
    <script src="app.js"></script>
</body>
</html>`;

    return { slug, html };
}

async function main() {
    console.log(`\n⚡ SOVEREIGN: FDA Recall Monitor — ${TODAY}\n`);

    // Fetch recent recalls from openFDA (free, no key)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');
    const [drugRecalls, deviceRecalls] = await Promise.all([
        httpGet(`https://api.fda.gov/drug/enforcement.json?search=recall_initiation_date:[${cutoff}+TO+${TODAY.replace(/-/g,'')}]&limit=30&sort=recall_initiation_date:desc`),
        httpGet(`https://api.fda.gov/food/enforcement.json?search=recall_initiation_date:[${cutoff}+TO+${TODAY.replace(/-/g,'')}]&limit=20&sort=recall_initiation_date:desc`)
    ]);

    const drugs = drugRecalls?.results || [];
    const foods = deviceRecalls?.results || [];
    console.log(`Drug recalls (last 30 days): ${drugs.length}`);
    console.log(`Food recalls (last 30 days): ${foods.length}`);

    // Prioritize Class I (most severe, most searched)
    const prioritized = [
        ...drugs.filter(r => r.classification?.includes('I')).map(r => ({ ...r, _type: 'drug' })),
        ...foods.filter(r => r.classification?.includes('I')).map(r => ({ ...r, _type: 'food' })),
        ...drugs.filter(r => !r.classification?.includes('I')).map(r => ({ ...r, _type: 'drug' })),
        ...foods.filter(r => !r.classification?.includes('I')).map(r => ({ ...r, _type: 'food' }))
    ];

    const generatedSlugs = [];
    for (const recall of prioritized.slice(0, 40)) {
        const { slug, html } = await generateRecallPage(recall, recall._type);
        const filePath = path.join(ROOT, `${slug}.html`);
        if (fs.existsSync(filePath)) continue;

        fs.writeFileSync(filePath, html, 'utf-8');
        generatedSlugs.push(slug);
        console.log(`✅ ${recall.classification || '?'}: ${recall.recalling_firm} → ${slug}`);
        await new Promise(r => setTimeout(r, 500));
    }

    if (!generatedSlugs.length) { console.log('All recall pages current.'); return; }

    // Update sitemap
    const sitemapPath = path.join(ROOT, 'sitemap.xml');
    let sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf-8') : '';
    for (const slug of generatedSlugs) {
        const url = `https://vulnscan.tech/${slug}`;
        if (!sitemap.includes(url)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n</urlset>`);
    }
    fs.writeFileSync(sitemapPath, sitemap, 'utf-8');

    // Ping IndexNow
    const result = await httpPost('api.indexnow.org', '/indexnow', {
        host: 'vulnscan.tech', key: INDEXNOW_KEY,
        keyLocation: `https://vulnscan.tech/${INDEXNOW_KEY}.txt`,
        urlList: generatedSlugs.map(s => `https://vulnscan.tech/${s}`).slice(0, 100)
    });
    console.log(`\n⚡ FDA Monitor complete! ${generatedSlugs.length} recall pages generated. IndexNow: ${result.status}`);
}

main().catch(e => { console.error('FDA monitor error:', e.message); process.exit(0); });
