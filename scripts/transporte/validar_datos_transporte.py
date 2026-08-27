#!/usr/bin/env python3
"""Controles mínimos antes de publicar datos de transporte en GitHub Pages."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


EXPECTED_CORRIDORS = {
    "ESTE-SUDESTE",
    "NORESTE",
    "NORTE",
    "PUNILLA",
    "RUTA 5",
    "SIERRAS CHICAS",
    "SUR",
    "TRASLASIERRA",
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schedule", type=Path, required=True)
    parser.add_argument("--locations", type=Path, required=True)
    args = parser.parse_args()

    schedule = json.loads(args.schedule.read_text(encoding="utf-8"))
    locations = json.loads(args.locations.read_text(encoding="utf-8"))
    services = schedule.get("services", [])
    errors = []

    if schedule.get("schema_version") != 1:
        errors.append("Versión de esquema de horarios inesperada")
    if not services:
        errors.append("No se extrajo ningún servicio")
    if schedule.get("stats", {}).get("services") != len(services):
        errors.append("El total declarado no coincide con la cantidad de servicios")

    corridors = {service.get("corridor") for service in services}
    if corridors != EXPECTED_CORRIDORS:
        missing = sorted(EXPECTED_CORRIDORS - corridors)
        extra = sorted(corridors - EXPECTED_CORRIDORS)
        if missing:
            errors.append("Faltan corredores: " + ", ".join(missing))
        if extra:
            errors.append("Hay corredores inesperados: " + ", ".join(extra))

    source_corridors = {source.get("corridor") for source in schedule.get("sources", [])}
    if source_corridors != EXPECTED_CORRIDORS:
        errors.append("Debe existir exactamente un cronograma vigente por cada corredor")

    ids = [service.get("id") for service in services]
    if len(ids) != len(set(ids)):
        errors.append("Hay identificadores de servicio repetidos")

    valid_days = set(range(1, 8))
    for service in services:
        if not set(service.get("service_days", [])).issubset(valid_days):
            errors.append(f"Días inválidos en {service.get('id')}")
        if service.get("direction") not in {"I", "V"}:
            errors.append(f"Sentido inválido en {service.get('id')}")
        if not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", service.get("time", "")):
            errors.append(f"Horario inválido en {service.get('id')}")
        if len(service.get("nodes", [])) < 2:
            errors.append(f"Línea sin dos cabeceras en {service.get('id')}")

    known_nodes = set(locations.get("locations", {})) | set(locations.get("unresolved", []))
    schedule_nodes = {node for service in services for node in service.get("nodes", [])}
    new_nodes = sorted(schedule_nodes - known_nodes)
    if new_nodes:
        errors.append("Hay cabeceras nuevas que requieren georreferenciación: " + ", ".join(new_nodes))

    if errors:
        raise SystemExit("ERROR:\n- " + "\n- ".join(dict.fromkeys(errors)))

    print(
        f"OK: {len(services)} servicios, "
        f"{len({service['line_id'] for service in services})} líneas y "
        f"{len(schedule_nodes)} cabeceras controladas"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
