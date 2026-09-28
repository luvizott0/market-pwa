# Market PWA - Controle de Estoque & Lista de Compras

PWA independente desenvolvido em **Vue 3 + Pinia + Vite + Tailwind CSS**, focado em gestão de despensa residencial, controle de estoque inteligente e lista de compras ágil para uso no supermercado.

Integrado à API existente (**home-manager-api**).

---

## 📱 Estrutura das Abas (Mobile & Desktop)

1. **Início (Dashboard)**:
   - **Gasto Médio Mensal com Estoque**: Estimativa mensal baseada no consumo e ciclo de duração dos itens.
   - **Próximos 5 Itens a Comprar**: Itens ordenados por nível de urgência (esgotados, estoque baixo, ciclo de duração finalizando). Ações de 1-toque para adicionar à lista de compras ou registrar reposição.
   - **Visão de Estoque**: Contadores e percentual de saúde do estoque (em estoque, baixo, esgotado, vencendo).
   - **Valor Total em Estoque**: Total acumulado em produtos.
   - **Departamentos & Categorias**: Distribuição de itens e valor por categoria (Alimentos, Limpeza, etc.).

2. **Estoque (Gestão Completa)**:
   - Busca instantânea com debounce.
   - Filtros por categoria e status (Todos, Em Estoque, Estoque Baixo, Vencendo).
   - Ordenação (Nome A-Z, Preço, Validade, Recentes).
   - Cadastro, edição e exclusão manual com confirmação.
   - Botão rápido de consumo (-1 unidade).
   - Botão de registrar reposição/compra com histórico.
   - Botão de adicionar direto à lista de compras.

3. **Mercado (Lista de Compras & Carrinho)**:
   - Pensado especificamente para o uso no smartphone dentro do supermercado.
   - Busca rápida com auto-complete no topo do catálogo de estoque ou opção de adicionar item avulso.
   - Barra de **Sugestões Inteligentes** (produtos em estoque crítico).
   - Lista dividida em **A Comprar** e **No Carrinho (Comprados)**.
   - Checkbox touch-friendly para marcar itens pegos na gôndola.
   - Ajuste rápido de quantidades (+ / -).
   - Edição rápida do preço real no local caso divirja do preço de referência.
   - Subtotal e total acumulado no carrinho em tempo real.
   - **Finalizar Compras**: Ao passar no caixa, conclui a compra com opção de atualizar automaticamente o estoque no inventário e registrar a compra na API.
   - Persistência offline local (`localStorage` + `Pinia`).

---

## 🛠️ Tecnologias

- **Vue 3** (Composition API, `<script setup>`)
- **Pinia** (Gerenciamento de estado reativo e persistência)
- **Vue Router** (Navegação SPA)
- **Tailwind CSS v4** + `@tailwindcss/vite`
- **Vite PWA** (`vite-plugin-pwa`, Service Worker com cache e manifest instalável)
- **Lucide Icons** (`lucide-vue-next`)
- **TypeScript**

---

## 🚀 Como Executar

```bash
# Entrar na pasta do projeto
cd market-pwa

# Instalar dependências (caso não tenha instalado)
npm install

# Iniciar o servidor de desenvolvimento (porta padrão: 5174)
npm run dev

# Fazer build de produção
npm run build
```
