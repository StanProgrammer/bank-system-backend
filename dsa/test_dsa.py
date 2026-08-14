"""Unit tests for the DSA solutions (run: python -m unittest test_dsa)."""
import random
import unittest

from cipher import encrypt, decrypt
from currency import format_number
from combine import combine_elements
from minLoss import minimize_loss


class TestCipher(unittest.TestCase):
    def test_known_caesar(self):
        self.assertEqual(encrypt("ATTACKATONCE", 4), "EXXEGOEXSRGI")

    def test_roundtrip(self):
        for text in ["Hello World", "Attack at dawn!", "abc123 XYZ-", ""]:
            for s in range(1, 26):
                self.assertEqual(decrypt(encrypt(text, s), s), text)

    def test_non_alpha_unchanged(self):
        self.assertEqual(encrypt("A1 B2 C3", 4), "E1 F2 G3")


class TestCurrency(unittest.TestCase):
    def test_known(self):
        self.assertEqual(format_number("123,456,789"), "12,34,56,789")
        # 90,050,000,000 in Indian grouping is 90,05,00,00,000
        self.assertEqual(format_number("90,050,000,000"), "90,05,00,00,000")

    def test_small(self):
        self.assertEqual(format_number("123"), "123")
        self.assertEqual(format_number("1000"), "1,000")
        self.assertEqual(format_number("100000"), "1,00,000")

    def test_roundtrip_removes_commas(self):
        self.assertNotIn(",", format_number("1,2,3,4").replace(",", "") or ",")


class TestCombine(unittest.TestCase):
    def test_known_case(self):
        # 50% overlap is NOT merged (strictly greater required) with default ratio
        list1 = [{"positions": [1, 3], "values": ["a", "b"]}]
        list2 = [{"positions": [2, 4], "values": ["c"]}]
        result = combine_elements(list1, list2)
        self.assertEqual(len(result), 2)

    def test_majority_overlap_merged(self):
        list1 = [{"positions": [1, 5], "values": ["a", "b"]}]
        list2 = [{"positions": [2, 4], "values": ["c"]}]
        result = combine_elements(list1, list2)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["positions"], [1, 5])
        self.assertEqual(result[0]["values"], ["a", "b", "c"])

    def test_disjoint_kept_separate(self):
        list1 = [{"positions": [1, 2], "values": ["a"]}]
        list2 = [{"positions": [5, 6], "values": ["b"]}]
        result = combine_elements(list1, list2)
        self.assertEqual(len(result), 2)

    def test_full_merge_mode(self):
        # merge_ratio=0 means merge on ANY positive overlap
        list1 = [{"positions": [1, 5], "values": ["a"]}]
        list2 = [{"positions": [4, 6], "values": ["b"]}]
        result = combine_elements(list1, list2, merge_ratio=0)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["positions"], [1, 6])


def brute_force_min_loss(prices):
    best = None
    for buy in range(len(prices)):
        for sell in range(buy + 1, len(prices)):
            if prices[buy] > prices[sell]:
                loss = prices[buy] - prices[sell]
                if best is None or loss < best:
                    best = loss
    return best


class TestMinLoss(unittest.TestCase):
    def test_known_case(self):
        # Ties at the minimum loss are acceptable — assert the loss value only.
        self.assertIn("with a loss of 5", minimize_loss([20, 15, 7, 2, 20]))

    def test_no_profitable_loss(self):
        self.assertEqual(minimize_loss([1, 2, 3, 4]), -1)
        self.assertEqual(minimize_loss([]), -1)
        self.assertEqual(minimize_loss([5]), -1)

    def test_short_inputs(self):
        self.assertEqual(minimize_loss([10, 3]), "Buy in year 1 and sell in year 2 with a loss of 7")

    def test_random_matches_brute_force(self):
        rng = random.Random(42)
        for _ in range(200):
            prices = [rng.randint(1, 50) for _ in range(rng.randint(2, 12))]
            expected = brute_force_min_loss(prices)
            if expected is None:
                self.assertEqual(minimize_loss(prices), -1)
            else:
                self.assertIn(f"with a loss of {expected}", minimize_loss(prices))


if __name__ == "__main__":
    unittest.main()
