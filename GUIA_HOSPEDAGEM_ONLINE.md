# Comercial Bragantino V4 — Hospedagem Online

## Arquivos
Esta versão está preparada para um serviço Node.js online.

## Opção recomendada: Render + GitHub

1. Crie um repositório no GitHub.
2. Envie TODOS os arquivos desta pasta para o repositório.
3. No Render, crie um Web Service conectado ao repositório.
4. O Render pode usar o `render.yaml` incluído.
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Health Check: `/health`
8. Depois da publicação, abra a URL HTTPS no celular.
9. No Android/Chrome, escolha "Adicionar à tela inicial" ou "Instalar aplicativo" quando disponível.

## Importante sobre dados
A versão atual ainda usa o armazenamento de dados implementado no projeto. Para uso comercial real com vários celulares/usuários e persistência confiável, o próximo passo recomendado é migrar os dados para PostgreSQL/Supabase e colocar autenticação segura no servidor.

## Não publique
Não coloque senhas, tokens, chaves privadas ou arquivos `.env` no GitHub.

## Teste local
No computador:
npm install
npm start

Depois abra:
http://localhost:3000
