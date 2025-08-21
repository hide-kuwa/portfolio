'use client'

import { Box, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { useRef } from 'react'

// --- Player Component (No changes here) ---
function Player() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null)

  useFrame((state) => {
    if (!playerRef.current) return
    const keys = state.keyboard.pressed
    const impulse = { x: 0, y: 0, z: 0 }
    if (keys.ArrowLeft) {
      impulse.x -= 0.5
    }
    if (keys.ArrowRight) {
      impulse.x += 0.5
    }
    playerRef.current.applyImpulse(impulse)
  })

  const jump = () => {
    if (playerRef.current) {
      playerRef.current.applyImpulse({ x: 0, y: 10, z: 0 })
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      jump()
    }
  })

  return (
    <RigidBody ref={playerRef} position={[0, 5, 0]} colliders="cuboid">
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="black" />
      </Box>
    </RigidBody>
  )
}

// --- Floor Component (No changes here) ---
function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box args={[30, 1, 30]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#f0f0f0" />
      </Box>
    </RigidBody>
  )
}

// --- NEW! Wall Component ---
function Wall({ position, args = [1, 10, 30] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <Box args={args}>
        <meshStandardMaterial color="#f0f0f0" />
      </Box>
    </RigidBody>
  )
}

// --- Main Component (Updated to add walls) ---
export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 20], fov: 60 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        <OrbitControls />

        <Physics>
          <Player />
          <Floor />

          {/* We're adding the walls here! */}
          <Wall position={[-15, 5, 0]} /> {/* Left Wall */}
          <Wall position={[15, 5, 0]} /> {/* Right Wall */}
          <Wall position={[0, 5, -15]} args={[30, 10, 1]} /> {/* Back Wall */}

          {/* This will be the wall we break! */}
          <Wall position={[0, 5, 15]} args={[30, 10, 1]} /> {/* Front Wall */}

        </Physics>
      </Canvas>
    </div>
  )
}
