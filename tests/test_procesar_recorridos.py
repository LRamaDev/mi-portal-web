"""Controles de procedencia y del cruce; no requieren paquetes externos."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("recorridos", ROOT / "scripts/transporte/procesar_recorridos.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
DATA = json.loads((ROOT / "app-transporte/data/recorridos.json").read_text())


class RouteChecks(unittest.TestCase):
    def test_all_source_rows_accounted_for(self):
        rows = []
        for p in DATA["profiles"]:
            rows.extend((p["source_sheet"], r) for r in p["source_rows"])
            for other in p["duplicate_source_rows"]:
                rows.extend((p["source_sheet"], r) for r in other)
        rows.extend((r["sheet"], r["row"]) for r in DATA["audit"]["incomplete_rows"])
        self.assertEqual(len(rows), DATA["stats"]["source_rows"])
        self.assertEqual(len(rows), len(set(rows)))

    def test_bindings_never_reference_flagged_profiles(self):
        profiles = {p["id"]: p for p in DATA["profiles"]}
        for pid in DATA["bindings"].values():
            self.assertEqual(profiles[pid]["issues"], [])
            self.assertTrue(profiles[pid]["cuit"])

    def test_reference_departure_times_are_not_exported(self):
        for profile in DATA["profiles"]:
            self.assertNotIn("time", profile)
            self.assertNotIn("reference_time", profile)

    def test_consecutive_duplicates_are_preserved_but_flagged(self):
        found = 0
        for p in DATA["profiles"]:
            for a, b in zip(p["stops"], p["stops"][1:]):
                if a["place_id"] == b["place_id"]:
                    found += 1
                    self.assertTrue(any("consecutiva repetida" in issue for issue in p["issues"]))
        self.assertGreater(found, 0)

    def test_route_abbreviations(self):
        self.assertTrue(MODULE.hint_matches("E53", "POR E-53"))
        self.assertTrue(MODULE.hint_matches("R36", "POR RUTA 36"))
        self.assertTrue(MODULE.hint_matches("PADRE LUCHESE", "POR PADRE LUCHESSE - AEROPUERTO"))
        self.assertFalse(MODULE.hint_matches("DONATO ALVAREZ", "POR PADRE LUCHESSE - AEROPUERTO"))

    def test_explicit_no_pass_through_wins_over_reference_route(self):
        profile = {"line": "CORDOBA - VILLA DOLORES", "stops": [{"place_id": "a"}, {"place_id": "b"}]}
        places = {"a": {"name": "CORDOBA", "aliases": []}, "b": {"name": "VILLA CARLOS PAZ", "aliases": []}}
        self.assertFalse(MODULE.route_compatible({"route": "POR ALTAS CUMBRES (NO TOCA C. PAZ)"}, profile, places))
        self.assertFalse(MODULE.route_compatible({"route": "REFUERZO DESDE CPC DE ARGUELLO"}, profile, places))

    def test_invalid_travel_time_is_not_a_valid_duration(self):
        self.assertIsNone(MODULE.minutes(-0.01))
        self.assertIsNone(MODULE.minutes(None))
        self.assertEqual(MODULE.minutes(1/24), 60)


if __name__ == "__main__":
    unittest.main()
