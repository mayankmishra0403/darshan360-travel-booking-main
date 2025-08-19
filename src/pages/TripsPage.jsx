import React, { useEffect, useState } from 'react';
import TripCard from '../components/TripCard';
import { listTrips } from '../services/trips';
import { createBookingWithIdFallback } from '../services/bookings';
import { createPaymentWithId } from '../services/payments';

export default function TripsPage() {
	const [trips, setTrips] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		async function load() {
			setLoading(true);
			try {
				const res = await listTrips();
				if (mounted) setTrips(res);
			} catch (err) {
				console.error('Failed to load trips', err);
			} finally {
				if (mounted) setLoading(false);
			}
		}
		load();
		return () => (mounted = false);
	}, []);

	// pay fallback: create local booking + payment record then open UPI link
	async function handlePay(trip) {
		try {
			const booking = await createBookingWithIdFallback({
				tripId: trip.$id || trip.id,
				status: 'pending',
				amount: trip.price || 0,
				createdAt: new Date().toISOString(),
			});

			// best-effort create payment record
			try {
				await createPaymentWithId({
					bookingId: booking.$id || booking.id,
					status: 'pending',
					method: 'upi',
					amount: trip.price || 0,
					createdAt: new Date().toISOString(),
				});
			} catch (e) {
				console.warn('Failed to create payment record', e);
			}

			const upiLink = 'http://razorpay.me/@mayanksoni8625';
			window.open(upiLink, '_blank');
		} catch (err) {
			console.error('Failed to create fallback booking', err);
			alert('Failed to create booking. Please try again.');
		}
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<h2 className="text-2xl font-bold mb-4">Explore Destinations</h2>
			{loading ? (
				<div className="text-center py-20">Loading trips...</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{trips.map((t) => (
						<TripCard key={t.$id || t.id} trip={t} onPay={() => handlePay(t)} />
					))}
				</div>
			)}
		</div>
	);
}
