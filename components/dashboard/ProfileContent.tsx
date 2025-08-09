"use client";

import { useState } from "react";
import { FiUser, FiMail, FiLock, FiShield, FiCopy, FiEye, FiEyeOff } from "react-icons/fi";
import Image from "next/image";

export default function ProfileContent() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [nickname, setNickname] = useState("twosquarenoocat");
  const [avatarUrl, setAvatarUrl] = useState("https://lh3.googleusercontent.com/a/ACg8ocLoi4Wy0mXNmSSamEy-IG-hwMlvxEdlkzxPgQb2M2jfypWN3H4=s96-c");

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(avatarUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveProfile = () => {
    console.log("Saving profile...");
  };

  const handleVerifyPassword = () => {
    console.log("Verifying password...");
  };

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <div className="mb-4">
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
          Personal Settings
        </h1>
        <p style={{ fontSize: '14px', color: '#999' }}>
          Manage your personal information and account security
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Personal Information Section */}
        <div className="balance-card" style={{
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div className="d-flex align-items-center mb-4">
            <FiUser style={{ fontSize: '20px', color: '#794aff', marginRight: '10px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Personal Information
            </h3>
          </div>
          
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
            Update your personal information and avatar
          </p>

          {/* Avatar Section */}
          <div className="mb-4">
            <label style={{ fontSize: '12px', color: '#999', marginBottom: '12px', display: 'block' }}>
              Avatar URL
            </label>
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#fff',
                fontWeight: 'bold',
                overflow: 'hidden'
              }}>
                <Image
                  src="/assets/img/team/team-1.jpg"
                  alt="Avatar"
                  width={60}
                  height={60}
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#999',
                      fontSize: '12px',
                      flex: 1,
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleCopyUrl}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedUrl ? '#00d084' : '#666',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <FiCopy />
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginTop: '8px', margin: 0 }}>
                  Support jpg, png, gif format image links
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Email Field */}
            <div>
              <label style={{ fontSize: '12px', color: '#999', marginBottom: '8px', display: 'block' }}>
                Email Address
              </label>
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  type="email"
                  value="twosquarenoocat@gmail.com"
                  disabled
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    fontSize: '14px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
              </div>
              <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                Email address cannot be modified
              </p>
            </div>

            {/* Nickname Field */}
            <div>
              <label style={{ fontSize: '12px', color: '#999', marginBottom: '8px', display: 'block' }}>
                Nickname
              </label>
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSaveProfile}
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 74, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Save Profile
            </button>
          </div>
        </div>

        {/* Password Settings Section */}
        <div className="balance-card" style={{
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div className="d-flex align-items-center mb-4">
            <FiLock style={{ fontSize: '20px', color: '#794aff', marginRight: '10px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
              Password Settings
            </h3>
          </div>
          
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
            Change your login password to protect account security
          </p>

          {/* Current Password */}
          <div className="mb-4">
            <label style={{ fontSize: '12px', color: '#999', marginBottom: '8px', display: 'block' }}>
              Current Password
            </label>
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px',
                  flex: 1,
                  outline: 'none'
                }}
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* New Password */}
            <div>
              <label style={{ fontSize: '12px', color: '#999', marginBottom: '8px', display: 'block' }}>
                New Password
              </label>
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize: '12px', color: '#999', marginBottom: '8px', display: 'block' }}>
                Confirm Password
              </label>
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleVerifyPassword}
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #794aff 0%, #b084ff 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 74, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <FiShield style={{ fontSize: '16px' }} />
              Verify Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}