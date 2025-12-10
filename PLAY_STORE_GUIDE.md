# 🚀 Guia de Publicação - Google Play Store

## 📋 Checklist Pré-Publicação

### 1. Configuração do Projeto EAS

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Fazer login na conta Expo
eas login

# Configurar o projeto (vincula ao Expo)
eas build:configure
```

Após rodar `eas build:configure`, atualize o `projectId` no `app.json`:
- Vá em `extra.eas.projectId` e cole o ID gerado
- Vá em `updates.url` e atualize com o ID

---

### 2. IDs de Anúncios de Produção

⚠️ **IMPORTANTE:** Antes de publicar, substitua os IDs de teste pelos IDs de produção!

No `app.json`, altere:

```json
"extra": {
  "adMobBannerUnitId": "SEU_ID_BANNER_PRODUCAO",
  "adMobInterstitialUnitId": "SEU_ID_INTERSTITIAL_PRODUCAO"
}
```

IDs atuais (TESTE - remover antes de publicar):
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Interstitial: `ca-app-pub-3940256099942544/1033173712`

Para criar IDs de produção:
1. Acesse [AdMob Console](https://apps.admob.com)
2. Adicione o app Churrascômetro
3. Crie unidades de anúncio (Banner e Interstitial)
4. Copie os IDs gerados

---

### 3. Configurar In-App Purchase na Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Vá em **Monetização > Produtos no app > Criar produto**
3. Configure:
   - **ID do produto:** `churrascometro_premium_lifetime`
   - **Nome:** Churrascômetro Premium
   - **Descrição:** Remova todos os anúncios para sempre
   - **Preço:** R$ 9,99
   - **Tipo:** Produto não consumível (one-time purchase)

---

### 4. Assets para a Play Store

#### Ícones (já configurados ✅)
- `icon.png` - 1024x1024px
- `adaptive-icon.png` - 1024x1024px (foreground)

#### Screenshots Necessários
Crie screenshots do app em funcionamento:

| Tipo | Tamanho | Quantidade |
|------|---------|------------|
| Smartphone | 1080x1920 ou 1080x2400 | 2-8 |
| Tablet 7" | 1200x1920 (opcional) | 1-8 |
| Tablet 10" | 1600x2560 (opcional) | 1-8 |

#### Feature Graphic (Obrigatório)
- Tamanho: 1024x500px
- Use para destacar o app na loja

#### Ícone Hi-res (Obrigatório)
- Tamanho: 512x512px PNG

---

### 5. Informações da Listagem

#### Título (máx 30 caracteres)
```
Churrascômetro
```

#### Descrição Curta (máx 80 caracteres)
```
Calcule a quantidade ideal de carne, bebidas e acompanhamentos para seu churrasco!
```

#### Descrição Completa (máx 4000 caracteres)
```
🔥 CHURRASCÔMETRO - A calculadora definitiva para seu churrasco!

Está organizando um churrasco e não sabe quanto comprar? O Churrascômetro resolve isso para você!

📊 FUNCIONALIDADES:

✅ Calculadora Inteligente
- Insira o número de convidados (adultos, crianças, vegetarianos)
- Escolha a duração do evento (curto ou longo)
- Receba a lista completa de compras

🥩 CARNES
- Picanha, Fraldinha, Linguiça, Coração de Frango
- Selecione apenas os cortes que você quer

🍺 BEBIDAS
- Cerveja (baseado em quem bebe)
- Refrigerante
- Água

🥗 ACOMPANHAMENTOS
- Pão de alho, Farofa, Vinagrete
- Arroz, Queijo coalho e mais!

💰 ESTIMATIVA DE CUSTOS
- Veja o preço médio de cada item
- Total estimado da compra

📤 COMPARTILHE
- Envie a lista de compras por WhatsApp, mensagem ou onde preferir

🌟 VERSÃO PREMIUM
- Remova todos os anúncios por apenas R$ 9,99 (pagamento único!)

Churrasco bom é churrasco bem planejado. Baixe agora e nunca mais erre nas quantidades!

#churrasco #calculadora #festa #carne #picanha
```

---

### 6. Política de Privacidade

⚠️ **OBRIGATÓRIO** para apps com anúncios e compras in-app!

Crie uma página com a política de privacidade. Opções:
1. GitHub Pages (gratuito)
2. Notion (gratuito)
3. Site próprio

Modelo básico de política já incluído em `PRIVACY_POLICY.md`

---

### 7. Build de Produção

```bash
# Build AAB para Play Store
eas build --platform android --profile production

# Ou APK para testes
eas build --platform android --profile preview
```

---

### 8. Submissão para Play Store

#### Opção A: Upload Manual
1. Baixe o `.aab` gerado pelo EAS
2. Acesse Google Play Console
3. Vá em **Release > Production**
4. Faça upload do AAB

#### Opção B: Submissão Automática
```bash
# Configure a service account primeiro (veja seção 9)
eas submit --platform android --profile production
```

---

### 9. Configurar Service Account (para submissão automática)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto (ou use existente)
3. Ative a **Google Play Android Developer API**
4. Crie uma **Service Account** com permissões de editor
5. Baixe o JSON da chave
6. Renomeie para `google-service-account.json` e coloque na raiz do projeto
7. ⚠️ **Adicione ao .gitignore!**

---

### 10. Categorização na Play Store

| Campo | Valor |
|-------|-------|
| Tipo de app | Aplicativo |
| Categoria | Estilo de vida OU Comida e bebida |
| Tags | churrasco, calculadora, festa, compras |
| Classificação | Livre |
| Contém anúncios | Sim |
| Compras in-app | Sim (R$ 9,99) |

---

## 📁 Estrutura de Arquivos para Play Store

```
📁 store-assets/
├── 📁 screenshots/
│   ├── screenshot-1.png (1080x1920)
│   ├── screenshot-2.png
│   └── screenshot-3.png
├── feature-graphic.png (1024x500)
├── icon-512.png (512x512)
└── promo-video.mp4 (opcional)
```

---

## ✅ Checklist Final

- [ ] `eas login` realizado
- [ ] `projectId` atualizado no `app.json`
- [ ] IDs de anúncios de PRODUÇÃO configurados
- [ ] Produto IAP criado na Play Console
- [ ] Screenshots criados
- [ ] Feature Graphic criada
- [ ] Política de Privacidade online
- [ ] Build de produção gerado (`eas build`)
- [ ] AAB enviado para Play Console
- [ ] Formulário de classificação preenchido
- [ ] Informações de contato configuradas

---

## 🆘 Solução de Problemas

### Erro: "Package name already exists"
O pacote `com.churrascometro.app` já está em uso. Altere em `app.json`:
```json
"android": {
  "package": "com.seunome.churrascometro"
}
```

### Erro: Build falha com AdMob
Verifique se o `androidAppId` está correto em `app.json` → `plugins`.

### Erro: In-App Purchase não funciona
- Certifique-se que o app foi publicado pelo menos em teste interno
- O ID do produto deve ser exatamente `churrascometro_premium_lifetime`
- Espere até 24h após criar o produto na Play Console

---

Boa sorte com a publicação! 🎉🔥
