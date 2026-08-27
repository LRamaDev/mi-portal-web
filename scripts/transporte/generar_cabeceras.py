#!/usr/bin/env python3
"""Genera el catálogo de cabeceras geográficas usado por el mapa esquemático."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path


GEOREF_URL = (
    "https://apis.datos.gob.ar/georef/api/localidades?"
    + urllib.parse.urlencode(
        {
            "provincia": "cordoba",
            "max": 5000,
            "campos": "id,nombre,centroide,departamento",
        }
    )
)

ASENTAMIENTOS_URL = (
    "https://apis.datos.gob.ar/georef/api/asentamientos?"
    + urllib.parse.urlencode(
        {
            "provincia": "cordoba",
            "max": 5000,
            "campos": "id,nombre,centroide,departamento",
        }
    )
)

ALIASES = {
    "ALTO LOS QUEBRACHOS": "ALTO DE LOS QUEBRACHOS",
    "CARLOS PAZ": "VILLA CARLOS PAZ",
    "CERRO AZUL": "VILLA CERRO AZUL",
    "ESCUELA DIQUE CHICO": "DIQUE CHICO",
    "HOLMBERG": "SANTA CATALINA HOLMBERG",
    "HUINCA": "HUINCA RENANCÓ",
    "LA BOLSA": "VILLA LA BOLSA",
    "LOS AROMOS": "VILLA LOS AROMOS",
    "MALVINAS": "MALVINAS ARGENTINAS",
    "MONTE CRISTO": "MONTECRISTO",
    "QUILPO": "CANTERAS QUILPO",
    "SAN BARTOLOMÉ": "COLONIA SAN BARTOLOMÉ",
    "SAN MARCOS SIERRAS": "SAN MARCOS SIERRA",
    "VILLA DE MARÍA DE RÍO SECO": "VILLA DE MARÍA",
    "YACANTO": "VILLA YACANTO",
}

# Puntos que no aparecen con el mismo nombre en Georef. Fueron contrastados
# individualmente en OpenStreetMap/Nominatim el 26-08-2026.
MANUAL = {
    "BUCHARDO": (-34.7238062, -63.5073178),
    "CABANA": (-31.2383631, -64.3329538),
    "EL TALAR": (-31.2553415, -64.2723410),
    "JOVITA": (-34.5188570, -63.9440228),
    "LA QUEBRADA": (-31.1495385, -64.3421134),
    "VALLE DEL SOL": (-31.2757458, -64.3053145),
}

PREFERRED_DEPARTMENT = {
    "BAJO DEL CARMEN": "Calamuchita",
    "CÓRDOBA": "Capital",
    "EL PUEBLITO": "Colón",
    "LA DORMIDA": "Tulumba",
    "LA CALERA": "Colón",
    "LOS MOLLES": "San Javier",
    "SALSIPUEDES": "Colón",
    "SANTO DOMINGO": "Cruz del Eje",
    "SANTA ROSA DE CALAMUCHITA": "Calamuchita",
}


def normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^A-Z0-9]+", " ", value.upper()).strip()


def download_georef(url: str, collection: str) -> list[dict]:
    request = urllib.request.Request(url, headers={"User-Agent": "ERSeP-Innova/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)[collection]


def choose_match(node: str, candidates: list[dict]) -> dict | None:
    if not candidates:
        return None
    preferred = PREFERRED_DEPARTMENT.get(node)
    if preferred:
        for candidate in candidates:
            if candidate.get("departamento", {}).get("nombre") == preferred:
                return candidate
        return None
    return candidates[0]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--schedule", type=Path, required=True)
    parser.add_argument(
        "--existing",
        type=Path,
        help="Catálogo vigente: conserva coordenadas validadas y consulta solo cabeceras nuevas",
    )
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    schedule = json.loads(args.schedule.read_text(encoding="utf-8"))
    nodes = sorted({node for service in schedule["services"] for node in service["nodes"]})
    existing = (
        json.loads(args.existing.read_text(encoding="utf-8"))
        if args.existing and args.existing.is_file()
        else {"locations": {}, "unresolved": []}
    )
    existing_locations = existing.get("locations", {})
    existing_unresolved = set(existing.get("unresolved", []))
    new_nodes = [
        node for node in nodes
        if node not in existing_locations and node not in existing_unresolved
    ]

    georef = download_georef(GEOREF_URL, "localidades") if new_nodes else []
    settlements = download_georef(ASENTAMIENTOS_URL, "asentamientos") if new_nodes else []
    by_name: dict[str, list[dict]] = {}
    for place in georef:
        by_name.setdefault(normalize(place["nombre"]), []).append(place)
    settlements_by_name: dict[str, list[dict]] = {}
    for place in settlements:
        settlements_by_name.setdefault(normalize(place["nombre"]), []).append(place)

    locations = {
        node: existing_locations[node]
        for node in nodes
        if node in existing_locations
    }
    unresolved = []
    for node in nodes:
        if node in locations:
            continue
        if node in existing_unresolved:
            unresolved.append(node)
            continue
        lookup = ALIASES.get(node, node)
        match = choose_match(node, by_name.get(normalize(lookup), []))
        source = "Georef Argentina · localidades"
        if not match:
            match = choose_match(node, settlements_by_name.get(normalize(lookup), []))
            source = "Georef Argentina · asentamientos"
        if match:
            center = match["centroide"]
            locations[node] = {
                "lat": center["lat"],
                "lon": center["lon"],
                "source": source,
                "source_name": match["nombre"],
                "department": match.get("departamento", {}).get("nombre"),
            }
        elif node in MANUAL:
            lat, lon = MANUAL[node]
            locations[node] = {
                "lat": lat,
                "lon": lon,
                "source": "OpenStreetMap/Nominatim · validación manual",
                "source_name": node.title(),
                "department": None,
            }
        else:
            unresolved.append(node)

    payload = {
        "schema_version": 1,
        "map_kind": "schematic-endpoint-connections",
        "sources": [
            {"name": "Georef Argentina", "url": GEOREF_URL},
            {"name": "Georef Argentina · asentamientos", "url": ASENTAMIENTOS_URL},
            {
                "name": "OpenStreetMap Nominatim",
                "url": "https://nominatim.openstreetmap.org/",
            },
        ],
        "locations": locations,
        "unresolved": unresolved,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {len(locations)} cabeceras; {len(unresolved)} sin ubicar: {', '.join(unresolved) or 'ninguna'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
