const Razorpay = require('razorpay');

async function testRazorpay() {
  try {
    const key_id = "rzp_test_T12sKOGkciF0vY";
    const key_secret = "Px2e9NtADHaPdakT3U76j5m0";

    console.log("Testing Razorpay with Key ID:", key_id);
    
    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const options = {
      amount: 100,
      currency: "INR",
      receipt: "rcpt_test_123"
    };

    const order = await razorpay.orders.create(options);
    console.log("Order created successfully:", order.id);
  } catch (error) {
    console.error("Razorpay Error:");
    console.error(error);
  }
}

testRazorpay();
