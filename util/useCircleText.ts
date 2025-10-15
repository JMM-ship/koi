"use client"
import { useEffect } from "react"

export const useCircleText = (): void => {
	useEffect(() => {
		if (typeof document === "undefined") return

		const texts = document.querySelectorAll(".circle-text")

		texts.forEach(text => {
			if (!text.textContent) return

			// Wrap each character in a <span>
			text.innerHTML = text.textContent.replace(/\S/g, "<span>$&</span>")

			// Apply rotation to each span
			const elements = text.querySelectorAll("span")
			elements.forEach((element, i) => {
				(element as HTMLElement).style.transform = `rotate(${i * 11}deg)`
			})
		})
	}, [])
}
