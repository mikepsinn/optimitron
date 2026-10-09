"use client"

import { useEffect, useRef } from "react"

// Where land is: a 256 × 128 equirectangular map, white on land, from cobe (MIT License, Copyright (c) 2021 Shu Ding).
const LAND_MAP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACAAQAAAADMzoqnAAAAAXNSR0IArs4c6QAABA5JREFUeNrV179uHEUAx/Hf3JpbF+E2VASBsmVKTBcpKJs3SMEDcDwBiVJAAewYEBUivIHT0uUBIt0YCovKD0CRjUC4QfHYh8hYXu+P25vZ2Zm9c66gMd/GJ/tz82d3bk8GN4SrByYF2366FNTACIAkivVAAazQdnf3MvAlbNUQfOPAdQDvSAimMWhwy4I2g4SU+Kp04ISLpPBAKLxPyic3O/CCi+Y7rUJbiodcpDOFY7CgxCEXmdYD2EYK2s5lApOx5pEDDYCUwM1XdJUwBV11QQMg59kePSCaPAASQMEL2hwo6TJFgxpg+TgC2ymXPbuvc40awr3D1QCFfbH9kcoqAOkZozpQo0aqAGQRKCog/+tjkgbNFEtg2FffBvBGlSxHoAaAa1u6X4PBAwDiR8FFsrQgeUhfJTSALaB9jy5NCybJPn1SVFiWk7ywN+KzhH1aKAuydhGkbEF4lWohLXDXavlyFgHY7LBnLRdlAP6BS5Cc8RfVDXbkwN/oIvmY+6obbNeBP0JwTuMGu9gTzy1Q4RS/cWpfzszeYwd+CAFrtBW/Hur0gLbJGlD+/OjVwe/drfBxkbbg63dndEDfiEBlAd7ac0BPe1D6Jd8dfbLH+RI0OzseFB5s01/M+gMdAeluLOCAuaUA9Lezo/vSgXoCX9rtEiXnp7Q1W/CNyWcd8DXoS6jH/YZ5vAJEWY2dXFQe2TUgaFaNejCzJ98g6HnlVrsE58sDcYqg+9XY75fPqdoh/kRQWiXKg8MWlJQxUFMPjqnyujhFBE7UxIMjyszk0QwQlFsezImsyvUYYYVED2pk6m0Tg8T04Fwjk2kdAwSACqlM6gRRt3vQYAFGX0Ah7Ebx1H+MDRI5ui0QldH4j7FGcm90XdxD2Jg1AOEAVAKhEFXSn4cKUELurIAKwJ3MArypPscQaLhJFICJ0ohjDySAdH8AhDtCiTuMycH8CXzhH9jUACAO5uMhoAwA5i+T6WAKmmAqnLy80wxHqIPFYpqCwxGaYLt4Dyievg5kEoVEUAhs6pqKgFtDQYOuaXypaWKQfIuwwoGSZgfLsu/XAtI8cGN+h7Cc1A5oLOMhwlIPXuhu48AIvsSBkvtV9wsJRKCyYLfq5lTrQMFd1a262oqBck9K1V0YjQg0iEYYgpS1A9GlXQV5cykwm4A7BzVsxQqo7E+zCegO7Ma7yKgsuOcfKbMBwLC8wvVNYDsANYalEpOAa6zpWjTeMKGwEwC1CiQewJc5EKfgy7GmRAZA4vUVGwE2dPM/g0xuAInE/yG5aZ8ISxWGfYigUVbdyBElTHh2uCwGdfCkOLGgQVBh3Ewp+/QK4CDlR5Ws/Zf7yhCf8pH7vinWAvoVCQ6zz0NX5V/6GkAVV+2/5qsJ/gU8bsxpM8IeAQAAAABJRU5ErkJggg=="

// One marker per city where patients would report outcomes: [latitude, longitude].
const cities = {
  "New York": [40.71, -74.01],
  "Chicago": [41.88, -87.63],
  "Los Angeles": [34.05, -118.24],
  "Montreal": [45.5, -73.57],
  "Mexico City": [19.43, -99.13],
  "Bogotá": [4.71, -74.07],
  "Lima": [-12.05, -77.04],
  "São Paulo": [-23.55, -46.63],
  "Buenos Aires": [-34.6, -58.38],
  "London": [51.51, -0.13],
  "Paris": [48.86, 2.35],
  "Berlin": [52.52, 13.4],
  "Madrid": [40.42, -3.7],
  "Rome": [41.9, 12.5],
  "Stockholm": [59.33, 18.07],
  "Kyiv": [50.45, 30.52],
  "Moscow": [55.76, 37.62],
  "Istanbul": [41.01, 28.98],
  "Casablanca": [33.57, -7.59],
  "Cairo": [30.04, 31.24],
  "Lagos": [6.52, 3.38],
  "Addis Ababa": [9.03, 38.74],
  "Nairobi": [-1.29, 36.82],
  "Johannesburg": [-26.2, 28.05],
  "Riyadh": [24.71, 46.68],
  "Tehran": [35.69, 51.39],
  "Delhi": [28.61, 77.21],
  "Mumbai": [19.08, 72.88],
  "Dhaka": [23.81, 90.41],
  "Bangkok": [13.76, 100.5],
  "Singapore": [1.35, 103.82],
  "Jakarta": [-6.21, 106.85],
  "Manila": [14.6, 120.98],
  "Beijing": [39.9, 116.41],
  "Shanghai": [31.23, 121.47],
  "Seoul": [37.57, 126.98],
  "Tokyo": [35.68, 139.69],
  "Sydney": [-33.87, 151.21],
  "Auckland": [-36.85, 174.76],
} satisfies Record<string, [number, number]>

// Results traveling between cities.
const links: [keyof typeof cities, keyof typeof cities][] = [
  ["Nairobi", "Seoul"], ["London", "New York"], ["São Paulo", "Berlin"], ["Lagos", "Dhaka"], ["Delhi", "Sydney"],
  ["Chicago", "Shanghai"], ["Johannesburg", "Auckland"], ["Istanbul", "Jakarta"], ["Mexico City", "Lima"],
  ["Paris", "Addis Ababa"], ["Manila", "Mumbai"], ["Tehran", "Rome"],
]

const DOTS = 14_000 // points on a Fibonacci sphere; the ones on land are drawn
const START_LNG = 25 // Africa and Europe face the viewer first
const TILT = 0.35 // radians; the north is tipped toward the viewer
const DEGREES_PER_MS = 360 / 90_000 // one turn every 90 seconds, eastward like the Earth
const PULSE_MS = 2_400
const LINK_MS = 3_200

type Point = { lat: number; lng: number }
const radians = (degrees: number) => (degrees * Math.PI) / 180

function fibonacciSphere(count: number): Point[] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - ((i + 0.5) * 2) / count
    const lng = ((((i * golden) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI
    return { lat: Math.asin(y), lng }
  })
}

// Screen position on a unit globe centered on `centerLng`, and how far it faces the viewer (z > 0 is visible).
function project(lat: number, lng: number, centerLng: number) {
  const d = lng - centerLng
  const x = Math.cos(lat) * Math.sin(d)
  const y = Math.sin(lat)
  const z = Math.cos(lat) * Math.cos(d)
  return { x, y: y * Math.cos(TILT) - z * Math.sin(TILT), z: y * Math.sin(TILT) + z * Math.cos(TILT) }
}

// The great-circle point a fraction `t` of the way from `a` to `b`.
function between(a: Point, b: Point, t: number): Point {
  const va = [Math.cos(a.lat) * Math.cos(a.lng), Math.cos(a.lat) * Math.sin(a.lng), Math.sin(a.lat)]
  const vb = [Math.cos(b.lat) * Math.cos(b.lng), Math.cos(b.lat) * Math.sin(b.lng), Math.sin(b.lat)]
  const angle = Math.acos(Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))
  const wa = Math.sin((1 - t) * angle) / Math.sin(angle)
  const wb = Math.sin(t * angle) / Math.sin(angle)
  const v = va.map((value, k) => wa * value + wb * vb[k])
  return { lat: Math.asin(v[2]), lng: Math.atan2(v[1], v[0]) }
}

function landPoints(image: HTMLImageElement): Point[] {
  const map = document.createElement("canvas")
  map.width = image.width
  map.height = image.height
  const context = map.getContext("2d")
  if (!context) return []
  context.drawImage(image, 0, 0)
  const { data, width, height } = context.getImageData(0, 0, map.width, map.height)
  return fibonacciSphere(DOTS).filter(({ lat, lng }) => {
    const x = Math.min(width - 1, Math.floor(((lng + Math.PI) / (2 * Math.PI)) * width))
    const y = Math.min(height - 1, Math.floor(((Math.PI / 2 - lat) / Math.PI) * height))
    return data[(y * width + x) * 4] > 128
  })
}

/**
 * A turning dotted globe: amber pulses where patients report outcomes, and results traveling between cities.
 * Time comes from Date.now(), so it moves in a browser and holds still in visual captures, which freeze Date
 * (apps/optimitron/e2e/helpers/freeze-clock.mjs). It holds still for readers who ask for reduced motion, and
 * stops drawing while it is off screen. It uses a plain 2D canvas, so it draws the same with or without a GPU.
 */
export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const start = Date.now()
    const place = (name: keyof typeof cities) => ({ lat: radians(cities[name][0]), lng: radians(cities[name][1]) })
    const markers = Object.keys(cities).map(name => place(name as keyof typeof cities))
    let land: Point[] = []
    let frame = 0
    let visible = false

    const draw = () => {
      const ratio = window.devicePixelRatio || 1
      const size = canvas.offsetWidth
      if (canvas.width !== Math.round(size * ratio)) {
        canvas.width = Math.round(size * ratio)
        canvas.height = Math.round(size * ratio)
      }
      const elapsed = still ? 0 : Date.now() - start
      const centerLng = radians(START_LNG - elapsed * DEGREES_PER_MS)
      const scale = canvas.width
      const radius = scale * 0.4
      const center = scale / 2
      const toScreen = (p: { x: number; y: number }) => [center + p.x * radius, center - p.y * radius]

      context.clearRect(0, 0, scale, scale)
      const glow = context.createRadialGradient(center, center, radius * 0.9, center, center, radius * 1.25)
      glow.addColorStop(0, "rgba(124, 92, 255, 0.45)")
      glow.addColorStop(1, "rgba(124, 92, 255, 0)")
      context.fillStyle = glow
      context.fillRect(0, 0, scale, scale)
      const sphere = context.createRadialGradient(center - radius * 0.3, center - radius * 0.35, radius * 0.1, center, center, radius)
      sphere.addColorStop(0, "#151a3d")
      sphere.addColorStop(1, "#05071a")
      context.fillStyle = sphere
      context.beginPath()
      context.arc(center, center, radius, 0, 2 * Math.PI)
      context.fill()

      const dot = Math.max(1, scale / 340)
      for (const point of land) {
        const p = project(point.lat, point.lng, centerLng)
        if (p.z <= 0) continue
        const [x, y] = toScreen(p)
        context.fillStyle = `rgba(167, 155, 255, ${0.2 + 0.8 * p.z})`
        context.fillRect(x - dot / 2, y - dot / 2, dot, dot)
      }

      // Each link arcs above the surface, with a bright point traveling along it. Only the side facing the
      // viewer is drawn, so arcs do not swing out past the globe's edge.
      links.forEach(([from, to], i) => {
        const a = place(from)
        const b = place(to)
        const lift = (t: number) => 1 + 0.12 * Math.sin(Math.PI * t)
        context.lineWidth = Math.max(1, scale / 500)
        context.strokeStyle = "rgba(251, 191, 36, 0.35)"
        context.beginPath()
        let drawing = false
        for (let s = 0; s <= 32; s++) {
          const t = s / 32
          const point = between(a, b, t)
          const p = project(point.lat, point.lng, centerLng)
          if (p.z <= 0) { drawing = false; continue }
          const [x, y] = toScreen({ x: p.x * lift(t), y: p.y * lift(t) })
          if (drawing) context.lineTo(x, y)
          else context.moveTo(x, y)
          drawing = true
        }
        context.stroke()
        const t = ((elapsed / LINK_MS) + i * 0.29) % 1
        const point = between(a, b, t)
        const p = project(point.lat, point.lng, centerLng)
        if (p.z > 0) {
          const [x, y] = toScreen({ x: p.x * lift(t), y: p.y * lift(t) })
          context.fillStyle = "rgba(253, 224, 71, 0.95)"
          context.beginPath()
          context.arc(x, y, dot * 1.6, 0, 2 * Math.PI)
          context.fill()
        }
      })

      // A pulse spreads from each city as its results arrive.
      markers.forEach((marker, i) => {
        const p = project(marker.lat, marker.lng, centerLng)
        if (p.z <= 0) return
        const [x, y] = toScreen(p)
        const phase = ((elapsed / PULSE_MS) + i * 0.137) % 1
        context.strokeStyle = `rgba(251, 191, 36, ${0.7 * (1 - phase) * p.z})`
        context.lineWidth = Math.max(1, scale / 600)
        context.beginPath()
        context.arc(x, y, dot * (2 + phase * 7), 0, 2 * Math.PI)
        context.stroke()
        context.fillStyle = `rgba(251, 191, 36, ${0.4 + 0.6 * p.z})`
        context.beginPath()
        context.arc(x, y, dot * 1.8, 0, 2 * Math.PI)
        context.fill()
      })
    }

    const loop = () => {
      draw()
      frame = visible && !still ? requestAnimationFrame(loop) : 0
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !frame) loop()
    })

    const image = new Image()
    image.onload = () => {
      land = landPoints(image)
      draw()
      observer.observe(canvas)
    }
    image.src = LAND_MAP
    // Reduced motion draws once, so a resize redraws it.
    window.addEventListener("resize", draw)
    return () => {
      window.removeEventListener("resize", draw)
      observer.disconnect()
      cancelAnimationFrame(frame)
      image.onload = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="A turning globe with pulses on cities where patients report outcomes, and results traveling between them"
      className={className}
    />
  )
}
