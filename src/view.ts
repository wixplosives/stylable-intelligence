import {
    InitializeResult,
    ServerCapabilities,
    ServerCapabilities as CPServerCapabilities
} from 'vscode-languageserver-protocol';
import {Completion} from "./lib/completion-types";
import {ProviderPosition, ProviderRange} from "./lib/completion-providers";
import {Command, CompletionItem, TextEdit} from 'vscode-languageserver-types';

export const initializeResult: InitializeResult = {
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


export function modelToLspCompletion(position: ProviderPosition) {
    const range = new ProviderRange(new ProviderPosition(position.line, Math.max(position.character - 1, 0)), position);
    return (com: Completion) => {
        let lspCompletion: CompletionItem = CompletionItem.create(com.label);
        lspCompletion.filterText = typeof com.insertText === 'string' ? com.insertText : com.insertText.source;
        lspCompletion.insertTextFormat = 2;
        lspCompletion.detail = com.detail;
        lspCompletion.textEdit = TextEdit.replace(com.range || range, lspCompletion.filterText);
        lspCompletion.sortText = com.sortText;
        lspCompletion.filterText = typeof com.insertText === 'string' ? com.insertText : com.insertText.source;
        if (com.additionalCompletions) {
            lspCompletion.command = Command.create("additional", "editor.action.triggerSuggest")
        } else if (com.triggerSignature) {
            lspCompletion.command = Command.create("additional", "editor.action.triggerParameterHints")
        }
        return lspCompletion;
    };
}
