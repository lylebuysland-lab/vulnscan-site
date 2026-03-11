"""
VulnScan.tech — Quick Scan Report ($49 tier)
- Shows real findings with severity and affected URLs
- Basic remediation (1-liner)
- Strategically locks premium sections to upsell Deep Scan ($199)
- OWASP, Compliance, Code Fixes show as "locked" previews
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
    PageBreak, HRFlowable
)


# ============================================
# BRAND CONSTANTS (same as Deep Scan)
# ============================================
BRAND_NAME = "VulnScan"
BRAND_URL = "vulnscan.tech"
BRAND_COLOR = colors.HexColor('#6366f1')
BRAND_DARK = colors.HexColor('#4f46e5')
BRAND_BG = colors.HexColor('#f8f9fc')
LOCK_COLOR = colors.HexColor('#9ca3af')
UPSELL_BG = colors.HexColor('#fef3c7')
UPSELL_BORDER = colors.HexColor('#f59e0b')

SEVERITY_MAP = {
    'critical': {'color': colors.HexColor('#dc2626'), 'label': 'CRITICAL', 'icon': '🔴', 'weight': 25},
    'high':     {'color': colors.HexColor('#ea580c'), 'label': 'HIGH',     'icon': '🟠', 'weight': 15},
    'medium':   {'color': colors.HexColor('#d97706'), 'label': 'MEDIUM',   'icon': '🟡', 'weight': 5},
    'low':      {'color': colors.HexColor('#2563eb'), 'label': 'LOW',      'icon': '🔵', 'weight': 1},
    'info':     {'color': colors.HexColor('#6b7280'), 'label': 'INFO',     'icon': '⚪', 'weight': 0},
}


def calculate_grade(risk_score):
    if risk_score <= 10:
        return {'grade': 'A+', 'color': colors.HexColor('#059669'), 'label': 'Excellent'}
    elif risk_score <= 20:
        return {'grade': 'A', 'color': colors.HexColor('#10b981'), 'label': 'Very Good'}
    elif risk_score <= 35:
        return {'grade': 'B', 'color': colors.HexColor('#84cc16'), 'label': 'Good'}
    elif risk_score <= 50:
        return {'grade': 'C', 'color': colors.HexColor('#eab308'), 'label': 'Fair'}
    elif risk_score <= 70:
        return {'grade': 'D', 'color': colors.HexColor('#f97316'), 'label': 'Poor'}
    else:
        return {'grade': 'F', 'color': colors.HexColor('#dc2626'), 'label': 'Critical'}


def calculate_risk_score(vulns):
    score = 0
    for v in vulns:
        sev = v.get('severity', 'info').lower()
        weight = SEVERITY_MAP.get(sev, {}).get('weight', 0)
        score += weight
    return min(100, score)


def header_footer(canvas, doc):
    """Professional header/footer on every page."""
    canvas.saveState()
    width, height = letter

    # Header
    canvas.setFillColor(BRAND_COLOR)
    canvas.rect(0, height - 45, width, 45, fill=True, stroke=False)
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica-Bold', 14)
    canvas.drawString(0.75*inch, height - 30, f"{BRAND_NAME}")
    canvas.setFont('Helvetica', 9)
    canvas.drawRightString(width - 0.75*inch, height - 25, "QUICK SCAN REPORT")
    canvas.drawRightString(width - 0.75*inch, height - 37, "CONFIDENTIAL")

    # Footer
    canvas.setFillColor(colors.HexColor('#e5e7eb'))
    canvas.rect(0, 0, width, 35, fill=True, stroke=False)
    canvas.setFillColor(colors.HexColor('#6b7280'))
    canvas.setFont('Helvetica', 8)
    canvas.drawString(0.75*inch, 15, f"© 2026 {BRAND_NAME} Security · {BRAND_URL}")
    canvas.drawCentredString(width/2, 15, f"Page {doc.page}")
    canvas.drawRightString(width - 0.75*inch, 15, "CONFIDENTIAL")

    canvas.restoreState()


def upsell_box(text, elements, styles):
    """Add a locked/upsell section with amber border."""
    box_data = [[
        Paragraph(
            f"<font color='#92400e' size=10><b>🔒 LOCKED — Available in Deep Scan ($199)</b></font><br/>"
            f"<font color='#78350f' size=9>{text}</font><br/><br/>"
            f"<font color='{BRAND_COLOR.hexval()}' size=9><b>→ Upgrade at {BRAND_URL} to unlock this section</b></font>",
            ParagraphStyle('upsell_text', fontSize=9, leading=14)
        )
    ]]
    t = Table(box_data, colWidths=[6.3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), UPSELL_BG),
        ('BOX', (0, 0), (-1, -1), 2, UPSELL_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.15*inch))


def generate_quick_report(results, output_path):
    """Generate the $49 Quick Scan PDF report."""
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        topMargin=0.9*inch, bottomMargin=0.7*inch,
        leftMargin=0.75*inch, rightMargin=0.75*inch
    )

    styles = getSampleStyleSheet()
    s = lambda name, **kw: styles.add(ParagraphStyle(name, **kw))
    s('SectionTitle', parent=styles['Heading1'], fontSize=18, textColor=BRAND_COLOR,
      spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold')
    s('SubSection', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1f2937'),
      spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold')
    s('Body', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#374151'),
      spaceAfter=6, leading=15)
    s('Muted', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#6b7280'),
      spaceAfter=4, leading=12)

    elements = []
    domain = results.get('domain', 'Unknown')
    scan_date = datetime.fromisoformat(results.get('scan_date', datetime.now().isoformat()))
    summary = results.get('summary', {})
    vulns = results.get('vulnerabilities', [])

    risk_score = summary.get('risk_score', calculate_risk_score(vulns))
    grade_info = calculate_grade(risk_score)
    report_id = f"VS-QS-{scan_date.strftime('%Y%m%d')}-{abs(hash(domain)) % 10000:04d}"

    # ═══════════════════════════════════════════
    # COVER PAGE
    # ═══════════════════════════════════════════
    elements.append(Spacer(1, 0.8*inch))
    elements.append(Paragraph(
        f"<font size=36 color='{BRAND_COLOR.hexval()}'><b>{BRAND_NAME}</b></font>",
        ParagraphStyle('cover_brand', alignment=TA_CENTER, spaceAfter=8, leading=44)))
    elements.append(Paragraph(
        "<font size=13 color='#9ca3af'>QUICK SCAN REPORT</font>",
        ParagraphStyle('cover_sub', alignment=TA_CENTER, spaceAfter=24, leading=16)))
    elements.append(HRFlowable(width="50%", thickness=2, color=BRAND_COLOR,
                                spaceAfter=28, hAlign='CENTER'))

    # Grade
    elements.append(Paragraph(
        f"<font size=80 color='{grade_info['color'].hexval()}'><b>{grade_info['grade']}</b></font>",
        ParagraphStyle('cover_grade', alignment=TA_CENTER, spaceAfter=0, leading=90)))
    elements.append(Paragraph(
        f"<font size=14 color='#6b7280'>{grade_info['label']} — Risk Score {risk_score}/100</font>",
        ParagraphStyle('cover_label', alignment=TA_CENTER, spaceAfter=32, leading=18)))

    # Meta
    meta_data = [
        ['Target Domain', domain],
        ['Report Date', scan_date.strftime('%B %d, %Y')],
        ['Report ID', report_id],
        ['Scan Type', 'Quick Scan ($49)'],
    ]
    mt = Table(meta_data, colWidths=[1.8*inch, 4.2*inch])
    mt.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), BRAND_COLOR),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#e5e7eb')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG),
    ]))
    elements.append(mt)

    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        f"<font size=9 color='#9ca3af'>Generated by {BRAND_NAME} Security · {BRAND_URL}</font>",
        ParagraphStyle('cover_footer', alignment=TA_CENTER, leading=12)))
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # SCAN SUMMARY
    # ═══════════════════════════════════════════
    elements.append(Paragraph("1. Scan Summary", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    elements.append(Paragraph(
        f"An automated security scan was performed on <b>{domain}</b> on "
        f"{scan_date.strftime('%B %d, %Y')}. The scan identified "
        f"<b>{summary.get('total_vulnerabilities', len(vulns))} findings</b> across "
        f"<b>{summary.get('total_subdomains', 0)} subdomains</b> "
        f"({summary.get('total_live_hosts', 0)} live hosts).",
        styles['Body']))

    # Key metrics
    metrics = [[
        f"<font size=20><b>{summary.get('total_subdomains', 0)}</b></font><br/>"
        f"<font size=8 color='#6b7280'>SUBDOMAINS</font>",
        f"<font size=20><b>{summary.get('total_live_hosts', 0)}</b></font><br/>"
        f"<font size=8 color='#6b7280'>LIVE HOSTS</font>",
        f"<font size=20><b>{summary.get('total_vulnerabilities', len(vulns))}</b></font><br/>"
        f"<font size=8 color='#6b7280'>FINDINGS</font>",
        f"<font size=20 color='{grade_info['color'].hexval()}'><b>{grade_info['grade']}</b></font><br/>"
        f"<font size=8 color='#6b7280'>GRADE</font>",
    ]]
    mp = [[Paragraph(c, ParagraphStyle('mc', alignment=TA_CENTER, leading=24)) for c in metrics[0]]]
    mt2 = Table(mp, colWidths=[1.6*inch]*4)
    mt2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(Spacer(1, 0.15*inch))
    elements.append(mt2)

    # Severity breakdown
    elements.append(Spacer(1, 0.2*inch))
    vb = summary.get('vulnerability_breakdown', {})
    total_v = sum(vb.values()) if vb else len(vulns)
    
    sev_data = [['', 'Severity', 'Count', 'Status']]
    for sev_key in ['critical', 'high', 'medium', 'low', 'info']:
        sev = SEVERITY_MAP[sev_key]
        count = vb.get(sev_key, 0)
        status = 'CLEAR ✓' if count == 0 else ('⚠ ACTION NEEDED' if sev_key in ['critical', 'high'] else 'Review')
        sev_data.append([sev['icon'], sev['label'], str(count), status])
    
    st = Table(sev_data, colWidths=[0.5*inch, 1.3*inch, 0.8*inch, 3.7*inch])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
    ]))
    elements.append(st)
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 2. FINDINGS (basic — severity + URL + 1-liner remediation)
    # ═══════════════════════════════════════════
    elements.append(Paragraph("2. Security Findings", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    sev_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4}
    vulns_sorted = sorted(vulns, key=lambda v: sev_order.get(v.get('severity', 'info'), 4))

    for i, vuln in enumerate(vulns_sorted, 1):
        sev = vuln.get('severity', 'info').lower()
        sev_info = SEVERITY_MAP.get(sev, SEVERITY_MAP['info'])

        # Finding header with severity badge
        badge_data = [[
            Paragraph(f"<font color='white' size=9><b> {sev_info['label']} </b></font>",
                ParagraphStyle('badge', alignment=TA_CENTER)),
            Paragraph(f"<font size=11><b>Finding #{i}: {vuln.get('name', 'Unknown')}</b></font>",
                ParagraphStyle('fname', fontSize=11)),
        ]]
        bt = Table(badge_data, colWidths=[1*inch, 5.3*inch])
        bt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), sev_info['color']),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (0, 0), 8),
        ]))
        elements.append(bt)

        # Affected URL only
        if vuln.get('url'):
            elements.append(Paragraph(
                f"<font size=9 color='#6b7280'><b>Affected:</b></font> "
                f"<font size=9 color='{BRAND_COLOR.hexval()}'>{vuln['url']}</font>",
                styles['Body']))

        # Short description (truncated)
        if vuln.get('description'):
            short_desc = vuln['description'][:200]
            if len(vuln['description']) > 200:
                short_desc += '...'
            elements.append(Paragraph(f"<font size=9>{short_desc}</font>", styles['Muted']))

        # Basic remediation (generic 1-liner)
        elements.append(Paragraph(
            "<font size=9><b>Remediation:</b> Apply security patches and update to latest versions.</font>",
            styles['Muted']))

        # UPSELL: Show what they're missing
        if sev in ['critical', 'high']:
            lock_data = [[
                Paragraph(
                    "<font size=8 color='#92400e'><b>🔒 Deep Scan includes:</b> CVSS score, detailed exploitation steps, "
                    "code-level fix instructions, OWASP category, and compliance impact (PCI DSS, SOC 2)</font>",
                    ParagraphStyle('mini_upsell', fontSize=8, leading=11))
            ]]
            lt = Table(lock_data, colWidths=[6.3*inch])
            lt.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), UPSELL_BG),
                ('BOX', (0, 0), (-1, -1), 1, UPSELL_BORDER),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ]))
            elements.append(lt)

        elements.append(Spacer(1, 0.08*inch))
        elements.append(HRFlowable(width="100%", thickness=0.5,
                                    color=colors.HexColor('#e5e7eb'), spaceAfter=6))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 3. ATTACK SURFACE (basic — subdomain list)
    # ═══════════════════════════════════════════
    elements.append(Paragraph("3. Attack Surface", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    elements.append(Paragraph(
        f"<b>{summary.get('total_subdomains', 0)} subdomains</b> were discovered, "
        f"of which <b>{summary.get('total_live_hosts', 0)}</b> are actively responding.",
        styles['Body']))

    subs = results.get('subdomains', [])[:30]
    if subs:
        live_urls = {h.get('input', h.get('url', '')).replace('https://', '').replace('http://', '').rstrip('/')
                     for h in results.get('live_hosts', [])}
        sub_data = [['#', 'Subdomain', 'Status']]
        for i, sub in enumerate(subs, 1):
            status = '🟢 Live' if sub in live_urls else '⚫ Down'
            sub_data.append([str(i), sub, status])

        st2 = Table(sub_data, colWidths=[0.5*inch, 4.5*inch, 1.3*inch])
        st2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (1, -1), 'Courier'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(st2)
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 4. LOCKED PREMIUM SECTIONS (upsell)
    # ═══════════════════════════════════════════
    elements.append(Paragraph("4. Advanced Analysis", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    elements.append(Paragraph(
        "The following advanced analysis sections are available in the "
        "<b>Deep Scan ($199)</b> report. Upgrade to get the complete picture.",
        styles['Body']))
    elements.append(Spacer(1, 0.15*inch))

    # OWASP Mapping (locked)
    upsell_box(
        "See exactly which OWASP Top 10 categories your vulnerabilities map to "
        "(A01: Broken Access Control, A03: Injection, A05: Security Misconfiguration, etc.) "
        "so your developers know precisely what class of vulnerability to prioritize.",
        elements, styles)

    # Compliance (locked)
    upsell_box(
        "Get a PCI DSS, SOC 2, and GDPR compliance assessment showing which findings "
        "violate specific compliance requirements. Essential for businesses handling "
        "payment data or customer information.",
        elements, styles)

    # Detailed Remediation (locked)
    upsell_box(
        "Receive step-by-step fix instructions with actual code examples for each finding. "
        "Instead of 'apply patches,' get specific commands, configuration changes, and "
        "code snippets your team can implement immediately.",
        elements, styles)

    # Executive Summary (locked)
    upsell_box(
        "A board-ready executive summary you can share with stakeholders, management, or "
        "clients. Includes risk trend analysis, industry benchmarking, and a clear "
        "action plan with business impact assessment.",
        elements, styles)

    # SSL/TLS Deep Analysis (locked)
    upsell_box(
        "Full SSL/TLS configuration audit including cipher suite analysis, certificate "
        "chain validation, protocol support matrix, and HSTS preload status. Critical "
        "for e-commerce and sites handling sensitive data.",
        elements, styles)

    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 5. BASIC RECOMMENDATIONS
    # ═══════════════════════════════════════════
    elements.append(Paragraph("5. Recommendations", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    wrap_style = ParagraphStyle('qr_wrap', fontSize=9, leading=12, textColor=colors.HexColor('#374151'))
    hdr_style = ParagraphStyle('qr_hdr', fontSize=10, leading=12, textColor=colors.white, fontName='Helvetica-Bold')

    rec_items = [
        ['🔴 P1', 'Address all HIGH severity findings immediately'],
        ['🟡 P2', 'Fix MEDIUM severity findings within 2 weeks'],
        ['🔵 P3', 'Review LOW and INFO findings when possible'],
        ['⚡ P4', 'Upgrade to Deep Scan for detailed fix instructions'],
    ]
    rec_data = [[Paragraph('Priority', hdr_style), Paragraph('Action', hdr_style)]]
    for row in rec_items:
        rec_data.append([Paragraph(row[0], wrap_style), Paragraph(row[1], wrap_style)])

    rt = Table(rec_data, colWidths=[0.8*inch, 5.5*inch])
    rt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLOR),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(rt)

    elements.append(Spacer(1, 0.4*inch))

    # Final CTA
    cta_data = [[
        Paragraph(
            f"<font size=14 color='{BRAND_COLOR.hexval()}'><b>Ready for the full picture?</b></font><br/><br/>"
            f"<font size=10 color='#374151'>Your Quick Scan found <b>{summary.get('total_vulnerabilities', len(vulns))} "
            f"security findings</b> with a grade of <b>{grade_info['grade']}</b>.</font><br/><br/>"
            f"<font size=10 color='#374151'>The <b>Deep Scan ($199)</b> includes:</font><br/>"
            f"<font size=9 color='#6b7280'>"
            f"✓ OWASP Top 10 mapping for every finding<br/>"
            f"✓ PCI DSS, SOC 2, GDPR compliance check<br/>"
            f"✓ Step-by-step code-level remediation<br/>"
            f"✓ Board-ready executive summary<br/>"
            f"✓ Full SSL/TLS deep analysis<br/>"
            f"✓ API endpoint discovery & testing<br/>"
            f"✓ Priority email support<br/>"
            f"</font><br/>"
            f"<font size=11 color='{BRAND_COLOR.hexval()}'><b>→ Upgrade now at {BRAND_URL}</b></font>",
            ParagraphStyle('cta_text', fontSize=10, leading=15)
        )
    ]]
    ct = Table(cta_data, colWidths=[6.3*inch])
    ct.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG),
        ('BOX', (0, 0), (-1, -1), 2, BRAND_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
    ]))
    elements.append(ct)

    elements.append(Spacer(1, 0.3*inch))
    elements.append(HRFlowable(width="40%", thickness=1, color=BRAND_COLOR,
                                spaceAfter=10, hAlign='CENTER'))
    elements.append(Paragraph(
        f"<font size=9 color='#9ca3af'>{BRAND_NAME} Security · {BRAND_URL} · Report ID: {report_id}</font>",
        ParagraphStyle('final', alignment=TA_CENTER, leading=12)))

    # Build
    doc.build(elements, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"[+] Quick Scan report generated: {output_path}")
    return output_path


# ============================================
# CLI / DEMO
# ============================================
if __name__ == '__main__':
    sample = {
        'domain': 'downeastcabinets.com',
        'scan_date': datetime.now().isoformat(),
        'subdomains': [
            'downeastcabinets.com', 'www.downeastcabinets.com',
            'mail.downeastcabinets.com', 'webmail.downeastcabinets.com',
            'cpanel.downeastcabinets.com', 'ftp.downeastcabinets.com',
            'autodiscover.downeastcabinets.com', 'shop.downeastcabinets.com',
        ],
        'live_hosts': [
            {'url': 'https://downeastcabinets.com', 'input': 'downeastcabinets.com', 'status_code': 200},
            {'url': 'https://www.downeastcabinets.com', 'input': 'www.downeastcabinets.com', 'status_code': 200},
            {'url': 'https://mail.downeastcabinets.com', 'input': 'mail.downeastcabinets.com', 'status_code': 200},
            {'url': 'https://cpanel.downeastcabinets.com', 'input': 'cpanel.downeastcabinets.com', 'status_code': 200},
        ],
        'technologies': ['Apache', 'PHP 8.1', 'jQuery 3.6', 'WordPress 6.4', 'MySQL', 'cPanel'],
        'vulnerabilities': [
            {'name': 'WordPress XML-RPC Pingback Amplification', 'severity': 'high',
             'url': 'https://downeastcabinets.com/xmlrpc.php', 'cve_id': 'CVE-2013-0235',
             'cvss_score': '7.5', 'template_id': 'wordpress-xmlrpc-pingback',
             'description': 'The XML-RPC interface is enabled and accessible, allowing attackers to perform DDoS amplification attacks, brute-force credentials, and enumerate users. This endpoint accepts pingback requests that can be weaponized against third-party targets.'},
            {'name': 'Exposed WordPress Login - No Rate Limiting', 'severity': 'high',
             'url': 'https://downeastcabinets.com/wp-login.php', 'template_id': 'wordpress-login-exposed',
             'cvss_score': '7.3',
             'description': 'The WordPress login page is publicly accessible at the default URL without brute-force protection or CAPTCHA. Automated credential stuffing attacks could compromise administrator accounts.'},
            {'name': 'Missing Content-Security-Policy Header', 'severity': 'medium',
             'url': 'https://downeastcabinets.com', 'template_id': 'missing-csp-header',
             'description': 'No Content-Security-Policy header is set, making the site vulnerable to cross-site scripting attacks and code injection.'},
            {'name': 'Missing X-Frame-Options Header', 'severity': 'medium',
             'url': 'https://downeastcabinets.com', 'template_id': 'missing-x-frame-options',
             'description': 'The X-Frame-Options header is not set, which could allow clickjacking attacks.'},
            {'name': 'WordPress Version Disclosure', 'severity': 'medium',
             'url': 'https://downeastcabinets.com', 'template_id': 'wordpress-version-detect',
             'description': 'The exact WordPress version is exposed through meta tags and RSS feeds.'},
            {'name': 'Directory Listing on Uploads', 'severity': 'medium',
             'url': 'https://downeastcabinets.com/wp-content/uploads/',
             'description': 'Directory listing is enabled on the uploads folder, exposing all uploaded files.'},
            {'name': 'Deprecated TLS 1.0/1.1 Supported', 'severity': 'low',
             'url': 'https://mail.downeastcabinets.com',
             'description': 'The mail server supports deprecated TLS protocols with known weaknesses.'},
            {'name': 'cPanel Login Publicly Accessible', 'severity': 'low',
             'url': 'https://cpanel.downeastcabinets.com:2083',
             'description': 'The cPanel management interface is accessible from the public internet.'},
            {'name': 'DNS CAA Record Not Configured', 'severity': 'info',
             'url': 'downeastcabinets.com',
             'description': 'No CAA DNS records configured — any CA can issue certificates for this domain.'},
            {'name': 'HTTP to HTTPS Redirect Active', 'severity': 'info',
             'url': 'http://downeastcabinets.com',
             'description': 'HTTP correctly redirects to HTTPS but HSTS header is missing.'},
        ],
        'summary': {
            'total_subdomains': 8, 'total_live_hosts': 4, 'total_vulnerabilities': 10,
            'technologies': ['Apache', 'PHP 8.1', 'WordPress 6.4', 'MySQL', 'cPanel'],
            'vulnerability_breakdown': {'critical': 0, 'high': 2, 'medium': 4, 'low': 2, 'info': 2},
            'risk_score': 48,
        }
    }

    out = os.path.join(os.path.dirname(__file__), '..', 'sample_quick_scan.pdf')
    generate_quick_report(sample, out)
    print(f"\nSample Quick Scan: {os.path.abspath(out)}")
