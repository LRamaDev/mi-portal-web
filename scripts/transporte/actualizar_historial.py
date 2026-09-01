#!/usr/bin/env python3
"""Mantiene el índice histórico y los respaldos JSON comprimidos de horarios."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import shutil
from datetime import date, timedelta
from pathlib import Path


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def publication_date(schedule: dict) -> str:
    return max(
        (source.get("publication_date") or "" for source in schedule.get("sources", [])),
        default="",
    )


def source_dates(schedule: dict) -> dict[str, str | None]:
    return {
        source.get("corridor", ""): source.get("publication_date")
        for source in schedule.get("sources", [])
        if source.get("corridor")
    }


def canonical_bytes(payload: dict) -> bytes:
    return (
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    ).encode("utf-8")


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def snapshot_payload(schedule: dict, locations: dict, routes: dict, published: str) -> dict:
    return {
        "schema_version": 1,
        "publication_date": published,
        "timezone": schedule.get("timezone", "America/Argentina/Cordoba"),
        "schedule": schedule,
        "locations": locations,
        "routes": routes,
    }


def write_snapshot(history_dir: Path, schedule: dict, locations: dict, routes: dict, preserve_existing: bool = False) -> dict:
    published = publication_date(schedule)
    if not published:
        raise ValueError("El cronograma no contiene una fecha de publicación.")
    relative = Path("backups") / f"horarios-{published}.json.gz"
    destination = history_dir / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    if preserve_existing and destination.exists():
        compressed = destination.read_bytes()
        raw = gzip.decompress(compressed)
        stored = json.loads(raw)
        if stored.get("publication_date") != published:
            raise ValueError(f"El respaldo existente {relative} posee una fecha incompatible.")
        schedule = stored["schedule"]
    else:
        raw = canonical_bytes(snapshot_payload(schedule, locations, routes, published))
        compressed = gzip.compress(raw, compresslevel=9, mtime=0)
        destination.write_bytes(compressed)
    return {
        "publication_date": published,
        "valid_from": published,
        "valid_until": None,
        "services": len(schedule.get("services", [])),
        "corridors": len(schedule.get("corridors", [])),
        "source_dates": source_dates(schedule),
        "snapshot": relative.as_posix(),
        "snapshot_sha256": sha256(compressed),
        "content_sha256": sha256(raw),
        "compressed_bytes": len(compressed),
        "changes": None,
    }


def day_before(iso_date: str) -> str:
    return (date.fromisoformat(iso_date) - timedelta(days=1)).isoformat()


def update_index(history_dir: Path, entries: list[dict]) -> dict:
    index_path = history_dir / "indice.json"
    existing = load(index_path) if index_path.exists() else {
        "schema_version": 1,
        "timezone": "America/Argentina/Cordoba",
        "publications": [],
    }
    publications = {
        item["publication_date"]: item for item in existing.get("publications", [])
    }
    for entry in entries:
        previous = publications.get(entry["publication_date"], {})
        merged = dict(previous)
        merged.update(entry)
        merged["changes"] = previous.get("changes")
        for field in ("changes_sha256", "summary"):
            if field in previous:
                merged[field] = previous[field]
        publications[entry["publication_date"]] = merged
    ordered = [publications[key] for key in sorted(publications)]
    for index, item in enumerate(ordered):
        item["valid_from"] = item["publication_date"]
        item["valid_until"] = day_before(ordered[index + 1]["publication_date"]) if index + 1 < len(ordered) else None
    existing["publications"] = ordered
    existing["first_available_date"] = ordered[0]["publication_date"] if ordered else None
    existing["latest_publication_date"] = ordered[-1]["publication_date"] if ordered else None
    return existing


def store_changes(history_dir: Path, changes_path: Path, index: dict) -> None:
    changes = load(changes_path)
    published = changes.get("publication_date")
    if not published:
        raise ValueError("El informe de cambios no contiene fecha de publicación.")
    relative = Path("cambios") / f"cambios-{published}.json"
    destination = history_dir / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(changes_path, destination)
    digest = sha256(destination.read_bytes())
    for entry in index["publications"]:
        if entry["publication_date"] == published:
            entry["changes"] = relative.as_posix()
            entry["changes_sha256"] = digest
            entry["summary"] = changes.get("summary", {})
            break
    else:
        raise ValueError(f"No existe una publicación histórica para {published}.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--old", type=Path, required=True)
    parser.add_argument("--new", type=Path, required=True)
    parser.add_argument("--old-locations", type=Path, required=True)
    parser.add_argument("--new-locations", type=Path, required=True)
    parser.add_argument("--routes", type=Path, required=True)
    parser.add_argument("--changes", type=Path, required=True)
    parser.add_argument("--history-dir", type=Path, required=True)
    args = parser.parse_args()

    old = load(args.old)
    new = load(args.new)
    old_date = publication_date(old)
    new_date = publication_date(new)
    if not old_date or not new_date:
        raise SystemExit("No se pudo determinar la fecha de una de las publicaciones.")
    if new_date < old_date:
        raise SystemExit(f"La publicación nueva ({new_date}) es anterior a la vigente ({old_date}).")

    args.history_dir.mkdir(parents=True, exist_ok=True)
    routes = load(args.routes)
    entries = [
        write_snapshot(args.history_dir, old, load(args.old_locations), routes, preserve_existing=True),
        write_snapshot(args.history_dir, new, load(args.new_locations), routes),
    ]
    index = update_index(args.history_dir, entries)
    store_changes(args.history_dir, args.changes, index)
    index_path = args.history_dir / "indice.json"
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "first_available_date": index["first_available_date"],
        "latest_publication_date": index["latest_publication_date"],
        "publications": len(index["publications"]),
        "backups": [entry["snapshot"] for entry in entries],
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
