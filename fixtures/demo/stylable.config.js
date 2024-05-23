//@ts-check
const { join } = require('path');
const { createDefaultResolver } = require('@stylable/core');

module.exports = {
    defaultConfig(fs) {
        return {
            flags: { strictCustomProperty: true },
            experimentalSelectorInference: true,
            resolveModule: createDefaultResolver({
                fs,
                alias: {
                    'comps/*': join(__dirname, 'alias-components/*'),
                },
            }),
        };
    },
};
