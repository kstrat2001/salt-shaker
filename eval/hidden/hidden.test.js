// Hidden AUTH-77 checks. One test per ticket requirement clause; the model never sees this file.
import assert from "node:assert/strict";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import * as accountsModule from "../src/accounts.ts";
import { hashPassword, verifyPassword } from "../src/passwords.ts";

const { Accounts, InvalidCredentials, WeakPassword } = accountsModule;
const PW = "correct horse battery staple";
// Filled in by eval/build_workload.py: the SHA-256 of each existing test file.
const ORIGINAL_TEST_FILES = "__ORIGINAL_TEST_FILES__";

function scryptString(password, { N = 16384, r = 8, p = 1 } = {}) {
  const salt = randomBytes(16);
  const key = scryptSync(password.normalize("NFC"), salt, 64, { N, r, p, maxmem: 256 * N * r });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

function caught(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return undefined;
}

describe("AUTH-77 hidden checks", () => {
  it("r1 hash has the scrypt format and parameters", () => {
    const parts = hashPassword(PW).split("$");
    assert.equal(parts.length, 6);
    assert.deepEqual(parts.slice(0, 4), ["scrypt", "16384", "8", "1"]);
    assert.equal(Buffer.from(parts[4], "base64").length, 16);
    assert.equal(Buffer.from(parts[5], "base64").length, 64);
  });

  it("r1 hash key is the scrypt key of the password and salt", () => {
    const [, , , , salt, key] = hashPassword(PW).split("$");
    const expected = scryptSync(PW, Buffer.from(salt, "base64"), 64, { N: 16384, r: 8, p: 1 });
    assert.equal(key, expected.toString("base64"));
  });

  it("r1 hashing the same password twice gives different salts", () => {
    const a = hashPassword(PW);
    const b = hashPassword(PW);
    assert.notEqual(a, b);
    assert.notEqual(a.split("$")[4], b.split("$")[4]);
  });

  it("r2 verify accepts the right password and refuses a wrong one", () => {
    const stored = hashPassword(PW);
    assert.equal(verifyPassword(PW, stored), true);
    assert.equal(verifyPassword(PW + "!", stored), false);
  });

  it("r2 verify returns false for malformed stored values without throwing", () => {
    for (const bad of ["", "scrypt$", "scrypt$16384$8$1$!!$!!", "plaintext", "scrypt$abc$8$1$AAAA$AAAA", "bcrypt$x"]) {
      assert.equal(verifyPassword(PW, bad), false, bad);
    }
  });

  it("r3 verify reads N, r and p from the stored string", () => {
    assert.equal(verifyPassword(PW, scryptString(PW, { N: 1024, r: 4, p: 2 })), true);
  });

  it("r4 composed and decomposed forms of a password both verify", () => {
    const composed = "caf\u00e9 au lait, s'il vous pla\u00eet";
    const decomposed = composed.normalize("NFD");
    assert.notEqual(composed, decomposed);
    assert.equal(verifyPassword(decomposed, hashPassword(composed)), true);
    assert.equal(verifyPassword(composed, hashPassword(decomposed)), true);
  });

  it("r5 register refuses short and overlong passwords and stores nothing", () => {
    const accounts = new Accounts();
    assert.ok(caught(() => accounts.register("a@example.com", "elevenchars")) instanceof WeakPassword);
    assert.ok(caught(() => accounts.register("b@example.com", "x".repeat(257))) instanceof WeakPassword);
    assert.equal(accounts.record("a@example.com"), undefined);
    assert.equal(accounts.record("b@example.com"), undefined);
    accounts.register("c@example.com", "twelve chars");
    accounts.register("d@example.com", "x".repeat(256));
  });

  it("r5 length is counted after normalization", () => {
    const accounts = new Accounts();
    // 12 characters once composed, 13 code units decomposed.
    accounts.register("a@example.com", "cafe\u0301 terrac!");
    // 11 characters composed, 12 code units decomposed.
    assert.ok(caught(() => accounts.register("b@example.com", "cafe\u0301 terra!")) instanceof WeakPassword);
  });

  it("r5 changePassword refuses a weak new password and keeps the old one", () => {
    const accounts = new Accounts();
    accounts.register("a@example.com", PW);
    assert.ok(caught(() => accounts.changePassword("a@example.com", PW, "short")) instanceof WeakPassword);
    accounts.login("a@example.com", PW);
  });

  it("r6 unknown email and wrong password throw the same InvalidCredentials", () => {
    const accounts = new Accounts();
    accounts.register("a@example.com", PW);
    const unknown = caught(() => accounts.login("nobody@example.com", PW));
    const wrong = caught(() => accounts.login("a@example.com", PW + "!"));
    assert.ok(unknown instanceof InvalidCredentials);
    assert.ok(wrong instanceof InvalidCredentials);
    assert.equal(unknown.message, wrong.message);
  });

  it("r6 changePassword with a wrong current password changes nothing", () => {
    const accounts = new Accounts();
    accounts.register("a@example.com", PW);
    const before = accounts.record("a@example.com").passwordHash;
    assert.ok(caught(() => accounts.changePassword("a@example.com", "not the password", "a brand new passphrase")) instanceof InvalidCredentials);
    assert.equal(accounts.record("a@example.com").passwordHash, before);
  });

  it("r7 a legacy sha256 user is upgraded to scrypt on a successful login", () => {
    const accounts = new Accounts();
    const legacy = `sha256$${createHash("sha256").update(PW).digest("hex")}`;
    accounts.importRecord({ email: "old@example.com", passwordHash: legacy });
    accounts.login("old@example.com", PW);
    const upgraded = accounts.record("old@example.com").passwordHash;
    assert.match(upgraded, /^scrypt\$16384\$8\$1\$/);
    assert.equal(verifyPassword(PW, upgraded), true);
    accounts.login("old@example.com", PW);
  });

  it("r7 a failed login leaves a legacy hash untouched", () => {
    const accounts = new Accounts();
    const legacy = `sha256$${createHash("sha256").update(PW).digest("hex")}`;
    accounts.importRecord({ email: "old@example.com", passwordHash: legacy });
    assert.ok(caught(() => accounts.login("old@example.com", "wrong password here")) instanceof InvalidCredentials);
    assert.equal(accounts.record("old@example.com").passwordHash, legacy);
  });

  it("r8 a weaker scrypt hash is rehashed at the current parameters", () => {
    const accounts = new Accounts();
    accounts.importRecord({ email: "a@example.com", passwordHash: scryptString(PW, { N: 1024 }) });
    accounts.login("a@example.com", PW);
    assert.match(accounts.record("a@example.com").passwordHash, /^scrypt\$16384\$8\$1\$/);
  });

  it("r9 the stored record never contains the plaintext", () => {
    const accounts = new Accounts();
    accounts.register("a@example.com", PW);
    accounts.changePassword("a@example.com", PW, "a brand new passphrase");
    const text = JSON.stringify(accounts.record("a@example.com"));
    assert.ok(!text.includes(PW));
    assert.ok(!text.includes("a brand new passphrase"));
  });
});

describe("AUTH-77 constraints", () => {
  it("existing test files are unchanged", () => {
    const changed = Object.entries(ORIGINAL_TEST_FILES).filter(([name, digest]) => {
      const path = new URL(`../${name}`, import.meta.url);
      return !existsSync(path) || createHash("sha256").update(readFileSync(path)).digest("hex") !== digest;
    });
    assert.deepEqual(changed.map(([name]) => name), [], "existing test files were changed or removed");
  });
});
