# salt-shaker

A self-contained fixture for exercising coding agents on security-sensitive
code. It is a test subject, not a library: do not use it to store real
passwords. The subject is a small account service (sign-up, sign-in, password
changes) that still stores passwords the way it did on day one, and a ticket
that asks to move it to salted scrypt without locking anyone out.

## The task

`TASK.md` is the prompt an agent receives, verbatim: ticket AUTH-77. It
names every function and error the change needs. `${SANDBOX_DIR}` is
substituted with the repo root at dispatch time.

## How it is graded

The grader runs the agent's tests together with checks the model never sees,
each tied to a numbered requirement of the ticket. Those checks and the rest
of the grading rules are in `eval/`.

Results claim only that a model's implementation passed these checks. They do
not claim the code, or any model, is secure.

## Running

```bash
npm test          # 7 passing, no install step, no dependencies
```

TypeScript, run directly by Node 22.18 or newer (Node strips the types; no
build step). The suite uses Node's built-in test runner. `tsconfig.json` is
there for editors and `tsc --noEmit`; nothing needs it to run.

## At a glance

| | |
| --- | --- |
| Kind | Coding with tools: the model edits and runs a sandboxed copy of this repo, without `eval/` |
| Version | 1.3 (tag `1.3`, commit `71acd9a`) |
| Criteria | 9, each recorded as met or missed on every run |
| Results | [evals.darkmux.com/evals/salt-shaker](https://evals.darkmux.com/evals/salt-shaker) |
| Needs | darkmux 5.9.0 or later |
| License | MIT |

The eval's page on evals.darkmux.com names the approved commit, lists the
criteria and shows which ones each run met. They are not listed in this file
because this file is inside the model's sandbox.

## Run it with darkmux

```bash
git clone https://github.com/kstrat2001/salt-shaker
cd salt-shaker
git checkout <approved commit>     # named on the eval's page
darkmux lab fixture register .
darkmux lab run salt-shaker -p <profile>
darkmux run inspect <run id>       # the verdict, time and turns
```

Leave the checkout unchanged: a run from any other commit, or from a checkout
with changes in it, cannot be shared. To share a run on evals.darkmux.com, run
`darkmux lab submit <run id> --dry-run` to see exactly what would be sent, then
`darkmux lab submit <run id>`. The
[share-runs guide](https://darkmux.com/guide/share-runs.html) covers upload
access and what a bundle carries.

## What `eval/` holds

`eval/` holds the darkmux workload (`eval/workloads/salt-shaker.json`) and the
hidden checks, and pins the Node 24 image the model works in and the grader
runs in. `eval/` is never copied into the model's sandbox.

## License

MIT. See `LICENSE`.
