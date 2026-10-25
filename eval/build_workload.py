"""Regenerate the suite command in workloads/salt-shaker.json from hidden/.

The grader runs the suite command inside a copy of the result, where this
folder does not exist, so the hidden tests travel inside the command itself.
Edit hidden/hidden.test.js, then run: python3 eval/build_workload.py
"""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
hidden = (HERE / "hidden" / "hidden.test.js").read_text()
assert "DARKMUX_HIDDEN" not in hidden
command = (
    "mkdir -p .darkmux_hidden && cat > .darkmux_hidden/auth77.test.js <<'DARKMUX_HIDDEN'\n"
    + hidden
    + "DARKMUX_HIDDEN\n"
    + "node --test --test-reporter=junit --test-reporter-destination=${REPORT} test/*.test.ts .darkmux_hidden/*.test.js\n"
)

path = HERE / "workloads" / "salt-shaker.json"
doc = json.loads(path.read_text())
doc["workload"]["verify"]["grade"]["suite"]["command"] = command
path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print(f"updated {path.name}: suite command is {len(command)} bytes")
