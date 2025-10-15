"use client";

import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import './purchaseCreditsModal.css'

interface Package {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  daily_credits: number;
}



export default function PurchaseCreditsModal({ isOpen, onClose, packages, onPurchase }: any) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setIsProcessing(true);
    try {
      await onPurchase(selectedPackage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-indepent">
        {/* 关闭按钮 */}
        <button className="close-btn" onClick={onClose}>×</button>

        <h2 className="modal-title">Choose Your Plan</h2>
        <p className="modal-subtitle">Select a package to increase your daily credits.</p>

        {/* 套餐卡片网格 */}
        {/* <div className="package-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`package-card ${selectedPackage?.id === pkg.id ? "selected" : ""}`}
              onClick={() => setSelectedPackage(pkg)}
            >
              <h3 className="package-name">{pkg.name}</h3>
              <p className="package-price">
                <span className="current-price">¥{pkg.price}</span>
                {pkg.original_price && (
                  <span className="original-price">¥{pkg.original_price}</span>
                )}
              </p>
              <p className="package-credits">{pkg.daily_credits} credits / day</p>
              {selectedPackage?.id === pkg.id && (
                <span className="checkmark"><FiCheck /></span>
              )}
            </div>
          ))}
        </div> */}

        {/* 底部按钮 */}
        <div className="modal-actions">
          <button className="btn cancel" onClick={onClose}>Cancel</button>
          <button
            className={`btn purchase ${!selectedPackage || isProcessing ? "disabled" : ""}`}
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
          >
            {isProcessing ? "Processing..." : "Purchase Now"}
          </button>
        </div>
      </div>

    </div>
  );
}