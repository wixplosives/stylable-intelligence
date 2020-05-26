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
    };
}

export function normalizeConfig(config: VSCodeStylableExtensionConfig): ExtensionConfiguration {
    const { diagnostics, formatting } = config;
    const { endOfLine, endWithNewLine, newLineBetweenRulesets, newLineBetweenSelectors } = formatting;

    return {
        diagnostics: diagnostics,
        formatting: {
            selector_separator_newline: newLineBetweenSelectors,
            newline_between_rules: newLineBetweenRulesets,
            end_with_newline: endWithNewLine,
            eol: endOfLine,
        },
    };
}
