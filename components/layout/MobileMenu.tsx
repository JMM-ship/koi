"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
    isMobileMenu: boolean;
    handleMobileMenu: () => void;
}

export default function MobileMenu({ isMobileMenu, handleMobileMenu }: MobileMenuProps) {
    const [isAccordion, setIsAccordion] = useState<number | null>(null);
    const pathname = usePathname();

    const handleAccordion = (key: number) => {
        setIsAccordion((prevState) => (prevState === key ? null : key));
    };

    useEffect(() => {
        if (isMobileMenu) {
            handleMobileMenu();
        }
    }, [pathname]);

    return (
        <>
            {isMobileMenu && <div className="mobile-menu-overlay" onClick={handleMobileMenu} />}

            <div className={`mobile-header-active mobile-header-wrapper-style ${isMobileMenu ? "sidebar-visible" : ""}`}>
                <div className="mobile-header-wrapper-inner">
                    <div className="mobile-header-logo">
                        <Link className="d-flex align-items-center gap-2" href="/">
                            <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 40 40" fill="none">
                                <g clipPath="url(#clip0_2220_28334)">
                                    <path d="M24.5043 9.79627L22.7082 18.3971L35.2929 17.1938L37.1117 7.00508L24.5043 9.79627Z" fill="url(#paint0_linear_2220_28334)" />
                                    <path d="M31.9171 17.6827L23.2697 20.618L30.6333 30.3856L40.723 26.6535L31.9171 17.6827Z" fill="url(#paint1_linear_2220_28334)" />
                                    <path d="M28.4204 27.859L21.4605 22.2303L16.332 33.3239L24.7296 39.7337L28.4204 27.859Z" fill="url(#paint2_linear_2220_28334)" />
                                    <path d="M17.5913 29.997L19.1912 21.3623L6.63465 22.8278L5.04812 33.0501L17.5913 29.997Z" fill="url(#paint3_linear_2220_28334)" />
                                    <path d="M10.2917 22.1767L18.8717 19.0623L11.2859 9.45248L1.28177 13.3935L10.2917 22.1767Z" fill="url(#paint4_linear_2220_28334)" />
                                    <path d="M13.7243 12.2233L20.8121 17.7044L25.6875 6.50841L17.1442 0.276579L13.7243 12.2233Z" fill="url(#paint5_linear_2220_28334)" />
                                </g>
                                <defs>
                                    <linearGradient id="paint0_linear_2220_28334" x1="37.506" y1="0.189907" x2="-2.52908" y2="9.62" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#23EFEF" />
                                        <stop offset="0.349611" stopColor="#37B8BE" />
                                        <stop offset="0.701514" stopColor="#2DA0FF" />
                                        <stop offset={1} stopColor="#B172FE" />
                                    </linearGradient>
                                    <linearGradient id="paint1_linear_2220_28334" x1="37.506" y1="0.189907" x2="-2.52908" y2="9.62" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#23EFEF" />
                                        <stop offset="0.349611" stopColor="#37B8BE" />
                                        <stop offset="0.701514" stopColor="#2DA0FF" />
                                        <stop offset={1} stopColor="#B172FE" />
                                    </linearGradient>
                                    <linearGradient id="paint2_linear_2220_28334" x1="37.506" y1="0.189907" x2="-2.52908" y2="9.62" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#23EFEF" />
                                        <stop offset="0.349611" stopColor="#37B8BE" />
                                        <stop offset="0.701514" stopColor="#2DA0FF" />
                                        <stop offset={1} stopColor="#B172FE" />
                                    </linearGradient>
                                    <linearGradient id="paint3_linear_2220_28334" x1="37.506" y1="0.189907" x2="-2.52908" y2="9.62" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#23EFEF" />
                                        <stop offset="0.349611" stopColor="#37B8BE" />
                                        <stop offset="0.701514" stopColor="#2DA0FF" />
                                        <stop offset={1} stopColor="#B172FE" />
                                    </linearGradient>
                                    <linearGradient id="paint4_linear_2220_28334" x1="37.506" y1="0.189907" x2="-2.52908" y2="9.62" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#23EFEF" />
                                        <stop offset="0.349611" stopColor="#37B8BE" />
                                        <stop offset="0.701514" stopColor="#2DA0FF" />
                                        <stop offset={1} stopColor="#B172FE" />
                                    </linearGradient>
                                    <linearGradient id="paint5_linear_2220_28334" x1="37.506" y1="0.189907" x2="-2.52908" y2="9.62" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#23EFEF" />
                                        <stop offset="0.349611" stopColor="#37B8BE" />
                                        <stop offset="0.701514" stopColor="#2DA0FF" />
                                        <stop offset={1} stopColor="#B172FE" />
                                    </linearGradient>
                                    <clipPath id="clip0_2220_28334">
                                        <rect width={40} height={40} fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                            <h5 className="mb-0">Astrax</h5>
                        </Link>
                        <div className={`burger-icon burger-icon-white border rounded-circle ${isMobileMenu ? "burger-close" : ""}`} onClick={handleMobileMenu}>
                            <span className="burger-icon-top" />
                            <span className="burger-icon-mid" />
                            <span className="burger-icon-bottom" />
                        </div>
                    </div>
                    <div className="mobile-header-content-area">
                        <div className="perfect-scroll">
                            <div className="mobile-menu-wrap mobile-header-border">
                                <nav>
                                    <ul className="mobile-menu ps-0">
                                        <li>
                                            <Link href="/">Homepages</Link>
                                        </li>
                                        <li>
                                            <Link href="/about">About Us</Link>
                                        </li>
                                        <li className="has-children">
                                            <span className="menu-expand" onClick={() => handleAccordion(1)}>
                                                <i className="arrow-small-down" />
                                            </span>
                                            <Link href="#">Services</Link>
                                            <ul className="sub-menu" style={{ display: `${isAccordion == 1 ? "block" : "none"}` }}>
                                                <li>
                                                    <Link href="/services">Services</Link>
                                                </li>
                                                <li>
                                                    <Link href="/services-details">Services Details</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="has-children">
                                            <Link href="#">Blog</Link>
                                            <span className="menu-expand" onClick={() => handleAccordion(2)}>
                                                <i className="arrow-small-down" />
                                            </span>
                                            <ul className="sub-menu" style={{ display: `${isAccordion == 2 ? "block" : "none"}` }}>
                                                <li>
                                                    <Link href="/blog">Blog</Link>
                                                </li>
                                                <li>
                                                    <Link href="/blog-details">Blog Details</Link>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <Link href="/pricing">Pricing</Link>
                                        </li>
                                        <li>
                                            <Link href="/contact">Contact</Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="tgmobile__menu-bottom mt-auto">
                        <div className="contact-info">
                            <ul className="list-wrap">
                                <li>
                                    <span className="opacity-50">Mail:</span> <Link href="/mailto:info@valom.com">info@astrax.com</Link>
                                </li>
                                <li>
                                    <span className="opacity-50">Phone:</span> <Link href="/tel:0123456789">+123 888 9999</Link>
                                </li>
                            </ul>
                        </div>
                        <div className="social-links">
                            <div className="social-icons gap-4 mt-4">
                                <Link href="#" className="border border-opacity-10 border-white icon-shape icon-md">
                                    <i className="bi bi-facebook" />
                                </Link>
                                <Link href="#" className="border border-opacity-10 border-white icon-shape icon-md">
                                    <i className="bi bi-twitter-x" />
                                </Link>
                                <Link href="#" className="border border-opacity-10 border-white icon-shape icon-md">
                                    <i className="bi bi-linkedin" />
                                </Link>
                                <Link href="#" className="border border-opacity-10 border-white icon-shape icon-md">
                                    <i className="bi bi-behance" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
