import { parseSelector, SelectorChunk, SelectorInternalChunk } from '../src/utils/selector-analyzer';
import { expect } from 'chai';

describe('Selector Parser', function () {

    it('Parses multi-part selectors', function () {
        const res = parseSelector('.first::second:someState::third');

        expect(res).to.not.equal(null);

        expect(res.selector.length).to.equal(3);
        expect((res.selector[0] as SelectorInternalChunk).type).to.equal('*');
        expect((res.selector[0] as SelectorInternalChunk).classes.length).to.equal(1);
        expect((res.selector[0] as SelectorInternalChunk).states.length).to.equal(0);

        expect((res.selector[1] as SelectorInternalChunk).name).to.equal('second');
        expect((res.selector[1] as SelectorInternalChunk).classes.length).to.equal(0);
        expect((res.selector[1] as SelectorInternalChunk).states.length).to.equal(1);

        expect((res.selector[2] as SelectorInternalChunk).name).to.equal('third');
        expect((res.selector[2] as SelectorInternalChunk).classes.length).to.equal(0);
        expect((res.selector[2] as SelectorInternalChunk).states.length).to.equal(0);
    });

    describe('Target chunk', function () {
        it('returns index of correct selector chunk', function () {
            const { selector, target } = parseSelector('.first::second:someState::third', '.first::second:someState'.length);
            expect(target.index).to.equal(1);
            expect((target.focusChunk as any[]).length).to.equal(2);
            expect((target.focusChunk as any[])[1]).to.equal(selector[1]);
        })

        it('returns internal location in selector chunk', function() {
            const { selector, target } = parseSelector('.first::second:someState::third', '.first::second:someState'.length);
            expect(target.internalIndex).to.equal(1);
        })

        it('returns internal location in selector chunk II', function() {
            const { selector, target } = parseSelector('.first::second:someState::third:otherState', '.first::second:someState'.length);
            expect(target.internalIndex).to.equal(1);
        })
    })


})
