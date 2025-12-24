import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AppState } from '../types';
import ParticleSystem from './ParticleSystem';
import TopStar from './TopStar';
import PhotoOrnaments from './PhotoOrnaments';
import { generateStarPositions } from '../utils/geometry';

interface SceneProps {
  appState: AppState;
  rotationTarget: number; // 0-1 from hand
  photos: string[];
}

// Separate component for static background stars
const BackgroundStars = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 2000;
  
  const { positions, scales } = useMemo(() => {
    const data = generateStarPositions(count);
    return {
      positions: data.map(d => d.position),
      scales: data.map(d => d.scale)
    };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const starGeo = useMemo(() => new THREE.TetrahedronGeometry(0.05, 0), []); // Tiny sharp stars
  const starMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.6 }), []);

  useLayoutEffect(() => {
    if (meshRef.current) {
      positions.forEach((pos, i) => {
        dummy.position.copy(pos);
        dummy.scale.setScalar(scales[i]);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy, positions, scales]);

  useFrame((state) => {
    if (meshRef.current) {
      // Very slow rotation of the entire background for depth feel
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[starGeo, starMat, count]} />
  );
};

const Scene: React.FC<SceneProps> = ({ appState, rotationTarget, photos }) => {
  const treeGroupRef = useRef<THREE.Group>(null);

  // --- Materials ---
  // Updated: Leaf color set to #196840 as requested, with matching emissive
  const leafMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#196840', 
    emissive: '#196840', 
    emissiveIntensity: 0.8, // Balanced glow
    roughness: 0.3,
    transparent: true,
    opacity: 0.95,
  }), []);

  const ribbonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    emissive: '#EEEEFF',
    emissiveIntensity: 0.8,
    roughness: 0.1,
  }), []);

  // Updated: Fairy Lights (Decoration)
  const decorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    emissive: '#FFFDD0', // Creamy glow
    emissiveIntensity: 2.0, // Bright lights
    roughness: 0.1,
    toneMapped: false, 
  }), []);

  // --- Geometries ---
  // Using low poly geometries for performance with high instance count
  const leafGeo = useMemo(() => new THREE.TetrahedronGeometry(0.15), []);
  const ribbonGeo = useMemo(() => new THREE.TetrahedronGeometry(0.1), []);
  
  // Updated: Tiny spheres for lights
  const decorGeo = useMemo(() => new THREE.SphereGeometry(0.03, 6, 6), []);

  useFrame((state, delta) => {
    if (treeGroupRef.current) {
      // Auto rotation
      let rotSpeed = 0.1;
      
      // Hand control influence
      const torque = (rotationTarget - 0.5) * 2.0; // -1 to 1
      treeGroupRef.current.rotation.y += torque * delta; 
      
      // Add constant gentle rotation
      treeGroupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 25]} fov={50} />
      <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />

      <color attach="background" args={['#050103']} />
      
      {/* Lights */}
      <ambientLight intensity={0.5} color="#004400" />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={10} color="#aaffaa" castShadow />
      <pointLight position={[-10, 5, -10]} intensity={5} color="#00ff88" />
      <pointLight position={[0, -10, 0]} intensity={3} color="#ff00ff" />

      {/* Background Nebula/Stars */}
      <BackgroundStars />

      {/* The main rotating group */}
      <group ref={treeGroupRef}>
        {/* Leaves: 5000 instances */}
        <ParticleSystem 
          count={5000} 
          type="leaf" 
          appState={appState} 
          geometry={leafGeo} 
          material={leafMaterial} 
        />
        
        {/* Ribbon: 1500 instances */}
        <ParticleSystem 
          count={1500} 
          type="ribbon" 
          appState={appState} 
          geometry={ribbonGeo} 
          material={ribbonMaterial} 
        />

        {/* Decor: Increased density from 500 to 1500 */}
        <ParticleSystem 
          count={1500} 
          type="decor" 
          appState={appState} 
          geometry={decorGeo} 
          material={decorMaterial} 
        />
        
        <PhotoOrnaments photos={photos} appState={appState} />

        <TopStar appState={appState} />
      </group>

      <EffectComposer enableNormalPass={false}>
        {/* Increased bloom for dreamier look */}
        <Bloom luminanceThreshold={0.1} mipmapBlur intensity={2.0} radius={0.7} />
        <Vignette eskil={false} offset={0.1} darkness={0.4} />
      </EffectComposer>
    </>
  );
};

export default Scene;