"use client";
import Link from "next/link";
import { useT } from "@/contexts/I18nContext";

export default function Section2() {
    let t = (k: string) => k
    try { t = useT().t } catch {}
    return (
        <>
            {/* ai-solutions-home section 2 - Core Advantages */}
            <section className="ai-solutions-home-section-2 position-relative overflow-hidden pt-120 pb-120">
                <div className="container position-relative z-1">
                    <div className="row justify-content-center mb-5">
                        <div className="d-flex align-items-center gap-3 justify-content-center">
                            <span className="small-line" />
                            <span className="btn-text text-primary">{t('home.s2.tag') || 'why choose us'}</span>
                            <span className="small-line" />
                        </div>
                        <div className="col-12 text-center">
                            <h2 className="text-dark fw-bold mb-3 text-anime-style-3">{t('home.s2.title') || 'Our Core Advantages'}</h2>
                            <p className="text-secondary fs-5 mb-0">{t('home.s2.desc') || 'Based on a dynamic pool of official Max accounts worth $200 each, we provide a service experience identical to the official one.'}</p>
                        </div>
                    </div>
                    <div className="row g-4 justify-content-center">
                        {/* Card 1 (New First): All-in-One CLI Access */}
                        <div className="col-lg-3 col-md-6">
                            <div className="bg-white rounded-4 shadow-sm p-5 h-100 text-center border" data-aos="fade-up" data-aos-delay={0}>
                                <div className="mb-3">
                                    <img src="/assets/imgs/pages/ai-solutions/page-home/home-section-3/icon-4.svg" alt="CLI Tools" style={{ width: 48, height: 48 }} />
                                </div>
                                <h4 className="fw-bold mb-2">{t('home.s2.c1.title') || 'All-in-One CLI Access'}</h4>
                                <div className="fw-bold text-primary mb-2">{t('home.s2.c1.subtitle') || 'One subscription, all top CLIs'}</div>
                                <p className="text-secondary mb-4">{t('home.s2.c1.desc') || 'Use the market’s best AI command-line tools under a single plan—simpler workflow and far more cost-effective than purchasing separately.'}</p>
                                <div>
                                    <span className="badge text-white bg-primary bg-opacity-10 px-3 py-2 rounded-pill">{t('home.s2.c1.badge') || 'Best Value'}</span>
                                </div>
                            </div>
                        </div>
                        {/* Card 2: Professional Service */}
                        <div className="col-lg-3 col-md-6">
                            <div className="bg-white rounded-4 shadow-sm p-5 h-100 text-center border" data-aos="fade-up" data-aos-delay={200}>
                                <div className="mb-3">
                                    <img src="/assets/imgs/pages/ai-solutions/page-home/home-section-3/icon-3.svg" alt="Service" style={{ width: 48, height: 48 }} />
                                </div>
                                <h4 className="fw-bold mb-2">{t('home.s2.c2.title') || 'Professional Service'}</h4>
                                <div className="fw-bold text-primary mb-2">{t('home.s2.c2.subtitle') || '1-on-1 Engineer Support'}</div>
                                <p className="text-secondary mb-4">{t('home.s2.c2.desc') || 'Expert technical support from real engineers (not bots). Remote troubleshooting and professional assistance when you need it.'}</p>
                                <div>
                                    <span className="badge text-white bg-primary bg-opacity-10 px-3 py-2 rounded-pill">{t('home.s2.c2.badge') || 'Not a robot!'}</span>
                                </div>
                            </div>
                        </div>
                        {/* Card 3 (Updated): Unique Credit Mechanism */}
                        <div className="col-lg-3 col-md-6">
                            <div className="bg-white rounded-4 shadow-sm p-5 h-100 text-center border" data-aos="fade-up" data-aos-delay={400}>
                                <div className="mb-3">
                                    <img src="/assets/imgs/pages/ai-solutions/page-home/home-section-3/icon-2.svg" alt="Credits" style={{ width: 48, height: 48 }} />
                                </div>
                                <h4 className="fw-bold mb-2">{t('home.s2.c3.title') || 'Unique Credit Mechanism'}</h4>
                                <div className="fw-bold text-primary mb-2">{t('home.s2.c3.subtitle') || 'Transparent mechanics, efficient usage'}</div>
                                <p className="text-secondary mb-4">{t('home.s2.c3.desc') || 'Credits restore every hour, ensuring continuous and stable supply to meet any workload.'}</p>
                                <div>
                                    <span className="badge text-white bg-primary bg-opacity-10 px-3 py-2 rounded-pill">{t('home.s2.c3.badge') || 'Always On'}</span>
                                </div>
                            </div>
                        </div>
                        {/* Card 4: Account Security */}
                        <div className="col-lg-3 col-md-6">
                            <div className="bg-white rounded-4 shadow-sm p-5 h-100 text-center border" data-aos="fade-up" data-aos-delay={600}>
                                <div className="mb-3">
                                    <img src="/assets/imgs/pages/ai-solutions/page-home/home-section-3/icon-1.svg" alt="Security" style={{ width: 48, height: 48 }} />
                                </div>
                                <h4 className="fw-bold mb-2">{t('home.s2.c4.title') || 'Account Security'}</h4>
                                <div className="fw-bold text-primary mb-2">{t('home.s2.c4.subtitle') || 'Technical Transfer, Zero Ban Risk'}</div>
                                <p className="text-secondary mb-4">{t('home.s2.c4.desc') || 'Professional technical architecture ensures your account is completely safe. With our technical transfer method, your account will never face any ban risk.'}</p>
                                <div>
                                    <span className="badge text-white bg-primary bg-opacity-10 px-3 py-2 rounded-pill">{t('home.s2.c4.badge') || 'Use with confidence!'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
