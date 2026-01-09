import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, GradientTexture, Sphere } from "@react-three/drei";
import * as THREE from "three";

function AmbientShape() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.2;
        meshRef.current.rotation.y = Math.cos(time * 0.3) * 0.2;
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Sphere ref={meshRef} args={[1, 100, 100]} scale={2}>
                <MeshDistortMaterial
                    distort={0.4}
                    speed={4}
                    roughness={0}
                    metalness={1}
                >
                    <GradientTexture
                        stops={[0, 1]}
                        colors={['#00D9FF', '#000000']}
                    />
                </MeshDistortMaterial>
            </Sphere>
        </Float>
    );
}

export function HeroScene() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00D9FF" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
                <AmbientShape />
            </Canvas>
        </div>
    );
}
