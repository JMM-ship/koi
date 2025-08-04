
'use client'
import { DataBg } from '@/util/data-bg'
import { useOffcanvasMenu } from '@/util/offcanvasMenu'
import { useAccordion } from '@/util/useAccordion'
import { useCircleText } from '@/util/useCircleText'
import { useOdometerCounter } from '@/util/useOdometerCounter'
import { useParallaxEffect } from '@/util/useParallaxEffect'
import useTextAnimation2 from '@/util/useTextAnimation2'
import useTextAnimation3 from '@/util/useTextAnimation3'
import AOS from 'aos'
import 'aos/dist/aos.css'
import dynamic from 'next/dynamic'
import type { FC } from 'react'
import { useEffect, useState } from "react"
import BackToTop from '../elements/BackToTop'
import Breadcrumb from './Breadcrumb'
import Footer from './footer/Footer'
import Header from "./header/Header"

// Define the props interface (same as above)
interface BootstrapComponentsProps { }

// Type the dynamic import
const BootstrapComponents = dynamic<BootstrapComponentsProps>(
	() => import('@/util/useBootstrap'),
	{ ssr: false } // Disable SSR since this is client-side only
) as FC<BootstrapComponentsProps>

interface LayoutProps {
	headerStyle?: Number
	footerStyle?: Number
	children?: React.ReactNode
	breadcrumbTitle?: string
}


export default function Layout({ headerStyle, footerStyle, breadcrumbTitle, children }: LayoutProps) {
	const [scroll, setScroll] = useState<boolean>(false)
	// Mobile Menu
	const [isMobileMenu, setMobileMenu] = useState<boolean>(false)
	const handleMobileMenu = (): void => {
		setMobileMenu(!isMobileMenu)
		!isMobileMenu ? document.body.classList.add("mobile-menu-active") : document.body.classList.remove("mobile-menu-active");
	}

	useEffect(() => {
		AOS.init()
		const WOW: any = require('wowjs');
		(window as any).wow = new WOW.WOW({
			live: false
		});

		// Initialize WOW.js
		(window as any).wow.init()
		const handleScroll = (): void => {
			const scrollCheck: boolean = window.scrollY > 100
			if (scrollCheck !== scroll) {
				setScroll(scrollCheck)
			}
		}

		document.addEventListener("scroll", handleScroll)

		return () => {
			document.removeEventListener("scroll", handleScroll)
		}
	}, [scroll])

	DataBg()
	useTextAnimation2()
	useTextAnimation3()
	useOffcanvasMenu()
	useAccordion()
	useCircleText()
	useOdometerCounter()
	useParallaxEffect()
	return (
		<>
			<div id="top" />
			<BootstrapComponents />
			<Header scroll={scroll} isMobileMenu={isMobileMenu} handleMobileMenu={handleMobileMenu} />

			<main>
				{breadcrumbTitle && <Breadcrumb breadcrumbTitle={breadcrumbTitle} />}
				{children}
			</main>

			< Footer />

			<BackToTop />
		</>
	)
}
