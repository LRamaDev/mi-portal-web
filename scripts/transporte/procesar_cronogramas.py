#!/usr/bin/env python3
"""Convierte cronogramas PDF de Transporte de Córdoba a JSON para el portal.

Los PDF se generan desde Excel y conservan texto seleccionable. El extractor usa
el modo de diseño de pypdf, reconoce cada fila por sus campos estables y falla si
queda alguna fila de servicio sin interpretar.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader


CORRIDOR_PATTERN = (
    r"SIERRAS CHICAS|ESTE-SUDESTE|TRASLASIERRA|PUNILLA|NORESTE|NORTE|RUTA 5|SUR"
)

ROW_RE = re.compile(
    rf"^\s*({CORRIDOR_PATTERN})\s+"
    r"(.+?)\s+([IV])\s+(\d{2}[:;]\d{2})\s+"
    r"(.+?)\s+(\d{2}-\d{8}-\d|#N/D)\s*"
    r"(.+?)\s*(REGULAR\s+(?:COMÚN|DIFERENCIAL)(?:\s+DIRECTO)?)\s*(.*)$"
)

SOURCE_ROW_RE = re.compile(rf"^\s*(?:{CORRIDOR_PATTERN})\s+")
DATE_IN_PARENS_RE = re.compile(r"\((\d{2}\.\d{2}\.\d{2})\)")
UNCHANGED_RE = re.compile(r"IDEM\s+al\s+(\d{2}\.\d{2}\.\d{2})", re.IGNORECASE)
PDF_METADATA_DATE_RE = re.compile(r"^D:(\d{4})(\d{2})(\d{2})")

DAYS = {
    "DIARIO": [1, 2, 3, 4, 5, 6, 7],
    "LUNES A VIERNES": [1, 2, 3, 4, 5],
    "LUNES A SÁBADOS": [1, 2, 3, 4, 5, 6],
    "FINES DE SEMANA": [6, 7],
    "SÁBADO": [6],
    "DOMINGO": [7],
    "LUNES": [1],
    "VIERNES": [5],
    "LUNES A JUEVES": [1, 2, 3, 4],
    "LUNES Y VIERNES": [1, 5],
    "VIERNES Y DOMINGOS": [5, 7],
    "LUNES A VIERNES Y DOMINGOS": [1, 2, 3, 4, 5, 7],
    "LUNES A JUEVES Y DOMINGOS": [1, 2, 3, 4, 7],
    "LUNES, VIERNES, SÁBADO Y DOM": [1, 5, 6, 7],
    "LUNES, MIÉRCOLES Y VIERNES": [1, 3, 5],
    "LUNES, MARTES Y MIÉRCOLES": [1, 2, 3],
    "LUNES Y SÁBADO": [1, 6],
    "LUNES, VIERNES Y SÁBADO": [1, 5, 6],
    "LUNES, VIERNES, SÁB Y DOM": [1, 5, 6, 7],
    "MARTES Y JUEVES": [2, 4],
    "MARTES A JUEVES Y DOMINGOS": [2, 3, 4, 7],
    "MARTES A VIERNES": [2, 3, 4, 5],
    "MARTES A SÁBADOS": [2, 3, 4, 5, 6],
    "MARTES, MIÉRCOLES Y JUEVES": [2, 3, 4],
    "MARTES, JUEVES Y SÁBADO": [2, 4, 6],
    "MIÉRCOLES": [3],
    "JUEVES": [4],
    "VIERNES, SÁBADO Y DOMINGO": [5, 6, 7],
}


@dataclass(frozen=True)
class Service:
    id: str
    corridor: str
    line: str
    line_id: str
    nodes: list[str]
    direction: str
    time: str
    minutes: int
    company: str
    cuit: str
    service_days_text: str
    service_days: list[int]
    modality: str
    route: str
    source_file: str
    source_page: int
    possible_duplicate: bool
    duplicate_ordinal: int


def clean_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_time(value: str) -> str:
    """Normaliza el separador horario usado en los PDF oficiales."""
    return value.replace(";", ":")


def normalize_route(value: str) -> str:
    """Recompone cortes tipográficos conocidos de la columna de recorrido."""
    return value.replace("CH AZÓN", "CHAZÓN")


def normalized_key(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    ascii_like = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^A-Z0-9]+", "-", ascii_like.upper()).strip("-").lower()


def line_nodes(line: str) -> list[str]:
    nodes = []
    for part in line.split(" - "):
        part = re.sub(r"\s*\([^)]*\)\s*", "", part).strip()
        if part and (not nodes or part != nodes[-1]):
            nodes.append(part)
    return nodes


def parse_filename_date(match: re.Match[str] | None) -> str | None:
    if not match:
        return None
    return datetime.strptime(match.group(1), "%d.%m.%y").date().isoformat()


def parse_pdf_metadata_date(value: object) -> str | None:
    match = PDF_METADATA_DATE_RE.match(str(value or ""))
    if not match:
        return None
    year, month, day = (int(part) for part in match.groups())
    return datetime(year, month, day).date().isoformat()


def source_metadata(path: Path, page_count: int, row_count: int, pdf_metadata=None) -> dict:
    name = path.name
    metadata = pdf_metadata or {}
    publication_date = parse_filename_date(DATE_IN_PARENS_RE.search(name))
    if not publication_date:
        publication_date = (
            parse_pdf_metadata_date(metadata.get("/ModDate"))
            or parse_pdf_metadata_date(metadata.get("/CreationDate"))
        )
    return {
        "filename": name,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "publication_date": publication_date,
        "unchanged_since": parse_filename_date(UNCHANGED_RE.search(name)),
        "pages": page_count,
        "source_rows": row_count,
    }


def parse_pdf(path: Path) -> tuple[list[dict], dict, list[str]]:
    reader = PdfReader(path)
    parsed: list[dict] = []
    rejected: list[str] = []
    candidates = 0

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text(extraction_mode="layout") or ""
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not SOURCE_ROW_RE.match(line):
                continue
            candidates += 1
            match = ROW_RE.match(line)
            if not match:
                rejected.append(f"{path.name} · página {page_number}: {line}")
                continue

            corridor, route_line, direction, time, company, cuit, days, modality, route = (
                clean_spaces(value) for value in match.groups()
            )
            time = normalize_time(time)
            route = normalize_route(route)
            if days not in DAYS:
                rejected.append(
                    f"{path.name} · página {page_number}: días no reconocidos: {days!r}"
                )
                continue

            hours, minutes = (int(value) for value in time.split(":"))
            if hours > 23 or minutes > 59:
                rejected.append(f"{path.name} · página {page_number}: horario inválido: {time}")
                continue

            parsed.append(
                {
                    "corridor": corridor,
                    "line": route_line,
                    "line_id": normalized_key(f"{corridor}-{route_line}"),
                    "nodes": line_nodes(route_line),
                    "direction": direction,
                    "time": time,
                    "minutes": hours * 60 + minutes,
                    "company": company,
                    "cuit": cuit,
                    "service_days_text": days,
                    "service_days": DAYS[days],
                    "modality": modality,
                    "route": route,
                    "source_file": path.name,
                    "source_page": page_number,
                }
            )

    if candidates != len(parsed) + len(rejected):
        raise RuntimeError(f"Control de filas inconsistente en {path.name}")

    return parsed, source_metadata(path, len(reader.pages), candidates, reader.metadata), rejected


def duplicate_key(row: dict) -> tuple:
    excluded = {"source_file", "source_page", "line_id", "nodes", "minutes", "service_days"}
    return tuple((key, json.dumps(value, ensure_ascii=False, sort_keys=True)) for key, value in row.items() if key not in excluded)


def build_services(rows: list[dict]) -> tuple[list[Service], int]:
    counts = Counter(duplicate_key(row) for row in rows)
    seen: Counter = Counter()
    services: list[Service] = []

    for row in rows:
        key = duplicate_key(row)
        seen[key] += 1
        digest_source = "|".join(value for _, value in key)
        digest = hashlib.sha1(digest_source.encode("utf-8")).hexdigest()[:12]
        ordinal = seen[key]
        services.append(
            Service(
                id=f"svc-{digest}-{ordinal}",
                possible_duplicate=counts[key] > 1,
                duplicate_ordinal=ordinal,
                **row,
            )
        )

    duplicate_excess = sum(count - 1 for count in counts.values() if count > 1)
    return services, duplicate_excess


def build_payload(pdf_paths: list[Path], latest_per_corridor: bool = False) -> dict:
    documents: list[tuple[list[dict], dict]] = []
    rejected: list[str] = []

    for path in pdf_paths:
        rows, metadata, failures = parse_pdf(path)
        if rows:
            metadata["corridor"] = rows[0]["corridor"]
        documents.append((rows, metadata))
        rejected.extend(failures)

    if rejected:
        details = "\n".join(f"- {item}" for item in rejected[:30])
        raise ValueError(f"Quedaron {len(rejected)} filas sin interpretar:\n{details}")

    ignored_sources: list[dict] = []
    if latest_per_corridor:
        selected: dict[str, tuple[list[dict], dict]] = {}
        for rows, metadata in documents:
            corridor = metadata.get("corridor")
            if not corridor:
                continue
            current = selected.get(corridor)
            candidate_key = (metadata.get("publication_date") or "", metadata["filename"])
            current_key = (
                (current[1].get("publication_date") or "", current[1]["filename"])
                if current else ("", "")
            )
            if not current or candidate_key > current_key:
                if current:
                    ignored_sources.append(current[1])
                selected[corridor] = (rows, metadata)
            else:
                ignored_sources.append(metadata)
        documents = list(selected.values())

    all_rows = [row for rows, _ in documents for row in rows]
    sources = [metadata for _, metadata in documents]
    services, duplicate_excess = build_services(all_rows)
    rows = [asdict(service) for service in services]
    corridors = sorted({row["corridor"] for row in rows})
    lines = {(row["corridor"], row["line"]) for row in rows}
    companies = {row["company"] for row in rows}

    latest_publication = max(
        (source.get("publication_date") or "" for source in sources),
        default="",
    )
    return {
        "schema_version": 1,
        "generated_at": latest_publication + "T00:00:00Z" if latest_publication else None,
        "timezone": "America/Argentina/Cordoba",
        "sources": sorted(sources, key=lambda item: item["filename"]),
        "ignored_older_sources": sorted(ignored_sources, key=lambda item: item["filename"]),
        "stats": {
            "source_rows": len(rows),
            "services": len(rows),
            "corridors": len(corridors),
            "lines": len(lines),
            "companies": len(companies),
            "possible_duplicate_excess": duplicate_excess,
            "without_route_description": sum(not row["route"] for row in rows),
            "cuit_not_available": sum(row["cuit"] == "#N/D" for row in rows),
        },
        "corridors": corridors,
        "services": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdfs", nargs="+", type=Path, help="Cronogramas PDF a procesar")
    parser.add_argument("--output", "-o", type=Path, required=True, help="JSON de salida")
    parser.add_argument(
        "--latest-per-corridor",
        action="store_true",
        help="Si hay históricos, publica solo el PDF más reciente de cada corredor",
    )
    args = parser.parse_args()

    missing = [str(path) for path in args.pdfs if not path.is_file()]
    if missing:
        parser.error("No se encontraron: " + ", ".join(missing))

    try:
        payload = build_payload(args.pdfs, latest_per_corridor=args.latest_per_corridor)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    stats = payload["stats"]
    print(
        f"OK: {stats['services']} servicios, {stats['lines']} líneas, "
        f"{stats['companies']} empresas -> {args.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
