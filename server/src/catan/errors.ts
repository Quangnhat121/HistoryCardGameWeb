import type { CatanErrorCode } from "./types";

export class CatanRuleError extends Error {
  constructor(public readonly code: CatanErrorCode, message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = "CatanRuleError";
  }
}

export const ruleError = (code: CatanErrorCode, message: string, details?: Record<string, unknown>): never => {
  throw new CatanRuleError(code, message, details);
};
