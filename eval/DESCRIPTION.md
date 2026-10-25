# A leaked password table, cracked overnight

Every service that stores passwords will one day face the question of what happens if its user table leaks. With a fast unsalted hash like SHA-1 or SHA-256, an attacker with a GPU recovers most passwords within days, and identical passwords show up as identical hashes, so one crack unlocks every account that shares it. The fix is old and well known: a slow hash with a fresh random salt per password. The hard parts are the edges. Existing users still have the old hashes, the work factor has to be raisable later, the sign-in error must not reveal which emails have accounts, and the plaintext must never be stored anywhere.

## Real-world incidents

- **LinkedIn, 2012 (sold in 2016).** Password hashes were unsalted SHA-1. When the full dump surfaced four years later, it held about 117 million emails with password hashes, and LinkedIn confirmed it was real ([Vice](https://www.vice.com/en/article/another-day-another-hack-117-million-linkedin-emails-and-password/)).
- **Facebook, disclosed March 2019.** Internal applications had logged hundreds of millions of user passwords in plain text since 2012, searchable by thousands of employees ([KrebsOnSecurity](https://krebsonsecurity.com/2019/03/facebook-stored-hundreds-of-millions-of-user-passwords-in-plain-text-for-years/)).

## How the eval shows a model knows the fix

The model implements ticket AUTH-77, moving an account service from unsalted SHA-256 to salted scrypt. After the run, hidden checks look at what the ticket asks for:
- the hash format and a fresh salt per call
- verification that reads its parameters from the stored hash and never throws
- Unicode normalization
- password length limits
- one error for unknown emails and wrong passwords
- upgrading legacy and weaker hashes on a successful sign-in only
- no plaintext in the stored record

A model that only swaps the hash function passes its own tests and fails these.

Results claim only that a model's implementation passed these checks, not that any code or model is secure.
