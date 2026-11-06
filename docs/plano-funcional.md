# Plano funcional — Horta Boa

## Objectivo

Criar e manter uma loja digital de produtos hortícolas, com identidade própria e fluxos completos para cliente, operador e administração.

## Experiência e identidade

- Interface visual baseada em cores agrícolas e imagens dos produtos.
- Experiência mobile-first, adaptada também ao computador.
- Português como idioma principal e preços em meticais (MZN).

## Cliente

- Autenticação, catálogo, pesquisa e variantes de produtos.
- Carrinho, endereço de entrega, pagamento e confirmação da encomenda.
- Histórico, acompanhamento, perfil, notificações e pedidos de apoio.

## Operador

- Gestão das encomendas atribuídas, estados de entrega e disponibilidade de produtos.

## Administração

- Gestão de catálogo, preços, stock, clientes, operadores, encomendas, promoções e relatórios.

## Infra-estrutura e segurança

- Supabase e PostgreSQL para dados de utilizadores, produtos e encomendas.
- Papéis e permissões aplicados no servidor e na base de dados.
- Chaves e serviços privilegiados mantidos exclusivamente no backend.
- Integrações de pagamentos e notificações configuradas por ambiente.

## Verificação

- Testar registo, autenticação, catálogo, carrinho, encomenda e histórico.
- Validar permissões administrativas e de operador.
- Confirmar o layout em dispositivos móveis e computadores.
