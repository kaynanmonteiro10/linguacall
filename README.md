# 🌐 LinguaCall Pro - Chamadas Globais com Tradução ao Vivo

> Um projeto criado com o propósito de aproximar o mundo, derrubar barreiras linguísticas e conectar pessoas através da tecnologia.

---

## 👨‍💻 Sobre o Criador

**Criado e idealizado por Kaynan Monteiro.**

- **Idade:** 21 anos
- **Nacionalidade:** Brasileiro 🇧🇷
- **Perfil:** Estudante, profissional e entusiasta apaixonado por tecnologia e inteligência artificial.
- **Dedicação:** Projeto desenvolvido com dedicação contínua ao longo de quase 6 meses de trabalho, pesquisa e engenharia de software.

### 💖 A Mensagem do Criador

> *"Criei isso com o intuito de ajudar as pessoas a se comunicarem de uma forma melhor, respeitando todas as regras e políticas. Tem como intuito ajudar os amigos que não falam o mesmo idioma, os amores que as pessoas encontram por meio do meio digital e qualquer pessoa que queira se conectar com o mundo.*
>
> *Agradeço a todos e obrigado por usar o LinguaCall!"*
> 
> — **Kaynan Monteiro**

---

## 📜 Licença e Termos de Uso (Open Source Não Comercial)

Este é um projeto **Open Source** criado para o bem comum e para a comunidade:

- ✅ **Melhorias e Estudos Permitidos:** Você é livre para estudar o código, aprender, contribuir com melhorias, enviar correções e adaptar para uso pessoal ou educacional.
- 🚫 **Proibida a Comercialização:** Fica estritamente proibida qualquer comercialização, venda, monetização direta ou indireta, ou apropriação indevida do projeto e de seu nome sem autorização expressa do criador.
- ⚖️ **Atribuição Obrigatória:** Todo e qualquer uso ou bifurcação (fork) deve obrigatoriamente manter os créditos originais para **Kaynan Monteiro**.

---

## 📱 Suporte a PWA (Progressive Web App)

O **LinguaCall Pro** agora é um **Progressive Web App (PWA)** completo:
- Você pode **instalá-lo como um aplicativo nativo** diretamente no celular (Android via Chrome ou iOS via Safari no botão "Adicionar à Tela de Início") e no computador (Chrome/Edge no botão "Instalar").
- Funciona em tela cheia sem a barra de navegação do browser.
- Conta com Service Worker (`sw.js`) e Manifesto PWA (`manifest.json`).

---

## 🛠️ Arquitetura e Tecnologias

- **WebRTC P2P (PeerJS):** Comunicação direta quando possível, com relay TURN da Metered como reserva para redes que não permitem a conexão direta.
- **Web Speech API:** Transcrição de fala em tempo real pelo próprio navegador, sem chave de API.
- **Transcrição no Android:** O áudio da chamada também alimenta um modelo Whisper pequeno no próprio aparelho, evitando a disputa pelo microfone entre WebRTC e Web Speech. No primeiro uso, o navegador baixa o modelo (cerca de 40 MB) e pode levar algum tempo para prepará-lo. O app mostra esse estado na barra de escuta. O modelo é carregado do Hugging Face e a biblioteca de transcrição do jsDelivr; depois do carregamento, o áudio da transcrição fica no aparelho. Em celulares lentos, as legendas podem chegar com atraso.
- **Tradução Gratuita:** Google Translate como motor principal e MyMemory como reserva, ambos sem chave.
- **Tradução no Destinatário:** Cada participante traduz as falas recebidas para o idioma em que escolheu ler.
- **Armazenamento Local:** Histórico, notas e configurações ficam no navegador do usuário (`localStorage`).
- **Tailwind CSS & Lucide Icons:** Interface responsiva moderna com suporte mobile-first e desktop.
- **Janela Flutuante (Picture-in-Picture):** Acompanhe o vídeo em segundo plano enquanto navega em outras tarefas.
- **Luz Virtual Facial (Ring Light):** Borda suave na tela para iluminar o rosto em chamadas noturnas.
- **Áudio Sintetizado Nativo:** Leitura das traduções com fila de voz, além das notificações via Web Audio API.
- **Atalhos Rápidos de Teclado:** Teclas M (Microfone), V (Câmera), P (PiP), F (Tela Cheia) e D (Diagnóstico).

## Como usar

1. Abra o aplicativo em **HTTPS** e permita o microfone e a câmera.
2. Escolha o idioma em que você **fala** e o idioma em que quer **ler**.
3. Toque em **Criar Nova Sala** e envie o link para uma pessoa.
4. A outra pessoa abre o link e toca em **Entrar na Sala**.
5. Ative o alto-falante se quiser ouvir a tradução. As legendas aparecem mesmo com a voz desativada.

O LinguaCall é para chamadas **1:1**. Para melhor compatibilidade, use Chrome ou Edge atualizados no Android ou no computador. No iPhone/Safari, o reconhecimento de fala depende do suporte e das permissões do navegador; se ele falhar, use o chat ou o modo de voz direta.

## Limitações e privacidade

- A conexão usa STUN e os servidores TURN da Metered. O navegador busca as credenciais da credencial específica do projeto antes de entrar na chamada. Se o serviço TURN estiver indisponível, o app ainda tenta a conexão direta; redes restritivas podem continuar sem conectar. O uso de TURN depende da disponibilidade e da franquia do provedor.
- Como este site é estático e público, a chave de API de leitura da credencial TURN fica visível no código do navegador. Ela deve ter acesso somente a essa credencial; nunca coloque a Secret key da conta no repositório. Acompanhe o consumo no painel da Metered.
- O reconhecimento de fala depende do suporte e da conexão do navegador.
- O texto reconhecido é enviado ao Google Translate e, em caso de falha, ao MyMemory. Esses serviços recebem o texto da conversa.
- Áudio e vídeo seguem pela conexão WebRTC; a sinalização do PeerJS é usada para estabelecer a chamada.
- Se ambos os serviços de tradução falharem ou limitarem consultas, o aplicativo mostra o erro e mantém o texto original, sem apresentar isso como uma tradução válida.
- Uma chamada não pode ser restaurada depois que os dois aparelhos saem. A reconexão automática atua enquanto a sala continua aberta.
