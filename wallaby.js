module.exports = function (w) {
  const execSync = require('child_process').execSync
  execSync('npm run build')
    return {
        files: [
          'src/**/*.ts'
        ],
        tests: [
          'test/**/*.spec.ts'
        ],
        setup: function (w) {
            const path = require('path');
            require(path.resolve(w.localProjectDir, './dist/test/setup'))
        },
        compilers: {
          '**/*.ts?(x)': w.compilers.typeScript({ typescript: require('typescript')})
        },
        env: {
          type: 'node'
        },
        testFramework: 'mocha'
    };
};
