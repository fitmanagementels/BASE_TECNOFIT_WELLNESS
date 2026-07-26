# Contexto do Projeto — Base Central TecnoFit

Última atualização: **26/07/2026 (America/Fortaleza, UTC-03:00)**

> Memória portátil canônica. Atualizar este arquivo e `CONTEXTO_DO_PROJETO.html` após cada grande marco.

## Resumo executivo

- O projeto consolida `vencimentos`, `fichas` e `avaliacao_fisica` do TecnoFit em uma planilha mestre do Google Sheets.
- O backend Apps Script é acionado manualmente por **TecnoFit > Abrir painel > Atualizar base**.
- As abas `BASE_ALUNOS`, `CONTRATOS` e `VISAO_MESTRE` são um snapshot do lote vigente; `IMPORTACOES` é append-only e os arquivos brutos ficam no Drive.
- As importações remotas `2026-07-08 r01` e `2026-07-10 r01` foram bem-sucedidas. A exatidão de todos os campos ainda não foi auditada pelo usuário.
- Em 20/07, dois lotes foram rejeitados antes de alterar a base porque um arquivo XLSX real foi tratado como HTML por ter nome `.xls`.
- O código local agora aceita HTML/XLS legado e XLSX real, detectando o formato pelo conteúdo e corrigindo a extensão ao arquivar. A atualização ainda precisa ser copiada ao Apps Script remoto e validada com um lote novo.

## Objetivo do projeto

- **Objetivo principal:** manter uma base de clientes atualizável semanalmente, segura e auditável, como fonte de um dashboard futuro.
- **Usuários:** administrador que entrega os relatórios em `01_ENTRADA` e operador que executa a importação na planilha mestre.
- **Critérios atuais:** lote completo com mesma data/revisão, contratos múltiplos preservados, nenhuma atualização parcial e arquivos arquivados com auditoria.

## Estado atual

- **Etapa:** implantação do suporte a XLSX e validação operacional do novo leitor.
- **Código local:** implementado e testado em `main`.
- **Código remoto:** a confirmar; o usuário deve criar `02_ParserXlsx` e atualizar `05_DriveRepositorio` no editor Apps Script.
- **Base remota:** permanece na última atualização bem-sucedida de `2026-07-10 r01` até uma nova importação concluir.
- **Lote mais recente observado:** o print de 26/07 mostrou três relatórios `2026-07-25 r01` em `01_ENTRADA`; confirmar em `IMPORTACOES` se essa revisão já foi registrada antes de executar.
- **Pendência prioritária:** instalar a atualização e testar com uma revisão não registrada (`r01` se ausente no log; caso contrário, `r02`).

## Histórico relevante

| Data/commit | Mudança | Impacto |
|---|---|---|
| 10/07/2026 | Backend inicial de importação HTML/XLS criado e instalado | Base central, auditoria, rollback e painel manual passaram a funcionar |
| 11/07/2026 | Lotes `2026-07-08 r01` e `2026-07-10 r01` concluídos | Primeiro uso operacional confirmado |
| 20/07/2026 | Lotes `2026-07-20 r01` e `r02` rejeitados | Base preservada; revelou XLSX real sob extensão `.xls` |
| `e46878a` / `3b2f3b4` | Design e plano de suporte a XLSX | Definiu leitura nativa via `Utilities.unzip`, sem serviço externo |
| `54397ed` | Reconhecimento de nomes e assinatura ZIP | Aceita `.xls`/`.xlsx` e detecta XLSX pelo conteúdo |
| `dcf356f` | Leitor OOXML/XLSX | Lê strings compartilhadas, texto inline, números e datas serializadas |
| `cab21a5` | Roteamento seguro e documentação | Mantém HTML antigo, corrige extensão ao arquivar e protege a base em falhas |

## Decisões tomadas

- `vencimentos` define a população atual; `fichas` define contato/data de ficha e `avaliacao_fisica` define data de avaliação.
- Uma linha por aluno em `BASE_ALUNOS`; uma por contrato em `CONTRATOS` e `VISAO_MESTRE`.
- Snapshot atual é substituído por inteiro somente após a leitura/validação do lote completo; registros antigos não contaminam as análises normais.
- O status de um aluno que desaparece deve futuramente ser tratado como **ausente do lote**, fora da base atual; a camada histórica ainda não foi implementada.
- O formato interno do arquivo é a autoridade: ZIP/OOXML usa leitor XLSX; HTML usa leitor legado. A extensão recebida pode estar incorreta.
- Arquivo XLSX nomeado `.xls` é aceito e arquivado como `.xlsx`; HTML nomeado `.xlsx` é arquivado como `.xls`.
- Correções de lote exigem revisão maior porque qualquer tentativa registrada bloqueia a mesma combinação data/revisão.
- Não usar `clasp`, gatilhos ou conversão temporária para Google Sheets nesta fase.
- A pasta principal `main` deve ser a única cópia oficial. A consolidação do worktree de dashboard ainda está pendente.

## Memória de decisões e justificativas

| Decisão | Por que | Onde impacta | Como retomar |
|---|---|---|---|
| Leitor XLSX nativo | TecnoFit passou a entregar XLSX; conversão via Drive exigiria permissões e arquivos temporários | `02_ParserXlsx.gs` | Usa `Utilities.unzip(blob)` e lê a primeira worksheet |
| Roteamento antes da transformação | Um formato ruim não pode alterar snapshot vigente | `05_DriveRepositorio.gs`, `07_ImportacaoService.gs` | Leitura acontece antes de backup/substituição |
| Reaproveitar `tabelaParaObjetos` | Regras de cabeçalho, total e validação precisam ser iguais para HTML e XLSX | `02_ParserHtml.gs`, `02_ParserXlsx.gs` | Ambos geram matriz de linhas antes do mapeamento |
| Snapshot limpo | Dashboard comum deve mostrar só o lote vigente | Abas gerenciadas | Projetar histórico separado quando a análise de ausentes for implementada |

## Informações importantes capturadas do chat

- A planilha de exemplo `avaliacao_fisica_2026-07-25_r01.xls` foi lida como HTML de Excel e contém os cabeçalhos exigidos (`Código` e `Data da Avaliação`); ela já é compatível com o leitor legado.
- O arquivo de vencimentos problemático era Excel 2007+ (ZIP/OOXML), embora estivesse nomeado com `.xls`; os cabeçalhos necessários existiam, mas o leitor antigo não podia vê-los.
- Falhas dos lotes de 20/07 ocorreram antes da substituição das três abas; a última base válida não foi apagada.
- Não registrar dados pessoais de alunos em documentação, testes ou conversas de continuidade.
- O usuário quer atualizar sempre o mesmo conjunto de códigos, sem vários worktrees ou cópias concorrentes.

## Etapa atual em desenvolvimento

- **Pronto localmente:** `02_ParserXlsx.gs`, detecção de formato em `05_DriveRepositorio.gs`, testes e documentação operacional.
- **Testes:** `npm test` passou em 26/07/2026; há cobertura para nomes `.xlsx`, XLSX disfarçado de `.xls`, HTML disfarçado de `.xlsx`, strings compartilhadas, texto inline, números, datas seriais, XLSX inválido e rollback antes da substituição.
- **Ainda falta:** instalar no projeto Apps Script vinculado e validar um lote real não registrado.
- **Cuidado:** ao instalar, criar também o arquivo novo `02_ParserXlsx`; copiar somente `05_DriveRepositorio` causará erro de função inexistente.

## Próximos passos

1. No Apps Script da planilha mestre, criar `02_ParserXlsx` e copiar o conteúdo de `apps-script/02_ParserXlsx.gs`; substituir `05_DriveRepositorio` pelo arquivo local correspondente e salvar.
2. Recarregar a planilha, abrir o painel e verificar se o lote de 25/07 usa revisão não registrada. Se `r01` já existir em `IMPORTACOES`, renomear os três relatórios para `r02`.
3. Executar a importação e conferir três linhas `SUCESSO`, base atualizada, `01_ENTRADA` vazia e extensões coerentes em `02_PROCESSADOS/2026/2026-07-25`.
4. Validar uma amostra de IDs, valores, polos e datas antes de usar o dashboard como fonte de decisão.
5. Consolidar o worktree/branch `feature/dashboard-xsteam` na `main` ou removê-lo conscientemente, preservando a regra de uma única cópia oficial.
6. Projetar a aba de eventos históricos para alunos/contratos ausentes do lote antes de incluí-la em análises de dashboard.

## Arquivos e pastas importantes

| Caminho | Função | Observação |
|---|---|---|
| `apps-script/02_ParserHtml.gs` | Leitor dos relatórios HTML/XLS | Mantido por compatibilidade |
| `apps-script/02_ParserXlsx.gs` | Leitor OOXML/XLSX | Novo; deve ser criado no Apps Script remoto |
| `apps-script/05_DriveRepositorio.gs` | Nomes, detecção, leitura e arquivamento | Atualizado para roteamento por conteúdo |
| `apps-script/07_ImportacaoService.gs` | Lock, auditoria, substituição e rollback | Não mudou; garante que falha de leitura não substitui a base |
| `apps-script/INSTRUCOES_INSTALACAO.md` | Passo a passo de instalação | Atualizado com `.xlsx` e arquivo novo |
| `LEIA-ME.md` | Manual de operação | Aceita `.xls` e `.xlsx` |
| `tests/parser.test.js` | Testes do leitor XLSX | Dados sintéticos, sem dados pessoais |
| `tests/lote.test.js` | Testes de nomes, formatos e roteamento | Cobre extensões divergentes |
| `tests/service.test.js` | Garantia contra substituição indevida | Cobre falha de leitura XLSX |
| `docs/superpowers/specs/2026-07-26-suporte-xlsx-design.md` | Design aprovado | Fonte da decisão técnica |
| `docs/superpowers/plans/2026-07-26-suporte-xlsx.md` | Plano executado | Registro das etapas TDD |

## Recursos remotos

- Planilha mestre: `https://docs.google.com/spreadsheets/d/1I63DuNBk1mR-U5gNe9EvGhSu-QryqXxfVrG0RC0vtfM/edit`
- Pasta principal do Drive: `https://drive.google.com/drive/folders/1t7U0mAzejc98pvq5foknWKIADa9YBcuj`

## Riscos, bloqueios e pendências

- **Risco operacional:** o código local e o Apps Script remoto podem divergir até a cópia manual ser concluída.
- **Risco de dados:** a qualidade de campos migrados ainda não foi conferida; sucesso técnico não equivale a dados corretos.
- **Limite conhecido:** XLS binário antigo (BIFF/OLE) não é suportado; o formato observado foi HTML/XLS ou XLSX/OOXML.
- **Pendência de arquitetura:** histórico de ausentes do lote foi decidido conceitualmente, mas não implementado.
- **Pendência de organização:** há worktree/branch de dashboard a consolidar ou eliminar; não criar novas cópias locais.
- **Bloqueio atual:** nenhum no código local; a validação final depende da instalação e de um lote real.

## Como retomar o trabalho

1. Leia este arquivo e o design de XLSX.
2. Execute `git status --short --branch` e `npm test` na raiz.
3. Compare `apps-script/02_ParserXlsx.gs` e `05_DriveRepositorio.gs` com o projeto Apps Script remoto antes de importar.
4. Consulte `IMPORTACOES` para escolher uma revisão ainda não registrada.
5. Após a importação, valide os totais e uma amostra de valores, polos e datas.
6. Atualize este pacote de contexto ao concluir a validação ou a consolidação do worktree.

## Contexto para outro chat ou IA

- **Objetivo essencial:** consolidar três relatórios TecnoFit em uma base mestre atualizável e segura para dashboard futuro.
- **Estado:** suporte local a HTML/XLS e XLSX foi implementado e testado; a instalação manual no Apps Script remoto está pendente.
- **Arquivos-chave:** `02_ParserXlsx.gs`, `05_DriveRepositorio.gs`, `07_ImportacaoService.gs`, `tests/parser.test.js`, `tests/lote.test.js` e `INSTRUCOES_INSTALACAO.md`.
- **Decisões imutáveis sem nova revisão:** snapshot atual limpo, contratos preservados por chave técnica, rollback em erro, revisão obrigatória e formato detectado pelo conteúdo.
- **Próxima ação:** instalar os dois módulos atualizados e importar o lote de 25/07 com revisão não registrada.
- **Não esquecer:** não expor dados pessoais; não apagar processados; não criar novo worktree; a branch de dashboard ainda não foi consolidada.
