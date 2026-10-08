'use client';

import { useEffect, useRef } from 'react';

import type * as THREE from 'three';

// Lienzo 3D del grafo de la Explore Page. three.js solo se carga en el cliente: este
// modulo se importa con next/dynamic y, ademas, three se resuelve con import dinamico
// dentro del efecto para que no toque window al cargar el modulo ni entre al bundle del
// resto de las paginas. La capa DOM accesible vive en el componente padre.

export type GraphCanvasEdgeKind = 'prereq' | 'next' | 'stance' | 'variation';

export interface GraphCanvasNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface GraphCanvasEdge {
  source: string;
  target: string;
  kind: GraphCanvasEdgeKind;
}

export interface ExploreGraphCanvasProps {
  nodes: GraphCanvasNode[];
  edges: GraphCanvasEdge[];
  selectedId: string | null;
  colorMode: 'light' | 'dark';
  onSelect: (id: string) => void;
  onDeselect: () => void;
}

interface SceneApi {
  applyColors: () => void;
  applySelection: (id: string | null) => void;
}

interface ThemeColors {
  prereq: string;
  next: string;
  stance: string;
  variation: string;
  node: string;
  selected: string;
}

// Lee los colores del tema desde las variables CSS resueltas. Nunca hay colores sueltos
// en el componente: las aristas reutilizan las mismas variables que la leyenda
// (--color-secondary, --color-primary, --color-muted, --color-info) y los nodos salen
// del acento del tema. Al cambiar data-theme el padre avisa y se vuelven a leer.
function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string): string => styles.getPropertyValue(name).trim();
  const fallback = read('--color-base-content');
  return {
    prereq: read('--color-secondary') || fallback,
    next: read('--color-primary') || fallback,
    stance: read('--color-muted') || fallback,
    variation: read('--color-info') || fallback,
    node: read('--color-accent') || fallback,
    selected: read('--color-primary') || fallback,
  };
}

export default function ExploreGraphCanvas({
  nodes,
  edges,
  selectedId,
  colorMode,
  onSelect,
  onDeselect,
}: ExploreGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const sceneApiRef = useRef<SceneApi | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const onSelectRef = useRef(onSelect);
  const onDeselectRef = useRef(onDeselect);
  onSelectRef.current = onSelect;
  onDeselectRef.current = onDeselect;

  useEffect(() => {
    selectedIdRef.current = selectedId;
    sceneApiRef.current?.applySelection(selectedId);
  }, [selectedId]);

  useEffect(() => {
    sceneApiRef.current?.applyColors();
  }, [colorMode]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const label = labelRef.current;
    if (container === null || canvas === null) {
      return;
    }

    let disposed = false;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let teardown: (() => void) | null = null;

    const start = async () => {
      const THREE = await import('three');
      if (disposed) {
        return;
      }
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      if (disposed) {
        return;
      }

      const scene = new THREE.Scene();

      // Encuadre estable: la camara parte del centro del grafo y se aleja segun el
      // tamano del conjunto. La disposicion de los nodos la fija el padre, asi que
      // cada render coloca exactamente los mismos puntos.
      const bounds = new THREE.Box3();
      for (const node of nodes) {
        bounds.expandByPoint(new THREE.Vector3(node.x, node.y, node.z));
      }
      const center = bounds.isEmpty()
        ? new THREE.Vector3(0, 0, 0)
        : bounds.getCenter(new THREE.Vector3());
      const size = bounds.isEmpty()
        ? new THREE.Vector3(0, 0, 0)
        : bounds.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z, 20);

      // El plano lejano se deriva del tamano del grafo para que alejar todo el zoom
      // (maxDistance) quede siempre bien por debajo y no recorte el grafo.
      const far = Math.max(maxDimension * 12, 5000);
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, far);

      camera.position.set(center.x, center.y, center.z + maxDimension * 1.35);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      // Fondo transparente: el color de superficie lo pone el tema (tb-surface).
      renderer.setClearAlpha(0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(center);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = true;
      controls.minDistance = maxDimension * 0.4;
      controls.maxDistance = maxDimension * 4;
      controls.update();

      const ambientLight = new THREE.AmbientLight();
      ambientLight.intensity = 1.6;
      const keyLight = new THREE.DirectionalLight();
      keyLight.position.set(
        center.x + maxDimension,
        center.y + maxDimension,
        center.z + maxDimension,
      );
      keyLight.intensity = 1.4;
      scene.add(ambientLight, keyLight);

      const nodeGeometry = new THREE.SphereGeometry(Math.max(1.2, maxDimension * 0.011), 18, 14);
      const baseMaterial = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 });
      const selectedMaterial = new THREE.MeshStandardMaterial({
        roughness: 0.3,
        metalness: 0.2,
        emissiveIntensity: 0.5,
      });

      const nodeMeshes: THREE.Mesh[] = [];
      const meshById = new Map<string, THREE.Mesh>();
      const positionById = new Map<string, GraphCanvasNode>();
      for (const node of nodes) {
        positionById.set(node.id, node);
        const mesh = new THREE.Mesh(nodeGeometry, baseMaterial);
        mesh.position.set(node.x, node.y, node.z);
        mesh.userData.nodeId = node.id;
        nodeMeshes.push(mesh);
        meshById.set(node.id, mesh);
        scene.add(mesh);
      }

      const dashSize = Math.max(0.8, maxDimension * 0.016);
      const edgeMaterialByKind: Record<
        GraphCanvasEdgeKind,
        THREE.LineBasicMaterial | THREE.LineDashedMaterial
      > = {
        prereq: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 }),
        next: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.65 }),
        stance: new THREE.LineDashedMaterial({
          transparent: true,
          opacity: 0.6,
          dashSize,
          gapSize: dashSize * 0.8,
        }),
        variation: new THREE.LineDashedMaterial({
          transparent: true,
          opacity: 0.6,
          dashSize,
          gapSize: dashSize * 0.8,
        }),
      };
      const edgeGeometries: THREE.BufferGeometry[] = [];
      for (const edge of edges) {
        const source = positionById.get(edge.source);
        const target = positionById.get(edge.target);
        if (source === undefined || target === undefined) {
          continue;
        }
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(source.x, source.y, source.z),
          new THREE.Vector3(target.x, target.y, target.z),
        ]);
        const line = new THREE.Line(geometry, edgeMaterialByKind[edge.kind]);
        if (edge.kind === 'stance' || edge.kind === 'variation') {
          line.computeLineDistances();
        }
        edgeGeometries.push(geometry);
        scene.add(line);
      }

      const applyColors = () => {
        const colors = readThemeColors();
        baseMaterial.color.set(colors.node);
        selectedMaterial.color.set(colors.selected);
        selectedMaterial.emissive.set(colors.selected);
        edgeMaterialByKind.prereq.color.set(colors.prereq);
        edgeMaterialByKind.next.color.set(colors.next);
        edgeMaterialByKind.stance.color.set(colors.stance);
        edgeMaterialByKind.variation.color.set(colors.variation);
      };

      const applySelection = (id: string | null) => {
        for (const [nodeId, mesh] of meshById) {
          const isSelected = nodeId === id;
          mesh.material = isSelected ? selectedMaterial : baseMaterial;
          mesh.scale.setScalar(isSelected ? 1.5 : 1);
        }
      };

      applyColors();
      applySelection(selectedIdRef.current);

      resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) {
          return;
        }
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
      resizeObserver.observe(container);
      const initialWidth = container.clientWidth;
      const initialHeight = container.clientHeight;
      if (initialWidth > 0 && initialHeight > 0) {
        renderer.setSize(initialWidth, initialHeight, false);
        camera.aspect = initialWidth / initialHeight;
        camera.updateProjectionMatrix();
      }

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const projected = new THREE.Vector3();
      let pointerDownX = 0;
      let pointerDownY = 0;
      let hoveredId: string | null = null;

      const updatePointer = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const pickNode = (event: PointerEvent): string | null => {
        if (nodeMeshes.length === 0) {
          return null;
        }
        updatePointer(event);
        raycaster.setFromCamera(pointer, camera);
        const intersections = raycaster.intersectObjects(nodeMeshes, false);
        const first = intersections[0];
        if (first === undefined) {
          return null;
        }
        const nodeId = first.object.userData.nodeId;
        return typeof nodeId === 'string' ? nodeId : null;
      };

      const onPointerDown = (event: PointerEvent) => {
        pointerDownX = event.clientX;
        pointerDownY = event.clientY;
      };

      const onPointerMove = (event: PointerEvent) => {
        hoveredId = pickNode(event);
        renderer.domElement.style.cursor = hoveredId !== null ? 'pointer' : 'grab';
      };

      const onPointerLeave = () => {
        hoveredId = null;
        renderer.domElement.style.cursor = 'grab';
      };

      const onPointerUp = (event: PointerEvent) => {
        // Un arrastre solo rota o panea; solo se selecciona un clic casi sin movimiento.
        const moved = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY);
        if (moved > 6) {
          return;
        }
        const hitId = pickNode(event);
        if (hitId !== null) {
          onSelectRef.current(hitId);
        } else {
          onDeselectRef.current();
        }
      };

      // Etiqueta unica: muestra el nombre del nodo bajo el puntero o, si no hay hover,
      // el del nodo seleccionado. Se proyecta la posicion 3D a pantalla cada frame; con
      // muchos nodos no se dibujan todas las etiquetas a la vez.
      const updateLabel = () => {
        if (label === null) {
          return;
        }
        const activeId = hoveredId ?? selectedIdRef.current;
        const node = activeId !== null ? positionById.get(activeId) : undefined;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (node === undefined || width === 0 || height === 0) {
          label.style.display = 'none';
          return;
        }
        projected.set(node.x, node.y, node.z).project(camera);
        if (projected.z > 1) {
          label.style.display = 'none';
          return;
        }
        const px = (projected.x * 0.5 + 0.5) * width;
        const py = (-projected.y * 0.5 + 0.5) * height;
        if (label.textContent !== node.name) {
          label.textContent = node.name;
        }
        label.style.display = 'block';
        label.style.transform = `translate(-50%, 0) translate(${px}px, ${py + 14}px)`;
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointerleave', onPointerLeave);

      const renderFrame = () => {
        frameId = requestAnimationFrame(renderFrame);
        controls.update();
        renderer.render(scene, camera);
        updateLabel();
      };
      frameId = requestAnimationFrame(renderFrame);

      sceneApiRef.current = { applyColors, applySelection };

      teardown = () => {
        cancelAnimationFrame(frameId);
        resizeObserver?.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
        if (label !== null) {
          label.style.display = 'none';
        }
        controls.dispose();
        nodeGeometry.dispose();
        baseMaterial.dispose();
        selectedMaterial.dispose();
        for (const material of Object.values(edgeMaterialByKind)) {
          material.dispose();
        }
        for (const geometry of edgeGeometries) {
          geometry.dispose();
        }
        scene.clear();
        // dispose() no libera el contexto WebGL; forceContextLoss evita acumular
        // contextos al cambiar de filtro rapido (el navegador puede tirar el mas viejo).
        renderer.forceContextLoss();
        renderer.dispose();
        sceneApiRef.current = null;
      };
    };

    void start();

    return () => {
      disposed = true;
      if (teardown !== null) {
        teardown();
      } else {
        cancelAnimationFrame(frameId);
        resizeObserver?.disconnect();
      }
    };
  }, [nodes, edges]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full touch-none" />
      {/* Etiqueta del nodo bajo el puntero o seleccionado. Es solo visual: los nombres
          ya los expone la capa sr-only del padre, por eso va aria-hidden. */}
      <div
        ref={labelRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 max-w-[14rem] truncate rounded-box border border-border bg-base-200 px-2 py-1 text-xs font-medium text-base-content shadow-md"
        style={{ display: 'none' }}
      />
    </div>
  );
}
