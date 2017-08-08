import * as PostCss from 'postcss';

export interface Position {
    line: number
    character: number
}

export function isInNode(position: Position, node: PostCss.NodeBase): boolean {
    if (node.source.start!.line > position.line) {
        return false;
    }
    if (node.source.start!.line === position.line && node.source.start!.column > position.character) {
        return false;
    }
    if (node.source.end!.line < position.line) {
        return false;
    }
    if (node.source.end!.line === position.line && node.source.end!.column < position.character) {
        return false;
    }
    return true;
}

export function isContainer(node: PostCss.NodeBase): node is PostCss.ContainerBase {
    return node.hasOwnProperty('nodes')
}

export function isSelector(node: PostCss.NodeBase): node is PostCss.Rule {
    return node.hasOwnProperty('selector')
}

export function isDeclaration(node: PostCss.NodeBase): node is PostCss.Declaration {
    return node.hasOwnProperty('prop');
}

export function pathFromPosition(ast: PostCss.NodeBase, position: Position, res: PostCss.NodeBase[] = []): PostCss.NodeBase[] {
    let currentNode = ast;
    res.push(ast);
    if (isContainer(currentNode) && currentNode.nodes) {
        const childNode = currentNode.nodes.find((node: PostCss.NodeBase) => {
            return isInNode(position, node);
        });
        if (childNode) {
            return pathFromPosition(childNode, position, res);
        }
    }
    return res
}

export function getPositionInSrc(src: string, position: Position) {
    const lines = src.split('\n');
    return lines.slice(0, position.line)
        .reduce((total: number, line) => line.length + total + 1, -1) + position.character;
}
