# Horta Boa: Sabor Fresco

Quero que cries uma réplica da app, sam a sua loja virtual mas vai ser uma loja para venda de produtos horticolas como: Tomate, batata, cenoura, cebola, repolho e etc.
Vai chamar-se Horta Boa, vais mudar as cores para cores que combinam com horticolas e vais usar completamente a mesma lógica que "Sam a sua loja virtual".

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/259c133b-6c6d-4c3a-826d-030fefd4fab5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Atualizar o servidor próprio

As novas funções de gestão de utilizadores precisam de executar também no servidor da loja, não apenas servir ficheiros estáticos.

1. Atualize o código da loja e aplique `drizzle/migrations/0004_admin_profile_roles.sql` na base de dados do servidor antes de usar a gestão de perfis.
2. Configure no processo da loja `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY` com os valores do backend próprio. A chave privilegiada fica exclusivamente no servidor: nunca num nome `VITE_*`, no GitHub ou no navegador. Os valores `VITE_SUPABASE_*` continuam a apontar para a API acessível pelos computadores de teste.
3. Mantenha o envio de email de confirmação configurado. Contas criadas pela administração ficam por confirmar; falhas de email não eliminam a conta criada.

A aplicação em desenvolvimento na Lovable e o servidor próprio têm bases de dados independentes; atualizar aqui não atualiza automaticamente o servidor próprio.
