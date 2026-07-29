import { NextResponse } from 'next/server';
import { checkShiprocketServiceability } from '@/lib/services/shiprocket/serviceability';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pincode, weightInKg, isCod, subtotal, length, breadth, height } = body || {};

    if (!pincode) {
      return NextResponse.json({ success: false, error: 'Pincode is required' }, { status: 400 });
    }

    const result = await checkShiprocketServiceability(
      String(pincode).trim(),
      Number(weightInKg) || 0.5,
      Boolean(isCod),
      Number(subtotal) || 0,
      length ? Number(length) : undefined,
      breadth ? Number(breadth) : undefined,
      height ? Number(height) : undefined
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Serviceability API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');
    const weight = searchParams.get('weight');
    const cod = searchParams.get('cod');
    const subtotal = searchParams.get('subtotal');
    const length = searchParams.get('length');
    const breadth = searchParams.get('breadth');
    const height = searchParams.get('height');

    if (!pincode) {
      return NextResponse.json({ success: false, error: 'Pincode is required' }, { status: 400 });
    }

    const result = await checkShiprocketServiceability(
      pincode.trim(),
      Number(weight) || 0.5,
      cod === '1' || cod === 'true',
      Number(subtotal) || 0,
      length ? Number(length) : undefined,
      breadth ? Number(breadth) : undefined,
      height ? Number(height) : undefined
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Serviceability API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
