'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			const progress = (scrollTop / scrollHeight) * 139.988; // Tính toán progress cho stroke-dashoffset
			setProgress(progress);
			setIsVisible(scrollTop > 100);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<div
			className={`btn-scroll-top ${isVisible ? 'active-progress' : ''}`}
			onClick={scrollToTop}
			style={{ display: isVisible ? 'flex' : 'none' }}
		>
			<svg className="progress-square svg-content" width="100%" height="100%" viewBox="0 0 40 40">
				<path
					d="M8 1H32C35.866 1 39 4.13401 39 8V32C39 35.866 35.866 39 32 39H8C4.13401 39 1 35.866 1 32V8C1 4.13401 4.13401 1 8 1Z"
					style={{ transition: 'stroke-dashoffset 10ms linear', strokeDasharray: '139.988px', strokeDashoffset: `${139.988 - progress}px` }}
				/>
			</svg>
		</div>
	);
}
