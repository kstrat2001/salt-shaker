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

## Using it as a darkmux fixture

`eval/` holds the darkmux workload (`eval/workloads/salt-shaker.json`) and the
hidden checks, and pins the Node 24 image the model works in and the grader
runs in. `eval/` is never copied into the model's sandbox.

```bash
darkmux lab fixture register /path/to/salt-shaker
darkmux lab run salt-shaker -p <profile>
```

## License

MIT. See `LICENSE`.
