# Store Assets - Screenshots

Screenshots para publicação na Google Play Store.

## Estrutura

```
screenshots/
├── phone/      (1080x1920 ou 1080x2400)
├── tablet-7/   (1200x1920)
└── tablet-10/  (1600x2560)
```

## Requisitos da Play Store

- **Mínimo:** 2 screenshots por tipo de dispositivo
- **Máximo:** 8 screenshots por tipo de dispositivo
- **Formatos:** PNG ou JPEG

## Sugestões de Telas

1. Calculadora com valores preenchidos
2. Resultado do cálculo (lista de itens)
3. Checklist de compras
4. Configurações/Perfis
5. Tela Premium

## Capturando Screenshots

### Emulador
```bash
# Pressione Ctrl+S no emulador
# Salvo em ~/Pictures/
```

### Dispositivo Real
```bash
adb exec-out screencap -p > screenshot.png
```
