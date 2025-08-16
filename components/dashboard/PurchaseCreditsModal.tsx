"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const creditPackages = [
  { 
    id: 1, 
    credits: 10000, 
    price: 9.99, 
    popular: false,
    description: "Perfect for trying out"
  },
  { 
    id: 2, 
    credits: 50000, 
    price: 39.99, 
    popular: true,
    description: "Most popular choice",
    savings: "Save 20%"
  },
  { 
    id: 3, 
    credits: 100000, 
    price: 69.99, 
    popular: false,
    description: "Best value",
    savings: "Save 30%"
  },
  { 
    id: 4, 
    credits: 500000, 
    price: 299.99, 
    popular: false,
    description: "Enterprise package",
    savings: "Save 40%"
  }
];

const PurchaseCreditsModal = ({ isOpen, onClose }: PurchaseCreditsModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement actual purchase logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      console.log("Purchasing package:", selectedPackage);
      onClose();
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content"
        style={{
          background: 'linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 100%)',
          border: '1px solid #2a2a2a',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 20px 60px rgba(255, 165, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2a2a2a';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#999';
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#fff',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #ffa500, #ff8c00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Purchase Credits
          </h2>
          <p style={{ color: '#999', fontSize: '0.875rem' }}>
            Choose a package that suits your needs
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {creditPackages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              style={{
                background: selectedPackage === pkg.id 
                  ? 'linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 140, 0, 0.1))'
                  : '#1a1a1a',
                border: selectedPackage === pkg.id 
                  ? '2px solid #ffa500' 
                  : '1px solid #2a2a2a',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative',
                transform: selectedPackage === pkg.id ? 'scale(1.02)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (selectedPackage !== pkg.id) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 165, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPackage !== pkg.id) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ffa500, #ff8c00)',
                  color: '#000',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.625rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  Most Popular
                </div>
              )}
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#ffa500',
                  marginBottom: '0.25rem'
                }}>
                  {pkg.credits.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '1rem' }}>
                  Credits
                </div>
                
                <div style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 'bold', 
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  ${pkg.price}
                </div>
                
                {pkg.savings && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#4ade80',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    {pkg.savings}
                  </div>
                )}
                
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#6b7280',
                  marginTop: '0.5rem'
                }}>
                  {pkg.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #2a2a2a',
              background: 'transparent',
              color: '#999',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#999';
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: selectedPackage && !isProcessing
                ? 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)'
                : '#333',
              color: selectedPackage && !isProcessing ? '#fff' : '#666',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: selectedPackage && !isProcessing ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (selectedPackage && !isProcessing) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 165, 0, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPackage && !isProcessing) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isProcessing ? 'Processing...' : 'Purchase Now'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PurchaseCreditsModal;