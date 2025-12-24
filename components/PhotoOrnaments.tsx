import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types';

interface PolaroidProps {
  url: string;
  appState: AppState;
  index: number;
}

const Polaroid: React.FC<PolaroidProps> = ({ url, appState, index }) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => new THREE.TextureLoader().load(url), [url]);
  
  // Fix texture encoding for correct color
  texture.colorSpace = THREE.SRGBColorSpace;

  // Calculate positions once
  const { treePos, explodePos, rotation } = useMemo(() => {
    // 1. Tree Position: Randomly placed within the tree volume, but avoiding the very center
    const h = 18; // Tree height matches geometry.ts
    const rBase = 6; // Slightly inside the outer leaves
    
    // Random height
    const y = (Math.random() * h) - (h / 2);
    // Radius shrinks as y goes up (cone shape)
    const normalizedY = (y + h / 2) / h;
    const rAtY = rBase * (1 - normalizedY);
    
    // Random angle
    const theta = Math.random() * Math.PI * 2;
    // Position
    const tx = rAtY * 0.8 * Math.cos(theta); // 0.8 to tuck it inside foliage slightly
    const tz = rAtY * 0.8 * Math.sin(theta);
    
    const tPos = new THREE.Vector3(tx, y, tz);

    // Look away from center (initial rotation)
    const lookTarget = new THREE.Vector3(0, y, 0);
    const m = new THREE.Matrix4();
    m.lookAt(tPos, lookTarget, new THREE.Vector3(0, 1, 0));
    const rot = new THREE.Euler().setFromRotationMatrix(m);

    // 2. Explode Position: Far out randomly
    const exDir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const exPos = exDir.multiplyScalar(20 + Math.random() * 15);

    return { treePos: tPos, explodePos: exPos, rotation: rot };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetPos = appState === AppState.TREE ? treePos : explodePos;
    
    // Smooth movement
    groupRef.current.position.lerp(targetPos, delta * 2);
    
    // Rotation logic
    if (appState === AppState.TREE) {
      // In tree mode, gently sway
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotation.x, delta * 2);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation.y, delta * 2);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rotation.z + Math.sin(state.clock.elapsedTime + index) * 0.1, delta * 2);
    } else {
      // In explode mode, tumble slowly
      groupRef.current.rotation.x += delta * 0.5;
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={explodePos}>
      {/* Polaroid Frame (White Paper) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      
      {/* Photo Image */}
      <mesh position={[0, 0.15, 0.03]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

interface PhotoOrnamentsProps {
  photos: string[];
  appState: AppState;
}

const PhotoOrnaments: React.FC<PhotoOrnamentsProps> = ({ photos, appState }) => {
  return (
    <group>
      {photos.map((url, i) => (
        <Polaroid key={url} url={url} appState={appState} index={i} />
      ))}
    </group>
  );
};

export default PhotoOrnaments;