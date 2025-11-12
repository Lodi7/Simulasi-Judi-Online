import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminPassword() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ State baru untuk toggle
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminData", JSON.stringify(data.admin));
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Password salah!");
        setPassword("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#542E22] to-[#2a1711] flex items-center justify-center p-4">
      <div className="bg-[#133631] rounded-2xl shadow-2xl border-4 border-[#A59A34] p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-yellow-300 text-center mb-6 font-mono">
          🔐 Admin Access
        </h1>
        <p className="text-white text-center mb-6 font-mono">
          Enter admin password to continue
        </p>

        {error && (
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg mb-4 font-mono text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-mono mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // ✅ Toggle type
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-[#184841] text-white rounded-lg outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                placeholder="Enter password..."
                required
                disabled={isLoading}
              />
              {/* ✅ Tombol Toggle Show/Hide */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-300 hover:text-yellow-400 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  // Icon mata tertutup (hide)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  // Icon mata terbuka (show)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FA7436] hover:bg-[#e86528] text-white font-bold py-3 rounded-lg font-mono text-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? "VERIFYING..." : "ACCESS DASHBOARD"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/game")}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg font-mono text-xl transition-all hover:scale-105"
            disabled={isLoading}
          >
            PLAY GAME INSTEAD
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminPassword;
