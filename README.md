# Como compilar para arquivo .EXE

  Para criar um executável de verdade (que contém o Node.js dentro dele e funciona como um programa comum), usaremos uma
  ferramenta chamada pkg.

  Como fazer:
   1. No seu terminal, instale o compilador (é rápido):
   1     npm install -g pkg
   2. Gere o executável para Windows com este comando:

   1     pkg streamer.js --targets node18-win-x64 --output streamer.exe
   3. Pronto! Ele vai criar um arquivo chamado streamer.exe.

  Vantagem do .EXE:
   - Você pode levar esse streamer.exe para qualquer outro computador com Windows e ele vai funcionar, mesmo que o outro
     PC não tenha o Node.js instalado. Ele vira um programa independente.

  ---