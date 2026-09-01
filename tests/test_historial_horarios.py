import gzip
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.transporte.actualizar_historial import update_index, write_snapshot
from scripts.transporte.comparar_horarios import compare_services


def service(time, days, line="A - B"):
    hours, minutes = map(int, time.split(":"))
    return {
        "id": f"svc-{time}", "corridor": "PRUEBA", "line": line,
        "line_id": line.lower().replace(" ", "-"), "nodes": line.split(" - "),
        "direction": "I", "time": time, "minutes": hours * 60 + minutes,
        "company": "EMPRESA", "cuit": "30-00000000-0",
        "service_days_text": "DÍAS DE PRUEBA", "service_days": days,
        "modality": "REGULAR", "route": "", "source_file": "prueba.pdf", "source_page": 1,
    }


def schedule(published, services):
    return {
        "schema_version": 1, "timezone": "America/Argentina/Cordoba",
        "sources": [{"corridor": "PRUEBA", "publication_date": published}],
        "corridors": ["PRUEBA"], "services": services,
    }


class HistoryChecks(unittest.TestCase):
    def test_reconoce_modificados_sin_contarlos_como_altas_y_bajas(self):
        old = [service("08:00", [1, 2, 3]), service("12:00", [1, 2, 3]), service("18:00", [7], "C - D")]
        new = [service("08:30", [1, 2, 3]), service("12:00", [1, 2, 3]), service("20:00", [7], "E - F")]
        result = compare_services(old, new)
        self.assertEqual(result["unchanged"], 1)
        self.assertEqual([(item["before"]["time"], item["after"]["time"]) for item in result["modified"]], [("08:00", "08:30")])
        self.assertEqual([item["line"] for item in result["removed"]], ["C - D"])
        self.assertEqual([item["line"] for item in result["added"]], ["E - F"])

    def test_respaldo_gzip_es_integro_reproducible_y_autosuficiente(self):
        data = schedule("2026-08-21", [service("08:00", [1])])
        locations = {"locations": {"A": {"lat": -31.0, "lon": -64.0}}, "unresolved": ["B"]}
        routes = {"schema_version": 1, "places": {}, "profiles": [], "bindings": {}, "name_aliases": {}}
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory)
            first = write_snapshot(destination, data, locations, routes)
            first_bytes = (destination / first["snapshot"]).read_bytes()
            second = write_snapshot(destination, data, locations, routes)
            second_bytes = (destination / second["snapshot"]).read_bytes()
        self.assertEqual(first_bytes, second_bytes)
        self.assertEqual(hashlib.sha256(first_bytes).hexdigest(), first["snapshot_sha256"])
        payload = json.loads(gzip.decompress(first_bytes))
        self.assertEqual(payload["schedule"]["services"][0]["time"], "08:00")
        self.assertEqual(payload["locations"]["unresolved"], ["B"])
        self.assertEqual(payload["routes"]["schema_version"], 1)

    def test_indice_cierra_la_vigencia_el_dia_anterior(self):
        routes = {"schema_version": 1, "places": {}, "profiles": [], "bindings": {}, "name_aliases": {}}
        locations = {"locations": {}, "unresolved": []}
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory)
            old = write_snapshot(destination, schedule("2026-08-21", [service("08:00", [1])]), locations, routes)
            new = write_snapshot(destination, schedule("2026-08-28", [service("09:00", [1])]), locations, routes)
            index = update_index(destination, [old, new])
        self.assertEqual(index["first_available_date"], "2026-08-21")
        self.assertEqual(index["latest_publication_date"], "2026-08-28")
        self.assertEqual(index["publications"][0]["valid_until"], "2026-08-27")
        self.assertIsNone(index["publications"][1]["valid_until"])

    def test_indice_conserva_informes_de_publicaciones_anteriores(self):
        routes = {"schema_version": 1, "places": {}, "profiles": [], "bindings": {}, "name_aliases": {}}
        locations = {"locations": {}, "unresolved": []}
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory)
            old = write_snapshot(destination, schedule("2026-08-21", [service("08:00", [1])]), locations, routes)
            initial = update_index(destination, [old])
            initial["publications"][0].update({"changes": "cambios/uno.json", "changes_sha256": "abc", "summary": {"modified": 2}})
            (destination / "indice.json").write_text(json.dumps(initial), encoding="utf-8")
            preserved = write_snapshot(destination, schedule("2026-08-21", [service("08:00", [1])]), locations, routes, preserve_existing=True)
            new = write_snapshot(destination, schedule("2026-08-28", [service("09:00", [1])]), locations, routes)
            updated = update_index(destination, [preserved, new])
        self.assertEqual(updated["publications"][0]["changes"], "cambios/uno.json")
        self.assertEqual(updated["publications"][0]["changes_sha256"], "abc")
        self.assertEqual(updated["publications"][0]["summary"], {"modified": 2})


if __name__ == "__main__":
    unittest.main()
