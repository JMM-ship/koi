import Layout from "@/components/layout/Layout";
import Section1 from "@/components/sections/contact/Section1";
import Section2 from "@/components/sections/contact/Section2";
import Section9 from "@/components/sections/home/Section9";
import PageHeader from "@/components/sections/PageHeader";
export default function Home() {
    return (
        <>
            <Layout>
                <PageHeader title="Contact Us" current_page="Contact" />
                <Section1 />
                <Section2 />
                <Section9 bordertop="border-top" />
            </Layout>
        </>
    );
}
