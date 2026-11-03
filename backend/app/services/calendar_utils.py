from typing import Any, Dict, List, Optional, Tuple


def compute_narrative_sort_and_display(
    calendar_config: Dict[str, Any],
    date_is_unknown: bool,
    calendar_type: Optional[str],
    narrative_date: Optional[str],
    narrative_year: Optional[int],
    narrative_month: Optional[int],
    narrative_day: Optional[int],
    narrative_time: Optional[str],
    sort_order: float = 0.0,
) -> Tuple[str, Optional[str], Optional[int], Optional[int], Optional[int], Optional[str], Optional[int]]:
    """
    Calcula os componentes granulares flexíveis e a chave de ordenação retrocompatível.
    Suporta eventos que possuem apenas o ano, ano+mês, ou ano+mês+dia.
    """
    camp_cal_type = (calendar_config or {}).get("type", "gregorian")
    effective_cal_type = calendar_type or camp_cal_type

    if date_is_unknown:
        return (effective_cal_type, None, None, None, None, None, None)

    year = narrative_year
    month = narrative_month
    day = narrative_day

    # Se o usuário enviou narrative_date no formato YYYY-MM-DD (ou -YYYY-MM-DD) e não enviou year/month/day
    if narrative_date and (year is None or month is None or day is None):
        raw = narrative_date.strip()
        try:
            neg = False
            if raw.startswith("-"):
                neg = True
                raw = raw[1:]
            parts = raw.split("-")
            if len(parts) == 3 and all(p.isdigit() for p in parts):
                parsed_y = int(parts[0]) * (-1 if neg else 1)
                parsed_m = int(parts[1])
                parsed_d = int(parts[2])
                year = year if year is not None else parsed_y
                month = month if month is not None else parsed_m
                day = day if day is not None else parsed_d
            elif len(parts) == 2 and all(p.isdigit() for p in parts):
                parsed_y = int(parts[0]) * (-1 if neg else 1)
                parsed_m = int(parts[1])
                year = year if year is not None else parsed_y
                month = month if month is not None else parsed_m
            elif len(parts) == 1 and parts[0].isdigit():
                parsed_y = int(parts[0]) * (-1 if neg else 1)
                year = year if year is not None else parsed_y
        except Exception:
            pass

    months_cfg = (calendar_config or {}).get("months") or []
    era_name = (calendar_config or {}).get("era_name") or ("d.C." if effective_cal_type == "gregorian" else "Era Atual")

    month_name = ""
    total_days_in_year = max(sum(int(m.get("days", 30)) for m in months_cfg), 1) if months_cfg else 372

    if month is not None:
        if months_cfg and 1 <= month <= len(months_cfg):
            days_before_month = sum(int(m.get("days", 30)) for m in months_cfg[: month - 1])
            month_name = months_cfg[month - 1].get("name", f"Mês {month}")
        else:
            days_before_month = (month - 1) * 31
            month_name = f"Mês {month:02d}"
    else:
        days_before_month = 0

    clean_time = narrative_time.strip() if narrative_time else None
    time_minutes = 0
    if clean_time and ":" in clean_time:
        try:
            t_parts = clean_time.split(":")
            h = max(0, min(99, int(t_parts[0])))
            m = max(0, min(59, int(t_parts[1])))
            time_minutes = h * 60 + m
        except Exception:
            time_minutes = 0

    # Chave inteira de 64 bits para fallback
    effective_year = year if year is not None else 0
    effective_day = day if day is not None else 0
    day_of_year = days_before_month + effective_day
    sort_key = (
        (effective_year * (total_days_in_year + 10) * 1440 * 100)
        + (day_of_year * 1440 * 100)
        + (time_minutes * 100)
        + int(sort_order * 10)
    )

    # Formata string de exibição se não fornecida
    if narrative_date and not narrative_date.strip().startswith(f"{effective_year:04d}-"):
        display_date = narrative_date.strip()
    else:
        era_suffix = f" {era_name}".rstrip() if era_name else ""
        if year is not None and month is not None and day is not None:
            if effective_cal_type == "fictional":
                display_date = f"{day} de {month_name}, Ano {year}{era_suffix}"
            else:
                if year < 0:
                    display_date = f"{day:02d}/{month:02d}/{abs(year):04d} a.C."
                else:
                    display_date = f"{day:02d}/{month:02d}/{year:04d}"
        elif year is not None and month is not None:
            display_date = f"{month_name} do Ano {year}{era_suffix}"
        elif year is not None:
            if year < 0:
                display_date = f"Ano {abs(year)} a.C."
            else:
                display_date = f"Ano {year}{era_suffix}"
        else:
            display_date = "Data não definida"

    return (
        effective_cal_type,
        display_date,
        year,
        month,
        day,
        clean_time,
        sort_key,
    )


def format_month_name(calendar_config: Dict[str, Any], month: int) -> str:
    months_cfg = (calendar_config or {}).get("months") or []
    if months_cfg and 1 <= month <= len(months_cfg):
        return months_cfg[month - 1].get("name", f"Mês {month}")
    gregorian_months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]
    if 1 <= month <= 12:
        return gregorian_months[month - 1]
    return f"Mês {month}"
