'use client'
import Link from "next/link";
import { useEffect } from 'react';
import { useT } from "@/contexts/I18nContext";

export default function Section5() {
    let t = (k: string) => k
    try { t = useT().t } catch {}
    useEffect(() => {
        // Initialize counter animations
        const animateValue = (element: HTMLElement, start: number, end: number, duration: number, suffix: string = '') => {
            const range = end - start;
            const increment = end > start ? 1 : -1;
            const stepTime = Math.abs(Math.floor(duration / range));
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                element.textContent = current + suffix;
                if (current === end) {
                    clearInterval(timer);
                }
            }, stepTime);
        };

        // Intersection Observer for triggering animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.counter-value');
                    counters.forEach((counter) => {
                        const element = counter as HTMLElement;
                        const endValue = parseInt(element.getAttribute('data-value') || '0');
                        const suffix = element.getAttribute('data-suffix') || '';
                        animateValue(element, 0, endValue, 2000, suffix);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const section = document.querySelector('.usage-comparison-section');
        if (section) {
            observer.observe(section);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <>
            {/*ai-solutions-home section 5*/}
            <section className="ai-solutions-home-section-5 usage-comparison-section position-relative overflow-hidden py-120 bg-dark">
                <div className="container position-relative z-1">
                    <div className="text-center">
                        <div className="d-flex align-items-center gap-3 justify-content-center" data-aos="fade-up">
                            <span className="small-line bg-white" />
                            <span className="btn-text text-white">{t('home.s5.tag') || 'USAGE GUIDE'}</span>
                            <span className="small-line bg-white" />
                        </div>
                        <h2 className="text-white my-3 text-anime-style-2" data-aos="fade-up" data-aos-delay="100">{t('home.s5.title') || 'Credit Usage Guide'}</h2>
                        <p className="text-white opacity-75 mt-3" data-aos="fade-up" data-aos-delay="200">{t('home.s5.subtitle') || 'Understand the value of credits and consumption comparison across different platforms'}</p>
                    </div>
                    <div className="row mt-80">
                        <div className="col-md-6 mb-5 mb-md-0">
                            <div className="usage-card bg-dark border border-secondary p-5 rounded-4 h-100" data-aos="fade-right" data-aos-delay="300">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="icon-wrapper bg-danger bg-opacity-10 rounded-circle p-3">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2Z" fill="#dc3545"/>
                                        </svg>
                                    </div>
                                    <h4 className="mb-0 text-white">{t('home.s5.left.title') || 'Credits can be used for:'}</h4>
                                </div>
                                <div className="usage-items">
                                    <div className="usage-item d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                                        <span className="text-white">{t('home.s5.left.items.sonnet4') || 'Sonnet 4 model calls'}</span>
                                        <span className="counter-value text-primary fw-bold fs-5" data-value="100" data-suffix="%">0%</span>
                                    </div>
                                    <div className="usage-item d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                                        <span className="text-white">{t('home.s5.left.items.opus4') || 'Opus 4 model calls'}</span>
                                        <span className="counter-value text-primary fw-bold fs-5" data-value="20" data-suffix="%">0%</span>
                                    </div>
                                    <div className="usage-item d-flex justify-content-between align-items-center py-3">
                                        <span className="text-white">{t('home.s5.left.items.cursorFast') || 'Equivalent to Cursor fast requests'}</span>
                                        <span className="counter-value text-primary fw-bold fs-5" data-value="2000" data-suffix=" times">0 times</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="usage-card bg-dark border border-secondary p-5 rounded-4 h-100" data-aos="fade-left" data-aos-delay="400">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="icon-wrapper bg-warning bg-opacity-10 rounded-circle p-3">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="#ffc107"/>
                                            <path d="M7 12H17V14H7V12Z" fill="#ffc107"/>
                                        </svg>
                                    </div>
                                    <h4 className="mb-0 text-white">{t('home.s5.right.title') || 'Consumption in Cursor:'}</h4>
                                </div>
                                <div className="usage-items">
                                    <div className="usage-item d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                                        <span className="text-white">{t('home.s5.right.items.sonnet4PerConv') || 'Sonnet 4 per conversation'}</span>
                                        <span className="counter-value text-warning fw-bold fs-5" data-value="15" data-suffix="-20%">0%</span>
                                    </div>
                                    <div className="usage-item d-flex justify-content-between align-items-center py-3 border-bottom border-secondary">
                                        <span className="text-white">{t('home.s5.right.items.opus4PerConv') || 'Opus 4 per conversation'}</span>
                                        <span className="counter-value text-warning fw-bold fs-5" data-value="60" data-suffix="-70%">0%</span>
                                    </div>
                                    <div className="usage-item d-flex justify-content-between align-items-center py-3">
                                        <span className="text-white opacity-50">{t('home.s5.right.items.efficient') || 'More efficient credit utilization'}</span>
                                        <span className="text-success fw-bold">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-5" data-aos="fade-up" data-aos-delay="500">
                        <div className="alert bg-dark border border-warning d-inline-flex align-items-center gap-2 px-5 py-3 rounded-pill">
                            <span className="fs-4">💡</span>
                            <span className="fw-medium text-warning">{t('home.s5.alert') || 'Compared to the official $200 fixed monthly fee, we offer flexible billing options with better value!'}</span>
                        </div>
                    </div>
                </div>
                <div className="position-absolute bottom-0 start-50 translate-middle-x z-0 w-100">
                    <img className="w-100" data-aos="fade-up" src="assets/imgs/pages/ai-solutions/page-home/home-section-5/bg-bottom.png" alt="AstraX" />
                </div>
            </section>
        </>
    );
}
