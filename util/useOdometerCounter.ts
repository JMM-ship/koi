"use client"
import { useEffect } from "react"

export const useOdometerCounter = (): void => {
	useEffect(() => {
		if (typeof document === "undefined") return

		const odometerElements = document.querySelectorAll(".odometer")

		const handleOdometer = (entries: IntersectionObserverEntry[]) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const element = entry.target as HTMLElement
					const countNumber = element.getAttribute("data-count")

					if (countNumber && !element.classList.contains("counted")) {
						// Add a class to prevent multiple triggers
						element.classList.add("counted")

						// Animate the number (using a simple animation logic)
						let startValue = 0
						const endValue = parseInt(countNumber, 10)
						const duration = 2000 // 2 seconds animation duration
						const stepTime = 50
						const steps = Math.ceil(duration / stepTime)

						const increment = Math.ceil(endValue / steps)

						const interval = setInterval(() => {
							startValue += increment
							if (startValue >= endValue) {
								clearInterval(interval)
								element.innerHTML = endValue.toString()
							} else {
								element.innerHTML = startValue.toString()
							}
						}, stepTime)
					}
				}
			})
		}

		const observer = new IntersectionObserver(handleOdometer, { threshold: 0.5 })

		odometerElements.forEach(element => observer.observe(element))

		// Cleanup observer on unmount
		return () => observer.disconnect()
	}, [])
}
