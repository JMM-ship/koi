import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/sections/PageHeader";
import Section6 from "@/components/sections/home/Section6";
import Section1 from "@/components/sections/pricing/Section1";
import Section9 from "@/components/sections/home/Section9";
import Section4 from "@/components/sections/services/Section4";
export default function Home() {
    return (
        <>
            <Layout>
                <PageHeader title="Pricing" current_page="Pricing" />
                <Section6 />
                <Section1 />
                <Section4 />
                <Section9 bordertop="" />
            </Layout>
        </>
    );
}
