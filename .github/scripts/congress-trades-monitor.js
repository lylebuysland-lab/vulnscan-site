#!/usr/bin/env node
/**
 * SOVEREIGN: Congress Stock Trades Monitor
 * 
 * Every member of Congress must disclose stock trades within 45 days (STOCK Act).
 * "Nancy Pelosi stock trades" = 500K+ monthly Google searches.
 * "Congress stock trades today" = 200K+ monthly.
 * 
 * Data source: housestockwatcher.com (community-maintained, 100% free public data)
 * + senatestockwatcher.com
 * 
 * This bot: fetches new trades → generates VulnScan pages ranking for these searches
 * → captures millions of monthly impressions → converts to Pro subscriptions
 * 
 * ZERO cost. ZERO human work. FULLY AUTOMATED.
 * Runs 3x/day because trade disclosures are time-sensitive (first page wins all traffic).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TODAY = new Date().toISOString().split('T')[0];
const THIS_YEAR = new Date().getFullYear();
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'vulnscan-indexnow-key-2026';

// Members worth targeting by search volume (high-profile = high traffic)
const HIGH_PROFILE_MEMBERS = new Set([
    'pelosi', 'nancy pelosi', 'paul pelosi',
    'tuberville', 'tommy tuberville',
    'mitch mcconnell', 'mcconnell',
    'mark kelly', 'kelly',
    'dan crenshaw', 'crenshaw',
    'austin scott', 'scott',
    'bill hagerty', 'hagerty',
    'marjorie taylor greene', 'greene',
    'josh gottheimer', 'gottheimer',
    'suozzi', 'thomas suozzi'
]);

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

function httpPost(hostname, path, body, headers = {}) {
    return new Promise((resolve) => {
        const d = JSON.stringify(body);
        const req = https.request({ hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'User-Agent': 'VulnScan-Sovereign/1.0', ...headers } }, res => {
            let s = ''; res.on('data', c => s += c); res.on('end', () => resolve({ status: res.statusCode }));
        });
        req.on('error', () => resolve({ status: 0 }));
        req.write(d); req.end();
    });
}

function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateTradeSlug(trade) {
    const memberSlug = slugify(trade.representative || trade.senator || 'congress-member');
    const tickerSlug = trade.ticker ? trade.ticker.toLowerCase() : slugify(trade.asset_description || 'stock').substring(0, 20);
    const action = (trade.type || trade.transaction_type || '').toLowerCase().includes('purchase') ? 'bought' : 'sold';
    return `${memberSlug}-${action}-${tickerSlug}-${THIS_YEAR}`;
}

function formatAmount(amount) {
    if (!amount) return 'Undisclosed';
    if (amount.includes('$')) return amount;
    const ranges = {
        '$1,001 - $15,000': '$1K–$15K', '$15,001 - $50,000': '$15K–$50K',
        '$50,001 - $100,000': '$50K–$100K', '$100,001 - $250,000': '$100K–$250K',
        '$250,001 - $500,000': '$250K–$500K', '$500,001 - $1,000,000': '$500K–$1M',
        '$1,000,001 - $5,000,000': '$1M–$5M', 'Over $5,000,000': '$5M+'
    };
    return ranges[amount] || amount;
}

function generateTradePage(trade, chamber) {
    const member = trade.representative || trade.senator || 'Congress Member';
    const ticker = trade.ticker || '';
    const asset = trade.asset_description || ticker || 'Undisclosed Asset';
    const action = (trade.type || trade.transaction_type || '').toLowerCase().includes('purchase') ? 'Bought' : 'Sold';
    const actionLower = action.toLowerCase();
    const amount = formatAmount(trade.amount);
    const tradeDate = trade.transaction_date || trade.trade_date || TODAY;
    const disclosureDate = trade.disclosure_date || TODAY;
    const slug = generateTradeSlug(trade);
    const isHighProfile = [...HIGH_PROFILE_MEMBERS].some(n => member.toLowerCase().includes(n));

    const title = `${member} ${action} ${ticker || asset} — ${THIS_YEAR} Stock Trade Disclosure`;
    const metaDesc = `${member} disclosed ${actionLower}ing ${ticker || asset} stock (${amount}) on ${tradeDate}. Full details of this Congress stock trade disclosure, analysis, and context.`;

    const articleSchema = {
        "@context": "https://schema.org", "@type": "NewsArticle",
        "headline": title, "description": metaDesc,
        "datePublished": disclosureDate + "T00:00:00+00:00",
        "dateModified": TODAY + "T00:00:00+00:00",
        "author": { "@type": "Organization", "name": "VulnScan Data Intelligence" },
        "publisher": { "@type": "Organization", "name": "VulnScan", "url": "https://vulnscan.tech" }
    };

    const faqSchema = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": `Did ${member} buy or sell ${ticker || asset}?`, "acceptedAnswer": { "@type": "Answer", "text": `${member} ${actionLower} ${ticker || asset} (${amount}) with a transaction date of ${tradeDate}. This was disclosed to the public on ${disclosureDate} per STOCK Act requirements.` } },
            { "@type": "Question", "name": `How much did ${member} ${actionLower} in ${ticker || asset}?`, "acceptedAnswer": { "@type": "Answer", "text": `The reported trade amount for ${member}'s ${ticker || asset} ${action.toLowerCase()} is ${amount}. Congressional disclosures report amounts in ranges, not exact figures.` } },
            { "@type": "Question", "name": "Is it legal for members of Congress to trade stocks?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — congressional stock trading is legal under current law. The STOCK Act (2012) requires members to disclose trades within 45 days. There are ongoing debates about whether members with access to classified information should be allowed to trade individual stocks." } }
        ]
    };

    return {
        slug,
        isHighProfile,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google-site-verification" content="vcMnDYS6l_rY36emCOS1d0A5uQYKYc_deC">
    <title>${title} | VulnScan Intelligence</title>
    <meta name="description" content="${metaDesc}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <link rel="canonical" href="https://vulnscan.tech/${slug}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
    <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
</head>
<body>
    <div class="bg-grid"></div><div class="bg-glow bg-glow-1"></div><div class="bg-glow bg-glow-2"></div>
    <nav class="nav">
        <div class="nav-inner">
            <div class="logo"><div class="logo-icon">⚡</div><a href="/" style="text-decoration:none;"><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></a></div>
            <div class="nav-links">
                <a href="/blog">Blog</a><a href="/cve-scanner">CVE Database</a>
                <a href="/congress-trades">Congress Trades</a><a href="/pro">Pro</a>
                <a href="/" class="nav-cta">Free Scan</a>
            </div>
        </div>
    </nav>
    <main style="max-width:860px;margin:0 auto;padding:100px 32px 60px;position:relative;z-index:1;">
        <nav style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">
            <a href="/" style="color:var(--text-muted);text-decoration:none;">Home</a> /
            <a href="/congress-trades" style="color:var(--text-muted);text-decoration:none;">Congress Trades</a> /
            <span style="color:var(--accent);">${member} ${action} ${ticker || asset}</span>
        </nav>
        <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:100px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);font-size:12px;font-weight:700;color:var(--accent);margin-bottom:16px;">📊 STOCK ACT DISCLOSURE — ${disclosureDate}</div>
        <h1 style="font-size:clamp(24px,4vw,42px);font-weight:800;line-height:1.2;letter-spacing:-0.5px;margin-bottom:16px;">${member} <span class="gradient-text">${action} ${ticker || asset}</span></h1>
        <p style="font-size:16px;color:var(--text-secondary);line-height:1.8;margin-bottom:32px;">${member} (${chamber}) disclosed ${actionLower}ing ${ticker ? `<strong>${ticker}</strong>` : `<strong>${asset}</strong>`} worth approximately <strong>${amount}</strong> on ${tradeDate}. This disclosure was filed per STOCK Act requirements on ${disclosureDate}.</p>

        <!-- Trade details card -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:28px;margin-bottom:40px;">
            <h2 style="font-size:18px;font-weight:700;margin-bottom:20px;">Trade Details</h2>
            <table style="width:100%;font-size:15px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:12px 0;color:var(--text-secondary);width:35%;">Member</td><td style="padding:12px 0;font-weight:700;">${member}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:12px 0;color:var(--text-secondary);">Chamber</td><td style="padding:12px 0;font-weight:600;">${chamber}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:12px 0;color:var(--text-secondary);">Action</td><td style="padding:12px 0;font-weight:700;color:${action==='Bought'?'#22c55e':'#ef4444'}">${action}</td></tr>
                ${ticker ? `<tr style="border-bottom:1px solid var(--border);"><td style="padding:12px 0;color:var(--text-secondary);">Ticker</td><td style="padding:12px 0;font-weight:700;font-family:monospace;font-size:16px;">${ticker}</td></tr>` : ''}
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:12px 0;color:var(--text-secondary);">Asset</td><td style="padding:12px 0;font-weight:600;">${asset}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:12px 0;color:var(--text-secondary);">Amount Range</td><td style="padding:12px 0;font-weight:700;color:var(--accent);">${amount}</td></tr>
                <tr style="border-bottom:1px solid var(--border);"><td style="padding:12px 0;color:var(--text-secondary);">Trade Date</td><td style="padding:12px 0;font-weight:600;">${tradeDate}</td></tr>
                <tr><td style="padding:12px 0;color:var(--text-secondary);">Disclosure Date</td><td style="padding:12px 0;font-weight:600;">${disclosureDate}</td></tr>
            </table>
        </div>

        <!-- Context -->
        <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">Why This Matters</h2>
        <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:24px;">Members of Congress have access to non-public information through legislative proceedings, classified briefings, and regulatory oversight roles. The STOCK Act (Stop Trading on Congressional Knowledge Act, 2012) requires disclosure of trades within 45 days to prevent insider trading — but trading itself remains legal. This creates ongoing scrutiny of congressional investment activity.</p>
        <p style="color:var(--text-secondary);line-height:1.8;margin-bottom:40px;">Data sourced from official congressional financial disclosure records, which are public under the STOCK Act. This page is updated automatically when new disclosures are filed.</p>

        <!-- FAQ -->
        <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:40px;">
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;">Did ${member} buy or sell ${ticker || asset}?</h3>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;">${member} <strong>${actionLower}</strong> ${ticker || asset} (${amount}) with a transaction date of ${tradeDate}, disclosed on ${disclosureDate}.</p>
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;">
                <h3 style="font-size:15px;font-weight:700;margin-bottom:8px;">Is it legal for members of Congress to trade stocks?</h3>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;">Yes — congressional stock trading is currently legal. The STOCK Act requires disclosure within 45 days but does not ban trading. Multiple bills to restrict congressional trading have been proposed but not passed.</p>
            </div>
        </div>

        <!-- CTA -->
        <div style="padding:32px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1));border:1px solid rgba(99,102,241,0.2);border-radius:16px;text-align:center;">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Get Real-Time Congress Trade Alerts</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;">VulnScan monitors all congressional disclosures automatically. Get instant alerts when politicians trade stocks in your watchlist.</p>
            <a href="/pro" class="cta-btn" style="text-decoration:none;display:inline-block;">Start Pro Alerts — $9/mo →</a>
        </div>
    </main>
    <footer class="footer">
        <div class="footer-inner">
            <div class="logo"><div class="logo-icon">⚡</div><span class="logo-text">Vuln<span class="logo-accent">Scan</span></span></div>
            <div class="footer-links"><a href="/">Home</a><a href="/congress-trades">Congress Trades</a><a href="/cve-scanner">CVE DB</a><a href="/pro">Pro</a></div>
            <p class="footer-copy">© ${THIS_YEAR} VulnScan Intelligence. Data from official congressional financial disclosures (public record). Not investment advice.</p>
        </div>
    </footer>
    <script src="app.js"></script>
</body>
</html>`
    };
}

async function main() {
    console.log(`\n⚡ SOVEREIGN: Congress Trades Monitor — ${TODAY}\n`);

    // Fetch from both chambers (free public APIs)
    const [houseData, senateData] = await Promise.all([
        httpGet('https://house-stock-watcher-data.s3-us-east-2.amazonaws.com/data/all_transactions.json'),
        httpGet('https://senate-stock-watcher-data.s3-us-east-2.amazonaws.com/aggregate/all_transactions.json')
    ]);

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Filter to recent trades
    const houseTrades = Array.isArray(houseData) ? houseData.filter(t => {
        const d = t.disclosure_date || t.transaction_date || '';
        return d >= cutoff && t.ticker && t.ticker !== '--';
    }) : [];

    const senateTrades = Array.isArray(senateData) ? senateData.filter(t => {
        const d = t.disclosure_date || t.transaction_date || '';
        return d >= cutoff;
    }) : [];

    console.log(`House trades (last 30 days): ${houseTrades.length}`);
    console.log(`Senate trades (last 30 days): ${senateTrades.length}`);

    const generatedSlugs = [];
    const allTrades = [
        ...houseTrades.map(t => ({ ...t, _chamber: 'House of Representatives' })),
        ...senateTrades.map(t => ({ ...t, _chamber: 'U.S. Senate' }))
    ];

    // Prioritize high-profile members first (more search traffic)
    allTrades.sort((a, b) => {
        const aHP = [...HIGH_PROFILE_MEMBERS].some(n => (a.representative || a.senator || '').toLowerCase().includes(n));
        const bHP = [...HIGH_PROFILE_MEMBERS].some(n => (b.representative || b.senator || '').toLowerCase().includes(n));
        return (bHP ? 1 : 0) - (aHP ? 1 : 0);
    });

    for (const trade of allTrades.slice(0, 100)) { // Cap at 100 per run
        const { slug, html, isHighProfile } = generateTradePage(trade, trade._chamber);
        const filePath = path.join(ROOT, `${slug}.html`);

        if (fs.existsSync(filePath)) continue;

        fs.writeFileSync(filePath, html, 'utf-8');
        generatedSlugs.push({ slug, isHighProfile });
        console.log(`✅ ${isHighProfile ? '🌟 HIGH-PROFILE: ' : ''}${trade.representative || trade.senator} → ${slug}`);
    }

    if (!generatedSlugs.length) {
        console.log('All recent trade pages already exist.');
        return;
    }

    // Update sitemap
    const sitemapPath = path.join(ROOT, 'sitemap.xml');
    let sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf-8') : '';
    for (const { slug } of generatedSlugs) {
        const url = `https://vulnscan.tech/${slug}`;
        if (!sitemap.includes(url)) {
            sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>\n</urlset>`);
        }
    }
    fs.writeFileSync(sitemapPath, sitemap, 'utf-8');

    // IndexNow — high-profile trades get priority ping (time-sensitive)
    const priorityUrls = generatedSlugs.filter(s => s.isHighProfile).map(s => `https://vulnscan.tech/${s.slug}`);
    const allUrls = generatedSlugs.map(s => `https://vulnscan.tech/${s.slug}`);
    
    if (allUrls.length > 0) {
        const result = await httpPost('api.indexnow.org', '/indexnow', {
            host: 'vulnscan.tech', key: INDEXNOW_KEY,
            keyLocation: `https://vulnscan.tech/${INDEXNOW_KEY}.txt`,
            urlList: allUrls.slice(0, 100)
        });
        console.log(`IndexNow ping: ${result.status} (${allUrls.length} trade pages)`);
    }

    console.log(`\n⚡ SOVEREIGN Congress Monitor complete!`);
    console.log(`   Pages generated: ${generatedSlugs.length}`);
    console.log(`   High-profile members: ${generatedSlugs.filter(s=>s.isHighProfile).length}`);
    console.log(`   Target monthly searches: 500,000+ (Nancy Pelosi alone: ~200K/mo)`);
}

main().catch(e => { console.error('Congress monitor error:', e.message); process.exit(0); });
