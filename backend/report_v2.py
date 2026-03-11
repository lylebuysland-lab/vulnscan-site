"""
VulnScan.tech — Professional Security Report Generator v2
Features:
- A-F Security Grade (like SSL Labs)
- 0-100 Risk Score with trend tracking
- Color-coded severity sections
- Professional header/footer on every page
- Branded watermark
- Comparison-ready format for repeat audits
"""

import os
import json
import subprocess
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Frame, PageTemplate, BaseDocTemplate
)
from reportlab.graphics.shapes import Drawing, Circle, Rect, String, Line
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF


# ============================================
# BRAND CONSTANTS
# ============================================
BRAND_NAME = "VulnScan"
BRAND_URL = "vulnscan.tech"
BRAND_COLOR = colors.HexColor('#6366f1')
BRAND_DARK = colors.HexColor('#4f46e5')
BRAND_LIGHT = colors.HexColor('#a5b4fc')
BRAND_BG = colors.HexColor('#f8f9fc')

SEVERITY_MAP = {
    'critical': {'color': colors.HexColor('#dc2626'), 'label': 'CRITICAL', 'icon': '🔴', 'weight': 25},
    'high':     {'color': colors.HexColor('#ea580c'), 'label': 'HIGH',     'icon': '🟠', 'weight': 15},
    'medium':   {'color': colors.HexColor('#d97706'), 'label': 'MEDIUM',   'icon': '🟡', 'weight': 5},
    'low':      {'color': colors.HexColor('#2563eb'), 'label': 'LOW',      'icon': '🔵', 'weight': 1},
    'info':     {'color': colors.HexColor('#6b7280'), 'label': 'INFO',     'icon': '⚪', 'weight': 0},
}


def calculate_grade(risk_score: int) -> dict:
    """Calculate A-F security grade from risk score (0-100, lower is better)."""
    if risk_score <= 10:
        return {'grade': 'A+', 'color': colors.HexColor('#059669'), 'label': 'Excellent', 'description': 'Your security posture is exemplary. Minimal to no vulnerabilities detected.'}
    elif risk_score <= 20:
        return {'grade': 'A', 'color': colors.HexColor('#10b981'), 'label': 'Very Good', 'description': 'Strong security posture with only minor informational findings.'}
    elif risk_score <= 35:
        return {'grade': 'B', 'color': colors.HexColor('#84cc16'), 'label': 'Good', 'description': 'Generally secure with some low-severity findings that should be addressed.'}
    elif risk_score <= 50:
        return {'grade': 'C', 'color': colors.HexColor('#eab308'), 'label': 'Fair', 'description': 'Moderate security concerns detected. Several findings require attention.'}
    elif risk_score <= 70:
        return {'grade': 'D', 'color': colors.HexColor('#f97316'), 'label': 'Poor', 'description': 'Significant vulnerabilities detected. Immediate remediation recommended.'}
    else:
        return {'grade': 'F', 'color': colors.HexColor('#dc2626'), 'label': 'Critical', 'description': 'Critical security failures found. Urgent action required.'}


def calculate_risk_score(vulns: list) -> int:
    """Calculate risk score 0-100 from vulnerability list."""
    score = 0
    for v in vulns:
        sev = v.get('severity', 'info').lower()
        weight = SEVERITY_MAP.get(sev, {}).get('weight', 0)
        score += weight
    return min(100, score)


def header_footer(canvas, doc):
    """Draw professional header and footer on every page."""
    canvas.saveState()
    width, height = letter

    # Header bar
    canvas.setFillColor(BRAND_COLOR)
    canvas.rect(0, height - 45, width, 45, fill=True, stroke=False)

    # Header text
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica-Bold', 14)
    canvas.drawString(0.75*inch, height - 30, f"⚡ {BRAND_NAME}")

    canvas.setFont('Helvetica', 9)
    canvas.drawRightString(width - 0.75*inch, height - 25, "SECURITY ASSESSMENT REPORT")
    canvas.drawRightString(width - 0.75*inch, height - 37, "CONFIDENTIAL")

    # Footer
    canvas.setFillColor(colors.HexColor('#e5e7eb'))
    canvas.rect(0, 0, width, 35, fill=True, stroke=False)

    canvas.setFillColor(colors.HexColor('#6b7280'))
    canvas.setFont('Helvetica', 8)
    canvas.drawString(0.75*inch, 15, f"© 2026 {BRAND_NAME} Security · {BRAND_URL}")
    canvas.drawCentredString(width/2, 15, f"Page {doc.page}")
    canvas.drawRightString(width - 0.75*inch, 15, "CONFIDENTIAL — DO NOT DISTRIBUTE")

    # Subtle watermark — very faint, won't interfere with text
    canvas.setFillColor(colors.HexColor('#f5f5fa'))
    canvas.setFont('Helvetica-Bold', 50)
    canvas.saveState()
    canvas.translate(width/2, 120)
    canvas.rotate(30)
    canvas.drawCentredString(0, 0, BRAND_NAME)
    canvas.restoreState()

    canvas.restoreState()


def build_grade_visual(grade_info: dict, risk_score: int) -> Table:
    """Build the visual grade card."""
    grade = grade_info['grade']
    grade_color = grade_info['color']

    # Grade circle (simulated with table)
    grade_cell = Paragraph(
        f"<font size=48 color='{grade_color.hexval()}'><b>{grade}</b></font>",
        ParagraphStyle('grade', alignment=TA_CENTER, leading=56)
    )

    score_cell = Paragraph(
        f"<font size=11><b>Security Grade: {grade}</b></font><br/>"
        f"<font size=9 color='#6b7280'>Risk Score: {risk_score}/100</font><br/><br/>"
        f"<font size=10><b>{grade_info['label']}</b></font><br/>"
        f"<font size=9 color='#6b7280'>{grade_info['description']}</font>",
        ParagraphStyle('gradeDesc', fontSize=10, leading=14)
    )

    data = [[grade_cell, score_cell]]
    t = Table(data, colWidths=[1.8*inch, 4.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG),
        ('BOX', (0, 0), (-1, -1), 2, grade_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
    ]))
    return t


def build_severity_summary_table(breakdown: dict) -> Table:
    """Build visual severity breakdown table."""
    total = sum(breakdown.values())
    data = [['', 'Severity', 'Count', 'Percentage', 'Status']]

    for sev_key in ['critical', 'high', 'medium', 'low', 'info']:
        sev = SEVERITY_MAP[sev_key]
        count = breakdown.get(sev_key, 0)
        pct = f"{(count/total*100):.0f}%" if total > 0 else "0%"
        status = 'CLEAR ✓' if count == 0 else ('⚠ ACTION REQUIRED' if sev_key in ['critical', 'high'] else 'Review')

        data.append([
            sev['icon'], sev['label'], str(count), pct, status
        ])

    data.append(['', 'TOTAL', str(total), '100%', ''])

    t = Table(data, colWidths=[0.5*inch, 1.3*inch, 0.8*inch, 1*inch, 2.7*inch])
    t.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        # Body
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, BRAND_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        # Total row
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    return t


def generate_report(results: dict, output_path: str) -> str:
    """Generate the full professional PDF report."""
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        topMargin=0.9*inch, bottomMargin=0.7*inch,
        leftMargin=0.75*inch, rightMargin=0.75*inch
    )

    styles = getSampleStyleSheet()
    # Custom styles
    s = lambda name, **kw: styles.add(ParagraphStyle(name, **kw))
    s('SectionTitle', parent=styles['Heading1'], fontSize=18, textColor=BRAND_COLOR,
      spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold')
    s('SubSection', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#1f2937'),
      spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold')
    s('Body', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#374151'),
      spaceAfter=6, leading=15)
    s('Muted', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#6b7280'),
      spaceAfter=4, leading=12)
    s('CodeMono', parent=styles['Normal'], fontSize=9, fontName='Courier',
      textColor=BRAND_COLOR, spaceAfter=4)
    s('Center', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER,
      textColor=colors.HexColor('#6b7280'))
    s('VulnTitle', parent=styles['Heading3'], fontSize=12, spaceBefore=12,
      spaceAfter=4, fontName='Helvetica-Bold')

    elements = []
    domain = results.get('domain', 'Unknown')
    scan_date = datetime.fromisoformat(results.get('scan_date', datetime.now().isoformat()))
    summary = results.get('summary', {})
    vulns = results.get('vulnerabilities', [])

    # Calculate grade
    risk_score = summary.get('risk_score', calculate_risk_score(vulns))
    grade_info = calculate_grade(risk_score)
    report_id = f"VS-{scan_date.strftime('%Y%m%d')}-{abs(hash(domain)) % 10000:04d}"

    # ═══════════════════════════════════════════
    # COVER PAGE
    # ═══════════════════════════════════════════
    elements.append(Spacer(1, 0.8*inch))
    
    # Brand name
    elements.append(Paragraph(
        f"<font size=36 color='{BRAND_COLOR.hexval()}'><b>{BRAND_NAME}</b></font>",
        ParagraphStyle('cover_brand', alignment=TA_CENTER, spaceAfter=8, leading=44)))
    
    # Subtitle
    elements.append(Paragraph(
        "<font size=13 color='#9ca3af'>SECURITY ASSESSMENT REPORT</font>",
        ParagraphStyle('cover_sub', alignment=TA_CENTER, spaceAfter=24, leading=16)))

    # Divider
    elements.append(HRFlowable(width="50%", thickness=2, color=BRAND_COLOR,
                                spaceAfter=28, hAlign='CENTER'))

    # Grade — large centered letter
    elements.append(Paragraph(
        f"<font size=80 color='{grade_info['color'].hexval()}'><b>{grade_info['grade']}</b></font>",
        ParagraphStyle('cover_grade', alignment=TA_CENTER, spaceAfter=0, leading=90)))
    
    # Grade label
    elements.append(Paragraph(
        f"<font size=14 color='#6b7280'>{grade_info['label']} — Risk Score {risk_score}/100</font>",
        ParagraphStyle('cover_label', alignment=TA_CENTER, spaceAfter=32, leading=18)))

    # Meta info in a clean bordered box
    meta_data = [
        ['Target Domain', domain],
        ['Report Date', scan_date.strftime('%B %d, %Y')],
        ['Report ID', report_id],
        ['Classification', 'CONFIDENTIAL'],
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
    
    elements.append(Spacer(1, 0.4*inch))
    elements.append(Paragraph(
        f"<font size=9 color='#9ca3af'>Generated by {BRAND_NAME} Security · {BRAND_URL}</font>",
        ParagraphStyle('cover_footer', alignment=TA_CENTER, leading=12)))
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # TABLE OF CONTENTS
    # ═══════════════════════════════════════════
    elements.append(Paragraph("Table of Contents", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))
    toc_items = [
        '1. Executive Summary',
        '2. Security Grade & Risk Score',
        '3. Vulnerability Breakdown',
        '4. Attack Surface Analysis',
        '5. Detailed Findings',
        '6. Technology Stack',
        '7. Recommendations',
        '8. Methodology & Disclaimer',
    ]
    for item in toc_items:
        elements.append(Paragraph(f"<font size=11>{item}</font>", 
            ParagraphStyle('toc', spaceBefore=6, spaceAfter=6, leftIndent=20)))
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 1. EXECUTIVE SUMMARY
    # ═══════════════════════════════════════════
    elements.append(Paragraph("1. Executive Summary", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    elements.append(Paragraph(
        f"A comprehensive automated security assessment was performed on "
        f"<b>{domain}</b> on {scan_date.strftime('%B %d, %Y')}. This report "
        f"presents the findings from subdomain enumeration, live host detection, "
        f"technology fingerprinting, and vulnerability scanning using 50+ security engines.",
        styles['Body']))

    # Key metrics boxes
    metrics = [
        [f"<font size=20><b>{summary.get('total_subdomains', 0)}</b></font><br/>"
         f"<font size=8 color='#6b7280'>SUBDOMAINS</font>",
         f"<font size=20><b>{summary.get('total_live_hosts', 0)}</b></font><br/>"
         f"<font size=8 color='#6b7280'>LIVE HOSTS</font>",
         f"<font size=20><b>{summary.get('total_vulnerabilities', 0)}</b></font><br/>"
         f"<font size=8 color='#6b7280'>FINDINGS</font>",
         f"<font size=20 color='{grade_info['color'].hexval()}'><b>{grade_info['grade']}</b></font><br/>"
         f"<font size=8 color='#6b7280'>GRADE</font>",
        ]
    ]
    metrics_p = [[Paragraph(c, ParagraphStyle('mc', alignment=TA_CENTER, leading=24)) for c in metrics[0]]]
    mt2 = Table(metrics_p, colWidths=[1.6*inch]*4)
    mt2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(mt2)
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 2. SECURITY GRADE
    # ═══════════════════════════════════════════
    elements.append(Paragraph("2. Security Grade & Risk Score", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    elements.append(build_grade_visual(grade_info, risk_score))
    elements.append(Spacer(1, 0.2*inch))

    # Grade scale reference
    elements.append(Paragraph("<b>Grade Scale Reference</b>", styles['SubSection']))
    grade_scale = [
        ['Grade', 'Score Range', 'Rating', 'Action Required'],
        ['A+', '0-10', 'Excellent', 'Maintain current posture'],
        ['A',  '11-20', 'Very Good', 'Minor improvements'],
        ['B',  '21-35', 'Good', 'Address low-severity items'],
        ['C',  '36-50', 'Fair', 'Plan remediation sprint'],
        ['D',  '51-70', 'Poor', 'Immediate remediation needed'],
        ['F',  '71-100', 'Critical', 'STOP — fix critical issues now'],
    ]
    gs = Table(grade_scale, colWidths=[0.8*inch, 1.2*inch, 1.2*inch, 3.1*inch])
    gs.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (2, -1), 'CENTER'),
    ]))
    elements.append(gs)

    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<i>Track your grade improvement over time by scheduling regular assessments. "
        "Compare this report's grade with previous scans to measure your security progress.</i>",
        styles['Muted']))
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 3. VULNERABILITY BREAKDOWN
    # ═══════════════════════════════════════════
    elements.append(Paragraph("3. Vulnerability Breakdown", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    vb = summary.get('vulnerability_breakdown', {})
    elements.append(build_severity_summary_table(vb))
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 4. ATTACK SURFACE
    # ═══════════════════════════════════════════
    elements.append(Paragraph("4. Attack Surface Analysis", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    elements.append(Paragraph(
        f"<b>{summary.get('total_subdomains', 0)} subdomains</b> were discovered, "
        f"of which <b>{summary.get('total_live_hosts', 0)}</b> are actively responding.",
        styles['Body']))

    subs = results.get('subdomains', [])[:60]
    if subs:
        sub_data = [['#', 'Subdomain', 'Status']]
        live_urls = {h.get('input', h.get('url', '')).replace('https://', '').replace('http://', '').rstrip('/')
                     for h in results.get('live_hosts', [])}
        for i, sub in enumerate(subs, 1):
            status = '🟢 Live' if sub in live_urls else '⚫ Down'
            sub_data.append([str(i), sub, status])

        st = Table(sub_data, colWidths=[0.5*inch, 4.5*inch, 1.3*inch])
        st.setStyle(TableStyle([
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
        elements.append(st)

    if len(results.get('subdomains', [])) > 60:
        elements.append(Paragraph(
            f"<i>... and {len(results['subdomains']) - 60} additional subdomains. "
            f"Full list available in the raw data export.</i>", styles['Muted']))
    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 5. DETAILED FINDINGS
    # ═══════════════════════════════════════════
    if vulns:
        elements.append(Paragraph("5. Detailed Findings", styles['SectionTitle']))
        elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

        sev_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4}
        vulns_sorted = sorted(vulns, key=lambda v: sev_order.get(v.get('severity', 'info'), 4))

        for i, vuln in enumerate(vulns_sorted[:40], 1):
            sev = vuln.get('severity', 'info').lower()
            sev_info = SEVERITY_MAP.get(sev, SEVERITY_MAP['info'])

            # Finding header with severity badge
            badge_data = [[
                Paragraph(f"<font color='white' size=9><b> {sev_info['label']} </b></font>",
                    ParagraphStyle('badge', alignment=TA_CENTER)),
                Paragraph(f"<font size=12><b>Finding #{i}: {vuln.get('name', 'Unknown')}</b></font>",
                    ParagraphStyle('fname', fontSize=12)),
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

            # Finding details
            detail_rows = []
            if vuln.get('url'):
                detail_rows.append(['Affected URL', vuln['url']])
            if vuln.get('cve_id'):
                detail_rows.append(['CVE ID', vuln['cve_id']])
            if vuln.get('cvss_score'):
                detail_rows.append(['CVSS Score', f"{vuln['cvss_score']}/10.0"])
            if vuln.get('template_id'):
                detail_rows.append(['Detection ID', vuln['template_id']])

            if detail_rows:
                dt = Table(detail_rows, colWidths=[1.3*inch, 5*inch])
                dt.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('FONTNAME', (1, 0), (1, -1), 'Courier'),
                    ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ]))
                elements.append(dt)

            if vuln.get('description'):
                elements.append(Spacer(1, 4))
                elements.append(Paragraph(
                    f"<b>Description:</b> {vuln['description'][:600]}", styles['Body']))

            # Remediation
            elements.append(Paragraph(
                "<b>Remediation:</b> Apply vendor security patches, update affected software "
                "to the latest stable version, and verify the fix with a follow-up scan.",
                styles['Body']))

            refs = vuln.get('reference', [])
            if refs and isinstance(refs, list):
                for ref in refs[:3]:
                    elements.append(Paragraph(
                        f"<font size=8 color='{BRAND_COLOR.hexval()}'>↗ {ref}</font>",
                        styles['Muted']))

            elements.append(Spacer(1, 0.15*inch))
            elements.append(HRFlowable(width="100%", thickness=0.5,
                                        color=colors.HexColor('#e5e7eb'), spaceAfter=8))

        elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 6. TECHNOLOGY STACK
    # ═══════════════════════════════════════════
    techs = summary.get('technologies', [])
    elements.append(Paragraph("6. Detected Technology Stack", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    if techs:
        tech_data = [['Technology', 'Category']]
        for tech in techs[:25]:
            cat = 'Web Server' if tech.lower() in ['nginx', 'apache', 'iis'] \
                else 'Framework' if tech.lower() in ['react', 'vue', 'angular', 'next.js', 'django', 'rails'] \
                else 'Language' if tech.lower() in ['php', 'python', 'node.js', 'java', 'ruby'] \
                else 'Database' if tech.lower() in ['mysql', 'postgresql', 'mongodb', 'redis'] \
                else 'CDN/Cloud' if tech.lower() in ['cloudflare', 'aws', 'cloudfront', 'akamai'] \
                else 'Other'
            tech_data.append([tech, cat])
        tt = Table(tech_data, colWidths=[3.5*inch, 2.8*inch])
        tt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BRAND_BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(tt)
    else:
        elements.append(Paragraph("No technologies were detected during this scan.", styles['Body']))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 7. RECOMMENDATIONS
    # ═══════════════════════════════════════════
    elements.append(Paragraph("7. Recommendations", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    rec_items = [
        ['🔴 P1', 'Remediate all Critical and High severity findings immediately', 'Within 48 hours'],
        ['🟠 P2', 'Patch all known CVEs on live hosts', 'Within 1 week'],
        ['🟡 P3', 'Implement missing security headers (CSP, HSTS, X-Frame-Options)', 'Within 2 weeks'],
        ['🔵 P4', 'Upgrade deprecated TLS/SSL configurations to TLS 1.2+', 'Within 1 month'],
        ['⚪ P5', 'Schedule follow-up scan to verify fixes and track grade', 'Monthly'],
    ]
    
    wrap_style = ParagraphStyle('rec_wrap', fontSize=9, leading=12, textColor=colors.HexColor('#374151'))
    header_wrap = ParagraphStyle('rec_hdr', fontSize=10, leading=12, textColor=colors.white, fontName='Helvetica-Bold')
    
    rec_data = [[Paragraph('Priority', header_wrap), Paragraph('Action', header_wrap), Paragraph('Timeline', header_wrap)]]
    for row in rec_items:
        rec_data.append([
            Paragraph(row[0], wrap_style),
            Paragraph(row[1], wrap_style),
            Paragraph(f'<b>{row[2]}</b>', wrap_style),
        ])
    
    rt = Table(rec_data, colWidths=[0.7*inch, 4.2*inch, 1.4*inch])
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

    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        f"<b>Schedule your next assessment</b> to track improvement. Visit "
        f"<font color='{BRAND_COLOR.hexval()}'><b>{BRAND_URL}</b></font> to compare "
        f"your grade over time.", styles['Body']))

    elements.append(PageBreak())

    # ═══════════════════════════════════════════
    # 8. METHODOLOGY & DISCLAIMER
    # ═══════════════════════════════════════════
    elements.append(Paragraph("8. Methodology & Disclaimer", styles['SectionTitle']))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_COLOR, spaceAfter=12))

    elements.append(Paragraph("<b>Methodology</b>", styles['SubSection']))
    elements.append(Paragraph(
        "This assessment used automated, non-destructive scanning techniques including: "
        "DNS enumeration, HTTP probing, technology fingerprinting, and vulnerability "
        "detection using 50+ open-source and proprietary security engines. No exploitation "
        "was attempted. All tests were performed from an external perspective, simulating "
        "an attacker's view of the target.", styles['Body']))

    elements.append(Paragraph("<b>Disclaimer</b>", styles['SubSection']))
    elements.append(Paragraph(
        "This report is provided 'as-is' and represents the security posture of the "
        "target at the time of scanning. Results may change as configurations are updated. "
        "This report is confidential and intended solely for the authorized recipient. "
        "VulnScan assumes no liability for actions taken based on this report.",
        styles['Body']))

    elements.append(Spacer(1, 0.5*inch))
    elements.append(HRFlowable(width="60%", thickness=1, color=BRAND_COLOR,
                                spaceAfter=12, hAlign='CENTER'))
    elements.append(Paragraph(
        f"<font size=11><b>⚡ {BRAND_NAME} Security</b></font><br/>"
        f"<font size=9 color='#6b7280'>{BRAND_URL} · Automated Security Intelligence</font><br/>"
        f"<font size=8 color='#9ca3af'>Report ID: {report_id}</font>",
        ParagraphStyle('final', alignment=TA_CENTER, leading=16)))

    # Build with custom header/footer
    doc.build(elements, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"[+] Professional report generated: {output_path}")
    return output_path


# ============================================
# CLI USAGE
# ============================================
if __name__ == '__main__':
    import sys

    # Demo mode — generate sample report
    sample = {
        'domain': 'acmecorp.com',
        'scan_date': datetime.now().isoformat(),
        'subdomains': [f'{sub}.acmecorp.com' for sub in
            ['api', 'mail', 'dev', 'staging', 'cdn', 'admin', 'app', 'blog',
             'docs', 'status', 'vpn', 'git', 'jenkins', 'grafana', 'beta']],
        'live_hosts': [
            {'url': 'https://api.acmecorp.com', 'status_code': 200},
            {'url': 'https://app.acmecorp.com', 'status_code': 200},
            {'url': 'https://admin.acmecorp.com', 'status_code': 403},
            {'url': 'https://jenkins.acmecorp.com', 'status_code': 200},
        ],
        'technologies': ['Nginx', 'React', 'Node.js', 'PostgreSQL', 'AWS CloudFront', 'Jenkins', 'Docker'],
        'vulnerabilities': [
            {'name': 'SQL Injection in Authentication Endpoint', 'severity': 'critical',
             'url': 'https://api.acmecorp.com/auth/login', 'cve_id': 'CVE-2026-1234',
             'cvss_score': '9.8', 'template_id': 'sqli-auth-bypass',
             'description': 'The login endpoint accepts unsanitized user input in the username parameter, allowing an attacker to bypass authentication and access arbitrary user accounts.',
             'reference': ['https://owasp.org/www-community/attacks/SQL_Injection', 'https://cwe.mitre.org/data/definitions/89.html']},
            {'name': 'Exposed Jenkins Dashboard', 'severity': 'high',
             'url': 'https://jenkins.acmecorp.com', 'template_id': 'jenkins-unauthenticated',
             'description': 'Jenkins CI/CD server is publicly accessible without authentication, potentially exposing build secrets, API keys, and deployment credentials.'},
            {'name': 'Exposed Admin Panel Without Multi-Factor Auth', 'severity': 'high',
             'url': 'https://admin.acmecorp.com', 'template_id': 'admin-panel-detect',
             'description': 'The administrative panel is accessible from the internet and does not enforce multi-factor authentication.'},
            {'name': 'Missing Content-Security-Policy Header', 'severity': 'medium',
             'url': 'https://app.acmecorp.com', 'template_id': 'missing-csp',
             'description': 'The application does not set a Content-Security-Policy header, making it more susceptible to XSS attacks.'},
            {'name': 'Server Version Disclosure', 'severity': 'medium',
             'url': 'https://api.acmecorp.com', 'template_id': 'server-version-disclosure',
             'description': 'The web server reveals its version information in HTTP response headers.'},
            {'name': 'TLS 1.0 Protocol Supported', 'severity': 'low',
             'url': 'https://mail.acmecorp.com', 'template_id': 'tls-1.0-detect',
             'description': 'The server supports the deprecated TLS 1.0 protocol which has known security weaknesses.'},
            {'name': 'HSTS Header Missing', 'severity': 'low',
             'url': 'https://blog.acmecorp.com', 'template_id': 'hsts-missing',
             'description': 'HTTP Strict Transport Security header is not configured.'},
            {'name': 'DNS CAA Record Missing', 'severity': 'info',
             'url': 'acmecorp.com', 'template_id': 'dns-caa-missing',
             'description': 'No CAA DNS records are configured, allowing any CA to issue certificates for this domain.'},
        ],
        'summary': {
            'total_subdomains': 15, 'total_live_hosts': 4,
            'total_vulnerabilities': 8,
            'technologies': ['Nginx', 'React', 'Node.js', 'PostgreSQL', 'AWS CloudFront', 'Jenkins', 'Docker'],
            'vulnerability_breakdown': {'critical': 1, 'high': 2, 'medium': 2, 'low': 2, 'info': 1},
            'risk_score': 62,
        }
    }

    out = os.path.join(os.path.dirname(__file__), '..', 'sample_report_v2.pdf')
    generate_report(sample, out)
    print(f"\nSample report: {os.path.abspath(out)}")
