# Store Assets

Esta pasta contém os assets necessários para publicação na Google Play Store.

## Estrutura Necessária

```
store-assets/
├── screenshots/
│   ├── screenshot-1.png  (1080x1920 ou 1080x2400)
│   ├── screenshot-2.png
│   ├── screenshot-3.png
│   └── ... (mínimo 2, máximo 8)
├── feature-graphic.png   (1024x500) - OBRIGATÓRIO
├── icon-512.png          (512x512)  - OBRIGATÓRIO
└── promo-video.mp4       (opcional)
```

## Dicas para Screenshots

1. **Tela inicial** - Mostrando a calculadora vazia
2. **Calculadora preenchida** - Com valores de exemplo (10 adultos, 3 crianças)
3. **Lista de compras** - Mostrando os itens calculados
4. **Compartilhamento** - Menu de compartilhar lista
5. **Tela premium** - Mostrando a opção de remover anúncios

## Criando Screenshots

### No Emulador
1. Execute o app: `npm run android`
2. Configure o emulador para resolução 1080x1920
3. Use `Ctrl + S` no emulador para capturar tela
4. Screenshots são salvos em `~/Pictures/`

### No Dispositivo Real
1. Conecte o dispositivo via USB
2. Execute: `adb exec-out screencap -p > screenshot.png`

## Feature Graphic (1024x500)

Sugestões de conteúdo:
- Logo do app em destaque
- Imagem de churrasco ao fundo
- Texto: "Calcule seu churrasco perfeito!"
- Cores do tema: #1A1A2E, #E63946, #F4A261

## Ferramentas Úteis

- [Figma](https://figma.com) - Design gratuito
- [Canva](https://canva.com) - Templates prontos
- [Screenshot.rocks](https://screenshot.rocks) - Mockups de celular
