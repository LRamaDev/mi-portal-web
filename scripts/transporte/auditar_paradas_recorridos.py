#!/usr/bin/env python3
"""Audita faltantes y saltos geográficos de la base orientativa de recorridos."""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
import math
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from procesar_recorridos import signature


def haversine(a: dict, b: dict) -> float:
    radius = 6371.0
    dlat = math.radians(b["lat"] - a["lat"])
    dlon = math.radians(b["lon"] - a["lon"])
    value = math.sin(dlat / 2) ** 2 + math.cos(math.radians(a["lat"])) * math.cos(math.radians(b["lat"])) * math.sin(dlon / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(value))


def service_counts(schedule: dict, routes: dict) -> Counter:
    counts = Counter()
    for service in schedule["services"]:
        profile_id = routes.get("bindings", {}).get(signature(service))
        if profile_id:
            counts[profile_id] += 1
    return counts


def audit(schedule: dict, routes: dict, traces: dict | None = None) -> dict:
    counts = service_counts(schedule, routes)
    profiles = {profile["id"]: profile for profile in routes["profiles"]}
    missing = {}
    segments = []
    linked_profiles = [profiles[profile_id] for profile_id in counts]
    for profile in linked_profiles:
        services = counts[profile["id"]]
        for index, stop in enumerate(profile["stops"]):
            place = routes["places"][stop["place_id"]]
            if place.get("lat") is None or place.get("lon") is None:
                item = missing.setdefault(place["id"], {
                    "id": place["id"], "name": place["name"], "corridors": set(), "profiles": set(),
                    "services": 0, "endpoint_services": 0, "companies": set(), "lines": set(),
                    "directions": set(), "neighbors": set(), "sources": set(),
                })
                item["corridors"].add(profile["corridor"])
                item["profiles"].add(profile["id"])
                item["services"] += services
                if index in (0, len(profile["stops"]) - 1):
                    item["endpoint_services"] += services
                item["companies"].add(str(profile.get("company") or ""))
                item["lines"].add(profile["line"])
                item["directions"].add(profile["direction"])
                item["sources"].add(f'{profile["source_sheet"]} · filas {profile["source_rows"][0]}–{profile["source_rows"][-1]}')
                for neighbor_index in (index - 1, index + 1):
                    if 0 <= neighbor_index < len(profile["stops"]):
                        neighbor = routes["places"][profile["stops"][neighbor_index]["place_id"]]
                        item["neighbors"].add(f'{"anterior" if neighbor_index < index else "siguiente"}: {neighbor["name"]} ({neighbor["id"]})')
        located = []
        for index, stop in enumerate(profile["stops"]):
            place = routes["places"][stop["place_id"]]
            if isinstance(place.get("lat"), (int, float)) and isinstance(place.get("lon"), (int, float)):
                located.append((index, stop, place))
        for previous, current in zip(located, located[1:]):
            start_index, start_stop, start = previous
            end_index, end_stop, end = current
            distance = haversine(start, end)
            minutes = end_stop["arrival_offset"] - start_stop["departure_offset"]
            speed = distance * 60 / minutes if minutes > 0 else math.inf
            severity = "Crítica" if distance > 120 or (distance > 10 and speed > 200) else "Revisar" if distance > 10 and speed > 125 else None
            if severity:
                segments.append({
                    "severity": severity, "profile_id": profile["id"], "corridor": profile["corridor"],
                    "company": profile.get("company") or "", "line": profile["line"], "direction": profile["direction"],
                    "from_index": start_index, "from_id": start["id"], "from_name": start["name"], "from_lat": start["lat"], "from_lon": start["lon"], "from_source": start.get("geo_source") or "",
                    "to_index": end_index, "to_id": end["id"], "to_name": end["name"], "to_lat": end["lat"], "to_lon": end["lon"], "to_source": end.get("geo_source") or "",
                    "missing_between": end_index - start_index - 1, "distance_km": round(distance, 1), "minutes": minutes,
                    "implied_speed_kmh": None if not math.isfinite(speed) else round(speed, 1), "services": services,
                })
    missing_rows = []
    for item in missing.values():
        missing_rows.append({
            **{key: value for key, value in item.items() if not isinstance(value, set)},
            "corridors": sorted(item["corridors"]), "profiles": sorted(item["profiles"]),
            "profile_count": len(item["profiles"]), "companies": sorted(filter(None, item["companies"])),
            "lines": sorted(item["lines"]), "directions": sorted(item["directions"]),
            "neighbors": sorted(item["neighbors"]), "sources": sorted(item["sources"]),
        })
    missing_rows.sort(key=lambda item: (-item["services"], -item["endpoint_services"], item["name"]))
    segments.sort(key=lambda item: (item["severity"] != "Crítica", -item["services"], -item["distance_km"]))
    pilot = []
    quarantined_rows = []
    if traces:
        for profile_id, trace in traces.get("profiles", {}).items():
            profile = profiles[profile_id]
            pilot.append({
                "profile_id": profile_id, "corridor": profile["corridor"], "company": profile.get("company") or "",
                "line": profile["line"], "direction": profile["direction"], "services": counts[profile_id],
                "stops": [routes["places"][stop["place_id"]]["name"] for stop in profile["stops"]],
                "distance_km": round(trace["distance_m"] / 1000, 1), "segments": len(trace["segments"]),
            })
        pilot.sort(key=lambda item: item["corridor"])
        for item in traces.get("audit", {}).get("quarantined_places", []):
            place = routes["places"][item["place_id"]]
            affected = [profiles[profile_id] for profile_id in item.get("profiles", []) if profile_id in profiles]
            quarantined_rows.append({
                "id": place["id"], "name": place["name"], "lat": place["lat"], "lon": place["lon"],
                "source": place.get("geo_source") or "", "corridors": sorted({profile["corridor"] for profile in affected}),
                "companies": sorted({str(profile.get("company") or "") for profile in affected}),
                "lines": sorted({profile["line"] for profile in affected}), "profiles": sorted(item.get("profiles", [])),
                "services": sum(counts[profile["id"]] for profile in affected), "reason": item["reason"],
            })
        quarantined_rows.sort(key=lambda item: (-item["services"], item["name"]))
    return {
        "summary": {
            "services": len(schedule["services"]), "linked_services": sum(counts.values()), "linked_profiles": len(linked_profiles),
            "missing_linked_places": len(missing_rows), "critical_segments": sum(item["severity"] == "Crítica" for item in segments),
            "critical_profiles": len({item["profile_id"] for item in segments if item["severity"] == "Crítica"}),
            "review_segments": sum(item["severity"] == "Revisar" for item in segments),
            "quarantined_places": len(quarantined_rows), "pilot_profiles": len(pilot),
        },
        "missing_places": missing_rows,
        "suspicious_segments": segments,
        "quarantined_places": quarantined_rows,
        "pilot_profiles": pilot,
        "policy": {
            "critical": "Más de 120 km entre puntos conocidos o más de 200 km/h implícitos en un tramo mayor a 10 km.",
            "review": "Más de 125 km/h implícitos en un tramo mayor a 10 km.",
            "routing": "Solo se enrutan perfiles sin alertas críticas; el resultado se publica como orientativo.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schedule", type=Path, required=True)
    parser.add_argument("--routes", type=Path, required=True)
    parser.add_argument("--traces", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    schedule = json.loads(args.schedule.read_text(encoding="utf-8"))
    routes = json.loads(args.routes.read_text(encoding="utf-8"))
    traces = json.loads(args.traces.read_text(encoding="utf-8")) if args.traces and args.traces.exists() else None
    result = audit(schedule, routes, traces)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
