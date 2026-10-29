"""Deterministic protocol and independent-validator tests with a mocked GenVM host."""
import copy
import importlib.util
import json
import sys
import types
import unittest
from pathlib import Path


class TreeMap(dict):
    @classmethod
    def __class_getitem__(cls, _):
        return cls


class Return:
    def __init__(self, value):
        self.calldata = value


gl = types.SimpleNamespace(
    Contract=object, UserError=ValueError,
    message=types.SimpleNamespace(sender_address="0x" + "a" * 40),
    public=types.SimpleNamespace(write=lambda f: f, view=lambda f: f),
    nondet=types.SimpleNamespace(), vm=types.SimpleNamespace(Return=Return))
module = types.ModuleType("genlayer")
module.gl, module.TreeMap = gl, TreeMap
module.u32 = int
sys.modules["genlayer"] = module
spec = importlib.util.spec_from_file_location("mendwind", Path(__file__).parents[1] / "contracts/mendwind.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def compiled(actions, plan="Repair the damaged object carefully."):
    return {"decision": "CLEAR", "steps": [{"action": a, "quote": plan} for a in actions]}


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        self.c = m.Mendwind()
        self.c.games, self.c.counts = {}, {}
        gl.message.sender_address = "0x" + "a" * 40
        self.id = self.c.open_workshop("afternoon")
        self.original_compile = m.compile_plan
        self.plan = "Repair the damaged object carefully."
        m.compile_plan = lambda target, plan: compiled(m.CATALOG[target]["actions"], plan)

    def tearDown(self):
        m.compile_plan = self.original_compile

    def game(self):
        return json.loads(self.c.get_game(self.id))

    def act(self, target, plan=None, aid=None):
        revision = self.game()["revision"]
        return json.loads(self.c.act(self.id, revision, aid or "action-" + str(revision), target, plan or self.plan))

    def test_three_repairs_conserve_and_win(self):
        for target in ("windmill", "glider", "postbox"):
            self.act(target)
        g = self.game()
        self.assertEqual(g["status"], "RESTORED")
        self.assertEqual(g["stock"], [0, 0, 0, 0])
        self.assertEqual(g["spent"], m.INITIAL)

    def test_owner_only(self):
        gl.message.sender_address = "0x" + "b" * 40
        with self.assertRaisesRegex(ValueError, "Only this workshop"):
            self.act("windmill")
        self.assertEqual(self.game()["revision"], 0)

    def test_revision_and_idempotency(self):
        first = self.c.act(self.id, 0, "same", "windmill", self.plan)
        self.assertEqual(first, self.c.act(self.id, 0, "same", "windmill", self.plan))
        self.assertEqual(self.game()["revision"], 1)
        with self.assertRaisesRegex(ValueError, "different input"):
            self.c.act(self.id, 0, "same", "glider", self.plan)
        with self.assertRaisesRegex(ValueError, "Stale revision"):
            self.c.act(self.id, 0, "new", "glider", self.plan)

    def test_salvage_one_way(self):
        m.compile_plan = lambda target, plan: compiled(["SALVAGE"], plan)
        self.act("windmill")
        self.assertEqual(self.game()["stock"], [2, 3, 2, 2])
        with self.assertRaisesRegex(ValueError, "resolved"):
            self.act("windmill")
        self.assertEqual(self.game()["reclaimed"], [0, 1, 0, 1])

    def test_insufficient_stock_atomic(self):
        g = self.game()
        g["stock"][0] = 0
        g["spent"][0] = 2
        self.c.games[self.id] = m.canonical(g)
        r = self.act("windmill")
        self.assertEqual(r["outcome"], "NO_MATERIAL")
        self.assertEqual(self.game()["stock"], g["stock"])
        self.assertEqual(self.game()["objects"]["windmill"]["done"], [])

    def test_repeated_operation_atomic(self):
        m.compile_plan = lambda target, plan: compiled(["PATCH_SAIL"], plan)
        self.act("windmill")
        m.compile_plan = lambda target, plan: compiled(m.CATALOG[target]["actions"], plan)
        before = self.game()["stock"]
        r = self.act("windmill")
        self.assertEqual(r["outcome"], "ALREADY_DONE")
        self.assertEqual(self.game()["stock"], before)

    def test_unsupported_and_attempt_limit(self):
        m.compile_plan = lambda target, plan: {"decision": "UNSUPPORTED", "steps": []}
        for _ in range(12):
            self.act("windmill")
        self.assertEqual(self.game()["status"], "CLOSED")
        self.assertEqual(self.game()["stock"], m.INITIAL)
        with self.assertRaisesRegex(ValueError, "closed"):
            self.act("windmill")

    def test_unclear_spends_nothing(self):
        m.compile_plan = lambda target, plan: {"decision": "UNCLEAR", "steps": []}
        r = self.act("glider")
        self.assertEqual(r["outcome"], "UNCLEAR")
        self.assertEqual(self.game()["spent"], [0, 0, 0, 0])

    def test_consensus_error_does_not_write(self):
        def fail(*_):
            raise RuntimeError("Validators disagree")
        m.compile_plan = fail
        before = self.c.get_game(self.id)
        with self.assertRaises(RuntimeError):
            self.act("windmill")
        self.assertEqual(self.c.get_game(self.id), before)

    def test_namespace_and_bounds(self):
        self.assertEqual(self.id, self.c.open_workshop("afternoon"))
        with self.assertRaises(ValueError):
            self.c.open_workshop("Invalid space")
        with self.assertRaises(ValueError):
            self.c.act(self.id, 0, "id", "windmill", "short")
        with self.assertRaises(ValueError):
            self.c.act(self.id, True, "id", "windmill", self.plan)
        with self.assertRaises(ValueError):
            self.c.act(self.id, 0, "id", "other", self.plan)

    def test_salvage_after_partial_cannot_mint_repeat(self):
        m.compile_plan = lambda target, plan: compiled(["PATCH_SAIL"], plan)
        self.act("windmill")
        m.compile_plan = lambda target, plan: compiled(["SALVAGE"], plan)
        self.act("windmill")
        g = self.game()
        for i in range(4):
            self.assertEqual(g["stock"][i] + g["spent"][i], m.INITIAL[i] + g["reclaimed"][i])


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        self.plan = "Patch the torn sail with cloth and oil the axle."
        self.good = compiled(["PATCH_SAIL", "OIL_AXLE"], self.plan)

    def test_exact_quote_and_wrong_target(self):
        bad = copy.deepcopy(self.good)
        bad["steps"][0]["quote"] = "not in the submitted plan"
        with self.assertRaises(ValueError):
            m.parse_compilation(bad, "windmill", self.plan)
        with self.assertRaises(ValueError):
            m.parse_compilation(self.good, "glider", self.plan)

    def test_no_schema_coercion_or_duplicate_operations(self):
        for raw in [None, {"decision": "CLEAR", "steps": []}, {"decision": "UNCLEAR", "steps": self.good["steps"]}, {**self.good, "score": 20}, compiled(["PATCH_SAIL", "PATCH_SAIL"], self.plan), compiled(["SALVAGE", "PATCH_SAIL"], self.plan)]:
            with self.assertRaises(ValueError):
                m.parse_compilation(raw, "windmill", self.plan)
        with self.assertRaises(ValueError):
            m.parse_compilation('{"decision":"UNCLEAR","decision":"CLEAR","steps":[]}', "windmill", self.plan)

    def test_validator_reinterprets_full_operation_set(self):
        observed = {}
        answers = iter([self.good, compiled(["PATCH_SAIL"], self.plan)])
        gl.nondet.exec_prompt = lambda *_a, **_k: next(answers)
        def run(leader, validator):
            candidate = leader()
            observed["disagreed"] = not validator(Return(candidate))
            raise RuntimeError("Rejected")
        gl.vm.run_nondet_unsafe = run
        with self.assertRaises(RuntimeError):
            m.compile_plan("windmill", self.plan)
        self.assertTrue(observed["disagreed"])

    def test_validator_accepts_same_actions_different_quote_spans(self):
        alt = copy.deepcopy(self.good)
        alt["steps"][0]["quote"] = "Patch the torn sail"
        answers = iter([self.good, alt])
        gl.nondet.exec_prompt = lambda *_a, **_k: next(answers)
        def run(leader, validator):
            candidate = leader()
            self.assertTrue(validator(Return(candidate)))
            return candidate
        gl.vm.run_nondet_unsafe = run
        self.assertEqual(m.compile_plan("windmill", self.plan)["decision"], "CLEAR")


if __name__ == "__main__":
    unittest.main()
