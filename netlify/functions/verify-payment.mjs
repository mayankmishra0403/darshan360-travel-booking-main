import { initDb, ok, bad, serverError, handleOptions, sign, createOrUpdateBooking, createOrUpdatePayment } from './_shared.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  try {
    const body = JSON.parse(event.body || '{}');
    const { order, razorpay: rp, trip, userId } = body || {};
    if (!order?.id || !rp?.razorpay_payment_id || !rp?.razorpay_signature) {
      return bad({ error: 'invalid payload' });
    }
    const expected = sign(`${order.id}|${rp.razorpay_payment_id}`);
    if (expected !== rp.razorpay_signature) return bad({ error: 'invalid signature' });

    const db = initDb();
    let booking = null;
    let payment = null;
    if (db && trip && userId) {
      booking = await createOrUpdateBooking(db, { orderId: order.id, trip, userId, status: 'paid' });
      payment = await createOrUpdatePayment(db, { orderId: order.id, trip, userId, status: 'paid', amount: order.amount, currency: order.currency, paymentId: rp.razorpay_payment_id, signature: rp.razorpay_signature });
    }
    return ok({ ok: true, bookingId: booking?.$id || order.id, recorded: Boolean(booking), paymentId: payment?.$id || order.id, paymentsRecorded: Boolean(payment) });
  } catch (e) {
    console.error(e);
    return serverError({ error: e.message });
  }
}
