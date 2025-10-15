"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import Link from "next/link";

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 1,
    spaceBetween: 30,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
    },
    loop: true,
    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        575: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        767: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        991: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        1199: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        1350: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
};

export default function Section1() {
    return (
        <>
            {/*ai-solutions-blog section 1*/}
            <section className="ai-solutions-blog-section-1 position-relative overflow-hidden py-120">
                <div className="container position-relative z-1">
                    <Swiper {...swiperOptions} className="swipper slider-1 overflow-hidden">
                        <div className="swiper-wrapper">
                            <SwiperSlide>
                                <div className="row align-items-center g-lg-5 g-4">
                                    <div className="col-lg-6 wow img-custom-anim-left">
                                        <Link href="/blog-details" className="position-relative d-inline-block">
                                            <img className="rounded-4" src="assets/imgs/pages/ai-solutions/page-blog/img-1.png" alt="AstraX" />
                                        </Link>
                                    </div>
                                    <div className="col-lg-6 col-md-12 wow img-custom-anim-top">
                                        <span className="text-uppercase text-white rounded-3 fw-semibold bg-linear-1 fs-7 px-2 py-1">automation</span>
                                        <Link href="/blog-details">
                                            <h2 className="text-dark mt-3">Top 10 AI Trends Shaping 2025: What Businesses Need to Know</h2>
                                        </Link>
                                        <div className="d-flex card-news-information mt-3 gap-4">
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
                                        <p className="mt-5">Our solutions are crafted to simplify business processes, strengthen security, and deliver scalable infrastructure to foster growth. Whether you're aiming to optimize operations or ensure seamless scalability, we’ve got you covered.</p>
                                        <Link href="/blog-details" className="btn btn-outline-secondary mt-5">
                                            Read More
                                            <i className="fas fa-arrow-right" />
                                        </Link>
                                    </div>
                                </div>
                            </SwiperSlide>
                            <SwiperSlide>
                                <div className="row align-items-center g-lg-5 g-4">
                                    <div className="col-lg-6 wow img-custom-anim-left">
                                        <Link href="/blog-details" className="position-relative d-inline-block">
                                            <img className="rounded-4" src="assets/imgs/pages/ai-solutions/page-blog/img-1.png" alt="AstraX" />
                                        </Link>
                                    </div>
                                    <div className="col-lg-6 col-md-12 wow img-custom-anim-top">
                                        <span className="text-uppercase text-white rounded-3 fw-semibold bg-linear-1 fs-7 px-2 py-1">automation</span>
                                        <Link href="/blog-details">
                                            <h2 className="text-dark mt-3">Top 10 AI Trends Shaping 2025: What Businesses Need to Know</h2>
                                        </Link>
                                        <div className="d-flex card-news-information mt-3 gap-4">
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
                                        <p className="mt-5">Our solutions are crafted to simplify business processes, strengthen security, and deliver scalable infrastructure to foster growth. Whether you're aiming to optimize operations or ensure seamless scalability, we’ve got you covered.</p>
                                        <Link href="/blog-details" className="btn btn-outline-secondary mt-5">
                                            Read More
                                            <i className="fas fa-arrow-right" />
                                        </Link>
                                    </div>
                                </div>
                            </SwiperSlide>
                            <SwiperSlide>
                                <div className="row align-items-center g-lg-5 g-4">
                                    <div className="col-lg-6 wow img-custom-anim-left">
                                        <Link href="/blog-details" className="position-relative d-inline-block">
                                            <img className="rounded-4" src="assets/imgs/pages/ai-solutions/page-blog/img-1.png" alt="AstraX" />
                                        </Link>
                                    </div>
                                    <div className="col-lg-6 col-md-12 wow img-custom-anim-top">
                                        <span className="text-uppercase text-white rounded-3 fw-semibold bg-linear-1 fs-7 px-2 py-1">automation</span>
                                        <Link href="/blog-details">
                                            <h2 className="text-dark mt-3">Top 10 AI Trends Shaping 2025: What Businesses Need to Know</h2>
                                        </Link>
                                        <div className="d-flex card-news-information mt-3 gap-4">
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
                                        <p className="mt-5">Our solutions are crafted to simplify business processes, strengthen security, and deliver scalable infrastructure to foster growth. Whether you're aiming to optimize operations or ensure seamless scalability, we’ve got you covered.</p>
                                        <Link href="/blog-details" className="btn btn-outline-secondary mt-5">
                                            Read More
                                            <i className="fas fa-arrow-right" />
                                        </Link>
                                    </div>
                                </div>
                            </SwiperSlide>
                        </div>
                    </Swiper>
                    <div className="swiper-button-prev me-5 end-100 mt-0 rounded-circle bg-secondary-2 border-opacity-25 border-dark icon-shape icon-50 d-none d-lg-flex">
                        <svg className="fill-primary" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                            <path d="M4.18271 3.80852L4.99823e-08 7.99998L4.18271 12.1914L5.06751 11.3084L2.3896 8.62497L16 8.62497L16 7.37498L2.3896 7.37498L5.06751 4.69148L4.18271 3.80852Z" fill="#292929" />
                        </svg>
                    </div>
                    <div className="swiper-button-next ms-5 start-100 mt-0 rounded-circle bg-secondary-2 border-opacity-25 border-dark icon-shape icon-50 d-none d-lg-flex">
                        <svg className="fill-primary" xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                            <path d="M11.8173 12.1915L16 8.00002L11.8173 3.80859L10.9325 4.69155L13.6104 7.37503L-1.55894e-07 7.37503L-2.10532e-07 8.62502L13.6104 8.62502L10.9325 11.3085L11.8173 12.1915Z" fill="#292929" />
                        </svg>
                    </div>
                </div>
            </section>
        </>
    );
}
