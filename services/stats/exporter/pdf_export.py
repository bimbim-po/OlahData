import io
from typing import Dict, Any, List
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfgen import canvas

from exporter.docx_export import fmt_id

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#71767B"))
        
        # Footer page number
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(A4[0] - 54, 36, page_text)
        self.drawString(54, 36, "OlahData.id — Pengolah Data Skripsi Kuantitatif")

        # Watermark if flag set on canvas
        if getattr(self, "_watermark", False):
            self.setFont("Helvetica-Bold", 42)
            self.setFillColor(colors.Color(0.8, 0.2, 0.2, alpha=0.08))
            self.translate(A4[0] / 2, A4[1] / 2)
            self.rotate(45)
            self.drawCentredString(0, 0, "DRAF VERSI GRATIS")

        self.restoreState()

def generate_pdf_report(
    results: Dict[str, Any],
    project_title: str = "Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan",
    include_declaration: bool = True,
    watermark: bool = False
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        alignment=1, # Center
        textColor=colors.HexColor("#1F2328")
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#57606A")
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        spaceBefore=12,
        spaceAfter=4,
        textColor=colors.HexColor("#1F6F5C")
    )
    caption_style = ParagraphStyle(
        'TableCaption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=12,
        spaceAfter=4,
        textColor=colors.HexColor("#24292F")
    )
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1F2328")
    )
    cell_style_bold = ParagraphStyle(
        'TableCellBold',
        parent=cell_style,
        fontName='Helvetica-Bold',
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        spaceBefore=4,
        spaceAfter=8,
        textColor=colors.HexColor("#1F2328")
    )
    note_style = ParagraphStyle(
        'TableNote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        spaceBefore=3,
        spaceAfter=8,
        textColor=colors.HexColor("#57606A")
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("LAPORAN HASIL PENGOLAHAN DATA SKRIPSI KUANTITATIF", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Judul: {project_title}<br/>Sampel: {results.get('respondentCount', '-')} Responden | Taraf Signifikansi α = {fmt_id(results.get('significanceLevel', 0.05), 2)}", subtitle_style))
    story.append(Spacer(1, 10))

    def create_apa_table(headers: List[str], rows: List[List[str]]):
        data = [[Paragraph(h, cell_style_bold) for h in headers]]
        for row in rows:
            data.append([Paragraph(str(val), cell_style) for val in row])
        
        t = Table(data, hAlign='CENTER')
        t.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 1.2, colors.black),
            ('LINEBELOW', (0, 0), (-1, 0), 0.6, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 1.2, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        return t

    sec_idx = 1
    explanations = results.get("explanations", {})

    # 1. Descriptive
    if "descriptive" in results and results["descriptive"]:
        story.append(Paragraph(f"4.{sec_idx} Analisis Statistik Deskriptif", h2_style))
        story.append(Paragraph(f"Tabel 4.{sec_idx}. Statistik Deskriptif Variabel Penelitian", caption_style))
        desc_rows = [
            [d["variable"], fmt_id(d["n"], 0), fmt_id(d["mean"], 3), fmt_id(d["median"], 3), fmt_id(d["stdDev"], 3), fmt_id(d["min"], 3), fmt_id(d["max"], 3)]
            for d in results["descriptive"]
        ]
        story.append(create_apa_table(["Variabel", "N", "Mean", "Median", "Std Dev", "Min", "Max"], desc_rows))
        story.append(Paragraph("Sumber: Dihitung oleh mesin statistik deterministik OlahData.", note_style))
        if explanations.get("descriptive"):
            story.append(Paragraph(f"<b>Interpretasi:</b> {explanations['descriptive']}", body_style))
        sec_idx += 1

    # 2. Validity
    if "validity" in results and results["validity"]:
        story.append(Paragraph(f"4.{sec_idx} Uji Validitas Butir Pernyataan", h2_style))
        story.append(Paragraph(f"Tabel 4.{sec_idx}. Hasil Uji Validitas Pearson Product Moment", caption_style))
        val_rows = [
            [v["construct"], v["item"], fmt_id(v["rHitung"], 4), fmt_id(v["rTabel"], 4), "Valid" if v["valid"] else "Gugur"]
            for v in results["validity"]
        ]
        story.append(create_apa_table(["Konstruk", "Item", "r Hitung", "r Tabel", "Status"], val_rows))
        story.append(Paragraph("Sumber: Dihitung oleh mesin statistik deterministik OlahData.", note_style))
        if explanations.get("validity"):
            story.append(Paragraph(f"<b>Interpretasi:</b> {explanations['validity']}", body_style))
        sec_idx += 1

    # 3. Reliability
    if "reliability" in results and results["reliability"]:
        story.append(Paragraph(f"4.{sec_idx} Uji Reliabilitas Instrumen", h2_style))
        story.append(Paragraph(f"Tabel 4.{sec_idx}. Hasil Uji Reliabilitas Cronbach's Alpha", caption_style))
        rel_rows = [
            [r["construct"], fmt_id(r["itemCount"], 0), fmt_id(r["cronbachAlpha"], 4), "0,600", "Reliabel" if r["reliable"] else "Tidak Reliabel"]
            for r in results["reliability"]
        ]
        story.append(create_apa_table(["Konstruk", "Item", "Cronbach's Alpha", "Ambang Batas", "Status"], rel_rows))
        story.append(Paragraph("Sumber: Dihitung oleh mesin statistik deterministik OlahData.", note_style))
        if explanations.get("reliability"):
            story.append(Paragraph(f"<b>Interpretasi:</b> {explanations['reliability']}", body_style))
        sec_idx += 1

    # 4. Regression
    if "regression" in results and results["regression"]:
        story.append(Paragraph(f"4.{sec_idx} Analisis Regresi Linier Berganda", h2_style))
        story.append(Paragraph(f"Tabel 4.{sec_idx}. Koefisien Regresi dan Uji Parsial (Uji t)", caption_style))
        reg_rows = [
            [r["variable"], fmt_id(r["coefficient"], 4), fmt_id(r["stdError"], 4), fmt_id(r["tHitung"], 4), fmt_id(r["pValue"], 4), "Signifikan" if r["significant"] else "Tidak"]
            for r in results["regression"]
        ]
        story.append(create_apa_table(["Variabel", "B", "Std Error", "t Hitung", "Sig.", "Status"], reg_rows))
        story.append(Paragraph("Sumber: Dihitung oleh mesin statistik deterministik OlahData.", note_style))
        if explanations.get("regression"):
            story.append(Paragraph(f"<b>Interpretasi:</b> {explanations['regression']}", body_style))
        sec_idx += 1

    # Audit Trail Page
    story.append(PageBreak())
    story.append(Paragraph("Lampiran: Jejak Hitung & Metadata Reproduksibilitas", h2_style))
    audit_data = [
        [Paragraph("ID Analisis", cell_style_bold), Paragraph(str(results.get("id", "-")), cell_style)],
        [Paragraph("ID Proyek & Versi", cell_style_bold), Paragraph(f"{results.get('projectId', '-')} / {results.get('dataVersionId', '-')}", cell_style)],
        [Paragraph("Waktu Komputasi", cell_style_bold), Paragraph(str(results.get("timestamp", "-")), cell_style)],
        [Paragraph("Versi Mesin", cell_style_bold), Paragraph(f"v{results.get('engineVersion', '1.0.0')}", cell_style)],
        [Paragraph("Ukuran Sampel (N)", cell_style_bold), Paragraph(f"{results.get('respondentCount', '-')} responden", cell_style)],
    ]
    t_audit = Table(audit_data, hAlign='CENTER')
    t_audit.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.black),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_audit)

    # Pernyataan Penggunaan Alat
    if include_declaration:
        story.append(PageBreak())
        story.append(Paragraph("SURAT PERNYATAAN PENGGUNAAN ALAT BANTU OLAH DATA AKADEMIK", title_style))
        story.append(Spacer(1, 14))
        decl_p = (
            "Saya yang bertanda tangan di bawah ini menyatakan dengan sesungguhnya bahwa dalam penyusunan "
            "skripsi ini, saya menggunakan aplikasi OlahData secara mandiri sebagai alat bantu komputasi statistik "
            "deterministik dan pembuat draf tabel Bab 4.<br/><br/>"
            "Saya menegaskan bahwa:<br/>"
            "1. Data responden yang diolah merupakan data primer asli hasil kuesioner yang telah saya kumpulkan sendiri.<br/>"
            "2. Aplikasi OlahData tidak melakukan penambahan, fabrikasi, atau manipulasi terhadap data mentah responden.<br/>"
            "3. Penjelasan atau interpretasi otomatis telah saya telaah dan verifikasi secara kritis sesuai konteks teori penelitian saya.<br/>"
            "4. Tanggung jawab akademis sepenuhnya berada pada diri saya sebagai peneliti."
        )
        story.append(Paragraph(decl_p, body_style))

    def make_canvas(*args, **kwargs):
        c = NumberedCanvas(*args, **kwargs)
        setattr(c, "_watermark", watermark)
        return c

    doc.build(story, canvasmaker=make_canvas)
    return buffer.getvalue()
