#!/usr/bin/env node
/**
 * daily-index-all-pages.js
 * Runs daily via Windows Task Scheduler
 * 1. Scans all HTML files in scanforge/
 * 2. Submits sitemap to GSC
 * 3. Submits each page to Google Indexing API
 * 4. Submits to IndexNow (Bing + Yandex)
 * 5. Logs results
 */
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SITE = 'https://vulnscan.tech/';
const SITEMAP = 'https://vulnscan.tech/sitemap.xml';
const SCANFORGE = 'C:/Users/User/Documents/claude/scanforge';
const LOG_FILE = path.join(SCANFORGE, 'indexing-log.txt');
const SA_PATH = 'C:/Users/User/.config/vulnscan-blogs-07c620db4543.json';

function log(msg) {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
}

function base64url(data) {
    return Buffer.from(data).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken(sa) {
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

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
    log('========== DAILY INDEXING RUN ==========');

    if (!fs.existsSync(SA_PATH)) {
        log('ERROR: Service account not found at ' + SA_PATH);
        return;
    }
    const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));

    // 1. Get all HTML pages
    const htmlFiles = fs.readdirSync(SCANFORGE)
        .filter(f => f.endsWith('.html') && f !== '404.html')
        .map(f => f.replace('.html', ''));
    log(`Found ${htmlFiles.length} HTML pages`);

    // 2. Get access token
    log('Getting Google access token...');
    const token = await getAccessToken(sa);
    log('✅ Token acquired');

    // 3. Submit sitemap
    const siteEnc = encodeURIComponent(SITE);
    const smapEnc = encodeURIComponent(SITEMAP);
    const smResult = await apiCall('PUT',
        `https://www.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${smapEnc}`, token, '');
    log(`Sitemap submission: ${smResult.status === 200 || smResult.status === 204 ? '✅ Success' : '⚠️ ' + smResult.status}`);

    // 4. Get current sitemap info
    const infoResult = await apiCall('GET',
        `https://www.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${smapEnc}`, token);
    if (infoResult.status === 200) {
        const info = JSON.parse(infoResult.data);
        if (info.contents) {
            info.contents.forEach(c => log(`📊 ${c.type}: ${c.submitted} submitted, ${c.indexed} indexed`));
        }
    }

    // 5. Submit ALL pages to Google Indexing API (max 200/day quota)
    log(`Submitting ${Math.min(htmlFiles.length, 200)} pages to Google Indexing API...`);
    let success = 0, failed = 0;
    for (const slug of htmlFiles.slice(0, 200)) {
        const url = slug === 'index' ? SITE : `${SITE}${slug}`;
        const body = JSON.stringify({ url, type: 'URL_UPDATED' });
        const result = await apiCall('POST',
            'https://indexing.googleapis.com/v3/urlNotifications:publish', token, body);
        if (result.status === 200) { success++; }
        else { failed++; log(`   ⚠️ ${slug}: ${result.status}`); }
        await delay(300);
    }
    log(`Google Indexing API: ✅ ${success} success, ⚠️ ${failed} failed`);

    // 6. Submit to IndexNow (Bing + Yandex)
    const indexNowUrls = htmlFiles.slice(0, 100).map(s => s === 'index' ? SITE : `${SITE}${s}`);
    const indexNowBody = JSON.stringify({
        host: 'vulnscan.tech',
        key: 'vulnscan-indexnow-key-2026',
        keyLocation: 'https://vulnscan.tech/vulnscan-indexnow-key-2026.txt',
        urlList: indexNowUrls
    });

    for (const endpoint of ['api.indexnow.org', 'www.bing.com', 'yandex.com']) {
        await new Promise((resolve) => {
            const req = https.request({
                hostname: endpoint, path: '/indexnow', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(indexNowBody) }
            }, res => { log(`IndexNow ${endpoint}: ${res.statusCode}`); resolve(); });
            req.on('error', e => { log(`IndexNow ${endpoint}: ${e.message}`); resolve(); });
            req.write(indexNowBody); req.end();
        });
    }

    log('========== DAILY INDEXING COMPLETE ==========\n');
}

main().catch(e => log('FATAL: ' + e.message));
