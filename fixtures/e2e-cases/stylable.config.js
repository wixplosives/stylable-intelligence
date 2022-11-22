const { join } = require('path');
const { createDefaultResolver } = require('@stylable/core');

module.exports = {
    defaultConfig(fs) {
        return {
            resolveModule: createDefaultResolver(fs, {
                alias: {
                    comps: join(__dirname, 'alias-components'),
                },
            }),
        };
    },
};
