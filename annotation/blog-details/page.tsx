import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/sections/PageHeader";
import Section1 from "@/components/sections/blog-details/Section1";
import Section9 from "@/components/sections/home/Section9";
export default function Home() {
    return (
        <>
            <Layout>
                <PageHeader title="Top 10 AI Trends Shaping 2025: What Businesses Need to Know" current_page="Top 10 AI Trends Shaping 2025: What Businesses Need to Know" />
                <Section1 />
                <Section9 bordertop="border-top" />
            </Layout>
        </>
    );
}
