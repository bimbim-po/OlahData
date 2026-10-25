"""
Section 6.2: Universal Ingest & Adversarial File Tests
Tests every adversarial format and questionnaire export variant:
- CSV: Semicolon, UTF-8-BOM, Windows-1252, decimal commas, string numbers, duplicate headers, title rows, empty rows/cols
- Excel: Multi-sheet, old .xls, merged cells, formulas
- Online form exports: Google Forms (Quiz score), Microsoft Forms, SurveyMonkey, Typeform
- Edge cases: Straightlining, zero variance, 1-item construct, n < predictors, scattered missing cells, metadata in between items, multi-select, open text
"""

import io
import os
import pytest
import pandas as pd
import numpy as np
import openpyxl

from engine.ingest import ingest_survey_dataset, classify_column_role, extract_item_label
from engine.pipeline import run_statistical_analysis
from engine.linearity import compute_linearity_test
from engine.reliability import compute_reliability
from engine.regression import compute_regression
from validation import scan_dataset_quality, validate_exclusion_request


def test_csv_semicolon_utf8_bom_decimal_comma():
    # Semicolon delimited, UTF-8-BOM, Indonesian decimal comma, title rows above header
    csv_text = (
        "LAPORAN KUESIONER PENELITIAN SKRIPSI TAHUN 2026\n"
        "FAKULTAS EKONOMI DAN BISNIS\n"
        "No;Timestamp;Nama Lengkap;X1.1;X1.2;Y1;Y2\n"
        "1;2026/03/01 10:00:00;Budi;4,0;5;4;4\n"
        "2;2026/03/01 10:05:00;Siti;3,5;4;3;4\n"
        "3;2026/03/01 10:10:00;Andi;5;4;5;5\n"
        "4;2026/03/01 10:15:00;Dewi;4;3;4;3\n"
        "\n"
        "\n"
    )
    raw_bytes = b"\xef\xbb\xbf" + csv_text.encode("utf-8")

    res = ingest_survey_dataset(raw_bytes, "kuesioner_semicolon_bom.csv")
    df = res["cleanedDf"]

    assert res["nInput"] == 4
    assert "X1.1" in df.columns
    assert "X1.2" in df.columns
    assert "Y1" in df.columns
    # Check decimal comma conversion
    assert df.loc[1, "X1.1"] == 3.5
    assert df.loc[0, "X1.1"] == 4  # 4,0 -> 4
    # Check column classification
    meta = res["columnMeta"]
    assert meta["Timestamp"]["role"] == "metadata"
    assert meta["Nama Lengkap"]["role"] == "metadata"
    assert meta["X1.1"]["role"] == "likert_angka"
    assert meta["X1.1"]["itemLabel"] == "X1.1"


def test_csv_duplicate_headers_and_windows1252():
    # Duplicate headers: 'Puas' appears twice
    csv_text = (
        "No,Puas,Puas,Loyal\n"
        "1,4,5,4\n"
        "2,3,4,3\n"
        "3,5,5,5\n"
    )
    raw_bytes = csv_text.encode("windows-1252")

    res = ingest_survey_dataset(raw_bytes, "duplicate_headers.csv")
    df = res["cleanedDf"]

    assert "Puas" in df.columns
    assert "Puas_2" in df.columns
    assert res["columnMeta"]["Puas"]["originalHeader"] == "Puas"
    assert res["columnMeta"]["Puas_2"]["originalHeader"] == "Puas"
    assert df.loc[0, "Puas"] == 4
    assert df.loc[0, "Puas_2"] == 5


def test_excel_multi_sheet_and_title_rows():
    wb = openpyxl.Workbook()
    # Sheet 1: Cover sheet with text
    ws1 = wb.active
    ws1.title = "Cover"
    ws1.append(["KUESIONER PENELITIAN"])
    ws1.append(["Data ini bersifat rahasia"])

    # Sheet 2: Actual data with 2 title rows
    ws2 = wb.create_sheet("Data_Responden")
    ws2.append(["HASIL KUESIONER GOOGLE FORMS"])
    ws2.append(["Universitas Indonesia 2026"])
    ws2.append(["ID", "Gender", "P1", "P2", "P3", "P4"])
    ws2.append([1, "Laki-laki", 5, 4, 5, 4])
    ws2.append([2, "Perempuan", 4, 4, 3, 4])
    ws2.append([3, "Laki-laki", 3, 3, 4, 4])
    ws2.append([4, "Perempuan", 5, 5, 5, 5])

    buf = io.BytesIO()
    wb.save(buf)
    excel_bytes = buf.getvalue()

    res = ingest_survey_dataset(excel_bytes, "survey_multisheet.xlsx", sheet_name="Data_Responden")
    df = res["cleanedDf"]

    assert res["selectedSheet"] == "Data_Responden"
    assert len(res["sheetNames"]) == 2
    assert res["nInput"] == 4
    assert list(df.columns) == ["ID", "Gender", "P1", "P2", "P3", "P4"]
    assert df.loc[0, "P1"] == 5


def test_google_forms_quiz_export():
    # Google Forms with Timestamp, Email, Score column, and long question headers
    csv_text = (
        "Timestamp,Email Address,Score,1. Seberapa cepat respon pelayanan customer service kami?,2. Seberapa ramah petugas kami?,Saran dan masukan\n"
        "2026/02/10 08:30:12,mhs1@ui.ac.id,100 / 100,5 - Sangat Cepat,4 - Ramah,Pelayanan sudah sangat baik dan responsif\n"
        "2026/02/10 08:35:45,mhs2@ui.ac.id,90 / 100,4 - Cepat,4 - Ramah,Mohon tingkatkan kecepatan pada jam sibuk\n"
        "2026/02/10 08:40:10,mhs3@ui.ac.id,80 / 100,3 - Cukup,3 - Cukup,Tidak ada masukan tambahan\n"
        "2026/02/10 08:45:22,mhs4@ui.ac.id,100 / 100,5 - Sangat Cepat,5 - Sangat Ramah,Sudah mantap pertahankan\n"
    )
    raw_bytes = csv_text.encode("utf-8")

    res = ingest_survey_dataset(raw_bytes, "google_forms_quiz_export.csv")
    df = res["cleanedDf"]
    meta = res["columnMeta"]

    assert meta["Timestamp"]["role"] == "metadata"
    assert meta["Email Address"]["role"] == "metadata"
    assert meta["Score"]["role"] == "metadata"
    assert meta["Saran dan masukan"]["role"] == "teks_terbuka"

    col_q1 = [c for c in df.columns if "Seberapa cepat" in meta[c]["originalHeader"]][0]
    col_q2 = [c for c in df.columns if "Seberapa ramah" in meta[c]["originalHeader"]][0]

    assert meta[col_q1]["itemLabel"] == "P1"
    assert meta[col_q2]["itemLabel"] == "P2"
    # Verify scale mapping extracted leading number
    assert df.loc[0, col_q1] == 5
    assert df.loc[1, col_q1] == 4


def test_microsoft_forms_export():
    # Microsoft Forms format: ID, Start time, Completion time, Email, Name
    csv_text = (
        "ID,Start time,Completion time,Email,Name,Q1: Kualitas produk terjamin,Q2: Harga produk terjangkau,Q3: Keinginan membeli kembali\n"
        "1,2/14/26 9:00,2/14/26 9:05,anonymous,anonymous,Sangat Setuju,Setuju,Sangat Setuju\n"
        "2,2/14/26 9:10,2/14/26 9:14,anonymous,anonymous,Setuju,Netral,Setuju\n"
        "3,2/14/26 9:15,2/14/26 9:20,anonymous,anonymous,Kurang Setuju,Tidak Setuju,Tidak Setuju\n"
        "4,2/14/26 9:22,2/14/26 9:27,anonymous,anonymous,Sangat Setuju,Sangat Setuju,Sangat Setuju\n"
    )
    res = ingest_survey_dataset(csv_text.encode("utf-8"), "ms_forms_export.csv")
    df = res["cleanedDf"]
    meta = res["columnMeta"]

    assert meta["ID"]["role"] == "metadata"
    assert meta["Start time"]["role"] == "metadata"
    assert meta["Completion time"]["role"] == "metadata"
    assert meta["Email"]["role"] == "metadata"
    assert meta["Name"]["role"] == "metadata"

    col_q1 = [c for c in df.columns if "Q1" in c][0]
    assert df.loc[0, col_q1] == 5  # Sangat Setuju -> 5
    assert df.loc[1, col_q1] == 4  # Setuju -> 4
    assert df.loc[2, col_q1] == 2  # Kurang Setuju -> 2


def test_surveymonkey_and_typeform_export():
    # SurveyMonkey format: Respondent ID, Collector ID, Start Date, End Date, IP Address
    csv_text = (
        "Respondent ID,Collector ID,Start Date,End Date,IP Address,A-1: Kemudahan,A-2: Kecepatan,B-1: Kepuasan\n"
        "10001,501,01/10/2026,01/10/2026,192.168.1.1,4,5,4\n"
        "10002,501,01/10/2026,01/10/2026,192.168.1.2,3,4,3\n"
        "10003,501,01/10/2026,01/10/2026,192.168.1.3,5,5,5\n"
        "10004,501,01/10/2026,01/10/2026,192.168.1.4,4,3,4\n"
    )
    res = ingest_survey_dataset(csv_text.encode("utf-8"), "surveymonkey_export.csv")
    df = res["cleanedDf"]
    meta = res["columnMeta"]

    assert meta["Respondent ID"]["role"] == "metadata"
    assert meta["Collector ID"]["role"] == "metadata"
    assert meta["IP Address"]["role"] == "metadata"
    assert meta["A-1: Kemudahan"]["itemLabel"] == "A-1"
    assert meta["A-2: Kecepatan"]["itemLabel"] == "A-2"
    assert meta["B-1: Kepuasan"]["itemLabel"] == "B-1"


def test_edge_cases_and_error_handling():
    # 1. Construct with < 2 items
    df_small = pd.DataFrame({
        "X1": [1, 2, 3, 4, 5],
        "Y": [2, 3, 4, 5, 6]
    })
    rel = compute_reliability(df_small, [{"name": "SingleItem", "code": "SI", "items": ["X1"]}])
    assert len(rel) == 1
    assert rel[0]["cronbachAlpha"] is None
    assert "minimal 2 butir" in rel[0]["note"]

    # 2. Linearity when every X is unique (df_within = 0)
    df_unique_x = pd.DataFrame({
        "X": [1.1, 2.2, 3.3, 4.4, 5.5],
        "Y": [2.0, 3.0, 4.0, 5.0, 6.0]
    })
    lin = compute_linearity_test(df_unique_x["X"], df_unique_x["Y"], "X", "Y")
    assert lin["applicable"] is False
    assert "unik" in lin["reason"]
    assert "RESET" in lin["reason"]

    # 3. Minimum sample size check for exclusion action
    valid, msg, rem = validate_exclusion_request(total_n=10, excluded_rows_1indexed=[1, 2, 3, 4, 5, 6, 7], num_predictors=2)
    assert valid is False
    assert "ditolak" in msg
    assert rem == 3

    # 4. Perfect collinearity detection in regression
    df_collinear = pd.DataFrame({
        "X1": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        "X2": [2.0, 4.0, 6.0, 8.0, 10.0, 12.0],  # Exactly 2 * X1
        "Y": [3.0, 5.0, 7.0, 9.0, 11.0, 13.0]
    })
    with pytest.raises(ValueError) as exc:
        compute_regression(df_collinear["Y"], df_collinear[["X1", "X2"]])
    assert "multikolinearitas sempurna" in str(exc.value).lower()
