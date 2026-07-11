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
vencimentos_2026_07_08_r01.xls
fichas_2026_07_08_r01.xls
avaliacao_fisica_2026_07_08_r01.xls
```

O backend também aceita hífens na data. Depois:

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

Não crie gatilhos agendados. O dashboard deve ser publicado somente como aplicativo da web e com acesso restrito às pessoas autorizadas no Google Workspace, conforme o procedimento abaixo.

## 11. Publicação do dashboard

Antes de publicar, conclua a instalação dos arquivos `00_Config.gs` a `08_Main.gs`, de `Sidebar.html` e de `appsscript.json` descrita nas seções anteriores. Depois:

1. No editor Apps Script vinculado à planilha mestre, clique em **+ > Script** e crie, sem digitar a extensão `.gs`, os arquivos `09_DashboardMetricas`, `10_DashboardPaginas`, `11_DashboardRepositorio` e `12_DashboardApi`.
2. Copie integralmente o conteúdo dos arquivos locais para os arquivos de mesmo nome no editor:

   ```text
   apps-script/09_DashboardMetricas.gs
   apps-script/10_DashboardPaginas.gs
   apps-script/11_DashboardRepositorio.gs
   apps-script/12_DashboardApi.gs
   ```

3. Clique em **+ > HTML** e crie os quatro arquivos abaixo, sem digitar a extensão `.html` no campo de nome:

   ```text
   Dashboard
   DashboardClient
   DashboardComponents
   DashboardStyles
   ```

4. Copie integralmente o conteúdo dos quatro arquivos locais correspondentes:

   ```text
   apps-script/Dashboard.html
   apps-script/DashboardClient.html
   apps-script/DashboardComponents.html
   apps-script/DashboardStyles.html
   ```

5. Clique em **Salvar projeto**.
6. Acesse **Implantar > Nova implantação**.
7. Em **Selecionar tipo**, escolha **Aplicativo da Web**.
8. Informe uma descrição que identifique a versão publicada.
9. Em **Executar como**, selecione a conta proprietária do projeto e da planilha mestre.
10. Em **Quem pode acessar**, selecione somente a opção que restrinja o aplicativo aos usuários pretendidos do Google Workspace. Não permita acesso público ou anônimo.
11. Clique em **Implantar**, revise os escopos solicitados e conclua a autorização com a conta proprietária.
12. Copie a URL implantada que termina em `/exec`. Não use a URL de teste terminada em `/dev` na operação diária.
13. Abra a URL `/exec` em um navegador de desktop e em um navegador de celular, autenticado em cada caso com um usuário autorizado.

Quando o código do dashboard mudar, crie uma nova versão em **Implantar > Gerenciar implantações**, atualize a implantação existente e repita a verificação abaixo.

## 12. Checklist de aceitação do dashboard

- [ ] A página abre sem solicitar acesso público à planilha.
- [ ] As quatro áreas abrem no desktop e no celular.
- [ ] A data da última importação aparece corretamente.
- [ ] Um aluno com vários contratos conta uma vez em indicadores de alunos.
- [ ] O mesmo contrato não duplica valores.
- [ ] Vencimentos de 7 e 30 dias conferem com uma amostra manual.
- [ ] Fichas sem data aparecem como ausentes; fichas com mais de 30 dias, como desatualizadas.
- [ ] Avaliações sem data aparecem como ausentes; avaliações com mais de 90 dias, como desatualizadas.
- [ ] Busca e filtros atualizam cartões, gráficos e lista.
- [ ] Telefones ficam parcialmente ocultos nos cartões do celular.
- [ ] Nenhuma mensagem de erro exibe nomes ou contatos.

## 13. Verificação visual após a publicação

Com a URL `/exec` implantada e um usuário autorizado, verifique o dashboard nestas dimensões de viewport:

- `1440 × 900`: menu lateral, grade de indicadores, gráficos, listas, foco visível e estados de carregamento, vazio e erro;
- `1024 × 768`: adaptação do menu lateral, grade em duas colunas, empilhamento dos gráficos e rolagem dos indicadores;
- `390 × 844`: transição do menu lateral para a navegação inferior, cartões móveis, indicadores com rolagem horizontal e gráficos empilhados.

Nas três dimensões, teste também a navegação por teclado, a preferência de movimento reduzido, a busca, os filtros e a ausência de dados pessoais nas mensagens de erro. Registre a data, o navegador, o usuário de teste autorizado e o resultado de cada item do checklist. A verificação visual real não pode ser concluída apenas com os arquivos locais: ela requer a implantação autorizada e a leitura controlada da planilha mestre.

## 14. Validação com exports autorizados

Antes da publicação operacional, coloque temporariamente os três exports semanais autorizados — `vencimentos`, `fichas` e `avaliacao_fisica` — em `/tmp/tecnofit-validacao` e execute:

```bash
npm run validate:real -- --dir /tmp/tecnofit-validacao
```

A validação deve terminar sem erros e não deve modificar a planilha mestre. Execute-a somente quando os três arquivos autorizados estiverem presentes. Por privacidade, não copie esses exports para o repositório, não registre no relatório nomes, contatos ou outras linhas de dados e apague a cópia temporária ao final. Se os três arquivos não estiverem disponíveis, registre a validação operacional como pendente; não substitua os dados reais por fixtures para declarar esse item concluído.
