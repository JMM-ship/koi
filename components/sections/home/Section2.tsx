import Link from "next/link";

export default function Section2() {
    return (
        <>
            {/* ai-solutions-home section 2 - Core Advantages */}
            <section className="ai-solutions-home-section-2 position-relative overflow-hidden pt-120 pb-120">
                <div className="container position-relative z-1">
                    <div className="row justify-content-center mb-5">
                        <div className="d-flex align-items-center gap-3 justify-content-center">
                            <span className="small-line" />
                            <span className="btn-text text-primary">why choose us</span>
                            <span className="small-line" />
                        </div>
                        <div className="col-12 text-center">
                            <h2 className="text-dark fw-bold mb-3 text-anime-style-3">Our Core Advantages</h2>
                            <p className="text-secondary fs-5 mb-0">Based on a dynamic pool of official Max accounts worth $200 each, we provide a service experience identical to the official one.</p>
                        </div>
                    </div>
                    <div className="row g-4 justify-content-center">
                        {/* Card 1: Account Security */}
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-5 h-100 text-center border" data-aos="fade-up" data-aos-delay={0}>
                                <div className="mb-3">
                                    <img src="/assets/imgs/pages/ai-solutions/page-home/home-section-3/icon-1.svg" alt="Security" style={{ width: 48, height: 48 }} />
                                </div>
                                <h4 className="fw-bold mb-2">Account Security</h4>
                                <div className="fw-bold text-primary mb-2">Technical Transfer, Zero Ban Risk</div>
                                <p className="text-secondary mb-4">Professional technical architecture ensures your account is completely safe. With our technical transfer method, your account will never face any ban risk.</p>
                                <div>
                                    <span className="badge text-white bg-primary bg-opacity-10 px-3 py-2 rounded-pill">Use with confidence!</span>
                                </div>
                            </div>
                        </div>
                        {/* Card 2: Points Pool */}
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-5 h-100 text-center border" data-aos="fade-up" data-aos-delay={200}>
                                <div className="mb-3">
                                    <img src="/assets/imgs/pages/ai-solutions/page-home/home-section-3/icon-2.svg" alt="Points" style={{ width: 48, height: 48 }} />
                                </div>
                                <h4 className="fw-bold mb-2">Massive Points Pool</h4>
                                <div className="fw-bold text-primary mb-2">10,800 Points Daily</div>
                                <p className="text-secondary mb-4">A huge points pool to meet any work needs. The large account pool avoids single account speed limits, so you never have to wait for quota.</p>
                                <div>
                                    <span className="badge text-white bg-primary bg-opacity-10 px-3 py-2 rounded-pill">Unlimited Quota!</span>
                                </div>
                            </div>
                        </div>
                        {/* Card 3: Professional Service */}
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-5 h-100 text-center border" data-aos="fade-up" data-aos-delay={400}>
                                <div className="mb-3">
                                    <img src="/assets/imgs/pages/ai-solutions/page-home/home-section-3/icon-3.svg" alt="Service" style={{ width: 48, height: 48 }} />
                                </div>
                                <h4 className="fw-bold mb-2">Professional Service</h4>
                                <div className="fw-bold text-primary mb-2">1-on-1 Engineer Support</div>
                                <p className="text-secondary mb-4">Expert technical support, real engineers (not bots). 1-on-1 remote troubleshooting and professional technical assistance.</p>
                                <div>
                                    <span className="badge text-white bg-primary bg-opacity-10 px-3 py-2 rounded-pill">Not a robot!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
