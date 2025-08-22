// Create a Razorpay order by calling the backend
export async function createRazorpayOrder(data) {
  const res = await fetch('/.netlify/functions/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create Razorpay order');
  }
  return res.json();
}
