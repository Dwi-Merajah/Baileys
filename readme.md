# 📦 @merajah/baileys

<p align="center">
  <img src="https://img.shields.io/npm/v/@merajah/baileys" alt="npm version">
  <img src="https://img.shields.io/node/v/@merajah/baileys" alt="node version">
  <img src="https://img.shields.io/npm/l/@merajah/baileys" alt="license">
</p>

WhatsApp Web API berbasis Baileys Engine dengan high-level Connector untuk mempermudah koneksi, pairing code, dan event handling.

## ✨ Fitur Utama

### 🔑 Autentikasi
- **Pairing Code** - Login tanpa QR Code
- **Multi-file Auth State** - Penyimpanan session terstruktur
- **Auto Reconnect** - Koneksi otomatis saat terputus

### 📡 Event System
- **Message Events** - Deteksi pesan masuk
- **Group Events** - Kelola grup dengan mudah
- **Presence & Call** - Pantau status dan panggilan
- **Connection Events** - Monitor koneksi real-time

### ⚙️ Kemudahan Penggunaan
- **High-Level API** - Interface yang sederhana
- **Raw Baileys Compatible** - Tetap bisa akses fungsi bawaan
- **Dual Module Support** - CJS & ESM ready
- **Zero Dependency** - Tidak perlu install Baileys lain

## 📦 Instalasi

```bash
npm install @merajah/baileys
```

**Persyaratan:** Node.js ≥ 20.x

## 🚀 Penggunaan Cepat

### 📝 CommonJS (CJS)
```javascript
const { Baileys } = require('@merajah/baileys');

const bot = new Baileys({
  number: '628xxxxxxxx',    // Nomor WhatsApp untuk pairing
  sessionPath: 'sessions',  // Lokasi penyimpanan session
  reconnectDelay: 3000,     // Delay reconnection (ms)
  pairingDelay: 2000        // Delay pairing (ms)
});

// Event: Bot Ready
bot.on('ready', () => {
  console.log('✅ Bot connected and ready!');
});

// Event: Pairing Code
bot.on('pairing.code', ({ code, phone }) => {
  console.log(`
📲 PAIRING CODE REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Phone : ${phone}
🔢 Code  : ${code}
━━━━━━━━━━━━━━━━━━━━━━━━━
Masukkan kode di WhatsApp → Linked Devices
  `);
});

// Event: Pesan Masuk
bot.on('message', ({ raw }) => {
  const { remoteJid, fromMe } = raw.key;
  if (!fromMe) {
    console.log(`📩 Message from: ${remoteJid}`);
  }
});

// Start connection
bot.connect();
```

### 📝 ECMAScript Module (ESM)

**package.json:**
```json
{
  "type": "module"
}
```

**index.js:**
```javascript
import { Baileys } from '@merajah/baileys';

const bot = new Baileys({
  number: '628xxxxxxxx',
  sessionPath: 'sessions'
});

// Event handlers sama seperti CJS version
bot.on('ready', () => {
  console.log('✅ Bot connected!');
});

bot.connect();
```

## 👥 Event Grup Lengkap

```javascript
// Member added to group
bot.on('group.add', ctx => {
  console.log(`➕ Member added: ${ctx.participants.join(', ')}`);
  console.log(`👥 Group: ${ctx.groupId}`);
  console.log(`👤 Added by: ${ctx.author}`);
});

// Member removed from group
bot.on('group.remove', ctx => {
  console.log(`➖ Member removed: ${ctx.participants.join(', ')}`);
  console.log(`👥 Group: ${ctx.groupId}`);
  console.log(`👤 Removed by: ${ctx.author}`);
});

// Member promoted to admin
bot.on('group.promote', ctx => {
  console.log(`⭐ Promoted to admin: ${ctx.participants.join(', ')}`);
  console.log(`👥 Group: ${ctx.groupId}`);
  console.log(`👤 Promoted by: ${ctx.author}`);
});

// Member demoted from admin
bot.on('group.demote', ctx => {
  console.log(`⚠️ Demoted from admin: ${ctx.participants.join(', ')}`);
  console.log(`👥 Group: ${ctx.groupId}`);
  console.log(`👤 Demoted by: ${ctx.author}`);
});

// Group settings updated
bot.on('group.update', ctx => {
  console.log(`⚙️ Group updated: ${ctx.groupId}`);
  console.log('Changes:', ctx.changes);
});
```

## 👀 Presence & 📞 Call Events

```javascript
// Presence update (online/typing/recording)
bot.on('presence.update', ({ id, presences }) => {
  console.log('👀 Presence Update');
  console.log(`Chat: ${id}`);
  
  Object.entries(presences).forEach(([jid, presence]) => {
    console.log(`  ${jid.split('@')[0]}: ${presence}`);
  });
});

// Incoming call
bot.on('call', call => {
  console.log('📞 Incoming Call');
  console.log(`From: ${call.from}`);
  console.log(`ID: ${call.id}`);
  console.log(`Status: ${call.status}`);
  console.log(`Video: ${call.isVideo ? 'Yes' : 'No'}`);
});
```

## 🔄 Connection & Error Handling

```javascript
// Socket connected
bot.on('connect', () => {
  console.log('🔌 Socket connected successfully');
});

// Connection state update
bot.on('connection.update', update => {
  const { connection, lastDisconnect, qr } = update;
  
  console.log('🔄 Connection Update:');
  console.log(`Status: ${connection}`);
  
  if (qr) {
    console.log('⚠️ QR Code generated (pairing code preferred)');
  }
  
  if (lastDisconnect) {
    console.log(`📴 Last disconnect: ${lastDisconnect.error?.message}`);
  }
});

// Session invalid/logged out
bot.on('invalid_session', ({ code, sessionPath }) => {
  console.log('❌ Invalid Session');
  console.log(`Error Code: ${code}`);
  console.log(`Session Path: ${sessionPath}`);
  console.log('Please re-authenticate using pairing code.');
});

// Error handler
bot.on('error', ({ error }) => {
  console.error('🔥 ERROR:', error.message);
  console.error('Stack:', error.stack);
});
```

## ⚡ Contoh Lengkap dengan Fitur

```javascript
const { Baileys } = require('@merajah/baileys');

class WhatsAppBot extends Baileys {
  constructor(options) {
    super(options);
    this.setupHandlers();
  }
  
  setupHandlers() {
    // Connection events
    this.on('ready', this.onReady.bind(this));
    this.on('pairing.code', this.onPairingCode.bind(this));
    
    // Message events
    this.on('message', this.onMessage.bind(this));
    
    // Group events
    this.on('group.add', this.onGroupAdd.bind(this));
    this.on('group.remove', this.onGroupRemove.bind(this));
    
    // Error handling
    this.on('error', this.onError.bind(this));
  }
  
  onReady() {
    console.log('🤖 Bot is ready!');
    console.log(`🆔 User: ${this.user?.id}`);
    console.log(`📛 Name: ${this.user?.name}`);
    
    // Send welcome message to owner
    const owner = '628xxxxxxxx@c.us';
    this.sendMessage(owner, {
      text: '✅ Bot connected successfully!'
    });
  }
  
  onPairingCode({ code, phone }) {
    // Implement your pairing code delivery
    // Could be via email, database, or API
    console.log(`🔐 Pairing Code for ${phone}: ${code}`);
    
    // Example: Save to file
    const fs = require('fs');
    fs.writeFileSync(
      'pairing-code.txt',
      `Phone: ${phone}\nCode: ${code}\nTime: ${new Date().toISOString()}`
    );
  }
  
  onMessage({ raw }) {
    const { remoteJid, fromMe, id } = raw.key;
    const message = raw.message;
    
    if (fromMe) return;
    
    // Extract text message
    const text = message?.conversation || 
                 message?.extendedTextMessage?.text ||
                 '';
    
    console.log(`💬 [${remoteJid}] ${text.substring(0, 50)}...`);
    
    // Auto reply example
    if (text.toLowerCase() === 'ping') {
      this.sendMessage(remoteJid, {
        text: '🏓 Pong!',
        quoted: raw
      });
    }
  }
  
  onGroupAdd(ctx) {
    const groupName = ctx.groupName || 'Unknown Group';
    console.log(`👥 [${groupName}] New members: ${ctx.participants.join(', ')}`);
    
    // Welcome new members
    ctx.participants.forEach(participant => {
      this.sendMessage(ctx.groupId, {
        text: `Welcome @${participant.split('@')[0]} to the group! 🎉`,
        mentions: [participant]
      });
    });
  }
  
  onGroupRemove(ctx) {
    console.log(`👋 [${ctx.groupId}] Removed: ${ctx.participants.join(', ')}`);
  }
  
  onError({ error }) {
    console.error('🚨 Critical Error:', error.message);
    // Implement your error reporting here
  }
  
  // Utility method to send message
  async sendMessage(jid, content) {
    try {
      await this.socket.sendMessage(jid, content);
      console.log(`📤 Message sent to ${jid}`);
    } catch (error) {
      console.error(`❌ Failed to send to ${jid}:`, error.message);
    }
  }
}

// Initialize bot
const bot = new WhatsAppBot({
  number: '628xxxxxxxx',
  sessionPath: './whatsapp-sessions',
  reconnectDelay: 5000,
  pairingDelay: 3000
});

// Start the bot
bot.connect();
```

## 📁 Struktur Session

```
project/
├── index.js
├── package.json
└── sessions/                    # Session directory
    ├── creds.json              # Credentials
    ├── keys/                   # Encryption keys
    │   ├── app-state-sync-version
    │   ├── app-state-sync-key
    │   └── ...
    └── pairing-code.txt        # Generated pairing codes
```

## ⚙️ Opsi Konfigurasi

```typescript
interface BaileysOptions {
  number?: string;          // Nomor WhatsApp untuk pairing
  sessionPath?: string;     // Lokasi penyimpanan session (default: 'sessions')
  reconnectDelay?: number;  // Delay reconnection dalam ms (default: 3000)
  pairingDelay?: number;    // Delay pairing dalam ms (default: 2000)
}
```

## 🔧 Metode yang Tersedia

```javascript
// Access raw Baileys socket
const socket = bot.socket;

// Send message (raw Baileys method)
await bot.socket.sendMessage(jid, { text: 'Hello!' });

// Get user info
const user = bot.user;

// Get connection state
const state = bot.connection;

// Disconnect manually
await bot.disconnect();

// Reconnect manually
await bot.reconnect();
```

## 🚨 Best Practices

### 1. **Error Handling**
```javascript
bot.on('error', ({ error }) => {
  // Log to external service
  // Notify admin
  // Attempt recovery
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
```

### 2. **Session Backup**
```javascript
// Backup session periodically
const backupSession = () => {
  const fs = require('fs');
  const date = new Date().toISOString().split('T')[0];
  fs.copyFileSync('sessions/creds.json', `backups/creds-${date}.json`);
};

// Run backup daily
setInterval(backupSession, 24 * 60 * 60 * 1000);
```

### 3. **Rate Limiting**
```javascript
class RateLimitedBot extends Baileys {
  constructor() {
    super();
    this.messageQueue = [];
    this.isProcessing = false;
  }
  
  async sendMessageSafe(jid, content) {
    // Add to queue
    this.messageQueue.push({ jid, content });
    
    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    this.isProcessing = true;
    
    while (this.messageQueue.length > 0) {
      const { jid, content } = this.messageQueue.shift();
      
      try {
        await this.socket.sendMessage(jid, content);
        await this.delay(1000); // 1 second delay
      } catch (error) {
        console.error('Failed to send:', error.message);
      }
    }
    
    this.isProcessing = false;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 📜 Lisensi

MIT License © 2024 Merajah

---

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -m 'Add improvement'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open Pull Request

## ❓ FAQ

### Q: Apakah perlu scan QR code?
**A:** Tidak, package ini menggunakan pairing code untuk autentikasi.

### Q: Apakah support multi-device?
**A:** Ya, menggunakan protokol multi-device Baileys.

### Q: Bagaimana cara backup session?
**A:** Salin seluruh folder `sessions/` ke lokasi aman.

### Q: Apakah aman digunakan?
**A:** Aman selama menjaga kerahasiaan session files.

---

<p align="center">
  <b>⭐ Jika package ini membantu, jangan lupa bintang di GitHub!</b>
</p>