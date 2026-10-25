TICKET AUTH-77 — Store passwords with salted scrypt

## Background

The account service stores every password as unsalted SHA-256. One leaked database would let anyone with a GPU recover most passwords within days, and identical passwords show up as identical hashes. This ticket moves new and changed passwords to salted scrypt and upgrades existing users as they sign in.

The code lives at:

- ${SANDBOX_DIR}/src/passwords.ts (hashing and verification)
- ${SANDBOX_DIR}/src/accounts.ts (sign-up, sign-in, password changes)

Existing tests:

- ${SANDBOX_DIR}/test/accounts.test.ts
- ${SANDBOX_DIR}/test/portability.test.ts (a guard on the suite itself; leave it alone)

## Requirements

1. `hashPassword(password)` in `src/passwords.ts` returns `scrypt$<N>$<r>$<p>$<salt>$<hash>`: N = 16384, r = 8, p = 1, `<salt>` is 16 random bytes generated fresh for every call, `<hash>` is the 64-byte scrypt key, both base64. Hashing the same password twice gives two different strings.
2. `verifyPassword(password, stored)` returns `true` when the password matches a `scrypt$` string and `false` otherwise. It never throws: a malformed or unknown stored value returns `false`. Compare the keys with `crypto.timingSafeEqual`.
3. `verifyPassword` reads N, r and p from the stored string, so a hash made with other parameters still verifies.
4. Passwords are normalized to Unicode NFC before hashing and before verifying, so the same password typed as composed or decomposed characters is accepted.
5. Export `WeakPassword` (an `Error` subclass) from `src/accounts.ts`. `register` and `changePassword` throw it when the new password is shorter than 12 or longer than 256 characters, counted after normalization. Nothing is stored when they throw.
6. Export `InvalidCredentials` (an `Error` subclass) from `src/accounts.ts`. `login` throws it, with the same message, for an unknown email and for a wrong password, so a caller cannot tell which accounts exist. `changePassword` with a wrong current password throws it too, and changes nothing.
7. Existing users keep their `sha256$<hex>` hashes until they sign in. A successful `login` with a `sha256$` hash replaces it with a fresh `scrypt$` hash of the same password. A failed `login` leaves the stored hash untouched.
8. A successful `login` with a `scrypt$` hash whose N is below 16384 also replaces it with a fresh hash at the current parameters.
9. The stored record never contains the plaintext password, in any field.

## Constraints

- Repo root: ${SANDBOX_DIR}.
- Use only Node's standard library (`node:crypto` has `scryptSync`, `randomBytes` and `timingSafeEqual`). There is no install step.
- This is TypeScript that Node runs directly, with no build step: Node strips the types. Use only syntax that can be stripped (no `enum`, `namespace` or constructor parameter properties) and import local files with their `.ts` extension. There is no type checker in this environment.
- Do not modify `test/portability.test.ts`. Add tests for the new behavior; tests must not embed absolute paths.
- Iterate by running the suite:
  cd ${SANDBOX_DIR} && npm test
- Final verification is the same command:
  cd ${SANDBOX_DIR} && npm test

## When you're done

You're done when every requirement above is implemented and covered by a test, and `npm test` is green.

## Reply format

Keep it tight:

- What you changed: files and a one-line summary each
- Requirements: one line per numbered requirement, saying where it is handled
- Tests: how many you added, and the `# pass N` line from your final run
- Anything in the ticket you found ambiguous, and how you read it
