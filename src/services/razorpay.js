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
        // Redirect to bookings page after successful payment with a loading message
        const redirectContainer = document.createElement('div');
        redirectContainer.style.position = 'fixed';
        redirectContainer.style.top = '0';
        redirectContainer.style.left = '0';
        redirectContainer.style.width = '100%';
        redirectContainer.style.height = '100%';
        redirectContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        redirectContainer.style.display = 'flex';
        redirectContainer.style.justifyContent = 'center';
        redirectContainer.style.alignItems = 'center';
        redirectContainer.style.zIndex = '9999';
        redirectContainer.innerHTML = `
          <div style="text-align: center; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #16a34a; margin-bottom: 1rem;">Payment Successful!</h2>
            <p style="color: #4b5563;">Redirecting to your bookings...</p>
          </div>
        `;
        document.body.appendChild(redirectContainer);
        setTimeout(() => {
          window.location.href = '/bookings';
        }, 4000);
      },
      modal: { 
        ondismiss: () => { 
          onFailure?.(); 
          reject(new Error('Payment closed')); 
        },
        escape: false // Prevent closing with Esc key
      },
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
