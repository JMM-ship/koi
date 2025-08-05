'use client'
import Link from "next/link";

export default function Section6() {
    return (
        <>
            {/*ai-solutions-home section 6*/}
            <section className="ai-solutions-home-section-6 position-relative overflow-hidden py-120 bg-white">
                <div className="container position-relative z-1">
                    <div className="text-center mb-5">
                        <div className="d-flex align-items-center gap-3 justify-content-center" data-aos="fade-up">
                            <span className="small-line" />
                            <span className="btn-text text-primary">COMPARISON</span>
                            <span className="small-line" />
                        </div>
                        <h2 className="text-dark my-3 text-anime-style-3" data-aos="fade-up" data-aos-delay="100">
                            Full Comparison Analysis
                        </h2>
                        <p className="text-dark opacity-75" data-aos="fade-up" data-aos-delay="200">
                            Why choose us? Same service experience, price only 28% of official
                        </p>
                    </div>

                    <div className="row g-lg-4 g-3 mt-5">
                        {/* AI Code With Card - Featured */}
                        <div className="col-lg-4">
                            <div className="card-pricing position-relative rounded-4 p-5 h-100 shadow-2 bg-primary" style={{ transform: 'scale(1.05)' }} data-aos="zoom-in" data-aos-delay="0">
                                <div className="position-absolute top-0 start-50 translate-middle">
                                    <span className="badge bg-warning text-dark px-4 py-2 rounded-pill shadow">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-1">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                        <strong>Best Choice</strong>
                                    </span>
                                </div>
                                <div className="text-center text-white mt-4">
                                    <h4 className="mb-3">KOI</h4>
                                    <div className="d-flex justify-content-center align-items-baseline mb-2">
                                        <h1 className="display-4 mb-0">¥399</h1>
                                        <span className="fs-5">/month</span>
                                    </div>
                                    <span className="badge bg-white text-primary px-4 py-2 rounded-pill mb-4">Save 72%</span>
                                </div>
                                <ul className="list-unstyled mt-4 text-white">
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom border-white border-opacity-10">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Monthly Price</span>
                                            <span className="text-white fw-bold">¥399/month ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom border-white border-opacity-10">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Usage Limit</span>
                                            <span className="text-white fw-bold">10,800 credits daily ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom border-white border-opacity-10">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Response Speed</span>
                                            <span className="text-white fw-bold">Full speed ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom border-white border-opacity-10">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Account Security</span>
                                            <span className="text-white fw-bold">Zero ban risk ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom border-white border-opacity-10">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Billing Method</span>
                                            <span className="text-white fw-bold">Flexible billing ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Tech Support</span>
                                            <span className="text-white fw-bold">1v1 Engineer ✓</span>
                                        </div>
                                    </li>
                                </ul>
                                <Link href="#" className="btn btn-linear w-100 mt-4 py-3 fw-bold hover-up">
                                    Get Started Now
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ms-2">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Claude Official */}
                        <div className="col-lg-4">
                            <div className="card-pricing bg-white rounded-4 p-5 h-100 shadow-1 border border-light" data-aos="zoom-in" data-aos-delay="200">
                                <div className="text-center mb-4">
                                    <span className="badge bg-light text-secondary px-3 py-1 rounded-pill mb-2">Official Product</span>
                                    <h4 className="mt-2 mb-3">Claude Official</h4>
                                    <div className="d-flex justify-content-center align-items-baseline mb-2">
                                        <h2 className="display-5 mb-0">$200</h2>
                                        <span className="text-muted">/month</span>
                                    </div>
                                    <span className="text-muted small">≈¥1400</span>
                                </div>
                                <ul className="list-unstyled mt-4">
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Monthly Price</span>
                                            <span className="text-danger">$200/month ✗</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Usage Limit</span>
                                            <span className="text-primary">10,800 credits daily ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Response Speed</span>
                                            <span className="text-primary">Standard speed ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Account Security</span>
                                            <span className="text-danger">Ban risk exists ✗</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Billing Method</span>
                                            <span className="text-danger">Fixed monthly ✗</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Tech Support</span>
                                            <span className="text-danger">Email support ✗</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Cursor */}
                        <div className="col-lg-4">
                            <div className="card-pricing bg-white rounded-4 p-5 h-100 shadow-1 border border-light" data-aos="zoom-in" data-aos-delay="400">
                                <div className="text-center mb-4">
                                    <span className="badge bg-light text-secondary px-3 py-1 rounded-pill mb-2">Code Editor Tool</span>
                                    <h4 className="mt-2 mb-3">Cursor</h4>
                                    <div className="d-flex justify-content-center align-items-baseline mb-2">
                                        <h2 className="display-5 mb-0">$20</h2>
                                        <span className="text-muted">/month</span>
                                    </div>
                                    <span className="text-muted small">+ Extra charges</span>
                                </div>
                                <ul className="list-unstyled mt-4">
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Monthly Price</span>
                                            <span className="text-warning">$20 + extra △</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Usage Limit</span>
                                            <span className="text-danger">500 times then rate limit ✗</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Response Speed</span>
                                            <span className="text-danger">Extremely slow after limit ✗</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Account Security</span>
                                            <span className="text-primary">Relatively safe ✓</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3 border-bottom">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Billing Method</span>
                                            <span className="text-danger">Fixed monthly ✗</span>
                                        </div>
                                    </li>
                                    <li className="d-flex align-items-center gap-3 py-3">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                        <div className="d-flex justify-content-between w-100">
                                            <span>Tech Support</span>
                                            <span className="text-warning">Community support △</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}