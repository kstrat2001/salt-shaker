import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { Accounts } from "../src/accounts.ts";

let accounts: Accounts;
beforeEach(() => {
  accounts = new Accounts();
});

describe("Accounts", () => {
  it("signs in with the password it was registered with", () => {
    accounts.register("ana@example.com", "correct horse battery staple");
    assert.deepEqual(accounts.login("ana@example.com", "correct horse battery staple"), {
      email: "ana@example.com",
    });
  });

  it("refuses a second account with the same email", () => {
    accounts.register("ana@example.com", "correct horse battery staple");
    assert.throws(() => accounts.register("ana@example.com", "another long password"));
  });

  it("refuses the wrong password", () => {
    accounts.register("ana@example.com", "correct horse battery staple");
    assert.throws(() => accounts.login("ana@example.com", "wrong horse battery staple"));
  });

  it("signs in with the new password after a change", () => {
    accounts.register("ana@example.com", "correct horse battery staple");
    accounts.changePassword("ana@example.com", "correct horse battery staple", "a brand new passphrase");
    assert.deepEqual(accounts.login("ana@example.com", "a brand new passphrase"), {
      email: "ana@example.com",
    });
  });

  it("stores a hash, not the password", () => {
    accounts.register("ana@example.com", "correct horse battery staple");
    assert.notEqual(accounts.record("ana@example.com").passwordHash, "correct horse battery staple");
  });
});
