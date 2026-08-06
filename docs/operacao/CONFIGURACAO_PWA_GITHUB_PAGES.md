# Configuração única — PWA XSTEAM

Faça esta configuração uma única vez, usando a conta proprietária da planilha.

## 1. Google Cloud e Apps Script

1. No editor Apps Script, abra **Configurações do projeto** e associe o projeto a um projeto Google Cloud padrão.
2. No Google Cloud, ative **Google Apps Script API**.
3. Em **APIs e serviços > Tela de consentimento OAuth**, selecione aplicativo externo em modo de teste e inclua suas contas Google em **Test users**.
4. Em **Credenciais**, crie um **OAuth Client ID > Aplicativo da Web**.
5. Depois de o Pages estar ativo, inclua `https://fitmanagementels.github.io` em **Authorized JavaScript origins**.
6. No Apps Script, use **Implantar > Nova implantação > API Executable** e permita suas contas autorizadas. Copie o ID da implantação.

## 2. GitHub

Em **Settings > Pages**, escolha **GitHub Actions** como fonte.

Em **Settings > Secrets and variables > Actions**, crie:

### Variables

| Nome | Valor |
| --- | --- |
| `PUBLIC_OAUTH_CLIENT_ID` | Client ID OAuth Web criado no Google Cloud. |
| `PUBLIC_APPS_SCRIPT_DEPLOYMENT_ID` | ID da implantação **API Executable**; ele é público no PWA e não é o ID da planilha nem do projeto Apps Script. |
| `PUBLIC_OAUTH_SCOPES` | `openid email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/script.container.ui` |
| `APPS_SCRIPT_AUTODEPLOY` | `true`, somente depois de criar os três secrets abaixo. Enquanto estiver ausente, o pipeline de Apps Script fica protegido e é ignorado. |

### Secrets

| Nome | Valor |
| --- | --- |
| `CLASPRC_JSON` | Conteúdo completo de `~/.clasprc.json` da conta proprietária após login no clasp. |
| `APPS_SCRIPT_ID` | ID do projeto Apps Script. |
| `APPS_SCRIPT_API_DEPLOYMENT_ID` | ID da implantação API Executable. |

Nunca coloque esses valores em arquivos do repositório, planilha, chat público ou `runtime-config.js` versionado.

Os fluxos são seguros para o primeiro envio: antes de as variáveis e secrets existirem, eles ficam **ignorados**, sem tentarem publicar uma configuração incompleta. Após salvar tudo, abra **Actions** no GitHub e execute manualmente os dois fluxos uma vez. Depois disso, cada push em `main` fará a publicação automática.

## 3. URL do PWA no menu da planilha

Após o primeiro deploy Pages, abra **Apps Script > Configurações do projeto > Propriedades do script** e crie:

| Propriedade | Valor |
| --- | --- |
| `tecnofit.dashboard.public_url` | `https://fitmanagementels.github.io/BASE_TECNOFIT_WELLNESS/` |

Salve e recarregue a planilha. O menu **TecnoFit > Abrir dashboard** abrirá a nova URL.

## 4. Validação final

1. Abra a URL em aba anônima: ela deve solicitar login Google.
2. Entre com uma conta autorizada: confira que o dashboard carrega os dados atuais.
3. Entre com uma conta não autorizada: o acesso deve ser recusado sem dados exibidos.
4. Crie/edite um Lead de teste e confirme atualização visual e persistência.
5. Instale o PWA no celular e confirme abertura sem moldura do Apps Script.
