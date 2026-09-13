import { prisma } from './db'
import { getSettings } from './settings'

/**
 * Notifications.
 *
 * Everything is written to the database and shown inside the application. Email
 * is wired up but held behind a settings flag, off until a sending domain is
 * verified — so nothing fails silently today, and switching it on later is one
 * toggle rather than a piece of work.
 *
 * No SMS in v1: text messages are charged for, and which ones justify their
 * cost is still an open question (gap #25).
 */

type NotificationInput = {
  type: string
  title: string
  body: string
  link?: string
}

export async function notifyCustomer(input: NotificationInput & { customerId: string }) {
  const notification = await prisma.notification.create({
    data: {
      audience: 'CUSTOMER',
      customerId: input.customerId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  })

  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { email: true, businessName: true },
  })

  if (customer) {
    await sendEmail({
      to: customer.email,
      subject: input.title,
      body: input.body,
      notificationId: notification.id,
    })
  }

  return notification
}

/** Aimed at whichever staff are watching, not at one named person. */
export async function notifyStaff(input: NotificationInput & { staffId?: string }) {
  const settings = await getSettings()

  const notification = await prisma.notification.create({
    data: {
      audience: 'STAFF',
      staffId: input.staffId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  })

  await sendEmail({
    to: settings['notifications.adminEmail'],
    subject: input.title,
    body: input.body,
    notificationId: notification.id,
  })

  return notification
}

async function sendEmail(input: {
  to: string
  subject: string
  body: string
  notificationId: string
}) {
  const settings = await getSettings()
  const apiKey = process.env.RESEND_API_KEY

  // Off until a sending domain is verified. The notification is already saved
  // and visible in the application either way.
  if (!settings['notifications.emailEnabled'] || !apiKey) return

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from: process.env.MAIL_FROM ?? 'ANAID <noreply@anaid.co.uk>',
      to: input.to,
      subject: input.subject,
      text: input.body,
    })

    await prisma.notification.update({
      where: { id: input.notificationId },
      data: { emailedAt: new Date() },
    })
  } catch (error) {
    // A failed email must never fail the action that caused it — an approval
    // still stands whether or not the customer got the message.
    console.error('Notification email failed', error)
  }
}
