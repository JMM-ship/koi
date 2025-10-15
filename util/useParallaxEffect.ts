"use client"

import gsap from "gsap"
import { useLayoutEffect } from "react"

export const useParallaxEffect = (): void => {
	useLayoutEffect(() => {
		if (typeof window === "undefined") return

		const items = document.querySelectorAll(".parallax-item")

		items.forEach((item) => {
			const parent = item.parentNode
			if (!parent) return

			// Wrap .parallax-item inside .parallax-item-wrap
			const wrapper = document.createElement("div")
			wrapper.classList.add("parallax-item-wrap")
			parent.replaceChild(wrapper, item)
			wrapper.appendChild(item)
		})

		const itemWraps = document.querySelectorAll<HTMLElement>(".parallax-item-wrap")

		itemWraps.forEach((itemWrap) => {
			const item = itemWrap.querySelector<HTMLElement>(".parallax-item")
			if (!item) return

			itemWrap.addEventListener("mousemove", (e: MouseEvent) => {
				const rect = itemWrap.getBoundingClientRect()
				const offsetX = rect.left + rect.width / 2
				const offsetY = rect.top + rect.height / 2
				const deltaX = e.clientX - offsetX
				const deltaY = e.clientY - offsetY
				const percentX = deltaX / (itemWrap.clientWidth / 2)
				const percentY = deltaY / (itemWrap.clientHeight / 2)

				gsap.to(item, {
					x: percentX * 20,
					y: percentY * 20,
					rotationX: percentY * 5,
					rotationY: percentX * -5,
					z: percentY * 50,
					ease: "power1.out",
					duration: 0.5,
				})
			})

			itemWrap.addEventListener("mouseleave", () => {
				gsap.to(item, {
					x: 0,
					y: 0,
					rotationX: 0,
					rotationY: 0,
					z: 0,
					ease: "power1.inOut",
					duration: 0.5,
				})
			})
		})

		return () => {
			itemWraps.forEach((itemWrap) => {
				itemWrap.removeEventListener("mousemove", () => { })
				itemWrap.removeEventListener("mouseleave", () => { })
			})
		}
	}, [])
}
