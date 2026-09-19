'use client'

/**
 * LiveMap — Leaflet + OpenStreetMap. No API key required.
 * Spec: §2.4, §7.1
 *
 * This component MUST be dynamically imported with { ssr: false }:
 *   const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false })
 *
 * Props:
 *   lat, lng         — agent's current position (required)
 *   accuracy         — GPS accuracy radius in metres
 *   address          — reverse-geocoded readable address
 *   targetLat/Lng    — property coords (optional); if set, draws red marker and fits bounds
 *   className        — container class override
 */

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Icon setup: use CDN URLs to avoid webpack's broken asset resolution ────────
const BLUE_ICON = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const RED_ICON = L.icon({
  // Same base image, styled red via CSS class on the element
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'leaflet-marker-red',   // defined in globals.css: filter: hue-rotate(140deg)
})

interface LiveMapProps {
  lat: number
  lng: number
  accuracy?: number
  address?: string
  targetLat?: number | null
  targetLng?: number | null
  className?: string
  zoom?: number
}

export default function LiveMap({
  lat, lng, accuracy = 0, address, targetLat, targetLng, className = '', zoom = 15,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const agentMarkerRef = useRef<L.Marker | null>(null)
  const targetMarkerRef = useRef<L.Marker | null>(null)
  const accuracyCircleRef = useRef<L.Circle | null>(null)

  // ── Initialize map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Agent marker (blue)
    const agentMarker = L.marker([lat, lng], { icon: BLUE_ICON })
      .addTo(map)
      .bindPopup(address ? `<b>Your location</b><br/>${address}` : '<b>Your location</b>')
    agentMarkerRef.current = agentMarker

    // Accuracy circle (translucent blue, spec §7.1)
    if (accuracy > 0) {
      const circle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map)
      accuracyCircleRef.current = circle
    }

    // Property target marker (red) — only if coords provided
    if (targetLat != null && targetLng != null) {
      const targetMarker = L.marker([targetLat, targetLng], { icon: RED_ICON })
        .addTo(map)
        .bindPopup('<b>Property location</b>')
      targetMarkerRef.current = targetMarker
      map.fitBounds([[lat, lng], [targetLat, targetLng]], { padding: [50, 50] })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      agentMarkerRef.current = null
      targetMarkerRef.current = null
      accuracyCircleRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally only on mount

  // ── Smooth update: panTo on position change (no re-mount) ────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.panTo([lat, lng])

    if (agentMarkerRef.current) {
      agentMarkerRef.current.setLatLng([lat, lng])
      if (address) {
        agentMarkerRef.current.setPopupContent(`<b>Your location</b><br/>${address}`)
      }
    }

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([lat, lng])
      if (accuracy > 0) accuracyCircleRef.current.setRadius(accuracy)
    }
  }, [lat, lng, accuracy, address])

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-xl overflow-hidden border border-slate-200 ${className}`}
      style={{ minHeight: 320 }}
    />
  )
}
