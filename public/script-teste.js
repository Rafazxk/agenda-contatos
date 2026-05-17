// ============================================================================
// CONFIGURAÇÕES, API E ESTADOS GLOBAIS
// ============================================================================

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

const authModal = document.getElementById("authModal");
const areaLogin = document.getElementById("area-login");
const areaCadastro = document.getElementById("area-cadastro");
const areaRecuperar = document.getElementById("area-recuperar");


// ============================================================================
// VALIDAÇÕES DE SEGURANÇA E REGRAS DE NEGÓCIO (FRONT-END)
// ============================================================================

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


// ============================================================================
// INTEGRAÇÃO COM O BACKEND (CRUD PROTEGIDO POR JWT)
// ============================================================================

// Função auxiliar para injetar o token JWT nas requisições do CRUD
function obterHeadersAutenticados() {
  const token = localStorage.getItem("token_jwt");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : ""
  };
}

// GET - Buscar dados protegidos do banco
async function carregarContatosDoBanco() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: obterHeadersAutenticados()
    });

    if (response.status === 401) {
      alert("Sessão expirada ou inválida. Por favor, faça login novamente.");
      window.expirarSessaoInatividade();
      return;
    }

    if (!response.ok) throw new Error("Erro ao carregar dados do servidor");
    
    contatos = await response.json(); 
    renderizarContatos(contatos);
  } catch (error) {
    console.error("Falha no fetch:", error);
    alert("Não foi possível carregar os contatos do servidor.");
  }
}

// Handler central do botão salvar (POST e PUT)
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
          headers: obterHeadersAutenticados(),
          body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (!response.ok) {
          alert(res.erro || (res.erros ? Object.values(res.erros)[0] : "Erro ao atualizar contato."));
          return;
        }

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
          headers: obterHeadersAutenticados(),
          body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (!response.ok) {
          alert(res.erro || (res.erros ? Object.values(res.erros)[0] : "Erro ao criar contato."));
          return;
        }

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

// DELETE - Remover por ID definitivamente do banco
window.excluirContatoApi = async function(id) {
  const confirmar = confirm("Remover este contato definitivamente do banco?");
  if (!confirmar) return;

  try {
    const response = await fetch(`${API_URL}excluir/${id}/`, {
      method: "DELETE",
      headers: obterHeadersAutenticados()
    });

    const res = await response.json();

    if (!response.ok) {
      alert(res.erro || "Não foi possível excluir o contato.");
      return;
    }

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

// Sincronização manual local da data do último contato feito
window.marcarContato = function(id) {
  const contato = contatos.find(c => c.id === id);
  if (contato) {
    contato.ultimoContato = new Date().toISOString();
    renderizarContatos();
    alert(`Contato com ${contato.nome} registrado!`);
  }
};


// ============================================================================
// RENDERIZAÇÃO DINÂMICA DA VIEW (DOM)
// ============================================================================

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


// ============================================================================
// FILTROS, MENUS, TEMAS E COMPORTAMENTOS VISUAIS
// ============================================================================

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

// Sincronização do cabeçalho
function atualizarSincronizacao() {
  const elemento = document.getElementById("ultimaSync");
  if (!elemento) return;
  const agora = new Date();
  elemento.textContent = `Última sincronização: ${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`;
}

// Controle de Configurações e Temas
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


// ============================================================================
// SISTEMA DE LOGIN, CADASTRO E AUTENTICAÇÃO (SISTEMA INTEGRADO DJANGO)
// ============================================================================

// Alternância de telas nos formulários de autenticação
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

// Mostrar/ocultar senha
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

// Simulação de solicitação de recuperação de senha
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

// Submissão do Login integrado ao Django Rest / JWT Custom
if (document.getElementById("btnEfetuarLogin")) {
  document.getElementById("btnEfetuarLogin").onclick = async () => { 
    let emailInput = document.getElementById("loginEmail").value;
    const senhaInput = document.getElementById("loginSenha").value;
    const lembrarMeCheckbox = document.getElementById("lembrarMe");

    if (emailInput.trim() === "" && senhaInput === "") {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    emailInput = emailInput.trim();

    if (!emailInput.includes("@") || !emailInput.endsWith(".com")) {
      alert("E-mail inválido");
      return;
    }

    const usernameInput = emailInput.split("@")[0];

    try {
      const response = await fetch("http://127.0.0.1:8000/agenda/api/usuario/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput, 
          password: senhaInput
        })
      });

      const dados = await response.json();

      if (!response.ok) {
        alert(dados.erro || "Falha ao realizar login.");
        return;
      }

      alert("Login realizado com sucesso!");

      // Armazenamento estável das chaves JWT obtidas
      localStorage.setItem("token_jwt", dados.token);
      localStorage.setItem("usuario_logado", "true");

      if (lembrarMeCheckbox && lembrarMeCheckbox.checked) {
        localStorage.setItem("sessao_permanente", "true");
      } else {
        localStorage.removeItem("sessao_permanente");
      }

      if (document.getElementById("emailConta")) document.getElementById("emailConta").textContent = emailInput.toLowerCase();
      if (document.getElementById("saudacao")) {
        document.getElementById("saudacao").textContent = `Olá, ${usernameInput.charAt(0).toUpperCase() + usernameInput.slice(1)}!`;
      }

      if (authModal) authModal.style.display = "none";
      
      // Carrega os dados reais do CRUD após autenticação completa
      await carregarContatosDoBanco();

    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Não foi possível conectar ao servidor.");
    }
  };
}

// Criação de novas contas integrada ao Django
if (document.getElementById("btnEfetuarCadastro")) {
  document.getElementById("btnEfetuarCadastro").onclick = async () => { 
    const email = document.getElementById("cadEmail").value.trim();
    const senha = document.getElementById("cadSenha").value;
    const conf = document.getElementById("cadConfirmarSenha").value;

    if (!email.includes("@") || senha.length < 4 || senha !== conf) {
      alert("Preencha todos os campos obrigatórios corretamente e verifique as senhas.");
      return;
    }

    const usernameInput = email.split("@")[0];

    try {
      const response = await fetch("http://127.0.0.1:8000/agenda/api/usuario/registrar/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          email: email,
          password: senha
        })
      });

      const dados = await response.json();

      if (!response.ok) {
        if (dados.erros) {
          const primeiroErro = Object.values(dados.erros)[0];
          alert(primeiroErro);
        } else {
          alert(dados.erro || "Erro ao realizar cadastro.");
        }
        return;
      }

      alert("Conta criada com sucesso! Pode realizar o login.");
      
      document.getElementById("cadEmail").value = "";
      document.getElementById("cadSenha").value = "";
      document.getElementById("cadConfirmarSenha").value = "";

      areaCadastro.style.display = "none";
      areaLogin.style.display = "block";

    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Não foi possível conectar ao servidor.");
    }
  };
}

// Proteção de página restrita e checagem ao carregar o DOM
document.addEventListener("DOMContentLoaded", () => {
  const logado = localStorage.getItem("usuario_logado");
  const permanente = localStorage.getItem("sessao_permanente");

  if (logado === "true" && permanente === "true") {
    if (authModal) authModal.style.display = "none";
    carregarContatosDoBanco();
  } else {
    localStorage.removeItem("usuario_logado");
    localStorage.removeItem("token_jwt");
    if (authModal) authModal.style.display = "block";
  }

  atualizarSincronizacao();
  setInterval(atualizarSincronizacao, 60000);
});

// CONTROLE DE LOGOUT (ENCERRAR CONTA E LIMPAR TOKENS)
if (document.getElementById("btnLogout")) {
  document.getElementById("btnLogout").onclick = (e) => {
    e.preventDefault();

    const confirmarSair = confirm("Deseja realmente sair da sua conta?");
    if (!confirmarSair) return;

    localStorage.removeItem("usuario_logado");
    localStorage.removeItem("sessao_permanente");
    localStorage.removeItem("contaSelecionada");
    localStorage.removeItem("token_jwt"); // Limpeza total da credencial do token

    if (document.getElementById("emailConta")) document.getElementById("emailConta").textContent = "usuario@exemplo.com";
    if (document.getElementById("saudacao")) document.getElementById("saudacao").textContent = "Olá!";

    if (document.getElementById("loginEmail")) document.getElementById("loginEmail").value = "";
    if (document.getElementById("loginSenha")) document.getElementById("loginSenha").value = "";
    if (document.getElementById("lembrarMe")) document.getElementById("lembrarMe").checked = false;

    fecharOverlay();

    if (authModal) {
      authModal.style.display = "block";
      if (areaLogin) areaLogin.style.display = "block";
      if (areaCadastro) areaCadastro.style.display = "none";
      if (areaRecuperar) areaRecuperar.style.display = "none";
    }

    alert("Sessão encerrada com sucesso!");
  };
}

// Forçar expiração por inatividade
window.expirarSessaoInatividade = function() {
  localStorage.removeItem("usuario_logado");
  localStorage.removeItem("token_jwt");
  if (authModal) authModal.style.display = "block";
  alert("Sessão expirada");
};