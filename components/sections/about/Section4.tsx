"use client";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";

const teamMembers = [
    { delay: "0", img: "img-5.png", linkAuthor: "#", name: "Alexander Smith", role: "Chief Executive Officer (CEO)" },
    { delay: "200", img: "img-6.png", linkAuthor: "#", name: "Emma Charlotte", role: "Marketing Director" },
    { delay: "400", img: "img-7.png", linkAuthor: "#", name: "Robert Johnson", role: "Software Engineer" },
    { delay: "600", img: "img-8.png", linkAuthor: "#", name: "Benjamin Thomas", role: "Human Resources Manager" },
    { delay: "0", img: "img-9.png", linkAuthor: "#", name: "Michael Johnson", role: "Product Manager" },
    { delay: "200", img: "img-10.png", linkAuthor: "#", name: "David Brown", role: "Operations Supervisor" },
    { delay: "400", img: "img-11.png", linkAuthor: "#", name: "Robert Harris", role: "Financial Analyst" },
    { delay: "600", img: "img-12.png", linkAuthor: "#", name: "Sarah Williams", role: "Sales Coordinator" },
];

export default function Section4() {
    useEffect(() => {
        AOS.init();
    }, []);
    return (
        <>
            {/*ai-solutions-about section 4*/}
            <section className="ai-solutions-about-section-4 position-relative overflow-hidden pt-120 pb-120">
                <div className="container position-relative z-1">
                    <div className="row align-items-end mb-8">
                        <div className="col-lg-7">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small-line" />
                                <span className="btn-text text-primary">Meet our team</span>
                            </div>
                            <h2 className="text-dark my-3 text-anime-style-3">Meet the Innovators Shaping the Future of Technology</h2>
                        </div>
                        <div className="col-lg-4 ms-lg-auto text-lg-end">
                            <Link href="/contact" className="btn btn-linear hover-up mt-3">
                                <span>Contact us</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                    <g clipPath="url(#clip0_914_180)">
                                        <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="white" />
                                    </g>
                                </svg>
                            </Link>
                        </div>
                    </div>
                    <div className="row g-4">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="col-lg-3 col-md-4 col-6" data-aos="fade-up" data-aos-delay={member.delay}>
                                <div className="card-team-member text-center">
                                    <div className="position-relative overflow-hidden">
                                        <Link href={member.linkAuthor}>
                                            <div className="zoom-img rounded-4 overflow-hidden">
                                                <img className="w-100" src={`/assets/imgs/pages/ai-solutions/page-about/${member.img}`} alt={member.name} />
                                            </div>
                                        </Link>
                                        <div className="position-absolute bottom-0 start-50 translate-middle-x">
                                            <div className="social-icons mb-3">
                                                <ul className="list-unstyled d-flex mb-0">
                                                    <li>
                                                        <Link href="#">
                                                            <span className="icon">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                                    <path d="M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z" />
                                                                </svg>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link href="#">
                                                            <span className="icon">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                                    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                                                                </svg>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link href="#">
                                                            <span className="icon">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                                                    <path d="M232 237.2c31.8-15.2 48.4-38.2 48.4-74 0-70.6-52.6-87.8-113.3-87.8H0v354.4h171.8c64.4 0 124.9-30.9 124.9-102.9 0-44.5-21.1-77.4-64.7-89.7zM77.9 135.9H151c28.1 0 53.4 7.9 53.4 40.5 0 30.1-19.7 42.2-47.5 42.2h-79v-82.7zm83.3 233.7H77.9V272h84.9c34.3 0 56 14.3 56 50.6 0 35.8-25.9 47-57.6 47zm358.5-240.7H376V94h143.7v34.9zM576 305.2c0-75.9-44.4-139.2-124.9-139.2-78.2 0-131.3 58.8-131.3 135.8 0 79.9 50.3 134.7 131.3 134.7 61.3 0 101-27.6 120.1-86.3H509c-6.7 21.9-34.3 33.5-55.7 33.5-41.3 0-63-24.2-63-65.3h185.1c.3-4.2 .6-8.7 .6-13.2zM390.4 274c2.3-33.7 24.7-54.8 58.5-54.8 35.4 0 53.2 20.8 56.2 54.8H390.4z" />
                                                                </svg>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link href="#">
                                                            <span className="icon">
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                                                    <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
                                                                </svg>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-content mt-4">
                                        <div className="card-name">
                                            <Link href={member.linkAuthor}>
                                                <h6>{member.name}</h6>
                                            </Link>
                                        </div>
                                        <div className="card-role">
                                            <p>{member.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
