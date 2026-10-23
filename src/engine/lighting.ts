/**
 * engine/lighting.ts — Pencahayaan studio premium untuk jersey 3D
 * Setup tiga titik (3-point lighting) + rim light + ambient lembut.
 * Menghasilkan tampilan showroom berkualitas tinggi cocok untuk shirt_baked.glb.
 */

import * as THREE from 'three'

export function initLighting(scene: THREE.Scene): void {
  // ── Ambient / Hemisphere ──
  // Sky tone kebiruan ringan, ground gelap → kontras natural seperti studio
  const hemi = new THREE.HemisphereLight(0xd0dff5, 0x1a1f2e, 0.6)
  scene.add(hemi)

  // ── Key Light: dari kiri-atas-depan (sumber utama) ──
  const keyLight = new THREE.DirectionalLight(0xfff5e8, 1.8) // warm white
  keyLight.position.set(-2.0, 3.5, 3.0)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.width = 2048
  keyLight.shadow.mapSize.height = 2048
  keyLight.shadow.camera.near = 0.1
  keyLight.shadow.camera.far = 15
  keyLight.shadow.camera.left = -2.0
  keyLight.shadow.camera.right = 2.0
  keyLight.shadow.camera.top = 3.0
  keyLight.shadow.camera.bottom = -2.0
  keyLight.shadow.bias = -0.0005
  keyLight.shadow.radius = 4
  scene.add(keyLight)

  // ── Fill Light: dari kanan-depan, lebih redup (mengisi shadow) ──
  const fillLight = new THREE.DirectionalLight(0xe0eaff, 0.65) // cool blue fill
  fillLight.position.set(3.0, 1.0, 2.0)
  scene.add(fillLight)

  // ── Rim / Back Light: dari belakang-kanan-atas (separasi dari bg) ──
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.8)
  rimLight.position.set(1.2, 2.5, -3.5)
  scene.add(rimLight)

  // ── Top Light: lembut dari atas untuk menciptakan highlight bahu ──
  const topLight = new THREE.DirectionalLight(0xf0f5ff, 0.5)
  topLight.position.set(0, 4.0, 0.5)
  scene.add(topLight)

  // ── Front Accent: point light tepat di depan untuk highlight tekstur kain ──
  const frontAccent = new THREE.PointLight(0xffffff, 0.35, 4, 2)
  frontAccent.position.set(0, 0.05, 1.8)
  scene.add(frontAccent)

  // ── Lantai: bidang penerima bayangan halus ──
  // Sesuai dengan posisi bottom shirt_baked.glb (y ≈ -0.352)
  const floorGeo = new THREE.PlaneGeometry(6, 6)
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.25 })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.38  // sedikit di bawah hem baju GLB
  floor.receiveShadow = true
  scene.add(floor)
}
