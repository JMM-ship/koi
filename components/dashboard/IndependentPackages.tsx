"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

interface Package {
  id: number;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  description: string;
  savings?: string;
}

const packages: Package[] = [
  { 
    id: 1,
    name: "Starter",
    credits: 10000, 
    price: 9.99,
    description: "Perfect for trying out"
  },
  { 
    id: 2,
    name: "Popular", 
    credits: 50000, 
    price: 39.99,
    originalPrice: 49.99,
    popular: true,
    description: "Most popular choice",
    savings: "Save 20%"
  },
  { 
    id: 3,
    name: "Professional",
    credits: 100000, 
    price: 69.99,
    originalPrice: 99.99,
    description: "Best value",
    savings: "Save 30%"
  },
  { 
    id: 4,
    name: "Enterprise",
    credits: 500000, 
    price: 299.99,
    originalPrice: 499.99,
    description: "Enterprise package",
    savings: "Save 40%"
  }
];

interface IndependentPackagesProps {
  onBack: () => void;
}

const IndependentPackages = ({ onBack }: IndependentPackagesProps) => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement actual purchase logic
      const selected = packages.find(pkg => pkg.id === selectedPackage);
      console.log("Purchasing package:", selected);
      await new Promise(resolve => setTimeout(resolve, 2000));
      onBack(); // Return to credits view after purchase
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="balance-card" style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s',
      height: '100%',
      minHeight: '400px'
    }}>
      {/* Header with back button */}
      <div className="d-flex align-items-center" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            padding: '0.5rem',
            marginRight: '0.5rem',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a1a';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#999';
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', margin: 0 }}>
          Choose Your Package
        </h3>
      </div>

      {/* Package Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, minmax(100px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
        flex: 1,
        minHeight: '250px'
      }}>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            style={{
              background: selectedPackage === pkg.id 
                ? 'linear-gradient(135deg, rgba(255, 165, 0, 0.15), rgba(255, 140, 0, 0.15))'
                : '#111111',
              border: selectedPackage === pkg.id 
                ? '2px solid #ffa500' 
                : '1px solid #2a2a2a',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '100px'
            }}
            onMouseEnter={(e) => {
              if (selectedPackage !== pkg.id) {
                e.currentTarget.style.borderColor = '#3a3a3a';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPackage !== pkg.id) {
                e.currentTarget.style.borderColor = '#2a2a2a';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {pkg.popular && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #ffa500, #ff8c00)',
                color: '#000',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.5rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>
                Popular
              </div>
            )}

            {selectedPackage === pkg.id && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffa500, #ff8c00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={12} color="#000" strokeWidth={3} />
              </div>
            )}
            
            <div style={{ fontSize: '0.625rem', color: '#999', marginBottom: '0.25rem' }}>
              {pkg.name}
            </div>
            
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              color: '#ffa500',
              marginBottom: '0.25rem'
            }}>
              {(pkg.credits / 1000)}k
            </div>
            
            <div style={{ fontSize: '0.5rem', color: '#666', marginBottom: '0.5rem' }}>
              Credits
            </div>
            
            <div style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              ${pkg.price}
            </div>
            
            {pkg.originalPrice && (
              <div style={{
                fontSize: '0.625rem',
                color: '#666',
                textDecoration: 'line-through',
                marginBottom: '0.25rem'
              }}>
                ${pkg.originalPrice}
              </div>
            )}
            
            {pkg.savings && (
              <div style={{
                fontSize: '0.5rem',
                color: '#4ade80',
                fontWeight: '600'
              }}>
                {pkg.savings}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={!selectedPackage || isProcessing}
        style={{
          background: selectedPackage && !isProcessing
            ? 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)'
            : '#333',
          border: 'none',
          borderRadius: '0.375rem',
          padding: '0.625rem',
          color: selectedPackage && !isProcessing ? '#fff' : '#666',
          fontSize: '0.8125rem',
          fontWeight: '600',
          cursor: selectedPackage && !isProcessing ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s',
          width: '100%'
        }}
        onMouseEnter={(e) => {
          if (selectedPackage && !isProcessing) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedPackage && !isProcessing) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isProcessing ? 'Processing...' : selectedPackage ? 'Purchase Now' : 'Select a Package'}
      </button>
    </div>
  );
};

export default IndependentPackages;