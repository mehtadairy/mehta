import { NextResponse } from 'next/server';

export function isUnresolvedVariable(value: any): boolean {
  if (typeof value === 'string' && value.trim().startsWith('$')) {
    return true;
  }
  return false;
}

export function isTestModeRequest(body: any): boolean {
  if (!body || typeof body !== 'object') return false;
  for (const key of Object.keys(body)) {
    const val = body[key];
    if (typeof val === 'string' && val.trim().startsWith('$')) {
      return true;
    }
    if (val && typeof val === 'object') {
      if (isTestModeRequest(val)) return true;
    }
  }
  return false;
}

export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return regex.test(uuid);
}

export function validateAiSensyBody(body: any, fields: string[]): NextResponse | null {
  for (const field of fields) {
    const val = body[field];
    if (isUnresolvedVariable(val)) {
      const errRes = {
        success: false,
        step: "attribute_validation",
        message: "AiSensy variable was not resolved. This request was likely sent using the API Test button instead of a live WhatsApp flow.",
        field: field
      };
      console.log(`[Validation] Detected unresolved AiSensy variable: ${field}`);
      return NextResponse.json(errRes, { status: 400 });
    }
  }
  return null;
}

export function validateCustomerId(customerId: any): NextResponse | null {
  if (!customerId || isUnresolvedVariable(customerId) || typeof customerId !== 'string' || !isValidUUID(customerId)) {
    const errRes = {
      success: false,
      step: "customer_validation",
      message: "Invalid or unresolved customerId."
    };
    console.log(`[Validation] Invalid or unresolved customerId: ${customerId}`);
    return NextResponse.json(errRes, { status: 400 });
  }
  return null;
}
