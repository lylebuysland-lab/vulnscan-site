/**
 * fix-all-nav.js — comprehensive nav fix for ALL HTML files in root + blog subdir
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const blogDir = path.join(dir, 'blog');

// Same nav for all inner pages (matches homepage style)
const INNER_NAV = `            <div class="nav-links">
                <a href="/blog">Blog</a>
                <a href="/cve-scanner">CVE Database</a>
                <a href="/#features">Features</a>
                <a href="/#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="/" class="nav-cta">Free Scan</a>
            </div>`;

// Blog pages — same but Blog link is highlighted
const BLOG_NAV = `            <div class="nav-links">
                <a href="/blog" style="color:var(--accent);">Blog</a>
                <a href="/cve-scanner">CVE Database</a>
                <a href="/#features">Features</a>
                <a href="/#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="/" class="nav-cta">Free Scan</a>
            </div>`;

// Homepage nav (CTA links to #scan on same page, has Features anchor too)
const HOME_NAV = `            <div class="nav-links">
                <a href="/blog">Blog</a>
                <a href="/cve-scanner">CVE Database</a>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="#scan" class="nav-cta">Start Scan</a>
            </div>`;

const navRegex = /<div class="nav-links">[\s\S]*?<\/div>/;
let total = 0, updated = 0;

function processFile(filePath, targetNav) {
    total++;
    let content = fs.readFileSync(filePath, 'utf-8');
    if (!navRegex.test(content)) { console.log(`⚠️  No nav-links: ${path.basename(filePath)}`); return; }
    const newContent = content.replace(navRegex, targetNav);
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ ${filePath.replace(dir + path.sep, '')}`);
        updated++;
    }
}

// Root HTML files
fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(f => {
    const nav = f === 'index.html' ? HOME_NAV : INNER_NAV;
    processFile(path.join(dir, f), nav);
});

// Blog subdir HTML files
if (fs.existsSync(blogDir)) {
    fs.readdirSync(blogDir).filter(f => f.endsWith('.html')).forEach(f => {
        processFile(path.join(blogDir, f), BLOG_NAV);
    });
}

console.log(`\nDone. Updated ${updated}/${total} files.`);
