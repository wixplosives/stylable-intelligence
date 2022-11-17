import fs from '@file-services/node';
import { MinimalFS, Stylable, StylableConfig } from '@stylable/core';
import {
    createConnection,
    IPCMessageReader,
    IPCMessageWriter,
    DidChangeConfigurationNotification,
    TextDocuments,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { initializeResult } from './capabilities';
import { VscodeStylableLanguageService } from './vscode-service';
import { wrapFs } from './wrap-fs';
import safeParse from 'postcss-safe-parser';
import { URI } from 'vscode-uri';
import { join } from 'path';

const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let vscodeStylableLSP: VscodeStylableLanguageService;

connection.listen();
connection.onInitialize(async (params) => {
    const docs = new TextDocuments(TextDocument);
    const wrappedFs = wrapFs(fs, docs);

    const rootUri = params.rootUri;
    const rootFsPath = rootUri && URI.parse(rootUri).fsPath;
    const configPath = rootFsPath && join(rootFsPath, 'stylable.config.js');

    const resolveModule = await loadConfigFile(configPath);

    vscodeStylableLSP = new VscodeStylableLanguageService(
        connection,
        docs,
        wrappedFs,
        new Stylable({
            projectRoot: rootFsPath || '',
            fileSystem: wrappedFs,
            requireModule: require,
            cssParser: safeParse,
            resolveModule,
        })
    );

    docs.listen(connection);
    docs.onDidChangeContent(vscodeStylableLSP.diagnoseWithVsCodeConfig.bind(vscodeStylableLSP));
    docs.onDidClose(vscodeStylableLSP.onDidClose.bind(vscodeStylableLSP));

    connection.onCompletion(vscodeStylableLSP.onCompletion.bind(vscodeStylableLSP));
    connection.onDefinition(vscodeStylableLSP.onDefinition.bind(vscodeStylableLSP));
    connection.onHover(vscodeStylableLSP.onHover.bind(vscodeStylableLSP));
    connection.onReferences(vscodeStylableLSP.onReferences.bind(vscodeStylableLSP));
    connection.onDocumentColor(vscodeStylableLSP.onDocumentColor.bind(vscodeStylableLSP));
    connection.onColorPresentation(vscodeStylableLSP.onColorPresentation.bind(vscodeStylableLSP));
    connection.onRenameRequest(vscodeStylableLSP.onRenameRequest.bind(vscodeStylableLSP));
    connection.onSignatureHelp(vscodeStylableLSP.onSignatureHelp.bind(vscodeStylableLSP));
    connection.onDocumentFormatting(vscodeStylableLSP.onDocumentFormatting.bind(vscodeStylableLSP));
    connection.onDocumentRangeFormatting(vscodeStylableLSP.onDocumentRangeFormatting.bind(vscodeStylableLSP));
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    connection.onDidChangeConfiguration(vscodeStylableLSP.onChangeConfig.bind(vscodeStylableLSP));

    return initializeResult;
});

connection.onInitialized(() => {
    connection.client.register(DidChangeConfigurationNotification.type, undefined).catch(console.error);
    vscodeStylableLSP.loadClientConfiguration().then(console.log).catch(console.error);
});

async function loadConfigFile(configPath: string | null) {
    let resolveModule;

    try {
        if (configPath) {
            const { defaultConfig } = (await import(configPath)) as {
                defaultConfig: (fs: MinimalFS) => StylableConfig;
            };

            resolveModule =
                defaultConfig && typeof defaultConfig === 'function' ? defaultConfig(fs).resolveModule : undefined;
        }
    } catch (e: unknown) {
        console.warn(
            new Error(
                `Failed to load Stylable config from ${
                    configPath || 'UNKNOWN PATH'
                }, falling back to default config.\n${e as string}`
            )
        );
    }

    return resolveModule;
}
