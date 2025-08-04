import Link from "next/link";

export default function Section1() {
    return (
        <>
            {/*ai-solutions-blog-details section 1*/}
            <section className="ai-solutions-blog-details-section-1 position-relative overflow-hidden py-120">
                <div className="container">
                    <div className="row g-4">
                        <div className="col-lg-4 col-md-6">
                            <div className="card-contact card rounded-4 position-relative h-100" data-aos="fade-up" data-aos-delay={0}>
                                <Link href="#" className="card-contact-img position-relative d-block zoom-img rounded-3 rounded-bottom-0 overflow-hidden">
                                    <img className="w-100" src="assets/imgs/pages/ai-solutions/page-contact/img-1.png" alt="AstraX" />
                                </Link>
                                <div className="card-contact-body p-4 d-flex flex-column">
                                    <div className="card-contact-info mt-2 mb-auto">
                                        <Link href="#">
                                            <h6>New York City</h6>
                                        </Link>
                                        <p className="mb-0">123 AI Innovation Drive, Suite 456</p>
                                        <p className="mb-0">New York, NY 10001</p>
                                        <p className="mb-0">United States</p>
                                    </div>
                                    <div className="d-flex flex-column mt-3 gap-2 mb-4">
                                        <Link href="#" className="fs-7">
                                            <i className="ri-mail-open-line text-primary" />
                                            <span className="@@color-text"> &nbsp; info@astrax.com </span>
                                        </Link>
                                        <Link href="telto:(123) 456 789 00" className="fs-7">
                                            <i className="ri-phone-line text-primary" />
                                            <span className="@@color-text"> +(123) 456 789 00 </span>
                                        </Link>
                                    </div>
                                    <Link href="#" className="text-decoration-underline text-uppercase">
                                        View on Google Map
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="card-contact card rounded-4 position-relative h-100" data-aos="fade-up" data-aos-delay={200}>
                                <Link href="#" className="card-contact-img position-relative d-block zoom-img rounded-3 rounded-bottom-0 overflow-hidden">
                                    <img className="w-100" src="assets/imgs/pages/ai-solutions/page-contact/img-2.png" alt="AstraX" />
                                </Link>
                                <div className="card-contact-body p-4 d-flex flex-column">
                                    <div className="card-contact-info mt-2 mb-auto">
                                        <Link href="#">
                                            <h6>London</h6>
                                        </Link>
                                        <p className="mb-0">456 Tech Lane, Floor 7</p>
                                        <p className="mb-0">London, EC1A 1BB</p>
                                        <p className="mb-0">United Kingdom</p>
                                    </div>
                                    <div className="d-flex flex-column mt-3 gap-2 mb-4">
                                        <Link href="#" className="fs-7">
                                            <i className="ri-mail-open-line text-primary" />
                                            <span className="@@color-text"> &nbsp; info@astrax.com </span>
                                        </Link>
                                        <Link href="telto:(123) 456 789 00" className="fs-7">
                                            <i className="ri-phone-line text-primary" />
                                            <span className="@@color-text"> +(123) 456 789 00 </span>
                                        </Link>
                                    </div>
                                    <Link href="#" className="text-decoration-underline text-uppercase">
                                        View on Google Map
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="card-contact card rounded-4 position-relative h-100" data-aos="fade-up" data-aos-delay={400}>
                                <Link href="#" className="card-img-top position-relative d-block zoom-img rounded-3 rounded-bottom-0 overflow-hidden">
                                    <img className="w-100" src="assets/imgs/pages/ai-solutions/page-contact/img-3.png" alt="AstraX" />
                                </Link>
                                <div className="card-contact-body p-4 d-flex flex-column">
                                    <div className="card-contact-info mt-2 mb-auto">
                                        <Link href="#">
                                            <h6>Singapore</h6>
                                        </Link>
                                        <p className="mb-0">12789 Future Street, #12-34</p>
                                        <p className="mb-0">Singapore 068987</p>
                                        <p className="mb-0">Singapore</p>
                                    </div>
                                    <div className="d-flex flex-column mt-3 gap-2 mb-4">
                                        <Link href="#" className="fs-7">
                                            <i className="ri-mail-open-line text-primary" />
                                            <span className="@@color-text"> &nbsp; info@astrax.com </span>
                                        </Link>
                                        <Link href="telto:(123) 456 789 00" className="fs-7">
                                            <i className="ri-phone-line text-primary" />
                                            <span className="@@color-text"> +(123) 456 789 00 </span>
                                        </Link>
                                    </div>
                                    <Link href="#" className="text-decoration-underline text-uppercase">
                                        View on Google Map
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container-fluid wow img-custom-anim-top pt-90">
                    <div className="contact-map">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.25279991725!2d-74.1444877707482!3d40.697631233381586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2zVGjDoG5oIHBo4buRIE5ldyBZb3JrLCBUaeG7g3UgYmFuZyBOZXcgWW9yaywgSG9hIEvhu7M!5e0!3m2!1svi!2s!4v1729152035449!5m2!1svi!2s" width={600} height={450} style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                </div>
            </section>
        </>
    );
}
