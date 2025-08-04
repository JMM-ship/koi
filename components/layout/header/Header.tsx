import Link from "next/link";
import MobileMenu from "../MobileMenu";
import MainMenu from "../MainMenu";

export default function Header({ scroll, isMobileMenu, handleMobileMenu }: any) {
    return (
        <>
            <header>
                <nav className={`navbar navbar-expand-lg navbar-dark z-5 ${scroll ? "navbar-stick top-0 position-fixed" : ""}`}>
                    <div className="container mt-3 mb-3">
                        <Link className="navbar-brand" href="/">
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

                            <h5 className="mb-0 text-white">Astrax</h5>
                        </Link>
                        <div className="d-none d-lg-flex">
                            <MainMenu />
                        </div>
                        <div className="d-flex align-items-center gap-4">
                            <Link href="#" className="btn btn-linear hover-up d-none d-md-flex">
                                <span>sign in</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
                                    <path d="M15.8167 7.55759C15.8165 7.5574 15.8163 7.55719 15.8161 7.557L12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H0.625C0.279813 7.375 0 7.65481 0 8C0 8.34519 0.279813 8.625 0.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C15.8163 8.44281 15.8165 8.44259 15.8167 8.4424C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="white" />
                                </svg>
                            </Link>

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
                            <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 40 40" fill="none">
                                <g>
                                    <path className="fill-green-3" d="M24.5043 9.79724L22.7082 18.3981L35.2929 17.1948L37.1117 7.00605L24.5043 9.79724Z"></path>
                                    <path className="fill-green-3" d="M31.9171 17.6837L23.2697 20.6189L30.6333 30.3865L40.723 26.6545L31.9171 17.6837Z"></path>
                                    <path className="fill-green-3" d="M28.4204 27.86L21.4605 22.2312L16.332 33.3249L24.7296 39.7347L28.4204 27.86Z"></path>
                                    <path className="fill-green-3" d="M17.5913 29.998L19.1912 21.3633L6.63465 22.8288L5.04812 33.0511L17.5913 29.998Z"></path>
                                    <path className="fill-green-3" d="M10.2917 22.1777L18.8717 19.0632L11.2859 9.45346L1.28177 13.3945L10.2917 22.1777Z"></path>
                                    <path className="fill-green-3" d="M13.7243 12.2243L20.8121 17.7054L25.6875 6.50938L17.1442 0.277556L13.7243 12.2243Z"></path>
                                </g>
                            </svg>
                            <h5 className="mb-0 text-dark">Astrax</h5>
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
