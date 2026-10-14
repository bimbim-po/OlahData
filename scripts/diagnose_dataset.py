#!/usr/bin/env python3
import sys
import os
import argparse
import json
import re
import pandas as pd
import numpy as np

# Ensure services/stats is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
STATS_DIR = os.path.join(ROOT_DIR, "services", "stats")
if STATS_DIR not in sys.path:
    sys.path.insert(0, STATS_DIR)

from engine.pipeline import run_statistical_analysis

LIKERT_TEXT_MAP = {
    "sangat setuju": 5,
    "setuju": 4,
    "netral": 3,
    "ragu-ragu": 3,
    "kurang setuju": 2,
    "tidak setuju": 2,
    "sangat tidak setuju": 1,
    "ss": 5,
    "s": 4,
    "n": 3,
    "rr": 3,
    "ts": 2,
    "sts": 1,
    "strongly agree": 5,
    "agree": 4,
    "neutral": 3,
    "disagree": 2,
    "strongly disagree": 1,
}

DEMOGRAPHIC_PATTERNS = [
    r"^no$", r"^id$", r"^nomor$", r"^responden", r"^nama", r"^timestamp$", r"^cap\s*waktu$",
    r"^usia", r"^umur", r"^gender", r"^jenis\s*kelamin", r"^jk$", r"^pendidikan",
    r"^pekerjaan", r"^profesi", r"^penghasilan", r"^gaji", r"^status", r"^ipk",
    r"^semester", r"^fakultas", r"^jurusan", r"^prodi"
]

def detect_column_role(col_name: str, series: pd.Series) -> str:
    clean_name = str(col_name).strip().lower()
    for pat in DEMOGRAPHIC_PATTERNS:
        if re.search(pat, clean_name):
            if clean_name in ["no", "id", "nomor", "responden", "timestamp"]:
                return "id"
            return "demographic"

    # Check if looks like a Likert item (e.g. KL1, KP2, X1.1, Y1, etc. or values 1-5)
    numeric_vals = pd.to_numeric(series, errors="coerce").dropna()
    if len(numeric_vals) > 0:
        if numeric_vals.min() >= 1 and numeric_vals.max() <= 5:
            return "item"

    return "item"

def parse_dataset(file_path: str):
    ext = os.path.splitext(file_path)[1].lower()

    if ext in [".xlsx", ".xls"]:
        xl = pd.ExcelFile(file_path)
        sheet_name = xl.sheet_names[0]
        # read skipping completely empty rows
        df = pd.read_excel(xl, sheet_name=sheet_name)
    elif ext == ".csv":
        # Check encoding
        encodings = ["utf-8-sig", "utf-8", "windows-1252", "latin1"]
        df = None
        for enc in encodings:
            try:
                # detect delimiter with python engine
                with open(file_path, "r", encoding=enc) as f:
                    first_line = f.readline()
                    delimiter = ","
                    if ";" in first_line and first_line.count(";") > first_line.count(","):
                        delimiter = ";"
                    elif "\t" in first_line:
                        delimiter = "\t"

                df = pd.read_csv(file_path, sep=delimiter, encoding=enc)
                break
            except Exception:
                continue
        if df is None:
            raise ValueError(f"Gagal membaca CSV {file_path} dengan berbagai encoding.")
    else:
        raise ValueError(f"Ekstensi file tidak didukung: {ext}")

    # Clean whitespace in column names
    df.columns = [str(c).strip() for c in df.columns]

    # Convert Indonesian decimal comma (e.g. "3,5" -> 3.5) and text Likert
    converted_df = df.copy()
    for col in df.columns:
        s = df[col]
        if s.dtype == object:
            # Check for Likert text labels
            mapped = s.astype(str).str.strip().str.lower().map(LIKERT_TEXT_MAP)
            if mapped.notna().sum() > len(s) * 0.5:
                converted_df[col] = mapped
            else:
                # Check for decimal comma
                comma_converted = s.astype(str).str.replace(",", ".", regex=False)
                num = pd.to_numeric(comma_converted, errors="coerce")
                if num.notna().sum() > len(s) * 0.5:
                    converted_df[col] = num

    return df, converted_df

def diagnose_file(file_path: str):
    print("=" * 70)
    print(f"DIAGNOSA BERKAS DATASET: {os.path.basename(file_path)}")
    print("=" * 70)

    if not os.path.exists(file_path):
        print(f"[ERROR] Berkas tidak ditemukan: {file_path}")
        return

    raw_df, clean_df = parse_dataset(file_path)
    n_rows, n_cols = clean_df.shape

    print(f"1. Ukuran Data:")
    print(f"   - Jumlah Baris: {n_rows}")
    print(f"   - Jumlah Kolom: {n_cols}")

    print("\n2. Daftar Kolom & Tipe Data:")
    roles = {}
    null_counts = {}
    for col in clean_df.columns:
        role = detect_column_role(col, clean_df[col])
        roles[col] = role
        null_count = clean_df[col].isna().sum()
        null_counts[col] = null_count
        dtype_str = str(clean_df[col].dtype)
        print(f"   - {col:15} | Tipe: {dtype_str:10} | Peran: {role:12} | Kosong: {null_count}")

    print("\n3. Lima Baris Pertama:")
    print(clean_df.head(5).to_string(index=False))

    # Automatic construct grouping for items
    item_cols = [c for c, r in roles.items() if r == "item"]
    print(f"\n4. Butir Skala Terdeteksi ({len(item_cols)} butir): {item_cols}")

    # Heuristic grouping by prefix (e.g. KL1, KL2 -> KL; KP1 -> KP; LO1 -> LO)
    groups = {}
    for c in item_cols:
        prefix = re.sub(r"[0-9_.]+$", "", c) or c
        groups.setdefault(prefix, []).append(c)

    constructs = []
    keys = list(groups.keys())
    for idx, k in enumerate(keys):
        role = "dependent" if idx == len(keys) - 1 else "independent"
        constructs.append({
            "name": k,
            "items": groups[k],
            "role": role
        })

    print("\n5. Rekomendasi Pemetaan Konstruk:")
    for c in constructs:
        print(f"   - Konstruk '{c['name']}' ({c['role']}): {c['items']}")

    # Run analysis
    if len(constructs) >= 2 and any(c["role"] == "dependent" for c in constructs):
        print("\n6. Hasil Komputasi Statistik Deterministik:")
        analysis = run_statistical_analysis(
            df=clean_df,
            constructs=constructs,
            selected_tests=[
                "descriptive", "validity", "reliability",
                "regression", "normality", "multicollinearity",
                "heteroscedasticity", "correlation"
            ]
        )

        print("\n   [Statistik Deskriptif]")
        for d in analysis.get("descriptive", []):
            print(f"     * {d['variable']:10}: N={d['n']}, Mean={d['mean']}, SD={d['stdDev']}, Min={d['min']}, Max={d['max']}")

        print("\n   [Uji Reliabilitas (Cronbach's Alpha)]")
        for r in analysis.get("reliability", []):
            print(f"     * {r['construct']:10}: Alpha={r['cronbachAlpha']} (Threshold >= 0.60)")

        if "fTest" in analysis:
            f = analysis["fTest"]
            print(f"\n   [Uji F Simultan ANOVA]")
            print(f"     * F Hitung={f['fHitung']}, F Tabel={f['fTabel']}, Sig.={f['pValue']} (Signifikan: {f['significant']})")

        if "determination" in analysis:
            det = analysis["determination"]
            print(f"\n   [Koefisien Determinasi]")
            print(f"     * R Square (R2)={det['rSquare']}, Adjusted R2={det['adjustedRSquare']}")

        if "regression" in analysis:
            print(f"\n   [Uji t Parsial Regresi]")
            for reg in analysis["regression"]:
                print(f"     * {reg['variable']:15}: B={reg['coefficient']}, t={reg['tHitung']}, Sig={reg['pValue']}")

        if "multicollinearity" in analysis:
            print(f"\n   [Multikolinearitas (VIF)]")
            for item in analysis["multicollinearity"]:
                print(f"     * {item['variable']:10}: Tolerance={item['tolerance']}, VIF={item['vif']}")

        if "heteroscedasticity" in analysis:
            print(f"\n   [Uji Heteroskedastisitas (Glejser)]")
            for item in analysis["heteroscedasticity"]:
                print(f"     * {item['variable']:10}: t={item['tHitung']}, Sig={item['pValue']} (Gejala: {item['significant']})")

    print("\n" + "=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Diagnosa Berkas Dataset dan Komputasi Statistik")
    parser.add_argument("file", nargs="?", default="fixtures/dataset_30.csv", help="Jalur file dataset")
    args = parser.parse_args()
    diagnose_file(args.file)
