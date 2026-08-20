# Contenção dos cartões e atalho de WhatsApp nos perfis

## Objetivo

Corrigir os cartões de perfis de alunos que deixam nomes ou etiquetas de status ultrapassarem seus limites e oferecer um acesso rápido ao WhatsApp ao lado do telefone no pop-up do aluno.

## Escopo visual

- Manter a grade atual: quatro colunas em desktop, duas em telas intermediárias e uma no celular.
- Conter todo o conteúdo dentro de cada cartão, inclusive nomes e status longos.
- Preservar o nome em uma linha com reticências quando não houver espaço.
- Manter o status legível dentro do cartão, sem invadir a coluna seguinte.
- Exibir o botão do WhatsApp somente ao lado do telefone na aba **Informações** do pop-up. O botão não será repetido nos cartões da Home.

## Comportamento do WhatsApp

- O link usará `https://wa.me/<numero>` para funcionar como universal link: abre o aplicativo quando disponível e mantém fallback para o WhatsApp Web.
- O telefone será reduzido apenas a dígitos.
- Telefones brasileiros com 10 ou 11 dígitos receberão o prefixo `55`.
- Telefones com 12 ou 13 dígitos que já comecem por `55` serão preservados.
- Valores fora dessas regras não exibirão o atalho, evitando um link incorreto.
- O link abrirá em nova aba com `rel="noopener noreferrer"` e terá rótulo acessível com o nome do aluno.

## Arquitetura e fluxo

- `pwa/js/student-profiles.js` concentrará a normalização do telefone, a geração da URL e a renderização específica do contato.
- `pwa/css/student-profiles.css` receberá as regras de contenção do cartão e o alinhamento do telefone com o botão.
- O estilo visual do botão reutilizará o padrão `.whatsapp-button` já usado no módulo de Leads.
- O HTML base continuará carregando os mesmos módulos; somente a versão do cache estático em `pwa/sw.js` será incrementada para distribuir os arquivos corrigidos.
- Não haverá mudança na planilha, no contrato do Apps Script ou na persistência dos perfis.

## Tratamento de erro

- Telefone ausente ou inválido permanece visível como dado não informado ou texto original, mas sem ação de WhatsApp.
- A correção de layout não ocultará o status: nomes são truncados, enquanto a etiqueta de status permanece acessível no cartão.

## Testes e validação

- Testes unitários para telefones brasileiros formatados, já prefixados e inválidos.
- Teste estrutural para garantir as regras de contenção e a atualização do cache do PWA.
- Suíte completa do projeto após a alteração.
- Inspeção visual em desktop e celular com nomes e status longos, além do pop-up com o atalho ao lado do telefone.

## Fora de escopo

- Envio automático de mensagem ou texto pré-preenchido.
- Botão de WhatsApp diretamente nos cartões da Home.
- Alterações na planilha, no cadastro do aluno ou no número armazenado.
