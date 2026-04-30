import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Vercel establece VERCEL='1', no 'true'. Usamos !! para verificar existencia.
  const isVercel = !!process.env.VERCEL;

  return {
    // Si es Vercel o desarrollo local, usamos '/'. 
    // Si es build para GitHub Pages, usamos el nombre del repo.
    base: isVercel || command === 'serve' ? '/' : '/Charly-webSilver/',
    plugins: [
      tailwindcss(),
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
  }
})
