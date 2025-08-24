"use client";

import { useState, useEffect } from "react";
import { FiUser, FiMail, FiLock, FiShield, FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";

export default function ProfileContent() {
  const { data: session } = useSession();
  const { showSuccess, showError, showInfo } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 获取用户信息
  useEffect(() => {
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setNickname(data.nickname || "");
        setAvatarUrl(data.avatarUrl || "");
        setEmail(data.email || "");
      }
    } catch (error) {
      showError("Failed to fetch profile");
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(avatarUrl);
    setCopiedUrl(true);
    showInfo("Avatar URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveProfile = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          avatarUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess("Profile updated successfully!");
      } else {
        showError(data.error || "Failed to update profile");
      }
    } catch (error) {
      showError("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    setLoading(true);

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("All password fields are required");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess("Password changed successfully!");
        // 清空密码字段
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showError(data.error || "Failed to change password");
      }
    } catch (error) {
      showError("An error occurred while changing password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-content-wrapper">
      {/* 页面标题 */}
      <div className="profile-header">
        <h1 className="profile-title">Personal Settings</h1>
        <p className="profile-subtitle">
          Manage your personal information and account security
        </p>
      </div>


      {/* 内容区域 */}
      <div className="profile-cards-container">
        {/* Personal Information Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <FiUser className="profile-card-icon" />
            <h3 className="profile-card-title">Personal Information</h3>
          </div>

          <p className="profile-card-description">
            Update your personal information and avatar
          </p>

          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <label className="profile-label">Avatar URL</label>
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                <Image
                  src={avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : ""}
                  alt="Avatar"
                  width={60}
                  height={60}
                  style={{ objectFit: 'cover' }}
                  unoptimized={avatarUrl as any && (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://"))}
                />
              </div>
              <div className="profile-avatar-input-wrapper">
                <div className="profile-input-group">
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="profile-input"
                    placeholder="Enter avatar URL"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className={`profile-copy-btn ${copiedUrl ? 'copied' : ''}`}
                  >
                    <FiCopy />
                  </button>
                </div>
                <p className="profile-input-hint">
                  Support jpg, png, gif format image links
                </p>
              </div>
            </div>
          </div>

          <div className="profile-form-grid">
            {/* Email Field */}
            <div className="profile-form-group">
              <label className="profile-label">Email Address</label>
              <div className="profile-input-wrapper">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="profile-input disabled"
                />
              </div>
              <p className="profile-input-hint">
                Email address cannot be modified
              </p>
            </div>

            {/* Nickname Field */}
            <div className="profile-form-group">
              <label className="profile-label">Nickname</label>
              <div className="profile-input-wrapper">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="profile-input"
                  placeholder="Enter nickname"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="profile-button-container">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="profile-btn profile-btn-primary"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Password Settings Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <FiLock className="profile-card-icon" />
            <h3 className="profile-card-title">Password Settings</h3>
          </div>

          <p className="profile-card-description">
            Change your login password to protect account security
          </p>

          {/* Current Password */}
          <div className="profile-form-group">
            <label className="profile-label">Current Password</label>
            <div className="profile-input-group">
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="profile-input"
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="profile-password-toggle"
              >
                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="profile-form-grid">
            {/* New Password */}
            <div className="profile-form-group">
              <label className="profile-label">New Password</label>
              <div className="profile-input-group">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="profile-input"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="profile-password-toggle"
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="profile-form-group">
              <label className="profile-label">Confirm Password</label>
              <div className="profile-input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="profile-input"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="profile-password-toggle"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <div className="profile-button-container">
            <button
              onClick={handleVerifyPassword}
              disabled={loading}
              className="profile-btn profile-btn-primary"
            >
              <FiShield className="profile-btn-icon" />
              {loading ? 'Verifying...' : 'Verify Password'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-content-wrapper {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .profile-header {
          margin-bottom: 30px;
        }

        .profile-title {
          font-size: 28px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8px;
          font-family: "Libre Franklin", sans-serif;
        }

        .profile-subtitle {
          font-size: 14px;
          color: #999;
        }


        .profile-cards-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 28px;
          transition: all 0.3s ease;
        }

        .profile-card:hover {
          border-color: #794aff;
          box-shadow: 0 4px 20px rgba(121, 74, 255, 0.1);
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .profile-card-icon {
          font-size: 20px;
          color: #794aff;
          margin-right: 12px;
        }

        .profile-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin: 0;
          font-family: "Libre Franklin", sans-serif;
        }

        .profile-card-description {
          font-size: 13px;
          color: #666;
          margin-bottom: 28px;
        }

        .profile-avatar-section {
          margin-bottom: 28px;
        }

        .profile-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 12px;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-avatar-container {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .profile-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid #794aff;
        }

        .profile-avatar-input-wrapper {
          flex: 1;
        }

        .profile-input-group {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 0;
          display: flex;
          align-items: center;
          transition: all 0.3s;
        }

        .profile-input-group:focus-within {
          border-color: #794aff;
          box-shadow: 0 0 0 3px rgba(121, 74, 255, 0.1);
        }

        .profile-input {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 14px;
          padding: 12px 14px;
          flex: 1;
          outline: none;
          width: 100%;
        }

        .profile-input::placeholder {
          color: #666;
        }

        .profile-input.disabled {
          color: #666;
          cursor: not-allowed;
        }

        .profile-input-wrapper {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .profile-input-wrapper:focus-within {
          border-color: #794aff;
          box-shadow: 0 0 0 3px rgba(121, 74, 255, 0.1);
        }

        .profile-copy-btn,
        .profile-password-toggle {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 12px;
          transition: color 0.3s;
        }

        .profile-copy-btn:hover,
        .profile-password-toggle:hover {
          color: #794aff;
        }

        .profile-copy-btn.copied {
          color: #00d084;
        }

        .profile-input-hint {
          font-size: 11px;
          color: #666;
          margin-top: 8px;
        }

        .profile-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }

        .profile-form-group {
          display: flex;
          flex-direction: column;
        }

        .profile-button-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .profile-btn {
          padding: 12px 32px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .profile-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .profile-btn-primary {
          background: linear-gradient(135deg, #794aff 0%, #b084ff 100%);
          color: #fff;
          box-shadow: 0 4px 15px rgba(121, 74, 255, 0.3);
        }

        .profile-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(121, 74, 255, 0.4);
        }

        .profile-btn-icon {
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .profile-content-wrapper {
            padding: 15px;
          }

          .profile-title {
            font-size: 24px;
          }

          .profile-card {
            padding: 20px;
          }

          .profile-form-grid {
            grid-template-columns: 1fr;
          }

          .profile-avatar-container {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}