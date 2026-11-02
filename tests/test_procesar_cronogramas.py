import unittest

from scripts.transporte.procesar_cronogramas import (
    ROW_RE,
    normalize_route,
    normalize_time,
    parse_pdf_metadata_date,
)


class ScheduleParserChecks(unittest.TestCase):
    def test_acepta_punto_y_coma_como_separador_horario_del_pdf(self):
        line = (
            "ESTE-SUDESTE VILLA MARÍA - SAIRA V 18;45 CRU BUS "
            "30-70991278-6 DOMINGO REGULAR COMÚN"
        )
        match = ROW_RE.match(line)
        self.assertIsNotNone(match)
        self.assertEqual(normalize_time(match.group(4)), "18:45")

    def test_acepta_empresa_pegada_al_cuit_en_pdf_punilla(self):
        line = (
            "PUNILLA       VILLA DE SOTO - TUCLAME               I        06:50    "
            "EMPRESA SARMIENTO S.R.L.30-70730781-8 JUEVES                   REGULAR COMÚN"
        )
        match = ROW_RE.match(line)
        self.assertIsNotNone(match)
        self.assertEqual(match.group(5), "EMPRESA SARMIENTO S.R.L.")
        self.assertEqual(match.group(6), "30-70730781-8")
        self.assertEqual(match.group(7), "JUEVES")
        self.assertEqual(match.group(8), "REGULAR COMÚN")

    def test_recupera_fecha_desde_metadatos_si_el_panel_renombra_el_pdf(self):
        self.assertEqual(parse_pdf_metadata_date("D:20260828121020-03'00'"), "2026-08-28")

    def test_recompone_chazon_si_el_pdf_corta_la_palabra(self):
        self.assertEqual(normalize_route("RP 4, RP 11 (POR CH AZÓN)"), "RP 4, RP 11 (POR CHAZÓN)")


if __name__ == "__main__":
    unittest.main()
