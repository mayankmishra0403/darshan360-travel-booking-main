// Lightweight helper to open Razorpay checkout
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.body.appendChild(script);
  });
}

export async function openRazorpay({ key, order, user, onSuccess, onFailure }) {
  await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: order.amount,
      currency: order.currency,
  name: 'Darshan 360',
      description: order.description || 'Trip booking',
      order_id: order.id,
      prefill: { name: user?.name, email: user?.email },
      handler: function (response) {
        onSuccess?.(response);
        resolve(response);
      },
      modal: { ondismiss: () => { onFailure?.(); reject(new Error('Payment closed')); } },
      theme: { color: '#FD366E' },
    };
    const rp = new window.Razorpay(options);
    // Capture payment failure events
    rp.on('payment.failed', function (response){
      onFailure?.(response?.error || response);
      reject(new Error('Payment failed'));
    });
    rp.open();
  });
}
