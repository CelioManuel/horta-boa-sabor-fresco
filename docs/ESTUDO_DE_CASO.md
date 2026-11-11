# Estudo de caso — Horta Boa: comércio electrónico e operações

> Projecto público de desenvolvimento de software. Este documento descreve as capacidades observáveis no repositório, não um relatório de resultados comerciais ou de testes de produção.

## Contexto
Uma loja de produtos hortícolas necessita de catálogo, encomendas, perfis de utilizador e acompanhamento operacional. O projecto Horta Boa organiza esses fluxos numa aplicação web com responsabilidades de cliente, operador e administração.

## Funcionalidades presentes
- Catálogo de produtos e variantes.
- Carrinho, checkout e histórico de encomendas.
- Gestão de perfil e autenticação.
- Gestão administrativa de produtos, encomendas e permissões.
- Área operacional e integrações configuráveis de notificações.

## Stack e arquitectura
| Camada | Tecnologia |
| --- | --- |
| UI | React, TypeScript, Tailwind CSS e Radix UI |
| Rotas e execução | TanStack Start / TanStack Router, Vite e Nitro |
| Dados | PostgreSQL, Supabase e Drizzle |
| Autenticação | Supabase Auth |
| Integrações | SMS e correio electrónico através de configuração no servidor |

As responsabilidades da interface encontram-se em `src/components/` e `src/routes/`. As integrações são organizadas em `src/integrations/` e `src/lib/`, enquanto os esquemas e alterações de base de dados estão documentados nas migrações.

## Aspectos técnicos que vale a pena discutir numa entrevista
1. **Separação de perfis:** as permissões não devem depender apenas dos componentes visíveis na interface.
2. **Modelação de dados:** catálogo, variantes, utilizadores e encomendas exigem relações e evolução de esquema.
3. **Gestão de encomendas:** o fluxo de checkout deve distinguir validações no cliente de validações no servidor.
4. **Integrações:** mensagens e tarefas agendadas requerem configuração, tratamento de erros e protecção de credenciais.
5. **Portabilidade:** compilação e execução devem ser verificadas no ambiente de destino.

## Estado e limites
A existência de código e testes no repositório não constitui prova de que a compilação e a integração de pagamentos/notificações foram executadas com sucesso neste ambiente. Não se apresentam números de vendas, clientes ou desempenho sem fontes verificáveis.

## Explorar
- [Código fonte](../)
- [README técnico](../README.md)
- [Migrações da base de dados](../drizzle/migrations/)
- [Testes disponíveis](../tests/)

_Estudo de caso preparado para apresentação profissional do projecto._
