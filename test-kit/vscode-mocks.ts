
// import { TextLine,Uri,workspace, languages, window, commands, ExtensionContext, Disposable, CompletionItemProvider ,TextDocument,Position,CancellationToken,CompletionItem,CompletionItemKind, Range} from 'vscode';




// class TextDocumentMock implements TextDocument{


// 		uri: Uri = {scheme:'__file__',path:'',authority:'',query:'',fragment:'',fsPath:'',toJSON:()=>{}};
// 		fileName: string = '';
// 		isUntitled: boolean = false;
// 		languageId: string = "css";
// 		version: number = 0;
// 		isDirty: boolean = false;
// 		save(): Thenable<boolean>{
//             return Promise.resolve(true)
//         };
// 		lineCount: number = 0;
// 		lineAt(line: number | Position): TextLine{
//             return {
//                 lineNumber:0,
//                 text:'',
//                 range:new Range(sta)
//             }
//         };



// 		/**
// 		 * Converts the position to a zero-based offset.
// 		 *
// 		 * The position will be [adjusted](#TextDocument.validatePosition).
// 		 *
// 		 * @param position A position.
// 		 * @return A valid zero-based offset.
// 		 */
// 		offsetAt(position: Position): number;

// 		/**
// 		 * Converts a zero-based offset to a position.
// 		 *
// 		 * @param offset A zero-based offset.
// 		 * @return A valid [position](#Position).
// 		 */
// 		positionAt(offset: number): Position;

// 		/**
// 		 * Get the text of this document. A substring can be retrieved by providing
// 		 * a range. The range will be [adjusted](#TextDocument.validateRange).
// 		 *
// 		 * @param range Include only the text included by the range.
// 		 * @return The text inside the provided range or the entire text.
// 		 */
// 		getText(range?: Range): string;

// 		/**
// 		 * Get a word-range at the given position. By default words are defined by
// 		 * common separators, like space, -, _, etc. In addition, per languge custom
// 		 * [word definitions](#LanguageConfiguration.wordPattern) can be defined.
// 		 *
// 		 * The position will be [adjusted](#TextDocument.validatePosition).
// 		 *
// 		 * @param position A position.
// 		 * @return A range spanning a word, or `undefined`.
// 		 */
// 		getWordRangeAtPosition(position: Position): Range;

// 		/**
// 		 * Ensure a range is completely contained in this document.
// 		 *
// 		 * @param range A range.
// 		 * @return The given range or a new, adjusted range.
// 		 */
// 		validateRange(range: Range): Range;

// 		/**
// 		 * Ensure a position is contained in the range of this document.
// 		 *
// 		 * @param position A position.
// 		 * @return The given position or a new, adjusted position.
// 		 */
//         validatePosition(position: Position): Position;
// }
