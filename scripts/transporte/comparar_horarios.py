#!/usr/bin/env python3
"""Genera el informe legible de cambios entre dos publicaciones de horarios."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def corridor_counts(services: list[dict]) -> Counter:
    return Counter(service["corridor"] for service in services)


def service_ids(services: list[dict]) -> set[str]:
    return {service["id"] for service in services}


def line_keys(services: list[dict]) -> set[tuple[str, str]]:
    return {(service["corridor"], service["line"]) for service in services}


def format_items(items: list[str], limit: int = 12) -> str:
    if not items:
        return "ninguna"
    shown = items[:limit]
    suffix = f" y {len(items) - limit} más" if len(items) > limit else ""
    return ", ".join(f"`{item}`" for item in shown) + suffix


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--old", type=Path, required=True)
    parser.add_argument("--new", type=Path, required=True)
    parser.add_argument("--old-locations", type=Path, required=True)
    parser.add_argument("--new-locations", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    old = load(args.old)
    new = load(args.new)
    old_geo = load(args.old_locations)
    new_geo = load(args.new_locations)
    old_services = old["services"]
    new_services = new["services"]
    old_ids = service_ids(old_services)
    new_ids = service_ids(new_services)
    old_lines = line_keys(old_services)
    new_lines = line_keys(new_services)
    old_counts = corridor_counts(old_services)
    new_counts = corridor_counts(new_services)
    corridors = sorted(set(old_counts) | set(new_counts))
    publication = max(
        (source.get("publication_date") or "" for source in new.get("sources", [])),
        default="",
    )

    warnings: list[str] = []
    for corridor in corridors:
        previous = old_counts[corridor]
        current = new_counts[corridor]
        if previous and abs(current - previous) / previous > 0.20:
            warnings.append(
                f"{corridor}: la cantidad de servicios cambió más de 20% ({previous} → {current})."
            )

    old_unresolved = set(old_geo.get("unresolved", []))
    new_unresolved = set(new_geo.get("unresolved", []))
    newly_unresolved = sorted(new_unresolved - old_unresolved)
    if newly_unresolved:
        warnings.append("Cabeceras nuevas sin coordenadas: " + ", ".join(newly_unresolved) + ".")

    rows = [
        "# Informe de actualización de horarios",
        "",
        f"**Publicación procesada:** {publication or 'sin fecha informada'}  ",
        f"**Servicios anteriores:** {len(old_services):,}  ".replace(",", "."),
        f"**Servicios nuevos:** {len(new_services):,}  ".replace(",", "."),
        f"**Agregados:** {len(new_ids - old_ids):,}  ".replace(",", "."),
        f"**Eliminados:** {len(old_ids - new_ids):,}  ".replace(",", "."),
        "",
        "## Servicios por corredor",
        "",
        "| Corredor | Anteriores | Nuevos | Diferencia |",
        "|---|---:|---:|---:|",
    ]
    for corridor in corridors:
        delta = new_counts[corridor] - old_counts[corridor]
        rows.append(f"| {corridor} | {old_counts[corridor]} | {new_counts[corridor]} | {delta:+d} |")

    added_lines = sorted(f"{corridor}: {line}" for corridor, line in new_lines - old_lines)
    removed_lines = sorted(f"{corridor}: {line}" for corridor, line in old_lines - new_lines)
    rows.extend(
        [
            "",
            "## Cambios de líneas",
            "",
            f"- Líneas nuevas: {format_items(added_lines)}.",
            f"- Líneas eliminadas: {format_items(removed_lines)}.",
            "",
            "## Control geográfico",
            "",
            f"- Cabeceras ubicadas: {len(new_geo.get('locations', {}))}.",
            f"- Cabeceras pendientes: {len(new_unresolved)}.",
            f"- Pendientes nuevas: {format_items(newly_unresolved)}.",
            "",
            "## Resultado",
            "",
        ]
    )
    if warnings:
        rows.append("⚠️ **Revisar antes de publicar:**")
        rows.extend(f"- {warning}" for warning in warnings)
    else:
        rows.append("✅ **Todos los controles automáticos fueron superados.**")
    rows.append("")

    report = "\n".join(rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(report, encoding="utf-8")
    print(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
