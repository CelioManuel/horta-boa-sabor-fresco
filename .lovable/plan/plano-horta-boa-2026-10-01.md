# Plano — Horta Boa

## Objetivo
Criar uma réplica funcional da “SAM — A sua Loja Virtual”, adaptada para venda de produtos hortícolas, com identidade própria da **Horta Boa** e mantendo os mesmos fluxos de cliente, operador e administração.

## Experiência e identidade
- Substituir toda a marca SAM por Horta Boa.
- Criar uma identidade visual fresca e agrícola: verde-folha como cor principal, vermelho-tomate e amarelo-colheita como acentos, fundos claros e naturais.
- Criar logótipo simples da Horta Boa e imagens próprias para tomate, batata, cenoura, cebola, repolho e outros hortícolas.
- Manter a experiência otimizada para telemóvel, com adaptação cuidada para computador.
- Manter português como idioma principal e preços em MZN.

## Área do cliente
- Ecrã inicial e autenticação por email e palavra-passe.
- Catálogo com pesquisa e filtros por categoria.
- Produtos com unidade de venda, preço, disponibilidade e quantidade mínima.
- Carrinho com alteração de quantidades, remoção e resumo dos valores.
- Escolha e gestão de endereço de entrega.
- Finalização da compra com M-Pesa, e-Mola, POS ou dinheiro.
- Confirmação, histórico, detalhe e acompanhamento do estado das encomendas.
- Perfil, notificações, definições, métodos de pagamento, ajuda, termos e privacidade.

## Área do operador
- Painel de encomendas atribuídas.
- Visualização dos produtos e dados de entrega.
- Atualização das etapas: recebida, em preparação, a caminho, quase a chegar e entregue.
- Confirmação de pagamento e gestão do stock disponível do operador.

## Área administrativa
- Painel com resumo de vendas e encomendas.
- Gestão de produtos, preços, stock e imagens.
- Gestão de lojas e zonas de entrega.
- Gestão de operadores e clientes.
- Gestão e atribuição de encomendas.
- Gestão de promoções, relatórios e definições da loja.

## Dados e segurança
- Usar Lovable Cloud para contas, catálogo, carrinho/encomendas, endereços, notificações, lojas, stock e promoções.
- Separar os papéis de cliente, operador e administrador, com permissões verificadas no servidor.
- Permitir consulta pública do catálogo ativo; restringir dados pessoais e encomendas ao respetivo utilizador.
- Incluir um catálogo inicial de hortícolas para a loja abrir já com conteúdo realista.

## Verificação
- Confirmar os principais percursos: entrar, pesquisar, adicionar ao carrinho, finalizar encomenda e consultar estado.
- Confirmar as ações essenciais de operador e administrador.
- Rever a apresentação em telemóvel e computador, incluindo menus, textos e ausência de sobreposições.

## Nota técnica
A lógica funcional da SAM será recriada na arquitetura atual do projeto, sem importar a ligação de dados privada da aplicação original. Os dados da Horta Boa serão independentes e geridos no Lovable Cloud deste projeto.
