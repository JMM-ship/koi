
export default function Loading() {
	return (
		<>
			<div id="preloader">
				<div id="loader" className="loader">
					<div className="loader-container">
						<div className="loader-icon">
							<svg
								className="rotateme"
								xmlns="http://www.w3.org/2000/svg"
								width={40}
								height={40}
								viewBox="0 0 40 40"
								fill="none"
							>
								<circle
									cx="20"
									cy="20"
									r="18"
									stroke="currentColor"
									strokeWidth="4"
									strokeDasharray="90"
									strokeDashoffset="60"
									strokeLinecap="round"
								/>
							</svg>
						</div>
					</div>
				</div>
			</div>

		</>
	)
}
