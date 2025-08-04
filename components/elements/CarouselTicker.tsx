"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { ReactNode } from "react";

type CarouselTickerProps = {
    slides: ReactNode[];
};

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 6,
    spaceBetween: 15,
    centeredSlides: true,
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
            slidesPerView: 2,
            spaceBetween: 20,
        },
        767: {
            slidesPerView: 2,
            spaceBetween: 10,
        },
        991: {
            slidesPerView: 3,
            spaceBetween: 15,
        },
        1199: {
            slidesPerView: 4,
            spaceBetween: 25,
        },
        1350: {
            slidesPerView: 6,
            spaceBetween: 30,
        },
    },
};

export default function CarouselTicker({ slides }: CarouselTickerProps) {
    return (
        <Swiper {...swiperOptions} className="carouselTicker carouselTicker-left pt-4 position-relative z-1 wow img-custom-anim-top">
            <div className="carouselTicker__list">
                {slides.map((slide, index) => (
                    <SwiperSlide key={index} className=" mx-3">
                        {slide}
                    </SwiperSlide>
                ))}
            </div>
        </Swiper>
    );
}
