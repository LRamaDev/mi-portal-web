import importlib.util
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "transporte" / "generar_trazados_orientativos.py"
SPEC = importlib.util.spec_from_file_location("trazados", SCRIPT)
trazados = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(trazados)


def profile_fixture():
    places = {
        "a": {"id": "a", "name": "A", "lat": -31.4, "lon": -64.2},
        "b": {"id": "b", "name": "B", "lat": -31.5, "lon": -64.2},
        "c": {"id": "c", "name": "C", "lat": -31.6, "lon": -64.2},
    }
    profile = {
        "id": "p",
        "stops": [
            {"place_id": "a", "arrival_offset": 0, "departure_offset": 0},
            {"place_id": "b", "arrival_offset": 15, "departure_offset": 15},
            {"place_id": "c", "arrival_offset": 30, "departure_offset": 30},
        ],
    }
    return profile, places


class TraceChecks(unittest.TestCase):
    def test_auditoria_rechaza_un_homonimo_muy_lejano(self):
        profile, places = profile_fixture()
        places["b"].update(lat=-33.5, lon=-62.0)
        warnings = trazados.coordinate_audit(profile, places)
        self.assertTrue(warnings)
        self.assertEqual(warnings[0]["from_place_id"], "a")
        self.assertGreater(warnings[0]["implied_speed_kmh"], 200)

    def test_cuarentena_el_punto_central_de_dos_saltos_criticos(self):
        profile, places = profile_fixture()
        places["b"].update(lat=-33.5, lon=-62.0)
        candidates = trazados.quarantine_candidates(profile, places)
        self.assertEqual([item["place_id"] for item in candidates], ["b"])
        self.assertEqual(trazados.profile_unsafe_places(profile, places), ["b"])

    def test_conflicto_ambiguo_aparta_ambos_extremos_del_perfil(self):
        profile, places = profile_fixture()
        profile["stops"] = profile["stops"][:2]
        places["b"].update(lat=-33.5, lon=-62.0)
        self.assertEqual(trazados.profile_unsafe_places(profile, places), ["a", "b"])

    def test_simplificacion_conserva_extremos_y_curva(self):
        points = [[-64.0, -31.0], [-64.0001, -31.0001], [-64.01, -31.02], [-64.0, -31.04]]
        simplified = trazados.simplify(points, tolerance_m=20)
        self.assertEqual(simplified[0], points[0])
        self.assertEqual(simplified[-1], points[-1])
        self.assertGreaterEqual(len(simplified), 3)

    def test_trazado_guarda_un_tramo_por_par_de_paradas(self):
        profile, places = profile_fixture()
        route = {
            "distance": 24000,
            "duration": 1800,
            "legs": [
                {"distance": 12000, "duration": 900, "steps": [{"geometry": {"coordinates": [[-64.2, -31.4], [-64.2, -31.5]]}}]},
                {"distance": 12000, "duration": 900, "steps": [{"geometry": {"coordinates": [[-64.2, -31.5], [-64.2, -31.6]]}}]},
            ],
        }
        result = trazados.make_profile_trace(profile, places, route)
        self.assertEqual(result["status"], "orientative")
        self.assertEqual(len(result["segments"]), 2)
        self.assertEqual(result["segments"][0]["from_index"], 0)
        self.assertEqual(result["segments"][1]["to_index"], 2)
        self.assertTrue(trazados.reusable_trace(profile, places, result))
        places["b"]["lat"] = -31.51
        self.assertFalse(trazados.reusable_trace(profile, places, result))

    def test_piloto_publicado_cubre_un_perfil_por_corredor(self):
        routes = json.loads((ROOT / "app-transporte" / "data" / "recorridos.json").read_text(encoding="utf-8"))
        traces = json.loads((ROOT / "app-transporte" / "data" / "trazados.json").read_text(encoding="utf-8"))
        profiles = {profile["id"]: profile for profile in routes["profiles"]}
        corridors = {profiles[profile_id]["corridor"] for profile_id in traces["profiles"]}
        self.assertEqual(corridors, set(routes["stats"]["by_corridor"]))
        self.assertEqual(traces["stats"]["routed_profiles"], 8)
        self.assertIn("loc-1683", {item["place_id"] for item in traces["audit"]["quarantined_places"]})
        altas_cumbres = next(item for item in traces["audit"]["coordinate_warnings"] if item["profile_id"] == "rec-e6215b5d2a0125ac")
        self.assertEqual(set(altas_cumbres["unsafe_place_ids"]), {"loc-124", "loc-389"})
        for profile_id, trace in traces["profiles"].items():
            self.assertIn(profile_id, profiles)
            self.assertTrue(trace["segments"])
            for segment in trace["segments"]:
                self.assertLess(segment["from_index"], segment["to_index"])
                self.assertGreaterEqual(len(segment["coordinates"]), 2)
                self.assertTrue(all(-180 <= point[0] <= 180 and -90 <= point[1] <= 90 for point in segment["coordinates"]))


if __name__ == "__main__":
    unittest.main()
