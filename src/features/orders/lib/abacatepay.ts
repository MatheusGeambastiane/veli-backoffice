const ABACATEPAY_CHARGE_ID = /^(?:bill|char|pix_char|card)_[A-Za-z0-9_-]+$/;
const STRIPE_PAYMENT_INTENT_ID = /^pi_[A-Za-z0-9_]+$/;

export function isAbacatePayChargeId(value: string) {
  return ABACATEPAY_CHARGE_ID.test(value.trim());
}

export function isStripePaymentIntentId(value: string) {
  return STRIPE_PAYMENT_INTENT_ID.test(value.trim());
}
