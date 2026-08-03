async function testApi() {
  const cases = [
    { state: 'Gujarat', weight: 0.25, expected: 40 },
    { state: 'Gujarat', weight: 0.5, expected: 40 },
    { state: 'Gujarat', weight: 0.9, expected: 40 },
    { state: 'Gujarat', weight: 1.0, expected: 40 },
    { state: 'Gujarat', weight: 1.01, expected: 80 },
    { state: 'Gujarat', weight: 1.25, expected: 80 },
    { state: 'Gujarat', weight: 1.99, expected: 80 },
    { state: 'Gujarat', weight: 2.0, expected: 80 },
    { state: 'Gujarat', weight: 2.01, expected: 120 },
    { state: 'Maharashtra', weight: 1.0, expected: 70 },
    { state: 'Maharashtra', weight: 1.25, expected: 140 },
    { state: 'Maharashtra', weight: 2.8, expected: 210 },
    { state: 'Kerala', weight: 1.0, expected: 80 },
    { state: 'Tamil Nadu', weight: 1.2, expected: 160 },
    { state: 'Karnataka', weight: 2.6, expected: 240 }
  ];

  let passed = 0;

  for (const tc of cases) {
    // Generate mock cart
    const cart = [{ product_name: 'Test', weight: tc.weight + 'kg', quantity: 1, price: 100 }];
    try {
      const res = await fetch('http://localhost:3000/api/delivery/check-serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: tc.state, cart })
      });
      const data = await res.json();
      
      const charge = data.deliveryCharge;
      if (charge === tc.expected) {
        console.log(`[PASS] ${tc.weight}kg ${tc.state} -> Rs. ${charge}`);
        passed++;
      } else {
        console.error(`[FAIL] ${tc.weight}kg ${tc.state} -> Expected Rs. ${tc.expected}, Got Rs. ${charge}`);
        console.error(data);
      }
    } catch (e) {
      console.error('Error on', tc, e.message);
    }
  }
  
  console.log(`\nTotal Passed: ${passed} / ${cases.length}`);
}

testApi();
