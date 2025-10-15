import Link from "next/link";

export default function Section4() {
    return (
        <>
            {/*ai-solutions-home section 4*/}
            <section className="ai-solutions-home-section-4 position-relative overflow-hidden pt-120 pb-120">
                <div className="container position-relative z-1">
                    <div className="row align-items-center">
                        <div className="col-lg-6 col-md-12 pe-lg-8">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small-line" />
                                <span className="btn-text text-primary">FAQ</span>
                            </div>
                            <h2 className="text-dark mt-3 mb-8 text-anime-style-2">Get every answer here</h2>
                            <div className="accordion">
                                <div className="px-0 py-3 card border-0 border-top border-bottom rounded-0 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={0}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="collapsed p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-1">
                                            <h6 className="text-primary fs-6 mb-0">
                                                Q. <span className="text-dark">What support &amp; service package are available?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse-1" className="collapse" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
                                    </div>
                                </div>
                                <div className="px-0 py-3 card border-0 border-top border-bottom rounded-0 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={200}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-2">
                                            <h6 className="text-primary fs-6 mb-0">
                                                Q. <span className="text-dark">How can I make the payment?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse-2" className="collapse show" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
                                    </div>
                                </div>
                                <div className="px-0 py-3 card border-0 border-top border-bottom rounded-0 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={400}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="collapsed p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-3">
                                            <h6 className="text-primary fs-6 mb-0">
                                                Q. <span className="text-dark">Do you provide any refund?</span>
                                            </h6>
                                            <span className="ms-auto arrow" />
                                        </Link>
                                    </div>
                                    <div id="collapse-3" className="collapse" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 order-3 mt-lg-0 mt-8 wow img-custom-anim-left">
                            <div className="position-relative d-inline-block">
                                <img className="rounded-4" src="assets/imgs/pages/ai-solutions/page-home/home-section-4/img-1.png" alt="AstraX" />
                                <img className="position-absolute top-0 start-0 p-5 alltuchtopdown" src="assets/imgs/pages/ai-solutions/page-home/home-section-4/img-2.png" alt="AstraX" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
