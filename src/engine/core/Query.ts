import Element from './Element';

interface ElementWithDepth<T> {
  element: T;
  depth: number;
}

function traverseChildren(
  node: Element,
  action: (childNode: Element) => void,
  depthSorted = false
) {
  const children = depthSorted ? node.depthSortedChildren : node.children;
  for (const childNode of children) {
    action(childNode);
    traverseChildren(childNode, action, depthSorted);
  }
}

// TODO: figure out how to cache this
export default class Query {
  static childrenByType<T extends Element>(
    type: new (...args: never[]) => T,
    node: Element,
    depthSorted = false,
    skipInvisible = false
  ): T[] {
    if (!depthSorted) {
      // Fast path: no sorting needed
      const foundNodes: T[] = [];
      traverseChildren(
        node,
        child => {
          if (child instanceof type) {
            foundNodes.push(child);
          }
        },
        false
      );
      return foundNodes;
    }

    // Optimized depth-sorted path: collect with depth, then sort once
    const foundNodesWithDepth: ElementWithDepth<T>[] = [];

    // Traverse and collect elements with their accumulated depth
    function collectWithDepth(currentNode: Element, accumulatedDepth: number) {
      for (const child of currentNode.children) {
        const childDepth = accumulatedDepth + child.depth;

        // Skip invisible elements and their children if requested
        if (skipInvisible && !child.isVisible) {
          continue;
        }

        if (child instanceof type) {
          foundNodesWithDepth.push({
            element: child,
            depth: childDepth,
          });
        }

        // Recursively collect from children
        collectWithDepth(child, childDepth);
      }
    }

    collectWithDepth(node, 0);

    // Sort once by accumulated depth
    foundNodesWithDepth.sort((a, b) => a.depth - b.depth);

    return foundNodesWithDepth.map(item => item.element);
  }

  static parentByType<T extends Element>(
    type: new (...args: never[]) => T,
    node: Element
  ): T | undefined {
    if (node.parent instanceof type) {
      return node.parent;
    } else if (node.parent) {
      return this.parentByType(type, node.parent);
    }

    return undefined;
  }
}
