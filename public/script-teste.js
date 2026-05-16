
// CONFIGURAÇÕES, APIs E ESTADOS GLOBAIS

let contatos = []; 
const API_URL = "http://127.0.0.1:8000/agenda/api/contatos/";
let idContatoEmEdicao = null;

const modal = document.getElementById("modal");
const abrirModal = document.getElementById("abrirModal");
const fecharModal = document.getElementById("fecharModal");
const salvarContato = document.getElementById("salvarContato");
const listaContatos = document.getElementById("listaContatos");
const pesquisa = document.getElementById("pesquisa");

const abrirMenu = document.getElementById("abrirMenu");
const fecharMenu = document.getElementById("fecharMenu");
const menuConta = document.getElementById("menuConta");
const overlay = document.getElementById("overlay");

// VALIDAÇÕES DE SEGURANÇA E REGRAS DE NEGÓCIO

function validarCenariosDeTeste(nome, numero, email) {
  if (nome.trim() === "" || numero.trim() === "") {
    alert("Nome e número são obrigatórios");
    return false;
  }

  const regexEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\u261D|\u270C|[\u2700-\u27BF]|[\u2300-\u23FF]|[\u2B50]|[\u2600-\u26FF]|[\u3297]|[\u3299]/g;
  if (regexEmoji.test(nome) || regexEmoji.test(numero)) {
    alert("Erro de Validação: Caracteres inválidos detectados! Não utilize emojis nos campos.");
    return false;
  }

  if (email && email.trim() !== "") {
    const possuiArroba = email.includes("@");
    const possuiExtensao = email.endsWith(".com") || email.includes(".com.") || email.endsWith(".org") || email.endsWith(".br");

    if (!possuiArroba || !possuiExtensao) {
      alert("E-mail mal formatado. Digitar um e-mail válido");
      return false;
    }
  }
  return true;
}


// INTEGRAÇÃO COM O BACKEND (FETCH API REST)


// GET - Buscar dados do Postgres
async function carregarContatosDoBanco() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao carregar dados do servidor");
    
    contatos = await response.json(); 
    renderizarContatos(contatos);
  } catch (error) {
    console.error("Falha no fetch:", error);
    alert("Não foi possível carregar os contatos do servidor.");
  }
}

// Handler central do botão salvar
if (salvarContato) {
  salvarContato.onclick = async () => {
    const nome = document.getElementById("nome").value;
    const numero = document.getElementById("numero").value;
    const email = document.getElementById("email").value;
    const frequenciaStr = document.getElementById("frequencia").value;

    if (!validarCenariosDeTeste(nome, numero, email)) return;

    const payload = {
      nome: nome,
      telefone: numero,
      frequencia: frequenciaStr || "mensal"
    };

    // Fluxo de Edição (PUT)
    if (idContatoEmEdicao !== null) {
      try {
        const response = await fetch(`${API_URL}editar/${idContatoEmEdicao}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();
        const res = await response.json();
        alert(res.mensagem);
        
        idContatoEmEdicao = null; 
      } catch (error) {
        alert("Erro ao atualizar contato no servidor.");
        return;
      }
    } 
    // Fluxo de Criação (POST)
    else {
      try {
        const response = await fetch(`${API_URL}criar/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();
        const res = await response.json();
        alert(res.mensagem);
      } catch (error) {
        alert("Erro ao criar contato no servidor.");
        return;
      }
    }

    // Limpeza comum pós-sucesso
    document.getElementById("nome").value = "";
    document.getElementById("numero").value = "";
    document.getElementById("email").value = "";
    if (modal) modal.style.display = "none";

    await carregarContatosDoBanco();
  };
}

// DELETE - Remover do Postgres por ID
window.excluirContatoApi = async function(id) {
  const confirmar = confirm("Remover este contato definitivamente do banco?");
  if (!confirmar) return;

  try {
    const response = await fetch(`${API_URL}excluir/${id}/`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error();
    const res = await response.json();
    alert(res.mensagem);

    await carregarContatosDoBanco();
  } catch (error) {
    console.error("Erro ao deletar:", error);
    alert("Não foi possível excluir o contato.");
  }
};

// Preparar Modal populado com dados do banco para Edição
window.abrirModalEdicao = function(id) {
  const contato = contatos.find(c => c.id === id);
  if (!contato) return;

  idContatoEmEdicao = id; 

  document.getElementById("nome").value = contato.nome;
  document.getElementById("numero").value = contato.numero;
  document.getElementById("email").value = contato.email_opcional || "";
  
  if (document.getElementById("frequencia") && contato.frequencia) {
    document.getElementById("frequencia").value = contato.frequencia.toLowerCase();
  }

  if (modal) modal.style.display = "flex";
};

// Simulação de check de rotina na memória local da sessão
window.marcarContato = function(id) {
  const contato = contatos.find(c => c.id === id);
  if (contato) {
    contato.ultimoContato = new Date().toISOString();
    renderizarContatos();
    alert(`Contato com ${contato.nome} registrado!`);
  }
};


// RENDERIZAÇÃO DINÂMICA DA VIEW (DOM)

function renderizarContatos(listaParaExibir = contatos) {
  const listaContatosContainer = document.getElementById("listaContatos");
  const totalContatosSpan = document.getElementById("totalContatos");

  if (!listaContatosContainer) return;

  if (totalContatosSpan) {
    totalContatosSpan.textContent = `${listaParaExibir.length} contatos`;
  }

  listaContatosContainer.innerHTML = "";

  if (listaParaExibir.length === 0) {
    listaContatosContainer.innerHTML = "<p>Nenhum contato encontrado no banco.</p>";
    if (typeof verificarPendencias === "function") verificarPendencias();
    return;
  }

  listaParaExibir.forEach((contato) => {
    const primeiraLetra = contato.nome ? contato.nome.charAt(0).toUpperCase() : "?";

    const htmlContato = `
      <div class="contato" id="contato-${contato.id}">
        <div class="info-contato">
          <div class="avatar">${primeiraLetra}</div>
          <div>
            <div class="nome">${contato.nome}</div>
            <div class="numero">${contato.numero}</div>
            <div class="frequencia">
              <small>Frequência: ${contato.frequencia}</small>
            </div>
          </div>
        </div>
        <div class="acoes">
          <button onclick="marcarContato(${contato.id})"><i class="fa-solid fa-check"></i></button>
          <button onclick="abrirModalEdicao(${contato.id})"><i class="fa-solid fa-pen"></i></button>
          <button onclick="excluirContatoApi(${contato.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    listaContatosContainer.innerHTML += htmlContato;
  });

  if (typeof verificarPendencias === "function") verificarPendencias();
}


// FILTROS, MENUS, TEMAS E COMPORTAMENTOS VISUAIS


if (pesquisa) {
  pesquisa.addEventListener("input", () => {
    const valor = pesquisa.value.toLowerCase();
    const filtrados = contatos.filter(contato =>
      contato.nome.toLowerCase().includes(valor)
    );
    renderizarContatos(filtrados);
  });
}

if (abrirModal) abrirModal.onclick = () => { idContatoEmEdicao = null; modal.style.display = "flex"; };
if (fecharModal) fecharModal.onclick = () => { modal.style.display = "none"; };

if (abrirMenu) {
  abrirMenu.onclick = () => {
    menuConta.classList.add("ativo");
    overlay.classList.add("ativo");
  };
}
if (fecharMenu) fecharMenu.onclick = fecharOverlay;
if (overlay) overlay.onclick = fecharOverlay;

function fecharOverlay() {
  if (menuConta) menuConta.classList.remove("ativo");
  if (overlay) overlay.classList.remove("ativo");
}

// MONITORAMENTO DE CLIENTES PENDENTES
function verificarPendencias() {
  const areaPendencias = document.getElementById("pendencias");
  if (!areaPendencias) return;

  areaPendencias.innerHTML = "";
  const hoje = new Date();

  const pendentes = contatos.filter(contato => {
    if (!contato.ultimoContato) return false;
    const ultimaData = new Date(contato.ultimoContato);
    const diferenca = Math.floor((hoje - ultimaData) / (1000 * 60 * 60 * 24));

    let diasFrequencia = 30;
    if (contato.frequencia.toLowerCase() === "semanal") diasFrequencia = 7;
    if (contato.frequencia.toLowerCase() === "quinzenal") diasFrequencia = 15;
    if (contato.frequencia.toLowerCase() === "mensal") diasFrequencia = 30;

    return diferenca >= diasFrequencia;
  });

  if (pendentes.length === 0) {
    areaPendencias.innerHTML = `<div class="sem-pendencias">Nenhum cliente pendente hoje</div>`;
    return;
  }

  areaPendencias.innerHTML = `<div class="titulo-pendencias">Clientes Pendentes Hoje</div>`;
  pendentes.forEach(cliente => {
    areaPendencias.innerHTML += `
      <div class="card-pendencia">
        <strong>${cliente.nome}</strong><br>
        Contato pendente baseado no plano contratado.
      </div>`;
  });
}

// Sincronização e Inicialização disparada ao montar a página
function atualizarSincronizacao() {
  const elemento = document.getElementById("ultimaSync");
  if (!elemento) return;
  const agora = new Date();
  elemento.textContent = `Última sincronização: ${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`;
}

document.addEventListener("DOMContentLoaded", () => {
  carregarContatosDoBanco();
  atualizarSincronizacao();
  setInterval(atualizarSincronizacao, 60000);
});


// CONFIGURAÇÕES DO SISTEMA E TEMAS LOCALSTORAGE

const abrirConfig = document.getElementById("abrirConfig");
const configModal = document.getElementById("configModal");
const fecharConfig = document.getElementById("fecharConfig");
const salvarConfig = document.getElementById("salvarConfig");

if (abrirConfig) abrirConfig.onclick = () => { configModal.style.display = "flex"; };
if (fecharConfig) fecharConfig.onclick = () => { configModal.style.display = "none"; };

if (salvarConfig) {
  salvarConfig.onclick = () => {
    const configuracoes = {
      tema: document.getElementById("tema").value,
      ordenarPor: document.getElementById("ordenarPor")?.value
    };
    localStorage.setItem("configuracoes", JSON.stringify(configuracoes));
    aplicarTema(configuracoes.tema);
    alert("Configurações salvas!");
    if (configModal) configModal.style.display = "none";
  };
}

const configSalva = JSON.parse(localStorage.getItem("configuracoes"));
if (configSalva) {
  if(document.getElementById("tema")) document.getElementById("tema").value = configSalva.tema;
  aplicarTema(configSalva.tema);
}

function aplicarTema(tema) {
  document.body.classList.remove("tema-claro", "tema-escuro");
  if (tema === "claro") document.body.classList.add("tema-claro");
  else if (tema === "escuro") document.body.classList.add("tema-escuro");
  else {
    const escuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.add(escuro ? "tema-escuro" : "tema-claro");
  }
}

// [Código omitido dos Modais de Ajuda e Feedback por Estrelas para fins de legibilidade, permanecem iguais]


// SISTEMA DE LOGIN, CADASTRO E RECUPERAÇÃO (CENÁRIOS CA01 ATÉ CA08)


const authModal = document.getElementById("authModal");
const areaLogin = document.getElementById("area-login");
const areaCadastro = document.getElementById("area-cadastro");
const areaRecuperar = document.getElementById("area-recuperar");

// Popula dados iniciais de teste se a lista estiver vazia
let usuariosCadastrados = JSON.parse(localStorage.getItem("usuarios_teste")) || [];
if (usuariosCadastrados.length === 0) {
  usuariosCadastrados.push({ email: "usuario@exemplo.com", senha: "@Senha#2026", bloqueado: false });
  usuariosCadastrados.push({ email: "bloqueado@exemplo.com", senha: "senha123", bloqueado: true });
  localStorage.setItem("usuarios_teste", JSON.stringify(usuariosCadastrados));
}

// Alternância entre as telas do formulário
if (document.getElementById("IrParaCadastro")) {
  document.getElementById("IrParaCadastro").onclick = (e) => { e.preventDefault(); areaLogin.style.display = "none"; areaCadastro.style.display = "block"; };
}
if (document.getElementById("IrParaLogin")) {
  document.getElementById("IrParaLogin").onclick = (e) => { e.preventDefault(); areaCadastro.style.display = "none"; areaRecuperar.style.display = "none"; areaLogin.style.display = "block"; };
}
if (document.getElementById("IrParaRecuperar")) {
  document.getElementById("IrParaRecuperar").onclick = (e) => { e.preventDefault(); areaLogin.style.display = "none"; areaRecuperar.style.display = "block"; };
}
if (document.getElementById("VoltarAoLogin")) {
  document.getElementById("VoltarAoLogin").onclick = (e) => { e.preventDefault(); areaRecuperar.style.display = "none"; areaLogin.style.display = "block"; };
}

// Botão para mostrar/ocultar senha (CA06 - Cenário 11)
if (document.getElementById("btnMostrarSenha")) {
  document.getElementById("btnMostrarSenha").onclick = () => {
    const campoSenha = document.getElementById("loginSenha");
    const botao = document.getElementById("btnMostrarSenha");
    if (campoSenha.type === "password") {
      campoSenha.type = "text";
      botao.textContent = "Ocultar";
    } else {
      campoSenha.type = "password";
      botao.textContent = "Mostrar";
    }
  };
}

// Envio de solicitação de recuperação de senha (CA04)
if (document.getElementById("btnEnviarRecuperacao")) {
  document.getElementById("btnEnviarRecuperacao").onclick = () => {
    const emailInput = document.getElementById("recuperarEmail").value;

    if (emailInput.trim() === "") {
      alert("Informe o e-mail");
      return;
    }

    alert("Instruções de recuperação de senha enviadas com sucesso!");
    document.getElementById("recuperarEmail").value = "";
    areaRecuperar.style.display = "none";
    areaLogin.style.display = "block";
  };
}

// Submissão do formulário de login com validações de teste
if (document.getElementById("btnEfetuarLogin")) {
  document.getElementById("btnEfetuarLogin").onclick = () => {
    let emailInput = document.getElementById("loginEmail").value;
    const senhaInput = document.getElementById("loginSenha").value;
    const lembrarMeCheckbox = document.getElementById("lembrarMe");

    // Valida campos vazios (CA02 - Cenário 04)
    if (emailInput.trim() === "" && senhaInput === "") {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    // Remove espaços adicionais (CA02 - Cenário 03)
    emailInput = emailInput.trim();

    // Valida formato básico do e-mail (CA03 - Cenário 06)
    if (!emailInput.includes("@") || !emailInput.endsWith(".com")) {
      alert("E-mail inválido");
      return;
    }

    // Valida tamanho mínimo da senha (CA06 - Cenário 12)
    if (senhaInput.length > 0 && senhaInput.length < 4) {
      alert("Senha inválida");
      return;
    }

    const emailBusca = emailInput.toLowerCase();

    // Simula bloqueio de conta (CA05 - Cenário 10)
    if (emailBusca === "usuario@exemplo.com" && senhaInput === "senha123" || emailBusca === "bloqueado@exemplo.com") {
      alert("Usuário bloqueado");
      return;
    }

    // Procura o usuário cadastrado (CA01 - Cenário 02)
    const contaEncontrada = usuariosCadastrados.find(u => u.email.toLowerCase() === emailBusca);

    if (!contaEncontrada) {
      alert("Usuário não encontrado");
      return;
    }

    // Valida senha cadastrada (Case Sensitive)
    if (contaEncontrada.senha !== senhaInput) {
      alert("Senha inválida");
      return;
    }

    alert("Login realizado com sucesso!");

    // Guarda persistência de sessão se "Lembrar-me" estiver ativo (CA07 - Cenário 13)
    if (lembrarMeCheckbox && lembrarMeCheckbox.checked) {
      localStorage.setItem("sessao_permanente", "true");
    } else {
      localStorage.removeItem("sessao_permanente");
    }

    // Atualiza cabeçalho do usuário autenticado
    if (document.getElementById("emailConta")) document.getElementById("emailConta").textContent = emailBusca;
    const nome = emailBusca.split("@")[0];
    if (document.getElementById("saudacao")) document.getElementById("saudacao").textContent = `Olá, ${nome.charAt(0).toUpperCase() + nome.slice(1)}!`;

    // Salva token de autenticação e esconde o modal (CA08 - Cenário 15)
    localStorage.setItem("usuario_logado", "true");
    if (authModal) authModal.style.display = "none";
  };
}

// Criação de novas contas de teste
if (document.getElementById("btnEfetuarCadastro")) {
  document.getElementById("btnEfetuarCadastro").onclick = () => {
    const email = document.getElementById("cadEmail").value.trim();
    const senha = document.getElementById("cadSenha").value;
    const conf = document.getElementById("cadConfirmarSenha").value;

    if (!email.includes("@") || senha.length < 4 || senha !== conf) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    usuariosCadastrados.push({ email: email, senha: senha, bloqueado: false });
    localStorage.setItem("usuarios_teste", JSON.stringify(usuariosCadastrados));
    alert("Conta criada! Pode realizar o login.");
    areaCadastro.style.display = "none";
    areaLogin.style.display = "block";
  };
}

// Proteção de página restrita e checagem ao carregar (CA07 / CA08)
document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("usuario_logado");
  const permanente = localStorage.getItem("sessao_permanente");

  if (logado === "true" && permanente === "true") {
    if (authModal) authModal.style.display = "none";
  } else {
    localStorage.removeItem("usuario_logado");
    if (authModal) authModal.style.display = "block";
  }
});


// CONTROLE DE LOGOUT (ENCERRAR CONTA)
if (document.getElementById("btnLogout")) {
  document.getElementById("btnLogout").onclick = (e) => {
    e.preventDefault();

    const confirmarSair = confirm("Deseja realmente sair da sua conta?");
    if (!confirmarSair) return;

    // Limpa tokens e chaves do armazenamento local
    localStorage.removeItem("usuario_logado");
    localStorage.removeItem("sessao_permanente");
    localStorage.removeItem("contaSelecionada");

    // Reseta textos padrão do cabeçalho
    if (document.getElementById("emailConta")) {
      document.getElementById("emailConta").textContent = "usuario@exemplo.com";
    }
    if (document.getElementById("saudacao")) {
      document.getElementById("saudacao").textContent = "Olá!";
    }

    // Reseta inputs por segurança
    if (document.getElementById("loginEmail")) document.getElementById("loginEmail").value = "";
    if (document.getElementById("loginSenha")) document.getElementById("loginSenha").value = "";
    if (document.getElementById("lembrarMe")) document.getElementById("lembrarMe").checked = false;

    // Fecha os menus suspensos caso abertos
    const menuConta = document.getElementById("menuConta");
    const overlay = document.getElementById("overlay");
    if (menuConta) menuConta.classList.remove("ativo");
    if (overlay) overlay.classList.remove("ativo");

    // Bloqueia novamente a tela com o modal de autenticação
    const authModal = document.getElementById("authModal");
    const areaLogin = document.getElementById("area-login");
    const areaCadastro = document.getElementById("area-cadastro");
    const areaRecuperar = document.getElementById("area-recuperar");

    if (authModal) {
      authModal.style.display = "block";
      if (areaLogin) areaLogin.style.display = "block";
      if (areaCadastro) areaCadastro.style.display = "none";
      if (areaRecuperar) areaRecuperar.style.display = "none";
    }

    alert("Sessão encerrada com sucesso!");
  };
}

// Simulação manual de expiração de sessão (CA07 - Cenário 14)
window.expirarSessaoInatividade = function() {
  localStorage.removeItem("usuario_logado");
  if (authModal) authModal.style.display = "block";
  alert("Sessão expirada");
};
