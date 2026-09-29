// Modo Avanzado (Aislado y montado bajo demanda con Pixi.js / GSAP)

export function createAdvancedViewer(containerElement) {
  let isMounted = false
  let canvasElement = null
  let animId = null
  let particles = []

  function mount() {
    if (isMounted || !containerElement) return
    isMounted = true

    canvasElement = document.createElement('canvas')
    canvasElement.className = 'advanced-stage-canvas'
    containerElement.appendChild(canvasElement)

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    initParticles()
    startAnimation()
  }

  function resizeCanvas() {
    if (!canvasElement || !containerElement) return
    canvasElement.width = containerElement.clientWidth || window.innerWidth
    canvasElement.height = containerElement.clientHeight || window.innerHeight
  }

  function initParticles() {
    const count = 35
    particles = []
    const width = canvasElement.width
    const height = canvasElement.height

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1.5,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        color: i % 2 === 0 ? '#38bdf8' : '#fbbf24'
      })
    }
  }

  function startAnimation() {
    if (!isMounted || !canvasElement) return
    const ctx = canvasElement.getContext('2d')

    const loop = () => {
      if (!isMounted) return
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

      // Render partículas ambientales suaves
      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY

        if (p.x < 0) p.x = canvasElement.width
        if (p.x > canvasElement.width) p.x = 0
        if (p.y < 0) p.y = canvasElement.height
        if (p.y > canvasElement.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      }

      ctx.globalAlpha = 1.0
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
  }

  function unmount() {
    isMounted = false
    if (animId) {
      cancelAnimationFrame(animId)
      animId = null
    }
    window.removeEventListener('resize', resizeCanvas)
    if (canvasElement && canvasElement.parentNode) {
      canvasElement.parentNode.removeChild(canvasElement)
      canvasElement = null
    }
  }

  return {
    mount,
    unmount,
    isMounted: () => isMounted
  }
}
