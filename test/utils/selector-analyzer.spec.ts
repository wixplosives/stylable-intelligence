import { expect } from "chai";

import {
    parseSelector,
    createSelectorChunk,
    createSelectorInternalChunk,
    createSelectorDescendent,
    createSelectorDirectChild,
    isSelectorChunk,
    isSelectorInternalChunk,
    isSelectorDescendent,
    isSelectorDirectChild
} from '../../src/utils/selector-analyzer';


describe.only('selector-analyzer', () => {

    describe('queries list', () => {

        const testCases:any = {
            'CSS class': {
                selector:'.a',
                expected:[createSelectorChunk({classes:['a']})]
            },
            'CSS classes on same target': {
                selector:'.a.b',
                expected:[createSelectorChunk({classes:['a', 'b']})]
            },
            'descendent target': {
                selector:'.a .b',
                expected:[
                    createSelectorChunk({classes:['a']}),
                    createSelectorDescendent(),
                    createSelectorChunk({classes:['b']})
                ]
            },
            'descendent target with multiple spaces and tabs': {
                selector:'.a        .b',
                expected:[
                    createSelectorChunk({classes:['a']}),
                    createSelectorDescendent(),
                    createSelectorChunk({classes:['b']})
                ]
            },
            'direct child target': {
                selector:'.a>.b',
                expected:[
                    createSelectorChunk({classes:['a']}),
                    createSelectorDirectChild(),
                    createSelectorChunk({classes:['b']})
                ]
            },
            'direct child target with multiple spaces and tabs': {
                selector:'.a        >        .b',
                expected:[
                    createSelectorChunk({classes:['a']}),
                    createSelectorDirectChild(),
                    createSelectorChunk({classes:['b']})
                ]
            },
            'CSS class with state': {
                selector:'.a:hover',
                expected:[createSelectorChunk({classes:['a'], states:['hover']})]
            },
            'CSS class with internal part': {
                selector:'.a::inner',
                expected:[
                    createSelectorChunk({classes:['a']}),
                    createSelectorInternalChunk({name:'inner'})
                ]
            },
            'CSS type selector': {
                selector:'div',
                expected:[
                    createSelectorChunk({type:'div'})
                ]
            },
            'CSS type selector with class and state': {
                selector:'div.a:b',
                expected:[
                    createSelectorChunk({type:'div', classes:['a'], states:['b']})
                ]
            },
            'CSS type selector after descendent selector': {
                selector:'span div',
                expected:[
                    createSelectorChunk({type:'span'}),
                    createSelectorDescendent(),
                    createSelectorChunk({type:'div'})
                ]
            },
            'complex (1)': {
                selector:'.a button.b:hover .c',
                expected:[
                    createSelectorChunk({classes:['a']}),
                    createSelectorDescendent(),
                    createSelectorChunk({type:'button', classes:['b'], states:['hover']}),
                    createSelectorDescendent(),
                    createSelectorChunk({classes:['c']}),
                ]
            }
        }

        Object.keys(testCases).forEach(testName => {

            it(testName, () => {
                const {selector, expected} = testCases[testName];
                expect(parseSelector(selector).selector).to.eql(expected);
            });

        });

    });
    "  .x".match(/^(\s)/)
    describe('position in query', () => {

        const testCases:any = {
            'CSS class': {
                selector:'.a|',
                expected:{
                    focusChunk:createSelectorChunk({classes:['a']}),
                    simpleSelector:'.a',
                    index:0
                }
            },
            'CSS class pair': {
                selector:'.a.b|',
                expected:{
                    focusChunk:createSelectorChunk({classes:['a', 'b']}),
                    simpleSelector:'.b',
                    index:0
                }
            },
            'between CSS class pair': {
                selector:'.a|.b',
                expected:{
                    focusChunk:createSelectorChunk({classes:['a', 'b']}),
                    simpleSelector:'.a',
                    index:0
                }
            },
            'descendent operator': {
                selector:'.a |.b',
                expected:{
                    focusChunk:createSelectorDescendent(),
                    simpleSelector:' ',
                    index:1
                }
            },
            'descendent operator with multiple spaces and tabs': {
                selector:'.a     |.b',
                expected:{
                    focusChunk:createSelectorDescendent(),
                    simpleSelector:'     ',
                    index:1
                }
            },
            'direct-child operator': {
                selector:'.a>|.b',
                expected:{
                    focusChunk:createSelectorDirectChild(),
                    simpleSelector:'>',
                    index:1
                }
            },
            'direct-child operator with multiple spaces and tabs': {
                selector:'.a     >     |.b',
                expected:{
                    focusChunk:createSelectorDirectChild(),
                    simpleSelector:'     >     ',
                    index:1
                }
            },
            'internal part': {
                selector:'.a::b|',
                expected:{
                    focusChunk:[createSelectorChunk({classes:['a']}), createSelectorInternalChunk({name:'b'})],
                    simpleSelector:'::b',
                    index:1
                }
            },
            'internal part of internal part': {
                selector:'.a::b::c|',
                expected:{
                    focusChunk:[createSelectorChunk({classes:['a']}), createSelectorInternalChunk({name:'b'}), createSelectorInternalChunk({name:'c'})],
                    simpleSelector:'::c',
                    index:2
                }
            },
            'internal part of internal part with internal part': {
                selector:'.a::b|::c',
                expected:{
                    focusChunk:[createSelectorChunk({classes:['a']}), createSelectorInternalChunk({name:'b'})],
                    simpleSelector:'::b',
                    index:1
                }
            },
            'internal part of internal between scoped selectors': {
                selector:'.x .a::b| .y',
                expected:{
                    focusChunk:[createSelectorChunk({classes:['a']}), createSelectorInternalChunk({name:'b'})],
                    simpleSelector:'::b',
                    index:3
                }
            },
            'state': {
                selector:'.a:hover|',
                expected:{
                    focusChunk:createSelectorChunk({classes:['a'], states:['hover']}),
                    simpleSelector:':hover',
                    index:0
                }
            },
        }

        Object.keys(testCases).forEach(testName => {

            it(testName, () => {
                const {selector, expected} = testCases[testName];
                const cursorIndex = selector.indexOf('|');

                expect(parseSelector(selector.replace('|', ''), cursorIndex).target).to.eql(expected);
            });

        });

    });

    describe('selector query data', () => {

        describe('create and check', () => {

            const testCases:any = {
                'selector chunk':{
                    create:createSelectorChunk,
                    check:isSelectorChunk
                },
                'selector inner chunk':{
                    create:createSelectorInternalChunk,
                    check:isSelectorInternalChunk
                },
                'selector descendent':{
                    create:createSelectorDescendent,
                    check:isSelectorDescendent
                },
                'selector direct child':{
                    create:createSelectorDirectChild,
                    check:isSelectorDirectChild
                }
            };

            Object.keys(testCases).forEach(testName => {

                it(testName, () => {
                    const {create, check} = testCases[testName];
                    const selectorQuery = create();

                    expect(check(selectorQuery), 'correct type').to.equal(true);
                    expect(check({}), 'simple object').to.equal(false);
                });

            });

        });

    });

});
