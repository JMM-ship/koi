export default function Section2() {
    return (
        <>
            {/*ai-solutions-contact section 2*/}
            <section className="ai-solutions-contact-section-2 position-relative pb-120">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 pe-lg-8 col-12">
                            <span className="btn-text fs-7 text-primary">Get in Touch</span>
                            <h2 className="mt-3 fw-semibold text-anime-style-2">Get a free quote</h2>
                            <p className="mb-6">Have a question or want to discuss a project? Fill out the form below, and we’ll get back to you within 24 hours.</p>
                            <form action="#" className="input-group mb-3 mt-4 position-relative wow img-custom-anim-left">
                                <div className="row">
                                    <div className="col-md-6">
                                        <label htmlFor="username" className="fs-7 fw-semibold text-uppercase mb-3">
                                            Full name
                                        </label>
                                        <input type="text" className="py-3 form-control rounded-0 username" name="name" placeholder="Enter here" id="username" />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="email" className="fs-7 fw-semibold text-uppercase mb-3">
                                            Email address
                                        </label>
                                        <input type="text" className="py-3 form-control rounded-0 email" name="name" placeholder="Enter here" id="email" />
                                    </div>
                                    <div className="col-12 mt-5">
                                        <label htmlFor="message" className="fs-7 fw-semibold text-uppercase mb-3">
                                            Message
                                        </label>
                                        <textarea name="message" id="message" cols={30} rows={8} className="py-3 form-control rounded-0 website" placeholder="Enter here" defaultValue={""} />
                                    </div>
                                    <div className="col-12 mt-5">
                                        <button className="btn btn-linear" type="submit" aria-label="submit" data-aos="fade-zoom-in" data-aos-delay={100}>
                                            <span>submit</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                                <g clipPath="url(#clip0_886_362)">
                                                    <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="white" />
                                                </g>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="col-lg-6 ms-lg-auto mt-lg-0 mt-5 d-none d-lg-block">
                            <div data-aos="zoom-in">
                                <img src="assets/imgs/pages/ai-solutions/page-contact/img-4.png" alt="AstraX" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
