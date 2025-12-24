import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types';
import { generateTreePositions, generateExplosionPositions } from '../utils/geometry';

interface ParticleSystemProps {
  count: number;
  type: 'leaf' | 'ribbon' | 'decor';
  appState: AppState;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  rotationOffset?: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  count, 
  type, 
  appState, 
  geometry, 
  material,
  rotationOffset = 0
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions for both states
  const { treeData, explodePositions } = useMemo(() => {
    const tree = generateTreePositions(count, type);
    const explode = generateExplosionPositions(count);
    return { treeData: tree, explodePositions: explode };
  }, [count, type]);

  // Current positions array (mutable state for animation)
  const currentPositions = useMemo(() => {
    return treeData.map(d => d.position.clone());
  }, [treeData]);

  useLayoutEffect(() => {
    // Initial placement
    if (meshRef.current) {
      treeData.forEach((data, i) => {
        dummy.position.copy(data.position);
        dummy.scale.setScalar(data.scale);
        dummy.rotation.setFromVector3(data.rotation);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy, treeData]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Determine speed of transition
    const lerpFactor = THREE.MathUtils.clamp(delta * 2.5, 0, 1);
    const isTree = appState === AppState.TREE;

    // Optional: Rotate the whole group for "Tree" feel
    // meshRef.current.rotation.y += delta * 0.1;

    for (let i = 0; i < count; i++) {
      const target = isTree ? treeData[i].position : explodePositions[i];
      
      // Interpolate current position towards target
      currentPositions[i].lerp(target, lerpFactor);

      // Add some noise/hover effect
      const time = state.clock.elapsedTime;
      const noise = Math.sin(time + i * 0.1) * (isTree ? 0.05 : 0.2);
      
      dummy.position.copy(currentPositions[i]);
      if(isTree && type === 'leaf') dummy.position.y += noise;

      // Rotate particles individually
      dummy.rotation.set(
        treeData[i].rotation.x + time * 0.2,
        treeData[i].rotation.y + time * 0.3,
        treeData[i].rotation.z
      );

      dummy.scale.setScalar(treeData[i].scale * (isTree ? 1 : 0.5)); // Shrink slightly when exploding
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
    />
  );
};

export default ParticleSystem;