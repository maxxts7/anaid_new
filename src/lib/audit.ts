import { headers } from 'next/headers'
import { prisma } from './db'
import type { ActorType } from '../generated/prisma/client'
import type { PrismaClient } from '../generated/prisma/client'

/**
 * The audit log.
 *
 * Written from the first approval onwards (LEVEL-4 §30). Entries are never
 * edited and never deleted. The actor's name is copied in rather than looked up
 * later, so an entry still reads correctly after the person has left.
 *
 * The reading UI is deferred to a later phase; the record is not.
 */

type AuditInput = {
  actorType: ActorType
  actorId?: string | null
  actorLabel: string
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
  /** Pass a transaction client when the entry must land with the change itself. */
  tx?: Pick<PrismaClient, 'auditLog'>
}

export async function recordAudit(entry: AuditInput): Promise<void> {
  let ipAddress: string | null = null
  let userAgent: string | null = null

  // Available during a request, absent in a script or a background job.
  try {
    const headerList = await headers()
    userAgent = headerList.get('user-agent')?.slice(0, 500) ?? null
    ipAddress =
      headerList.get('x-nf-client-connection-ip') ??
      headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      null
  } catch {
    // Not in a request context.
  }

  const client = entry.tx ?? prisma

  await client.auditLog.create({
    data: {
      actorType: entry.actorType,
      actorId: entry.actorId ?? null,
      actorLabel: entry.actorLabel,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: entry.before === undefined ? undefined : JSON.parse(JSON.stringify(entry.before)),
      after: entry.after === undefined ? undefined : JSON.parse(JSON.stringify(entry.after)),
      ipAddress,
      userAgent,
    },
  })
}
