import { expect } from 'chai';
import { getDocumentColors } from '../../test-kit/asserters';
import { Color } from 'vscode-languageserver-protocol';
import { createRange } from '../../src/lib/completion-providers';
import { create } from 'stylable';

export function createColor(red: number, green: number, blue: number, alpha: number): Color {
    return { red, green, blue, alpha } as Color
}

describe('Colors', function () {
    describe('DocumentColor', () => {
        it('should resolve information for a single color', function () {
            const res = getDocumentColors('colors/single-color.st.css');

            expect(res).to.eql([{
                range: createRange(1, 11, 1, 14),
                color: createColor(1, 0, 0, 1)
            }]);
        });

        it('should resolve information for a variable color', function () {
            const res = getDocumentColors('colors/single-var-color.st.css');

            expect(res).to.eql([
                {
                    range: createRange(5, 11, 5, 23),
                    color: createColor(0, 1, 0, 0.8)
                },
                {
                    range: createRange(1, 12, 1, 31),
                    color: createColor(0, 1, 0, 0.8)
                }
            ]);
        });

        it('should resolve information for a single imported color', function () {
            const res = getDocumentColors('colors/imported-color.st.css');

            expect(res).to.eql([{
                range: createRange(2, 15, 2, 21),
                color: createColor(0, 1, 0, 0.8)
            }])
        });
    });

    // describe('ColorPresentation', () => {

    // });
});

