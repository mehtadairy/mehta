const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Mock cookies and headers for Next.js GET call
const { GET } = require('../src/app/api/admin/data/route');

async function testRoute() {
  console.log("Calling GET /api/admin/data handler...");
  
  // Since verifySession expects a valid token, we can mock it or see what it outputs
  // Let's create a mock Request with a query parameter
  const req = new Request('http://localhost:3000/api/admin/data?page=1&limit=50', {
    method: 'GET'
  });
  
  try {
    const res = await GET(req);
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("JSON Success:", json.success);
    console.log("JSON Error:", json.error);
    if (json.data) {
      console.log("Orders count:", json.data.orders ? json.data.orders.length : 0);
      console.log("Customers count:", json.data.customers ? json.data.customers.length : 0);
    }
  } catch (err) {
    console.error("Route handler crashed with:", err);
  }
}

testRoute();
