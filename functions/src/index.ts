import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import * as logger from 'firebase-functions/logger'
import { defineSecret } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2/options'
import { parseBooking } from './validate.js'

initializeApp()

// Same region as the Firestore database
setGlobalOptions({ region: 'europe-west4', maxInstances: 5 })

const turnstileSecret = defineSecret('TURNSTILE_SECRET')

/** Hostnames the Turnstile widget may be solved on */
const ALLOWED_HOSTNAMES = new Set(['apointment-crm.web.app', 'apointment-crm.firebaseapp.com', 'localhost'])

interface SiteverifyResponse {
  'success': boolean
  'error-codes'?: string[]
  'hostname'?: string
  'action'?: string
}

async function verifyTurnstile(token: string, remoteIp: string | undefined) {
  const body = new URLSearchParams({ secret: turnstileSecret.value(), response: token })
  if (remoteIp) body.set('remoteip', remoteIp)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  if (!res.ok) throw new HttpsError('unavailable', 'turnstile-unavailable')
  const outcome = await res.json() as SiteverifyResponse

  if (!outcome.success) {
    logger.warn('Turnstile rejected token', { errors: outcome['error-codes'] })
    throw new HttpsError('permission-denied', 'turnstile-failed')
  }
  if (outcome.action !== 'booking' || (outcome.hostname && !ALLOWED_HOSTNAMES.has(outcome.hostname))) {
    logger.warn('Turnstile token for unexpected action/hostname', { action: outcome.action, hostname: outcome.hostname })
    throw new HttpsError('permission-denied', 'turnstile-failed')
  }
}

/**
 * Public online booking. Browsers can no longer create appointments directly (see firestore.rules):
 * every online booking must pass a Turnstile check here, then is saved together with its busy slot
 * in one transaction that also rejects overlapping bookings for the same specialist.
 */
export const createBooking = onCall(
  {
    secrets: [turnstileSecret],
    cors: ['https://apointment-crm.web.app', 'https://apointment-crm.firebaseapp.com', /^http:\/\/localhost(:\d+)?$/],
  },
  async (request) => {
    const data = (request.data ?? {}) as { token?: unknown, booking?: unknown }
    if (typeof data.token !== 'string' || !data.token || data.token.length > 2048) {
      throw new HttpsError('invalid-argument', 'missing-turnstile-token')
    }
    const booking = parseBooking(data.booking) // throws invalid-argument

    await verifyTurnstile(data.token, request.rawRequest.ip)

    const db = getFirestore()
    const appointmentRef = db.collection('appointments').doc()
    const end = booking.startMinutes + booking.durationMin
    const slotRef = db.collection('busySlots').doc(`${booking.staffId}_${booking.date}_${booking.startMinutes}`)

    await db.runTransaction(async (tx) => {
      const sameDay = await tx.get(
        db.collection('busySlots').where('date', '==', booking.date).where('staffId', '==', booking.staffId),
      )
      const clash = sameDay.docs.some((d) => {
        const slot = d.data() as { start: number, end: number }
        return booking.startMinutes < slot.end && slot.start < end
      })
      if (clash) throw new HttpsError('already-exists', 'slot-taken')

      tx.create(appointmentRef, { ...booking, status: 'pending', source: 'online', createdAt: FieldValue.serverTimestamp() })
      tx.create(slotRef, {
        appointmentId: appointmentRef.id,
        staffId: booking.staffId,
        date: booking.date,
        start: booking.startMinutes,
        end,
      })
    })

    logger.info('Online booking created', { id: appointmentRef.id, date: booking.date, staffId: booking.staffId })
    return { id: appointmentRef.id }
  },
)
