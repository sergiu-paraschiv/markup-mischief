import Element from './Element';

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
    depthSorted = false
  ): T[] {
    const foundNodes: T[] = [];

    traverseChildren(
      node,
      child => {
        if (child instanceof type) {
          foundNodes.push(child);
        }
      },
      depthSorted
    );

    return foundNodes;
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
