'use client'
import Link from "next/link";

export default function Section7() {
    return (
        <>
            {/*ai-solutions home section 7*/}
            <section className="ai-solutions-home-section-7 position-relative overflow-hidden py-120 bg-dark">
                <img className="position-absolute top-0 start-0" data-aos="fade-right" data-aos-delay={400} src="assets/imgs/pages/ai-solutions/page-home/home-section-7/bg-top.png" alt="AstraX" />
                <img className="position-absolute bottom-0 end-0" data-aos="fade-left" data-aos-delay={400} src="assets/imgs/pages/ai-solutions/page-home/home-section-7/bg-bottom.png" alt="AstraX" />
                <div className="container position-relative z-1">
                    <div className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-3">
                            <span className="small-line" />
                            <span className="btn-text text-primary">FAQ &amp; A</span>
                            <span className="small-line" />
                        </div>
                        <h2 className="text-white mt-3 mb-8 text-anime-style-2">Frequently Asked Questions</h2>
                    </div>
                    <div className="row g-4 align-items-start wow img-custom-anim-left">
                        {/* Left column: 3 items */}
                        <div className="col-lg-6 col-md-12">
                            <div className="accordion-2 accordion-left">
                                {/* Q1 */}
                                <div className="px-0 card border-bottom-0 rounded-bottom-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse1">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">What’s the difference from subscribing to official Claude or GPT directly?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse1" className="collapse" data-bs-parent=".accordion-left">
                                        <p className="px-3 fs-6 fw-regular">We subscribe to the official services. You get responses identical in speed, format, and model capability to the official ones, while a single subscription lets you use more vendors’ command-line programming tools. Note: we currently do not provide a web-based chat service.</p>
                                    </div>
                                </div>
                                {/* Q2 */}
                                <div className="px-0 card border-bottom-0 rounded-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse2">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">How is security guaranteed?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse2" className="collapse show" data-bs-parent=".accordion-left">
                                        <p className="px-3 fs-6 fw-regular">We use a technical relay approach; your account faces no ban risk. All data transmission is encrypted. We do not store your code or any sensitive information, ensuring privacy and security.</p>
                                    </div>
                                </div>
                                {/* Q3 */}
                                <div className="px-0 card border-bottom-0 rounded-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse3">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">How can I get technical support?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse3" className="collapse" data-bs-parent=".accordion-left">
                                        <p className="px-3 fs-6 fw-regular">We provide 1-on-1 engineer support (not a bot). If you run into any issues, contact our technical team and we will assist remotely to ensure you can use the service normally.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Right column: 2 items */}
                        <div className="col-lg-6 col-md-12">
                            <div className="accordion-2 accordion-right">
                                {/* Q4 */}
                                <div className="px-0 card border-bottom-0 rounded-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse4">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">Which models are currently supported?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse4" className="collapse" data-bs-parent=".accordion-right">
                                        <p className="px-3 fs-6 fw-regular">All plans support Claude Sonnet and Codex models. Pro and Max additionally support Claude 4 Opus. Our account pool consists of official Max accounts, ensuring access to the latest and most powerful model capabilities. Gemini 3 is coming soon.</p>
                                    </div>
                                </div>
                                {/* Q5 */}
                                <div className="px-0 card rounded-top-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-bottom-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse5">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">How are credits calculated?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse5" className="collapse rounded-bottom-3" data-bs-parent=".accordion-right">
                                        <p className="px-3 fs-6 fw-regular">Credit calculation follows the same algorithm as official Claude. Our account pool ensures that even if one account reaches its limit, we seamlessly switch to another to continue service.</p>
                                    </div>
                                </div>
                                {/* Q6 */}
                                <div className="px-0 card rounded-top-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-bottom-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse6">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">Is this service suitable for commercial use?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse6" className="collapse rounded-bottom-3" data-bs-parent=".accordion-right">
                                        <p className="px-3 fs-6 fw-regular">Absolutely. Our service is designed for professional developers and teams. With stable availability, security guarantees, and professional support, it's perfect for commercial projects and enterprise development.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
