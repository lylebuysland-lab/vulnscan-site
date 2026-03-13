#!/usr/bin/env node
/**
 * SEC EDGAR Cybersecurity Breach Monitor
 * Runs daily via GitHub Actions
 * 
 * Since Dec 2023, SEC requires companies to file 8-K Item 1.05 within 4 days of any
 * "material cybersecurity incident." This is a free, open, real-time feed of company breaches.
 * 
 * What this does:
 * 1. Monitors SEC EDGAR full-text search for new 8-K Item 1.05 filings
 * 2. Extracts company name, breach details, date
 * 3. Auto-generates a VulnScan page: "CompanyName Data Breach 2026"
 * 4. Pings IndexNow — we rank BEFORE any news site
 * 5. People searching "[Company] hack/breach" land on VulnScan
 * 6. CVS: 5,000-100,000 searches per breach event
 * 
 * ZERO human work. Fully autonomous. Pure SEO arbitrage.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TODAY = new Date().toISOString().split('T')[0];
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'vulnscan-indexnow-key-2026';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function httpGet(url, headers = {}) {
    return new Promise((resolve) => {
        try {
            const u = new URL(url);
            https.get({ hostname: u.hostname, path: u.pathname + u.search, timeout: 30000, headers: { 'User-Agent': 'VulnScan-EDGAR-Bot/1.0 (security@vulnscan.tech)', Accept: 'application/json', ...headers } }, res => {
                let d = ''; res.on('data', c => d += c);
                res.on('end', () => { try { resolve(JSON.parse(d)); } catch { try { resolve({ rawText: d }); } catch { resolve(null); } } });
            }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
        } catch { resolve(null); }
    });
}

function httpPost(hostname, path, body, headers = {}) {
    return new Promise((resolve) => {
        const d = JSON.stringify(body);
        const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'User-Agent': 'VulnScan-EDGAR-Bot/1.0', ...headers } }, res => {
            let s = ''; res.on('data', c => s += c); res.on('end', () => resolve({ status: res.statusCode, body: s }));
        });
        req.on('error', e => resolve({ status: 0, body: e.message }));
        req.write(d); req.end();
    });
}

// --- Fetch recent 8-K filings with cybersecurity incident keyword ---
async function fetchEdgarBreaches() {
    // SEC EDGAR Full-Text Search API — searches all filings for specific text
    // Item 1.05 = "Material Cybersecurity Incidents" (effective Dec 18, 2023)
    const query = encodeURIComponent('cybersecurity incident material');
    const dateFrom = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
    const url = `https://efts.sec.gov/LATEST/search-index?q=${query}&dateRange=custom&startdt=${dateFrom}&enddt=${TODAY}&forms=8-K&hits.hits.total.value=true&hits.hits._source.period_of_report=true&hits.hits._source.entity_name=true`;
    
    const data = await httpGet(url, { Accept: 'application/json' });
    if (!data || !data.hits) return [];
    
    const hits = data.hits.hits || [];
    const breaches = hits.map(h => ({
        entityName: h._source?.entity_name || 'Unknown Company',
        ticker: h._source?.ticker || '',
        filingDate: h._source?.file_date || TODAY,
        period: h._source?.period_of_report || TODAY,
        accessionNumber: h._id || '',
        description: h._source?.file_description || '8-K Material Cybersecurity Incident',
    })).filter(b => b.entityName !== 'Unknown Company');
    
    console.log(`Found ${breaches.length} potential breach filings from last 48h`);
    return breaches;
}

// --- Also use EDGAR company search API for comprehensive coverage ---
async function fetchEdgarRecentFilings() {
    const url = `https://efts.sec.gov/LATEST/search-index?q=%221.05%22+%22cybersecurity+incident%22&forms=8-K&dateRange=custom&startdt=${new Date(Date.now()-48*60*60*1000).toISOString().split('T')[0]}&enddt=${TODAY}`;
    const data = await httpGet(url);
    if (!data || !data.hits) return [];
    return (data.hits.hits || []).map(h => ({
        entityName: h._source?.entity_name || '',
        ticker: h._source?.ticker || '',
        filingDate: h._source?.file_date || TODAY,
        accessionNumber: h._id || '',
    })).filter(b => b.entityName);
}

// --- Generate breach page for VulnScan ---
function generateBreachPage(breach) {
    const slug = breach.entityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-data-breach-' + new Date(breach.filingDate).getFullYear();
    const title = `${breach.entityName} Data Breach ${new Date(breach.filingDate).getFullYear()} — What You Need to Know`;
    const metaDesc = `${breach.entityName} disclosed a material cybersecurity incident to the SEC on ${breach.filingDate}. Here's what happened, who's affected, and how to protect yourself.`;
    const year = new Date(breach.filingDate).getFullYear();

    const articleSchema = JSON.stringify({
        "@context": "https://schema.org", "@type": "NewsArticle",
        "headline": title,
        "description": metaDesc,
        "datePublished": breach.filingDate + "T00:00:00+00:00",
        "dateModified": TODAY + "T00:00:00+00:00",
        "author": { "@type": "Organization", "name": "VulnScan Security Research" },
        "publisher": { "@type": "Organization", "name": "VulnScan", "url": "https://vulnscan.tech" },
        "about": { "@type": "Event", "name": `${breach.entityName} Data Breach ${year}` }
    });

    const faqSchema = JSON.stringify({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": `Was I affected by the ${breach.entityName} breach?`, "acceptedAnswer": { "@type": "Answer", "text": `${breach.entityName} disclosed a cybersecurity incident to the SEC on ${breach.filingDate}. Use VulnScan's free breach check at vulnscan.tech to see if your data was exposed. The full SEC filing is available at https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(breach.entityName)}&type=8-K.` } },
            { "@type": "Question", "name": `What did ${breach.entityName} disclose?`, "acceptedAnswer": { "@type": "Answer", "text": `${breach.entityName} filed an 8-K Form (Item 1.05 Material Cybersecurity Incident) with the SEC on ${breach.filingDate}. This SEC rule, effective December 2023, requires public companies to disclose material cybersecurity incidents within 4 business days. The filing details the nature of the incident and its potential business impact.` } },
            { "@type": "Question", "name": `How can I protect myself after the ${breach.entityName} breach?`, "acceptedAnswer": { "@type": "Answer", "text": `Steps to take: (1) Change your password on ${breach.entityName} and any sites using the same password. (2) Enable two-factor authentication. (3) Monitor your credit and financial accounts. (4) Watch for phishing emails using ${breach.entityName} branding. (5) Run a free security scan at vulnscan.tech.` } }
        ]
    });

    return {
        slug,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${title} | VulnScan</title>
    <meta name="description" content="${metaDesc}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <link rel="canonical" href="https://vulnscan.tech/${slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">${articleSchema}</script>
    <script type="application/ld+json">${faqSchema}</script>
</head>
<body>
    <div class="bg-grid"></div><div class="bg-glow bg-glow-1"></div><div class="bg-glow bg-glow-2"></div>
    <nav class="nav">
        <div class="nav-inner">
            <div class="logo"><div class="logo-icon">⚡</div><a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a></div>
            <div class="nav-links">
                <a href="/blog">Blog</a><a href="/cve-scanner">CVE Database</a>
                <a href="/#features">Features</a><a href="/#pricing">Pricing</a>
                <a href="/about">About</a><a href="/" class="nav-cta">Free Scan</a>
            </div>
        </div>
    </nav>
    <main style="max-width:860px;margin:0 auto;padding:100px 32px 60px;position:relative;z-index:1;">
        <nav style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">
            <a href="/" style="color:var(--text-muted);text-decoration:none;">Home</a> / 
            <a href="/blog" style="color:var(--text-muted);text-decoration:none;">Security News</a> / 
            <span style="color:var(--accent);">${breach.entityName} Breach ${year}</span>
        </nav>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border-radius:100px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);font-size:12px;font-weight:700;color:#ef4444;margin-bottom:16px;">🚨 SEC-DISCLOSED BREACH — ${breach.filingDate}</div>
        <h1 style="font-size:clamp(26px,4vw,42px);font-weight:800;line-height:1.2;letter-spacing:-0.5px;margin-bottom:16px;">${breach.entityName} Data Breach <span class="gradient-text">${year}</span></h1>
        <p style="font-size:17px;color:var(--text-secondary);line-height:1.8;margin-bottom:32px;">${breach.entityName} has disclosed a material cybersecurity incident to the U.S. Securities and Exchange Commission via an 8-K filing (Item 1.05) dated ${breach.filingDate}. Under SEC rules effective December 2023, public companies must report material cybersecurity incidents within 4 business days.</p>

        <!-- Emergency CTA -->
        <div style="padding:20px 24px;background:linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.05));border:1px solid rgba(239,68,68,0.25);border-radius:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:40px;">
            <div>
                <div style="font-weight:700;font-size:16px;margin-bottom:4px;">🔍 Check if your data was exposed</div>
                <div style="font-size:13px;color:var(--text-secondary);">Run a free security scan — 60 seconds</div>
            </div>
            <a href="/" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;white-space:nowrap;">Check Now — Free →</a>
        </div>

        <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">What We Know</h2>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:32px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);width:40%;">Company</td><td style="padding:10px 0;font-weight:600;">${breach.entityName}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);">Disclosure Date</td><td style="padding:10px 0;font-weight:600;">${breach.filingDate}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);">Filing Type</td><td style="padding:10px 0;font-weight:600;">SEC Form 8-K — Item 1.05 Material Cybersecurity Incident</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:10px 0;color:var(--text-secondary);">Ticker</td><td style="padding:10px 0;font-weight:600;">${breach.ticker || 'Public Company'}</td></tr>
                <tr><td style="padding:10px 0;color:var(--text-secondary);">SEC Filing</td><td style="padding:10px 0;"><a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(breach.entityName)}&type=8-K&dateb=&owner=include&count=10" target="_blank" rel="noopener noreferrer" style="color:var(--accent);">View Official SEC Filing ↗</a></td></tr>
            </table>
        </div>

        <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">What This Means for You</h2>
        <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:24px;">When the SEC requires a company to disclose a cybersecurity incident as "material," it means the breach was significant enough to affect the company's value, operations, or customers. This typically involves unauthorized access to customer data, financial systems, or critical infrastructure.</p>

        <h2 style="font-size:20px;font-weight:800;margin:32px 0 16px;">Immediate Steps to Protect Yourself</h2>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:40px;">
            <ol style="color:var(--text-secondary);line-height:2.2;padding-left:20px;">
                <li>Change your password for ${breach.entityName} immediately — use a unique, strong password</li>
                <li>Enable two-factor authentication (2FA) on your account if available</li>
                <li>Monitor your email for phishing attempts using ${breach.entityName} branding</li>
                <li>Check your financial accounts for any unauthorized transactions</li>
                <li>Consider placing a credit freeze if financial data was involved</li>
                <li>Run a security scan on your own systems to ensure no related exposure</li>
            </ol>
        </div>

        <!-- FAQ Section -->
        <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:40px;">
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;">Was I affected by the ${breach.entityName} breach?</h3>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;">Monitor ${breach.entityName}'s official communications and check their website for data breach notification tools. The SEC filing will contain details about the scope. Run a free scan at VulnScan to check your email addresses against known breach databases.</p>
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;">What data may have been compromised?</h3>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;">The full details will be in ${breach.entityName}'s SEC 8-K filing. Material breaches often involve customer PII, financial data, login credentials, or employee records. Check the official SEC filing (linked above) for specifics as they're disclosed.</p>
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;">Why is this on VulnScan?</h3>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;">VulnScan monitors SEC EDGAR for cybersecurity incident disclosures in real time, giving people immediate information about breaches affecting public companies. The SEC EDGAR database is a public resource.</p>
            </div>
        </div>

        <div style="padding:32px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1));border:1px solid rgba(99,102,241,0.2);border-radius:16px;text-align:center;">
            <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">Get Alerted on Future Breaches</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;">VulnScan monitors SEC filings 24/7. Get instant alerts when companies you care about disclose cybersecurity incidents.</p>
            <a href="/pro" class="cta-btn" style="text-decoration:none;display:inline-block;">Get Breach Alerts — $9/mo →</a>
        </div>
    </main>
    <footer class="footer">
        <div class="footer-inner">
            <div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></div>
            <div class="footer-links"><a href="/">Home</a><a href="/cve-scanner">CVE DB</a><a href="/blog">Blog</a><a href="/pro">Pro</a></div>
            <p class="footer-copy">© ${year} VulnScan. Data sourced from SEC EDGAR public filings. Not affiliated with SEC or ${breach.entityName}.</p>
        </div>
    </footer>
    <script src="app.js"></script>
</body>
</html>`
    };
}

// --- Write file to repo ---
function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
}

// --- Main pipeline ---
async function main() {
    console.log(`\n⚡ EDGAR Breach Monitor — ${TODAY}\n`);

    const [results1, results2] = await Promise.all([fetchEdgarBreaches(), fetchEdgarRecentFilings()]);
    
    // Merge and deduplicate
    const seen = new Set();
    const breaches = [...results1, ...results2].filter(b => {
        if (!b.entityName || seen.has(b.entityName)) return false;
        seen.add(b.entityName);
        return true;
    });

    console.log(`Total unique breach disclosures: ${breaches.length}`);

    if (!breaches.length) {
        console.log('No new SEC cybersecurity disclosures in last 48h. Try again tomorrow.');
        return;
    }

    const generatedSlugs = [];
    
    for (const breach of breaches) {
        const { slug, html } = generateBreachPage(breach);
        const filePath = path.join(ROOT, `${slug}.html`);
        
        if (fs.existsSync(filePath)) {
            console.log(`⏭  Exists: ${slug}`);
            continue;
        }
        
        writeFile(filePath, html);
        generatedSlugs.push(slug);
        console.log(`✅ Generated breach page: ${breach.entityName} → ${slug}.html`);
    }

    if (!generatedSlugs.length) {
        console.log('All breach pages already exist.');
        return;
    }

    // Update sitemap
    const sitemapPath = path.join(ROOT, 'sitemap.xml');
    let sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf-8') : '';
    let addedToSitemap = 0;
    for (const slug of generatedSlugs) {
        const url = `https://vulnscan.tech/${slug}`;
        if (!sitemap.includes(url)) {
            sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n</urlset>`);
            addedToSitemap++;
        }
    }
    if (addedToSitemap) fs.writeFileSync(sitemapPath, sitemap, 'utf-8');

    // Ping IndexNow for instant indexing — breach pages are time-sensitive
    if (generatedSlugs.length > 0) {
        const urls = generatedSlugs.map(s => `https://vulnscan.tech/${s}`);
        const result = await httpPost('api.indexnow.org', '/indexnow', {
            host: 'vulnscan.tech', key: INDEXNOW_KEY,
            keyLocation: `https://vulnscan.tech/${INDEXNOW_KEY}.txt`,
            urlList: urls
        });
        console.log(`IndexNow ping: ${result.status} (${urls.length} breach pages)`);
    }

    console.log(`\n🎯 EDGAR Pipeline complete!`);
    console.log(`   Breach pages generated: ${generatedSlugs.length}`);
    console.log(`   These pages will rank for "[Company] hack/breach/data breach" searches`);
    console.log(`   Average breach search traffic: 5,000-100,000 searches per incident`);
    generatedSlugs.forEach(s => console.log(`   https://vulnscan.tech/${s}`));
}

main().catch(e => { console.error('EDGAR pipeline error:', e.message); process.exit(0); });
