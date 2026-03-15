#!/usr/bin/env node
/**
 * submit-sitemap-to-gsc.js
 * Submits sitemap.xml to Google Search Console via API
 * Uses GSC_SERVICE_ACCOUNT from local environment variable
 * 
 * Usage: node submit-sitemap-to-gsc.js
 */
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');

const SITE = 'https://vulnscan.tech/';
const SITEMAP = 'https://vulnscan.tech/sitemap.xml';

// Read service account from env var or local file
let sa;
const envKey = process.env.GSC_SERVICE_ACCOUNT;
const localPath = 'C:/Users/User/.config/vulnscan-blogs-07c620db4543.json';

if (envKey) {
    sa = JSON.parse(envKey);
    console.log('Using GSC key from environment variable');
} else if (fs.existsSync(localPath)) {
    sa = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    console.log('Using GSC key from local file');
} else {
    console.error('ERROR: No GSC_SERVICE_ACCOUNT found.');
    console.error('Set it as a Windows env var or save the JSON to:', localPath);
    process.exit(1);
}

function base64url(data) {
    return Buffer.from(data).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64url(JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now, exp: now + 3600
    }));

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(header + '.' + payload);
    const signature = sign.sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = header + '.' + payload + '.' + signature;

    return new Promise((resolve, reject) => {
        const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
        const req = https.request({
            hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => {
                const j = JSON.parse(d);
                if (j.access_token) resolve(j.access_token);
                else reject(new Error('Token error: ' + d));
            });
        });
        req.on('error', reject);
        req.write(body); req.end();
    });
}

function apiCall(method, url, token, body) {
    return new Promise((resolve) => {
        const u = new URL(url);
        const opts = {
            hostname: u.hostname, path: u.pathname + u.search, method,
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        };
        if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
        const req = https.request(opts, res => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, data: d }));
        });
        req.on('error', e => resolve({ status: 0, data: e.message }));
        if (body) req.write(body);
        req.end();
    });
}

async function main() {
    console.log('\n⚡ Google Search Console Sitemap Submission\n');

    // Get access token
    console.log('1. Getting access token...');
    const token = await getAccessToken();
    console.log('   ✅ Token acquired\n');

    // Resubmit sitemap
    const siteEncoded = encodeURIComponent(SITE);
    const sitemapEncoded = encodeURIComponent(SITEMAP);

    console.log('2. Submitting sitemap to GSC...');
    const sitemapResult = await apiCall('PUT',
        `https://www.googleapis.com/webmasters/v3/sites/${siteEncoded}/sitemaps/${sitemapEncoded}`,
        token, '');
    
    if (sitemapResult.status === 200 || sitemapResult.status === 204) {
        console.log('   ✅ Sitemap submitted successfully!');
    } else {
        console.log('   Status:', sitemapResult.status, sitemapResult.data);
    }

    // Get sitemap info
    console.log('\n3. Getting sitemap status...');
    const infoResult = await apiCall('GET',
        `https://www.googleapis.com/webmasters/v3/sites/${siteEncoded}/sitemaps/${sitemapEncoded}`,
        token);
    
    if (infoResult.status === 200) {
        const info = JSON.parse(infoResult.data);
        console.log('   📊 Path:', info.path);
        console.log('   📊 Last submitted:', info.lastSubmitted);
        console.log('   📊 Last downloaded:', info.lastDownloaded);
        console.log('   📊 Warnings:', info.warnings || 0);
        console.log('   📊 Errors:', info.errors || 0);
        if (info.contents) {
            info.contents.forEach(c => {
                console.log(`   📊 ${c.type}: ${c.submitted} submitted, ${c.indexed} indexed`);
            });
        }
    } else {
        console.log('   Status:', infoResult.status, infoResult.data);
    }

    // Submit individual new CVE URLs via Indexing API
    console.log('\n4. Submitting new CVE pages to Google Indexing API...');
    const newUrls = [
        'https://vulnscan.tech/cve-2026-21858',
        'https://vulnscan.tech/cve-2026-24858',
        'https://vulnscan.tech/cve-2026-27825',
        'https://vulnscan.tech/cve-2026-1731',
        'https://vulnscan.tech/cve-2026-22719',
        'https://vulnscan.tech/cve-2026-0501',
        'https://vulnscan.tech/cve-2026-24779',
        'https://vulnscan.tech/cve-2026-3909',
        'https://vulnscan.tech/cve-2026-3910',
        'https://vulnscan.tech/cve-2026-2441',
        'https://vulnscan.tech/cve-2026-1603',
        'https://vulnscan.tech/cve-2026-21643',
        'https://vulnscan.tech/cve-scanner',
        'https://vulnscan.tech/sitemap.xml'
    ];

    for (const url of newUrls) {
        const body = JSON.stringify({ url, type: 'URL_UPDATED' });
        const result = await apiCall('POST',
            'https://indexing.googleapis.com/v3/urlNotifications:publish',
            token, body);
        const slug = url.split('/').pop();
        if (result.status === 200) console.log(`   ✅ ${slug}`);
        else console.log(`   ⚠️ ${slug}: ${result.status}`);
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n✅ Done! Check GSC in a few minutes for updated page count.');
}

main().catch(e => console.error('Fatal:', e.message));
