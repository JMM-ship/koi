import Link from "next/link";

export default function Section6() {
    return (
        <>
            {/*ai-solutions-home section 6*/}
            <section className="ai-solutions-home-section-6 position-relative overflow-hidden py-120">
                <div className="container position-relative z-1">
                    <div className="row">
                        <div className="col-lg-auto me-lg-auto">
                            <div className="d-flex align-items-center gap-3">
                                <span className="small-line" />
                                <span className="btn-text text-primary">pricing</span>
                            </div>
                            <h2 className="text-dark my-3 text-anime-style-3">Get a plan that grows with you</h2>
                        </div>
                        <div className="col-lg-auto align-self-end">
                            <div className="d-flex justify-content-lg-end">
                                <ul className="list-unstyled d-flex gap-2 align-items-center change-price-plan bg-white rounded-pill py-1 shadow-2">
                                    <li>
                                        <Link href="#" className="active monthly btn btn-white bg-light-2" data-type="monthly">
                                            Monthly
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="#" className="yearly btn btn-white bg-light-2" data-type="yearly">
                                            Yearly
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="row g-lg-5 g-4 mt-3">
                        <div className="col-lg-4">
                            <div className="card-pricing card-basic rounded-4 p-md-6 p-4" data-aos="fade-up" data-aos-delay={200}>
                                <span className="text-primary btn-text">Basic</span>
                                <div className="d-flex mb-3">
                                    <h1 className="mb-0">$</h1>
                                    <h1 className="mb-0 text-price-basic">99</h1>
                                </div>
                                <p className="fs-7 mb-5">Best for small business owners, startups who needes landing page.</p>
                                <span className="btn-text">What’s included:</span>
                                <ul className="list-unstyled mt-3 mb-0">
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0 text-decoration-line-through">Marketing strategy</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">Competitive work analysis</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0 text-decoration-line-through">Social media share audit</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top pt-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">24/7 online support</p>
                                    </li>
                                </ul>
                                <Link href="#" className="btn btn-outline-dark w-100 mt-6 hover-up">
                                    try for free
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="card-pricing card-advanced rounded-4 p-md-6 p-4 position-relative" data-aos="fade-up" data-aos-delay={400}>
                                <span className="text-primary btn-text">advanced</span>
                                <div className="d-flex mb-3">
                                    <h1 className="mb-0">$</h1>
                                    <h1 className="mb-0 text-price-advanced">199</h1>
                                </div>
                                <p className="fs-7 mb-5">Best for small business owners, startups who needes landing page.</p>
                                <span className="btn-text">What’s included:</span>
                                <ul className="list-unstyled mt-3 mb-0">
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">Marketing strategy</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">Competitive work analysis</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0 text-decoration-line-through">Social media share audit</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top pt-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">24/7 online support</p>
                                    </li>
                                </ul>
                                <span className="sale-off text-white fs-8 position-absolute top-0 end-0 me-6 px-2">-25% off</span>
                                <Link href="#" className="btn btn-linear hover-up w-100 mt-6">
                                    try for free
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="card-pricing card-team rounded-4 p-md-6 p-4" data-aos="fade-up" data-aos-delay={600}>
                                <span className="text-primary btn-text">team</span>
                                <div className="d-flex mb-3">
                                    <h1 className="mb-0">$</h1>
                                    <h1 className="mb-0 text-price-team">499</h1>
                                </div>
                                <p className="fs-7 mb-5">Best for small business owners, startups who needes landing page.</p>
                                <span className="btn-text">What’s included:</span>
                                <ul className="list-unstyled mt-3 mb-0">
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">Marketing strategy</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">Competitive work analysis</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top py-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">Social media share audit</p>
                                    </li>
                                    <li className="border-card d-flex align-items-center gap-3 border-top pt-3">
                                        <img src="assets/imgs/template/icons/plus.svg" alt="AstraX" />
                                        <p className="fs-7 mb-0">24/7 online support</p>
                                    </li>
                                </ul>
                                <Link href="#" className="btn btn-outline-dark w-100 mt-6 hover-up">
                                    try for free
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="row mt-8">
                        <div className="d-flex flex-wrap align-items-center justify-content-center gap-5">
                            <div className="d-flex align-items-center gap-3" data-aos="fade-up" data-aos-delay={0}>
                                <div className="d-block">
                                    <svg className="fill-primary" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" fill="none">
                                        <g clipPath="url(#clip0_349_1213)">
                                            <path d="M13.9476 4.03755C13.8717 3.96164 13.7721 3.92368 13.6723 3.92368C13.5727 3.92368 13.473 3.96161 13.3971 4.03751C13.2453 4.18932 13.2453 4.43632 13.3971 4.58809C13.5489 4.73997 13.7959 4.7399 13.9476 4.58809C14.0211 4.51455 14.0616 4.41678 14.0616 4.31278C14.0617 4.20886 14.0212 4.11109 13.9476 4.03755Z" fill="#0D6EFD" />
                                            <path d="M7.50275 9.75126C7.39735 9.64586 7.29782 9.59485 7.20403 9.59794C7.11026 9.60114 7.017 9.64902 6.92429 9.74177L6.61133 10.0547L7.19928 10.6427L7.51224 10.3297C7.60495 10.237 7.65287 10.1438 7.65606 10.05C7.65923 9.95625 7.60815 9.85669 7.50275 9.75126Z" fill="#0D6EFD" />
                                            <path
                                                d="M17.9738 6.94841L17.1162 2.20497C16.9953 1.5357 16.4643 1.00473 15.7951 0.883727L11.0516 0.0261619C10.5229 -0.0694278 9.98084 0.100306 9.60112 0.480028L0.480058 9.60112C0.170507 9.91067 0 10.3222 0 10.76C0 11.1978 0.170472 11.6094 0.480058 11.9189L6.08114 17.5199C6.39069 17.8295 6.80226 18 7.24003 18C7.67779 18 8.0894 17.8295 8.39892 17.5199L17.52 8.39889C17.8997 8.01913 18.0694 7.47688 17.9738 6.94841ZM6.75185 13.5966C6.7297 13.6714 6.68495 13.7425 6.61755 13.8099C6.55005 13.8774 6.479 13.9222 6.40419 13.9442C6.32938 13.9664 6.26782 13.9532 6.21927 13.9047L4.21206 11.8975C4.16362 11.849 4.14723 11.7906 4.16305 11.7221C4.1788 11.6536 4.21625 11.5899 4.27527 11.5308L5.37215 10.434C5.42059 10.3855 5.4786 10.3697 5.54596 10.3865C5.61346 10.4034 5.67554 10.4403 5.73246 10.4972C5.79356 10.5584 5.83206 10.6231 5.84788 10.6916C5.86363 10.7602 5.84834 10.8175 5.802 10.8639L4.98328 11.6826L5.51752 12.2168L5.99483 11.7395C6.04113 11.6932 6.09647 11.6758 6.16077 11.6873C6.22504 11.6989 6.28354 11.7311 6.33616 11.7838C6.38464 11.8322 6.41519 11.8881 6.42785 11.9513C6.44044 12.0145 6.42258 12.0704 6.37413 12.1188L5.89682 12.5961L6.71234 13.4117C6.76089 13.4602 6.774 13.5218 6.75185 13.5966ZM9.4387 10.8623C9.42713 10.9835 9.38442 11.081 9.31066 11.1547C9.23687 11.2285 9.15369 11.2506 9.06094 11.2211L7.78709 10.8134L7.57848 11.022L8.34024 11.7838C8.38876 11.8323 8.40187 11.8939 8.37976 11.9687C8.35757 12.0436 8.31282 12.1147 8.24543 12.1821C8.17796 12.2495 8.10688 12.2943 8.0321 12.3164C7.95725 12.3386 7.89569 12.3254 7.84718 12.2769L5.8368 10.2665C5.79676 10.2264 5.77627 10.1775 5.77518 10.1195C5.77416 10.0616 5.79578 10.0104 5.84004 9.96619L6.49437 9.31186C7.01274 8.79348 7.49748 8.75973 7.94843 9.21068C8.27714 9.53946 8.36351 9.88086 8.2076 10.2348L9.29178 10.5478C9.31713 10.552 9.34131 10.5657 9.36448 10.5889C9.42555 10.6501 9.4503 10.7412 9.4387 10.8623ZM11.1852 9.24236L10.0599 10.3676C10.0008 10.4267 9.93714 10.464 9.86859 10.4799C9.8001 10.4957 9.74171 10.4793 9.69319 10.4308L7.68599 8.4236C7.63754 8.37516 7.62116 8.31673 7.63698 8.24824C7.65276 8.17972 7.69017 8.11602 7.7492 8.05696L8.87451 6.93168C8.92296 6.88323 8.98096 6.86741 9.04832 6.88422C9.11582 6.90109 9.17791 6.93797 9.23483 6.99493C9.29593 7.05606 9.33442 7.12086 9.35024 7.1893C9.36599 7.25786 9.3507 7.31523 9.30437 7.36157L8.45721 8.20873L8.99144 8.74296L9.46563 8.26877C9.51193 8.22248 9.5673 8.20504 9.63156 8.2166C9.69583 8.2282 9.75436 8.26037 9.80699 8.313C9.85547 8.36148 9.88602 8.41735 9.89865 8.48056C9.91123 8.54377 9.89337 8.59967 9.84493 8.64811L9.37074 9.1223L9.90807 9.65962L10.7552 8.81247C10.8015 8.76616 10.859 8.75087 10.9275 8.76662C10.996 8.78248 11.0607 8.8209 11.1219 8.88204C11.1787 8.93889 11.2157 9.00108 11.2325 9.06851C11.2495 9.13597 11.2336 9.19388 11.1852 9.24236ZM12.8889 7.53862L11.7635 8.66397C11.7045 8.72299 11.6407 8.7604 11.5722 8.77619C11.5037 8.792 11.4453 8.77566 11.3968 8.72714L9.38962 6.71993C9.34117 6.67149 9.32479 6.61306 9.34061 6.54458C9.3564 6.47606 9.3938 6.41235 9.45283 6.35329L10.5781 5.22801C10.6266 5.17957 10.6846 5.16375 10.7519 5.18055C10.8194 5.19746 10.8815 5.2343 10.9384 5.29126C10.9995 5.35239 11.038 5.41719 11.0538 5.48564C11.0696 5.55419 11.0543 5.61157 11.008 5.6579L10.1608 6.50506L10.695 7.03929L11.1692 6.56511C11.2155 6.51881 11.2709 6.50137 11.3352 6.51294C11.3994 6.52454 11.4579 6.55674 11.5106 6.60937C11.559 6.65785 11.5896 6.71371 11.6022 6.77689C11.6148 6.8401 11.597 6.896 11.5485 6.94444L11.0743 7.41863L11.6117 7.95596L12.4588 7.1088C12.5051 7.0625 12.5626 7.04724 12.6311 7.06299C12.6996 7.07881 12.7644 7.11723 12.8255 7.17837C12.8824 7.23522 12.9193 7.29744 12.9362 7.36484C12.9532 7.43223 12.9373 7.49017 12.8889 7.53862ZM14.6943 5.33461C14.4126 5.61628 14.0426 5.75711 13.6726 5.75711C13.3025 5.75711 12.9326 5.61628 12.6509 5.33457C12.0875 4.77119 12.0875 3.85453 12.6509 3.29115C13.2142 2.72777 14.1309 2.72774 14.6943 3.29115C14.9672 3.56407 15.1175 3.92692 15.1175 4.31286C15.1175 4.69881 14.9672 5.06165 14.6943 5.33461Z"
                                                fill="#0D6EFD"
                                            />
                                        </g>
                                    </svg>
                                </div>
                                <p className="text-dark mb-0">Get 30 day free trial</p>
                            </div>
                            <div className="d-flex align-items-center gap-3" data-aos="fade-up" data-aos-delay={200}>
                                <div className="d-block">
                                    <svg className="fill-primary" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" fill="none">
                                        <g clipPath="url(#clip0_349_1225)">
                                            <path
                                                d="M17.9937 3.45265C17.9937 6.18733 16.8015 8.1741 16.7513 8.25696C16.6504 8.42201 16.4756 8.51254 16.2952 8.51254C16.2005 8.51254 16.1051 8.48746 16.0187 8.43524C15.7667 8.28203 15.6859 7.95404 15.8384 7.70195C15.8495 7.68384 16.9254 5.87535 16.9254 3.45265C16.9254 2.07103 16.0271 1.06825 14.7889 1.06825C13.6107 1.06825 12.6524 2.02646 12.6524 3.20543C12.6524 3.70752 12.8955 4.98329 12.9888 5.43245C13.0494 5.72145 12.8635 6.00418 12.5745 6.06476C12.2855 6.12396 12.0027 5.93941 11.9428 5.65111C11.9059 5.47493 11.5828 3.90877 11.5828 3.20543C11.5828 1.43802 13.0208 0 14.7889 0C16.6155 0 17.9937 1.48398 17.9937 3.45265ZM14.8795 4.29318C15.0919 6.06824 15.3997 9.52716 15.0459 9.87953L7.28406 17.6421C6.80704 18.1198 6.03197 18.1198 5.55426 17.6414L0.364146 12.452C-0.11357 11.9749 -0.11357 11.1999 0.364146 10.7221L8.12668 2.96031C8.24994 2.83705 9.59256 2.83148 11.1023 2.91017C11.094 3.00975 11.0724 3.10376 11.0724 3.20543C11.0724 3.59262 11.158 4.1929 11.2479 4.72075C11.0898 4.95543 10.9972 5.23747 10.9972 5.54178C10.9972 6.35237 11.6545 7.00975 12.4651 7.00975C13.2757 7.00975 13.9331 6.35237 13.9331 5.54178C13.9331 5.04248 13.6831 4.60237 13.3022 4.33774C13.2242 3.87326 13.1615 3.42479 13.1615 3.20543C13.1615 3.15808 13.1713 3.11421 13.1754 3.06755C13.3614 3.08705 13.5445 3.10724 13.7179 3.12883C14.7437 3.25487 14.7541 3.25279 14.8795 4.29318ZM10.7423 10.1024C10.6218 9.76741 10.4213 9.3656 9.98601 8.9032L10.5751 8.31337L9.91916 7.65808L9.28337 8.29457C8.43239 7.7117 7.55496 7.75905 6.95955 8.35446C6.31053 9.00348 6.46373 9.8273 6.94005 10.7848C7.26735 11.4478 7.32724 11.8294 7.07306 12.0836C6.81192 12.3447 6.39061 12.2312 6.0083 11.8496C5.57376 11.415 5.31888 10.8781 5.19214 10.4429L4.20746 11.0265C4.32167 11.4206 4.62947 11.9826 5.06401 12.445L4.42195 13.0877L5.07724 13.7437L5.76735 13.0543C6.67752 13.6964 7.59534 13.61 8.19075 13.0146C8.80008 12.4039 8.8537 11.7214 8.33142 10.6372C7.9693 9.86003 7.88225 9.47841 8.09674 9.26462C8.28476 9.0766 8.61902 9.02298 9.05426 9.45822C9.53685 9.94081 9.69702 10.4095 9.78406 10.6574L10.7423 10.1024Z"
                                                fill="#0D6EFD"
                                            />
                                        </g>
                                    </svg>
                                </div>
                                <p className="text-dark mb-0">No any hidden fees pay</p>
                            </div>
                            <div className="d-flex align-items-center gap-3" data-aos="fade-up" data-aos-delay={400}>
                                <div className="d-block">
                                    <svg className="fill-primary" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" fill="none">
                                        <g clipPath="url(#clip0_349_1230)">
                                            <path d="M10.1771 10.3712H12.1162C12.5618 10.3712 12.923 10.01 12.923 9.56432C12.923 9.11868 12.5618 8.75718 12.1162 8.75718H10.1768C9.91973 8.38326 9.48939 8.13686 9.00037 8.13686C8.99228 8.13686 8.98562 8.13888 8.9778 8.13946L7.21081 5.65235C6.95256 5.28883 6.44875 5.20351 6.08554 5.46176C5.72232 5.72029 5.63727 6.22379 5.89526 6.58704L7.66399 9.07647C7.60818 9.22916 7.57291 9.39199 7.57291 9.56407C7.57291 10.3527 8.21173 10.9913 9.00009 10.9913C9.48936 10.9915 9.91971 10.7451 10.1771 10.3712Z" fill="#0D6EFD" />
                                            <path
                                                d="M14.9617 15.4209C16.4439 13.9127 17.3603 11.8464 17.3603 9.56463C17.3603 4.94759 13.6175 1.20508 9.00048 1.20508C4.38344 1.20508 0.640625 4.94732 0.640625 9.56463C0.640625 11.8467 1.5574 13.9127 3.03952 15.4212L2.28325 16.1772C1.86625 16.5942 1.86625 17.2697 2.28298 17.6868C2.49121 17.8953 2.76479 17.9997 3.03777 17.9997C3.31075 17.9997 3.58409 17.8953 3.79229 17.6871L4.7348 16.7449C5.98443 17.4893 7.43998 17.9245 9.00048 17.9245C10.561 17.9245 12.0165 17.4893 13.2667 16.7446L14.2092 17.6871C14.4178 17.8953 14.6907 17.9997 14.9637 17.9997C15.2367 17.9997 15.5103 17.8953 15.7186 17.6868C16.1353 17.2698 16.1353 16.5942 15.7183 16.1772L14.9617 15.4209ZM9.00018 14.4821C8.70319 14.4821 8.46255 14.7233 8.46255 15.0203V15.7451C5.4685 15.4862 3.07856 13.0963 2.82001 10.1025H3.54475C3.84177 10.1025 4.08295 9.86133 4.08295 9.56461C4.08295 9.26761 3.84174 9.02673 3.54475 9.02673H2.82001C3.07856 6.03295 5.4685 3.64271 8.46255 3.38446V4.10947C8.46255 4.40649 8.70319 4.6471 9.00018 4.6471C9.2972 4.6471 9.53808 4.40649 9.53808 4.10947V3.38446C12.5322 3.64271 14.9218 6.03292 15.1806 9.02673H14.4556C14.1586 9.02673 13.9177 9.26761 13.9177 9.56461C13.9177 9.86133 14.1586 10.1025 14.4556 10.1025H15.1806C14.9221 13.0963 12.5324 15.4862 9.53838 15.7451V15.0206C9.53838 14.7233 9.29747 14.4821 9.00018 14.4821Z"
                                                fill="#0D6EFD"
                                            />
                                            <path d="M6.85529 0.760009C6.21038 0.28459 5.41507 0 4.55239 0C2.40394 0 0.662109 1.74186 0.662109 3.89028C0.662109 4.41838 0.768247 4.92158 0.95913 5.38052C2.1535 3.0947 4.29212 1.3847 6.85529 0.760009Z" fill="#0D6EFD" />
                                            <path d="M17.0404 5.38055C17.2312 4.92131 17.3374 4.4181 17.3374 3.89031C17.3377 1.74186 15.5959 0 13.4474 0C12.5841 0 11.7894 0.28459 11.1445 0.76061C13.7074 1.38498 15.846 3.09531 17.0404 5.38055Z" fill="#0D6EFD" />
                                        </g>
                                    </svg>
                                </div>
                                <p className="text-dark mb-0">You can cancel anytime</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
