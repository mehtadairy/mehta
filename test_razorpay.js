const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_T12sKOGkciF0vY',
  key_secret: 'Px2e9NtADHaPdakT3U76j5m0',
});

const options = {
  amount: Math.round(610 * 100), // amount in paise
  currency: "INR",
  receipt: `receipt_TEST_123`,
};

razorpay.orders.create(options).then(console.log).catch(console.error);
