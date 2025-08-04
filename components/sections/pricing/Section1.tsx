import Link from "next/link";

export default function Section1() {
    return (
        <>
            {/*ai-solutions-pricing section 1*/}
            <section className="ai-solutions-pricing-section-1 position-relative overflow-hidden pt-120 border-top">
                <div className="container position-relative z-1">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-6 mt-lg-0 mt-8 wow img-custom-anim-left">
                            <div className="position-relative d-inline-block">
                                <img className="rounded-4" src="assets/imgs/pages/ai-solutions/page-services-details/img-4.png" alt="AstraX" />
                                <img className="position-absolute top-0 start-0 p-5 alltuchtopdown" src="assets/imgs/pages/ai-solutions/page-home/home-section-4/img-2.png" alt="AstraX" />
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12">
                            <h5 className="text-dark mt-3 text-anime-style-2">Frequently Asked Question</h5>
                            <p className="mb-6 wow img-custom-anim-top">Our solutions are crafted to simplify business processes, strengthen security, and deliver scalable infrastructure to foster growth. Whether you're aiming to optimize operations or ensure seamless scalability, we’ve got you covered.</p>
                            <div className="accordion">
                                <div className="px-0 py-2 card rounded-4 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={0}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="collapsed p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-1">
                                            <span className="me-3 arrow" />
                                            <h6 className="fs-20 mb-0">Why is university education important?</h6>
                                        </Link>
                                    </div>
                                    <div id="collapse-1" className="collapse" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
                                    </div>
                                </div>
                                <div className="px-0 py-2 card rounded-4 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={200}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-2">
                                            <span className="me-3 arrow" />
                                            <h6 className="fs-20 mb-0">What challenges do university students face?</h6>
                                        </Link>
                                    </div>
                                    <div id="collapse-2" className="collapse show" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
                                    </div>
                                </div>
                                <div className="px-0 py-2 card rounded-4 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={400}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="collapsed p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-3">
                                            <span className="me-3 arrow" />
                                            <h6 className="fs-20 mb-0">How can universities support students' well-being?</h6>
                                        </Link>
                                    </div>
                                    <div id="collapse-3" className="collapse" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
                                    </div>
                                </div>
                                <div className="px-0 py-2 card rounded-4 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={600}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="collapsed p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-4">
                                            <span className="me-3 arrow" />
                                            <h6 className="fs-20 mb-0">What role do internships play?</h6>
                                        </Link>
                                    </div>
                                    <div id="collapse-4" className="collapse" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
                                    </div>
                                </div>
                                <div className="px-0 py-2 card rounded-4 mb-3 collapse-custom" data-aos="fade-up" data-aos-delay={800}>
                                    <div className="p-0 card-header border-0 rounded-3 bg-white">
                                        <Link className="collapsed p-3 fw-bold d-flex align-items-center" data-bs-toggle="collapse" href="#collapse-5">
                                            <span className="me-3 arrow" />
                                            <h6 className="fs-20 mb-0">How valuable is studying abroad?</h6>
                                        </Link>
                                    </div>
                                    <div id="collapse-5" className="collapse" data-bs-parent=".accordion">
                                        <p className="px-3 fs-6 fw-regular">We offer a range of support and service packages tailored to meet various needs, from basic assistance to comprehensive solutions. Please cnt our sales team asap.</p>
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
