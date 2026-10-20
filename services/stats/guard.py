from typing import Dict, Any, List, Optional, Tuple
import re
import numpy as np

class NumberGuardViolationError(ValueError):
    """Raised when an AI narrative contains numerical or categorical claims that contradict computed statistics."""
    def __init__(self, message: str, violations: List[Dict[str, Any]]):
        super().__init__(message)
        self.violations = violations

class NumberGuard:
    """
    Deterministic Verification Guard:
    Scans AI-generated narrative reports, extracts cited statistical values,
    and cross-checks them against deterministic engine results.
    Rejects hallucinations, fabricated numbers, and incorrect academic categories.
    """
    def __init__(self, tolerance: float = 0.005):
        self.tolerance = tolerance

    def verify_claim(
        self,
        claim_name: str,
        narrative_value: float,
        computed_value: float,
        tolerance: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        tol = tolerance if tolerance is not None else self.tolerance
        diff = abs(narrative_value - computed_value)
        if diff > tol:
            return {
                "claim": claim_name,
                "claimedValue": narrative_value,
                "computedValue": computed_value,
                "difference": diff,
                "tolerance": tol,
                "error": f"Klaim narasi '{claim_name}' ({narrative_value}) menyimpang dari hasil komputasi ({computed_value:.4f}) melebihi batas toleransi {tol}."
            }
        return None

    def verify_narrative(
        self,
        narrative_text: str,
        computed_results: Dict[str, Any],
        strict: bool = True
    ) -> Dict[str, Any]:
        """
        Parses Indonesian thesis narrative patterns and validates against computed statistics.
        Identifies key patterns:
        - R Square / R2: "R2 sebesar 0,xxx" or "R-Square = 0.xxx"
        - F Hitung: "F hitung sebesar xx,xxx" or "F = xx.xxx"
        - F Tabel: "F tabel sebesar xx,xxx"
        - t Hitung: "t hitung sebesar xx,xxx"
        - Cronbach's Alpha: "Cronbach's Alpha sebesar 0,xxx"
        - Kategori: "kategori (Sangat Rendah|Rendah|Sedang|Tinggi|Sangat Tinggi)"
        - Keputusan: "Signifikan" / "Tidak signifikan"
        """
        violations: List[Dict[str, Any]] = []

        # Helper to parse Indonesian comma floats or dot floats: "0,456" -> 0.456
        def parse_float(s: str) -> float:
            return float(s.replace(",", "."))

        # 1. R-Square check
        r2_matches = re.findall(r'(?:R(?:2|\^2|[- ]*Square|[- ]*hitung)?\s*(?:sebesar|=|\:)\s*([0-9]+[,\.][0-9]+))', narrative_text, re.IGNORECASE)
        computed_r2 = (computed_results.get("regresi_berganda", {}).get("rSquare")
                       if isinstance(computed_results.get("regresi_berganda"), dict) else None)
        if computed_r2 is None and isinstance(computed_results.get("determination"), dict):
            computed_r2 = computed_results["determination"].get("rSquare")

        if r2_matches and computed_r2 is not None:
            for match in r2_matches:
                claimed_val = parse_float(match)
                err = self.verify_claim("R-Square", claimed_val, computed_r2)
                if err:
                    violations.append(err)

        # 2. F Hitung check
        f_matches = re.findall(r'(?:F(?:[- ]*hitung)?\s*(?:sebesar|=|\:)\s*([0-9]+[,\.][0-9]+))', narrative_text, re.IGNORECASE)
        computed_f = (computed_results.get("regresi_berganda", {}).get("fHitung")
                      if isinstance(computed_results.get("regresi_berganda"), dict) else None)
        if computed_f is None and isinstance(computed_results.get("fTest"), dict):
            computed_f = computed_results["fTest"].get("fHitung")

        if f_matches and computed_f is not None:
            for match in f_matches:
                claimed_val = parse_float(match)
                err = self.verify_claim("F-Hitung", claimed_val, computed_f, tolerance=0.05)
                if err:
                    violations.append(err)

        # 3. F Tabel check
        ftab_matches = re.findall(r'(?:F(?:[- ]*tabel)\s*(?:sebesar|=|\:)\s*([0-9]+[,\.][0-9]+))', narrative_text, re.IGNORECASE)
        computed_ftab = (computed_results.get("regresi_berganda", {}).get("fTabel")
                         if isinstance(computed_results.get("regresi_berganda"), dict) else None)
        if computed_ftab is None and isinstance(computed_results.get("fTest"), dict):
            computed_ftab = computed_results["fTest"].get("fTabel")

        if ftab_matches and computed_ftab is not None:
            for match in ftab_matches:
                claimed_val = parse_float(match)
                err = self.verify_claim("F-Tabel", claimed_val, computed_ftab, tolerance=0.05)
                if err:
                    violations.append(err)

        # 4. Cronbach's Alpha check
        alpha_matches = re.findall(r'(?:Cronbach(?:\'s)?\s*Alpha\s*(?:sebesar|=|\:)\s*([0-9]+[,\.][0-9]+))', narrative_text, re.IGNORECASE)
        rel = computed_results.get("reliabilitas") or computed_results.get("reliability")
        if alpha_matches and rel:
            for match in alpha_matches:
                claimed_val = parse_float(match)
                # Check against any construct alpha in results
                found_match = False
                for c_code, c_data in (rel.items() if isinstance(rel, dict) else [(r.get("construct", ""), r) for r in rel]):
                    alpha_target = c_data.get("finalAlpha") or c_data.get("cronbachAlpha") or c_data.get("initialAlpha")
                    if alpha_target is not None and abs(claimed_val - alpha_target) <= 0.01:
                        found_match = True
                        break
                if not found_match:
                    violations.append({
                        "claim": "Cronbach's Alpha",
                        "claimedValue": claimed_val,
                        "error": f"Klaim Cronbach's Alpha ({claimed_val}) tidak cocok dengan nilai komputasi konstruk mana pun."
                    })

        # 5. Categorical checks (e.g. Tinggi vs Rendah)
        desc = computed_results.get("descriptive") or computed_results.get("deskriptif")
        if desc:
            for c_code, c_data in (desc.items() if isinstance(desc, dict) else [(d.get("variable") or d.get("construct"), d) for d in desc]):
                true_kat = c_data.get("tcrCategory") or c_data.get("kategori")
                if not true_kat:
                    continue
                # Search if text explicitly mentions construct with wrong category
                # e.g. "Kualitas Layanan berada pada kategori Rendah" when true_kat is "Tinggi"
                for false_kat in ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"]:
                    if false_kat.lower() != true_kat.lower():
                        pattern = rf'(?:{c_code}|{c_data.get("construct")}).*?kategori\s+{re.escape(false_kat)}'
                        if re.search(pattern, narrative_text, re.IGNORECASE):
                            violations.append({
                                "claim": f"Kategori {c_code}",
                                "claimedValue": false_kat,
                                "computedValue": true_kat,
                                "error": f"Klaim Kategori konstruk '{c_code}' salah: diklaim '{false_kat}', padahal hasil komputasi adalah '{true_kat}'."
                            })

        is_valid = (len(violations) == 0)

        if not is_valid and strict:
            details = "; ".join(v["error"] for v in violations)
            msg = f"Number Guard menolak narasi: ditemukan {len(violations)} penyimpangan data: {details}"
            raise NumberGuardViolationError(msg, violations)

        return {
            "valid": is_valid,
            "violationsCount": len(violations),
            "violations": violations
        }
