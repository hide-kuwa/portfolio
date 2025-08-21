'use client'

import { Box, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import type { CollisionEnterPayload, RapierRigidBody } from '@react-three/rapier'
import { useRef, useState } from 'react'

// --- Player コンポーネント (筆を拾う処理を追加) ---
function Player() {
  const playerRef = useRef<RapierRigidBody | null>(null)

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

  // グローバルなイベントリスナーはuseEffect内で管理するのがReactの作法
  // ただし、このチュートリアルのシンプルさのために今回はこのままにします
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      jump()
    }
  })

  return (
    // RigidBodyに名前をつけて、衝突判定で識別できるようにします
    <RigidBody ref={playerRef} position={[0, 5, 0]} colliders="cuboid" name="player">
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="black" />
      </Box>
    </RigidBody>
  )
}

// --- Floor コンポーネント (変更なし) ---
function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box args={[30, 1, 30]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#f0f0f0" />
      </Box>
    </RigidBody>
  )
}

// --- Wall コンポーネント (変更なし) ---
function Wall({ position, args = [1, 10, 30] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <Box args={args}>
        <meshStandardMaterial color="#f0f0f0" />
      </Box>
    </RigidBody>
  )
}

// --- NEW! Brush コンポーネント ---
function Brush({ onPickup }: { onPickup?: (payload: CollisionEnterPayload) => void }) {
  const brushRef = useRef<RapierRigidBody | null>(null)

  // 筆をフワフワと回転させる
  useFrame((state) => {
    if (brushRef.current) {
      const t = state.clock.getElapsedTime()
      brushRef.current.setTranslation({ x: 0, y: Math.sin(t) + 3, z: 0 }, true)
      brushRef.current.setRotation({ x: t, y: t, z: t }, true)
    }
  })

  return (
    // sensorプロパティで、物理的な衝突なしに接触だけを検知する
    <RigidBody ref={brushRef} type="fixed" colliders="cuboid" sensor onCollisionEnter={onPickup} name="brush">
      <Box args={[0.5, 2, 0.5]}>
        <meshStandardMaterial color="coral" />
      </Box>
    </RigidBody>
  )
}


// --- Main コンポーネント (ゲームの状態管理ロジックを追加) ---
export default function Home() {
  // 「筆を持っているか」を記憶する状態
  const [hasBrush, setHasBrush] = useState(false)

  // オブジェクト同士が衝突した時に呼ばれる関数
  const handleCollision = (payload: CollisionEnterPayload) => {
    // プレイヤーが筆に触れたかどうかを判定
    if (
      (payload.collider.rigidBodyObject.name === "player" && payload.other.rigidBodyObject.name === "brush") ||
      (payload.collider.rigidBodyObject.name === "brush" && payload.other.rigidBodyObject.name === "player")
    ) {
      if (!hasBrush) { // まだ筆を持っていない場合のみ
        setHasBrush(true)
      }
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 20], fov: 60 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <OrbitControls />

        {/* Physicsコンポーネントに衝突イベントの処理を任せる */}
        <Physics onCollisionEnter={handleCollision}>
          <Player />
          <Floor />
          <Wall position={[-15, 5, 0]} />
          <Wall position={[15, 5, 0]} />
          <Wall position={[0, 5, -15]} args={[30, 10, 1]}/>
          <Wall position={[0, 5, 15]} args={[30, 10, 1]}/>

          {/* まだ筆を拾っていない場合のみ、筆を表示する */}
          {!hasBrush && <Brush />}

        </Physics>
      </Canvas>
    </div>
  )
}

