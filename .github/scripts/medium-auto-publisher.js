#!/usr/bin/env node
/**
 * ARCHITECT MODE — Medium Auto-Publisher
 * 
 * Platform: medium.com (100M monthly visitors, own recommendation algorithm)
 * Revenue: Medium Partner Program — pays per read, deposited to Stripe
 * 
 * Zero dependency on vulnscan.tech or any existing stack.
 * Zero domain needed. Medium is the platform.
 * 
 * What this does:
 * 1. Pulls top critical CVEs from NVD (free API)
 * 2. Uses Gemini to write a unique, readable security article
 * 3. Publishes to Medium automatically
 * 4. Medium's algorithm surfaces it to security-interested readers
 * 5. Reads = Partner Program income → your Stripe account
 * 
 * Setup (one time, 10 min):
 * 1. medium.com → get free account
 * 2. medium.com/me/settings/security → Integration tokens → generate token
 * 3. Add MEDIUM_TOKEN to GitHub Secrets
 * 4. Enable Medium Partner Program (medium.com/me/partner/enrollment)
 * 
 * After that: GitHub Actions runs this weekly. Forever. Zero work.
 */

const https = require('https');
const fs = require('fs');

const MEDIUM_TOKEN = process.env.MEDIUM_TOKEN || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const TODAY = new Date().toISOString().split('T')[0];
const THIS_WEEK = `Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url, headers = {}) {
    return new Promise((resolve) => {
        try {
            const u = new URL(url);
            https.get({ hostname: u.hostname, path: u.pathname + u.search, timeout: 30000, headers: { 'User-Agent': 'Medium-Security-Publisher/1.0', Accept: 'application/json', ...headers } }, res => {
                let d = ''; res.on('data', c => d += c);
                res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
            }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
        } catch { resolve(null); }
    });
}

function httpPost(hostname, path, body, headers = {}) {
    return new Promise((resolve) => {
        const d = JSON.stringify(body);
        const req = https.request({ hostname, path, method: 'POST', timeout: 30000, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d), 'User-Agent': 'Medium-Publisher/1.0', ...headers } }, res => {
            let s = ''; res.on('data', c => s += c);
            res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(s) }); } catch { resolve({ status: res.statusCode, body: s }); } });
        });
        req.on('error', e => resolve({ status: 0, body: e.message }));
        req.write(d); req.end();
    });
}

async function gemini(prompt) {
    if (!GEMINI_KEY) return null;
    await delay(4200); // Stay under free rate limit
    return new Promise((resolve) => {
        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1200, temperature: 0.7 }
        });
        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
            method: 'POST', timeout: 30000,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve(JSON.parse(d)?.candidates?.[0]?.content?.parts?.[0]?.text || null); }
                catch { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.write(body); req.end();
    });
}

async function fetchTopCVEs() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 19) + '.000';
    const now = new Date().toISOString().substring(0, 19) + '.000';
    const data = await httpGet(`https://services.nvd.nist.gov/rest/json/cves/2.0?cvssV3Severity=CRITICAL&pubStartDate=${since}&pubEndDate=${now}&resultsPerPage=10`);
    if (!data?.vulnerabilities?.length) return [];
    const epssData = await httpGet(`https://api.first.org/data/v1/epss?cve=${data.vulnerabilities.slice(0, 5).map(v => v.cve.id).join(',')}`);
    const epssMap = {};
    if (epssData?.data) epssData.data.forEach(e => { epssMap[e.cve] = parseFloat(e.epss); });
    return data.vulnerabilities.slice(0, 5).map(v => {
        const m = v.cve.metrics?.cvssMetricV31?.[0] || v.cve.metrics?.cvssMetricV30?.[0];
        return {
            id: v.cve.id,
            score: m?.cvssData?.baseScore || 0,
            desc: v.cve.descriptions?.find(d => d.lang === 'en')?.value?.substring(0, 300) || '',
            epss: epssMap[v.cve.id] || 0,
            published: v.cve.published?.split('T')[0] || TODAY
        };
    }).sort((a, b) => b.epss - a.epss || b.score - a.score);
}

async function getMediumUserId() {
    const data = await httpGet('https://api.medium.com/v1/me', { Authorization: `Bearer ${MEDIUM_TOKEN}` });
    return data?.data?.id || null;
}

async function publishToMedium(userId, title, content, tags) {
    return httpPost('api.medium.com', `/v1/users/${userId}/posts`, {
        title,
        contentFormat: 'html',
        content,
        tags: tags.slice(0, 5),
        publishStatus: 'public',
        notifyFollowers: true
    }, { Authorization: `Bearer ${MEDIUM_TOKEN}` });
}

function buildArticleHTML(title, intro, cveItems, conclusion, ctaUrl) {
    const cveHTML = cveItems.map(item => `
<h2>${item.title}</h2>
<p><strong>CVE ID:</strong> ${item.id} | <strong>CVSS Score:</strong> ${item.score}/10 | <strong>Exploit Probability:</strong> ${(item.epss * 100).toFixed(1)}%</p>
<p>${item.analysis}</p>
<p><em>Published: ${item.published}</em></p>
<hr/>`).join('');

    return `<h1>${title}</h1>
<p>${intro}</p>
<hr/>
${cveHTML}
<h2>Stay Ahead of Every Critical CVE</h2>
<p>${conclusion}</p>
<p>For real-time CVE monitoring, security scanning, and instant alerts when critical vulnerabilities affect your stack, visit <a href="${ctaUrl}">VulnScan Security Intelligence</a>.</p>
<p><em>Data sourced from NIST National Vulnerability Database (NVD) and FIRST.org EPSS. Published by VulnScan Security Research.</em></p>`;
}

async function main() {
    console.log(`\n⚡ ARCHITECT MODE: Medium Auto-Publisher — ${TODAY}\n`);

    if (!MEDIUM_TOKEN) {
        console.log('No MEDIUM_TOKEN found.');
        console.log('\nSetup (10 min, one-time):');
        console.log('1. Create account: medium.com');
        console.log('2. Get token: medium.com/me/settings/security → Integration tokens');
        console.log('3. Add as GitHub Secret: MEDIUM_TOKEN');
        console.log('4. Enable Partner Program: medium.com/me/partner/enrollment');
        console.log('\nOnce set, this script publishes automatically every week and earns Partner Program income.');
        return;
    }

    if (!GEMINI_KEY) {
        console.log('No GEMINI_API_KEY — add to GitHub Secrets for AI-enhanced articles.');
        return;
    }

    // Get Medium user ID
    const userId = await getMediumUserId();
    if (!userId) { console.log('Could not authenticate with Medium. Check MEDIUM_TOKEN.'); return; }
    console.log(`Authenticated as Medium user: ${userId}`);

    // Fetch top CVEs
    console.log('Fetching top critical CVEs...');
    const cves = await fetchTopCVEs();
    if (!cves.length) { console.log('No new critical CVEs this week.'); return; }
    console.log(`Found ${cves.length} critical CVEs to cover`);

    // Use Gemini to write the article intro
    const cveList = cves.map(c => `${c.id} (CVSS ${c.score}, ${(c.epss * 100).toFixed(1)}% exploit chance): ${c.desc.substring(0, 150)}`).join('\n');
    const intro = await gemini(`Write a compelling 100-word intro paragraph for a Medium security article about this week's critical CVEs. Make it urgent but informative. These are the CVEs: ${cveList}. No markdown.`) || 'This week brought several critical vulnerabilities that security teams need to address immediately. Here are the most important ones to know about.';

    const conclusion = await gemini(`Write a 60-word conclusion for a Medium security article about CVE monitoring. Mention that staying ahead of CVEs protects businesses. No markdown. No links.`) || 'Staying ahead of critical vulnerabilities is no longer optional — it\'s the difference between a secure operation and a breach. Subscribe to receive weekly CVE intelligence directly in your inbox.';

    // Generate analysis for each CVE
    const cveItems = [];
    for (const cve of cves.slice(0, 5)) {
        const analysis = await gemini(`Write a 120-word analysis of ${cve.id} for a Medium security article. CVSS: ${cve.score}/10. Exploit probability: ${(cve.epss * 100).toFixed(1)}%. Details: ${cve.desc.substring(0, 200)}. Cover: what's vulnerable, who's at risk, what to do. No markdown. Just a paragraph.`) || cve.desc;
        cveItems.push({ ...cve, title: `🔴 ${cve.id} — CVSS ${cve.score} (${(cve.epss * 100).toFixed(1)}% Exploit Probability)`, analysis });
    }

    const articleTitle = `Critical CVE Alert: ${THIS_WEEK} — ${cves.length} Vulnerabilities You Can't Ignore`;
    const html = buildArticleHTML(articleTitle, intro, cveItems, conclusion, 'https://vulnscan.tech');
    const tags = ['Cybersecurity', 'Security', 'CVE', 'Vulnerabilities', 'Technology'];

    // Publish to Medium
    console.log('Publishing to Medium...');
    const result = await publishToMedium(userId, articleTitle, html, tags);
    console.log(`Medium publish status: ${result.status}`);

    if (result.status === 201) {
        const url = result.body?.data?.url || 'unknown';
        console.log(`\n✅ PUBLISHED: ${url}`);
        console.log('Medium Partner Program will track reads and pay you per engagement.');
        console.log('Expect first payment when article accumulates 100+ member reads.');
        // Save publish log
        const logPath = 'medium-publish-log.json';
        const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf-8')) : [];
        log.push({ date: TODAY, title: articleTitle, url, cves: cves.map(c => c.id) });
        fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    } else {
        console.log('Publish failed:', JSON.stringify(result.body).substring(0, 300));
    }
}

main().catch(e => { console.error('Error:', e.message); process.exit(0); });
