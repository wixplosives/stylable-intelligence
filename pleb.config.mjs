export default {
  pinnedPackages: [
    { name: '@types/vscode', reason: 'minimal supported version of vscode api' },
    {
      name: 'chai',
      reason: 'esm only from v5',
    },
    { name: 'eslint', reason: 'v9 has breaking changes that require changes from all plugins' },
  ],
};
