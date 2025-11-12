import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [inputUsername, setInputUsername] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!inputUsername.trim()) {
      alert("Username tidak boleh kosong!");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username: inputUsername.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        // Simpan data user ke localStorage
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("credits", data.user.credits);
        localStorage.setItem("isAdmin", data.user.is_admin);

        // Redirect berdasarkan role
        if (data.user.is_admin) {
          // Admin harus masukkan password dulu
          navigate("/admin/password");
        } else {
          // User biasa langsung ke game
          navigate("/game");
        }
      } else {
        alert(data.message || "Login gagal!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to login!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#542E22] to-[#2a1711] flex items-center justify-center p-4">
      <div className="bg-[#133631] rounded-2xl shadow-2xl border-4 border-[#A59A34] p-8 max-w-md w-full">
        <h1 className="sm:text-4xl text-2xl font-bold text-yellow-300 text-center sm:mb-6 mb-4 font-mono">
          GAME
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white font-mono mb-2">
              Enter Your Name
            </label>
            <input
              type="text"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#184841] text-white rounded-lg outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
              placeholder="Your name..."
              maxLength={50}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#FA7436] hover:bg-[#e86528] text-white font-bold py-3 rounded-lg font-mono text-xl transition-all hover:scale-105"
          >
            START PLAYING
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
