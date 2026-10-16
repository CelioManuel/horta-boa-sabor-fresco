import { Mail, MessageCircle, Phone } from "lucide-react";
import { Page, PageTitle } from "@/components/ui-bits";

const faq: Array<[string, string]> = [
  ["Como faço uma encomenda?", "Escolha os produtos no catálogo, abra o carrinho, escolha o endereço e o método de pagamento e toque em “Finalizar encomenda”."],
  ["Quais são as formas de pagamento?", "M-Pesa, e-Mola, POS na entrega ou dinheiro. O operador confirma o pagamento quando o recebe."],
  ["Quanto custa a entrega?", "A entrega é gratuita, sem taxa adicional."],
  ["Como acompanho a minha encomenda?", "Em “Encomendas” vê cada etapa: recebida, em preparação, a caminho, quase a chegar e entregue. Também recebe notificações."],
  ["Posso usar um código promocional?", "Sim. Escreva o código no carrinho e toque em “Aplicar”."],
  ["E se um produto chegar em mau estado?", "Contacte-nos no próprio dia e fazemos a substituição."],
];

export function HelpPage() {
  return <Page>
    <PageTitle back="/conta" title="Ajuda" subtitle="Respostas rápidas e contactos da Horta Boa." />
    <div className="grid gap-3 sm:grid-cols-3">
      <a href="https://wa.me/258840000000" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary"><MessageCircle className="text-primary" /><span><strong className="block text-sm">WhatsApp</strong><small className="text-muted-foreground">+258 84 000 0000</small></span></a>
      <a href="tel:+258840000000" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary"><Phone className="text-primary" /><span><strong className="block text-sm">Telefone</strong><small className="text-muted-foreground">+258 84 000 0000</small></span></a>
      <a href="mailto:apoio@hortaboa.co.mz" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary"><Mail className="text-primary" /><span><strong className="block text-sm">Email</strong><small className="text-muted-foreground">apoio@hortaboa.co.mz</small></span></a>
    </div>
    <h2 className="mt-8 font-display text-2xl">Perguntas frequentes</h2>
    <div className="mt-3 space-y-2">{faq.map(([q, a]) => <details key={q} className="rounded-lg border border-border bg-card p-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm leading-6 text-muted-foreground">{a}</p></details>)}</div>
  </Page>;
}

function Legal({ title, sections }: { title: string; sections: Array<[string, string]> }) {
  return <Page><PageTitle back="/conta" title={title} subtitle="Última atualização: outubro de 2026" /><div className="space-y-6">{sections.map(([h, t]) => <section key={h}><h2 className="font-display text-xl">{h}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{t}</p></section>)}</div></Page>;
}

export function TermsPage() {
  return <Legal title="Termos e condições" sections={[
    ["1. Objeto", "Estes termos regulam a compra de produtos hortícolas e outros artigos através da loja online Horta Boa."],
    ["2. Conta", "Para encomendar precisa de uma conta com dados verdadeiros. É responsável por manter a sua palavra-passe segura."],
    ["3. Preços e pagamento", "Os preços estão em meticais (MZN) e incluem as embalagens indicadas. O pagamento pode ser feito por M-Pesa, e-Mola, POS ou dinheiro."],
    ["4. Entregas", "Entregamos gratuitamente na zona de cobertura da loja."],
    ["5. Produtos frescos", "Por serem produtos frescos, o peso e o tamanho podem variar ligeiramente. Se algo chegar em mau estado, fazemos a substituição."],
    ["6. Cancelamentos", "Pode pedir o cancelamento enquanto a encomenda não estiver a caminho, contactando o apoio ao cliente."],
  ]} />;
}

export function PrivacyPage() {
  return <Legal title="Política de privacidade" sections={[
    ["Dados que recolhemos", "Nome, email, telefone, NUIT (opcional), endereços de entrega e histórico de encomendas."],
    ["Para que usamos", "Para processar e entregar encomendas, confirmar pagamentos e enviar notificações sobre o estado das suas compras."],
    ["Partilha", "Só partilhamos o endereço e os artigos da encomenda com o operador responsável pela entrega. Não vendemos os seus dados."],
    ["Os seus direitos", "Pode consultar e corrigir os seus dados no perfil, ou pedir a eliminação da conta através do apoio ao cliente."],
    ["Segurança", "Os dados ficam guardados em servidores protegidos e cada pessoa só tem acesso à informação de que precisa."],
  ]} />;
}
