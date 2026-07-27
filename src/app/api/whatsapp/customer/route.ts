import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabaseServer';
import { isTestModeRequest } from '@/lib/services/whatsapp-validation';

function normalizeIndianPhoneNumber(phone: any): string | null {
  if (!phone) return null;
  const str = String(phone).replace(/\D/g, "");
  if (str.length === 10) return "91" + str;
  if (str.length === 12 && str.startsWith("91")) return str;
  return null;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let body: any = {};

  try {
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({
        success: false,
        step: "json_parsing",
        message: "Invalid JSON request body."
      }, { status: 200 });
    }

    // LOG: Incoming Payload
    console.log("========== WhatsApp API ==========");
    console.log("Endpoint: /customer");
    console.log("Incoming Body:");
    console.log(JSON.stringify(body, null, 2));

    // Test Mode Detection
    if (isTestModeRequest(body)) {
      console.log("[AiSensy Test Mode] customer endpoint");
      const mockRes = {
        success: true,
        customerId: "00000000-0000-4000-8000-000000000001",
        customerName: "Test User",
        phone: "919999999999",
        addressId: "00000000-0000-4000-8000-000000000002",
        testMode: true
      };
      console.log("[CustomerAPI] Returned response (Test Mode):", JSON.stringify(mockRes, null, 2));
      console.log("==================================");
      return NextResponse.json(mockRes, { status: 200 });
    }

    const { customerName, phone, address, pincode } = body;

    if (!phone || !customerName || !address || !pincode) {
      const errRes = {
        success: false,
        step: "validation",
        message: "phone, customerName, address, and pincode are required in the request body."
      };
      console.log("[CustomerAPI] Returned response:", JSON.stringify(errRes, null, 2));
      return NextResponse.json(errRes, { status: 200 });
    }

    const cleanPhone = normalizeIndianPhoneNumber(phone);
    if (!cleanPhone) {
      const errRes = {
        success: false,
        step: "validation",
        message: "Invalid phone number format. Must be a valid 10-digit Indian number or start with 91."
      };
      console.log("[CustomerAPI] Returned response:", JSON.stringify(errRes, null, 2));
      return NextResponse.json(errRes, { status: 200 });
    }

    // 1. Fetch or Upsert Customer
    const { data: customers, error: customerFetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone);

    if (customerFetchError) {
      console.error('[CustomerAPI] SUPABASE ERROR:', customerFetchError);
      return NextResponse.json({
        success: false,
        step: "customer_lookup",
        message: "Database error retrieving customer details.",
        details: { supabaseError: customerFetchError }
      }, { status: 200 });
    }

    if (customers && customers.length > 1) {
      return NextResponse.json({
        success: false,
        step: "customer_lookup",
        message: "Duplicate customer records found for this phone number.",
        details: { phone: cleanPhone, count: customers.length }
      }, { status: 200 });
    }

    let customer = customers && customers.length === 1 ? customers[0] : null;

    if (customer) {
      // Update customer name
      const { data: updatedCust, error: updateCustomerError } = await supabase
        .from('customers')
        .update({ name: customerName })
        .eq('id', customer.id)
        .select()
        .single();

      if (updateCustomerError) {
        console.error('[CustomerAPI] Error updating customer name:', updateCustomerError);
        return NextResponse.json({
          success: false,
          step: "customer_update",
          message: "Failed to update customer details.",
          details: { supabaseError: updateCustomerError }
        }, { status: 200 });
      }
      customer = updatedCust;
    } else {
      // Insert new customer
      const { data: insertedCust, error: insertCustomerError } = await supabase
        .from('customers')
        .insert([{
          phone: cleanPhone,
          name: customerName,
          role: 'customer'
        }])
        .select()
        .single();

      if (insertCustomerError) {
        console.error('[CustomerAPI] Error creating customer:', insertCustomerError);
        return NextResponse.json({
          success: false,
          step: "customer_creation",
          message: "Failed to create customer record.",
          details: { supabaseError: insertCustomerError }
        }, { status: 200 });
      }
      customer = insertedCust;
    }

    // 2. Fetch or Upsert Address
    const { data: defaultAddresses, error: addressFetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('is_default', true);

    if (addressFetchError) {
      console.error('[CustomerAPI] Database error fetching address:', addressFetchError);
    }

    let existingAddress = defaultAddresses && defaultAddresses.length > 0 ? defaultAddresses[0] : null;

    if (!existingAddress) {
      const { data: allAddresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', customer.id);

      if (allAddresses && allAddresses.length > 0) {
        const sortedAll = [...allAddresses].sort((a: any, b: any) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return String(b.id).localeCompare(String(a.id));
        });
        existingAddress = sortedAll[0];
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', existingAddress.id);
      }
    }

    let resolvedAddress = null;

    if (existingAddress) {
      // Update existing default address
      const { data: updateAddrData, error: updateAddressError } = await supabase
        .from('addresses')
        .update({
          full_name: customerName,
          address: address,
          pincode: pincode,
          mobile: cleanPhone,
          city: 'Auto-detected',
          state: 'Gujarat'
        })
        .eq('id', existingAddress.id)
        .select()
        .single();

      if (updateAddressError) {
        console.error('[CustomerAPI] Error updating address:', updateAddressError);
        return NextResponse.json({
          success: false,
          step: "address_update",
          message: "Failed to update customer address.",
          details: { supabaseError: updateAddressError }
        }, { status: 200 });
      }
      resolvedAddress = updateAddrData;
    } else {
      // Create new default address
      const { data: insertAddrData, error: insertAddressError } = await supabase
        .from('addresses')
        .insert([{
          customer_id: customer.id,
          full_name: customerName,
          address: address,
          pincode: pincode,
          mobile: cleanPhone,
          city: 'Auto-detected',
          state: 'Gujarat',
          is_default: true
        }])
        .select()
        .single();

      if (insertAddressError) {
        console.error('[CustomerAPI] Error inserting address:', insertAddressError);
        return NextResponse.json({
          success: false,
          step: "address_creation",
          message: "Failed to create customer address.",
          details: { supabaseError: insertAddressError }
        }, { status: 200 });
      }
      resolvedAddress = insertAddrData;
    }

    const responseTime = Date.now() - startTime;
    console.log('--- WhatsApp Customer Sync Logs ---');
    console.log(`Phone: ${cleanPhone}`);
    console.log(`Customer ID: ${customer.id}`);
    console.log(`Address ID: ${resolvedAddress.id}`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log('-----------------------------------');

    const resBody = {
      success: true,
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      addressId: resolvedAddress.id,
      debug: {
        returnedCustomerId: customer.id
      }
    };

    console.log("Returning customerId:", customer.id);
    console.log("[CustomerAPI] Returned response:", JSON.stringify(resBody, null, 2));

    return NextResponse.json(resBody, { status: 200 });

  } catch (error: any) {
    console.error('[CustomerAPI] Uncaught server error:', error);
    return NextResponse.json({
      success: false,
      step: "uncaught_server_error",
      message: "An unexpected error occurred on the server.",
      details: { error: String(error) }
    }, { status: 500 });
  }
}
