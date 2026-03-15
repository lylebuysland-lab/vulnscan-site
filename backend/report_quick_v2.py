"""
VulnScan — Quick Scan Report ($49) — Final Edition
- Simple language for average person/company
- Large readable fonts, generous spacing
- Fixes LOCKED to $199 Deep Scan (shows problem, not solution)
- Clean logo, dark premium theme
- Psychology-driven $199 upsell
"""
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, Image
)
from nvd_citations import get_citation

BRAND = "VulnScan"
URL = "vulnscan.tech"
LOGO = os.path.join(os.path.dirname(__file__), 'vulnscan_logo.png')

# Dark premium palette
PRI    = colors.HexColor('#7c3aed')
ACCENT = colors.HexColor('#a78bfa')
DARK   = colors.HexColor('#0f0b1a')
CARD   = colors.HexColor('#1a1333')
MID    = colors.HexColor('#2d2250')
WHITE  = colors.white
LTXT   = colors.HexColor('#e8e0ff')
GRAY   = colors.HexColor('#9ca3af')
RED    = colors.HexColor('#ef4444')
GREEN  = colors.HexColor('#10b981')
AMBER  = colors.HexColor('#f59e0b')

SEV = {
    'critical': {'c': colors.HexColor('#ef4444'), 'l': 'CRITICAL', 'w': 25},
    'high':     {'c': colors.HexColor('#f97316'), 'l': 'HIGH',     'w': 15},
    'medium':   {'c': colors.HexColor('#eab308'), 'l': 'MEDIUM',   'w': 5},
    'low':      {'c': colors.HexColor('#3b82f6'), 'l': 'LOW',      'w': 1},
    'info':     {'c': colors.HexColor('#6b7280'), 'l': 'INFO',     'w': 0},
}

def grade(s):
    for t,g,c,l in [(10,'A+','#10b981','Excellent'),(20,'A','#34d399','Very Good'),
                     (35,'B','#a3e635','Good'),(50,'C','#facc15','Fair'),
                     (70,'D','#f97316','Poor'),(100,'F','#ef4444','Critical')]:
        if s<=t: return {'grade':g,'color':colors.HexColor(c),'label':l}
    return {'grade':'F','color':RED,'label':'Critical'}

def risk(vulns):
    return min(100,sum(SEV.get(v.get('severity','info').lower(),{}).get('w',0) for v in vulns))

def cover_bg(c, doc):
    w,h = letter
    c.saveState()
    c.setFillColor(DARK)
    c.rect(0,0,w,h,fill=True,stroke=False)
    for i in range(60):
        c.setFillColor(colors.Color(0.49,0.23,0.93, 0.025*(1-i/60)))
        c.rect(0,h-i*5,w,5,fill=True,stroke=False)
    c.restoreState()

def page_bg(c, doc):
    w,h = letter
    c.saveState()
    c.setFillColor(DARK)
    c.rect(0,0,w,h,fill=True,stroke=False)
    # Header
    c.setFillColor(MID)
    c.rect(0,h-42,w,42,fill=True,stroke=False)
    c.setStrokeColor(PRI); c.setLineWidth(2)
    c.line(0,h-42,w,h-42)
    c.setFillColor(ACCENT); c.setFont('Helvetica-Bold',12)
    c.drawString(0.75*inch, h-28, BRAND)
    c.setFillColor(GRAY); c.setFont('Helvetica',9)
    c.drawRightString(w-0.75*inch, h-22, "SECURITY ASSESSMENT REPORT")
    c.drawRightString(w-0.75*inch, h-34, "CONFIDENTIAL")
    # Footer
    c.setFillColor(MID)
    c.rect(0,0,w,28,fill=True,stroke=False)
    c.setFillColor(GRAY); c.setFont('Helvetica',7)
    c.drawString(0.75*inch, 10, f"© 2026 {BRAND} · {URL}")
    c.drawCentredString(w/2, 10, f"Page {doc.page}")
    c.drawRightString(w-0.75*inch, 10, "CONFIDENTIAL")
    c.restoreState()


def generate_quick_report(results, output_path, tier='quick'):
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
    doc = SimpleDocTemplate(output_path, pagesize=letter,
        topMargin=0.8*inch, bottomMargin=0.6*inch,
        leftMargin=0.75*inch, rightMargin=0.75*inch)

    ss = getSampleStyleSheet()
    # All styles use generous leading to prevent overlap
    H1 = ParagraphStyle('H1', parent=ss['Normal'], fontSize=24, textColor=ACCENT,
                         fontName='Helvetica-Bold', leading=30, spaceBefore=16, spaceAfter=10)
    BD = ParagraphStyle('BD', parent=ss['Normal'], fontSize=13, textColor=WHITE,
                         leading=20, spaceAfter=8)
    SM = ParagraphStyle('SM', parent=ss['Normal'], fontSize=11, textColor=LTXT,
                         leading=16, spaceAfter=6)

    els = []
    domain = results.get('domain', 'Unknown')
    scan_label = 'Deep Scan' if tier == 'deep' else 'Quick Scan'
    dt = datetime.fromisoformat(results.get('scan_date', datetime.now().isoformat()))
    # Update Report ID generation to be tier-aware and include domain prefix
    rid = f"VS-{'DS' if tier == 'deep' else 'QS'}-{domain[:20].replace('.','').upper()}-{datetime.now().strftime('%Y%m%d%H%M')}"
    summary = results.get('summary',{})
    vulns = results.get('vulnerabilities',[])
    rs = summary.get('risk_score', risk(vulns))
    gr = grade(rs)
    vb = summary.get('vulnerability_breakdown',{})
    tv = sum(vb.values()) if vb else len(vulns)
    hi = vb.get('critical',0) + vb.get('high',0)

    # ══════════ COVER PAGE ══════════
    els.append(Spacer(1, 0.8*inch))
    if os.path.exists(LOGO):
        els.append(Image(LOGO, width=2*inch, height=2*inch, hAlign='CENTER'))
        els.append(Spacer(1, 0.3*inch))

    els.append(Paragraph(f"<font size=42 color='{ACCENT.hexval()}'><b>{BRAND}</b></font>",
        ParagraphStyle('cb', alignment=TA_CENTER, leading=50, spaceAfter=8)))
    els.append(Paragraph(f"<font size=14 color='{GRAY.hexval()}'>Security Assessment</font>",
        ParagraphStyle('cs', alignment=TA_CENTER, leading=18, spaceAfter=30)))
    els.append(HRFlowable(width="40%", thickness=2, color=PRI, spaceAfter=30, hAlign='CENTER'))

    # Big grade
    els.append(Paragraph(
        f"<font size=90 color='{gr['color'].hexval()}'><b>{gr['grade']}</b></font>",
        ParagraphStyle('cg', alignment=TA_CENTER, leading=100, spaceAfter=8)))
    els.append(Paragraph(
        f"<font size=16 color='{GRAY.hexval()}'>{gr['label']} — Score {rs}/100</font>",
        ParagraphStyle('cl', alignment=TA_CENTER, leading=20, spaceAfter=30)))

    # Meta
    ms = ParagraphStyle('ms', fontSize=12, leading=16)
    meta = [
        [Paragraph(f"<font color='{ACCENT.hexval()}'><b>Website</b></font>", ms),
         Paragraph(f"<font color='{WHITE.hexval()}'>{domain}</font>", ms)],
        [Paragraph(f"<font color='{ACCENT.hexval()}'><b>Date</b></font>", ms),
         Paragraph(f"<font color='{WHITE.hexval()}'>{dt.strftime('%B %d, %Y')}</font>", ms)],
        [Paragraph(f"<font color='{ACCENT.hexval()}'><b>Report ID</b></font>", ms),
         Paragraph(f"<font color='{WHITE.hexval()}'>{rid}</font>", ms)],
    ]
    mt = Table(meta, colWidths=[1.8*inch, 4.2*inch])
    mt.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),CARD), ('BOX',(0,0),(-1,-1),1,MID),
        ('LINEBELOW',(0,0),(-1,-2),0.5,MID),
        ('TOPPADDING',(0,0),(-1,-1),10), ('BOTTOMPADDING',(0,0),(-1,-1),10),
        ('LEFTPADDING',(0,0),(-1,-1),14),
    ]))
    els.append(mt)
    els.append(PageBreak())

    # ══════════ WHAT WE FOUND ══════════
    els.append(Paragraph("What We Found", H1))
    els.append(HRFlowable(width="100%", thickness=2, color=PRI, spaceAfter=14))

    els.append(Paragraph(
        f"We scanned <b>{domain}</b> and found "
        f"<b>{tv} security issues</b> that need attention.",
        BD))

    if hi > 0:
        alert = [[Paragraph(
            f"<font size=14 color='#fecaca'><b>⚠ {hi} serious issue{'s' if hi>1 else ''} found</b></font><br/><br/>"
            f"<font size=12 color='{WHITE.hexval()}'>These should be fixed as soon as possible to protect "
            "your website and your customers.</font>",
            ParagraphStyle('al', fontSize=12, leading=18))]]
        at = Table(alert, colWidths=[6.3*inch])
        at.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#450a0a')),
            ('BOX',(0,0),(-1,-1),2,RED),
            ('TOPPADDING',(0,0),(-1,-1),14), ('BOTTOMPADDING',(0,0),(-1,-1),14),
            ('LEFTPADDING',(0,0),(-1,-1),16), ('RIGHTPADDING',(0,0),(-1,-1),16),
        ]))
        els.append(Spacer(1, 0.1*inch))
        els.append(at)

    # Metrics
    mc = [[
        Paragraph(f"<font size=24 color='{ACCENT.hexval()}'><b>{summary.get('total_subdomains',0)}</b></font><br/>"
            f"<font size=9 color='{GRAY.hexval()}'>PAGES FOUND</font>",
            ParagraphStyle('m1', alignment=TA_CENTER, leading=30)),
        Paragraph(f"<font size=24 color='{ACCENT.hexval()}'><b>{tv}</b></font><br/>"
            f"<font size=9 color='{GRAY.hexval()}'>ISSUES</font>",
            ParagraphStyle('m2', alignment=TA_CENTER, leading=30)),
        Paragraph(f"<font size=24 color='{gr['color'].hexval()}'><b>{gr['grade']}</b></font><br/>"
            f"<font size=9 color='{GRAY.hexval()}'>GRADE</font>",
            ParagraphStyle('m3', alignment=TA_CENTER, leading=30)),
    ]]
    mt2 = Table(mc, colWidths=[2.1*inch]*3)
    mt2.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),CARD), ('BOX',(0,0),(-1,-1),1,MID),
        ('INNERGRID',(0,0),(-1,-1),1,MID),
        ('TOPPADDING',(0,0),(-1,-1),16), ('BOTTOMPADDING',(0,0),(-1,-1),16),
    ]))
    els.append(Spacer(1, 0.15*inch))
    els.append(mt2)

    # Severity breakdown
    els.append(Spacer(1, 0.2*inch))
    hs = ParagraphStyle('hs', textColor=WHITE, fontSize=12, fontName='Helvetica-Bold')
    rs2 = ParagraphStyle('rs', textColor=WHITE, fontSize=12)
    sd = [[Paragraph('<b>Level</b>',hs), Paragraph('<b>Count</b>',hs), Paragraph('<b>What It Means</b>',hs)]]
    meanings = {
        'critical': 'Your site could be hacked right now',
        'high': 'Attackers can exploit these easily',
        'medium': 'Should be fixed soon',
        'low': 'Minor issues to review',
        'info': 'Good to know',
    }
    icons = {'critical':'🔴','high':'🟠','medium':'🟡','low':'🔵','info':'⚪'}
    for sk in ['critical','high','medium','low','info']:
        cnt = vb.get(sk,0)
        sd.append([
            Paragraph(f"{icons[sk]} {SEV[sk]['l']}", rs2),
            Paragraph(str(cnt), rs2),
            Paragraph(meanings[sk] if cnt > 0 else 'None found ✓', rs2),
        ])
    st = Table(sd, colWidths=[1.5*inch, 0.8*inch, 4*inch])
    st.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),PRI), ('BACKGROUND',(0,1),(-1,-1),CARD),
        ('TEXTCOLOR',(0,0),(-1,-1),WHITE),
        ('GRID',(0,0),(-1,-1),0.5,MID),
        ('TOPPADDING',(0,0),(-1,-1),10), ('BOTTOMPADDING',(0,0),(-1,-1),10),
        ('LEFTPADDING',(0,0),(-1,-1),10),
    ]))
    els.append(st)
    els.append(PageBreak())

    # ══════════ DETAILED ISSUES ══════════
    els.append(Paragraph("Your Security Issues", H1))
    els.append(HRFlowable(width="100%", thickness=2, color=PRI, spaceAfter=14))
    els.append(Paragraph(
        "Below is each issue we found, what it means for your business, "
        "and which security standards it violates.",
        BD))
    els.append(Spacer(1, 0.12*inch))

    sev_order = {'critical':0,'high':1,'medium':2,'low':3,'info':4}
    for i, vuln in enumerate(sorted(vulns, key=lambda v: sev_order.get(v.get('severity','info').lower(),4)), 1):
        sev = vuln.get('severity','info').lower()
        si = SEV.get(sev, SEV['info'])
        cite = get_citation(vuln.get('template_id',''))
        fe = []

        # Title bar
        bd = [[
            Paragraph(f"<font color='white' size=11><b> {si['l']} </b></font>",
                ParagraphStyle(f'b{i}', alignment=TA_CENTER)),
            Paragraph(f"<font size=14 color='{WHITE.hexval()}'><b>#{i}: {vuln.get('name','')}</b></font>",
                ParagraphStyle(f'fn{i}', fontSize=14, leading=18)),
        ]]
        bt = Table(bd, colWidths=[1.1*inch, 5.2*inch])
        bt.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(0,0),si['c']), ('BACKGROUND',(1,0),(1,0),CARD),
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
            ('TOPPADDING',(0,0),(-1,-1),8), ('BOTTOMPADDING',(0,0),(-1,-1),8),
            ('LEFTPADDING',(0,0),(0,0),8),
        ]))
        fe.append(bt)

        # Standards citation
        parts = [f"<b>{cite['cwe_id']}</b>", f"<b>{cite['owasp']}</b>"]
        if cite.get('cve_id'): parts.append(f"<b>{cite['cve_id']}</b>")
        cvss = cite.get('cvss', vuln.get('cvss_score',''))
        if cvss: parts.append(f"Score: <b>{cvss}/10</b>")
        fe.append(Paragraph(
            f"<font size=10 color='{ACCENT.hexval()}'>{' | '.join(parts)}</font>",
            ParagraphStyle(f'c{i}', fontSize=10, leading=14, spaceAfter=6)))

        # What's affected
        if vuln.get('url'):
            fe.append(Paragraph(
                f"<font size=12 color='{WHITE.hexval()}'><b>Where:</b> {vuln['url']}</font>",
                ParagraphStyle(f'w{i}', fontSize=12, leading=16, spaceAfter=6)))

        # Plain English description
        if vuln.get('description'):
            fe.append(Paragraph(
                f"<font size=12 color='{LTXT.hexval()}'>{vuln['description']}</font>",
                ParagraphStyle(f'd{i}', fontSize=12, leading=18, spaceAfter=8)))

        # Business impact - plain language
        fe.append(Paragraph(
            f"<font size=12 color='#fca5a5'><b>Why this matters:</b> {cite['business_impact']}</font>",
            ParagraphStyle(f'bi{i}', fontSize=12, leading=18, spaceAfter=8)))

        # FIX: Show actual steps for deep tier, locked box for quick
        if tier == 'deep':
            fix_steps = cite.get('fix_steps', ['Review and apply security best practices.'])
            steps_text = '<br/>'.join([f"<font size=11 color='#d1fae5'>✅ {s}</font>" for s in fix_steps])
            fix_box = [[Paragraph(
                f"<font size=12 color='#22c55e'><b>How to Fix This:</b></font><br/><br/>{steps_text}",
                ParagraphStyle(f'fx{i}', fontSize=11, leading=17))]]
            ft = Table(fix_box, colWidths=[6.3*inch])
            ft.setStyle(TableStyle([
                ('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#052e16')),
                ('BOX',(0,0),(-1,-1),1.5,GREEN),
                ('TOPPADDING',(0,0),(-1,-1),12), ('BOTTOMPADDING',(0,0),(-1,-1),12),
                ('LEFTPADDING',(0,0),(-1,-1),14), ('RIGHTPADDING',(0,0),(-1,-1),14),
            ]))
            fe.append(ft)
        else:
            fix_box = [[Paragraph(
                "<font size=11 color='#92400e'><b>🔒 How to fix this → Included in Deep Scan ($199)</b></font><br/>"
                "<font size=10 color='#78350f'>The Deep Scan report gives you step-by-step instructions "
                "to fix this issue, written for your exact technology.</font>",
                ParagraphStyle(f'fx{i}', fontSize=10, leading=15))]]
            ft = Table(fix_box, colWidths=[6.3*inch])
            ft.setStyle(TableStyle([
                ('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#fef3c7')),
                ('BOX',(0,0),(-1,-1),1.5,AMBER),
                ('TOPPADDING',(0,0),(-1,-1),10), ('BOTTOMPADDING',(0,0),(-1,-1),10),
                ('LEFTPADDING',(0,0),(-1,-1),12), ('RIGHTPADDING',(0,0),(-1,-1),12),
            ]))
            fe.append(ft)

        fe.append(Spacer(1, 0.15*inch))
        els.append(KeepTogether(fe))

    els.append(PageBreak())

    # Skip upsell pages for deep tier — they already paid
    if tier == 'deep':
        # Jump straight to verification standards
        pass
    else:

        # ══════════ WHAT'S AT STAKE ══════════
        els.append(Paragraph("What's at Stake", H1))
        els.append(HRFlowable(width="100%", thickness=2, color=RED, spaceAfter=14))

        els.append(Paragraph(
            f"<font size=14 color='#fca5a5'><b>Your website has {tv} known security gaps. "
            "Here's what could happen if they're not fixed:</b></font>",
            ParagraphStyle('stake', fontSize=14, leading=20, spaceAfter=16)))

        risks_list = [
            ("💰 Financial Loss", "Data breaches cost small businesses $120,000–$200,000 on average."),
            ("👥 Customer Trust", "One breach can destroy years of built reputation overnight."),
            ("⚖️ Legal Liability", "Compliance violations carry $50,000+ in fines (GDPR, PCI DSS)."),
            ("📉 Business Disruption", "Hacked websites go offline, losing revenue every hour."),
        ]
        for title, desc in risks_list:
            risk_row = [[Paragraph(
                f"<font size=13 color='{WHITE.hexval()}'><b>{title}</b></font><br/>"
                f"<font size=12 color='{LTXT.hexval()}'>{desc}</font>",
                ParagraphStyle(f'rr{title[:3]}', fontSize=12, leading=18))]]
            rt = Table(risk_row, colWidths=[6.3*inch])
            rt.setStyle(TableStyle([
                ('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#1c1017')),
                ('BOX',(0,0),(-1,-1),1,colors.HexColor('#7f1d1d')),
                ('TOPPADDING',(0,0),(-1,-1),12), ('BOTTOMPADDING',(0,0),(-1,-1),12),
                ('LEFTPADDING',(0,0),(-1,-1),14),
            ]))
            els.append(rt)
            els.append(Spacer(1, 0.08*inch))

        els.append(PageBreak())

        # ══════════ WHAT THE DEEP SCAN INCLUDES ══════════
        els.append(Paragraph("What the Deep Scan Includes", H1))
        els.append(HRFlowable(width="100%", thickness=2, color=PRI, spaceAfter=14))

        els.append(Paragraph(
            f"The Deep Scan takes everything in this report and goes <b>much deeper</b>. "
            f"Here's exactly what you get for <b>$199</b>:",
            BD))
        els.append(Spacer(1, 0.1*inch))

        ds_features = [
            ("✅ Step-by-Step Fix Instructions",
             "For every issue found, you get exact commands and code to fix it — "
             "written for your specific technology (Apache, Nginx, WordPress, etc). "
             "No guessing, no Googling. Just copy, paste, and your site is secure.",
             GREEN),
            ("✅ OWASP Top 10 Compliance Matrix",
             "We map every finding to the OWASP Top 10 — the global standard for web security. "
             "See exactly which categories you pass or fail. Required by most enterprise clients.\n"
             "Reference: https://owasp.org/www-project-top-ten/",
             GREEN),
            ("✅ PCI DSS / SOC 2 / GDPR Compliance Check",
             "If you handle payments, customer data, or serve EU customers, you need compliance. "
             "We check your site against PCI DSS, SOC 2, and GDPR requirements and tell you exactly what's missing.",
             GREEN),
            ("✅ Full Code-Level Remediation Playbook",
             "Before/after code examples for every issue. Your developer can implement all fixes in hours, not weeks. "
             "Each fix is verified against the NIST National Vulnerability Database.\n"
             "Reference: https://nvd.nist.gov/",
             GREEN),
            ("✅ Board-Ready Executive Summary",
             "A polished 1-page summary you can hand to your board, investors, or clients. "
             "Shows risk level, remediation progress, and industry benchmarking.",
             GREEN),
            ("✅ SSL/TLS Deep Audit",
             "Complete cipher suite analysis, certificate chain validation, protocol support matrix, "
             "and HSTS preload status check.",
             GREEN),
            ("✅ Priority Email Support",
             "Got questions about your report? We respond within 24 hours with expert guidance.",
             GREEN),
        ]

        for title, desc, color in ds_features:
            safe_desc = desc.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            row = [[Paragraph(
                f"<font size=13 color='{WHITE.hexval()}'><b>{title}</b></font><br/>"
                f"<font size=11 color='{LTXT.hexval()}'>{safe_desc}</font>",
                ParagraphStyle(f'ds_{title[:8]}', fontSize=11, leading=17))]]
            rt = Table(row, colWidths=[6.3*inch])
            rt.setStyle(TableStyle([
                ('BACKGROUND',(0,0),(-1,-1),CARD),
                ('BOX',(0,0),(-1,-1),1,MID),
                ('TOPPADDING',(0,0),(-1,-1),10), ('BOTTOMPADDING',(0,0),(-1,-1),10),
                ('LEFTPADDING',(0,0),(-1,-1),14), ('RIGHTPADDING',(0,0),(-1,-1),14),
            ]))
            els.append(rt)
            els.append(Spacer(1, 0.06*inch))

        els.append(PageBreak())

        # ══════════ QUICK SCAN vs DEEP SCAN COMPARISON ══════════
        els.append(Paragraph("Quick Scan vs Deep Scan", H1))
        els.append(HRFlowable(width="100%", thickness=2, color=PRI, spaceAfter=14))

        els.append(Paragraph(
            "See exactly what you get with each plan:",
            BD))
        els.append(Spacer(1, 0.1*inch))

        ch = ParagraphStyle('ch', textColor=WHITE, fontSize=11, fontName='Helvetica-Bold')
        cr = ParagraphStyle('cr', textColor=WHITE, fontSize=11)
        cg = ParagraphStyle('cg', textColor=GREEN, fontSize=11, fontName='Helvetica-Bold')

        comp = [
            [Paragraph('<b>Feature</b>',ch), Paragraph('<b>Quick Scan ($49)</b>',ch), Paragraph('<b>Deep Scan ($199)</b>',ch)],
            [Paragraph('Security issues identified',cr), Paragraph('✅ Yes',cg), Paragraph('✅ Yes',cg)],
            [Paragraph('Risk score and grade',cr), Paragraph('✅ Yes',cg), Paragraph('✅ Yes',cg)],
            [Paragraph('NVD/CWE citations',cr), Paragraph('✅ Yes',cg), Paragraph('✅ Yes',cg)],
            [Paragraph('Business impact explained',cr), Paragraph('✅ Yes',cg), Paragraph('✅ Yes',cg)],
            [Paragraph('Step-by-step fix instructions',cr), Paragraph('❌ No',ParagraphStyle('n1',textColor=RED,fontSize=11)), Paragraph('✅ Yes',cg)],
            [Paragraph('Code-level fixes (copy-paste)',cr), Paragraph('❌ No',ParagraphStyle('n2',textColor=RED,fontSize=11)), Paragraph('✅ Yes',cg)],
            [Paragraph('OWASP Top 10 mapping',cr), Paragraph('❌ No',ParagraphStyle('n3',textColor=RED,fontSize=11)), Paragraph('✅ Yes',cg)],
            [Paragraph('PCI/SOC 2/GDPR compliance',cr), Paragraph('❌ No',ParagraphStyle('n4',textColor=RED,fontSize=11)), Paragraph('✅ Yes',cg)],
            [Paragraph('Executive summary',cr), Paragraph('❌ No',ParagraphStyle('n5',textColor=RED,fontSize=11)), Paragraph('✅ Yes',cg)],
            [Paragraph('SSL/TLS deep audit',cr), Paragraph('❌ No',ParagraphStyle('n6',textColor=RED,fontSize=11)), Paragraph('✅ Yes',cg)],
            [Paragraph('Priority support',cr), Paragraph('❌ No',ParagraphStyle('n7',textColor=RED,fontSize=11)), Paragraph('✅ Yes',cg)],
        ]
        ct2 = Table(comp, colWidths=[2.6*inch, 1.85*inch, 1.85*inch])
        ct2.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),PRI), ('BACKGROUND',(0,1),(-1,-1),CARD),
            ('BACKGROUND',(2,1),(2,-1),colors.HexColor('#0a2e1a')),
            ('GRID',(0,0),(-1,-1),0.5,MID),
            ('TOPPADDING',(0,0),(-1,-1),8), ('BOTTOMPADDING',(0,0),(-1,-1),8),
            ('LEFTPADDING',(0,0),(-1,-1),8),
        ]))
        els.append(ct2)

        els.append(Spacer(1, 0.3*inch))

        # BIG CTA
        cta = [[Paragraph(
            f"<font size=12 color='{LTXT.hexval()}'>"
            "Security consultants charge <b>$3,000–$5,000</b> for this level of assessment.</font><br/><br/>"
            f"<font size=30 color='{GREEN.hexval()}'><b>$199</b></font><br/><br/>"
            f"<font size=16 color='{ACCENT.hexval()}'><b>→ vulnscan.tech</b></font>",
            ParagraphStyle('cta', fontSize=12, leading=20, alignment=TA_CENTER))]]
        ct = Table(cta, colWidths=[6.3*inch])
        ct.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1),CARD), ('BOX',(0,0),(-1,-1),3,PRI),
            ('TOPPADDING',(0,0),(-1,-1),24), ('BOTTOMPADDING',(0,0),(-1,-1),24),
            ('LEFTPADDING',(0,0),(-1,-1),24), ('RIGHTPADDING',(0,0),(-1,-1),24),
        ]))
        els.append(ct)

        els.append(PageBreak())

    # ══════════ VERIFICATION STANDARDS ══════════
    els.append(Paragraph("Verification Standards", H1))
    els.append(HRFlowable(width="100%", thickness=2, color=PRI, spaceAfter=14))

    els.append(Paragraph(
        "Every finding in this report and the Deep Scan is verified against "
        "the following national and international security databases:",
        BD))
    els.append(Spacer(1, 0.1*inch))

    dbs = [
        ("🏛 NIST National Vulnerability Database (NVD)",
         "The U.S. government's official repository of security vulnerabilities. "
         "Contains 200,000+ entries with severity scores and technical details.",
         "https://nvd.nist.gov/"),
        ("🛡 MITRE CWE (Common Weakness Enumeration)",
         "The industry standard list of software and hardware weaknesses. "
         "Every finding in your report is mapped to a CWE category.",
         "https://cwe.mitre.org/"),
        ("🔒 OWASP Top 10 (2021)",
         "The world's most widely recognized web application security standard. "
         "Used by banks, governments, and Fortune 500 companies to evaluate security.",
         "https://owasp.org/www-project-top-ten/"),
        ("📊 CVSS (Common Vulnerability Scoring System)",
         "The universal severity scoring system used by security professionals worldwide. "
         "Each finding includes a CVSS score from 0-10 to help you prioritize fixes.",
         "https://www.first.org/cvss/"),
        ("🔍 CVE (Common Vulnerabilities and Exposures)",
         "Maintained by MITRE Corporation. Each publicly known vulnerability gets a unique "
         "CVE ID that is tracked globally by security teams.",
         "https://cve.mitre.org/"),
    ]

    for title, desc, url in dbs:
        db_row = [[Paragraph(
            f"<font size=13 color='{WHITE.hexval()}'><b>{title}</b></font><br/>"
            f"<font size=11 color='{LTXT.hexval()}'>{desc}</font><br/>"
            f"<font size=10 color='{ACCENT.hexval()}'>{url}</font>",
            ParagraphStyle(f'db_{title[:5]}', fontSize=11, leading=16))]]
        dt = Table(db_row, colWidths=[6.3*inch])
        dt.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,-1),CARD),
            ('BOX',(0,0),(-1,-1),1,ACCENT),
            ('TOPPADDING',(0,0),(-1,-1),12), ('BOTTOMPADDING',(0,0),(-1,-1),12),
            ('LEFTPADDING',(0,0),(-1,-1),14), ('RIGHTPADDING',(0,0),(-1,-1),14),
        ]))
        els.append(dt)
        els.append(Spacer(1, 0.06*inch))

    els.append(Spacer(1, 0.15*inch))
    if tier == 'deep':
        els.append(Paragraph(
            f"<font size=12 color='{WHITE.hexval()}'><b>This Deep Scan report</b> includes direct links "
            "to the exact NVD and OWASP entries for every vulnerability found. You can "
            "verify every finding independently.</font>",
            ParagraphStyle('db_note', fontSize=12, leading=18, spaceAfter=12)))
    else:
        els.append(Paragraph(
            f"<font size=12 color='{WHITE.hexval()}'><b>The Deep Scan ($199)</b> includes direct links "
            "to the exact NVD and OWASP entries for every vulnerability found, so you can "
            "verify every finding independently.</font>",
            ParagraphStyle('db_note', fontSize=12, leading=18, spaceAfter=12)))

        els.append(Spacer(1, 0.15*inch))
        els.append(Paragraph(
            f"<font size=14 color='{ACCENT.hexval()}'><b>→ Get your Deep Scan at vulnscan.tech</b></font>",
            ParagraphStyle('final_cta', alignment=TA_CENTER, leading=18, spaceAfter=6)))

    els.append(Spacer(1, 0.2*inch))
    els.append(Paragraph(
        f"<font size=9 color='{GRAY.hexval()}'>{BRAND} Security · {URL} · {rid}</font>",
        ParagraphStyle('fin', alignment=TA_CENTER, leading=12)))

    doc.build(els, onFirstPage=cover_bg, onLaterPages=page_bg)
    print(f"[+] {scan_label} report generated: {output_path}")
    return output_path
