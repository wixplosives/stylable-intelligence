import { CompletionParams, createConnection, Connection, InitializeResult } from 'vscode-languageserver/node';
import {
    CompletionItem,
    CompletionList,
    CompletionRequest,
    DefinitionRequest,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    DidChangeTextDocumentNotification,
    DidChangeTextDocumentParams,
    DidChangeWatchedFilesNotification,
    DidChangeWatchedFilesParams,
    DidCloseTextDocumentNotification,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentNotification,
    DidOpenTextDocumentParams,
    DidSaveTextDocumentNotification,
    DidSaveTextDocumentParams,
    ExitNotification,
    Hover,
    HoverRequest,
    InitializeParams,
    InitializeRequest,
    Location,
    LogMessageNotification,
    LogMessageParams,
    NotificationHandler,
    PublishDiagnosticsNotification,
    PublishDiagnosticsParams,
    ReferenceParams,
    ReferencesRequest,
    ShowMessageNotification,
    ShowMessageParams,
    ShutdownRequest,
    SignatureHelp,
    SignatureHelpRequest,
    TelemetryEventNotification,
    TextDocumentPositionParams,
    WorkspaceEdit,
    RenameRequest,
    RenameParams,
    ColorInformation,
    ColorPresentation,
    DocumentColorRequest,
    ColorPresentationRequest,
    ColorPresentationParams,
    DocumentColorParams,
    LocationLink,
} from 'vscode-languageserver-protocol';
// adapted from https://github.com/Microsoft/vscode-languageserver-node/blob/master/client/src/client.ts
export class StreamConnectionClient {
    public sendRequest: Connection['sendRequest'];
    private readonly connection: Connection;

    constructor(input: NodeJS.ReadableStream, output: NodeJS.WritableStream) {
        this.connection = createConnection(input, output);
        this.sendRequest = this.connection.sendRequest.bind(this.connection);
    }

    public listen(): void {
        this.connection.listen();
    }

    // extend
    public initialize(params: InitializeParams = {} as InitializeParams): Promise<InitializeResult> {
        if (!params.capabilities) {
            params.capabilities = {};
        }
        return this.connection.sendRequest(InitializeRequest.type, params);
    }

    public shutdown(): Promise<void> {
        return this.connection.sendRequest(ShutdownRequest.type, undefined);
    }

    public exit() {
        return this.connection.sendNotification(ExitNotification.type);
    }

    public onLogMessage(handler: NotificationHandler<LogMessageParams>) {
        return this.connection.onNotification(LogMessageNotification.type, handler);
    }

    public onShowMessage(handler: NotificationHandler<ShowMessageParams>) {
        return this.connection.onNotification(ShowMessageNotification.type, handler);
    }

    public onTelemetry(handler: NotificationHandler<any>) {
        return this.connection.onNotification(TelemetryEventNotification.type, handler);
    }

    public didChangeConfiguration(params: DidChangeConfigurationParams) {
        return this.connection.sendNotification(DidChangeConfigurationNotification.type, params);
    }

    public didChangeWatchedFiles(params: DidChangeWatchedFilesParams) {
        return this.connection.sendNotification(DidChangeWatchedFilesNotification.type, params);
    }

    public didOpenTextDocument(params: DidOpenTextDocumentParams) {
        return this.connection.sendNotification(DidOpenTextDocumentNotification.type, params);
    }

    public didChangeTextDocument(params: DidChangeTextDocumentParams) {
        return this.connection.sendNotification(DidChangeTextDocumentNotification.type, params);
    }

    public didCloseTextDocument(params: DidCloseTextDocumentParams) {
        return this.connection.sendNotification(DidCloseTextDocumentNotification.type, params);
    }

    public didSaveTextDocument(params: DidSaveTextDocumentParams) {
        return this.connection.sendNotification(DidSaveTextDocumentNotification.type, params);
    }

    public onDiagnostics(handler: NotificationHandler<PublishDiagnosticsParams>) {
        return this.connection.onNotification(PublishDiagnosticsNotification.type, handler);
    }

    public completion(params: CompletionParams): Promise<CompletionList | CompletionItem[] | null> {
        return this.connection.sendRequest(CompletionRequest.type, params);
    }

    public hover(params: TextDocumentPositionParams): Promise<Hover | null> {
        return this.connection.sendRequest(HoverRequest.type, params);
    }

    public signatureHelp(params: TextDocumentPositionParams): Promise<SignatureHelp | null> {
        return this.connection.sendRequest(SignatureHelpRequest.type, params);
    }

    public definition(params: TextDocumentPositionParams): Promise<Location | Location[] | LocationLink[] | null> {
        return this.connection.sendRequest(DefinitionRequest.type, params);
    }

    public references(params: ReferenceParams): Promise<Location[] | null> {
        return this.connection.sendRequest(ReferencesRequest.type, params);
    }

    public rename(params: RenameParams): Promise<WorkspaceEdit | null> {
        return this.connection.sendRequest(RenameRequest.type, params);
    }

    public documentColor(params: DocumentColorParams): Promise<ColorInformation[]> {
        return this.connection.sendRequest(DocumentColorRequest.type, params);
    }

    public colorPresentation(params: ColorPresentationParams): Promise<ColorPresentation[]> {
        return this.connection.sendRequest(ColorPresentationRequest.type, params);
    }
}
