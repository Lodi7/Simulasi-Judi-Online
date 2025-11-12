import { useState, useEffect } from "react";
import Slot from "./slot";
import Popup from "./Popup";
import echo from "./echo";
import { useNavigate } from "react-router-dom";

function SlotGame() {
  const navigate = useNavigate();
  const simbols = ["🍏", "🥭", "🍇", "🍈", "🍒"];
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [winPopup, setWinPopup] = useState("");
  const [slots, setSlots] = useState(generateRandomSlots());
  const [winChance, setWinChance] = useState(50);
  const [hasCustomWinChance, setHasCustomWinChance] = useState(false);
  const [message, setMessage] = useState("");
  const [autoSpin, setAutoSpin] = useState(false);
  const [bet, setBet] = useState(10);
  const [credits, setCredits] = useState(1000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);

  function generateRandomSlots() {
    return Array(3)
      .fill()
      .map(() =>
        Array(5)
          .fill()
          .map(() => simbols[Math.floor(Math.random() * simbols.length)])
      );
  }

  // Restore session dari localStorage saat pertama load
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");

    if (savedUsername) {
      setUsername(savedUsername);
      fetchUserCredits(savedUsername);
      setIsLoggedIn(true);
    }

    setLoading(false);
  }, []);

  // Fetch user credits dari server dan cek custom win chance
  const fetchUserCredits = async (user) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username: user }),
      });
      const data = await res.json();
      if (data.success) {
        setCredits(data.user.credits);

        // 🔥 Cek apakah user punya custom win chance
        if (
          data.user.custom_win_chance !== null &&
          data.user.custom_win_chance !== undefined
        ) {
          setWinChance(data.user.custom_win_chance);
          setHasCustomWinChance(true);
          console.log(
            "✅ User has custom win chance:",
            data.user.custom_win_chance
          );
        } else {
          // Gunakan global win chance
          fetchGlobalWinChance();
          setHasCustomWinChance(false);
          console.log("✅ User uses global win chance");
        }
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  // Fetch global win chance
  const fetchGlobalWinChance = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/win-chance", {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      setWinChance(data.winChance || 50);
    } catch (error) {
      console.error("Failed to fetch win chance:", error);
    }
  };

  // Check authentication
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/");
    } else {
      setUsername(username);
      fetchUserCredits(username);
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    if (confirm("Yakin ingin logout?")) {
      localStorage.clear();

      if (username) {
        echo.leaveChannel(`user.${username}`);
      }
      echo.leaveChannel("game.settings");

      navigate("/");
    }
  };

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // 🔥 REALTIME: Listen to credits update, reset, dan custom win chance
  useEffect(() => {
    if (!isLoggedIn || !username) return;

    console.log(`✅ Listening to channel: user.${username}`);

    const userChannel = echo.channel(`user.${username}`);

    // Listen untuk CreditsUpdated
    userChannel.listen(".CreditsUpdated", (e) => {
      console.log("✅ Credits updated from admin:", e);
      setCredits(e.credits);
      setMessage(`💰 Admin updated your credits to ${e.credits}!`);
      setTimeout(() => setMessage(""), 5000);
    });

    // Listen untuk UserReset
    userChannel.listen(".UserReset", (e) => {
      console.log("✅ User reset by admin:", e);
      setCredits(e.credits);
      setBet(10);
      setMessage("🔄 Your account has been reset by admin!");
      setTimeout(() => setMessage(""), 5000);
    });

    // 🔥 Listen untuk CustomWinChanceUpdated
    userChannel.listen(".CustomWinChanceUpdated", (e) => {
      console.log("✅ Custom win chance updated:", e);

      if (e.customWinChance !== null && e.customWinChance !== undefined) {
        setWinChance(e.customWinChance);
        setHasCustomWinChance(true);
        setMessage(`🎯 Your personal win chance set to ${e.customWinChance}%`);
      } else {
        // Custom win chance dihapus, kembali ke global
        fetchGlobalWinChance();
        setHasCustomWinChance(false);
        setMessage("🌐 Now using global win chance");
      }

      setTimeout(() => setMessage(""), 5000);
    });

    return () => {
      echo.leaveChannel(`user.${username}`);
    };
  }, [isLoggedIn, username]);

  // 🔥 Heartbeat - Kirim ping setiap 10 detik
  useEffect(() => {
    if (!isLoggedIn || !username) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("http://127.0.0.1:8000/api/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ username }),
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);

    return () => clearInterval(heartbeatInterval);
  }, [isLoggedIn, username]);

  // 🔥 REALTIME: Listen to global win chance changes (hanya jika tidak pakai custom)
  useEffect(() => {
    if (!isLoggedIn || hasCustomWinChance) return;

    console.log("✅ Listening to channel: game.settings");

    const settingsChannel = echo.channel("game.settings");

    settingsChannel.listen(".WinChanceChanged", (e) => {
      console.log("✅ Global win chance changed:", e);
      setWinChance(e.winChance);
      setMessage(`🎲 Win chance updated to ${e.winChance}%`);
      setTimeout(() => setMessage(""), 5000);
    });

    return () => {
      echo.leaveChannel("game.settings");
    };
  }, [isLoggedIn, hasCustomWinChance]);

  // 🔥 AUTO REFRESH: Fetch credits setiap 5 detik sebagai backup
  useEffect(() => {
    if (!isLoggedIn || !username) return;

    const interval = setInterval(() => {
      fetchUserCredits(username);
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoggedIn, username]);

  // Debug WebSocket connection
  useEffect(() => {
    if (!isLoggedIn) return;

    echo.connector.pusher.connection.bind("connected", () => {
      console.log("✅ WebSocket connected!");
    });

    return () => {
      echo.connector.pusher.connection.unbind_all();
    };
  }, [isLoggedIn]);

  // Spin function
  const spin = async () => {
    if (isSpinning || credits < bet) return;

    setIsSpinning(true);
    setMessage("Spinning...");

    const spinInterval = setInterval(() => {
      setSlots(generateRandomSlots());
    }, 50);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, bet }),
      });

      const data = await res.json();

      setTimeout(() => {
        clearInterval(spinInterval);

        if (data.success) {
          setSlots(data.result);
          setCredits(data.credits);

          const msg = data.isWin
            ? `🎉 You Win! +${data.winAmount} credits`
            : "😢 You Lose";
          setMessage(msg);

          if (data.isWin) {
            setWinPopup(msg);
            setTimeout(() => setWinPopup(""), 3000);
          }
        }

        setIsSpinning(false);
      }, 1500);
    } catch (error) {
      clearInterval(spinInterval);
      console.error(error);
      setMessage("❌ Failed to connect to server!");
      setIsSpinning(false);
    }
  };

  const handleAutoSpin = () => setAutoSpin((prev) => !prev);
  const handleMaxBet = () => setBet(credits);

  // Auto spin logic
  useEffect(() => {
    if (!isLoggedIn) return;

    let interval;
    if (autoSpin) {
      interval = setInterval(() => {
        if (!isSpinning && credits >= bet) {
          spin();
        } else if (credits < bet) {
          setAutoSpin(false);
          setMessage("❌ Not enough credits!");
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoSpin, isSpinning, credits, bet, isLoggedIn]);

  const getButtonSize = () => "w-10 h-10 text-xl font-bold";

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#542E22] to-[#2a1711] flex items-center justify-center">
        <div className="text-white text-2xl font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#542E22] flex items-center justify-center p-4">
      <div className="bg-[#133631] rounded-2xl shadow-2xl border-4 border-[#A59A34] p-6 lg:max-w-5xl w-full">
        {/* Disclaemer banner */}
        <div className="bg-yellow-600 border-2 border-yellow-600 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">⚠️</span>
            <p className="text-black font-bold text-center text-sm md:text-base">
              HANYA UNTUK SIMULASI & PEMBELAJARAN - Tidak menggunakan uang asli
            </p>
            <span className="text-2xl">⚠️</span>
          </div>
        </div>
        {/* Header atas */}
        <div className="bg-[#184841] rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <div className="text-yellow-300 text-xl font-bold font-mono">
              👋 Welcome, {username}!
            </div>
            <div className="flex gap-2">
              {/* Tombol Dashboard (khusus admin) */}
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg font-mono transition-all hover:scale-105"
                >
                  📊 DASHBOARD
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg font-mono transition-all hover:scale-105"
              >
                LOGOUT
              </button>
            </div>
          </div>
          <div className="flex justify-center items-center gap-4 flex-wrap md:flex-nowrap ">
            <div className="bg-red-600 rounded-xl p-2 md:w-[310px] w-full">
              <div className="text-yellow-300 text-lg font-bold font-mono">
                CREDITS
              </div>
              <div className="text-white text-2xl font-mono ">{credits}</div>
            </div>
            <div className="bg-blue-600 rounded-xl p-2 md:w-[310px] w-full">
              <div className="text-yellow-300 text-lg font-bold font-mono">
                BET
              </div>
              <div className="text-white text-2xl font-mono">{bet}</div>
            </div>
            <div className="bg-[#cd8a04] rounded-lg p-2 md:w-[310px] w-full">
              <div className="text-yellow-300 text-lg font-bold font-mono">
                WIN CHANCE
              </div>
              <div className="text-white text-2xl font-mono">50%</div>
            </div>
          </div>
        </div>

        {/* Area Slot */}
        <div className="bg-[#1E2524] rounded-xl shadow-2xl border-8 border-[#309A67] p-4 mb-4">
          {slots.map((row, i) => (
            <div
              key={i}
              className="flex justify-center gap-2 sm:gap-10 md:gap-16 lg:gap-20 mb-2"
            >
              {row.map((simbol, j) => (
                <Slot key={`${i}-${j}`} simbol={simbol} />
              ))}
            </div>
          ))}
        </div>
        {message && (
          <div
            className={`text-center mt-2 mb-2 font-mono text-xl ${
              message.includes("Win")
                ? "text-green-400"
                : message.includes("Lose")
                ? "text-red-400"
                : message.includes("Not enough")
                ? "text-orange-400"
                : "text-yellow-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4 md:flex-nowrap ">
          {/* Tombol Bet */}
          <div className="bg-[#184841] shadow-2xl rounded-xl p-4 flex items-center gap-2 w-full justify-center">
            <span className="md:text-2xl text-xl font-bold font-mono text-white">
              BET:
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBet((prev) => Math.max(prev - 10, 10))}
                className={`bg-red-600 text-white rounded-full ${getButtonSize()} hover:bg-red-700 active:scale-95`}
                disabled={isSpinning}
              >
                -
              </button>

              <input
                type="number"
                value={bet}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (value < 10) setBet(10);
                  else if (value > credits) setBet(credits);
                  else setBet(value);
                }}
                min={10}
                max={credits}
                className="text-white text-lg font-mono px-3 py-1 bg-[#352F2F] rounded w-24 text-center outline-none focus:ring-2 focus:ring-green-500
             [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />

              <button
                onClick={() => setBet((prev) => Math.min(prev + 10, credits))}
                className={`bg-green-600 text-white rounded-full ${getButtonSize()} hover:bg-green-700 active:scale-95`}
                disabled={isSpinning}
              >
                +
              </button>
            </div>
          </div>
          {/*Tombol kontrol*/}
          <div className="bg-[#184841] rounded-xl shadow-2xl p-4 lg:gap-3 gap-4 flex items-center justify-center w-full flex-wrap lg:flex-nowrap">
            <button
              onClick={spin}
              disabled={isSpinning || credits < bet}
              className="bg-[#FA7436] text-white font-bold font-mono flex items-center justify-center lg:text-2xl rounded-xl lg:w-48 lg:h-14 md:w-72 md:h-12 md:text-xl w-28 h-10 text-base hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpinning ? "SPINNING..." : "SPIN"}
            </button>
            <button
              onClick={handleMaxBet}
              disabled={isSpinning}
              className="bg-[#E9BB31] text-white font-bold font-mono flex items-center justify-center lg:text-2xl rounded-xl lg:w-48 lg:h-14 md:w-72 md:h-12 md:text-xl w-28 h-10 text-base hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              MAX BET
            </button>
            <button
              onClick={handleAutoSpin}
              disabled={credits < bet}
              className={`${
                autoSpin ? "bg-red-600" : "bg-[#616CB3]"
              } text-white font-bold font-mono flex items-center justify-center rounded-xl lg:w-48 lg:h-14 md:w-72 md:h-12 md:text-xl w-72 h-10 text-base hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {autoSpin ? "STOP AUTO" : "AUTO SPIN"}
            </button>
          </div>
        </div>
        {/*playtable*/}
        <div className="bg-[#184841] rounded-xl shadow-2xl p-4">
          <span className="font-bold font-mono text-white text-xl flex items-center justify-center mb-2.5">
            PAYTABLE (xBet)
          </span>
          <div className="flex flex-wrap justify-center gap-4 md:gap-10 lg:gap-14">
            {[
              ["🍏", 2],
              ["🥭", 3],
              ["🍇", 5],
              ["🍈", 4],
              ["🍒", 10],
            ].map(([s, x]) => (
              <div
                key={s}
                className="bg-[#57634B80] sm:w-32 sm:h-16 w-16 h-16 text-xl flex flex-col items-center justify-center rounded-lg p-2"
              >
                <span>{s}</span>
                <span className="text-white font-mono sm:text-lg text-base">
                  x{x}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {winPopup && <Popup message={winPopup} />}
    </div>
  );
}

export default SlotGame;
