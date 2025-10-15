import Link from "next/link";

export default function Section1() {
    return (
        <>
            {/*ai-solutions-services-details section 1*/}
            <section className="ai-solutions-services-details-section-1 position-relative overflow-hidden pt-120 pb-120">
                <div className="container position-relative z-1">
                    <div className="row align-items-end mb-8">
                        <div className="col-lg-6">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small-line" />
                                <span className="btn-text text-primary">Technical Edge</span>
                            </div>
                            <h2 className="text-dark my-3 text-anime-style-3 mb-lg-0">
                                Turn Data into <br />
                                Actionable Intelligence
                            </h2>
                        </div>
                        <div className="col-lg-5 ms-lg-auto">
                            <p className="mb-0 wow img-custom-anim-top">
                                Harness the power of machine learning (ML) to automate workflows, predict trends, and unlock hidden insights from your data. Our <span className="text-dark fw-bold">end-to-end ML</span> solutions are tailored to your industry, ensuring precision, scalability, and measurable results.
                            </p>
                        </div>
                    </div>
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div>
                                <img data-aos="flip-left" src="assets/imgs/pages/ai-solutions/page-services-details/img-1.png" alt="AstraX" />
                                <h6 className="mt-5 mb-4 text-anime-style-2">Custom ML Model Development</h6>
                                <ul className="list-unstyled">
                                    <li>
                                        <p className="text-anime-style-1">
                                            <span className="text-dark fw-bold">Tailored Algorithms:</span> Build models specific to your business needs—predictive analytics, NLP, computer vision, or recommendation engines.
                                        </p>
                                    </li>
                                    <li>
                                        <p className="text-anime-style-1">
                                            <span className="text-dark fw-bold">End-to-End Support:</span> From data preprocessing to deployment, we handle every stage of the ML lifecycle.
                                        </p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div>
                                <img data-aos="flip-left" src="assets/imgs/pages/ai-solutions/page-services-details/img-2.png" alt="AstraX" />
                                <h6 className="mt-5 mb-4 text-anime-style-2">Pre-Built AI Solutions</h6>
                                <ul className="list-unstyled">
                                    <li>
                                        <p className="text-anime-style-1">
                                            <span className="text-dark fw-bold">Industry-Specific Templates:</span> Accelerate deployment with ready-to-use models for healthcare, retail, finance, and manufacturing.
                                        </p>
                                    </li>
                                    <li>
                                        <p className="text-anime-style-1">
                                            <span className="text-dark fw-bold">Plug-and-Play Integration:</span> APIs and no-code tools to embed ML into your existing systems (e.g., CRM, ERP).
                                        </p>
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
