# Contexto do Projeto — Base Central TecnoFit / XSTEAM

Última atualização: **06/08/2026 — America/Fortaleza (UTC−03:00)**

> Memória portátil canônica. Este arquivo e `CONTEXTO_DO_PROJETO.html` devem ser atualizados juntos ao final de cada marco relevante.

## Resumo executivo

- O projeto é uma base semanal segura do TecnoFit e um PWA operacional XSTEAM. O Google Apps Script agora é somente backend e importador; a interface vive em `pwa/` e será publicada no GitHub Pages.
- O dashboard possui Home, Financeiro, Acompanhamento, Fluxo e Configurações, com cache local versionado e fila de gravações idempotente. A versão também assina o conteúdo das abas manuais de Fluxo, evitando dados antigos após edições na planilha.
- A nova página **Fluxo** está implementada localmente com as subabas **Leads** e **Churns**; seus dados são manuais e persistem fora do snapshot semanal.
- `FLUXO_LEADS` permite acompanhar captação e conversão; `FLUXO_CHURNS` registra saídas manuais, incluindo os profissionais responsáveis pelo aluno e pelas últimas aulas.
- Churns agora têm análise MoM, WoW das últimas 26 semanas, diagnósticos, gráficos clicáveis e lista em pop-up.
- A lista e os formulários de Fluxo receberam o primeiro refinamento de UX: ações semânticas, datas nativas, rodapé de salvamento e responsividade.
- A migração local para GitHub Pages está pronta: login Google, chamada autenticada à Apps Script Execution API, manifesto instalável, service worker e automações GitHub Actions. A suíte passou com **141 testes**.

## Objetivo do projeto

- Manter uma base semanal de clientes atualizável, auditável e preservada em caso de falha de importação.
- Oferecer no dashboard decisões operacionais de planos, vencimentos, prescrições, avaliações, leads e churns.
- Registrar Fluxo manualmente sem contaminar nem depender do snapshot de alunos e contratos.
- Usuários: administrador da planilha para importação/configuração e equipe operacional autenticada para uso diário do Web App.

## Estado atual

| Item | Situação observada |
|---|---|
| Etapa | Migração do PWA para GitHub Pages implementada localmente. |
| Onde o trabalho parou | Código unificado em `pwa/`; falta configurar OAuth/Actions e publicar. |
| Próxima ação prática | Configurar Google Cloud e variáveis/secrets do GitHub conforme `docs/operacao/CONFIGURACAO_PWA_GITHUB_PAGES.md`; depois executar os dois workflows. |
| Dados de churn | Todos os registros manuais de `FLUXO_CHURNS` aparecem no dashboard. |
| Filtros globais | Ocultos em Fluxo; Leads e Churns mostram todos os registros de suas abas. |
| Git | Branch atual `main`; há alterações locais não commitadas e arquivos novos. Preserve-as. |
| Validação remota | Pendente: primeiro login Google, acesso API Executable, leitura/escrita de Fluxo e instalação no celular. |

## Histórico relevante

| Data/commit | Mudança | Impacto |
|---|---|---|
| 10–11/07/2026 | Importador inicial e lotes | Importação, auditoria e rollback passaram a operar. |
| `1589231` | Normalização de blob XLSX | Ajuste local para descompactar XLSX; ainda requer teste remoto com export real. |
| `dc7e4be` a `cea6411` | Dashboard XSTEAM e sistema visual | Navegação, cache, fila de mutações, logo SVG e responsividade. |
| `ee9af42` a `bbabd28` | Recortes financeiros | Matriculados, frequência, hora-aula e quartis mensais clicáveis. |
| `8032018` e alterações locais de 29/07 | Fluxo de Leads e Churns | Abas persistentes, operações manuais, IDs e testes adicionados. |
| 29/07/2026 | Tratamento de cancelados | Churn recebeu telefone, frequência e polo; foi criada cópia local tratada do export sem criar importador. |
| 29/07/2026 | Análise temporal de churn | MoM, WoW, diagnósticos e pop-ups por período; gráficos tiveram altura fixa para evitar crescimento infinito. |
| 29/07/2026 | UX de Fluxo e pop-ups | Lista de churn e modais ganharam hierarquia, ações de risco e campos de data nativos. |
| 30/07/2026 | Profissionais de Churn | Contrato/polo removidos; entraram profissional responsável e último personal, com listas controladas. |
| 06/08/2026 | Migração PWA | Frontend removido do Apps Script e centralizado em `pwa/`; backend recebe fachada allowlist `executarApiDashboard`; Pages e Apps Script passam a ter deploys separados. |

## Decisões tomadas e justificativas

| Decisão | Por que | Impacto / como retomar |
|---|---|---|
| Fluxo é uma base manual separada | Facilita auditoria e não altera o snapshot semanal. | `FLUXO_LEADS` e `FLUXO_CHURNS` não são limpas pela importação. |
| Lead não pode ser apagado; Churn pode | Preserva histórico comercial; churn inserido por engano precisa ser removível. | Backend recusa exclusão de Lead e pede confirmação para excluir Churn. |
| `aluno_id` de Churn é referência manual à `VISAO_MESTRE` | Prepara sincronização futura sem bloquear a operação atual. | Não validar divergências por enquanto; o ID interno é `churn_id` na coluna A. |
| IDs internos podem ser criados na planilha | Há lançamentos manuais fora do PWA. | Menu **TecnoFit > Preencher IDs pendentes de Fluxo** preenche somente a coluna A de linhas com conteúdo. |
| Leads: `primeiro_contato` é a data em que apareceu | É a data manual obrigatória de entrada no funil. | `entrada_como_cliente` é opcional e representa quando se tornou pagante; status continua manual. |
| Status de Lead é manual | Não inferir conversão ou estágio a partir de datas nesta fase. | Inclui `Esfriando` entre Em contato e Experimental agendado. |
| Indicação e origem são texto livre | A equipe precisa registrar variações sem restringir o cadastro. | Sem menu fechado para esses campos. |
| Filtros globais ficam fora de Fluxo | Leads e Churns são bases manuais completas nesta etapa. | Cliente oculta o bloco; backend não filtra Churn por polo. |
| Não usar início de plano para tempo de empresa | A fonte atual representa o plano mensal vigente, não a entrada do aluno. | Sem coortes, permanência ou taxa de churn com denominador histórico por enquanto. |
| MoM é histórico completo; WoW é últimas 26 semanas | Mantém leitura estratégica mensal e leitura operacional semanal. | Barras e pontos são clicáveis e abrem a lista do respectivo período. |
| Export de cancelados fica fora do backend | O usuário não quer importador do arquivo exportado. | `scripts/preparar-cancelados.js` gera cópia local; plano e polo não entram mais em `FLUXO_CHURNS`. |
| Telefone é exceção deliberada de privacidade | É necessário para link de WhatsApp em Leads e auditoria de Churn. | Não colocar dados reais em testes, documentação ou fixtures. |
| GitHub Pages + Execution API | Remove a moldura do Apps Script, permite instalação PWA e mantém dados no Google. | Login OAuth usa apenas contas autorizadas; todos os autorizados têm a mesma visão nesta fase. |
| Uma única interface | Não manter cópias de HTML dentro do Apps Script. | `pwa/index.html`, `pwa/css/dashboard.css` e `pwa/js/dashboard.js` são a fonte da interface. |

## Fluxo: estrutura de dados atual

### `FLUXO_LEADS`

| Campo | Regra atual |
|---|---|
| `lead_id` | UUID interno, coluna A, imutável. |
| `nome`, `telefone`, `primeiro_contato`, `status` | Obrigatórios. `primeiro_contato` é a data de surgimento do lead. |
| `origem`, `indicacao`, `experimental`, `professor_experimental` | Opcionais; origem e indicação são texto livre. |
| `entrada_como_cliente` | Opcional; data em que virou cliente pagante. Não altera status. |
| `plano_contratado` | Opcional: Pacote 5x, Pacote 10x ou 1x/sem a 6x/sem. |
| `valor_pacote` | Opcional, número livre não negativo. |
| `minirrelatorio_venda` | Opcional; dores, objeções e pontos para trabalhar na venda. |
| `criado_em`, `atualizado_em` | Gerados/atualizados pelo sistema. |

Status aceitos: `Novo`, `Em contato`, `Esfriando`, `Experimental agendado`, `Experimental realizado`, `Convertido`, `Perdido`.

### `FLUXO_CHURNS`

| Campo | Regra atual |
|---|---|
| `churn_id` | UUID interno, coluna A; pode ser preenchido pelo PWA ou pelo menu da planilha. |
| `aluno_id` | Referência manual à `VISAO_MESTRE`, preservada como informada. |
| `nome`, `telefone`, `data_saida` | Dados manuais; data de saída é obrigatória. |
| `profissional_responsavel` | Opcional: Elohim, Xico, Cadu, Ruan ou Iranildo. |
| `ultimo_personal` | Opcional: responsáveis ou Wallyson, Genuca, Yasmin, Wanderson Fabrício, Leonardo, Jackson, Vitória, Maria, Clara, Thomas, Max, Sávio, Cristian e Rafael. |
| `motivo_saida`, `sinais_contexto`, `acao_retencao` | Três campos opcionais de auditoria/observações. |
| `criado_em`, `atualizado_em` | Gerados/atualizados pelo sistema. |

O dashboard exibe todos os Churns registrados manualmente; não há coluna nem filtro de polo.

## Análises e UX de Churn implementadas

- Cartões: saídas registradas, churns com motivo e churns com ação de retenção.
- **MoM:** barras mensais para todo o histórico por padrão, com mês inicial/final; meses sem saída aparecem como zero e o tooltip mostra variação quando aplicável.
- **WoW:** linha das últimas 26 semanas por padrão, com marcadores discretos clicáveis e filtros por início/fim; semanas sem saída aparecem como zero.
- Diagnósticos: motivos registrados, profissional responsável (inclui `Não informado`) e cobertura de ação de retenção.
- Clique em cartão, barra ou ponto abre um pop-up apenas com os churns do recorte.
- Gráficos usam contêiner com altura fixa (`320px` em desktop e `260px` em telas menores) e são destruídos antes de nova renderização para evitar o ciclo de expansão vertical visto no navegador.
- A lista do pop-up ordena por data real de saída, mostra detalhes somente quando preenchidos e separa **Editar** de **Apagar**; apagar mantém confirmação explícita.
- Modais de Lead/Churn usam campos de data nativos e convertem para `dd/MM/yyyy` no envio, preservando a validação do backend.

## Informações importantes capturadas do chat

- O usuário quer evoluir muito a análise e apresentação geral do dashboard, mas decidiu abrir primeiro a etapa Fluxo.
- A página Fluxo é simultaneamente área de preenchimento e apresentação de dados; não é um substituto da base mestre.
- A página Configurações ainda tem checkboxes nativos e organização visual ruim nos prints recebidos. Esse é o próximo bloco recomendado de polimento, depois da validação de Fluxo.
- A Home também apresentou espaço vazio/estrutura pouco resolvida em captura anterior. Deve entrar em uma etapa posterior de layout geral, não junto de mudanças de regras.
- Não criar automação de sincronização, validação visual de `aluno_id`, coortes de churn ou cálculo de tempo de empresa até existir fonte histórica confiável.

## Etapa atual em desenvolvimento

**Em curso:** publicação segura da migração para GitHub Pages, seguida de validação manual do PWA e do Fluxo.

**Pronto localmente:** schema, criação de abas, IDs pendentes, mutações, leitura segura, filtros, análises, gráficos, pop-ups, UX de modais, teste estático de HTML e documentação de instalação.

**Correção de cache (31/07):** o bootstrap passou a incluir uma assinatura hash das abas `FLUXO_LEADS` e `FLUXO_CHURNS`. Inclusões e edições manuais nessas abas agora geram uma nova versão do cache sem expor conteúdo ou dados pessoais na chave. A interface publicada precisa ser a versão atual de `DashboardClient.html`; a interface anterior espera o formato analítico antigo e pode exibir a lista antiga com erro genérico nos gráficos.

**Pronto localmente:** PWA estático com marca XSTEAM, login Google, cache local por conta, fila otimista de mutações, manifesto/service worker; API interna `executarApiDashboard`; `doGet` não serve mais a interface. Os antigos arquivos `Dashboard*.html` e `XsteamLogo.html` foram removidos do Apps Script.

**Ainda falta:** criar a implantação API Executable e OAuth no mesmo projeto Google Cloud, cadastrar contas autorizadas, guardar variables/secrets no GitHub, publicar os dois workflows e validar no navegador com dados reais autorizados.

## Próximos passos — ordem recomendada

1. Siga integralmente [`docs/operacao/CONFIGURACAO_PWA_GITHUB_PAGES.md`](docs/operacao/CONFIGURACAO_PWA_GITHUB_PAGES.md): vincule Apps Script a Cloud padrão, habilite Apps Script API, crie OAuth Web e uma implantação **API Executable**.
2. No GitHub, ative Pages por GitHub Actions, cadastre as três variables públicas e os três secrets. Deixe `APPS_SCRIPT_AUTODEPLOY=true` somente após cadastrar os secrets.
3. Execute os workflows **Deploy PWA** e **Deploy Apps Script** uma vez; configure `tecnofit.dashboard.public_url` na Propriedade de script com a URL do Pages.
4. **Validar Fluxo:** criar/editar um Lead e um Churn fictícios; testar login de conta autorizada, recusa de conta não autorizada, datas, status `Esfriando`, WhatsApp, edição e confirmação de exclusão de Churn.
5. **Validar análise:** conferir que Churns mostra todos os registros manuais, que MoM abre o mês clicado, WoW abre a semana clicada, e que a página não cresce verticalmente após renderizações/filtros repetidos.
6. **Validar lançamentos manuais:** inserir uma linha manual em cada aba sem ID, acionar **TecnoFit > Preencher IDs pendentes de Fluxo** e confirmar que só a coluna A foi preenchida; `aluno_id` de Churn não deve mudar.
7. **Próximo desenvolvimento:** iniciar uma etapa separada para Configurações (checkboxes, agrupamento e responsividade) e depois revisar o esqueleto/Home do PWA. Usar `html-ui-ux-reviewer` e `brainstorming` antes de implementar.
8. **Pós-UX:** validar importação XLSX real com revisão superior à falha anterior e configurar/push do remoto GitHub quando houver autorização/URL.

## Arquivos e pastas importantes

| Caminho | Função | Observação |
|---|---|---|
| `apps-script/00_Config.gs` | Nomes das abas, cabeçalhos e configurações | Inclui schemas de Fluxo. |
| `apps-script/04_PlanilhaRepositorio.gs` | Criação/migração segura de abas | Preserva dados manuais. |
| `apps-script/08_Main.gs` | Menu da planilha | Contém preenchimento de IDs pendentes. |
| `apps-script/12_DashboardApi.gs` | Bootstrap e API de análise de churn | Expõe `obterAnaliseChurnsDashboard`. |
| `apps-script/14_DashboardMutacoes.gs` | Escritas seguras | Lock, idempotência, CRUD de Fluxo e exclusão só de Churn. |
| `apps-script/15_DashboardFluxo.gs` | Leitura, profissionais e séries de Fluxo | Concentra métricas de Lead e Churn. |
| `apps-script/16_DashboardExecutionApi.gs` | Fachada da API | Permite apenas bootstrap, versão, mutações e análise de churn via Execution API. |
| `pwa/index.html` | Shell da interface | Login, navegação, modal, logo e carregamento de módulos. |
| `pwa/js/dashboard.js` | Interface e renderização | Gráficos Chart.js, pop-ups, formulários, cache e fila otimista. |
| `pwa/js/api.js` | Cliente autenticado | Obtém token Google e chama o deployment API Executable. |
| `pwa/css/dashboard.css` | Design do PWA | Tema premium XSTEAM, responsividade e acessibilidade. |
| `.github/workflows/` | Publicação automática | Pages e Apps Script têm pipelines separados e protegidos por configuração. |
| `docs/operacao/CONFIGURACAO_PWA_GITHUB_PAGES.md` | Manual de publicação | Fonte de verdade para OAuth, Actions e URL do PWA. |
| `apps-script/INSTRUCOES_INSTALACAO.md` | Aplicação no Apps Script | Seção 15 documenta Fluxo e publicação. |
| `scripts/preparar-cancelados.js` | Trata export legado de cancelados | Não conecta nem importa dados no backend. |
| `cancelados-geral-tratado.xls` | Cópia local tratada do export | Não versionar nem expor; contém dados operacionais. |
| `tests/dashboard-fluxo.test.js` | Testes de backend de Fluxo | Sem dados pessoais reais. |
| `tests/dashboard-html.test.js` | Testes estáticos da interface | Protege Fluxo, gráficos e UX essencial. |
| `docs/superpowers/specs/2026-07-29-*.md` | Decisões aprovadas de Fluxo | Fonte histórica de requisitos. |

## Riscos, bloqueios e pendências

- **Pendente de configuração externa:** sem OAuth Web, uma implantação API Executable e variables/secrets do GitHub, o PWA não pode ser publicado nem testado com dados reais.
- **Pendente de validação visual:** apesar dos testes passarem, é necessário abrir o Pages publicado, autorizar uma conta e confirmar operações reais.
- **Dados de churn:** `aluno_id` não é validado contra `VISAO_MESTRE`; divergência é considerada erro operacional, mas ainda não há alerta no app.
- **Métricas indisponíveis por decisão:** tempo de empresa, coortes e taxa de churn exigem uma data histórica confiável de entrada/denominador ativo.
- **Privacidade:** telefones devem permanecer restritos ao uso autorizado em Fluxo; não copiar dados reais para documentação, testes, commits ou cache fora do app.
- **Git:** há alterações de diferentes marcos no diretório compartilhado. Não usar reset, checkout destrutivo ou exclusão ampla.
- **A confirmar:** configuração de `origin`/GitHub e resultado do teste remoto do ajuste XLSX.

## Como retomar o trabalho em outra sessão

1. Leia este arquivo e `CONTEXTO_DO_PROJETO.html`.
2. Execute `git status --short --branch` para reconhecer alterações locais já existentes; preserve arquivos não relacionados.
3. Execute `npm test` antes de editar código.
4. Para Fluxo, leia primeiro `apps-script/15_DashboardFluxo.gs`, `14_DashboardMutacoes.gs`, `pwa/js/dashboard.js`, `pwa/css/dashboard.css` e `docs/operacao/CONFIGURACAO_PWA_GITHUB_PAGES.md`.
5. Confirme se a publicação/validação dos passos 1–6 acima já ocorreu. Se não, priorize essa validação antes de novo desenvolvimento.
6. Para novo polimento visual, use primeiro `brainstorming` e `html-ui-ux-reviewer`; mantenha Configurações/Home em uma etapa própria.

## Contexto para outro chat ou IA

O projeto é uma base semanal TecnoFit com PWA XSTEAM, hospedado no GitHub Pages e apoiado pelo Apps Script. A fonte única da interface é `pwa/`; não recriar HTML de dashboard no Apps Script. O backend expõe somente `executarApiDashboard`, executado por OAuth/Apps Script API. Fluxo usa `FLUXO_LEADS` e `FLUXO_CHURNS`, ambos manuais e independentes do snapshot. Leads exigem nome, telefone, primeiro contato e status; status é manual e inclui `Esfriando`. Churns podem ser apagados, Leads não; `aluno_id` é referência manual de `VISAO_MESTRE`, enquanto a coluna A é o UUID interno. Churn tem MoM histórico, WoW de 26 semanas, diagnósticos e pop-ups clicáveis; não usar início de plano como tempo de empresa. A fila faz atualização otimista e o cache é separado por conta Google. Antes de publicar, leia o manual operacional, configure OAuth/Execution API e os secrets do GitHub. Não expor dados pessoais nem versionar o export de cancelados.
