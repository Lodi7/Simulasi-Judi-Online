// src/echo.js
import Echo from "laravel-echo";
import Pusher from "pusher-js"; // ⬅️ WAJIB diimpor agar Echo bisa jalan

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb", // pakai Reverb, bukan Pusher
  key: "4vahshuuylwjkadqnqjm", // REVERB_APP_KEY dari .env Laravel
  wsHost: window.location.hostname || "127.0.0.1", // biar otomatis sesuai host
  wsPort: 8080, // sesuai REVERB_PORT
  wssPort: 8080, // untuk HTTPS (biar gak error)
  forceTLS: false, // false karena Reverb lokal
  enabledTransports: ["ws", "wss"], // dua-duanya biar fleksibel
  disableStats: true,
});

export default echo;
