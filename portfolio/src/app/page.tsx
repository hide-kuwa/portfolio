'use client'

import { Box, OrbitControls, useKeyboardControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import type { CollisionEnterPayload, RapierRigidBody } from '@react-three/rapier'
import { useEffect, useRef, useState } from 'react'
import { useControls } from 'leva'

// --- Player コンポーネント (コヨーテタイムを実装) ---
type Vec3 = { x: number; y: number; z: number }

interface PlayerProps {
  moveForce: number
  jumpForce: number
  playerSize: Vec3
  sensorSize: Vec3
  sensorPosition: Vec3
  coyoteTimeDuration: number
}

function Player({
  moveForce,
  jumpForce,
  playerSize,
  sensorSize,
  sensorPosition,
  coyoteTimeDuration,
}: PlayerProps) {
  const playerRef = useRef<RapierRigidBody | null>(null)
  const { left, right, jump } = useKeyboardControls((state) => state)
  const coyoteTimeRef = useRef(0)

  useFrame((state) => {
    if (!playerRef.current) return

    if (coyoteTimeRef.current > 0) {
      coyoteTimeRef.current -= state.clock.getDelta()
    }

    const impulse = { x: 0, y: 0, z: 0 }
    if (left) {
      impulse.x -= moveForce
    }
    if (right) {
      impulse.x += moveForce
    }
    playerRef.current.applyImpulse(impulse)
  })

  useEffect(() => {
    if (!playerRef.current) return
    if (jump && coyoteTimeRef.current > 0) {
      playerRef.current.applyImpulse({ x: 0, y: jumpForce, z: 0 })
      coyoteTimeRef.current = 0
    }
  }, [jump, jumpForce])

  return (
    <RigidBody ref={playerRef} position={[0, 5, 0]} colliders={false} name="player">
      <CuboidCollider args={[playerSize.x, playerSize.y, playerSize.z]} />
      <CuboidCollider
        args={[sensorSize.x, sensorSize.y, sensorSize.z]}
        position={[sensorPosition.x, sensorPosition.y, sensorPosition.z]}
        sensor
        onIntersectionEnter={() => {
          coyoteTimeRef.current = coyoteTimeDuration
        }}
      />
      <Box args={[playerSize.x * 2, playerSize.y * 2, playerSize.z * 2]}>
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

  const playerControls = useControls('Player Controls', {
    moveForce: { value: 0.8, min: 0.1, max: 10, step: 0.1 },
    jumpForce: { value: 10, min: 1, max: 30 },
    playerSize: { value: { x: 0.5, y: 0.5, z: 0.5 }, label: 'Player Size' },
    sensorSize: { value: { x: 0.4, y: 0.1, z: 0.4 }, label: 'Sensor Size' },
    sensorPosition: { value: { x: 0, y: -0.6, z: 0 }, label: 'Sensor Position' },
    coyoteTimeDuration: { value: 0.1, min: 0, max: 0.5, step: 0.01, label: 'Coyote Time' },
  })

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
          <Player {...playerControls} />
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

