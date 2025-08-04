import Link from "next/link"

export default function Pagination() {
    return (
        <section className="pb-120">
            <div className="container">
                <div className="row pt-5 text-center">
                    <div className="d-flex justify-content-center align-items-center">
                        <nav aria-label="Page navigation example">
                            <ul className="pagination gap-2">
                                <li className="page-item">
                                    <Link
                                        className="icon-md fs-5 page-link pagination_item border-0 icon-shape fw-regular"
                                        href="#"
                                        aria-label="Previous"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width={22}
                                            height={22}
                                            viewBox="0 0 22 22"
                                            fill="none"
                                        >
                                            <path
                                                className="stroke-dark"
                                                d="M9.49554 6.5L4.78125 11L9.49554 15.5"
                                                stroke="#111827"
                                                strokeWidth="1.28571"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                className="stroke-dark"
                                                d="M17.2143 11H5"
                                                stroke="#111827"
                                                strokeWidth="1.28571"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </Link>
                                </li>
                                <li className="page-item">
                                    <Link
                                        className="icon-md fs-5 page-link pagination_item border-0 icon-shape fw-regular"
                                        href="#"
                                    >
                                        1
                                    </Link>
                                </li>
                                <li className="page-item">
                                    <Link
                                        className="icon-md fs-5 page-link pagination_item border-0 icon-shape fw-regular active"
                                        href="#"
                                    >
                                        2
                                    </Link>
                                </li>
                                <li className="page-item">
                                    <Link
                                        className="icon-md fs-5 page-link pagination_item border-0 icon-shape fw-regular"
                                        href="#"
                                    >
                                        3
                                    </Link>
                                </li>
                                <li className="page-item">
                                    <Link
                                        className="icon-md fs-5 page-link pagination_item border-0 icon-shape fw-regular"
                                        href="#"
                                    >
                                        ...
                                    </Link>
                                </li>
                                <li className="page-item">
                                    <Link
                                        className="icon-md fs-5 page-link pagination_item border-0 icon-shape fw-regular"
                                        href="#"
                                        aria-label="Next"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width={22}
                                            height={22}
                                            viewBox="0 0 22 22"
                                            fill="none"
                                        >
                                            <path
                                                className="stroke-dark"
                                                d="M12.5 6.5L17.2143 11L12.5 15.5"
                                                stroke="#111827"
                                                strokeWidth="1.28571"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                className="stroke-dark"
                                                d="M16.9955 11H4.78125"
                                                stroke="#111827"
                                                strokeWidth="1.28571"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </section>
    );
}
