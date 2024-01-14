import type { TreeDataNode } from 'antd';


export interface Sprite {
    path?: string
    x: number
    y: number
}

interface SpriteAtlasDataNode {
    path: string
    name: string
    isAnimation?: boolean
    children?: SpriteAtlasDataNode[]
}

export function makeSpriteMap(
    spritePath: string | undefined,
    width: number,
    height: number
) {
    const tiles: Sprite[][] = [];
    for (let j = 0; j < height; j += 1) {
        const row: Sprite[] = [];

        for (let i = 0; i < width; i += 1) {
            row.push({
                path: spritePath,
                x: i,
                y: j
            });
        }

        tiles.push(row);
    }

    return tiles;
}

export function isAnimation(node: SpriteAtlasDataNode): boolean {
    if (!node.children || node.children.length < 2) {
        return false;
    }

    const childrenWithChildren = node.children.find(child => !!child.children);
    if (childrenWithChildren) {
        return false;
    }

    const childrenThatAreNotImages = node.children.find(child => !child.name.endsWith('.png'));
    if (childrenThatAreNotImages) {
        return false;
    }

    const childNamePattern = node.children[0].name.replace(/\d/g, '$');
    for (let i = 1; i < node.children.length; i += 1) {
        const childName = node.children[i].name.replace(/\d/g, '$');
        if (childName !== childNamePattern) {
            return false;
        }
    }

    return true;
}

export function getNode(path: string, nodes: SpriteAtlasDataNode[]): SpriteAtlasDataNode | undefined {
    for (const node of nodes) {
        if (node.path === path) {
            return node;
        }

        if (node.children) {
            const foundInChidren = getNode(path, node.children);
            if (foundInChidren) {
                return foundInChidren;
            }
        }
    }
}

export function processAtlas(nodes: SpriteAtlasDataNode[]): TreeDataNode[] {
    return nodes.map(node => {
        const animation = isAnimation(node);
        return {
            key: (animation ? 'ANIMATION:' : '') + node.path,
            title: (animation ? 'ANIMATION: ' : '') + node.name,
            children: node.children ? processAtlas(node.children) : undefined
        };
    })
}
