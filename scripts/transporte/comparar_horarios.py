#!/usr/bin/env python3
"""Compara dos publicaciones y genera informes legibles y estructurados."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict, deque
from pathlib import Path


DISPLAY_FIELDS = (
    "corridor", "line", "line_id", "nodes", "direction", "time", "minutes",
    "company", "cuit", "service_days_text", "service_days", "modality",
    "route", "source_file", "source_page",
)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def publication_date(schedule: dict) -> str:
    return max(
        (source.get("publication_date") or "" for source in schedule.get("sources", [])),
        default="",
    )


def structural_key(service: dict) -> tuple:
    """Identidad estable que no incluye hora, días ni procedencia del PDF."""
    return (
        service.get("corridor", ""), service.get("line", ""),
        tuple(service.get("nodes", [])), service.get("direction", ""),
        service.get("company", ""), service.get("cuit", ""),
        service.get("modality", ""), service.get("route", ""),
    )


def timetable_signature(service: dict) -> tuple:
    return structural_key(service) + (
        service.get("time", ""), tuple(service.get("service_days", [])),
    )


def service_view(service: dict) -> dict:
    return {field: service.get(field) for field in DISPLAY_FIELDS}


def minute_distance(left: dict, right: dict) -> int:
    a = int(left.get("minutes", 0)) % 1440
    b = int(right.get("minutes", 0)) % 1440
    distance = abs(a - b)
    return min(distance, 1440 - distance)


def match_cost(left: dict, right: dict) -> int:
    old_days = set(left.get("service_days", []))
    new_days = set(right.get("service_days", []))
    return minute_distance(left, right) + 180 * len(old_days.symmetric_difference(new_days))


def align_services(old: list[dict], new: list[dict]) -> tuple[list[tuple[dict, dict]], list[dict], list[dict]]:
    """Alinea cronológicamente servicios semejantes mediante programación dinámica."""
    old = sorted(old, key=lambda item: (item.get("minutes", 0), tuple(item.get("service_days", []))))
    new = sorted(new, key=lambda item: (item.get("minutes", 0), tuple(item.get("service_days", []))))
    gap = 720
    rows, columns = len(old), len(new)
    costs = [[0] * (columns + 1) for _ in range(rows + 1)]
    actions = [[""] * (columns + 1) for _ in range(rows + 1)]
    for index in range(1, rows + 1):
        costs[index][0] = index * gap
        actions[index][0] = "remove"
    for index in range(1, columns + 1):
        costs[0][index] = index * gap
        actions[0][index] = "add"
    for i in range(1, rows + 1):
        for j in range(1, columns + 1):
            candidates = [
                (costs[i - 1][j - 1] + match_cost(old[i - 1], new[j - 1]), 0, "match"),
                (costs[i - 1][j] + gap, 1, "remove"),
                (costs[i][j - 1] + gap, 2, "add"),
            ]
            cost, _, action = min(candidates)
            costs[i][j] = cost
            actions[i][j] = action

    pairs: list[tuple[dict, dict]] = []
    removed: list[dict] = []
    added: list[dict] = []
    i, j = rows, columns
    while i or j:
        action = actions[i][j]
        if action == "match":
            pairs.append((old[i - 1], new[j - 1]))
            i -= 1
            j -= 1
        elif action == "remove":
            removed.append(old[i - 1])
            i -= 1
        else:
            added.append(new[j - 1])
            j -= 1
    pairs.reverse()
    removed.reverse()
    added.reverse()
    return pairs, removed, added


def changed_fields(before: dict, after: dict) -> dict:
    fields = {}
    for field in ("time", "service_days", "service_days_text"):
        if before.get(field) != after.get(field):
            fields[field] = {"before": before.get(field), "after": after.get(field)}
    return fields


def change_identifier(before: dict, after: dict) -> str:
    payload = json.dumps(
        [service_view(before), service_view(after)], ensure_ascii=False,
        sort_keys=True, separators=(",", ":"),
    ).encode("utf-8")
    return "chg-" + hashlib.sha256(payload).hexdigest()[:16]


def compare_services(old_services: list[dict], new_services: list[dict]) -> dict:
    old_exact: dict[tuple, deque] = defaultdict(deque)
    new_exact: dict[tuple, deque] = defaultdict(deque)
    for service in old_services:
        old_exact[timetable_signature(service)].append(service)
    for service in new_services:
        new_exact[timetable_signature(service)].append(service)

    unchanged = 0
    remaining_old: list[dict] = []
    remaining_new: list[dict] = []
    for signature in sorted(set(old_exact) | set(new_exact), key=str):
        old_group = old_exact[signature]
        new_group = new_exact[signature]
        common = min(len(old_group), len(new_group))
        unchanged += common
        for _ in range(common):
            old_group.popleft()
            new_group.popleft()
        remaining_old.extend(old_group)
        remaining_new.extend(new_group)

    by_structure_old: dict[tuple, list[dict]] = defaultdict(list)
    by_structure_new: dict[tuple, list[dict]] = defaultdict(list)
    for service in remaining_old:
        by_structure_old[structural_key(service)].append(service)
    for service in remaining_new:
        by_structure_new[structural_key(service)].append(service)

    modified: list[dict] = []
    removed: list[dict] = []
    added: list[dict] = []
    for key in sorted(set(by_structure_old) | set(by_structure_new), key=str):
        pairs, group_removed, group_added = align_services(by_structure_old[key], by_structure_new[key])
        for before, after in pairs:
            fields = changed_fields(before, after)
            if fields:
                modified.append({
                    "id": change_identifier(before, after), "fields": fields,
                    "before": service_view(before), "after": service_view(after),
                })
            else:
                unchanged += 1
        removed.extend(service_view(service) for service in group_removed)
        added.extend(service_view(service) for service in group_added)

    sort_key = lambda item: (
        item.get("corridor", ""), item.get("line", ""), item.get("direction", ""),
        item.get("minutes", 0), item.get("company", ""),
    )
    added.sort(key=sort_key)
    removed.sort(key=sort_key)
    modified.sort(key=lambda item: sort_key(item["after"]))
    return {"unchanged": unchanged, "modified": modified, "added": added, "removed": removed}


def corridor_counts(services: list[dict]) -> Counter:
    return Counter(service["corridor"] for service in services)


def line_keys(services: list[dict]) -> set[tuple[str, str]]:
    return {(service["corridor"], service["line"]) for service in services}


def format_items(items: list[str], limit: int = 12) -> str:
    if not items:
        return "ninguna"
    shown = items[:limit]
    suffix = f" y {len(items) - limit} más" if len(items) > limit else ""
    return ", ".join(f"`{item}`" for item in shown) + suffix


def days_text(service: dict) -> str:
    return service.get("service_days_text") or ", ".join(map(str, service.get("service_days", [])))


def build_change_report(old: dict, new: dict, old_geo: dict, new_geo: dict) -> dict:
    old_services = old["services"]
    new_services = new["services"]
    comparison = compare_services(old_services, new_services)
    old_counts = corridor_counts(old_services)
    new_counts = corridor_counts(new_services)
    corridors = sorted(set(old_counts) | set(new_counts))
    old_lines = line_keys(old_services)
    new_lines = line_keys(new_services)
    old_unresolved = set(old_geo.get("unresolved", []))
    new_unresolved = set(new_geo.get("unresolved", []))
    newly_unresolved = sorted(new_unresolved - old_unresolved)
    warnings = []
    for corridor in corridors:
        previous = old_counts[corridor]
        current = new_counts[corridor]
        if previous and abs(current - previous) / previous > 0.20:
            warnings.append(f"{corridor}: la cantidad de servicios cambió más de 20% ({previous} → {current}).")
    if newly_unresolved:
        warnings.append("Cabeceras nuevas sin coordenadas: " + ", ".join(newly_unresolved) + ".")

    return {
        "schema_version": 1,
        "previous_publication_date": publication_date(old),
        "publication_date": publication_date(new),
        "summary": {
            "previous_services": len(old_services), "current_services": len(new_services),
            "unchanged": comparison["unchanged"], "modified": len(comparison["modified"]),
            "added": len(comparison["added"]), "removed": len(comparison["removed"]),
        },
        "corridors": [
            {"corridor": corridor, "previous": old_counts[corridor], "current": new_counts[corridor],
             "difference": new_counts[corridor] - old_counts[corridor]}
            for corridor in corridors
        ],
        "new_lines": [{"corridor": corridor, "line": line} for corridor, line in sorted(new_lines - old_lines)],
        "removed_lines": [{"corridor": corridor, "line": line} for corridor, line in sorted(old_lines - new_lines)],
        "geography": {"located": len(new_geo.get("locations", {})), "unresolved": len(new_unresolved), "newly_unresolved": newly_unresolved},
        "modified": comparison["modified"], "added": comparison["added"], "removed": comparison["removed"],
        "warnings": warnings,
    }


def markdown(report: dict) -> str:
    summary = report["summary"]
    rows = [
        "# Informe de actualización de horarios", "",
        f"**Publicación anterior:** {report['previous_publication_date'] or 'sin fecha informada'}  ",
        f"**Publicación procesada:** {report['publication_date'] or 'sin fecha informada'}  ",
        f"**Servicios anteriores:** {summary['previous_services']:,}  ".replace(",", "."),
        f"**Servicios nuevos:** {summary['current_services']:,}  ".replace(",", "."),
        f"**Sin cambios:** {summary['unchanged']:,}  ".replace(",", "."),
        f"**Horarios modificados:** {summary['modified']:,}  ".replace(",", "."),
        f"**Servicios agregados:** {summary['added']:,}  ".replace(",", "."),
        f"**Servicios eliminados:** {summary['removed']:,}  ".replace(",", "."),
        "", "## Servicios por corredor", "",
        "| Corredor | Anteriores | Nuevos | Diferencia |", "|---|---:|---:|---:|",
    ]
    for item in report["corridors"]:
        rows.append(f"| {item['corridor']} | {item['previous']} | {item['current']} | {item['difference']:+d} |")

    rows.extend(["", "## Horarios modificados", ""])
    if report["modified"]:
        rows.extend(["| Corredor | Línea | Sentido | Días | Anterior | Nuevo | Empresa |", "|---|---|---|---|---:|---:|---|"])
        for item in report["modified"][:100]:
            before, after = item["before"], item["after"]
            rows.append(f"| {after['corridor']} | {after['line']} | {after['direction']} | {days_text(after)} | {before['time']} | {after['time']} | {after['company']} |")
    else:
        rows.append("No se detectaron horarios modificados.")

    for title, key in (("Servicios eliminados", "removed"), ("Servicios agregados", "added")):
        rows.extend(["", f"## {title}", ""])
        if report[key]:
            rows.extend(["| Corredor | Línea | Sentido | Hora | Días | Empresa |", "|---|---|---|---:|---|---|"])
            for service in report[key][:100]:
                rows.append(f"| {service['corridor']} | {service['line']} | {service['direction']} | {service['time']} | {days_text(service)} | {service['company']} |")
        else:
            rows.append("Ninguno.")

    new_lines = [f"{item['corridor']}: {item['line']}" for item in report["new_lines"]]
    removed_lines = [f"{item['corridor']}: {item['line']}" for item in report["removed_lines"]]
    geography = report["geography"]
    rows.extend([
        "", "## Cambios de líneas", "",
        f"- Líneas nuevas: {format_items(new_lines)}.", f"- Líneas eliminadas: {format_items(removed_lines)}.",
        "", "## Control geográfico", "",
        f"- Cabeceras ubicadas: {geography['located']}.", f"- Cabeceras pendientes: {geography['unresolved']}.",
        f"- Pendientes nuevas: {format_items(geography['newly_unresolved'])}.", "", "## Resultado", "",
    ])
    if report["warnings"]:
        rows.append("⚠️ **Revisar antes de publicar:**")
        rows.extend(f"- {warning}" for warning in report["warnings"])
    else:
        rows.append("✅ **Todos los controles automáticos fueron superados.**")
    rows.append("")
    return "\n".join(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--old", type=Path, required=True)
    parser.add_argument("--new", type=Path, required=True)
    parser.add_argument("--old-locations", type=Path, required=True)
    parser.add_argument("--new-locations", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--json-output", type=Path)
    args = parser.parse_args()
    report = build_change_report(load(args.old), load(args.new), load(args.old_locations), load(args.new_locations))
    text = markdown(report)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8")
    if args.json_output:
        args.json_output.parent.mkdir(parents=True, exist_ok=True)
        args.json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
