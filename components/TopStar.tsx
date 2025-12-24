import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { AppState } from '../types';

interface SparkleProps {
  index: number;
}

const Sparkle: React.FC<SparkleProps> = ({ index }) => {
  const ref = useRef<any>(null);
  const speed = 0.5 + Math.random();
  const offset = Math.random() * Math.PI * 2;
  
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + offset;
    const r = 2.5 + Math.sin(t * 3) * 0.5; // Slightly wider radius for star
    if (ref.current) {
      ref.current.position.set(
        Math.cos(t) * r,
        Math.sin(t * 2) * r,
        Math.sin(t) * r
      );
      ref.current.scale.setScalar(0.5 + Math.sin(t * 10) * 0.5);
    }
  });
  
  return <Instance ref={ref} />;
};

interface TopStarProps {
  appState: AppState;
}

const TopStar: React.FC<TopStarProps> = ({ appState }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const starMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFD700', // Gold
    emissive: '#FFAA00',
    emissiveIntensity: 2,
    roughness: 0.2,
    metalness: 1,
  }), []);

  // Create a custom 5-pointed star shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.5; // Classic star ratio

    // Start at top point (rotated -90deg or handled by loop)
    // We want the first point to be straight up (0, radius) ideally, 
    // but Math.cos/sin starts at right. We offset angle by PI/2.
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center(); // Center the geometry bounding box
    return geo;
  }, []);

  const sparkleGeo = useMemo(() => new THREE.OctahedronGeometry(0.1, 0), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotate the star slowly
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      
      // Bobbing motion
      groupRef.current.position.y = 9.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      
      // Scale down if exploding
      const targetScale = appState === AppState.TREE ? 1 : 0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
    }
  });

  return (
    <group ref={groupRef} position={[0, 9.5, 0]}>
      {/* Main Star Body */}
      <mesh geometry={starGeometry} material={starMaterial} castShadow />
      
      {/* Sparkles around star */}
      <Instances range={25} material={starMaterial} geometry={sparkleGeo}>
        {Array.from({ length: 25 }).map((_, i) => (
           <Sparkle key={i} index={i} />
        ))}
      </Instances>
      
      {/* Strong point light for the glow */}
      <pointLight color="#ffaa00" intensity={8} distance={20} decay={2} />
    </group>
  );
};

export default TopStar;