
const contextModule = require.context('./', true, /.+\.spec\.ts[x]?$/);
contextModule.keys().forEach(contextModule);
