/**
 * SOVEREIGN BRAIN — Gemini AI Enhancement Module
 * 
 * Plugs into any pipeline script.
 * Makes every auto-generated page UNIQUE with AI-written content.
 * Why: Google penalizes thin/template content. AI-unique content = rankings.
 * 
 * Free tier: 15 requests/min, 1M tokens/day — enough for 100+ pages/day
 * Setup: Add GEMINI_API_KEY as GitHub Secret (get free key at aistudio.google.com)
 */

const https = require('https');

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-2.0-flash';

// Rate limiter — stay under free tier limits
let lastCall = 0;
const MIN_INTERVAL = 4100; // ~14/min to stay under 15/min limit

async function geminiCall(prompt, maxTokens = 400) {
    if (!GEMINI_KEY) return null;
    
    // Rate limit
    const now = Date.now();
    const wait = MIN_INTERVAL - (now - lastCall);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastCall = Date.now();

    return new Promise((resolve) => {
        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.65, topP: 0.8 }
        });
        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
            method: 'POST',
            timeout: 20000,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(d);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || null;
                    resolve(text);
                } catch { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(body); req.end();
    });
}

/**
 * Enhance a CVE page with AI-written analysis paragraph
 * Returns null if no API key — falls back to template
 */
async function enhanceCVEPage(cveId, affectedSoftware, cvssScore, severity, description, epssPercent) {
    const text = await geminiCall(
        `You are a cybersecurity expert writing for a security news site. Write a concise 2-paragraph analysis (120 words max) about ${cveId} affecting ${affectedSoftware}. CVSS: ${cvssScore}/10 (${severity}). Exploit probability: ${epssPercent}. Summary: ${description.substring(0, 200)}. 
        
        Paragraph 1: Why this vulnerability is significant and who is at risk.
        Paragraph 2: What organizations should do right now.
        
        Write clearly for IT professionals. No markdown. No headers. Just 2 paragraphs.`, 200
    );
    return text;
}

/**
 * Enhance a breach page with AI-written context
 */
async function enhanceBreachPage(companyName, filingDate, description) {
    const text = await geminiCall(
        `You are a cybersecurity journalist. Write a concise 2-paragraph analysis (120 words max) about ${companyName}'s cybersecurity incident disclosure filed with the SEC on ${filingDate}.
        
        Paragraph 1: Context — why SEC cybersecurity disclosures matter and what this means for ${companyName}'s customers.
        Paragraph 2: What affected parties should do right now to protect themselves.
        
        Tone: informative, not alarmist. No markdown. No headers. Just 2 paragraphs.`, 200
    );
    return text;
}

/**
 * Enhance a Congress trade page with AI-written market angle
 */
async function enhanceTradePage(member, action, ticker, asset, amount, chamber) {
    const company = ticker || asset;
    const text = await geminiCall(
        `You are a financial journalist covering congressional stock disclosures. Write a concise 2-paragraph analysis (120 words max) about ${member} (${chamber}) who recently ${action.toLowerCase()} ${company} stock worth approximately ${amount}.
        
        Paragraph 1: Why this trade is being watched — what ${company} does and why a ${chamber} member's position could be significant.  
        Paragraph 2: Context about congressional stock trading transparency and what investors track about these disclosures.
        
        Be factual and neutral. No investment advice. No markdown. Just 2 paragraphs.`, 200
    );
    return text;
}

/**
 * Score opportunity topics by search potential using AI reasoning
 * Input: array of topics, returns ranked array with reasoning
 */
async function scoreOpportunities(topics) {
    if (!GEMINI_KEY || !topics.length) return topics.map(t => ({ topic: t, score: 0, reasoning: 'No API key' }));
    
    const prompt = `You are an SEO strategist. Rank these topics by their Google search volume potential (1-10 scale). Consider search intent, audience size, and commercial value.

Topics: ${topics.slice(0, 15).join(' | ')}

Return ONLY a JSON array like: [{"topic":"...", "score":8, "reasoning":"brief reason"}]
No other text.`;

    const result = await geminiCall(prompt, 600);
    try {
        const cleaned = result?.replace(/```json?/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch { return topics.map(t => ({ topic: t, score: 5, reasoning: 'Parse error' })); }
}

/**
 * Generate a keyword-targeted section for any topic
 * Used by the trend-hunting agent to create new content
 */
async function generateTopicSection(keyword, context) {
    return await geminiCall(
        `Write a 150-word informational section about "${keyword}" in the context of ${context}. 
        This is for a security intelligence website. Write for people searching for this specific information. 
        Be specific, factual, and useful. No fluff. No markdown headers. Plain paragraphs only.`, 250
    );
}

module.exports = { enhanceCVEPage, enhanceBreachPage, enhanceTradePage, scoreOpportunities, generateTopicSection, geminiCall };
