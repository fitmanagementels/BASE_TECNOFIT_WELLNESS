# Contexto do Projeto — Base Central TecnoFit

Última atualização: **27/07/2026 — America/Fortaleza (UTC−03:00)**

> Memória portátil canônica. Atualizar este arquivo e `CONTEXTO_DO_PROJETO.html` após cada grande marco.

## Resumo executivo

- A planilha mestre consolida os relatórios `vencimentos`, `fichas` e `avaliacao_fisica` em um snapshot semanal seguro.
- O importador Apps Script preserva `BASE_ALUNOS`, `CONTRATOS` e `VISAO_MESTRE` em erro; `IMPORTACOES` é auditoria append-only.
- O leitor local aceita HTML/XLS legado e XLSX/OOXML detectado pelo conteúdo. A validação remota do ajuste de descompactação XLSX ainda é pendente.
- O dashboard XSTEAM foi implementado localmente como web app: Home, Financeiro, Acompanhamento e Configurações; layout desktop/mobile, cache local e fila de gravação.
- O código oficial agora está em `main`. Há um worktree antigo de referência, já incorporado, que deve ser removido após conferir o Git.
- A suíte local completa passa com `npm test`.

## Objetivo do projeto

- Manter uma base semanal de clientes atualizável, auditável e segura.
- Exibir decisões operacionais sem editar o snapshot: planos, vencimentos, prescrições e avaliações.
- Permitir configurações globais e perfil de pagamento por ID sem contaminar a base vigente.
- Usuários: administrador envia os três arquivos; operador atualiza a base e usa o dashboard.

## Estado atual

- **Etapa:** implementação local do MVP do dashboard concluída; falta instalação/validação manual no Apps Script e publicação do repositório remoto.
- **Base:** última importação remota confirmada pelo usuário foi `2026-07-25 r02`; a qualidade dos campos ainda requer auditoria por amostra.
- **XLSX:** o ajuste local `1589231` normaliza o blob como ZIP antes de `Utilities.unzip`; testar remoto usando revisão superior à que já falhou.
- **Dashboard:** há menu `TecnoFit > Abrir dashboard`, bootstrap versionado sem dados de contato e três novas abas persistentes.
- **Git:** `main` contém os commits do dashboard; nenhum remoto GitHub está configurado localmente até o momento desta atualização.

## Histórico relevante

| Data/commit | Mudança | Impacto |
|---|---|---|
| 10–11/07/2026 | Backend inicial e primeiros lotes | Importação manual, auditoria e rollback passaram a operar |
| `1589231` | Normalização de blob XLSX | Contorna falha de unzip do blob vindo do Drive; ainda requer teste remoto |
| `dc7e4be` | Baseline do dashboard consolidado na `main` | Uma única linha de código passa a concentrar dashboard e importador |
| `31f5542` | Configuração persistente e versão | Cria abas de configuração e invalida cache após sucesso da importação |
| `645651a` | Métricas operacionais | Limites por dia, contratos múltiplos e recortes de vencimento |
| `04e98d6` | Bootstrap versionado | Web app recebe apenas dados necessários, sem contato |
| `58f4afe` | Mutações seguras | Lock, idempotência e upsert de pagamento por ID |
| `bcb3af6` | Interface XSTEAM responsiva | Sidebar desktop, dock mobile, cache local e splash |

## Decisões tomadas

- Snapshot atual é substituído somente após validação completa; histórico de ausentes do lote é uma futura camada separada.
- Um aluno pode ter vários contratos; KPIs separam pessoas de contratos e detalhes agrupam por ID.
- Filtros globais padrão: **Ativo** e **Wellness**.
- Navegação principal: Home, Financeiro, Acompanhamento e Configurações. Financeiro contém Planos/Vencimentos; Acompanhamento contém Prescrições/Avaliações.
- Não usar a palavra “atraso” no dashboard de vencimentos. Mostrar últimos cinco dias, hoje e próximos cinco dias.
- A idade usa a data atual de abertura: prescrição `≤90`, `91–180`, `181–270`, `>270`; avaliação `≤90`, `91–120`, `121–180`, `181–270`, `>270`.
- Ausência de ficha/avaliação é prioridade máxima e não uma idade calculada.
- Valor por aula: `valor mensal ÷ (frequência semanal × 4,33)`.
- Dados enviados ao navegador não incluem contato.
- Configurações são globais e persistem em abas próprias; o cliente usa cache local e revalida somente a versão.

## Persistência do dashboard

| Aba | Uso | Regra |
|---|---|---|
| `CONFIG_DASHBOARD` | filtros padrão e cartões da Home | Somente o app grava; importação nunca limpa |
| `CONFIG_ALERTAS` | cortes numéricos | Valores positivos e estritamente crescentes |
| `GESTAO_PAGAMENTOS` | perfil/observação por ID | Upsert por ID; sobrevive se o aluno sumir do lote |

Perfis iniciais: Sem histórico; Bom pagador; Pagamento eventual fora do prazo; Pagamento frequentemente fora do prazo; Cobrança recorrente necessária; Em acompanhamento.

## Etapa atual e arquivos ativos

| Caminho | Função |
|---|---|
| `apps-script/00_Config.gs` | IDs, abas, cabeçalhos e versão persistente |
| `apps-script/04_PlanilhaRepositorio.gs` | cria abas do snapshot e configuração sem apagar valores persistentes |
| `apps-script/07_ImportacaoService.gs` | importação, rollback e incremento da versão após sucesso |
| `apps-script/09_DashboardMetricas.gs` | datas, faixas e valor por aula |
| `apps-script/10_DashboardPaginas.gs` | datasets de planos, vencimentos, acompanhamento e Home |
| `apps-script/11_DashboardRepositorio.gs` | leitura segura e remoção de contato do payload |
| `apps-script/12_DashboardApi.gs` | `obterBootstrapDashboard()` e `obterVersaoDashboard()` |
| `apps-script/14_DashboardMutacoes.gs` | `salvarMutacoesDashboard()` com LockService e idempotência |
| `apps-script/Dashboard*.html` | web app responsivo XSTEAM |
| `docs/superpowers/specs/2026-07-27-dashboard-xsteam-design.md` | especificação aprovada |
| `docs/superpowers/plans/2026-07-27-dashboard-xsteam.md` | plano de implementação |

## Próximos passos

1. No editor Apps Script, copiar os arquivos atualizados de `apps-script/` (incluindo `13_DashboardConfiguracao.gs` e `14_DashboardMutacoes.gs`) e salvar.
2. Recarregar a planilha, abrir o painel/importação para criar as três abas persistentes e conferir seus cabeçalhos.
3. Publicar uma nova implantação do Web App como o usuário autorizado; abrir por `TecnoFit > Abrir dashboard`.
4. Validar no navegador: filtros padrão, múltiplos contratos, recortes de vencimento, prioridades de ficha/avaliação, modal e gravação de perfil de pagamento.
5. Usar uma revisão superior para revalidar XLSX real no fluxo de importação e conferir uma amostra de valores, polos e datas.
6. Configurar um remoto GitHub e enviar `main` para continuar em outra máquina.
7. Remover o worktree antigo após confirmar que `main` é a única cópia oficial.

## Riscos, bloqueios e pendências

- A instalação e implantação remotas do dashboard ainda não foram validadas manualmente.
- A planilha precisa receber todos os arquivos novos do Apps Script; colar parcialmente pode causar funções ausentes.
- O primeiro MVP de Configurações já salva alertas e pagamentos. A edição visual dos cartões da Home ficou como próxima melhoria do app, embora o backend a suporte.
- Não há histórico de alunos ausentes do lote nem tempo de empresa; ambos são pós-MVP.
- O repositório local não possui `origin`; é necessário o URL do repositório GitHub ou autorização para criar um.
- Não incluir dados pessoais em testes, documentação ou cache local.

## Como retomar em outra sessão

1. Leia este arquivo e a especificação em `docs/superpowers/specs/2026-07-27-dashboard-xsteam-design.md`.
2. Execute `git status --short --branch` e `npm test`.
3. Confira a implantação Apps Script e os três nomes de abas persistentes.
4. Continue pelos próximos passos acima; não crie novo worktree.

## Contexto para outro chat/IA

O projeto TecnoFit mantém um snapshot semanal de três relatórios e um web app Apps Script XSTEAM. A branch oficial é `main`; o importador preserva a última base válida em qualquer erro. O dashboard usa `obterBootstrapDashboard()` sem contato, cache local versionado e `salvarMutacoesDashboard()` com fila cliente, LockService e idempotência. A navegação é Home/Financeiro/Acompanhamento/Configurações, com subabas Planos/Vencimentos e Prescrições/Avaliações. Filtros padrão são Ativo/Wellness; contratos múltiplos são agrupados por ID em detalhes. Falta copiar/deployar todos os arquivos no Apps Script, validar manualmente o Web App, configurar/push para GitHub e remover o worktree já consolidado. Não criar cópias paralelas ou expor dados pessoais.
