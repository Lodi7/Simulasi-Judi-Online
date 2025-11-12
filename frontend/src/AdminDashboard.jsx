import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [winChance, setWinChance] = useState(50);
  const [newWinChance, setNewWinChance] = useState(50);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // State untuk custom win chance modal
  const [showCustomWinModal, setShowCustomWinModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [customWinValue, setCustomWinValue] = useState(50);

  // State untuk password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const adminAuth = localStorage.getItem("adminAuthenticated") === "true";

    if (!isAdmin || !adminAuth) {
      navigate("/");
    }
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/users", {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      setUsers(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setLoading(false);
    }
  };

  const fetchWinChance = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/win-chance", {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      setWinChance(data.winChance || 50);
      setNewWinChance(data.winChance || 50);
    } catch (error) {
      console.error("Failed to fetch win chance:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchWinChance();

    const interval = setInterval(fetchUsers, 3000);
    return () => clearInterval(interval);
  }, []);

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(""), 3000);
  };

  // Update global win chance dengan opsi reset custom
  const handleUpdateWinChance = async (resetCustom = false) => {
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/admin/global-win-chance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            win_chance: newWinChance,
            reset_custom: resetCustom,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setWinChance(data.win_chance);
        showMessage(
          `✅ Global win chance updated to ${data.win_chance}%` +
            (resetCustom ? " (all custom rates reset)" : ""),
          "success"
        );
        await fetchUsers();
      }
    } catch (err) {
      console.error("Request error:", err);
      showMessage("❌ Failed to update win chance", "error");
    }
  };

  // Open modal untuk set custom win chance
  const handleOpenCustomWinModal = (user) => {
    setSelectedUser(user);
    setCustomWinValue(
      user.custom_win_chance || user.effective_win_chance || 50
    );
    setShowCustomWinModal(true);
  };

  // Set custom win chance untuk user
  const handleSetCustomWinChance = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${selectedUser.id}/custom-win-chance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ custom_win_chance: customWinValue }),
        }
      );

      const data = await res.json();

      if (data.success) {
        showMessage(
          `✅ Custom win chance set to ${customWinValue}% for ${selectedUser.username}`,
          "success"
        );
        setShowCustomWinModal(false);
        await fetchUsers();
      } else {
        showMessage(
          "❌ " + (data.message || "Failed to set custom win chance"),
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to set custom win chance:", error);
      showMessage("❌ Failed to set custom win chance", "error");
    }
  };

  // Remove custom win chance (kembali ke global)
  const handleRemoveCustomWinChance = async (userId, username) => {
    if (
      !confirm(
        `Remove custom win chance for ${username}? They will use global rate.`
      )
    )
      return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${userId}/custom-win-chance`,
        { method: "DELETE", headers: { Accept: "application/json" } }
      );

      const data = await res.json();

      if (data.success) {
        showMessage(`✅ ${username} now uses global win chance`, "success");
        await fetchUsers();
      } else {
        showMessage(
          "❌ " + (data.message || "Failed to remove custom win chance"),
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to remove custom win chance:", error);
      showMessage("❌ Failed to remove custom win chance", "error");
    }
  };

  // Handle change password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage("❌ Password baru tidak cocok!", "error");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage("❌ Password minimal 6 karakter!", "error");
      return;
    }

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/admin/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            current_password: passwordForm.currentPassword,
            new_password: passwordForm.newPassword,
            new_password_confirmation: passwordForm.confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        showMessage("✅ Password berhasil diubah!", "success");
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showMessage(
          "❌ " + (data.message || "Gagal mengubah password"),
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      showMessage("❌ Gagal terhubung ke server", "error");
    }
  };

  // Reset user
  const handleResetUser = async (id) => {
    if (!confirm("Are you sure you want to reset this user's stats?")) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${id}/reset`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
        }
      );
      const data = await res.json();

      if (data.success) {
        showMessage("✅ User stats reset successfully", "success");
        await fetchUsers();
      } else {
        showMessage("❌ " + (data.message || "Failed to reset user"), "error");
      }
    } catch (error) {
      console.error("Failed to reset user:", error);
      showMessage("❌ Failed to reset user", "error");
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        showMessage("✅ User deleted successfully", "success");
        await fetchUsers();
      } else {
        showMessage("❌ " + (data.message || "Failed to delete user"), "error");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      showMessage("❌ Failed to delete user", "error");
    }
  };

  // Promote user to admin
  const handlePromoteToAdmin = async (id) => {
    if (!confirm("Are you sure you want to promote this user to admin?"))
      return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${id}/promote`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
        }
      );
      const data = await res.json();

      if (data.success) {
        showMessage("✅ User promoted to admin successfully", "success");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === id ? { ...user, is_admin: true } : user
          )
        );
        await fetchUsers();
      } else {
        showMessage(
          "❌ " + (data.message || "Failed to promote user"),
          "error"
        );
      }
    } catch (error) {
      showMessage("❌ Failed to promote user", "error");
    }
  };

  // Demote admin to regular user
  const handleDemoteFromAdmin = async (id) => {
    if (!confirm("Are you sure you want to demote this admin to regular user?"))
      return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${id}/demote`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
        }
      );
      const data = await res.json();

      if (data.success) {
        showMessage("✅ Admin demoted to user successfully", "success");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === id ? { ...user, is_admin: false } : user
          )
        );
        await fetchUsers();
      } else {
        showMessage(
          "❌ " + (data.message || "Failed to demote admin"),
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to demote admin:", error);
      showMessage("❌ Failed to demote admin", "error");
    }
  };

  const totalUsers = users.length;
  const onlineUsers = users.filter((u) => u.is_online).length;
  const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
  const usersWithCustom = users.filter((u) => u.uses_custom).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              🎰 Admin Dashboard
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 sm:px-6 rounded-lg transition-all text-sm sm:text-base"
              >
                <span className="hidden sm:inline">🔐 CHANGE PASSWORD</span>
                <span className="sm:hidden">🔐 PASSWORD</span>
              </button>
              <button
                onClick={() => navigate("/game")}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 sm:px-6 rounded-lg transition-all text-sm sm:text-base"
              >
                <span className="hidden sm:inline">🎮 PLAY GAME</span>
                <span className="sm:hidden">🎮 PLAY</span>
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate("/");
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-6 rounded-lg transition-all text-sm sm:text-base"
              >
                LOGOUT
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-blue-600 rounded-lg p-3 sm:p-4">
              <div className="text-blue-200 text-xs sm:text-sm font-semibold">
                TOTAL USERS
              </div>
              <div className="text-white text-2xl sm:text-3xl font-bold">
                {totalUsers}
              </div>
            </div>
            <div className="bg-green-600 rounded-lg p-3 sm:p-4">
              <div className="text-green-200 text-xs sm:text-sm font-semibold">
                ONLINE USERS
              </div>
              <div className="text-white text-2xl sm:text-3xl font-bold">
                {onlineUsers}
              </div>
            </div>
            <div className="bg-yellow-600 rounded-lg p-3 sm:p-4">
              <div className="text-yellow-200 text-xs sm:text-sm font-semibold">
                TOTAL CREDITS
              </div>
              <div className="text-white text-2xl sm:text-3xl font-bold">
                {totalCredits.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-600 rounded-lg p-3 sm:p-4">
              <div className="text-purple-200 text-xs sm:text-sm font-semibold">
                CUSTOM RATES
              </div>
              <div className="text-white text-2xl sm:text-3xl font-bold">
                {usersWithCustom}
              </div>
            </div>
          </div>

          {/* Win Chance Control */}
          <div className="bg-gray-700 rounded-lg p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3">
              🎲 Global Win Chance Control
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1">
                <label className="block text-gray-300 mb-2 text-xs sm:text-sm">
                  Current: {winChance}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newWinChance ?? 50}
                  onChange={(e) => setNewWinChance(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-gray-400 text-xs mt-1">
                  <span>0%</span>
                  <span className="text-white font-bold">{newWinChance}%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col gap-2">
                <button
                  onClick={() => handleUpdateWinChance(false)}
                  className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition-all whitespace-nowrap text-sm"
                >
                  Update Global
                </button>
                <button
                  onClick={() => handleUpdateWinChance(true)}
                  className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition-all whitespace-nowrap text-sm"
                >
                  Update & Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm sm:text-base ${
                message.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              👥 User Management
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Username
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Win Rate
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Credits
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase hidden md:table-cell">
                    Total Bets
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase hidden lg:table-cell">
                    W/L
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase hidden xl:table-cell">
                    Last Active
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_online
                              ? "bg-green-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          <span className="hidden sm:inline">
                            {user.is_online ? "🟢 Online" : "⚫ Offline"}
                          </span>
                          <span className="sm:hidden">
                            {user.is_online ? "🟢" : "⚫"}
                          </span>
                        </span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-white">
                        <div className="max-w-[80px] sm:max-w-none truncate">
                          {user.username || "Unknown"}
                        </div>
                        <div className="sm:hidden text-xs text-gray-400 mt-1">
                          {user.is_admin ? "👑 Admin" : "👤 User"}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_admin
                              ? "bg-purple-600 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {user.is_admin ? "👑 Admin" : "👤 User"}
                        </span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              user.uses_custom
                                ? "text-purple-400"
                                : "text-gray-300"
                            }`}
                          >
                            {user.effective_win_chance}%
                          </span>
                          {user.uses_custom && (
                            <span className="text-xs text-purple-400">⭐</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                        {(user.credits || 0).toLocaleString()}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300 hidden md:table-cell">
                        {(user.total_bets || 0).toLocaleString()}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden lg:table-cell">
                        <span className="text-green-400">
                          {user.total_wins || 0}
                        </span>
                        {" / "}
                        <span className="text-red-400">
                          {user.total_losses || 0}
                        </span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300 hidden xl:table-cell">
                        {user.last_active
                          ? new Date(user.last_active).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs font-medium">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleOpenCustomWinModal(user)}
                            className="text-purple-400 hover:text-purple-300 text-left"
                          >
                            {user.uses_custom ? "Edit Rate" : "Set Rate"}
                          </button>
                          {user.uses_custom && (
                            <button
                              onClick={() =>
                                handleRemoveCustomWinChance(
                                  user.id,
                                  user.username
                                )
                              }
                              className="text-orange-400 hover:text-orange-300 text-left"
                            >
                              Clear Rate
                            </button>
                          )}
                          <button
                            onClick={() => handleResetUser(user.id)}
                            className="text-yellow-400 hover:text-yellow-300 text-left"
                          >
                            Reset Stats
                          </button>
                          {user.is_admin ? (
                            <button
                              onClick={() => handleDemoteFromAdmin(user.id)}
                              className="text-orange-400 hover:text-orange-300 text-left"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePromoteToAdmin(user.id)}
                              className="text-green-400 hover:text-green-300 text-left"
                            >
                              Promote
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 text-left"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Custom Win Chance */}
      {showCustomWinModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                🎯 Set Custom Win Rate
              </h2>
              <button
                onClick={() => setShowCustomWinModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm sm:text-base text-gray-300 mb-2">
                User:{" "}
                <span className="text-white font-bold">
                  {selectedUser.username}
                </span>
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Current:{" "}
                {selectedUser.uses_custom ? (
                  <span className="text-purple-400">
                    Custom {selectedUser.custom_win_chance}%
                  </span>
                ) : (
                  <span className="text-gray-300">
                    Global {selectedUser.effective_win_chance}%
                  </span>
                )}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm sm:text-base text-gray-300 mb-2">
                Custom Win Chance: {customWinValue}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customWinValue}
                onChange={(e) => setCustomWinValue(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-gray-400 text-xs mt-1">
                <span>0%</span>
                <span className="text-purple-400 font-bold">
                  {customWinValue}%
                </span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomWinModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 sm:py-3 rounded-lg text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSetCustomWinChance}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 sm:py-3 rounded-lg text-sm sm:text-base"
              >
                Set Custom Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                🔐 Change Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-gray-300 mb-2 text-xs sm:text-sm">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg sm:text-xl"
                  >
                    {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-gray-300 mb-2 text-xs sm:text-sm">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg sm:text-xl"
                  >
                    {showNewPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-300 mb-2 text-xs sm:text-sm">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg sm:text-xl"
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 sm:py-3 rounded-lg transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 sm:py-3 rounded-lg transition-all text-sm sm:text-base"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
