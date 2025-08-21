// src/app/page.tsx

"use client";

import { Box, OrbitControls, KeyboardControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { useRef, useState, useEffect } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { useControls } from 'leva';

// --- Player コンポーネント (全ての数字をLevaで調整可能に) ---
function Player() {
  const playerRef = useRef<any>(null);
  const [isGrounded, setIsGrounded] = useState(false);
  const { left, right, jump } = useKeyboardControls((state) => state);

  // --- Levaでの調整項目をここに集約！ ---
  const { moveForce, jumpForce, playerSize, sensorSize, sensorPosition } = useControls('Player Controls', {
    moveForce: { value: 0.8, min: 0.1, max: 10, step: 0.1 },
    jumpForce: { value: 10, min: 1, max: 30 },
    playerSize: { value: { x: 0.5, y: 0.5, z: 0.5 }, label: 'Player Size' },
    sensorSize: { value: { x: 0.4, y: 0.1, z: 0.4 }, label: 'Sensor Size' },
    sensorPosition: { value: { x: 0, y: -0.6, z: 0 }, label: 'Sensor Position' },
  });

  // 左右移動の処理
  useFrame(() => {
    if (!playerRef.current) return;
    playerRef.current.wakeUp();
    const impulse = { x: 0, y: 0, z: 0 };
    
    if (left) {
      impulse.x -= moveForce;
    }
    if (right) {
      impulse.x += moveForce;
    }
    playerRef.current.applyImpulse(impulse, true);
  });
  
  // ジャンプ処理
  useEffect(() => {
    if (jump && isGrounded) {
      playerRef.current?.applyImpulse({ x: 0, y: jumpForce, z: 0 });
      setIsGrounded(false);
    }
  }, [jump, isGrounded, jumpForce]);

  return (
    <RigidBody
      ref={playerRef}
      position={[0, 5, 0]}
      colliders={false}
      name="player"
    >
      {/* キャラクター本体の当たり判定 (Levaでサイズ調整) */}
      <CuboidCollider args={[playerSize.x, playerSize.y, playerSize.z]} />

      {/* 足元の接地判定センサー (Levaでサイズと位置を調整) */}
      <CuboidCollider
        args={[sensorSize.x, sensorSize.y, sensorSize.z]}
        position={[sensorPosition.x, sensorPosition.y, sensorPosition.z]}
        sensor
        onIntersectionEnter={() => setIsGrounded(true)}
        onIntersectionExit={() => setIsGrounded(false)}
      />

      {/* キャラクターの見た目のサイズもLevaと連動 */}
      <Box args={[playerSize.x * 2, playerSize.y * 2, playerSize.z * 2]}>
        <meshStandardMaterial color="black" />
      </Box>
    </RigidBody>
  );
}

// --- Floor コンポーネント ---
function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid" name="floor">
      <Box args={[30, 1, 30]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#f0f0f0" />
      </Box>
    </RigidBody>
  );
}

// --- Wall コンポーネント ---
function Wall({ position, args = [1, 10, 30] }) {
    return (
      <RigidBody type="fixed" colliders="cuboid" position={position}>
        <Box args={args}>
          <meshStandardMaterial color="#f0f0f0" />
        </Box>
      </RigidBody>
    );
  }

// --- Brush コンポーネント ---
function Brush() {
    const brushRef = useRef<any>(null);
  
    useFrame((state) => {
      if (brushRef.current) {
        const t = state.clock.getElapsedTime();
        brushRef.current.setTranslation({ x: 0, y: Math.sin(t) + 3, z: 0 }, true);
        brushRef.current.setRotation({ x: t, y: t, z: t }, true);
      }
    });
  
    return (
      <RigidBody ref={brushRef} type="fixed" colliders="cuboid" sensor name="brush">
        <Box args={[0.5, 2, 0.5]}>
          <meshStandardMaterial color="coral" />
        </Box>
      </RigidBody>
    );
  }

// --- Main コンポーネント ---
export default function Home() {
  const [hasBrush, setHasBrush] = useState(false);

  const handleCollision = (payload) => {
    if (
      (payload.collider.rigidBodyObject?.name === "player" && payload.other.rigidBodyObject?.name === "brush") ||
      (payload.collider.rigidBodyObject?.name === "brush" && payload.other.rigidBodyObject?.name === "player")
    ) {
      if (!hasBrush) {
        setHasBrush(true);
      }
    }
  };

  const keyboardMap = [
    { name: "left", keys: ["ArrowLeft", "a", "A"] },
    { name: "right", keys: ["ArrowRight", "d", "D"] },
    { name: "jump", keys: ["Space","ArrowUp"] },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      
      <KeyboardControls map={keyboardMap}>
        <Canvas camera={{ position: [0, 5, 20], fov: 60 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <OrbitControls />

          <Physics debug onCollisionEnter={handleCollision}>
            <Player />
            <Floor />
            <Wall position={[-15, 5, 0]} />
            <Wall position={[15, 5, 0]} />
            <Wall position={[0, 5, -15]} args={[30, 10, 1]}/>
            <Wall position={[0, 5, 15]} args={[30, 10, 1]}/>

            {!hasBrush && <Brush />}
          </Physics>
        </Canvas>
      </KeyboardControls>
    </div>
  );
}