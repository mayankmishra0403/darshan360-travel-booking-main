import { initDb, ok, bad, serverError, handleOptions, createOrUpdateBooking, createOrUpdatePayment } from './_shared.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  try {
    const body = JSON.parse(event.body || '{}');
    const { order, trip, userId, failure } = body || {};
    if (!order?.id || !trip || !userId) return bad({ error: 'invalid payload' });

    const db = initDb();
    let booking = null;
    let payment = null;
    if (db) {
      booking = await createOrUpdateBooking(db, { orderId: order.id, trip, userId, status: 'failed' });
      payment = await createOrUpdatePayment(db, { orderId: order.id, trip, userId, status: 'failed', failure });
    }
    return ok({ ok: true, bookingId: booking?.$id || order.id, recorded: Boolean(booking), paymentId: payment?.$id || order.id, paymentsRecorded: Boolean(payment) });
  } catch (e) {
    console.error(e);
    return serverError({ error: e.message });
  }
}
