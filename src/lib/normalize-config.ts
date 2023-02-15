import { ExtensionConfiguration } from './vscode-service';

export interface VSCodeStylableExtensionConfig {
    diagnostics: {
        ignore: string[];
    };
    formatting: {
        newLineBetweenSelectors: boolean;
        newLineBetweenRulesets: boolean;
        endOfLine: string;
        endWithNewLine: boolean;
        experimental: boolean;
        wrapLineLength: number;
    };
}
