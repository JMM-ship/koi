import Breadcrumb from "@/components/elements/Breadcrumb";

interface PageHeaderProps {
    title: string;
    current_page: string;
}

export default function PageHeader({ title, current_page }: PageHeaderProps) {
    return (
        <>
            {/*tax-software section header*/}
            <section className="ai-solutions-section-header position-relative bg-dark-1">
                <img className="position-absolute bottom-0 end-0" data-aos="fade-left" data-aos-delay={400} src="assets/imgs/pages/ai-solutions/page-home/banner-header.png" alt="AstraX" />

                <div className="position-relative">
                    <div className="container position-relative">
                        <div className="bg-overlay" />
                        <div className="container position-relative z-1 py-120-keep">
                            <div className="row align-items-center">
                                <div className="col-lg-9">
                                    <h2 className="text-white text-anime-style-2">{title}</h2>
                                </div>
                            </div>
                            <Breadcrumb page={current_page} />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
