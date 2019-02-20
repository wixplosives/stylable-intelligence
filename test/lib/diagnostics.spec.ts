import { expect } from 'chai';
import { Stylable } from '@stylable/core';
import { MemoryFileSystem } from 'kissfs';
import { TextDocument } from 'vscode-languageserver-types';
import { TextDocuments } from 'vscode-languageserver';
import { createDiagnosis } from '../../src/lib/diagnosis';
import { createFs } from '../../src/lib/provider-factory';
import { createDocFs } from '../../src/lib/server-utils';

function createDiagnostics(files: { [filePath: string]: string }, path: string) {
    const docs: { [path: string]: TextDocument } = {};
    Object.keys(files).reduce((prev, path: string) => {
        prev[path] = TextDocument.create('/' + path, 'css', 0, files[path]);
        return prev;
    }, docs);

    const documents: TextDocuments = {
        get: filePath => {
            return docs[filePath];
        },
        keys: () => {
            return Object.keys(docs);
        }
    } as TextDocuments;
    // const fs =  new LocalSyncFs('');
    const fs = new MemoryFileSystem('/', { content: files });
    const docsFs = createDocFs(fs, documents);

    const doc = documents.get(path);
    return doc
        ? createDiagnosis(
              doc,
              docsFs,
              Stylable.create({
                  fileSystem: createFs(docsFs),
                  projectRoot: '/'
              }).fileProcessor,
              require
          )
        : null;
}

describe('diagnostics', () => {
    it('should create basic diagnostics', () => {
        const filePath = 'style.st.css';

        const diagnostics = createDiagnostics(
            {
                [filePath]: '.gaga .root{}'
            },
            filePath
        );

        expect(diagnostics).to.deep.include({
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 13 }
            },
            message: '".root" class cannot be used after native elements or selectors external to the stylesheet',
            severity: 2
        });
    });

    xit('should create cross file errors', () => {
        const filePathA = 'style.css';
        const filePathB = 'import-style.st.css';

        const diagnostics = createDiagnostics(
            {
                [filePathA]: ``,
                [filePathB]: `
                        :import {
                            -st-from: ./${filePathA};
                            -st-named: ninja;
                        }

                        .ninja{}
                        `
            },
            filePathB
        );

        expect(diagnostics).to.deep.include({
            range: {
                start: { line: 3, character: 39 },
                end: { line: 3, character: 44 }
            },
            message: `cannot resolve imported symbol "ninja" in stylesheet "./${filePathA}"`,
            severity: 2
        });
    });
});
