import Layout from "@/components/layout/Layout";
import Section1D from "@/components/sections/services-details/Section1";
import Section2 from "@/components/sections/services-details/Section2";
import Section1 from "@/components/sections/services/Section1";
import Section9 from "@/components/sections/home/Section9";
import PageHeader from "@/components/sections/PageHeader";
export default function Home() {
    return (
        <>
            <Layout>
                <PageHeader title="Machine Learning Services" current_page="Service Details" />
                <Section1D />
                <Section2 />
                <Section1 title="You may also be interested in" display="d-none" ds_btn="d-block" />
                <Section9 bordertop="border-top" />
            </Layout>
        </>
    );
}
