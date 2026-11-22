const DEFAULT_VAT_PERCENT = 13;

export function resolveVatPercent(value: string | undefined): number {
  if (!value) {
    return DEFAULT_VAT_PERCENT;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return DEFAULT_VAT_PERCENT;
  }

  return parsed;
}

export function getVatPercent(): number {
  return resolveVatPercent(process.env.VAT_PERCENT);
}

export function getVatRate(): number {
  return getVatPercent() / 100;
}

export function assertVatConfig(): void {
  if (process.env.VAT_PERCENT === undefined) {
    return;
  }

  const parsed = Number(process.env.VAT_PERCENT);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error("VAT_PERCENT must be a number between 0 and 100");
  }
}

export { DEFAULT_VAT_PERCENT };
