# Como compilar para arquivo .EXE

  Para criar um executável de verdade (que contém o Node.js dentro dele e funciona como um programa comum), usaremos uma
  ferramenta chamada pkg.

  Como fazer:
   1. No seu terminal, instale o compilador (é rápido):
   1     npm install -g pkg
   2. Gere o executável para Windows com este comando:
   1     pkg streamer.js --targets node18-win-x64 --output streamer.exe

   3. Para adicionar o ícone ao arquivo .exe (limpando o ícone padrão do Node), use:
   1     npx resedit-cli --in streamer.exe --out streamer.exe --delete-allicon --icon 1,"icon/icon .ico"

   4. Pronto! Ele vai atualizar o arquivo streamer.exe com o novo ícone.

  Vantagem do .EXE:
   - Você pode levar esse streamer.exe para qualquer outro computador com Windows e ele vai funcionar, mesmo que o outro
     PC não tenha o Node.js instalado. Ele vira um programa independente.

  ---