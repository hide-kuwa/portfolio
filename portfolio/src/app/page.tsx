'use client' // ← これが重要！ブラウザで動くコンポーネントですよ、という合図

import { Box, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { useRef } from 'react'

// --- 主人公（プレイヤー）を定義するコンポーネント ---
function Player() {
  const playerRef = useRef<RapierRigidBody | null>(null) // 主人公を後から操作するための「参照」

  // useFrameは毎フレーム実行される命令。これがゲームの心臓部！
  useFrame((state) => {
    if (!playerRef.current) return

    // キーボードの状態を取得
    const keys = state.keyboard.pressed

    const impulse = { x: 0, y: 0, z: 0 }
    if (keys.ArrowLeft) {
      impulse.x -= 0.5
    }
    if (keys.ArrowRight) {
      impulse.x += 0.5
    }
    
    // 力を加えてキャラクターを動かす
    playerRef.current.applyImpulse(impulse)
  })

  // ジャンプ機能
  const jump = () => {
    if (playerRef.current) {
      playerRef.current.applyImpulse({ x: 0, y: 10, z: 0 })
    }
  }

  // スペースキーが押されたらジャンプ
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


// --- 地面を定義するコンポーネント ---
function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <Box args={[30, 1, 30]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="grey" />
      </Box>
    </RigidBody>
  )
}


// --- ゲーム全体を統括するメインのコンポーネント ---
export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
        {/* 世界を照らすライト */}
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={3} />

        {/* マウスで視点をグリグリ動かせるようにする（開発中の便利ツール） */}
        <OrbitControls />

        {/* 物理演算の世界を開始！ */}
        <Physics debug>
          <Player />
          <Floor />
        </Physics>
      </Canvas>
    </div>
  )
}
