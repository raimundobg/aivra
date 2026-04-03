import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useColorMode } from "../components/ui/color-mode";

interface OrbProps {
    color?: string;
    isProcessing?: boolean;
    scale?: number;
    distort?: number;
}

const OrbGeometry = ({ color = "#6366f1", isProcessing = false, scale = 1, distort = 0.4 }: OrbProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { colorMode } = useColorMode();

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();

        // Smooth cinematic rotation
        meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
        meshRef.current.rotation.y = Math.cos(time * 0.1) * 0.1;

        const pulseScale = isProcessing ? 0.05 : 0.02;
        const pulseSpeed = isProcessing ? 10 : 2;
        meshRef.current.scale.setScalar(scale * (1 + Math.sin(time * pulseSpeed) * pulseScale));
    });

    const materialColor = colorMode === "dark"
        ? "#1e3a8a"
        : (color === "#6366f1" ? "#06b6d4" : color);

    return (
        <Sphere ref={meshRef} args={[1, 128, 128]}>
            <MeshDistortMaterial
                color={materialColor}
                speed={isProcessing ? 5 : 1.5}
                distort={distort}
                radius={1}
                metalness={0.4}
                roughness={0.2}
                emissive={materialColor}
                emissiveIntensity={colorMode === "dark" ? 0.3 : 0.1}
            />
        </Sphere>
    );
};

export const LivingOrb = ({ color, isProcessing, scale = 1, distort }: OrbProps) => {
    const { colorMode } = useColorMode();

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true }}>
                <ambientLight intensity={colorMode === "dark" ? 0.4 : 1} />
                <pointLight position={[10, 10, 10]} intensity={colorMode === "dark" ? 1 : 1.5} />

                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
                    <OrbGeometry color={color} isProcessing={isProcessing} scale={scale} distort={distort} />
                </Float>

                <Environment preset={colorMode === "dark" ? "night" : "city"} />
            </Canvas>
        </div>
    );
};
