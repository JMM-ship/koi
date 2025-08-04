"use client"
import { useEffect } from "react"

export const useAccordion = (): void => {
	useEffect(() => {
		if (typeof document === "undefined") return

		// Delay setting opacity to 1
		setTimeout(() => {
			const accordion = document.querySelector(".accordion") as HTMLElement | null
			if (accordion) accordion.style.opacity = "1"
		}, 2000)

		// Get all accordion items
		const items = document.querySelectorAll(".accordion-item")

		// Add default class
		items.forEach(item => item.classList.add("default"))

		// Click event listener
		const handleClick = (event: Event) => {
			const clickedItem = event.currentTarget as HTMLElement
			const allItems = document.querySelectorAll(".accordion > .accordion-item")

			if (clickedItem.classList.contains("expand")) {
				clickedItem.classList.remove("expand")
			} else {
				allItems.forEach(item => item.classList.remove("expand"))
				clickedItem.classList.add("expand")
			}
		}

		// Add event listeners
		items.forEach(item => item.addEventListener("click", handleClick))

		// Cleanup event listeners on unmount
		return () => {
			items.forEach(item => item.removeEventListener("click", handleClick))
		}
	}, [])
}
