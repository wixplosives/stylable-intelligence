"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isInNode(position, node) {
    if (node.source.start.line > position.line) {
        return false;
    }
    if (node.source.start.line === position.line && node.source.start.column > position.character) {
        return false;
    }
    if (node.source.end.line < position.line) {
        return false;
    }
    if (node.source.end.line === position.line && node.source.end.column < position.character) {
        return false;
    }
    return true;
}
exports.isInNode = isInNode;
function isContainer(node) {
    return node.hasOwnProperty('nodes');
}
exports.isContainer = isContainer;
function isSelector(node) {
    return node.hasOwnProperty('selector');
}
exports.isSelector = isSelector;
function isDeclaration(node) {
    return node.hasOwnProperty('prop');
}
exports.isDeclaration = isDeclaration;
function pathFromPosition(ast, position, res = []) {
    let currentNode = ast;
    res.push(ast);
    if (isContainer(currentNode) && currentNode.nodes) {
        const childNode = currentNode.nodes.find((node) => {
            return isInNode(position, node);
        });
        if (childNode) {
            return pathFromPosition(childNode, position, res);
        }
    }
    return res;
}
exports.pathFromPosition = pathFromPosition;
function getPositionInSrc(src, position) {
    const lines = src.split('\n');
    return lines.slice(0, position.line)
        .reduce((total, line) => line.length + total + 1, -1) + position.character;
}
exports.getPositionInSrc = getPositionInSrc;
//# sourceMappingURL=postcss-ast-utils.js.map