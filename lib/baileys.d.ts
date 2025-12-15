import { EventEmitter } from "events"
import { proto } from "../WAProto"

export interface BaileysOptions {
  number?: string
  sessionPath?: string
  reconnectDelay?: number
  pairingDelay?: number
}

export interface GroupParticipantContext {
  jid: string
  participants: string[]
  action: "add" | "remove" | "promote" | "demote"
}

export interface ConnectionUpdateContext {
  connection?: "open" | "close"
  code?: number
}

export class Baileys extends EventEmitter {
  constructor(options?: BaileysOptions)

  sock: any

  /* ===== CORE ===== */
  on(event: "ready", listener: (ctx: { ready: boolean }) => void): this
  on(event: "connect", listener: (ctx: { connection: "open" }) => void): this

  /* ===== MESSAGE ===== */
  on(
    event: "message",
    listener: (ctx: { raw: proto.IWebMessageInfo }) => void
  ): this

  on(
    event: "message.upsert",
    listener: (ctx: {
      messages: proto.IWebMessageInfo[]
      type?: string
    }) => void
  ): this

  /* ===== PRESENCE / CALL ===== */
  on(
    event: "presence.update",
    listener: (ctx: { id: string; presences: any }) => void
  ): this

  on(event: "call", listener: (ctx: any) => void): this

  /* ===== GROUP ===== */
  on(
    event: "group.participant",
    listener: (ctx: GroupParticipantContext) => void
  ): this

  on(event: "group.add", listener: (ctx: GroupParticipantContext) => void): this
  on(event: "group.remove", listener: (ctx: GroupParticipantContext) => void): this
  on(event: "group.promote", listener: (ctx: GroupParticipantContext) => void): this
  on(event: "group.demote", listener: (ctx: GroupParticipantContext) => void): this

  /* ===== CONNECTION ===== */
  on(
    event: "pairing.code",
    listener: (ctx: { code: string; phone: string }) => void
  ): this

  on(
    event: "connection.update",
    listener: (ctx: ConnectionUpdateContext) => void
  ): this

  on(
    event: "invalid_session",
    listener: (ctx: { code: number; sessionPath: string }) => void
  ): this

  on(event: "error", listener: (ctx: { error: any }) => void): this
}

export default Baileys