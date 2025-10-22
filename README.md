
# cara ambil token bot telegram 
1. kirim pesan ke @botfather, lalu klik /newbot
2. masukkan nama bot dan username bot
3. ambil token bot anda

# cara ambil api key dati 
1. kunjungi dan daftar ke https://console.groq.com/keys
2. masukkan name untuk api project, selesaikan
3. bentuk api key seperti ini: "gsk......"

# masukkan token & api key ke env
1. key : GROQ_API_KEY ( untuk Api key dri groq )
2. key : TELEGRAM_TOKEN ( untuk token bot telegram )

# jika tidak mau gunakan env pakai
ubah kode yg menghandle token dan api key menjadi ini:

const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
// Menggunakan Groq API 
const TELEGRAM_TOKEN = 'UBAH_JADI_TOKEN_ANDA';
const GROQ_API_KEY = 'API_KEY_ANDA';
// Inisialisasi klien Groq
const openai = new OpenAI({ 
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});
// Telegram bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
// Simpan riwayat percakapan untuk setiap pengguna
const conversationHistory = new Map();
