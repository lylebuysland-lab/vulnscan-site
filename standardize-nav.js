/**
 * standardize-nav.js
 * Replaces the nav-links div on ALL html pages with a consistent nav
 */
const fs = require('fs');
const path = require('path');
const dir = __dirname;

// Standard nav for inner pages (links back to homepage sections with /)
const INNER_NAV = `            <div class="nav-links">
                <a href="/blog">Blog</a>
                <a href="/cve-scanner">CVE Scanner</a>
                <a href="/#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="/" class="nav-cta">Free Scan</a>
            </div>`;

// Nav for homepage (sections are on the same page, no leading /)
const HOME_NAV = `            <div class="nav-links">
                <a href="/blog">Blog</a>
                <a href="/cve-scanner">CVE Scanner</a>
                <a href="#pricing">Pricing</a>
                <a href="/about">About</a>
                <a href="#scan" class="nav-cta">Start Scan</a>
            </div>`;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
let updated = 0;

files.forEach(f => {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf-8');
    const isHome = f === 'index.html';
    const targetNav = isHome ? HOME_NAV : INNER_NAV;

    // Match any existing nav-links div (with any content inside)
    const navRegex = /<div class="nav-links">[\s\S]*?<\/div>/;
    if (navRegex.test(content)) {
        const newContent = content.replace(navRegex, targetNav);
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
            console.log(`✅ Updated nav: ${f}`);
            updated++;
        } else {
            console.log(`⏭  Already correct: ${f}`);
        }
    } else {
        console.log(`⚠️  No nav-links found: ${f}`);
    }
});

console.log(`\nDone. Updated ${updated}/${files.length} files.`);
