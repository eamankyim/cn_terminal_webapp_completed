export const CHARGE_FIELDS = [
  ['customDuty', 'Custom duty'], ['shippingCharges', 'Shipping charges'],
  ['terminalCharges', 'Terminal charges'], ['miscellaneous', 'Miscellaneous'],
  ['clearanceCharges', 'Clearance charges'], ['serviceCharge', 'Service charge'],
] as const;
export type ChargeKey = typeof CHARGE_FIELDS[number][0];
export type ChargeValues = Record<ChargeKey, string>;
export const emptyCharges = (): ChargeValues => Object.fromEntries(CHARGE_FIELDS.map(([key]) => [key, ''])) as ChargeValues;
/** Same total-charge VAT formula used by the active web InvoicesPage. */
export function calculateInvoiceCharges(values: ChargeValues, vatRate: number) {
  const charges = Object.fromEntries(CHARGE_FIELDS.map(([key]) => [key, Number(values[key] || 0)])) as Record<ChargeKey, number>;
  if (Object.values(charges).some(v => !Number.isFinite(v) || v < 0) || !Number.isFinite(vatRate) || vatRate < 0) throw new Error('Charges and VAT rate must be valid non-negative numbers.');
  const subtotal = Object.values(charges).reduce((sum, n) => sum + n, 0);
  const vat = Math.round(subtotal * vatRate) / 100;
  return { charges: { ...charges, vat }, amount: Math.round((subtotal + vat) * 100) / 100 };
}
