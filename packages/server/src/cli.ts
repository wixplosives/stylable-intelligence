#!/usr/bin/env node
import * as os from 'os'
import * as fs from 'fs'

console.log('argv',process.argv.slice(2));
console.log(os.tmpdir())
process.on('uncaughtException', (err) => {
    fs.writeFileSync(os.tmpdir() + '/lsp.log', `Caught exception: ${err}\n`);
});

import './server';
