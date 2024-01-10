export default {
  pinnedPackages: [
    { name: '@types/vscode', reason: 'minimal supported version of vscode api' },
    {
      name: 'chai',
      reason: 'esm only from v5',
    },
  ],
};
