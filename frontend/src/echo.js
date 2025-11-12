// src/echo.js
import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Wajib: sambungkan Pusher ke window
window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "pusher",
  key: import.meta.env.VITE_PUSHER_APP_KEY, // ambil dari .env Vite (frontend)
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER, // ambil dari .env
  forceTLS: true, // true biar aman & cocok untuk production (Hostinger)
});

export default echo;
