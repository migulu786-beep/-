import * as THREE from 'three';
import { ParticleData } from '../types';

const TREE_HEIGHT = 18;
const TREE_RADIUS_BOTTOM = 7;

// Helper to get random float
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate target positions for the "Tree" state
export const generateTreePositions = (count: number, type: 'leaf' | 'ribbon' | 'decor'): ParticleData[] => {
  const data: ParticleData[] = [];

  for (let i = 0; i < count; i++) {
    const p = new THREE.Vector3();
    let scale = 1;
    const rotation = new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    if (type === 'leaf') {
      // Cone volume distribution
      const y = rand(-TREE_HEIGHT / 2, TREE_HEIGHT / 2);
      const normalizedY = (y + TREE_HEIGHT / 2) / TREE_HEIGHT; // 0 (bottom) to 1 (top)
      const rAtY = TREE_RADIUS_BOTTOM * (1 - normalizedY);
      
      // Random angle
      const theta = rand(0, Math.PI * 2);
      // Random radius within the shell (dense near surface, sparse inside)
      const r = Math.sqrt(rand(0.2, 1)) * rAtY; 

      p.set(r * Math.cos(theta), y, r * Math.sin(theta));
      scale = rand(0.5, 1.2);
    } 
    else if (type === 'ribbon') {
      // Spiral
      const t = i / count; // 0 to 1
      const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2);
      const revolutions = 3.5;
      const theta = t * Math.PI * 2 * revolutions;
      const normalizedY = (y + TREE_HEIGHT / 2) / TREE_HEIGHT;
      const rAtY = (TREE_RADIUS_BOTTOM * (1 - normalizedY)) + 0.5; // Slightly outside leaves

      p.set(rAtY * Math.cos(theta), y, rAtY * Math.sin(theta));
      scale = rand(0.8, 1.5);
    } 
    else if (type === 'decor') {
      // Surface ornaments - Tiny fairy lights
      // MODIFY: Bias distribution towards the top (1.0)
      // Math.random() is 0..1. Using Math.pow(r, 0.5) biases result towards 1.
      const r = Math.random();
      const biasedR = Math.pow(r, 0.4); // Push values higher (towards top)
      
      const y = (biasedR * TREE_HEIGHT) - (TREE_HEIGHT / 2);
      
      const normalizedY = (y + TREE_HEIGHT / 2) / TREE_HEIGHT;
      const rAtY = (TREE_RADIUS_BOTTOM * (1 - normalizedY)) * 0.95; // Just inside/on surface
      const theta = rand(0, Math.PI * 2);
      
      p.set(rAtY * Math.cos(theta), y, rAtY * Math.sin(theta));
      // Randomize size to simulate 2-5px range (relative to base geometry)
      scale = rand(0.5, 1.5); 
    }

    data.push({ position: p, scale, rotation });
  }
  return data;
};

// Generate target positions for the "Explode" state
export const generateExplosionPositions = (count: number): THREE.Vector3[] => {
  const positions: THREE.Vector3[] = [];
  const radius = 30; // Explosion radius

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    // Spread randomly in a sphere shell
    const r = radius * Math.cbrt(Math.random()); 
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions.push(new THREE.Vector3(x, y, z));
  }
  return positions;
};

// Generate static background stars/nebula positions
export const generateStarPositions = (count: number): { position: THREE.Vector3, scale: number }[] => {
  const data: { position: THREE.Vector3, scale: number }[] = [];
  const minRadius = 30;
  const maxRadius = 60;

  for(let i=0; i<count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = rand(minRadius, maxRadius);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    // Cluster effect: warp some points closer together using Perlin-ish noise or just sin waves 
    // Simplified: Just random sphere for now, the "nebula" feel comes from depth and bloom
    
    data.push({
      position: new THREE.Vector3(x, y, z),
      scale: rand(0.5, 1.5)
    });
  }
  return data;
};