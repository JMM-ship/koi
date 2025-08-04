"use client"
import { useEffect } from "react"

export const useOffcanvasMenu = (): void => {
	useEffect(() => {
		if (typeof document === "undefined") return

		const menuTrigger = document.querySelector(".menu-tigger") as HTMLElement | null
		const menuClose = document.querySelector(".menu-close") as HTMLElement | null
		const overlay = document.querySelector(".offCanvas__overly") as HTMLElement | null
		const menu = document.querySelector(".offCanvas__info") as HTMLElement | null

		const openMenu = (e: Event) => {
			e.preventDefault()
			menu?.classList.add("active")
			overlay?.classList.add("active")
		}

		const closeMenu = () => {
			menu?.classList.remove("active")
			overlay?.classList.remove("active")
		}

		// Add event listeners
		menuTrigger?.addEventListener("click", openMenu)
		menuClose?.addEventListener("click", closeMenu)
		overlay?.addEventListener("click", closeMenu)

		// Cleanup event listeners on unmount
		return () => {
			menuTrigger?.removeEventListener("click", openMenu)
			menuClose?.removeEventListener("click", closeMenu)
			overlay?.removeEventListener("click", closeMenu)
		}
	}, [])
}
