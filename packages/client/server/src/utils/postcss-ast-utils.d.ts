import * as PostCss from 'postcss';
import { ProviderPosition } from '../provider';
export declare function isInNode(position: ProviderPosition, node: PostCss.NodeBase): boolean;
export declare function isContainer(node: PostCss.NodeBase): node is PostCss.ContainerBase;
export declare function isSelector(node: PostCss.NodeBase): node is PostCss.Rule;
export declare function isDeclaration(node: PostCss.NodeBase): node is PostCss.Declaration;
export declare function pathFromPosition(ast: PostCss.NodeBase, position: ProviderPosition, res?: PostCss.NodeBase[]): PostCss.NodeBase[];
export declare function getPositionInSrc(src: string, position: ProviderPosition): number;
