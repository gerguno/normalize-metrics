#!/usr/bin/env python3
"""ADR 0003 worked checks for target_line_box."""

import unittest

from engine import target_line_box, units_percent


class TargetLineBoxTest(unittest.TestCase):
    def test_america_centers_inside_old_content_no_invented_gap(self):
        ascent, descent, gap = target_line_box(710, 239, 1005, -200, 0)
        self.assertEqual(ascent + abs(descent), 1205)
        self.assertEqual(gap, 0)
        self.assertAlmostEqual(ascent - 710, abs(descent), delta=1)

    def test_ritma_spends_existing_table_gap(self):
        self.assertEqual(target_line_box(700, 229, 755, -245, 234), (929, -229, 76))

    def test_unica_grows_when_no_budget(self):
        self.assertEqual(target_line_box(726, 255, 750, -250, 0), (981, -255, 0))

    def test_does_not_invent_gap_when_content_already_fits(self):
        self.assertEqual(target_line_box(710, 239, 1005, -200, 0)[2], 0)

    def test_units_percent_matches_css_overrides(self):
        self.assertEqual(units_percent(750, 1000), 75.0)
        self.assertEqual(units_percent(-255, 1000), 25.5)
        self.assertEqual(units_percent(1005, 1000), 100.5)
        self.assertEqual(units_percent(929, 1000), 92.9)


if __name__ == "__main__":
    unittest.main()
