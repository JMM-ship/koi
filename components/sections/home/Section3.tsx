'use client'
export default function Section3() {
    return (
        <>
            {/*ai-solutions home section 3*/}
            <section className="ai-solutions-home-section-3 position-relative overflow-hidden pb-120 pt-120 bg-dark">
                <div className="position-absolute top-0 end-0 z-0 m-8" data-aos="zoom-in">
                    <img className="flickering" src="assets/imgs/pages/ai-solutions/page-home/home-section-3/decor-bg.png" alt="AstraX" />
                </div>
                <div className="container position-relative z-1">
                    <div className="text-center">
                        <div className="d-flex align-items-center gap-3 justify-content-center" data-aos="fade-up">
                            <span className="small-line" />
                            <span className="btn-text text-primary">Our Technical Difference</span>
                            <span className="small-line" />
                        </div>
                        <h2 className="text-white my-3 text-anime-style-3" data-aos="fade-up" data-aos-delay="100">
                            Our Technical Advantages
                        </h2>
                        <p className="text-white opacity-75 mb-5" data-aos="fade-up" data-aos-delay="200">
                            Professional technical architecture providing more stable and efficient service experience
                        </p>
                    </div>
                    
                    {/* Core Statement */}
                    <div className="text-center my-5 py-5" data-aos="fade-up" data-aos-delay="300">
                        <h3 className="text-white mb-4">
                            Our core is a dynamic resource pool composed of{" "}
                            <span className="text-primary">$200 Max accounts</span>
                        </h3>
                        <p className="text-white opacity-75 fs-5">
                            All accounts are{" "}
                            <span className="text-primary fw-bold">official $200 Max subscription accounts</span>, 
                            intelligently scheduling resources in real-time to ensure smooth operations. 
                            Massive account pool eliminates single account rate limit issues.
                        </p>
                    </div>
                    {/* Feature Icons */}
                    <div className="row g-md-5 g-3 mt-80">
                        <div className="col-lg-3 col-md-6 col-12">
                            <div className="icon-flip text-center h-100" data-aos="fade-up" data-aos-delay={0}>
                                <div className="icon-wrapper mb-4">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#00D4FF" strokeWidth="2"/>
                                        <path d="M8 12L11 15L16 9" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <h6 className="mt-5 mb-3 text-white">Dynamic Resource Pool</h6>
                                <p className="text-white opacity-75">Massive official $200 Max account pool forms dynamic resource pool</p>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-12">
                            <div className="icon-flip text-center h-100" data-aos="fade-up" data-aos-delay={200}>
                                <div className="icon-wrapper mb-4">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 8V12L15 15" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                                        <circle cx="12" cy="12" r="9" stroke="#FFD700" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <h6 className="mt-5 mb-3 text-white">Load Balancing</h6>
                                <p className="text-white opacity-75">Real-time load balancing with intelligent scheduling strategy</p>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-12">
                            <div className="icon-flip text-center h-100" data-aos="fade-up" data-aos-delay={400}>
                                <div className="icon-wrapper mb-4">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 12L11 14L15 10" stroke="#00FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#00FF00" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <h6 className="mt-5 mb-3 text-white">Zero Rate Limit</h6>
                                <p className="text-white opacity-75">Reach rate limit switch instantly, no waiting required</p>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-12">
                            <div className="icon-flip text-center h-100" data-aos="fade-up" data-aos-delay={600}>
                                <div className="icon-wrapper mb-4">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 13L9 17L19 7" stroke="#00FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#00FF00" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <h6 className="mt-5 mb-3 text-white">Fully Compatible</h6>
                                <p className="text-white opacity-75">Same response format as official API for perfect compatibility</p>
                            </div>
                        </div>
                    </div>

                    {/* Service Guarantee Section */}
                    <div className="mt-80">
                        <h4 className="text-center text-white mb-5" data-aos="fade-up">Service Guarantee</h4>
                        <div className="row g-4">
                            <div className="col-md-4">
                                <div className="service-card bg-dark border border-secondary rounded-4 p-4 h-100" data-aos="flip-left" data-aos-delay="0">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div className="icon-box bg-success bg-opacity-10 rounded-circle p-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 13L9 17L19 7" stroke="#00FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <h6 className="text-white mb-0">Response Speed</h6>
                                    </div>
                                    <p className="text-white opacity-75 mb-0">Identical to direct use of official service</p>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="service-card bg-dark border border-secondary rounded-4 p-4 h-100" data-aos="flip-left" data-aos-delay="200">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div className="icon-box bg-success bg-opacity-10 rounded-circle p-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 13L9 17L19 7" stroke="#00FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <h6 className="text-white mb-0">Data Format</h6>
                                    </div>
                                    <p className="text-white opacity-75 mb-0">Identical to direct use of official service</p>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="service-card bg-dark border border-secondary rounded-4 p-4 h-100" data-aos="flip-left" data-aos-delay="400">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div className="icon-box bg-success bg-opacity-10 rounded-circle p-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 13L9 17L19 7" stroke="#00FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <h6 className="text-white mb-0">Model Capability</h6>
                                    </div>
                                    <p className="text-white opacity-75 mb-0">Identical to direct use of official service</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
