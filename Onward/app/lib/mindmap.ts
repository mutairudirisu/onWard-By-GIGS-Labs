/**
 * A mind map over a note's outline. The tree is not a second copy of the note:
 * it is the same lines, read through their indent depth, so the checklist view
 * and the map view never drift apart.
 */

import type { NoteLine } from "./checklist";

export type MapNode = {
  id: string;
  text: string;
  done?: boolean;
  children: MapNode[];
};

/** The note title is the trunk; every body line hangs off it by depth. */
export function linesToTree(title: string, lines: NoteLine[]): MapNode {
  const root: MapNode = { id: "root", text: title, children: [] };
  // Stack of [depth, node] ancestors, deepest last.
  const trail: [number, MapNode][] = [[-1, root]];
  lines.forEach((line, index) => {
    const depth = line.depth ?? 0;
    while (trail.length > 1 && trail[trail.length - 1][0] >= depth) trail.pop();
    const parent = trail[trail.length - 1][1];
    const node: MapNode = {
      id: String(index),
      text: line.text,
      done: line.kind === "item" ? line.done : undefined,
      children: [],
    };
    parent.children.push(node);
    trail.push([depth, node]);
  });
  return root;
}

/** Walk the tree back out, dropping the trunk because it lives in the title. */
export function treeToLines(root: MapNode): NoteLine[] {
  const out: NoteLine[] = [];
  const walk = (node: MapNode, depth: number) => {
    for (const child of node.children) {
      out.push(
        child.done === undefined
          ? { kind: "text", text: child.text, depth }
          : { kind: "item", done: child.done, text: child.text, depth },
      );
      walk(child, depth + 1);
    }
  };
  walk(root, 0);
  return out;
}

export function findNode(root: MapNode, id: string): MapNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return null;
}

export function indexOfChild(node: MapNode, id: string) {
  return node.children.findIndex((child) => child.id === id);
}

/** Detach a node and everything below it. Returns null when it is the trunk. */
export function detach(root: MapNode, id: string): MapNode {
  if (root.id === id) return root;
  const next: MapNode = { ...root, children: [] };
  for (const child of root.children) {
    if (child.id === id) continue;
    next.children.push(detach(child, id));
  }
  return next;
}

/** Apply a change to one node, returning a fresh tree. */
export function updateNode(
  root: MapNode,
  id: string,
  patch: (node: MapNode) => MapNode,
): MapNode {
  if (root.id === id) return patch(root);
  return { ...root, children: root.children.map((child) => updateNode(child, id, patch)) };
}

/** Insert a branch under `parentId`, or a sibling after it when `after`. */
export function addBranch(
  root: MapNode,
  parentId: string,
  draft: MapNode,
): MapNode {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, draft] };
  }
  return {
    ...root,
    children: root.children.map((child) => addBranch(child, parentId, draft)),
  };
}

export type Placed = { node: MapNode; x: number; y: number; depth: number };

/**
 * Left-to-right layout: a leaf takes the next row and a parent sits at the
 * middle of its children, so branches never overlap without a collision solver.
 * `x`/`y` are the centre-left of the card, already inside the canvas padding.
 */
export function layout(root: MapNode, geometry: { row: number; col: number; pad: number }) {
  const placed: Placed[] = [];
  const pairs: { parentId: string; childId: string }[] = [];
  let nextRow = 0;

  const place = (node: MapNode, depth: number): number => {
    let y: number;
    if (!node.children.length) {
      y = geometry.pad + nextRow++ * geometry.row;
    } else {
      const ys = node.children.map((child) => {
        const childY = place(child, depth + 1);
        pairs.push({ parentId: node.id, childId: child.id });
        return childY;
      });
      y = (Math.min(...ys) + Math.max(...ys)) / 2;
    }
    placed.push({ node, x: geometry.pad + depth * geometry.col, y, depth });
    return y;
  };

  place(root, 0);

  const links = pairs
    .map(({ parentId, childId }) => ({
      from: placed.find((p) => p.node.id === parentId),
      to: placed.find((p) => p.node.id === childId),
    }))
    .filter((link): link is { from: Placed; to: Placed } => Boolean(link.from && link.to));

  const deepest = Math.max(...placed.map((p) => p.depth));
  return {
    placed,
    links,
    width: geometry.pad * 2 + (deepest + 1) * geometry.col,
    height: geometry.pad * 2 + Math.max(nextRow - 1, 0) * geometry.row,
  };
}
