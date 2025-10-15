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
                            <span className="btn-text text-primary">faq &amp; a.</span>
                            <span className="small-line" />
                        </div>
                        <h2 className="text-white mt-3 mb-8 text-anime-style-2">Get every single answer</h2>
                    </div>
                    <div className="row flex-wrap align-items-end wow img-custom-anim-left">
                        <div className="col-lg-12 col-md-12">
                            <div className="accordion-2">
                                <div className="px-0 card border-bottom-0 rounded-bottom-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse1">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">What's the difference from official Claude?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse1" className="collapse" data-bs-parent=".accordion-2">
                                        <p className="px-3 fs-6 fw-regular">We provide an official Claude mirror service with identical response speed, data format, and model capabilities. The difference is our 100+ account pool with load balancing, which avoids single-account rate limits and provides more stable service.</p>
                                    </div>
                                </div>
                                <div className="px-0 card border-bottom-0 rounded-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse2">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">How is security guaranteed?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse2" className="collapse show" data-bs-parent=".accordion-2">
                                        <p className="px-3 fs-6 fw-regular">We use technical relay methods, ensuring your account faces no ban risk. All data transmission is encrypted, and we don't store any of your code or sensitive information, ensuring complete privacy and security.</p>
                                    </div>
                                </div>
                                <div className="px-0 card border-bottom-0 rounded-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse3">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">How can I get support if I encounter issues?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse3" className="collapse" data-bs-parent=".accordion-2">
                                        <p className="px-3 fs-6 fw-regular">We provide 1-on-1 engineer technical support, not bot customer service. For any issues, you can contact our technical team, and we'll provide remote assistance to ensure you can use the service properly.</p>
                                    </div>
                                </div>
                                <div className="px-0 card border-bottom-0 rounded-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse4">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">Which Claude models are supported?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse4" className="collapse" data-bs-parent=".accordion-2">
                                        <p className="px-3 fs-6 fw-regular">We support all Claude models including Claude 4 Opus. Our account pool consists of official Max accounts, ensuring you have access to the latest and most powerful model capabilities.</p>
                                    </div>
                                </div>
                                <div className="px-0 card border-bottom-0 rounded-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse5">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">How are credits calculated?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse5" className="collapse" data-bs-parent=".accordion-2">
                                        <p className="px-3 fs-6 fw-regular">Credits are calculated using the exact same algorithm as official Claude. Our account pool ensures that even if one account reaches its limit, we can seamlessly switch to another account to continue service.</p>
                                    </div>
                                </div>
                                <div className="px-0 card rounded-top-0 collapse-custom bg-transparent">
                                    <div className="p-0 card-header border-0 rounded-bottom-3 bg-transparent">
                                        <Link className="collapsed p-4 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse6">
                                            <h6 className="text-primary mb-0">
                                                <span className="text-white">Is this service suitable for commercial use?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse6" className="collapse rounded-bottom-3" data-bs-parent=".accordion-2">
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