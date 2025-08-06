# CLAUDE.md

总是用中文回答我
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AstraX AI Solutions is a commercial Next.js template designed for AI/technology companies. It's a ThemeForest template with heavy emphasis on animations, responsive design, and modern UI components.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Production server
npm run start

# Linting
npm run lint
```

## Architecture

### Tech Stack
- **Next.js 14.2.1** with App Router
- **TypeScript** with strict mode
- **Bootstrap 5.3.3** for UI components
- **React 18** with functional components

### Key Animation Libraries
- **GSAP 3.12.7** - Complex animations (used in custom hooks)
- **AOS 2.3.4** - Scroll animations
- **Swiper 11.2.5** - Sliders/carousels
- **Isotope Layout 3.0.6** - Grid layouts with filtering

### Project Structure

**App Router Pages** (`/app`):
- File-based routing with `page.tsx` files
- Layout component at `/app/layout.tsx` configures fonts and global styles
- All pages use client-side rendering (`'use client'`)

**Component Organization** (`/components`):
- `elements/` - Reusable UI components (BackToTop, Breadcrumb, etc.)
- `layout/` - Header, Footer, Navigation components
- `sections/` - Page-specific sections organized by route (home/, about/, blog/, etc.)

**Custom Hooks** (`/util`):
- Animation hooks: `useTextAnimation2/3`, `useParallaxEffect`
- UI interactions: `useAccordion`, `useOdometerCounter`, `useCircleText`
- Bootstrap initialization: `useBootstrap`

### Important Patterns

1. **Bootstrap Integration**: The template uses Bootstrap CSS with custom utility hooks. Bootstrap JavaScript is dynamically imported in `useBootstrap.ts`.

2. **Client-Side Focus**: Most components use `'use client'` directive. Server-side features are minimal.

3. **Section-Based Pages**: Pages are composed by importing multiple section components:
   ```tsx
   // Example: app/page.tsx imports sections like:
   import Hero1 from "@/components/sections/home-1/Hero1"
   import Service1 from "@/components/sections/home-1/Service1"
   ```

4. **Asset Organization**: Images and assets in `/public/assets` are organized by page/feature.

5. **Font Loading**: Uses Next.js font optimization with Libre Franklin and Rubik fonts defined in `layout.tsx`.

## Common Tasks

### Adding a New Page
1. Create a new directory in `/app` with a `page.tsx` file
2. Import and compose section components from `/components/sections`
3. Use the Layout component wrapper if needed

### Creating New Sections
1. Add section component in `/components/sections/[page-name]/`
2. Use existing animation hooks from `/util` for consistency
3. Follow the pattern of existing sections for structure

### Modifying Styles
- Global styles: `/public/assets/css/style.css`
- Bootstrap customization: Modify Bootstrap variables or override in custom CSS
- Component-specific styles: Use CSS modules or inline styles with existing patterns

## Notes
- No testing framework is configured
- This is a template project - avoid modifying core structure unless necessary
- Heavy reliance on client-side JavaScript for animations and interactions
- Bootstrap and jQuery are loaded dynamically for compatibility