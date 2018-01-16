
import { CompletionItem,  IConnection, InitializeResult,  TextDocuments, TextEdit, Location, Definition, Hover, TextDocument, Range, Position, ServerCapabilities, SignatureHelp, NotificationType,  Command, ParameterInformation, Diagnostic } from 'vscode-languageserver';
import { ServerCapabilities as CPServerCapabilities, DocumentColorRequest, ColorPresentationRequest} from 'vscode-languageserver-protocol/lib/protocol.colorProvider.proposed';
import { FileSystemReadSync } from 'kissfs';
export interface NotificationTypes{
    openDoc:NotificationType<string, void>;
    colorRequest:typeof DocumentColorRequest
    colorPresentationRequest:typeof ColorPresentationRequest
}
export interface LSPTypeHelpers{
    CompletionItem:typeof CompletionItem;
    TextEdit:typeof TextEdit;
    Location:typeof Location
    Range:typeof Range
    Position:typeof Position
    Command:typeof Command
    ParameterInformation:typeof ParameterInformation,
    Diagnostic: typeof Diagnostic
}
export type ExtendedFSReadSync = {
    get(path:string) : TextDocument;
    getOpenedFiles() : string[]
} & FileSystemReadSync;
