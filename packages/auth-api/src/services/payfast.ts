import crypto from 'crypto';

// PayFast sandbox and production URLs
const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
const PAYFAST_LIVE_URL = 'https://www.payfast.co.za/eng/process';

// PayFast valid server IPs (for ITN validation)
const PAYFAST_VALID_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '197.97.145.148',
  '197.97.145.149',
  '197.97.145.150',
  '197.97.145.151',
  '41.74.179.194',
  '41.74.179.195',
  '41.74.179.196',
  '41.74.179.197',
  '41.74.179.198',
  '41.74.179.199',
  '41.74.179.200',
  '41.74.179.201',
  '41.74.179.202',
  '41.74.179.203',
  '41.74.179.204',
  '41.74.179.205',
  '41.74.179.206',
  '41.74.179.207',
  '41.74.179.208',
  '41.74.179.209',
  '41.74.179.210',
  '41.74.179.211',
  '41.74.179.212',
  '41.74.179.213',
  '41.74.179.214',
  '41.74.179.215',
  '41.74.179.216',
  '41.74.179.217',
  '41.74.179.218',
  '41.74.179.219',
  '41.74.179.220',
  '41.74.179.221',
  '41.74.179.222',
];

export function getPayFastUrl(): string {
  return process.env.PAYFAST_SANDBOX === 'true' ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;
}

export function getPayFastValidateUrl(): string {
  const base = process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://sandbox.payfast.co.za'
    : 'https://www.payfast.co.za';
  return `${base}/eng/query/validate`;
}

/**
 * Generate PayFast signature (MD5 hash of URL-encoded param string).
 * PayFast requires params sorted in a specific order and passphrase appended.
 */
export function generateSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  // Build param string from the data (order matters — use insertion order)
  const params = Object.entries(data)
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, '+')}`)
    .join('&');

  const signatureString = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}` : params;
  return crypto.createHash('md5').update(signatureString).digest('hex');
}

/**
 * Validate ITN signature matches the data received.
 */
export function validateItnSignature(
  body: Record<string, string>,
  passphrase: string
): boolean {
  const receivedSignature = body.signature;
  if (!receivedSignature) return false;

  // Build param string from all body fields except signature
  const params = Object.entries(body)
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${encodeURIComponent((v || '').trim()).replace(/%20/g, '+')}`)
    .join('&');

  const signatureString = passphrase
    ? `${params}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`
    : params;

  const calculated = crypto.createHash('md5').update(signatureString).digest('hex');
  return calculated === receivedSignature;
}

/**
 * Validate that the ITN request came from a valid PayFast IP.
 */
export function validateItnServerIp(ip: string): boolean {
  // In sandbox mode, skip IP validation
  if (process.env.PAYFAST_SANDBOX === 'true') return true;

  // Handle IPv6 mapped IPv4 addresses
  const cleanIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
  return PAYFAST_VALID_IPS.includes(cleanIp);
}

/**
 * Confirm payment with PayFast by POSTing the ITN data back.
 */
export async function confirmPaymentWithPayFast(
  pfParamString: string
): Promise<boolean> {
  try {
    const response = await fetch(getPayFastValidateUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: pfParamString,
    });
    const text = await response.text();
    return text.trim() === 'VALID';
  } catch {
    return false;
  }
}

export interface CheckoutParams {
  userId: string;
  email: string;
  firstName: string;
  product: string;
  plan: string;
  subscriptionId: string;
  amountCents: number;
  itemName: string;
  paymentId: string;
}

/**
 * Build the full PayFast subscription form data for checkout redirect.
 */
export function buildCheckoutPayload(params: CheckoutParams): Record<string, string> {
  const merchantId = process.env.PAYFAST_MERCHANT_ID || '';
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY || '';
  const passphrase = process.env.PAYFAST_PASSPHRASE || '';
  const returnUrl = process.env.PAYFAST_RETURN_URL || 'https://behivez.co.za/#/payment/success';
  const cancelUrl = process.env.PAYFAST_CANCEL_URL || 'https://behivez.co.za/#/payment/cancel';
  const notifyUrl = process.env.PAYFAST_NOTIFY_URL || 'https://behivez.co.za/payments/itn';

  const amountRands = (params.amountCents / 100).toFixed(2);

  // PayFast requires fields in a specific order for signature
  const data: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: params.firstName,
    email_address: params.email,
    m_payment_id: params.paymentId,
    amount: amountRands,
    item_name: params.itemName,
    item_description: `${params.plan} plan for ${params.product}`,
    subscription_type: '1',
    billing_date: new Date().toISOString().split('T')[0],
    recurring_amount: amountRands,
    frequency: '3', // monthly
    cycles: '0', // indefinite
    custom_str1: params.userId,
    custom_str2: params.product,
    custom_str3: params.plan,
    custom_str4: params.subscriptionId,
    custom_str5: params.paymentId,
  };

  // Generate and append signature
  data.signature = generateSignature(data, passphrase);

  return data;
}
