# Horta Boa — Sabor Fresco

Plataforma de comércio electrónico de produtos hortícolas para Maputo, Moçambique. A aplicação permite consultar o catálogo, criar encomendas, gerir contas e acompanhar entregas, com áreas dedicadas a clientes, operadores e administração.

## Funcionalidades

- Catálogo de frutas, legumes e outros produtos hortícolas, incluindo variantes por tamanho.
- Carrinho, dados de entrega, finalização e histórico de encomendas.
- Autenticação de clientes, gestão de perfil e pedidos de eliminação de conta.
- Gestão de produtos, utilizadores, permissões e encomendas pela administração.
- Área de operador para o acompanhamento das entregas.
- Integrações de notificações por SMS e correio electrónico configuráveis no servidor.

## Tecnologias

- React 19 e TypeScript.
- TanStack Start / TanStack Router e Vite 8.
- Tailwind CSS 4 e Radix UI.
- Nitro para execução do servidor.
- Supabase Auth, PostgreSQL e Drizzle para dados e autenticação.
- Integrações de notificações no backend.

## Desenvolvimento local

Requer Node.js compatível com Vite 8, ou Bun. Instale as dependências e inicie o servidor:

```sh
git clone https://github.com/CelioManuel/horta-boa-sabor-fresco.git
cd horta-boa-sabor-fresco
bun install
bun run dev
```

Como alternativa, pode usar `npm install` e `npm run dev`. Antes de iniciar, configure as variáveis de ambiente no seu computador ou no ambiente de alojamento. Use `.env.example` como referência.

## Compilação e execução

```sh
bun run build
bun run start
```

Para executar os testes existentes:

```sh
bun test
```

A aplicação inclui funções de servidor; publicar apenas ficheiros estáticos não disponibiliza as funcionalidades administrativas e de autenticação do backend.

## Configuração do backend

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`: acesso público do navegador ao projecto Supabase.
- `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`: acesso do backend ao mesmo projecto.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privilegiada, **apenas no servidor**.
- `DATABASE_URL`: ligação PostgreSQL utilizada pelo Drizzle para migrações.
- `HORTA_BOA_CRON_SECRET` e, opcionalmente, `HORTA_BOA_CRON_SECRET_PREVIOUS`: autenticação de tarefas agendadas.
- `TURBOHOST_SMS_TOKEN`, `SMS_SENDER` e definições `SMTP_*`: envio de notificações quando activado.

Nunca exponha chaves administrativas no navegador, em variáveis `VITE_*` ou no repositório. Configure-as no alojamento.

## Base de dados e servidor próprio

Antes de publicar funcionalidades administrativas, aplique as migrações necessárias de `drizzle/migrations/` ao PostgreSQL do servidor, por ordem. Confirme especialmente a migração `0004_admin_profile_roles.sql` para gestão de perfis, bem como as migrações posteriores.

Em instalações anteriormente configuradas, actualize as variáveis de ambiente de tarefas agendadas e migrações para os nomes documentados acima. A base de dados e os serviços de produção não são alterados por mudanças neste repositório.

## Estrutura

- `src/routes/`: rotas TanStack.
- `src/components/`: interfaces da loja e painéis.
- `src/integrations/supabase/`: autenticação e comunicação com a base de dados.
- `src/lib/`: regras de negócio e integrações.
- `drizzle/migrations/` e `supabase/migrations/`: evolução do esquema.
- `tests/`: testes automatizados.
- `docs/`: documentação funcional.

## Identidade

Horta Boa — Sabor Fresco. Projecto destinado à comercialização e entrega de produtos hortícolas em Moçambique.


## Portefólio técnico

Leia o [estudo de caso do projecto](docs/ESTUDO_DE_CASO.md) para conhecer a arquitectura, as funcionalidades, as decisões técnicas e os aspectos ainda por validar.
