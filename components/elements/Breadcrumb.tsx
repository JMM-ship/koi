import Link from "next/link";

export default function Breadcrumb({ page }: any) {
    return (
        <div className="d-flex align-items-center gap-2">
            <img src="assets/imgs/pages/ai-solutions/icons/home.svg" alt="AstraX" />
            <Link href="/">
                <span className="fw-semibold text-capitalize text-white">home</span>
            </Link>
            <i className="fa-solid fa-arrow-right text-white fw-semibold opacity-75"></i>
            <span>
                <span className="fw-semibold text-capitalize text-white">{page}</span>
            </span>
        </div>
    );
}
