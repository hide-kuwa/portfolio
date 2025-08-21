'use client'

import { Box, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useRef } from 'react'

// --- プレイヤー（主人公） ---
function Player() {
  const playerRef = useRef<RapierRigidBody | null>(null)

  useFrame((state) => {
    if (!playerRef.current) return
    const keys = state.keyboard.pressed
    const impulse = { x: 0, y: 0, z: 0 }

    if (keys.ArrowLeft) impulse.x -= 0.5
    if (keys.ArrowRight) impulse.x += 0.5

    playerRef.current.applyImpulse(impulse)
  })

  const jump = () => {
    if (playerRef.current) {
      playerRef.current.applyImpulse({ x: 0, y: 10, z: 0 })
    }
  }

  // スペースキーでジャンプ
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      jump()
    }
  })

  return (
    <RigidBody ref={playerRef} position={[0, 5, 0]} colliders="cuboid">
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="white" />
      </Box>
    </RigidBody>
  )
}

// --- 地面 ---
function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box args={[30, 1, 30]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="grey" />
      </Box>
    </RigidBody>
  )
}

// --- 壁 ---
function Wall({ position, args = [1, 10, 30] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <Box args={args}>
        <meshStandardMaterial color="#f0f0f0" />
      </Box>
    </RigidBody>
  )
}

// --- メインコンポーネント ---
export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 20], fov: 60 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <OrbitControls />

        <Physics debug>
          <Player />
          <Floor />

          {/* 壁を追加 */}
          <Wall position={[-15, 5, 0]} /> {/* 左 */}
          <Wall position={[15, 5, 0]} /> {/* 右 */}
          <Wall position={[0, 5, -15]} args={[30, 10, 1]} /> {/* 奥 */}
          <Wall position={[0, 5, 15]} args={[30, 10, 1]} /> {/* 手前 */}
        </Physics>
      </Canvas>
    </div>
  )
}
