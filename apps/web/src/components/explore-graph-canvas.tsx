'use client';

import { categoryBadgeColor, categoryColorClass } from '@tricking/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import type * as THREE from 'three';
import type { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Lienzo 3D del grafo de la Explore Page. three.js solo se carga en el cliente: este
// modulo se importa con next/dynamic y, ademas, three, OrbitControls y CSS2DRenderer se
// resuelven con import dinamico dentro del efecto para que no toquen window al cargar el
// modulo ni entren al bundle del resto de las paginas. La capa DOM accesible (los botones
// sr-only con el nombre de cada truco) vive en el componente padre.

export type GraphCanvasEdgeKind = 'prereq' | 'next' | 'stance' | 'variation';

export interface GraphCanvasNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  difficulty: number | null;
  categories: string[];
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

// Tamano estimado de una etiqueta para el filtro de nivel de detalle. Se mide la tarjeta
// real al crearla y se usa este valor solo como respaldo.
const LABEL_FALLBACK_WIDTH = 140;
const LABEL_FALLBACK_HEIGHT = 30;
const LABEL_MARGIN = 6;

function difficultyClass(level: number): string {
  const clamped = Math.min(5, Math.max(0, Math.round(level)));
  return `tb-difficulty-${clamped}`;
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
  const sceneApiRef = useRef<SceneApi | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const onSelectRef = useRef(onSelect);
  const onDeselectRef = useRef(onDeselect);
  const tTricks = useTranslations('tricks');
  const tricksRef = useRef(tTricks);
  onSelectRef.current = onSelect;
  onDeselectRef.current = onDeselect;
  tricksRef.current = tTricks;

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
      const { CSS2DObject, CSS2DRenderer } =
        await import('three/examples/jsm/renderers/CSS2DRenderer.js');
      if (disposed) {
        return;
      }

      const scene = new THREE.Scene();

      // Encuadre: la camara parte del centro del grafo. La disposicion de los nodos la
      // fija el padre, asi que cada render coloca exactamente los mismos puntos.
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

      const aspect =
        container.clientWidth > 0 && container.clientHeight > 0
          ? container.clientWidth / container.clientHeight
          : 1;
      // Distancia para que entren el ancho y el alto del bounding box segun el FOV y el
      // aspect. El plano lejano se deriva para que alejar todo el zoom no recorte.
      const fovRadians = (50 * Math.PI) / 180;
      const fitHeight = size.y / 2 / Math.tan(fovRadians / 2);
      const fitWidth = size.x / 2 / (Math.tan(fovRadians / 2) * aspect);
      const fitDistance = Math.max(fitHeight, fitWidth, 20) * 1.25;
      const far = Math.max(maxDimension * 12, fitDistance * 6, 5000);
      const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, far);
      // Vista levemente inclinada para que se note el 3D, no totalmente de frente.
      camera.position.set(
        center.x + fitDistance * 0.12,
        center.y + fitDistance * 0.18,
        center.z + fitDistance,
      );

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      // Fondo transparente: el color de superficie lo pone el tema (tb-surface).
      renderer.setClearAlpha(0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(center);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = true;
      controls.minDistance = Math.max(maxDimension * 0.2, 1);
      controls.maxDistance = Math.max(fitDistance * 4, maxDimension);
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

      // Esfera chica por nodo: ancla de las aristas y blanco del raycasting. El nombre
      // visible va en la etiqueta HTML del CSS2DRenderer.
      const nodeGeometry = new THREE.SphereGeometry(Math.max(0.9, maxDimension * 0.008), 16, 12);
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

      // Capa de etiquetas: un CSS2DObject por nodo con una tarjeta HTML (nombre y
      // badges). El contenedor y los elementos son pointer-events none para que el
      // puntero siga llegando al canvas (OrbitControls y raycasting).
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.left = '0';
      labelRenderer.domElement.style.pointerEvents = 'none';
      labelRenderer.domElement.style.zIndex = '1';
      labelRenderer.domElement.setAttribute('aria-hidden', 'true');
      container.appendChild(labelRenderer.domElement);

      const buildLabelElement = (node: GraphCanvasNode): HTMLElement => {
        const t = tricksRef.current;
        const card = document.createElement('div');
        card.className =
          'pointer-events-none select-none rounded-box border border-border bg-base-200 px-2 py-1 text-xs font-medium text-base-content shadow-sm';
        card.style.maxWidth = '11rem';
        card.style.overflow = 'hidden';

        const name = document.createElement('p');
        name.className = 'truncate';
        name.textContent = node.name;
        card.appendChild(name);

        const badges = document.createElement('div');
        badges.className = 'mt-1 flex flex-wrap items-center gap-1';

        if (node.difficulty !== null) {
          const level = Math.min(5, Math.max(0, Math.round(node.difficulty)));
          const badge = document.createElement('span');
          badge.className = `tb-badge inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${difficultyClass(node.difficulty)}`;
          badge.textContent = t(`difficulty.${level}`);
          badges.appendChild(badge);
        }

        for (const slug of node.categories) {
          const color = categoryBadgeColor(slug);
          if (color === null) {
            continue;
          }
          const badge = document.createElement('span');
          badge.className = `tb-badge inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${categoryColorClass(color)}`;
          badge.textContent = t(`categories.${slug}`);
          badges.appendChild(badge);
        }

        if (badges.childElementCount > 0) {
          card.appendChild(badges);
        }

        return card;
      };

      const labelById = new Map<string, CSS2DObject>();
      const labelSizeById = new Map<string, { width: number; height: number }>();
      for (const node of nodes) {
        const element = buildLabelElement(node);
        const object = new CSS2DObject(element);
        object.position.set(node.x, node.y, node.z);
        labelRenderer.domElement.appendChild(element);
        labelSizeById.set(node.id, {
          width: element.offsetWidth || LABEL_FALLBACK_WIDTH,
          height: element.offsetHeight || LABEL_FALLBACK_HEIGHT,
        });
        labelById.set(node.id, object);
        scene.add(object);
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
          mesh.scale.setScalar(isSelected ? 1.6 : 1);
        }
      };

      applyColors();
      applySelection(selectedIdRef.current);

      const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) {
          return;
        }
        renderer.setSize(width, height, false);
        labelRenderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();

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

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointerleave', onPointerLeave);

      // Nivel de detalle: se muestran solo las etiquetas que no se encimen (greedy por
      // pantalla), mas las del nodo bajo el puntero y el seleccionado. Las ocultas
      // quedan en el DOM con display none, no se eliminan; al acercar se revelan.
      const occupied: { x: number; y: number }[] = [];
      const updateLevelOfDetail = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) {
          return;
        }
        occupied.length = 0;
        const activeId = hoveredId ?? selectedIdRef.current;

        const place = (node: GraphCanvasNode, force: boolean) => {
          const object = labelById.get(node.id);
          if (object === undefined) {
            return;
          }
          projected.set(node.x, node.y, node.z).project(camera);
          if (projected.z < -1 || projected.z > 1) {
            object.visible = false;
            return;
          }
          const screenX = (projected.x * 0.5 + 0.5) * width;
          const screenY = (-projected.y * 0.5 + 0.5) * height;
          const size = labelSizeById.get(node.id) ?? {
            width: LABEL_FALLBACK_WIDTH,
            height: LABEL_FALLBACK_HEIGHT,
          };
          if (!force) {
            for (const point of occupied) {
              if (
                Math.abs(screenX - point.x) < size.width + LABEL_MARGIN &&
                Math.abs(screenY - point.y) < size.height + LABEL_MARGIN
              ) {
                object.visible = false;
                return;
              }
            }
          }
          object.visible = true;
          occupied.push({ x: screenX, y: screenY });
        };

        for (const node of nodes) {
          if (node.id === activeId) {
            place(node, true);
          }
        }
        for (const node of nodes) {
          if (node.id !== activeId) {
            place(node, false);
          }
        }
      };

      const renderFrame = () => {
        frameId = requestAnimationFrame(renderFrame);
        controls.update();
        updateLevelOfDetail();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
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
        labelRenderer.domElement.remove();
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
    </div>
  );
}
