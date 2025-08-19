import { initRazorpay, initDb, ok, serverError, handleOptions, createOrUpdateBooking, createOrUpdatePayment } from './_shared.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  try {
    const body = JSON.parse(event.body || '{}');
    const { amount, currency = 'INR', receipt, trip, userId } = body;
    if (!amount) return ok({ error: 'amount required' });

    const razorpay = initRazorpay();
    const order = await razorpay.orders.create({ amount, currency, receipt });

    const db = initDb();
    let recorded = false;
    let paymentsRecorded = false;
    if (trip && userId && db) {
      const b = await createOrUpdateBooking(db, { orderId: order.id, trip, userId, status: 'pending' });
      recorded = Boolean(b);
      const p = await createOrUpdatePayment(db, { orderId: order.id, trip, userId, status: 'created', amount, currency });
      paymentsRecorded = Boolean(p);
    }

    return ok({ ...order, serverCreatesBookings: recorded, serverCreatesPayments: paymentsRecorded });
  } catch (e) {
    console.error(e);
    return serverError({ error: e.message });
  }
}
