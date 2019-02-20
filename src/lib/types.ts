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
import { ColorPresentationRequest, DocumentColorRequest } from 'vscode-languageserver-protocol';
import { FileSystemReadSync } from 'kissfs';
import ts from 'typescript';
import { ParsedValue } from '@stylable/core';

export interface NotificationTypes {
    openDoc: NotificationType<string, void>;
    colorRequest: typeof DocumentColorRequest;
    colorPresentationRequest: typeof ColorPresentationRequest;
}

export interface LSPTypeHelpers {
    CompletionItem: typeof CompletionItem;
    TextEdit: typeof TextEdit;
    Location: typeof Location;
    Range: typeof Range;
    Position: typeof Position;
    Command: typeof Command;
    ParameterInformation: typeof ParameterInformation;
    Diagnostic: typeof Diagnostic;
}

export type ExtendedFSReadSync = {
    get(path: string): TextDocument;
    getOpenedFiles(): string[];
} & FileSystemReadSync;

export interface ExtendedTsLanguageService {
    setOpenedFiles: (files: string[]) => void;
    ts: ts.LanguageService;
}

export interface ParsedFuncOrDivValue extends ParsedValue {
    before: string;
    after: string;
}
