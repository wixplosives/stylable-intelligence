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
} from '../src/selector-parser';


describe.only('selector-parser', () => {

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
                selector:'.a    /n/t  .b',
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
                selector:'.a    /n/t  >    /n/t  .b',
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
            }
        }

        Object.keys(testCases).forEach(testName => {

            it(testName, () => {
                const {selector, expected} = testCases[testName];
                expect(parseSelector(selector).selector).to.eql(expected);
            });

        });

    });

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
