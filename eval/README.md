# How salt-shaker is graded

This folder is never copied into the model's sandbox. `workloads/salt-shaker.json`
holds the prompt and the grading rules; each rule quotes the prompt sentence it grades.
`DESCRIPTION.md` is the eval's public write-up: the attack and the incidents it comes from.

The suite check runs the result's own tests plus the hidden checks in
`hidden/hidden.test.js`, one or more per numbered requirement of ticket
AUTH-77 (test names start with `r<n>`). The grader runs the suite command in a
copy of the result, where this folder does not exist, so `build_workload.py`
embeds the hidden tests in the command. After editing them, run
`python3 eval/build_workload.py`.

A run passes when every test, the model's and the hidden ones, is green, the
model added tests, the suite still passes from a different path, and the reply
is present. Scope is not graded, since the ticket requires source changes.
`timingSafeEqual` is in the ticket but not graded: no behavioral test can observe it.

The sandbox and the grader run in `node:24-slim`, pinned by digest in the
workload's `image`, not in darkmux's default image (Node 20, which cannot run
`.ts` files). Bump the digest as a new fixture version.

The untouched fixture passes 3 of the 16 hidden checks. A reference
implementation passes all of them. Implementations that each miss one thing
fail the matching checks:
- a fixed salt
- no upgrade on sign-in
- length counted in UTF-16 code units
- hard-coded scrypt parameters

Results claim only that a model's implementation passed these checks. They do
not claim the code, or any model, is secure.
