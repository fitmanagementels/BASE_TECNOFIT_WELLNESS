# Contexto do Projeto — Base Central TecnoFit

Última atualização: **11/07/2026 13:50 (America/Fortaleza, UTC-03:00)**

> Este é o artefato canônico de memória portátil do projeto. Atualizá-lo, junto com `CONTEXTO_DO_PROJETO.html`, após cada grande marco.

## Resumo executivo

- O projeto consolida três relatórios semanais do TecnoFit (`vencimentos`, `fichas` e `avaliacao_fisica`) em uma planilha mestre no Google Sheets.
- O backend Google Apps Script está implementado, foi copiado para a planilha mestre e é acionado manualmente pelo menu `TecnoFit > Abrir painel > Atualizar base`.
- O fluxo valida o lote, cria auditoria, substitui as três bases atuais, arquiva os arquivos processados e restaura a base anterior em caso de falha.
- Duas importações remotas foram confirmadas como `SUCESSO`: referências `2026-07-08 r01` e `2026-07-10 r01`.
- A planilha trabalha como **snapshot atual**: `BASE_ALUNOS`, `CONTRATOS` e `VISAO_MESTRE` são integralmente substituídas a cada sucesso.
- O histórico operacional permanece em `IMPORTACOES`; os relatórios originais permanecem em `02_PROCESSADOS`.
- A exatidão da migração dos dados ainda não foi conferida pelo usuário. O funcionamento do fluxo foi confirmado, mas a qualidade do conteúdo consolidado continua pendente de validação.
- Dashboard, gatilhos agendados e tabela histórica analítica ainda não foram implementados.

## Objetivo do projeto

- **Objetivo principal:** centralizar dados essenciais de clientes para acompanhamento operacional e servir de fonte confiável para um futuro dashboard em Apps Script.
- **Resultado esperado:** uma base mestre atualizável semanalmente por botão, com rastreabilidade dos lotes e proteção contra atualizações parciais.
- **Usuário principal:** proprietário/operador da base, responsável por executar a atualização e monitorar clientes.
- **Usuário secundário:** administrador que exporta e envia os três relatórios para `01_ENTRADA`.
- **Critérios de sucesso atuais:** reconhecer um lote completo, consolidar por ID, preservar contratos múltiplos, atualizar as abas, registrar três linhas de auditoria e arquivar os arquivos sem corromper a última base válida.

## Estado atual

- **Etapa atual:** estabilização e validação do backend manual já instalado.
- **Status geral:** operacional; duas execuções remotas concluídas com sucesso.
- **Última ação relevante:** processamento do lote `2026-07-10 r01` em 11/07/2026.
- **Onde parou:** o fluxo técnico funcionou, mas o usuário decidiu não conferir ainda se todos os dados migraram corretamente.
- **Próxima decisão necessária:** definir como e quando validar a qualidade da consolidação antes de iniciar o dashboard.
- **O que falta para continuar:** validar amostras e totais na planilha; depois decidir se o dashboard precisa de histórico temporal ou somente do snapshot atual.

### Estado remoto observado em 11/07/2026

| Item | Estado observado |
|---|---|
| Planilha mestre | Quatro abas existentes: `BASE_ALUNOS`, `CONTRATOS`, `VISAO_MESTRE`, `IMPORTACOES` |
| `01_ENTRADA` | Vazia após as duas atualizações |
| `02_PROCESSADOS/2026` | Pastas `2026-07-08` e `2026-07-10` |
| `03_REJEITADOS` | Vazia |
| Auditoria | 6 registros, três por lote, todos `SUCESSO` |
| Validação do conteúdo pelo usuário | Ainda não realizada |

### Lotes processados

| Referência | Revisão | Vencimentos | Fichas | Avaliações | Resultado/avisos |
|---|---:|---:|---:|---:|---|
| 2026-07-08 | r01 | 339 | 1456 | 923 | Sucesso; 88 sem ficha, 111 sem avaliação, 3 contratos sem frequência/polo identificáveis |
| 2026-07-10 | r01 | 339 | 1456 | 942 | Sucesso; 88 sem ficha, 87 sem avaliação, 3 contratos sem frequência/polo identificáveis |

Os números acima vêm da aba remota `IMPORTACOES`. Eles provam que o processamento terminou, não que cada campo consolidado está correto.

## Histórico relevante

| Data | Mudança | Impacto |
|---|---|---|
| 08–10/07/2026 | Levantamento das três planilhas e desenho da base central | Definiu o ID como integração e `vencimentos` como população principal |
| 10/07/2026 | Estrutura do Drive e planilha mestre criada | Estabeleceu entrada, processados, rejeitados e documentação |
| 10/07/2026 | Backend Apps Script desenvolvido localmente com TDD | Criou parser HTML/XLS, transformação, auditoria, rollback, menu e painel lateral |
| 10/07/2026 | Validação local com os arquivos reais | Confirmou 330 alunos, 339 contratos, 339 linhas na visão e 3 chaves distintas para o ID de teste com contratos múltiplos |
| 11/07/2026 | Backend instalado manualmente na planilha mestre | Tornou o fluxo utilizável pelo menu e painel lateral |
| 11/07/2026 | Dois lotes processados com sucesso | Confirmou operação real, arquivamento e auditoria; conteúdo ainda não auditado pelo usuário |
| 11/07/2026 | Criado pacote portátil de contexto | Permite retomar o projeto em outra máquina, chat ou IA |

Não há histórico Git: a pasta atual **não é um repositório Git**.

## Decisões tomadas

- Usar `vencimentos` como fonte da população atual de alunos, pois contém os contratos que determinam a visão operacional.
- Manter uma linha por ID em `BASE_ALUNOS` e uma linha por contrato em `CONTRATOS`, evitando perda de contratos simultâneos.
- Gerar `VISAO_MESTRE` com uma linha por contrato; IDs podem se repetir e métricas de alunos devem usar IDs distintos.
- Obter contato e data da ficha em `fichas`; usar a ficha válida mais recente quando houver repetição.
- Obter a data de avaliação mais recente em `avaliacao_fisica`.
- Manter `inicio_plano` vazio nesta fase; `inicio_corrente` vem de `vencimentos`.
- Separar frequência e polo do contrato completo, preservando também o texto integral em `CONTRATOS`.
- Usar uma chave técnica `ID|CONTRATO_NORMALIZADO|INICIO_CORRENTE` para distinguir contratos.
- Atualizar manualmente por menu + painel lateral. Não usar gatilho agendado nesta fase.
- Aceitar `_` ou `-` nas datas dos nomes de entrada e arquivar sempre com hífens.
- Substituir integralmente as três abas gerenciadas a cada lote; não mesclar registros antigos.
- Preservar o histórico operacional em `IMPORTACOES` e os arquivos brutos em `02_PROCESSADOS`.
- Operar inicialmente somente pela conta proprietária; o administrador apenas envia arquivos.
- Instalar manualmente os módulos no editor Apps Script; `clasp` não é usado no fluxo atual.

## Memória de decisões e justificativas

| Decisão | Por que foi tomada | Onde impacta | Como verificar/retomar |
|---|---|---|---|
| Duas camadas: alunos e contratos | Alguns IDs têm mais de um contrato; selecionar apenas um perderia valor e polo | `03_Transformacao.gs`, abas `BASE_ALUNOS` e `CONTRATOS` | Verificar IDs repetidos em `VISAO_MESTRE` e únicos em `BASE_ALUNOS` |
| Snapshot substitui snapshot | O objetivo inicial é monitorar o estado atual com baixo atrito | `04_PlanilhaRepositorio.gs` | `substituirAbasGerenciadas` limpa e regrava as três abas |
| Histórico fora das abas atuais | Evita complexidade antes do dashboard | `IMPORTACOES` e `02_PROCESSADOS` | Para tendências, será preciso importar snapshots antigos ou criar uma aba histórica |
| Operação transacional com rollback | Um arquivo ruim não pode destruir a última base válida | `07_ImportacaoService.gs` | Testes de serviço cobrem substituição, restauração e rejeição |
| Arquivos `.xls` tratados como HTML | Os relatórios exportados têm extensão Excel, mas conteúdo HTML UTF-8 | `02_ParserHtml.gs`, `05_DriveRepositorio.gs` | Não converter nem salvar novamente os arquivos antes do upload |
| Revisão obrigatória | Impede reprocessar acidentalmente o mesmo lote | `06_LogImportacoes.gs` | Um lote com mesma data/revisão já registrada é recusado; correção usa `r02`, `r03` etc. |
| Painel manual | Permite observar o lote e o resultado antes de automatizar | `08_Main.gs`, `Sidebar.html` | Recarregar a planilha e abrir `TecnoFit > Abrir painel` |
| Código modular e testável | Reduz risco em parsing e transformação de dados reais | `apps-script/`, `tests/` | Executar `npm test` com Node 24 |

## Informações importantes capturadas do chat

- O usuário já realizou duas atualizações e confirmou que o processo operacional ocorreu corretamente.
- O usuário explicitamente ainda não conferiu se os dados foram migrados de forma adequada; não tratar a migração como validada.
- Em uma atualização bem-sucedida, os dados antigos não permanecem nas três abas gerenciadas. Eles só podem ser recuperados dos arquivos em `02_PROCESSADOS`, do histórico de versões do Sheets ou de uma futura tabela histórica.
- Se a segunda atualização tiver menos alunos ou contratos, os registros ausentes desaparecem do snapshot atual.
- O backup do backend é temporário e serve para rollback durante a execução; não é uma cópia histórica persistente.
- O pacote `CONTEXTO_DO_PROJETO.md` + `.html` deve ser atualizado após cada grande marco.
- Dados pessoais dos alunos não devem ser copiados para documentação, testes, commits ou prompts de continuidade.

## Etapa atual em desenvolvimento

- **O que está sendo feito:** estabilização do backend e preparação para validação dos dados consolidados.
- **Arquivos envolvidos:** `apps-script/`, `tests/`, `LEIA-ME.md` e este pacote de contexto.
- **O que já está pronto:** backend modular, painel lateral, instalação manual, testes automatizados, validação local e duas execuções remotas.
- **O que ainda falta:** conferir a exatidão dos dados na planilha e atualizar a documentação operacional que ainda afirma que o backend precisa ser instalado.
- **Cuidado ao continuar:** não implementar dashboard ou histórico assumindo que a migração está validada; não editar manualmente as três abas gerenciadas.

## Próximos passos

1. Validar a segunda atualização na planilha mestre: contagens, IDs únicos, contratos múltiplos, contatos, datas, valores e polos.
2. Comparar uma amostra de IDs entre os três relatórios processados e `VISAO_MESTRE`, sem expor dados pessoais em documentação.
3. Decidir se o dashboard precisa mostrar apenas o estado atual ou também evolução semanal; se precisar de evolução, projetar uma camada histórica antes do dashboard.
4. Atualizar a seção “Situação atual” de `LEIA-ME.md`, pois ela ainda descreve o backend como não instalado.
5. Definir uma estratégia de sincronização entre máquinas: preferencialmente inicializar Git e manter o código-fonte como referência canônica do Apps Script remoto.
6. Somente após validar a base, iniciar uma especificação separada para o dashboard.
7. Atualizar `CONTEXTO_DO_PROJETO.md` e `.html` ao concluir cada um desses marcos.

## Arquivos e pastas importantes

| Caminho | Função | Observação |
|---|---|---|
| `CONTEXTO_DO_PROJETO.md` | Memória canônica portátil | Ler primeiro em outra máquina ou chat |
| `CONTEXTO_DO_PROJETO.html` | Painel retrátil do mesmo contexto | Consulta rápida; não é fonte independente |
| `LEIA-ME.md` | Arquitetura, rotina semanal e regras de dados | A seção de situação atual precisa ser atualizada |
| `apps-script/00_Config.gs` | IDs, abas e cabeçalhos | Contém os identificadores operacionais do Drive e Sheets |
| `apps-script/01_Normalizacao.gs` | IDs, datas, moeda e chave | Datas `dd/MM/yyyy`; moeda brasileira |
| `apps-script/02_ParserHtml.gs` | Parser dos `.xls` HTML | Ignora rodapés `Total` conhecidos |
| `apps-script/03_Transformacao.gs` | Consolidação por ID e contrato | Define o snapshot final |
| `apps-script/04_PlanilhaRepositorio.gs` | Escrita, backup e restauração | Substitui as três abas atuais |
| `apps-script/05_DriveRepositorio.gs` | Entrada e arquivamento | Aceita hífen/sublinhado e normaliza nomes |
| `apps-script/06_LogImportacoes.gs` | Auditoria e revisões | `IMPORTACOES` é append-only |
| `apps-script/07_ImportacaoService.gs` | Orquestração e rollback | Lock, transformação, escrita, movimentação e erro |
| `apps-script/08_Main.gs` | Interfaces públicas | `onOpen`, painel, status e execução |
| `apps-script/Sidebar.html` | Botão e mensagens do painel | Usa `google.script.run` |
| `apps-script/INSTRUCOES_INSTALACAO.md` | Instalação manual | Já foi executada pelo usuário |
| `tests/` | Testes com dados fictícios | Não contém dados pessoais reais |
| `scripts/validar-dados-reais.js` | Validação local controlada | Recebe caminhos externos; não imprime nomes/contatos |
| `docs/superpowers/plans/2026-07-10-importacao-base-tecnofit.md` | Plano histórico detalhado | Parte sobre `clasp` foi substituída pela instalação manual |

### Recursos remotos

- Pasta principal: `https://drive.google.com/drive/folders/1t7U0mAzejc98pvq5foknWKIADa9YBcuj`
- Planilha mestre: `https://docs.google.com/spreadsheets/d/1I63DuNBk1mR-U5gNe9EvGhSu-QryqXxfVrG0RC0vtfM/edit`

## Riscos, bloqueios e pendências

### Riscos

- A execução técnica foi bem-sucedida, mas a correção dos campos migrados ainda não foi auditada.
- As abas atuais não armazenam histórico temporal. Tendências e churn não podem ser calculados diretamente delas.
- O código remoto foi instalado por cópia manual; pode surgir divergência entre Apps Script e os arquivos locais.
- Sem Git, a troca de máquina depende de copiar toda a pasta corretamente e não há histórico de commits.
- Os relatórios contêm dados pessoais; permissões e compartilhamentos precisam permanecer restritos.
- Excluir arquivos de `02_PROCESSADOS` elimina a principal fonte de reconstrução histórica.

### Bloqueios

- Nenhum bloqueio técnico identificado para executar novos lotes.
- O dashboard deve permanecer bloqueado por decisão até a validação mínima da qualidade dos dados.

### Pendências

- Validar conteúdo migrado.
- Decidir estratégia histórica.
- Atualizar `LEIA-ME.md` para refletir a implantação concluída.
- Inicializar controle de versão/sincronização entre máquinas.
- Confirmar se o código no Apps Script permanece idêntico a `apps-script/` após futuras alterações.

### Lacunas de contexto

- Frequência definitiva das atualizações: semanal foi planejado, mas a rotina operacional final ainda pode mudar.
- Métricas e layout do dashboard: não definidos.
- Política de retenção de arquivos processados: recomendação atual é não excluir; prazo formal não definido.
- Método de validação da migração: a confirmar com o usuário.

## Como retomar o trabalho

1. Leia `CONTEXTO_DO_PROJETO.md` por completo.
2. Leia `LEIA-ME.md` e considere a ressalva de que sua seção de situação atual está desatualizada.
3. Leia `apps-script/03_Transformacao.gs`, `04_PlanilhaRepositorio.gs` e `07_ImportacaoService.gs` antes de alterar regras de dados.
4. Verifique a planilha remota, especialmente `IMPORTACOES`, sem copiar dados pessoais para logs ou prompts.
5. Confirme que `01_ENTRADA` está no estado esperado antes de qualquer teste real.
6. Use Node 24 (`nvm use`) e execute `npm test`.
7. Se tiver acesso local aos relatórios de teste, execute `npm run validate:real -- <vencimentos> <fichas> <avaliacao>`.
8. Continue pelo primeiro item pendente: validação da qualidade da migração.
9. Atualize os dois arquivos `CONTEXTO_DO_PROJETO` ao concluir o próximo marco.

## Contexto para outro chat ou IA

Cole ou anexe este arquivo ao iniciar em outra máquina, conta ou IA.

- **Objetivo essencial:** consolidar três relatórios TecnoFit em uma base mestre atualizável e segura, preparada para um futuro dashboard.
- **Estado atual:** backend Apps Script instalado; dois lotes remotos concluídos com sucesso; dados ainda não auditados pelo usuário.
- **Arquivos que precisam ser lidos:** `CONTEXTO_DO_PROJETO.md`, `LEIA-ME.md`, `apps-script/03_Transformacao.gs`, `04_PlanilhaRepositorio.gs`, `07_ImportacaoService.gs` e `INSTRUCOES_INSTALACAO.md`.
- **Decisões que não devem ser desfeitas sem nova validação:** uma linha por aluno, uma por contrato, visão por contrato, snapshot substitutivo, histórico bruto em processados, revisão obrigatória e rollback em erro.
- **Próxima ação:** conferir a qualidade dos dados do lote `2026-07-10 r01` e decidir se haverá histórico analítico.
- **Lacunas que a IA deve confirmar antes de agir:** métricas do dashboard, necessidade de histórico, método de validação e política de retenção.
- **Restrições:** não expor dados pessoais, não apagar processados, não alterar IDs/nome de abas sem atualizar configuração e documentação.

## Rotina de atualização desta memória

Atualizar `CONTEXTO_DO_PROJETO.md` primeiro e regenerar `CONTEXTO_DO_PROJETO.html` sempre que ocorrer um grande passo, por exemplo:

- conclusão da validação da migração;
- mudança da estrutura das abas ou regras de transformação;
- criação da camada histórica;
- início ou conclusão do dashboard;
- adoção de Git/clasp ou mudança da forma de implantação;
- incidente relevante, rollback ou alteração do fluxo semanal.
