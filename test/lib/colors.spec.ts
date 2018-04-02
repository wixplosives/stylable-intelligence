import { expect } from 'chai';
import { getDocumentColors} from '../../test-kit/asserters';

describe('Colors', function () {
    describe('DocumentColor', () => {
        it('should resolve information for a single color', function () {
            const res = getDocumentColors('colors/single-color.st.css');

            expect(res).to.exist;
            expect(res!.length).to.equal(1);
            expect(res![0]).to.eql({
                range: {
                    start: {
                        line: 1,
                        character: 11
                    },
                    end: {
                        line: 1,
                        character: 14
                    }
                },
                color: {
                    red: 1,
                    green: 0,
                    blue: 0,
                    alpha: 1
                }
            });
        });

        it('should resolve information for a variable color', function () {
            const res = getDocumentColors('colors/single-var-color.st.css');

            expect(res).to.exist;
            expect(res).to.eql([
                {
                    range: {
                        start: {
                            line: 5,
                            character: 11
                        },
                        end: {
                            line: 5,
                            character: 23
                        }
                    },
                    color: {
                        red: 0,
                        green: 1,
                        blue: 0,
                        alpha: 0.8
                    }
                },
                {
                    range: {
                        start: {
                            line: 1,
                            character: 12
                        },
                        end: {
                            line: 1,
                            character: 31
                        }
                    },
                    color: {
                        red: 0,
                        green: 1,
                        blue: 0,
                        alpha: 0.8
                    }
                }
            ]);
        });

        it('should resolve information for a single imported color', function () {
            const res = getDocumentColors('colors/imported-color.st.css');

            expect(res).to.exist;
            expect(res!.length).to.equal(1);
            expect(res![0]).to.eql({
                range: {
                    start: {
                        line: 2,
                        character: 15
                    },
                    end: {
                        line: 2,
                        character: 21
                    }
                },
                color: {
                    red: 0,
                    green: 1,
                    blue: 0,
                    alpha: 0.8
                }
            });
        });
    });

    // describe('ColorPresentation', () => {

    // });
});

