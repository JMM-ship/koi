import Link from "next/link";

export default function Section5() {
    return (
        <>
            {/*ai-solutions-home section 5*/}
            <section className="ai-solutions-home-section-5 position-relative overflow-hidden py-120 bg-dark">
                <div className="container position-relative z-1">
                    <div className="text-center">
                        <div className="d-flex align-items-center gap-3 justify-content-center">
                            <span className="small-line bg-white" />
                            <span className="btn-text text-white">integrations ready</span>
                            <span className="small-line bg-white" />
                        </div>
                        <h2 className="text-white my-3 text-anime-style-2">Works on your fav platforms.</h2>
                    </div>
                    <div className="row mt-80 wow img-custom-anim-left">
                        <div className="col-3 d-flex flex-column gap-5 d-none d-md-flex">
                            <div className="d-flex align-items-center gap-4 justify-content-end">
                                <span className="btn-text text-white">Squarespace</span>
                                <div className="work-icon position-relative">
                                    <img className="position-absolute top-50 start-50 translate-middle" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/icon-1.svg" alt="AstraX" />
                                    <span className="icon-shape icon-100 rounded-circle" />
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4 justify-content-end">
                                <span className="btn-text text-white">figma</span>
                                <div className="work-icon position-relative">
                                    <img className="position-absolute top-50 start-50 translate-middle" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/icon-2.svg" alt="AstraX" />
                                    <span className="icon-shape icon-100 rounded-circle" />
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4 justify-content-end">
                                <span className="btn-text text-white">wordpress</span>
                                <div className="work-icon position-relative">
                                    <img className="position-absolute top-50 start-50 translate-middle" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/icon-3.svg" alt="AstraX" />
                                    <span className="icon-shape icon-100 rounded-circle" />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="position-relative h-100 w-100">
                                <div className="d-flex align-items-center justify-content-center h-100 position-relative z-1">
                                    <div className="position-absolute top-50 start-50 translate-middle">
                                        <img className="ribbonRotate" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/umbrella.svg" alt="AstraX" />
                                    </div>
                                    <span className="icon-shape icon-large rounded-circle" />
                                </div>
                                <div className="position-absolute top-50 start-50 translate-middle w-100">
                                    <div className="dashed-line1" />
                                    <div className="dashed-line2" />
                                    <div className="dashed-line3" />
                                </div>
                            </div>
                        </div>
                        <div className="col-3 d-flex flex-column gap-5 d-none d-md-flex">
                            <div className="d-flex align-items-center gap-4 justify-content-start">
                                <div className="work-icon position-relative">
                                    <img className="position-absolute top-50 start-50 translate-middle" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/icon-4.svg" alt="AstraX" />
                                    <span className="icon-shape icon-100 rounded-circle" />
                                </div>
                                <span className="btn-text text-white">adobe</span>
                            </div>
                            <div className="d-flex align-items-center gap-4 justify-content-start">
                                <div className="work-icon position-relative">
                                    <img className="position-absolute top-50 start-50 translate-middle" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/icon-5.svg" alt="AstraX" />
                                    <span className="icon-shape icon-100 rounded-circle" />
                                </div>
                                <span className="btn-text text-white">apple</span>
                            </div>
                            <div className="d-flex align-items-center gap-4 justify-content-start">
                                <div className="work-icon position-relative">
                                    <img className="position-absolute top-50 start-50 translate-middle" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/icon-6.svg" alt="AstraX" />
                                    <span className="icon-shape icon-100 rounded-circle" />
                                </div>
                                <span className="btn-text text-white">Bing</span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-center mt-8 wow img-custom-anim-left">
                        <span className="btn-text text-white opacity-50">can’t see your favorite platform? Let us know by &nbsp;</span>
                        <Link href="#" className="btn-text text-white text-uppercase">
                            submitting a ticket.
                        </Link>
                    </div>
                </div>
                <div className="position-absolute bottom-0 start-50 translate-middle-x z-0 w-100">
                    <img className="w-100" data-aos="fade-up" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/bg-bottom.png" alt="AstraX" />
                </div>
            </section>
        </>
    );
}
