'use strict'

const makeWASocket =
  require("./Socket").default || require("./Socket")
const {
  useMultiFileAuthState
} = require('./Utils/use-multi-file-auth-state')

const {
  fetchLatestBaileysVersion
} = require('./Utils/generics')

const {
  DisconnectReason
} = require('./Types')

const P = require('pino')
const NodeCache = require('node-cache')
const { Boom } = require('@hapi/boom')
const EventEmitter = require('events')
const fs = require('fs')

class Baileys extends EventEmitter {
  constructor(options = {}) {
    super()

    this.options = Object.assign({
      number: '',
      sessionPath: 'sessions',
      reconnectDelay: 3000,
      pairingDelay: 3500
    }, options)

    this.cache = new Map()
    this.msgRetry = new NodeCache()
    this.sock = null

    this.handlers = {}
    this.onceHandlers = {}
    this._connecting = false

    this._connect().catch(e => this._emit('error', { error: e }))
  }

  register(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = []
    this.handlers[event].push(fn)
  }

  once(event, fn) {
    this.onceHandlers[event] = fn
  }

  async _emit(event, ctx) {
    if (this.onceHandlers[event]) {
      try { await this.onceHandlers[event](ctx) } catch {}
      delete this.onceHandlers[event]
    }

    if (this.handlers[event]) {
      for (const fn of this.handlers[event]) {
        try { await fn(ctx) } catch {}
      }
    }

    super.emit(event, ctx)
  }

  async _connect() {
    if (this._connecting) return
    this._connecting = true

    if (!fs.existsSync(this.options.sessionPath)) {
      fs.mkdirSync(this.options.sessionPath, { recursive: true })
    }

    const { state, saveCreds } =
      await useMultiFileAuthState(this.options.sessionPath)

    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      logger: P({ level: 'silent' }),
      version,
      auth: state,
      browser: ['Hisoka-Baileys', 'Chrome', '1.0.0'],
      printQRInTerminal: !this.options.number,
      msgRetryCounterCache: this.msgRetry,
      syncFullHistory: true,
      markOnlineOnConnect: true
    })

    this.sock = sock
    sock.ev.on('creds.update', saveCreds)

    // ===== Pairing =====
    if (!sock.authState.creds.registered && this.options.number) {
      const phone = String(this.options.number).replace(/\D/g, '')
      setTimeout(async () => {
        try {
          const raw = await sock.requestPairingCode(phone)
          const code = raw?.match(/.{1,4}/g)?.join('-') || raw
          this._emit('pairing.code', { code, phone })
        } catch (err) {
          this._emit('error', { error: err })
        }
      }, this.options.pairingDelay)
    }

    // ===== Messages =====
    sock.ev.on('messages.upsert', async upsert => {
      const msgs = upsert?.messages || []
      for (const raw of msgs) {
        if (!raw?.key) continue

        const id = raw.key.id
        if (id) {
          this.cache.set(id, raw)
          if (raw.key.remoteJid)
            this.cache.set(`${raw.key.remoteJid}|${id}`, raw)
          if (raw.key.participant)
            this.cache.set(`${raw.key.participant}|${id}`, raw)
        }

        await this._emit('message', { raw })
      }

      this._emit('message.upsert', { messages: msgs, type: upsert.type })
    })

    // ===== Presence =====
    sock.ev.on('presence.update', update => {
      this._emit('presence.update', {
        id: update.id,
        presences: update.presences || {}
      })
    })

    // ===== Call =====
    const callSeen = new Set()
    sock.ev.on('call', calls => {
      const c = Array.isArray(calls) ? calls[0] : calls
      if (!c) return

      if (['reject', 'ended', 'timeout'].includes(c.status)) {
        callSeen.delete(c.from)
      }

      if (callSeen.has(c.from) && c.status === 'ringing') return
      callSeen.add(c.from)

      this._emit('call', c)
    })

    // ===== Group =====
    sock.ev.on('group-participants.update', data => {
      const base = {
        jid: data.id,
        participants: data.participants,
        action: data.action
      }

      this._emit('group.participant', base)
      if (data.action === 'add') this._emit('group.add', base)
      if (data.action === 'remove') this._emit('group.remove', base)
      if (data.action === 'promote') this._emit('group.promote', base)
      if (data.action === 'demote') this._emit('group.demote', base)
    })

    // ===== Connection =====
    sock.ev.on('connection.update', update => {
      const { connection, lastDisconnect } = update

      if (connection === 'open') {
        this._connecting = false
        this._emit('connect', { connection: 'open' })
        this._emit('ready', { ready: true })
        return
      }

      if (connection === 'close') {
        const code =
          new Boom(lastDisconnect?.error)?.output?.statusCode

        this._emit('connection.update', { connection: 'close', code })

        if (code === DisconnectReason.loggedOut) {
          this._emit('invalid_session', {
            code,
            sessionPath: this.options.sessionPath
          })
          process.exit(0)
        }

        setTimeout(() => {
          this._connecting = false
          this._connect()
        }, this.options.reconnectDelay)
      }
    })
  }
}

module.exports = Baileys
module.exports.default = Baileys
Object.defineProperty(module.exports, '__esModule', { value: true })