import Link from "next/link";

export default function Section3() {
    return (
        <>
            {/*ai-solutions-services section 3*/}
            <section className="ai-solutions-services-section-3 position-relative overflow-hidden pt-120">
                <div className="container position-relative z-1">
                    <div className="row align-items-center">
                        <div className="col-lg-6 order-3 order-lg-1 mt-lg-0 mt-8 d-none d-lg-block">
                            <img className="wow img-custom-anim-top" src="assets/imgs/pages/ai-solutions/page-services/img-2.png" alt="AstraX" />
                        </div>
                        <div className="col-lg-6 col-md-12 order-2 ">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small-line" />
                                <span className="btn-text text-primary">How It Works</span>
                            </div>
                            <h2 className="text-dark mt-3 pb-5 text-anime-style-3">Ways We Can Help</h2>
                            <div className="px-3 border-start border-primary border-5 mb-5">
                                <h6 className="text-dark my-3 text-anime-style-3">01. Define Your Needs</h6>
                                <p className="wow img-custom-anim-top fw-bold">
                                    Customize Your AI Solution: <span className="fw-regular">Start by telling us your goals. Whether it’s automating tasks, predicting trends, or enhancing customer experiences, we tailor our AI to fit your needs.</span>
                                </p>
                            </div>
                            <div className="px-3 border-start border-primary border-5 mb-5">
                                <h6 className="text-dark my-3 text-anime-style-3">02. Integrate Your Data</h6>
                                <p className="wow img-custom-anim-top fw-bold">
                                    Connect, Upload, and Train: <span className="fw-regular">Securely upload your data via drag-and-drop, API, or direct cloud integration. Our platform cleans, analyzes, and trains AI models in real time.</span>
                                </p>
                            </div>
                            <div className="px-3 border-start border-primary border-5 mb-5">
                                <h6 className="text-dark my-3 text-anime-style-3">03. Deploy &amp; Scale</h6>
                                <p className="wow img-custom-anim-top fw-bold">
                                    Launch Your AI, Anywhere: <span className="fw-regular">Activate your AI solution instantly. Integrate it into your apps, workflows, or customer channels with one click. AI learns and improves as it interacts with new data.</span>
                                </p>
                            </div>
                            <div className="d-flex flex-wrap align-items-center gap-3 mt-7">
                                <Link href="/services-detail" className="btn btn-linear hover-up">
                                    Learn More
                                    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                        <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="white" />
                                    </svg>
                                </Link>
                                <Link href="#" className="btn btn-outline-secondary">
                                    Why Choose Us?
                                    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                        <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="#292929" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
