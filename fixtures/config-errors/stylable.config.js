//@ts-check

module.exports = {
    defaultConfig() {
        return {
            resolveNamespace(namespace) {
                throw new Error('resolveNamespace test error for namespace: ' + namespace);
            },
        };
    },
};
