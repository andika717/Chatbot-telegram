const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

// Ambil token dari environment variable
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Inisialisasi Groq client
const openai = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});

// Inisialisasi Telegram bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Simpan riwayat percakapan
const conversationHistory = new Map();

// Function to format message for Telegram
function formatTelegramMessage(text) {
  // Clean up the text
  let formatted = text.trim();
  
  // Escape special markdown characters except those we want to use
  // But preserve intentional formatting
  
  // Fix common code blocks that appear accidentally
  formatted = formatted.replace(/```python\n/g, '');
  formatted = formatted.replace(/```\n/g, '');
  formatted = formatted.replace(/```/g, '');
  
  // Remove any stray backticks around short code snippets unless it's actual code
  // Keep the message clean and professional
  
  return formatted;
}

console.log('🤖 Bot Telegram AI sedang berjalan...');

// Handle all text messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const messageText = msg.text;

  // Ignore if no text (could be photo, video, etc.)
  if (!messageText) {
    return;
  }

  // Skip commands
  if (messageText.startsWith('/')) {
    return;
  }

  try {
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Get or initialize conversation history for this user
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, [
        {
          role: 'system',
          content: 'Anda adalah asisten AI yang profesional dan ramah. Jawab pertanyaan dengan jelas dan terstruktur. Gunakan bahasa yang sama dengan pengguna. Jika menjelaskan sesuatu, gunakan poin-poin atau numbering untuk kemudahan membaca. Jangan sertakan kode program kecuali diminta. Berikan jawaban yang to-the-point dan mudah dipahami.'
        }
      ]);
    }

    const history = conversationHistory.get(userId);

    // Add user message to history
    history.push({
      role: 'user',
      content: messageText
    });

    // Keep only last 20 messages to avoid token limits
    if (history.length > 21) {
      history.splice(1, history.length - 21);
    }

    // Call Groq API
    const response = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: history,
      max_tokens: 2048
    });

    const aiResponse = response.choices[0].message.content;

    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse
    });

    // Format and send response to user (no Markdown to avoid parsing errors)
    const formattedResponse = formatTelegramMessage(aiResponse);
    await bot.sendMessage(chatId, formattedResponse);

    console.log(`✅ Pesan dari ${msg.from.first_name}: "${messageText}"`);
    console.log(`📤 Respons AI: "${aiResponse.substring(0, 50)}..."`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Check if it's a rate limit error
    if (error.message.includes('Rate limit')) {
      await bot.sendMessage(
        chatId, 
        '⚠️ Maaf, bot sedang mencapai batas penggunaan harian.\n\nSilakan coba lagi nanti atau tunggu beberapa menit. Terima kasih atas pengertiannya! 🙏'
      );
    } else {
      await bot.sendMessage(
        chatId, 
        '⚠️ Maaf, terjadi kesalahan.\n\nSilakan coba lagi dalam beberapa saat. Jika masalah berlanjut, gunakan /reset untuk memulai percakapan baru.'
      );
    }
  }
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Reset conversation history
  conversationHistory.delete(userId);
  
  bot.sendMessage(
    chatId,
    '👋 Halo! Saya adalah AI chatbot berbasis Groq.\n\n' +
    'Anda bisa bertanya apa saja kepada saya, dan saya akan menjawab dengan senang hati!\n\n' +
    'Gunakan /reset untuk memulai percakapan baru. \n\n' +
    'Gunakan /help untuk fitur chatbot ini!!'
  );
});

// Handle /reset command
bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  conversationHistory.delete(userId);
  
  bot.sendMessage(chatId, '🔄 Percakapan telah direset. Mari mulai dari awal!');
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    '📚 Bantuan & Perintah\n\n' +
    'Perintah yang tersedia:\n' +
    '/start - Mulai bot dan lihat pesan sambutan\n' +
    '/reset - Mulai percakapan baru\n' +
    '/help - Tampilkan pesan bantuan ini\n\n' +
    'Cara pakai:\n' +
    'Cukup kirim pesan apa saja, dan saya akan menjawabnya! 💬\n\n' +
    'Tips:\n' +
    '• Tanya apa saja yang ingin Anda ketahui\n' +
    '• Minta penjelasan tentang topik tertentu\n' +
    '• Gunakan /reset jika ingin memulai topik baru\n\n' +
    'Selamat bertanya! 🚀'
  );
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Menghentikan bot...');
  bot.stopPolling();
  process.exit(0);
});

