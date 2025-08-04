import Link from "next/link";

export default function Section2() {
    return (
        <>
            {/*ai-solutions-services section 2*/}
            <section className="ai-solutions-services-section-2 position-relative overflow-hidden pt-120 pb-120 bg-dark">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-5">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small-line bg-white" />
                                <span className="btn-text text-white">Our amazing skills</span>
                            </div>
                            <h2 className="text-white my-3 text-anime-style-3">
                                Our aim is to drive rapid progress in <span className="text-linear">AI development.</span>
                            </h2>
                            <div className="position-relative py-5 overflow-hidden">
                                <div className="progress position-relative overflow-visible" role="progressbar" aria-label="Basic example" aria-valuenow={95} aria-valuemin={0} aria-valuemax={95}>
                                    <div className="progress-bar rounded-pill wow img-custom-anim-left" style={{ width: "95%" }} />
                                </div>
                                <span className="position-absolute top-0 start-0 mb-2 fs-7 text-white">Work experience</span>
                                <span className="text-linear position-absolute top-0 end-0 mt-2 fs-7">95%</span>
                            </div>
                            <div className="position-relative py-5 overflow-hidden">
                                <div className="progress position-relative overflow-visible" role="progressbar" aria-label="Basic example" aria-valuenow={78} aria-valuemin={0} aria-valuemax={78}>
                                    <div className="progress-bar rounded-pill wow img-custom-anim-left" style={{ width: "78%" }} />
                                </div>
                                <span className="position-absolute top-0 start-0 mb-2 fs-7 text-white">Core solutions</span>
                                <span className="text-linear position-absolute top-0 end-0 mt-2 fs-7">78%</span>
                            </div>
                            <div className="position-relative py-5 overflow-hidden">
                                <div className="progress position-relative overflow-visible" role="progressbar" aria-label="Basic example" aria-valuenow={92} aria-valuemin={0} aria-valuemax={92}>
                                    <div className="progress-bar rounded-pill wow img-custom-anim-left" style={{ width: "92%" }} />
                                </div>
                                <span className="position-absolute top-0 start-0 mb-2 fs-7 text-white">Skilled &amp; Capable</span>
                                <span className="text-linear position-absolute top-0 end-0 mt-2 fs-7">92%</span>
                            </div>
                            <div className="d-flex align-items-center gap-3 mt-7">
                                <span className="small-line bg-white" />
                                <span className="btn-text text-white">Our partners</span>
                            </div>
                            <div className="bg-white bg-opacity-10 d-flex flex-wrap align-items-center justify-content-md-between justify-content-center gap-5 mt-5 px-5 py-4 wow img-custom-anim-left">
                                <Link href="#">
                                    <img src="assets/imgs/pages/ai-solutions/icons/app-1.svg" alt="client-logo" />
                                </Link>
                                <Link href="#">
                                    <img src="assets/imgs/pages/ai-solutions/icons/app-2.svg" alt="client-logo" />
                                </Link>
                                <Link href="#">
                                    <img src="assets/imgs/pages/ai-solutions/icons/app-3.svg" alt="client-logo" />
                                </Link>
                                <Link href="#">
                                    <img src="assets/imgs/pages/ai-solutions/icons/app-4.svg" alt="client-logo" />
                                </Link>
                                <Link href="#">
                                    <img src="assets/imgs/pages/ai-solutions/icons/app-5.svg" alt="client-logo" />
                                </Link>
                                <Link href="#">
                                    <img src="assets/imgs/pages/ai-solutions/icons/app-6.svg" alt="client-logo" />
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-6 ms-auto wow img-custom-anim-right d-none d-lg-block">
                            <img src="assets/imgs/pages/ai-solutions/page-services/img-1.png" alt="AstraX" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
