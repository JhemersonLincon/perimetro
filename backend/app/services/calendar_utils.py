from typing import Any, Dict, Optional, Tuple


def compute_narrative_sort_and_display(
    calendar_config: Dict[str, Any],
    date_is_unknown: bool,
    calendar_type: Optional[str],
    narrative_date: Optional[str],
    narrative_year: Optional[int],
    narrative_month: Optional[int],
    narrative_day: Optional[int],
    narrative_time: Optional[str],
) -> Tuple[str, Optional[str], Optional[int], Optional[int], Optional[int], Optional[str], Optional[int]]:
    """
    Calcula os componentes padronizados e a chave de ordenação (sort_key)
    para datas narrativas (gregorianas ou fictícias), respeitando o calendário da campanha.
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
        except Exception:
            pass

    if year is None:
        year = 1
    if month is None:
        month = 1
    if day is None:
        day = 1

    months_cfg = (calendar_config or {}).get("months") or []
    era_name = (calendar_config or {}).get("era_name") or ""

    # Calcula dias acumulados no ano conforme o calendário configurado da campanha
    if months_cfg and 1 <= month <= len(months_cfg):
        days_before_month = sum(int(m.get("days", 30)) for m in months_cfg[: month - 1])
        total_days_in_year = max(sum(int(m.get("days", 30)) for m in months_cfg), 1)
        month_name = months_cfg[month - 1].get("name", f"Mês {month}")
    else:
        days_before_month = (month - 1) * 31
        total_days_in_year = 372
        month_name = f"Mês {month:02d}"

    # Extrai minutos do horário opcional (ex: "14:30" -> 870)
    time_minutes = 0
    clean_time = narrative_time.strip() if narrative_time else None
    if clean_time and ":" in clean_time:
        try:
            t_parts = clean_time.split(":")
            h = max(0, min(99, int(t_parts[0])))
            m = max(0, min(59, int(t_parts[1])))
            time_minutes = h * 60 + m
        except Exception:
            time_minutes = 0

    # Chave inteira de 64 bits que preserva a ordem cronológica exata para anos negativos e positivos
    day_of_year = days_before_month + day
    sort_key = (year * (total_days_in_year + 10) * 1440) + (day_of_year * 1440) + time_minutes

    # Formata string de exibição se não fornecida ou se estivermos padronizando
    if effective_cal_type == "fictional":
        if not narrative_date or "-" in (narrative_date or ""):
            suffix = f" {era_name}".rstrip()
            display_date = f"{day} de {month_name}, Ano {year}{suffix}"
        else:
            display_date = narrative_date.strip()
    else:
        if narrative_date and not narrative_date.strip().startswith(f"{year:04d}-"):
            display_date = narrative_date.strip()
        else:
            display_date = f"{day:02d}/{month:02d}/{year:04d}"

    return (
        effective_cal_type,
        display_date,
        year,
        month,
        day,
        clean_time,
        sort_key,
    )
