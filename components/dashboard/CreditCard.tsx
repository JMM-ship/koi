"use client";

const CreditCard = () => {
  return (
    <div className="credit-card-section">
      <h3 className="section-title">Your cards</h3>
      
      <div className="credit-card">
        <div className="card-gradient"></div>
        
        <div className="card-content">
          <div className="card-logo">VISA</div>
          
          <div className="card-number">
            <span className="dots">•••• •••• ••••</span>
            <span className="last-digits">1566</span>
          </div>
          
          <div className="card-bottom">
            <div className="card-date">06/26</div>
            <div className="card-chip">
              <span className="chip-icon">💳</span>
            </div>
            <div className="card-brand">
              <div className="mastercard-circles">
                <span className="circle yellow"></span>
                <span className="circle red"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCard;