// src/utils/bookingStatus.js
// ---------------------------------------------------------------------------
// Shared booking-status vocabulary used by the result page and history card.
// Kept in one place so the two views stay consistent.
// ---------------------------------------------------------------------------

export const STATUS = {
  DRAFT:            'draft_awaiting_payment',
  PAYMENT_RECEIVED: 'payment_received',
  FULFILLING:       'fulfilling',
  CONFIRMED:        'confirmed',
  PAYMENT_FAILED:   'payment_failed',
  CANCELED:         'canceled',
  FAILED_REFUNDING: 'failed_refunding',
  REFUNDED:         'refunded',
};

/** True while the server is still resolving payment or the flight booking. */
export function isProcessingStatus(booking) {
  if (!booking) return false;
  const s = booking.status;
  if (s === STATUS.DRAFT)            return true;
  if (s === STATUS.PAYMENT_RECEIVED) return true;
  if (s === STATUS.FULFILLING)       return true;
  // failed_refunding is transient until the refund settles.
  if (s === STATUS.FAILED_REFUNDING) {
    return booking.refund_state === 'initiated' || !booking.refund_state;
  }
  return false;
}

/**
 * Map a raw backend status to a compact { label, tone, headline, description }
 * used by the result page and history card. `tone` maps to the existing status
 * colour palette (green/blue/red/gray) so no visual redesign is needed.
 */
export function displayFor(booking) {
  const s = booking?.status;

  if (s === STATUS.DRAFT) {
    return {
      label:       'Payment pending',
      tone:        'gray',
      headline:    'Securing your booking',
      description: 'We\u2019re confirming your payment and holding your seats. This usually takes just a few seconds.',
    };
  }
  if (s === STATUS.PAYMENT_RECEIVED) {
    return {
      label:       'Payment received',
      tone:        'gray',
      headline:    'Payment received',
      description: 'Confirming your flights with the airline…',
    };
  }
  if (s === STATUS.FULFILLING) {
    return {
      label:       'Booking processing',
      tone:        'gray',
      headline:    'Finalising your booking',
      description: 'We\u2019re confirming your seats with the airline. This usually takes under a minute.',
    };
  }
  if (s === STATUS.CONFIRMED) {
    return {
      label:       'Confirmed',
      tone:        'green',
      headline:    'Booking confirmed',
      description: 'Your flights are booked. Check your email for the itinerary.',
    };
  }
  if (s === STATUS.PAYMENT_FAILED) {
    return {
      label:       'Payment failed',
      tone:        'red',
      headline:    'Payment could not be completed',
      description: 'Your card was declined or authorization failed. You can try again with a different payment method.',
    };
  }
  if (s === STATUS.CANCELED) {
    return {
      label:       'Cancelled',
      tone:        'red',
      headline:    'Payment cancelled',
      description: 'This checkout was cancelled. No charge was made.',
    };
  }
  if (s === STATUS.FAILED_REFUNDING) {
    const refunding = booking?.refund_state === 'initiated';
    return {
      label:       refunding ? 'Refund pending' : 'Booking failed',
      tone:        'red',
      headline:    refunding ? 'Refund in progress' : 'Booking could not be completed',
      description: refunding
        ? 'Your card was charged, but the airline booking could not be completed. A refund is being processed and will appear on your statement.'
        : 'Your card was charged, but the airline booking and the automatic refund could not be completed. Please contact support.',
    };
  }
  if (s === STATUS.REFUNDED) {
    return {
      label:       'Refunded',
      tone:        'blue',
      headline:    'Refunded',
      description: 'The full amount has been refunded to your original payment method.',
    };
  }
  return {
    label:       'Unknown',
    tone:        'gray',
    headline:    'Status unavailable',
    description: 'We couldn\u2019t determine the state of this booking.',
  };
}

const TONE_PILL = {
  green: 'bg-green-500/20 text-green-400',
  blue:  'bg-blue-500/20 text-blue-400',
  red:   'bg-red-500/20 text-red-400',
  gray:  'bg-gray-500/20 text-gray-400',
};

export function pillClassFor(tone) {
  return TONE_PILL[tone] || TONE_PILL.gray;
}
