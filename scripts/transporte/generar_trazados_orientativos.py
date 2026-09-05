#!/usr/bin/env python3
"""Genera geometrías viales orientativas sin convertir el mapa en un GPS.

Los recorridos se calculan una sola vez con OSRM/OpenStreetMap y se guardan en
un JSON estático. La aplicación publicada no consulta servicios externos. Se
descartan perfiles con coordenadas incompatibles con sus demoras para evitar
que un homónimo mal ubicado produzca un trazado engañoso.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


DEFAULT_SERVER = "https://router.project-osrm.org"
USER_AGENT = "ERSeP-transporte/1.0 (trazados orientativos; GitHub LRamaDev/mi-portal-web)"


def haversine(a: dict, b: dict) -> float:
    radius = 6371.0
    dlat = math.radians(b["lat"] - a["lat"])
    dlon = math.radians(b["lon"] - a["lon"])
    value = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(a["lat"]))
        * math.cos(math.radians(b["lat"]))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(value))


def linked_profiles(routes: dict) -> list[dict]:
    linked = set(routes.get("bindings", {}).values())
    return [profile for profile in routes.get("profiles", []) if profile["id"] in linked]


def located_waypoints(
    profile: dict,
    places: dict,
    excluded_place_ids: set[str] | None = None,
) -> list[dict]:
    excluded_place_ids = excluded_place_ids or set()
    result = []
    for index, stop in enumerate(profile["stops"]):
        place = places.get(stop["place_id"], {})
        if (
            stop["place_id"] not in excluded_place_ids
            and isinstance(place.get("lat"), (int, float))
            and isinstance(place.get("lon"), (int, float))
        ):
            result.append({"index": index, "place": place})
    return result


def coordinate_audit(
    profile: dict,
    places: dict,
    excluded_place_ids: set[str] | None = None,
) -> list[dict]:
    """Detecta saltos críticos entre los puntos conocidos consecutivos."""
    warnings = []
    waypoints = located_waypoints(profile, places, excluded_place_ids)
    for previous, current in zip(waypoints, waypoints[1:]):
        start, end = previous["place"], current["place"]
        distance = haversine(start, end)
        start_stop = profile["stops"][previous["index"]]
        end_stop = profile["stops"][current["index"]]
        minutes = end_stop["arrival_offset"] - start_stop["departure_offset"]
        speed = distance * 60 / minutes if minutes > 0 else math.inf
        if distance > 120 or (distance > 10 and speed > 200):
            warnings.append({
                "from_index": previous["index"],
                "to_index": current["index"],
                "from_place_id": start["id"],
                "to_place_id": end["id"],
                "distance_km": round(distance, 1),
                "minutes": minutes,
                "implied_speed_kmh": None if not math.isfinite(speed) else round(speed, 1),
            })
    return warnings


def quarantine_candidates(profile: dict, places: dict) -> list[dict]:
    """Aísla el punto central cuando ambos saltos son críticos y sus vecinos no."""
    waypoints = located_waypoints(profile, places)
    warnings = coordinate_audit(profile, places)
    critical_pairs = {(item["from_index"], item["to_index"]) for item in warnings}
    result = []
    for previous, current, following in zip(waypoints, waypoints[1:], waypoints[2:]):
        if (previous["index"], current["index"]) not in critical_pairs or (current["index"], following["index"]) not in critical_pairs:
            continue
        distance = haversine(previous["place"], following["place"])
        start = profile["stops"][previous["index"]]
        end = profile["stops"][following["index"]]
        minutes = end["arrival_offset"] - start["departure_offset"]
        speed = distance * 60 / minutes if minutes > 0 else math.inf
        if distance <= 120 and not (distance > 10 and speed > 200):
            result.append({
                "place_id": current["place"]["id"], "name": current["place"]["name"],
                "profile_id": profile["id"], "previous_place_id": previous["place"]["id"],
                "next_place_id": following["place"]["id"],
                "reason": "Punto central de dos saltos críticos; los vecinos entre sí son coherentes",
            })
    return result


def profile_unsafe_places(profile: dict, places: dict) -> list[str]:
    """Devuelve los puntos que no deben dibujarse en este recorrido.

    Primero retira los homónimos aislados que rompen dos tramos mientras sus
    vecinos son coherentes. Si aún quedan saltos críticos y no puede saberse
    con certeza cuál extremo está mal, aparta preventivamente ambos extremos
    solo para este perfil. Es preferible un conector punteado a una geometría
    falsa que cruce la provincia.
    """
    isolated = {item["place_id"] for item in quarantine_candidates(profile, places)}
    unresolved = coordinate_audit(profile, places, isolated)
    unsafe = set(isolated)
    for warning in unresolved:
        unsafe.add(warning["from_place_id"])
        unsafe.add(warning["to_place_id"])
    return sorted(unsafe)


def request_route(server: str, waypoints: list[dict], timeout: int) -> dict:
    coordinates = ";".join(f'{item["place"]["lon"]:.7f},{item["place"]["lat"]:.7f}' for item in waypoints)
    query = urlencode({"overview": "false", "steps": "true", "geometries": "geojson"})
    url = f"{server.rstrip('/')}/route/v1/driving/{coordinates}?{query}"
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=timeout) as response:
        payload = json.load(response)
    if payload.get("code") != "Ok" or not payload.get("routes"):
        raise RuntimeError(f"OSRM respondió {payload.get('code', 'sin código')}")
    return payload["routes"][0]


def step_coordinates(leg: dict) -> list[list[float]]:
    points = []
    for step in leg.get("steps", []):
        geometry = step.get("geometry", {}).get("coordinates", [])
        for coordinate in geometry:
            if len(coordinate) < 2:
                continue
            point = [round(float(coordinate[0]), 6), round(float(coordinate[1]), 6)]
            if not points or point != points[-1]:
                points.append(point)
    return simplify(points)


def simplify(points: list[list[float]], tolerance_m: float = 12) -> list[list[float]]:
    """Douglas–Peucker en una proyección local; conserva curvas útiles al mapa."""
    if len(points) <= 2:
        return points
    mean_lat = math.radians(sum(point[1] for point in points) / len(points))
    projected = [(point[0] * 111_320 * math.cos(mean_lat), point[1] * 110_540) for point in points]

    def distance_to_line(point, start, end):
        dx, dy = end[0] - start[0], end[1] - start[1]
        if dx == 0 and dy == 0:
            return math.hypot(point[0] - start[0], point[1] - start[1])
        return abs(dy * point[0] - dx * point[1] + end[0] * start[1] - end[1] * start[0]) / math.hypot(dx, dy)

    def keep(start: int, end: int, indexes: set[int]) -> None:
        furthest, distance = None, 0.0
        for index in range(start + 1, end):
            candidate = distance_to_line(projected[index], projected[start], projected[end])
            if candidate > distance:
                furthest, distance = index, candidate
        if furthest is not None and distance > tolerance_m:
            indexes.add(furthest)
            keep(start, furthest, indexes)
            keep(furthest, end, indexes)

    indexes = {0, len(points) - 1}
    keep(0, len(points) - 1, indexes)
    return [points[index] for index in sorted(indexes)]


def make_profile_trace(profile: dict, places: dict, route: dict) -> dict:
    waypoints = located_waypoints(profile, places)
    legs = route.get("legs", [])
    if len(legs) != len(waypoints) - 1:
        raise RuntimeError("OSRM devolvió una cantidad inesperada de tramos")
    segments = []
    for leg, start, end in zip(legs, waypoints, waypoints[1:]):
        coordinates = step_coordinates(leg)
        if len(coordinates) < 2:
            coordinates = [
                [start["place"]["lon"], start["place"]["lat"]],
                [end["place"]["lon"], end["place"]["lat"]],
            ]
        straight = haversine(start["place"], end["place"])
        road_km = float(leg.get("distance", 0)) / 1000
        if road_km > max(straight * 4, straight + 35):
            raise RuntimeError(f"desvío vial inverosímil: {road_km:.1f} km para {straight:.1f} km en línea recta")
        segments.append({
            "from_index": start["index"],
            "to_index": end["index"],
            "missing_stops": max(0, end["index"] - start["index"] - 1),
            "distance_m": round(float(leg.get("distance", 0))),
            "duration_s": round(float(leg.get("duration", 0))),
            "coordinates": coordinates,
        })
    return {
        "status": "orientative",
        "waypoints": [
            {
                "index": item["index"], "place_id": item["place"]["id"],
                "lat": item["place"]["lat"], "lon": item["place"]["lon"],
            }
            for item in waypoints
        ],
        "segments": segments,
        "distance_m": round(float(route.get("distance", 0))),
        "duration_s": round(float(route.get("duration", 0))),
    }


def reusable_trace(profile: dict, places: dict, trace: dict) -> bool:
    expected = [
        {"index": item["index"], "place_id": item["place"]["id"], "lat": item["place"]["lat"], "lon": item["place"]["lon"]}
        for item in located_waypoints(profile, places)
    ]
    return trace.get("waypoints") == expected and bool(trace.get("segments"))


def generate(
    routes: dict,
    server: str,
    delay: float,
    timeout: int,
    limit: int | None,
    selected_ids: set[str] | None = None,
    existing: dict | None = None,
) -> dict:
    profiles = linked_profiles(routes)
    output = {}
    audit = {"insufficient_points": [], "coordinate_warnings": [], "quarantined_places": [], "routing_errors": []}
    quarantined = {}
    candidates = []
    for profile in profiles:
        waypoints = located_waypoints(profile, routes["places"])
        warnings = coordinate_audit(profile, routes["places"])
        if len(waypoints) < 2:
            audit["insufficient_points"].append(profile["id"])
        elif warnings:
            audit["coordinate_warnings"].append({
                "profile_id": profile["id"],
                "warnings": warnings,
                "unsafe_place_ids": profile_unsafe_places(profile, routes["places"]),
                "policy": "Los puntos incoherentes se omiten del recorrido hasta verificar sus coordenadas",
            })
            for item in quarantine_candidates(profile, routes["places"]):
                key = item["place_id"]
                if key not in quarantined:
                    quarantined[key] = {"place_id": key, "name": item["name"], "profiles": [], "reason": item["reason"]}
                quarantined[key]["profiles"].append(item["profile_id"])
        else:
            candidates.append(profile)
    eligible_count = len(candidates)
    if selected_ids:
        requested = [profile for profile in candidates if profile["id"] in selected_ids]
        missing = selected_ids - {profile["id"] for profile in requested}
        if missing:
            raise ValueError("Perfiles inexistentes o bloqueados por auditoría: " + ", ".join(sorted(missing)))
    else:
        requested = candidates[:limit] if limit is not None else candidates
    reused = 0
    for position, profile in enumerate(requested, 1):
        previous_trace = existing.get("profiles", {}).get(profile["id"]) if existing else None
        if previous_trace and reusable_trace(profile, routes["places"], previous_trace):
            output[profile["id"]] = previous_trace
            reused += 1
            print(f"[{position}/{len(requested)}] {profile['id']} · {profile['corridor']} · reutilizado", flush=True)
            continue
        try:
            route = request_route(server, located_waypoints(profile, routes["places"]), timeout)
            output[profile["id"]] = make_profile_trace(profile, routes["places"], route)
            print(f"[{position}/{len(requested)}] {profile['id']} · {profile['corridor']} · listo", flush=True)
        except (HTTPError, URLError, TimeoutError, RuntimeError, ValueError) as error:
            audit["routing_errors"].append({"profile_id": profile["id"], "error": str(error)})
            print(f"[{position}/{len(requested)}] {profile['id']} · ERROR: {error}", flush=True)
        if delay and position < len(requested):
            time.sleep(delay)
    audit["quarantined_places"] = sorted(quarantined.values(), key=lambda item: item["name"])
    for item in audit["quarantined_places"]:
        item["profiles"] = sorted(set(item["profiles"]))
    return {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {
            "map": "OpenStreetMap",
            "router": "OSRM",
            "server": server,
            "usage": "Recorrido vial orientativo; no confirma calles autorizadas ni posición en vivo",
        },
        "profiles": output,
        "audit": audit,
        "stats": {
            "linked_profiles": len(profiles),
            "eligible_profiles": eligible_count,
            "requested_profiles": len(requested),
            "routed_profiles": len(output),
            "reused_profiles": reused,
            "coordinate_warnings": len(audit["coordinate_warnings"]),
            "quarantined_places": len(audit["quarantined_places"]),
            "insufficient_points": len(audit["insufficient_points"]),
            "routing_errors": len(audit["routing_errors"]),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--routes", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--server", default=DEFAULT_SERVER)
    parser.add_argument("--delay", type=float, default=0.2, help="Pausa entre consultas")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--profile", action="append", default=[], help="ID de perfil seguro; puede repetirse")
    parser.add_argument("--reuse", type=Path, help="JSON anterior cuyas geometrías válidas pueden reutilizarse")
    args = parser.parse_args()
    routes = json.loads(args.routes.read_text(encoding="utf-8"))
    existing = json.loads(args.reuse.read_text(encoding="utf-8")) if args.reuse and args.reuse.exists() else None
    result = generate(routes, args.server, args.delay, args.timeout, args.limit, set(args.profile) or None, existing)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(result["stats"], ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
