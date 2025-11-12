// Popup.jsx
function Popup({ message }) {
  if (!message) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center animate-popup z-50">
      <div className="bg-white text-black px-6 py-4 rounded-2xl shadow-xl text-2xl font-bold transform scale-100 animate-scaleUp border-4 border-yellow-400">
        {message}
      </div>

      <style>{`
        @keyframes popupFade {
          0% { opacity: 0; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.1); }
          60% { transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }

        .animate-popup {
          animation: popupFade 2s ease forwards;
        }
      `}</style>
    </div>
  );
}

export default Popup;
