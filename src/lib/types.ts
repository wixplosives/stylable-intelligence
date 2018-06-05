import {
    Command,
    CompletionItem,
    Diagnostic,
    Location,
    NotificationType,
    ParameterInformation,
    Position,
    Range,
    TextDocument,
    TextEdit
} from 'vscode-languageserver';
import {
    ColorPresentationRequest,
    DocumentColorRequest
} from 'vscode-languageserver-protocol';
import {FileSystemReadSync} from 'kissfs';
import * as ts from 'typescript';
import {ParsedValue} from 'stylable';

export interface NotificationTypes {
    openDoc: NotificationType<string, void>;
    colorRequest: typeof DocumentColorRequest
    colorPresentationRequest: typeof ColorPresentationRequest
}

export interface LSPTypeHelpers {
    CompletionItem: typeof CompletionItem;
    TextEdit: typeof TextEdit;
    Location: typeof Location
    Range: typeof Range
    Position: typeof Position
    Command: typeof Command
    ParameterInformation: typeof ParameterInformation,
    Diagnostic: typeof Diagnostic
}

export type ExtendedTsLanguageService = {
    setOpenedFiles: (files: string[]) => void;
    ts: ts.LanguageService
}

export interface ParsedFuncOrDivValue extends ParsedValue {
    before: string;
    after: string;
}
