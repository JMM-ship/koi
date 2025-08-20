"use client";

import Link from "next/link";
import MobileMenu from "../MobileMenu";
import MainMenu from "../MainMenu";
import Image from "next/image";
import { useSession } from "next-auth/react";
import DashboardLinkButton from "@/components/elements/DashboardLinkButton";

export default function Header({ scroll, isMobileMenu, handleMobileMenu }: any) {
    const { data: session, status } = useSession();
    const user = session?.user;

    return (
        <>
            <header>
                <nav className={`navbar navbar-expand-lg navbar-dark z-5 ${scroll ? "navbar-stick top-0 position-fixed" : ""}`}>
                    <div className="container mt-3 mb-3">
                        <Link className="navbar-brand" href="/">
                            <div style={{ overflow: 'hidden', width: '120px', height: '80px' }}>
                                <Image src="/assets/logo.svg" alt="KOI" width={120} height={80} style={{ objectFit: 'cover', objectPosition: 'left center', transform: 'scale(1.2)' }} />
                            </div>
                        </Link>
                        <div className="d-none d-lg-flex">
                            <MainMenu />
                        </div>
                        <div className="d-flex align-items-center gap-4">
                            {user?.uuid ?
                                (<DashboardLinkButton />) :
                                (<Link href="/auth/signin" className="btn btn-linear hover-up d-none d-md-flex">
                                    <span>sign in</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                        <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="white" />
                                    </svg>
                                </Link>)}
                            <div className="burger-icon burger-icon-white border rounded-3 top-0 end-0" onClick={handleMobileMenu}>
                                <span className="burger-icon-top" />
                                <span className="burger-icon-mid" />
                                <span className="burger-icon-bottom" />
                            </div>
                        </div>
                    </div>
                </nav>
                {/* offCanvas-menu */}
                <div className="offCanvas__info">
                    <div className="offCanvas__close-icon menu-close">
                        <button className="btn-close" aria-label="Close">
                            <i className="ri-close-line" />
                        </button>
                    </div>
                    <div className="offCanvas__logo mb-30">
                        <Link className="d-flex align-items-center gap-2" href="/">
                            <div style={{ overflow: 'hidden', width: '120px', height: '80px' }}>
                                <Image src="/assets/logo.svg" alt="KOI" width={120} height={80} style={{ objectFit: 'cover', objectPosition: 'left center', transform: 'scale(1.2)' }} />
                            </div>
                        </Link>
                    </div>
                    <div className="offCanvas__side-info mb-30">
                        <div className="contact-list mb-30">
                            <h4>Office Address</h4>
                            <p>
                                123/A, Miranda City Likaoli <br />
                                Prikano, Dope
                            </p>
                        </div>
                        <div className="contact-list mb-30">
                            <h4>Phone Number</h4>
                            <p>+0989 7876 9865 9</p>
                            <p>+(090) 8765 86543 85</p>
                        </div>
                        <div className="contact-list mb-30">
                            <h4>Email Address</h4>
                            <p>info@example.com</p>
                            <p>example.mail@hum.com</p>
                        </div>
                    </div>
                    <div className="offCanvas__social-icon mt-30">
                        <Link href="/javascript:void(0)">
                            <i className="bi bi-facebook" />
                        </Link>
                        <Link href="/javascript:void(0)">
                            <i className="bi bi-twitter-x" />
                        </Link>
                        <Link href="/javascript:void(0)">
                            <i className="bi bi-linkedin" />
                        </Link>
                        <Link href="/javascript:void(0)">
                            <i className="bi bi-behance" />
                        </Link>
                    </div>
                </div>
                <div className="offCanvas__overly" />
                {/* Offcanvas search */}
                <div className="offcanvas offcanvas-top" tabIndex={-1} id="offcanvasTop">
                    <div className="offcanvas-header">
                        <button className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
                    </div>
                    <div className="offcanvas-body">
                        <div className="container">
                            <div className="row">
                                <div className="col-8 mx-auto">
                                    <h3 className="mb-4">What are you looking for?</h3>
                                    <form className="input-group mb-3" data-aos="zoom-in">
                                        <input type="text" className="form-control" placeholder="Enter Your Keywords" aria-label="Enter Your Keywords" aria-describedby="button-addon2" />
                                        <button className="btn btn-primary rounded-end-2" type="submit" aria-label="search" id="button-addon2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none">
                                                <path d="M19.25 19.25L15.5 15.5M4.75 11C4.75 7.54822 7.54822 4.75 11 4.75C14.4518 4.75 17.25 7.54822 17.25 11C17.25 14.4518 14.4518 17.25 11 17.25C7.54822 17.25 4.75 14.4518 4.75 11Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Offcanvas search */}
                <MobileMenu isMobileMenu={isMobileMenu} handleMobileMenu={handleMobileMenu} />
            </header>
        </>
    );
}
