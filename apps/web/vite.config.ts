import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this project under /DCS_flight_planner/, not at the
  // domain root, so asset URLs need this prefix in production builds.
  base: process.env.GITHUB_PAGES ? "/DCS_flight_planner/" : "/",
  plugins: [react()],
})
