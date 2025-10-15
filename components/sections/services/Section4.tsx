import Link from "next/link";

export default function Section4() {
    return (
        <>
            {/*ai-solutions-services section 4*/}
            <section className="ai-solutions-services-section-4 position-relative overflow-hidden pt-120">
                <div className="container">
                    <div className="py-80 bg-secondary-2 rounded-5 text-center position-relative overflow-hidden px-5">
                        <img className="position-absolute bottom-0 start-50 translate-middle-x z-0" src="assets/imgs/pages/ai-solutions/page-services/img-3.png" alt="AstraX" />
                        <span className="bg-white rounded-pill p-3 btn-text">
                            🚀 <span className="d-none d-lg-block">EXCLUSIVE OFFER:</span> UNLIMITED ACCESS FOR $49
                        </span>
                        <h2 className="text-linear my-3 text-anime-style-3 mt-6">Transform Your Workflow with AI!</h2>
                        <p>
                            Enhance productivity and efficiency with AI-driven automation, designed <br />
                            to streamline your business operations and save time.
                        </p>
                        <Link href="/pricing" className="btn btn-linear hover-up mt-5 position-relative z-1">
                            Embrace the Future
                            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="white" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
