# Instalação do backend no Google Apps Script

Estas instruções instalam o backend na planilha Google Sheets `TecnoFit_Base_Mestre`.

Planilha:

```text
https://docs.google.com/spreadsheets/d/1I63DuNBk1mR-U5gNe9EvGhSu-QryqXxfVrG0RC0vtfM/edit
```

## 1. Abrir o projeto Apps Script

1. Abra a planilha mestre.
2. Acesse **Extensões > Apps Script**.
3. Aguarde a abertura do editor em uma nova guia.
4. Se existir apenas o arquivo `Code.gs`, ele pode ser excluído depois que os módulos abaixo forem criados.

## 2. Criar os arquivos de script

No editor Apps Script, clique no botão **+** ao lado de Arquivos e escolha **Script**. Crie os arquivos abaixo, sem digitar a extensão `.gs` no campo de nome:

```text
00_Config
01_Normalizacao
02_ParserHtml
02_ParserXlsx
03_Transformacao
04_PlanilhaRepositorio
05_DriveRepositorio
06_LogImportacoes
07_ImportacaoService
08_Main
```

Para cada nome, copie todo o conteúdo do arquivo correspondente desta pasta:

```text
apps-script/00_Config.gs
apps-script/01_Normalizacao.gs
apps-script/02_ParserHtml.gs
apps-script/02_ParserXlsx.gs
apps-script/03_Transformacao.gs
apps-script/04_PlanilhaRepositorio.gs
apps-script/05_DriveRepositorio.gs
apps-script/06_LogImportacoes.gs
apps-script/07_ImportacaoService.gs
apps-script/08_Main.gs
```

A ordem visual dos arquivos no editor não altera a execução.

## 3. Criar o painel lateral

1. Clique novamente em **+**.
2. Escolha **HTML**.
3. Digite o nome `Sidebar`.
4. Substitua o conteúdo criado automaticamente por todo o conteúdo de `apps-script/Sidebar.html`.

O nome precisa ser exatamente `Sidebar`, pois `08_Main.gs` procura esse arquivo.

## 4. Configurar o manifesto

1. Abra **Configurações do projeto** no menu lateral do editor.
2. Marque **Mostrar o arquivo de manifesto appsscript.json no editor**.
3. Volte para **Editor**.
4. Abra `appsscript.json`.
5. Substitua seu conteúdo pelo conteúdo de `apps-script/appsscript.json`.

O manifesto solicita somente os acessos necessários para ler/mover arquivos no Drive, alterar a planilha e exibir o painel lateral.

## 5. Salvar e carregar o menu

1. Clique em **Salvar projeto**.
2. Volte para a planilha mestre.
3. Recarregue a página.
4. Aguarde o menu **TecnoFit** aparecer ao lado dos menus do Google Sheets.
5. Acesse **TecnoFit > Abrir painel**.

## 6. Autorizar a primeira execução

Na primeira abertura ou atualização, o Google solicitará autorização:

1. Clique em **Revisar permissões**.
2. Selecione a conta proprietária da planilha e das pastas.
3. Confira os acessos ao Google Drive e Google Sheets.
4. Clique em **Permitir**.

Somente a conta responsável pela atualização deve operar o painel nesta primeira versão.

## 7. Executar a primeira atualização

Antes de clicar no botão, confirme que `01_ENTRADA` contém somente:

```text
vencimentos_2026_07_08_r01.xls ou vencimentos_2026_07_08_r01.xlsx
fichas_2026_07_08_r01.xls ou fichas_2026_07_08_r01.xlsx
avaliacao_fisica_2026_07_08_r01.xls ou avaliacao_fisica_2026_07_08_r01.xlsx
```

O backend também aceita hífens na data. Ele identifica o formato interno do arquivo: relatórios HTML de Excel continuam sendo lidos como `.xls` e arquivos Excel modernos são lidos como `.xlsx`, mesmo se o nome recebido estiver com a extensão trocada. Ao arquivar, a extensão será corrigida para refletir o formato real. Depois:

1. Abra **TecnoFit > Abrir painel**.
2. Confirme que aparece **Pronto para importar**.
3. Clique em **Atualizar base** uma única vez.
4. Não feche nem recarregue a planilha durante o processamento.
5. Aguarde a mensagem final com as quantidades de alunos e contratos.

Resultado esperado para o primeiro lote:

```text
330 alunos
339 contratos
339 linhas de dados em VISAO_MESTRE
3 registros SUCESSO em IMPORTACOES
```

Os arquivos serão renomeados com hífens e movidos para:

```text
02_PROCESSADOS/2026/2026-07-08/
```

## 8. Conferência após a atualização

- `BASE_ALUNOS`: 330 linhas de dados e IDs únicos.
- `CONTRATOS`: 339 linhas de dados.
- `VISAO_MESTRE`: 339 linhas de dados e coluna M oculta.
- `IMPORTACOES`: três linhas do lote com o mesmo `execucao_id` e status `SUCESSO`.
- ID `2321`: três contratos com três chaves técnicas diferentes.
- `01_ENTRADA`: vazia.

## 9. Em caso de erro

1. Leia a mensagem exibida no painel.
2. Consulte as linhas `ERRO` em `IMPORTACOES`.
3. Não edite manualmente as abas gerenciadas.
4. Corrija os relatórios na origem.
5. Envie os três arquivos com revisão superior, como `r02`.
6. Abra novamente o painel e execute a atualização.

Quando o lote for reconhecido, mas algum dado for inválido, os arquivos serão movidos para `03_REJEITADOS/AAAA/AAAA-MM-DD`. A última base válida será restaurada.

## 10. Atualizações futuras do código

Quando um arquivo desta pasta for alterado, copie novamente seu conteúdo integral para o arquivo de mesmo nome no editor Apps Script. Salve o projeto e recarregue a planilha.

Não crie gatilhos agendados e não implante o projeto como aplicativo da web nesta fase.
