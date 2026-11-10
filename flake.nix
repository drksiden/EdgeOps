{
  description = "EdgeOps development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    espidf.url = "github:hnaderi/espidf-nix";
  };

  outputs =
    {
      self,
      nixpkgs,
      espidf,
    }:
    let
      system = "x86_64-linux";

      pkgs = import nixpkgs {
        inherit system;
        overlays = [
          espidf.overlays.default
        ];
      };
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          esp-idf

          git
          cmake
          ninja
          python3

          # удобно для serial/debug
          tio
        ];

        shellHook = ''
          echo "EdgeOps development shell"
          echo "ESP-IDF:"
          idf.py --version
        '';
      };
    };
}
