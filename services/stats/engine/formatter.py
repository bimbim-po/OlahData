from typing import Union, Optional

def format_number(
    val: Optional[Union[float, int]],
    decimals: int = 3,
    style: str = "id",  # "id" (Indonesian comma) or "apa" (APA American dot)
    is_p_value: bool = False,
    is_correlation: bool = False
) -> str:
    """
    Unified statistical number formatter for screen, Word, and PDF exports.
    Supports:
    - Indonesian standard: comma as decimal separator, e.g. "0,854", "< 0,001"
    - APA style: period as decimal separator, omitting leading zero for bounded values (p, r), e.g. ".854", "< .001"
    """
    if val is None:
        return "-"
    
    val_float = float(val)

    # p-value threshold formatting
    if is_p_value:
        if val_float < 0.001:
            return "< 0,001" if style == "id" else "< .001"
        if style == "apa":
            # APA omits leading zero for p-values (bounded between 0 and 1)
            formatted = f"{val_float:.{decimals}f}"
            if formatted.startswith("0."):
                return formatted[1:]
            return formatted

    # Correlation / bounded [-1, 1] formatting
    if is_correlation and style == "apa":
        sign = "-" if val_float < 0 else ""
        abs_str = f"{abs(val_float):.{decimals}f}"
        if abs_str.startswith("0."):
            abs_str = abs_str[1:]
        return f"{sign}{abs_str}"

    formatted = f"{val_float:.{decimals}f}"
    if style == "id":
        return formatted.replace(".", ",")
    return formatted

def format_p_value(p: float, style: str = "id") -> str:
    """Convenience helper for formatting p-values."""
    return format_number(p, decimals=3, style=style, is_p_value=True)

def format_r_value(r: float, style: str = "id") -> str:
    """Convenience helper for formatting r-values."""
    return format_number(r, decimals=3, style=style, is_correlation=True)
