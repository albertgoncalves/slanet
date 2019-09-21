with import <nixpkgs> {};
mkShell {
    buildInputs = [
        clang-tools
        go
        htmlTidy
        nodejs
        shellcheck
    ];
    shellHook = ''
        . .shellhook
    '';
}
