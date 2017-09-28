import * as PostCss from 'postcss';
import { ProviderPosition } from '../completion-providers'

export function isInNode(position: ProviderPosition, node: PostCss.NodeBase): boolean {
    if (!node.source) {
        return false;
    }
    if (!node.source.start) {
        return false;
    }
    if (node.source.start!.line > position.line) {
        return false;
    }
    if (node.source.start!.line === position.line && node.source.start!.column > position.character) {
        return false;
    }
    if (!node.source.end) {
        return !isBeforeRuleset(position, node) || (!!(node as PostCss.ContainerBase).nodes && !!((node as PostCss.ContainerBase).nodes!.length > 0 ));
    }
    if (node.source.end!.line < position.line) {
        return false;
    }
    if (node.source.end!.line === position.line && node.source.end!.column < position.character) {
        return false;
    }
    if (isBeforeRuleset(position, node)) {
        return false;
    }
    if (isAfterRuleset(position, node)) {
        return false;
    }
    return true;
}

export function isBeforeRuleset(position: ProviderPosition, node: PostCss.NodeBase) {
    const part = ((node.source.input as any).css as string).split('\n').slice(node.source.start!.line - 1, node.source.end ? node.source.end.line : undefined);
    if (part.findIndex(s => s.indexOf('{') !== -1) + node.source.start!.line > position.line) { return true }
    if (part[position.line - node.source.start!.line].indexOf('{') > position.character) { return true }
    return false;
}

export function isAfterRuleset(position: ProviderPosition, node: PostCss.NodeBase) {
    const part = ((node.source.input as any).css as string).split('\n').slice(node.source.start!.line - 1, node.source.end!.line);
    if (part.findIndex(s => s.indexOf('}') !== -1) + node.source.start!.line < position.line) { return true }
    if (part[position.line - node.source.start!.line].indexOf('}') > -1 &&
        part[position.line - node.source.start!.line].indexOf('}') < position.character) { return true }
    return false;
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

export function pathFromPosition(ast: PostCss.NodeBase, position: ProviderPosition, res: PostCss.NodeBase[] = []): PostCss.NodeBase[] {
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

export function getPositionInSrc(src: string, position: ProviderPosition) {
    const lines = src.split('\n');
    return lines.slice(0, position.line)
        .reduce((total: number, line) => line.length + total + 1, -1) + position.character;
}
