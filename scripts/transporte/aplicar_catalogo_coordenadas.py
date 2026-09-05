#!/usr/bin/env python3
"""Aplica el catálogo JSON auditable a recorridos y cabeceras por ID/nombre exacto."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from importar_coordenadas_validadas import apply


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--routes", type=Path, required=True)
    parser.add_argument("--locations", type=Path, required=True)
    args = parser.parse_args()
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    records = catalog.get("points", [])
    routes = json.loads(args.routes.read_text(encoding="utf-8"))
    locations = json.loads(args.locations.read_text(encoding="utf-8"))
    route_count, location_count = apply(records, routes, locations)
    args.routes.write_text(json.dumps(routes, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    args.locations.write_text(json.dumps(locations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"catalog_points": len(records), "routes": route_count, "pdf_endpoints": location_count}, ensure_ascii=False))


if __name__ == "__main__":
    main()
