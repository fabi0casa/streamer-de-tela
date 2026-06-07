# Como compilar para arquivo .EXE

  Para criar um executável de verdade (que contém o Node.js dentro dele e funciona como um programa comum), usaremos uma
  ferramenta chamada pkg.

  Como fazer:
   1. No seu terminal, instale o compilador (é rápido):
   1     npm install -g pkg
   2. Gere o executável para Windows com este comando (usando Node 18 para compatibilidade):
   1     pkg streamer.js --targets node18-win-x64 --output streamer.exe

   ⚠️ **Nota sobre Ícone:** O uso do `resedit-cli` pode corromper o executável gerado pelo `pkg`. Caso queira tentar adicionar o ícone:
   1     npx resedit-cli --in streamer.exe --out streamer_com_icone.exe --icon 1,"icon/icon .ico"
   (Se o arquivo corromper, use apenas o `streamer.exe` original).

   3. Pronto! O arquivo `streamer.exe` é seu programa independente.

  Vantagem do .EXE:
   - Você pode levar esse streamer.exe para qualquer outro computador com Windows e ele vai funcionar, mesmo que o outro
     PC não tenha o Node.js instalado. Ele vira um programa independente.

  ---