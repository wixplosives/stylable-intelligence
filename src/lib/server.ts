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
import * as semver from 'semver';

const connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let vscodeStylableLSP: VscodeStylableLanguageService;

connection.listen();
connection.onInitialize(async (params) => {
    const docs = new TextDocuments(TextDocument);
    const wrappedFs = wrapFs(fs, docs);

    const rootUri = params.rootUri;
    const rootFsPath = rootUri && URI.parse(rootUri).fsPath;
    const configBasePath = rootFsPath && join(rootFsPath, 'stylable.config');

    const config = await loadConfigFile(configBasePath, ['js', 'cjs', 'mjs']);
    if (rootFsPath) {
        fixConfigForOldVersions(config, rootFsPath);
    }

    vscodeStylableLSP = new VscodeStylableLanguageService(
        connection,
        docs,
        wrappedFs,
        new Stylable({
            ...config,
            projectRoot: rootFsPath || '',
            fileSystem: wrappedFs,
            requireModule: require,
            cssParser: safeParse,
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

async function loadConfigFile(configBasePath: string | null, suffixes: string[]): Promise<Partial<StylableConfig>> {
    if (!configBasePath) {
        return {};
    }

    const loadConfig = async (configPath: string) => {
        try {
            const { defaultConfig } = (await import(configPath)) as {
                defaultConfig: (fs: MinimalFS) => StylableConfig;
            };

            return defaultConfig && typeof defaultConfig === 'function' ? defaultConfig(fs) : {};
        } catch {
            /**/
        }
    };

    for (const suffix of suffixes) {
        const configPath = configBasePath + '.' + suffix;
        const config = await loadConfig(configPath);
        if (config) {
            console.log(`stylable config loaded from ${configPath}`);
            return config;
        }
    }

    const lookupPaths = suffixes.map((suffix) => configBasePath + '.' + suffix).join('\n');
    console.warn(new Error(`Failed to load Stylable config from\n${lookupPaths}falling back to default config.\n`));

    return {};
}

function fixConfigForOldVersions(config: Partial<StylableConfig>, rootFsPath: string) {
    try {
        const corePackagePath = require.resolve('@stylable/core/package.json', { paths: [rootFsPath] });
        const corePackageJson = fs.readJsonFileSync(corePackagePath) as { version: string };

        if (corePackageJson?.version && semver.lt(corePackageJson.version, '6.0.0')) {
            console.log(
                `\nDetected old Stylable version: ${corePackageJson.version} < 6.0.0\n`,
                config.experimentalSelectorInference
            );
            config.experimentalSelectorInference ??= false;
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(`\nFailed to detect project Stylable version: \n${message}\n`);
    }
}
