import Link from "next/link";

export default function Section9({ bordertop }: any) {
    return (
        <>
            {/*ai-solutions-about section 9*/}
            <section className="ai-solutions-about-section-9 position-relative overflow-hidden">
                <div className={`container position-relative z-1 ${bordertop} py-120`}>
                    <div className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-3">
                            <span className="small-line" />
                            <span className="btn-text text-primary">insights</span>
                            <span className="small-line" />
                        </div>
                        <h2 className="text-dark mt-3 mb-8 text-anime-style-2">Company blog feeds</h2>
                    </div>
                    <div className="row mt-8">
                        <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={200}>
                            <div className="card-news position-relative mb-lg-0 mb-5 hover-up">
                                <Link href="/blog-details" className="card-news-img position-relative d-block">
                                    <img className="w-100 rounded-3 rounded-bottom-0" src="assets/imgs/pages/ai-solutions/page-home/home-section-8/img-1.png" alt="AstraX" />
                                    <span className="text-uppercase text-white bg-linear-1 rounded-2 px-2 py-1 position-absolute top-0 start-0 m-4 fs-8 fw-semibold">ai</span>
                                </Link>
                                <div className="card-news-body border p-4 rounded-3 rounded-top-0 border-top-0">
                                    <div className="d-flex card-news-information gap-4">
                                        <div className="d-flex align-items-center gap-1">
                                            <img src="assets/imgs/template/icons/icon-1.svg" alt="AstraX" />
                                            <p className="mb-0">December 21, 2025</p>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <img src="assets/imgs/template/icons/icon-2.svg" alt="AstraX" />
                                            <span className="opacity-50">By</span>
                                            <Link href="#" className="mb-0">
                                                Admin
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="card-news-title mt-2">
                                        <Link href="/blog-details">
                                            <h6>2025: brace for the 'big one' cyber attack.</h6>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={400}>
                            <div className="card-news position-relative mb-lg-0 mb-5 hover-up">
                                <Link href="/blog-details" className="card-news-img position-relative d-block">
                                    <img className="w-100 rounded-3 rounded-bottom-0" src="assets/imgs/pages/ai-solutions/page-home/home-section-8/img-2.png" alt="AstraX" />
                                    <span className="text-uppercase text-white bg-linear-1 rounded-2 px-2 py-1 position-absolute top-0 start-0 m-4 fs-8 fw-semibold">automation</span>
                                </Link>
                                <div className="card-news-body border p-4 rounded-3 rounded-top-0 border-top-0">
                                    <div className="d-flex card-news-information gap-4">
                                        <div className="d-flex align-items-center gap-1">
                                            <img src="assets/imgs/template/icons/icon-1.svg" alt="AstraX" />
                                            <p className="mb-0">December 21, 2025</p>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <img src="assets/imgs/template/icons/icon-2.svg" alt="AstraX" />
                                            <span className="opacity-50">By</span>
                                            <Link href="#" className="mb-0">
                                                Admin
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="card-news-title mt-2">
                                        <Link href="/blog-details">
                                            <h6>2025: brace for the 'big one' cyber attack.</h6>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={600}>
                            <div className="card-news position-relative mb-lg-0 mb-5 hover-up">
                                <Link href="/blog-details" className="card-news-img position-relative d-block">
                                    <img className="w-100 rounded-3 rounded-bottom-0" src="assets/imgs/pages/ai-solutions/page-home/home-section-8/img-3.png" alt="AstraX" />
                                    <span className="text-uppercase text-white bg-linear-1 rounded-2 px-2 py-1 position-absolute top-0 start-0 m-4 fs-8 fw-semibold">software</span>
                                </Link>
                                <div className="card-news-body border p-4 rounded-3 rounded-top-0 border-top-0">
                                    <div className="d-flex card-news-information gap-4">
                                        <div className="d-flex align-items-center gap-1">
                                            <img src="assets/imgs/template/icons/icon-1.svg" alt="AstraX" />
                                            <p className="mb-0">December 21, 2025</p>
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <img src="assets/imgs/template/icons/icon-2.svg" alt="AstraX" />
                                            <span className="opacity-50">By</span>
                                            <Link href="#" className="mb-0">
                                                Admin
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="card-news-title mt-2">
                                        <Link href="/blog-details">
                                            <h6>2025: brace for the 'big one' cyber attack.</h6>
                                        </Link>
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
