//must remain independant from vscode
import * as PostCss from 'postcss';
import {Stylesheet,Resolver} from 'stylable';
const PostCssNested = require('postcss-nested');
const PostCssSafe = require('postcss-safe-parser');
import * as _ from 'lodash';
const processor = PostCss([PostCssNested]);
import {getDefinition,isClassDefinition,ClassDefinition} from "./utils/get-definitions";



export class Completion{
    constructor(public label:string,public detail:string = "", public sortText:string = 'd',public insertText:string | snippet | undefined = undefined){

    }
}

export class snippet{
    constructor (public source:string){}
}


const rootClass = new Completion('.root','','b');
const importsDirective = new Completion(':import','','a',new snippet('import {\n\t-sb-from: "$1";\n}'));
const extendsDirective = new Completion('-sb-type:','','a',new snippet('-sb-type:$1;'));
const statesDirective = new Completion('-sb-states:','','a',new snippet('-sb-states:$1;'));
const mixinDirective = new Completion('-sb-mixin:','','a',new snippet('-sb-mixin:$1;'));
const variantDirective = new Completion('-sb-variant:','','a',new snippet('-sb-variant:true;'));
const fromDirective = new Completion('-sb-from:','','a',new snippet('-sb-from:"$1";'));
const namedDirective = new Completion('-sb-named:','','a',new snippet('-sb-named:$1;'));
const defaultDirective = new Completion('-sb-default:','','a',new snippet('-sb-default:$1;'));

type CompletionMap = {[s:string]:Completion};


// let a:CompletionItem = {
//     label:'',
//     kind:CompletionItemKind.Field,
//     detail:'',
//     documentation:'',
//     sortText:'a',
//     filterText:'',
//     insertText:''

// }

export interface Position{
    line:number
    character:number
}

function isInNode(position:Position,node:PostCss.NodeBase):boolean{
    if(node.source.start!.line > position.line){
        return false;
    }
    if(node.source.start!.line === position.line && node.source.start!.column > position.character){
        return false;
    }
    if(node.source.end!.line < position.line){
        return false;
    }
    if(node.source.end!.line === position.line && node.source.end!.column < position.character){
        return false;
    }
    return true;
}

function isContainer(node:PostCss.NodeBase):node is PostCss.ContainerBase{
    return node.hasOwnProperty('nodes')
}


function isSelector(node:PostCss.NodeBase):node is PostCss.Rule{
    return node.hasOwnProperty('selector')
}

function isDeclaration(node:PostCss.NodeBase):node is PostCss.Declaration{
    return node.hasOwnProperty('prop');
}
function pathFromPosition(ast:PostCss.NodeBase,postion:Position,res:PostCss.NodeBase[] = []):PostCss.NodeBase[]{
    let currentNode = ast;
    res.push(ast);
    if(isContainer(currentNode) && currentNode.nodes){
        const inChildNode = currentNode.nodes.find((node:PostCss.NodeBase)=>{
            return isInNode(postion,node);
        });
        if(inChildNode){
            return pathFromPosition(inChildNode,postion,res);
        }
    }
    return res
}


function getPositionInSrc(src:string,position:Position){
    const lines = src.split('\n');
    return lines.slice(0,position.line)
    .reduce((total:number, line)=>line.length+total+1,-1)+position.character;
}

function addExistingClasses(stylesheet:Stylesheet | undefined,completions:Completion[]){
    if(stylesheet==undefined)
        return;
    Object.keys(stylesheet.classes).forEach((className:string)=>{
        if(className==='root'){
            return;
        }
        completions.push(new Completion('.'+className,'mine','b'));
    });
}

function isIligealLine(line:string):boolean{
    return !!/^\s*[-\.:]\s*$/.test(line)
}

function isSimple(selector:string){
    if(selector.match(/[:> ]/)){
        return false;
    }
    if(selector.indexOf('.')!==0){
        return false
    };
    if(selector.lastIndexOf('.')!==0){
        return false;
    }
    return true;
}

function getLastSelectorChunck(selector:string){
    const splitSelector =  selector.split(/[> ]/);
    return splitSelector[splitSelector.length-1];
}

function getChunkTargets(selectorChunk:string):string[]{
    const splitChunk = selectorChunk.split(/(::|:|\.)/);
    const targets: string[] = [];
    if(splitChunk[0]){
        targets.push(splitChunk[0])
    }
    for(var i=1;i<splitChunk.length;i+=2){
        if(splitChunk[i]==='.'){
            targets.push('.'+splitChunk[i+1]);
        }
    }
    return targets;
}

const lineEndsRegexp = /{|}|;/;

export interface ExtendedResolver extends Resolver{
    resolveDependencies(stylesheet:Stylesheet):Thenable<void>
}

function isSpacy(char:string){
    return char === '' || char === ' ' || char === '\t' || char === '\n';
}

export default class Provider{
     public getClassDefinition(stylesheet:Stylesheet,symbol:string,resolver:ExtendedResolver){
        const symbols = resolver.resolveSymbols(stylesheet);

     }

     public provideCompletionItemsFromSrc(
        src: string,
        position: Position,
        filePath:string,
        resolver:ExtendedResolver
        ): Thenable<Completion[]> {



        let lines = src.split('\n');
        let currentLine = lines[position.line];
        let fixedSrc = src;
        if(currentLine.match(lineEndsRegexp)){
            let currentLocation = 0;
            let splitLine = currentLine.split(lineEndsRegexp);
            for(var i=0;i<splitLine.length;i++){
                currentLocation+= splitLine[i].length + 1;
                if(currentLocation>=position.character){
                    currentLine = splitLine[i];
                    if(isIligealLine(currentLine)){
                        lines.splice(position.line,1,lines[position.line].substr(currentLocation,currentLine.length));
                    }
                    break;
                }
            }

        }else if(isIligealLine(currentLine)){
            lines.splice(position.line,1, "");
            fixedSrc = lines.join('\n');
        }



        let ast:PostCss.Root;
        try{
            const res = processor.process(fixedSrc,{
                parser:PostCssSafe
            });
            ast = res.root;
        }catch(error){
            return Promise.resolve([]);
        }

        let stylesheet:Stylesheet|undefined = undefined;
        try{
             stylesheet = Stylesheet.fromCSS(fixedSrc,undefined,filePath);
        }catch(error){
            console.error('stylable transpiling failed');
        }
        return resolver.resolveDependencies(stylesheet!)
        .then(()=>{
            return this.provideCompletionItemsFromAst(src,position,filePath,resolver,ast,stylesheet!,currentLine)
        });

    }
    public provideCompletionItemsFromAst(
        src: string,
        position: Position,
        filePath:string,
        resolver:ExtendedResolver,
        ast:PostCss.Root,
        stylesheet:Stylesheet,
        currentLine:string
    ): Thenable<Completion[]>   {
        const completions:Completion[] = [];
        const trimmedLine = currentLine.trim();
        const position1Based:Position = {
            line:position.line+1,
            character:position.character
        }
        const path = pathFromPosition(ast,position1Based);
        const posInSrc = getPositionInSrc(src,position);
        const lastChar = src.charAt(posInSrc);
        const lastPart:PostCss.NodeBase = path[path.length-1];
        const prevPart:PostCss.NodeBase = path[path.length-2];

        const lastSelector = prevPart && isSelector(prevPart) ? prevPart :
                             lastPart && isSelector(lastPart) ?  lastPart : null
        if(lastSelector){
            if( lastChar==='-' ||  isSpacy(lastChar) || lastChar=="{"){
                if(lastSelector.selector === ':import'){
                    completions.push(...getNewCompletions({
                        "-sb-from":fromDirective,
                        "-sb-default":defaultDirective,
                        "-sb-named":namedDirective
                    }, lastSelector));
                }else{

                    const declarationBlockDirectived:CompletionMap = {
                        '-sb-mixin':mixinDirective
                    };
                    if(isSimple(lastSelector.selector)){
                        declarationBlockDirectived["-sb-type"] = extendsDirective;
                        declarationBlockDirectived["-sb-variant"] = variantDirective;
                        declarationBlockDirectived["-sb-states"] = statesDirective;
                    }
                    completions.push(...getNewCompletions(declarationBlockDirectived, lastSelector));
                }
            }else if(stylesheet && trimmedLine.indexOf('-sb-type:')===0 && lastChar==":" && trimmedLine.split(':').length===2){
                stylesheet.imports.forEach((importJson)=>{
                if(importJson.from.lastIndexOf('.css')===importJson.from.length-4 && importJson.defaultExport){
                    completions.push(new Completion(importJson.defaultExport,'yours','a',new snippet(' '+importJson.defaultExport+';\n')));
                }
            });
            }
        }
        if(currentLine.trim().length<2){
            if(lastChar===':'||isSpacy(lastChar)){
                completions.push(importsDirective);
            }
            if(lastChar==='.'|| isSpacy(lastChar)){
                completions.push(rootClass);
                addExistingClasses(stylesheet,completions);
            }
        }else if(lastChar===':' && stylesheet!==undefined){

            const lastChunk = getLastSelectorChunck(trimmedLine);
            const targets = getChunkTargets(lastChunk);
            if(targets.length){

                targets.forEach((target)=>{
                    if(target.charAt(0)==='.'){
                        const clsDef = getDefinition(stylesheet,target.slice(1),resolver)
                        if(isClassDefinition(clsDef)){
                            clsDef.states.forEach((stateDef)=>{
                                const from = 'from: '  + (stateDef.from ? stateDef.from : 'local file');
                                completions.push(new Completion(stateDef.name,from,'a') )
                            })
                        }
                    }
                })
            }
        }




        return Promise.resolve(completions);
    }
}

function getNewCompletions(completionMap:CompletionMap, ruleset:PostCss.Rule):Completion[]{
    ruleset.nodes!.forEach(node => {
        let dec = node as PostCss.Declaration;
        if(completionMap[dec.prop]){
            delete completionMap[dec.prop]
        }
    });
    return Object.keys(completionMap).map(name=>completionMap[name]);
}
