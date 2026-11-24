# 🌐 LinguaCall - Chamadas de Vídeo & Voz com Tradução ao Vivo

Aplicação web completa para chamadas internacionais de **vídeo e voz com legendas traduzidas em tempo real**, reconhecimento de voz contínuo, compartilhamento de tela e histórico gravado.

Desenvolvida com arquitetura **100% Client-Side WebRTC**, pronta para rodar gratuitamente no **GitHub Pages** sem precisar de servidores próprios.

---

## ✨ O que foi implementado e aprimorado:

1. 📹 **Câmera e Vídeo em Tempo Real:** Agora você pode ver a pessoa durante a conversa! Se preferir, pode desligar a câmera com um clique e usar apenas a voz.
2. 🖥️ **Compartilhamento de Tela (Screen Share):** Botão para transmitir slides, códigos ou documentos para o colega de outro país enquanto conversam.
3. 🎙️ **Reconhecimento de Voz Contínuo:** Web Speech API nativa que não desliga sozinha após pausas e escuta cada frase com clareza.
4. 🌍 **Tradução Automática Instantânea:** O texto original falado é transmitido pelo DataChannel e traduzido instantaneamente para a língua que você escolheu.
5. 🔠 **Ajuste de Tamanho de Legenda (A- / A+):** Controle no topo da tela para aumentar ou diminuir a fonte das legendas.
6. 🔊 **Voz Sintetizada (Text-to-Speech):** Opção de ouvir a tradução falada no seu fone/alto-falante.
7. 🛡️ **Conectividade Global (STUN Servers):** Configuração de múltiplos servidores STUN do Google e Twilio para garantir que as conexões atravessem firewalls e roteadores de diferentes países.

---

## ❓ "A pessoa vai conseguir entrar mesmo pelo GitHub Pages?"

**SIM, com certeza!** E aqui está o porquê:
- O **GitHub Pages fornece HTTPS gratuito por padrão**. Navegadores modernos (Chrome, Edge, Safari, Firefox) **só liberam acesso à Câmera e Microfone em sites com HTTPS**. Portanto, o GitHub Pages é o ambiente ideal.
- A sinalização de salas é feita pela nuvem pública e gratuita do **PeerJS**. Isso significa que quando você cria uma sala no Brasil e seu colega abre o link nos EUA, Europa ou Ásia, os dois navegadores se encontram pela internet e estabelecem a chamada direta de vídeo e voz.

---

## 🚀 Como subir para o GitHub e ativar o GitHub Pages (Passo a Passo)

### 1. Criar o repositório no GitHub
1. Acesse [github.com](https://github.com) e crie um repositório público (ex: `linguacall`).

### 2. Enviar os arquivos pelo Terminal (Git)
Execute no seu terminal dentro da pasta do projeto:

```bash
cd C:\Users\Administrativo\.gemini\antigravity\scratch\live-translator-call
git init
git add .
git commit -m "LinguaCall com Video e Traducao ao Vivo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/linguacall.git
git push -u origin main
```
*(Lembre-se de substituir `SEU-USUARIO` pelo seu usuário do GitHub).*

> Se preferir não usar o terminal, abra o repositório no navegador e clique em **"Add file" -> "Upload files"** e arraste os arquivos `index.html`, `style.css`, `app.js` e `README.md`.

### 3. Ligar o GitHub Pages
1. No seu repositório no GitHub, clique na aba **Settings** (Configurações).
2. No menu lateral, clique em **Pages**.
3. Em **Source**, selecione **Deploy from a branch**.
4. Em **Branch**, selecione `main` e `/ (root)`. Clique em **Save**.
5. Em cerca de 1 minuto, seu link estará ativo: `https://SEU-USUARIO.github.io/linguacall/`.
