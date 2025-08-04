"use client";

import Link from "next/link";
import { useState } from "react";
import ModalVideo from "react-modal-video";
import "react-modal-video/css/modal-video.css";
export default function Section2() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            {/*ai-solutions-services-details section 2*/}
            <section className="ai-solutions-services-details-section-2 position-relative pt-120 pb-90 bg-secondary-2 overflow-hidden">
                <div className="container">
                    <div className="row align-items-end">
                        <div className="col-lg-7">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small-line" />
                                <span className="btn-text">Our amazing skills</span>
                            </div>
                            <h2 className=" my-3 text-anime-style-3">Transform Your Business with AI-Driven Intelligence</h2>
                            <p className="mb-0 text-anime-style-1">Build Smarter, Scale Faster, and Outperform Competitors with Custom Machine Learning Solutions. Harness the power of AI-driven insights to future-proof your operations, reduce costs, and unlock new revenue streams.</p>
                        </div>
                        <div className="col-lg-4 ms-lg-auto text-lg-end">
                            <Link href="/services" className="btn btn-dark mt-3 hover-up">
                                <span>Discover More</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                    <g clipPath="url(#clip0_914_180)">
                                        <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="white" />
                                    </g>
                                </svg>
                            </Link>
                        </div>
                    </div>
                    <div className="row mt-7 position-relative">
                        <div className="col-lg-6">
                            <div className="d-flex align-items-center gap-3 mb-5">
                                <img src="assets/imgs/pages/ai-solutions/icons/icon-key.svg" alt="AstraX" />
                                <h5 className="mb-0">Key Values</h5>
                            </div>
                            <div className="bg-white py-2 mb-3" data-aos="fade-left" data-aos-delay={0}>
                                <div className="px-3 border-start border-primary border-5">
                                    <h6 className="text-dark mt-3 mb-2 text-anime-style-2">Predict the Future</h6>
                                    <p className="wow img-custom-anim-top">Turn your data into actionable forecasts with 95% accuracy. From predicting customer behavior to anticipating market trends, our machine learning models empower you to make smarter, data-driven decisions that keep you ahead of the curve.</p>
                                </div>
                            </div>
                            <div className="bg-white py-2 mb-3" data-aos="fade-left" data-aos-delay={200}>
                                <div className="px-3 border-start border-primary border-5">
                                    <h6 className="text-dark mt-3 mb-2 text-anime-style-2">Automate Everything</h6>
                                    <p className="wow img-custom-anim-top">Cut operational costs by up to 40% with intelligent, AI-powered workflows. Automate repetitive tasks, streamline processes, and free up your team to focus on what truly matters—innovation and growth.</p>
                                </div>
                            </div>
                            <div className="bg-white py-2 mb-3" data-aos="fade-left" data-aos-delay={400}>
                                <div className="px-3 border-start border-primary border-5">
                                    <h6 className="text-dark mt-3 mb-2 text-anime-style-2">Stay Ahead:</h6>
                                    <p className="wow img-custom-anim-top">Deploy enterprise-grade AI solutions in weeks, not months. Our agile development process and pre-built frameworks ensure rapid implementation, so you can start seeing results faster than ever before.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 position-relative d-none d-lg-block">
                            <div className="position-absolute top-0 end-0">
                                <img data-aos="zoom-in" className="image-bg" src="assets/imgs/pages/ai-solutions/page-services-details/img-3.png" alt="AstraX" />
                                <div className="position-absolute top-50 start-50 translate-middle z-2">
                                    <Link
                                        href="#"
                                        className="d-inline-flex fs-7 fw-semibold align-items-center bg-white rounded-circle popup-video hover-up icon-shape icon-120 play-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsOpen(true);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width={34} height={34} viewBox="0 0 34 34" fill="none">
                                            <path d="M7.23305 0.749674C4.16776 -1.00862 1.68262 0.431795 1.68262 3.96436V30.0332C1.68262 33.5692 4.16776 35.0078 7.23305 33.2512L30.0185 20.1839C33.0848 18.425 33.0848 15.5753 30.0185 13.8167L7.23305 0.749674Z" fill="#794AFF" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <ModalVideo channel="youtube" isOpen={isOpen} videoId="2GOTlI8pYeo" onClose={() => setIsOpen(false)} />
        </>
    );
}
