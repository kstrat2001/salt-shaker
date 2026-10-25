import { hashPassword, verifyPassword } from "./passwords.ts";

/**
 * The account service: sign-up, sign-in and password changes, over an
 * in-memory user table.
 */

export interface UserRecord {
  email: string;
  passwordHash: string;
}

export class Accounts {
  users: Map<string, UserRecord>;

  constructor() {
    this.users = new Map();
  }

  register(email: string, password: string): { email: string } {
    if (this.users.has(email)) {
      throw new Error("EMAIL_TAKEN");
    }
    this.users.set(email, { email, passwordHash: hashPassword(password) });
    return { email };
  }

  login(email: string, password: string): { email: string } {
    const user = this.users.get(email);
    if (!user) {
      throw new Error("NO_SUCH_USER");
    }
    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error("WRONG_PASSWORD");
    }
    return { email };
  }

  changePassword(email: string, currentPassword: string, newPassword: string): void {
    this.login(email, currentPassword);
    this.users.get(email)!.passwordHash = hashPassword(newPassword);
  }

  /** The stored record, as the database would hold it. */
  record(email: string): UserRecord | undefined {
    const user = this.users.get(email);
    return user ? { ...user } : undefined;
  }

  /** Load an existing record, as a migration from the old database would. */
  importRecord(record: UserRecord): void {
    this.users.set(record.email, { ...record });
  }
}
