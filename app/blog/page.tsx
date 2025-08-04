import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/sections/PageHeader";
import Section1 from "@/components/sections/blog/Section1";
import Section2 from "@/components/sections/blog/Section2";
export default function Home() {
    return (
        <>
            <Layout>
                <PageHeader title="News" current_page="News" />
                <Section1 />
                <Section2 />
            </Layout>
        </>
    );
}
