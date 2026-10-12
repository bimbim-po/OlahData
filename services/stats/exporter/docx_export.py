import io
from typing import Dict, Any, List
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def fmt_id(val: Any, decimals: int = 3) -> str:
    """Formats numeric values into Indonesian locale format (comma decimal, dot thousand)."""
    if val is None:
        return "-"
    if isinstance(val, (int, float)):
        if isinstance(val, int) or val.is_integer():
            return f"{int(val):,}".replace(",", ".")
        formatted = f"{val:,.{decimals}f}"
        # Swap comma and period for Indonesian locale
        parts = formatted.split(".")
        integer_part = parts[0].replace(",", ".")
        decimal_part = parts[1] if len(parts) > 1 else ""
        return f"{integer_part},{decimal_part}" if decimal_part else integer_part
    return str(val)

def set_cell_border(cell, **kwargs):
    """
    Set cell borders
    kwargs: top, bottom, left, right
    values: dict(sz=12, val='single', color='000000')
    """
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = tcPr.first_child_found_in("w:tcBorders")
    if tcBorders is None:
        tcBorders = OxmlElement('w:tcBorders')
        tcPr.append(tcBorders)

    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'w:{edge}'
            element = tcBorders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                tcBorders.append(element)
            for key, val in edge_data.items():
                element.set(qn(f'w:{key}'), str(val))
        elif edge in kwargs and kwargs[edge] is None:
            tag = f'w:{edge}'
            element = tcBorders.find(qn(tag))
            if element is not None:
                tcBorders.remove(element)

def apply_apa_table_styling(table):
    """Applies classic APA 7th style: thin horizontal lines at top, header bottom, and table bottom."""
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    num_rows = len(table.rows)
    num_cols = len(table.columns)

    thin_border = {"val": "single", "sz": "6", "space": "0", "color": "333333"}
    thick_border = {"val": "single", "sz": "12", "space": "0", "color": "000000"}

    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            borders = {}
            if r_idx == 0:
                borders["top"] = thick_border
                borders["bottom"] = thin_border
            elif r_idx == num_rows - 1:
                borders["bottom"] = thick_border
            set_cell_border(cell, **borders)

def generate_docx_report(
    results: Dict[str, Any],
    project_title: str = "Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan",
    include_declaration: bool = True,
    watermark: bool = False
) -> bytes:
    """
    Generates an academic-grade APA 7th format Word document (.docx).
    """
    doc = docx.Document()

    # Normal style font: Times New Roman or Calibri
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(11)
    font.color.rgb = RGBColor(0x1F, 0x23, 0x28)

    # Document Header / Watermark note if free tier
    if watermark:
        header = doc.sections[0].header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("DRAF HASIL — VERSI GRATIS OLAHDATA.ID (DOKUMEN TINJAUAN AKADEMIK)")
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0xB3, 0x41, 0x2E)

    # Document Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_run = title_p.add_run("LAPORAN HASIL PENGOLAHAN DATA PENELITIAN KUANTITATIF\n(DRAF BAB 4 SKRIPSI)")
    t_run.bold = True
    t_run.font.size = Pt(14)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    s_run = sub_p.add_run(f"Judul Penelitian: {project_title}\nJumlah Responden: {results.get('respondentCount', '-')} | Taraf Signifikansi α = {fmt_id(results.get('significanceLevel', 0.05), 2)}")
    s_run.font.size = Pt(10)
    s_run.font.italic = True

    doc.add_paragraph()

    # Helper for adding an APA Table
    def add_apa_section(section_number: str, title: str, headers: List[str], rows: List[List[str]], note: str = None, explanation: str = None):
        h = doc.add_heading(f"4.{section_number} {title}", level=2)
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(4)

        caption_p = doc.add_paragraph()
        c_run = caption_p.add_run(f"Tabel 4.{section_number}\n{title}")
        c_run.font.italic = True
        c_run.font.size = Pt(10.5)

        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        apply_apa_table_styling(table)

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.bold = True
                run.font.size = Pt(10)

        # Data Rows
        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            for c_idx, cell_value in enumerate(row_data):
                row_cells[c_idx].text = str(cell_value)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx > 0 and any(char.isdigit() for char in str(cell_value)) else WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.size = Pt(10)

        # Note / Source badge
        note_p = doc.add_paragraph()
        note_p.paragraph_format.space_before = Pt(2)
        note_p.paragraph_format.space_after = Pt(6)
        n_run = note_p.add_run(f"Catatan: Dihitung oleh mesin statistik deterministik OlahData (v{results.get('engineVersion', '1.0')}). {note or ''}")
        n_run.font.size = Pt(8.5)
        n_run.font.italic = True

        # AI Explanation if present
        if explanation:
            exp_p = doc.add_paragraph()
            exp_p.paragraph_format.space_before = Pt(4)
            exp_p.paragraph_format.space_after = Pt(10)
            exp_p.paragraph_format.line_spacing = 1.15
            e_badge = exp_p.add_run("Interpretasi Hasil:\n")
            e_badge.font.bold = True
            e_badge.font.size = Pt(10)
            e_text = exp_p.add_run(explanation)
            e_text.font.size = Pt(10)

    explanations = results.get("explanations", {})
    sec_idx = 1

    # 1. Descriptive
    if "descriptive" in results and results["descriptive"]:
        desc_rows = [
            [
                d["variable"],
                fmt_id(d["n"], 0),
                fmt_id(d["mean"], 3),
                fmt_id(d["median"], 3),
                fmt_id(d["stdDev"], 3),
                fmt_id(d["min"], 3),
                fmt_id(d["max"], 3)
            ]
            for d in results["descriptive"]
        ]
        add_apa_section(
            str(sec_idx),
            "Statistik Deskriptif Variabel Penelitian",
            ["Variabel", "N", "Mean", "Median", "Standar Deviasi", "Min", "Max"],
            desc_rows,
            explanation=explanations.get("descriptive")
        )
        sec_idx += 1

    # 2. Validity
    if "validity" in results and results["validity"]:
        val_rows = [
            [
                v["construct"],
                v["item"],
                fmt_id(v["rHitung"], 4),
                fmt_id(v["rTabel"], 4),
                "Valid" if v["valid"] else "Tidak Valid"
            ]
            for v in results["validity"]
        ]
        add_apa_section(
            str(sec_idx),
            "Hasil Uji Validitas Butir Pernyataan (Pearson Product Moment)",
            ["Konstruk", "Item", "r Hitung", "r Tabel (α=0,05)", "Keterangan"],
            val_rows,
            explanation=explanations.get("validity")
        )
        sec_idx += 1

    # 3. Reliability
    if "reliability" in results and results["reliability"]:
        rel_rows = [
            [
                r["construct"],
                fmt_id(r["itemCount"], 0),
                fmt_id(r["cronbachAlpha"], 4),
                "0,600",
                "Reliabel" if r["reliable"] else "Tidak Reliabel"
            ]
            for r in results["reliability"]
        ]
        add_apa_section(
            str(sec_idx),
            "Hasil Uji Reliabilitas Konstruk (Cronbach's Alpha)",
            ["Konstruk", "Jumlah Item", "Cronbach's Alpha", "Nilai Kritis", "Keterangan"],
            rel_rows,
            explanation=explanations.get("reliability")
        )
        sec_idx += 1

    # 4. Normality
    if "normality" in results and results["normality"]:
        norm_rows = [
            [
                n["test"],
                fmt_id(n["statistic"], 4),
                fmt_id(n["pValue"], 4),
                "Normal (p ≥ 0,05)" if n["normal"] else "Tidak Normal (p < 0,05)"
            ]
            for n in results["normality"]
        ]
        add_apa_section(
            str(sec_idx),
            "Hasil Uji Normalitas Residual Regresi",
            ["Metode Uji", "Statistik Uji", "Asymp. Sig (p-value)", "Kesimpulan Asumsi"],
            norm_rows,
            explanation=explanations.get("normality")
        )
        sec_idx += 1

    # 5. Multicollinearity
    if "multicollinearity" in results and results["multicollinearity"]:
        multi_rows = [
            [
                m["variable"],
                fmt_id(m["tolerance"], 4),
                fmt_id(m["vif"], 4),
                "Bebas Multikolinearitas" if not m["problematic"] else "Ada Multikolinearitas"
            ]
            for m in results["multicollinearity"]
        ]
        add_apa_section(
            str(sec_idx),
            "Hasil Uji Multikolinearitas Antar Variabel Bebas",
            ["Variabel Bebas", "Tolerance (Amb. > 0,10)", "VIF (Amb. < 10,0)", "Kesimpulan"],
            multi_rows,
            explanation=explanations.get("multicollinearity")
        )
        sec_idx += 1

    # 6. Heteroscedasticity
    if "heteroscedasticity" in results and results["heteroscedasticity"]:
        het_rows = [
            [
                h["variable"],
                fmt_id(h["tHitung"], 4),
                fmt_id(h["pValue"], 4),
                "Homoskedastisitas Terpenuhi" if not h["significant"] else "Terjadi Heteroskedastisitas"
            ]
            for h in results["heteroscedasticity"]
        ]
        add_apa_section(
            str(sec_idx),
            "Hasil Uji Heteroskedastisitas (Uji Glejser)",
            ["Variabel Bebas", "t Hitung", "Sig. (p-value)", "Kesimpulan Asumsi"],
            het_rows,
            explanation=explanations.get("heteroscedasticity")
        )
        sec_idx += 1

    # 7. Regression
    if "regression" in results and results["regression"]:
        reg_rows = [
            [
                r["variable"],
                fmt_id(r["coefficient"], 4),
                fmt_id(r["stdError"], 4),
                fmt_id(r["tHitung"], 4),
                fmt_id(r["pValue"], 4),
                "Signifikan (p < 0,05)" if r["significant"] else "Tidak Signifikan"
            ]
            for r in results["regression"]
        ]
        add_apa_section(
            str(sec_idx),
            "Hasil Analisis Regresi Linier Berganda (Uji t Parsial)",
            ["Model", "Koefisien B", "Std. Error", "t Hitung", "Sig. (p-value)", "Keterangan"],
            reg_rows,
            explanation=explanations.get("regression")
        )
        sec_idx += 1

    # 8. F-Test & Determination
    if "fTest" in results and results["fTest"] and "determination" in results and results["determination"]:
        f_data = results["fTest"]
        det_data = results["determination"]
        summary_rows = [
            ["F Hitung (Simultan)", fmt_id(f_data.get("fHitung", 0), 4)],
            ["F Tabel (α=0,05)", fmt_id(f_data.get("fTabel", 0), 4)],
            ["Signifikansi F (p-value)", fmt_id(f_data.get("pValue", 0), 4)],
            ["Koefisien Determinasi (R Square)", fmt_id(det_data.get("rSquare", 0), 4)],
            ["Adjusted R Square", fmt_id(det_data.get("adjustedRSquare", 0), 4)],
            ["Std. Error of the Estimate", fmt_id(det_data.get("stdError", 0), 4)],
        ]
        add_apa_section(
            str(sec_idx),
            "Ringkasan Uji Simultan (Uji F) dan Koefisien Determinasi",
            ["Parameter Statistik", "Nilai"],
            summary_rows,
            explanation=explanations.get("fTest", "") + "\n\n" + explanations.get("determination", "")
        )
        sec_idx += 1

    # Jejak Hitung (Audit Trail)
    doc.add_page_break()
    h_audit = doc.add_heading("Lampiran: Jejak Hitung & Metadata Reproduksibilitas", level=1)
    h_audit.paragraph_format.space_after = Pt(8)

    audit_intro = doc.add_paragraph()
    audit_intro.add_run("Dokumen ini dihasilkan secara otomatis oleh sistem komputasi deterministik OlahData. Seluruh angka dihitung murni dengan formula matematika baku tanpa manipulasi.")

    audit_table = doc.add_table(rows=6, cols=2)
    apply_apa_table_styling(audit_table)
    audit_data = [
        ("ID Analisis", str(results.get("id", "-"))),
        ("ID Proyek & Versi Data", f"{results.get('projectId', '-')} / {results.get('dataVersionId', '-') }"),
        ("Waktu Komputasi", str(results.get("timestamp", "-"))),
        ("Versi Mesin Statistik", f"OlahData Engine v{results.get('engineVersion', '1.0.0')}"),
        ("Jumlah Sampel Teranalisis (N)", f"{results.get('respondentCount', '-')} responden"),
        ("Taraf Signifikansi (α)", f"{fmt_id(results.get('significanceLevel', 0.05), 2)}"),
    ]
    for idx, (label, val) in enumerate(audit_data):
        audit_table.rows[idx].cells[0].text = label
        audit_table.rows[idx].cells[0].paragraphs[0].runs[0].bold = True
        audit_table.rows[idx].cells[1].text = val

    # Pernyataan Penggunaan Alat
    if include_declaration:
        doc.add_page_break()
        h_decl = doc.add_heading("SURAT PERNYATAAN PENGGUNAAN ALAT BANTU OLAH DATA AKADEMIK", level=1)
        h_decl.alignment = WD_ALIGN_PARAGRAPH.CENTER
        h_decl.paragraph_format.space_after = Pt(12)

        decl_text = (
            "Saya yang bertanda tangan di bawah ini menyatakan dengan sesungguhnya bahwa dalam penyusunan "
            "skripsi/tugas akhir ini, saya menggunakan aplikasi OlahData (https://olahdata.id) secara mandiri "
            "sebagai alat bantu komputasi statistik (kalkulator statistik) deterministik dan penyusun draf tabel format Bab 4.\n\n"
            "Saya menegaskan bahwa:\n"
            "1. Data responden yang diolah merupakan data primer asli hasil kuesioner yang telah saya kumpulkan sendiri, tanpa fabrikasi atau falsifikasi data.\n"
            "2. Aplikasi OlahData tidak melakukan penambahan, pengisian otomatis, atau manipulasi terhadap data mentah responden.\n"
            "3. Penjelasan atau interpretasi otomatis yang disajikan telah saya pelajari, telaah, dan verifikasi secara kritis sesuai dengan konteks teori penelitian saya sebelum dicantumkan dalam naskah skripsi.\n"
            "4. Tanggung jawab akademis atas kebenaran seluruh isi skripsi sepenuhnya berada pada diri saya sebagai peneliti.\n\n"
            "Demikian pernyataan ini saya buat dengan penuh kejujuran dan integritas akademik untuk dapat dipergunakan sebagaimana mestinya."
        )
        dp = doc.add_paragraph()
        dp.paragraph_format.line_spacing = 1.3
        dp.add_run(decl_text)

        sign_p = doc.add_paragraph()
        sign_p.paragraph_format.space_before = Pt(36)
        sign_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        sign_p.add_run("Yang Menyatakan,\n\n\n\n_________________________\n(Nama & NIM Peneliti)")

    target_io = io.BytesIO()
    doc.save(target_io)
    return target_io.getvalue()
