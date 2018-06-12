import {
    InitializeResult,
    ServerCapabilities,
    ServerCapabilities as CPServerCapabilities,
} from 'vscode-languageserver-protocol';

export const initializeResult : InitializeResult = {
    capabilities: ({
        textDocumentSync: 1,//documents.syncKind,
        completionProvider: {
            triggerCharacters: ['.', '-', ':', '"', ',']
        },
        definitionProvider: true,
        hoverProvider: true,
        referencesProvider: true,
        renameProvider: true,
        colorProvider: true,
        signatureHelpProvider: {
            triggerCharacters: [
                '(',
                ','
            ]
        },
    } as CPServerCapabilities & ServerCapabilities)
};
