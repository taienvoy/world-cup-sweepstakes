import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Billboard, Stars } from "@react-three/drei";
import * as THREE from "three";
import { loadFlagTexture } from "../../lib/flagTexture";
import { asset } from "../../lib/asset";
import type { Team } from "../../data/teams";

const EARTH_R = 1.6;
const ORBIT_R = 2.55;

/* ---------- Earth ---------- */
function Earth({ boost }: { boost: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const [day, normal, spec, cloud] = useLoader(THREE.TextureLoader, [
    asset("textures/earth_day.jpg"),
    asset("textures/earth_normal.jpg"),
    asset("textures/earth_specular.jpg"),
    asset("textures/earth_clouds.png"),
  ]);
  useMemo(() => {
    day.colorSpace = THREE.SRGBColorSpace;
  }, [day]);

  useFrame((_, dt) => {
    const speed = 0.06 + boost * 0.5;
    if (ref.current) ref.current.rotation.y += dt * speed;
    if (clouds.current) clouds.current.rotation.y += dt * (speed + 0.02);
  });

  return (
    <group rotation={[0.41, 0, 0.05]}>
      <mesh ref={ref}>
        <sphereGeometry args={[EARTH_R, 96, 96]} />
        <meshPhongMaterial
          map={day}
          normalMap={normal}
          specularMap={spec}
          specular={new THREE.Color("#2a4a7a")}
          shininess={14}
        />
      </mesh>
      <mesh ref={clouds} scale={1.012}>
        <sphereGeometry args={[EARTH_R, 64, 64]} />
        <meshPhongMaterial map={cloud} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <Atmosphere />
    </group>
  );
}

/* ---------- Fresnel atmosphere glow ---------- */
function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color("#3aa0ff") } },
        vertexShader: `
          varying float vI;
          void main() {
            vec3 vn = normalize(normalMatrix * normal);
            vec3 vp = normalize((modelViewMatrix * vec4(position,1.0)).xyz);
            vI = pow(1.0 - abs(dot(vn, vp)), 3.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          varying float vI;
          uniform vec3 uColor;
          void main() { gl_FragColor = vec4(uColor, 1.0) * vI; }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  return (
    <mesh scale={1.18} material={mat}>
      <sphereGeometry args={[EARTH_R, 64, 64]} />
    </mesh>
  );
}

/* ---------- A single orbiting flag chip ---------- */
function FlagChip({ code, position }: { code: string; position: THREE.Vector3 }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    let alive = true;
    loadFlagTexture(code).then((t) => alive && setTex(t));
    return () => {
      alive = false;
    };
  }, [code]);

  // gentle pop-in scale
  useFrame((_, dt) => {
    if (ref.current && ref.current.scale.x < 1) {
      ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 6));
    }
  });

  if (!tex) return null;
  return (
    <Billboard position={position}>
      <group ref={ref} scale={0.01}>
        <mesh>
          <planeGeometry args={[0.36, 0.27]} />
          <meshBasicMaterial map={tex} transparent toneMapped={false} />
        </mesh>
      </group>
    </Billboard>
  );
}

/* ---------- The rotating ring of remaining flags ---------- */
function FlagsOrbit({ teams, boost }: { teams: Team[]; boost: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * (0.14 + boost * 0.7);
  });

  // Stable fibonacci-sphere slots keyed by team name so positions don't reshuffle
  // as flags are removed.
  const positions = useMemo(() => {
    const all = teams.map((t) => t.name).sort();
    const map = new Map<string, THREE.Vector3>();
    const n = Math.max(all.length, 1);
    const golden = Math.PI * (3 - Math.sqrt(5));
    all.forEach((name, i) => {
      const y = 1 - (i / (n - 1 || 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      map.set(
        name,
        new THREE.Vector3(Math.cos(theta) * r, y * 0.85, Math.sin(theta) * r).multiplyScalar(
          ORBIT_R,
        ),
      );
    });
    return map;
  }, [teams.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group ref={group}>
      {teams.map((t) => {
        const p = positions.get(t.name);
        if (!p) return null;
        return <FlagChip key={t.name} code={t.code} position={p} />;
      })}
    </group>
  );
}

export default function GlobeScene({
  remaining,
  boost,
}: {
  remaining: Team[];
  boost: number;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={2.1} color="#fff6e0" />
      <directionalLight position={[-6, -2, -4]} intensity={0.4} color="#5b7cff" />
      <Stars radius={60} depth={40} count={3000} factor={3.5} saturation={0} fade speed={0.6} />
      <Earth boost={boost} />
      <FlagsOrbit teams={remaining} boost={boost} />
    </Canvas>
  );
}
