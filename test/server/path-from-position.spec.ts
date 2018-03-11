import {getPath} from '../../test-kit/asserters'
import { expect } from 'chai';

describe('Path parser', function () {

    it('Should add selector with no end if broken', function () {
        const path = getPath('paths/broken.st.css')
        expect(path.length).to.equal(3);
        expect(path[1].source).to.not.have.property('end')
    });

    it('Should not add selector if position is not inside ruleset', function () {
        const path = getPath('paths/outside-ruleset.st.css')
        expect(path.length).to.equal(1);
    });

    it('Should not add selector if broken and position is before ruleset', function () {
        const path = getPath('paths/outside-ruleset.st.css')
        expect(path.length).to.equal(1);
    });
});


