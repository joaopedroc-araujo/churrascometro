## Visão Geral da Arquitetura

- **Framework:** Expo SDK 54 com React Native 0.81 e Expo Router.
- **Roteamento:** Roteamento baseado em arquivos em `app/` usando `expo-router`. O layout raiz é `app/_layout.tsx`, com abas em `app/(tabs)/` (`index.tsx`, `explore.tsx`).
- **UI & Temas:** `styled-components` para estilização (`components/ui/layout.tsx`). Utilitários de tema em `constants/theme.ts` e `hooks/use-theme-color.ts`. Hooks de esquema de cores em `hooks/use-color-scheme.ts` e `*.web.ts`.
- **Anúncios:** Integração com Google Mobile Ads:
  - Plugin de configuração `plugins/with-google-mobile-ads.js` injeta `APPLICATION_ID` do Android e `GADApplicationIdentifier` do iOS durante o prebuild.
  - Componente de banner em `components/ads/banner.tsx` resolve o ID do anúncio de `Constants.expoConfig?.extra.adMobBannerUnitId` com fallbacks para IDs de teste por plataforma.
- **Componentes:** Componentes de UI compartilhados em `components/` (ex: `external-link.tsx`, `parallax-scroll-view.tsx`, `themed-*`).
- **Android Nativo:** Projeto Android mínimo em `android/` gerado por `expo prebuild`. Evite editar diretamente, a menos que necessário para configuração nativa.

## Configuração

- **Configuração do Expo:** `app.json` é a fonte da verdade. Campos principais:
  - `plugins`: inclui `expo-router`, `expo-splash-screen` e `./plugins/with-google-mobile-ads`.
  - `extra.adMobBannerUnitId`: usado pelo componente `AdBanner`.
  - Ícone do Android e configurações de UI configuradas em `expo.android`.
- **Plugin do Google Mobile Ads:** Em `plugins/with-google-mobile-ads.js` use `application['meta-data']` ao editar meta-data do AndroidManifest. NÃO use `application.metaData`.

## Fluxos de Trabalho do Desenvolvedor

- **Iniciar:** `npm start` (Metro + servidor Dev) ou específico por plataforma:
  - `npm run android`
  - `npm run ios`
  - `npm run web`
- **Prebuild:** Quando alterações nativas são necessárias (plugins ou AndroidManifest):
  - `npx expo prebuild` (use `--clean` para regenerar projetos nativos)
- **Lint:** `npm run lint` (usa `eslint-config-expo`). Regra `import/no-named-as-default` está desabilitada devido ao import default do `styled-components`.
- **Doctor:** `npx expo-doctor` para validar configuração e alinhamento do SDK.

## Padrões & Convenções

- **Roteamento:** Mantenha telas em `app/` e grupos como `(tabs)` para layouts aninhados. Atualize `app/_layout.tsx` para providers globais (tema, status bar).
- **Estilos:** Prefira `styled-components`; mantenha estilos colocalizados com componentes. Evite adicionar estilos globais.
- **TypeScript:** Use `T[]` ao invés de `Array<T>`. Aproveite `styled.d.ts` para tipagem de tema; o arquivo intencionalmente usa uma interface vazia para aumentar o tema.
- **Anúncios:** Leia IDs de anúncios de `expoConfig.extra`. Para produção, substitua IDs de teste do Google em `app.json` por IDs reais. Use `BannerAdSize.ANCHORED_ADAPTIVE_BANNER` para banners.
- **Configuração Nativa:** Qualquer alteração no manifest deve ser feita via plugins de configuração (`plugins/`), não edições manuais em `android/`.

## Pontos de Integração

- **Google Mobile Ads:** Requer `androidAppId`, `iosAppId` válidos na configuração do plugin em `app.json` e um `adMobBannerUnitId` em `extra`.
- **Haptics & Gestos:** `expo-haptics`, `react-native-gesture-handler` e `react-native-reanimated` estão instalados; certifique-se de que as telas usem containers de gestos apropriados quando necessário.

## Armadilhas Comuns

- Dispositivo/emulador Android ausente: `npm run android` requer um emulador ou dispositivo com depuração USB.
- Projetos nativos desatualizados: após alterações em plugins execute `npx expo prebuild --clean`.
- Edições incorretas do AndroidManifest: sempre use `application['meta-data']` em plugins de configuração.
- Avisos de lint do styled-components: tratados pela configuração do ESLint; não reabilite `import/no-named-as-default`.

## Fluxo da Calculadora de Churrasco (`app/(tabs)/index.tsx`)

Esta é a funcionalidade principal do app—uma calculadora inteligente que estima ingredientes para um churrasco brasileiro baseado nos perfis dos convidados.

### Modelo de Dados

- **Estado de entrada:** `meatAdults`, `vegetarianAdults`, `children`, `beerDrinkers`, `duration` (evento curto/longo).
- **Definições de itens:** Arrays de objetos `ItemDefinition` (`MEAT_ITEMS`, `VEGETARIAN_ITEMS`, `SIDE_ITEMS`, `DRINK_ITEMS`, `EXTRAS`) cada um especificando quantidades `perAdult` e opcional `perChild` mais um `QuantityFormat` (`g`, `kg`, `unit`, `l`, `can`, `bag`).
- **Multiplicador de duração:** `DURATIONS.short.multiplier = 1`, `DURATIONS.long.multiplier = 1.3` para eventos mais longos.

### Lógica de Cálculo (`calculateQuantities`)

1. Calcule `totalAdults = meatAdults + vegetarianAdults` e `totalParticipants`.
2. Para cada categoria de item, itere as definições e calcule:
   - `quantity = (perAdult * relevantAdults + perChild * children) * multiplier`
3. Itens vegetarianos contam apenas `vegetarianAdults`; cerveja conta apenas `beerDrinkers`.
4. Extras (carvão, sal) usam fórmulas personalizadas baseadas em carnívoros e crianças.
5. Retorna `CalculationResult` com `sections[]`, `totals` e contagem de participantes.

### Componentes de UI

- **Counter:** Stepper reutilizável para entradas numéricas com restrições de min/max.
- **DurationOption:** Alternância entre durações de evento curto e longo.
- **SummaryGrid:** Estatísticas rápidas (convidados, carne total, cerveja, carvão).
- **Result Cards:** Renderiza os itens de cada seção com `formatQuantity` para exibição amigável (converte automaticamente gramas para kg quando ≥1000 g).

### Convenções Principais

```typescript
const colors = {
  primary: "#E63946", // Vermelho churrasco
  secondary: "#F4A261", // Laranja/dourado
  background: "#1A1A2E", // Fundo escuro
  surface: "#16213E", // Cards
  text: "#EAEAEA", // Texto principal
  textSecondary: "#A0A0A0", // Texto secundário
  success: "#4CAF50", // Verde
  warning: "#FF9800", // Amarelo
};
```

- Todas as quantidades são calculadas via `useMemo` para evitar recálculos desnecessários.
- `beerDrinkers` é limitado a `totalAdults` via `useEffect`.
- Use `roundUp` e `Math.ceil` para sempre arredondar quantidades para cima (nunca compre menos).
- `formatQuantity` lida com formas plurais e conversões de unidade.

### Estendendo a Calculadora

- Para adicionar um novo ingrediente: adicione ao array `*_ITEMS` relevante com `key`, `label`, `perAdult`, opcional `perChild` e `format`.
- Para adicionar uma nova seção: crie um novo array, inclua em `calculateQuantities` e adicione a `sections`.

## Exemplos

- **Uso do Ad Banner:** Veja `components/ads/banner.tsx` para resolver IDs e renderizar `BannerAd`.
- **Layout de abas:** Veja `app/(tabs)/_layout.tsx` e `app/_layout.tsx` para configuração do router e efeitos globais.
- **Fluxo da calculadora:** Veja `app/(tabs)/index.tsx` para estado de entrada, lógica de cálculo e renderização de resultados.

## Checklist de Validação (antes do PR)

- Execute `npm run lint` e corrija problemas de TypeScript/ESLint.
- Execute `npx expo-doctor` para confirmar alinhamento do SDK.
- Se anúncios foram alterados, confirme IDs em `app.json` e teste banners no dispositivo.
- Se plugin de configuração foi alterado, execute `npx expo prebuild --clean` e reconstrua o Android.

Se alguma seção estiver confusa ou faltando detalhes, comente com o caminho ou cenário e eu refinarei estas instruções.
