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

let contatos =
  JSON.parse(localStorage.getItem("contatos")) || [];

// MODAL

abrirModal.onclick = () => {
  modal.style.display = "flex";
};

fecharModal.onclick = () => {
  modal.style.display = "none";
};

// MENU CONTA

abrirMenu.onclick = () => {
  menuConta.classList.add("ativo");
  overlay.classList.add("ativo");
};

fecharMenu.onclick = fecharOverlay;
overlay.onclick = fecharOverlay;

function fecharOverlay() {
  menuConta.classList.remove("ativo");
  overlay.classList.remove("ativo");
}

// SALVAR

salvarContato.onclick = async () => {
  const nome = document.getElementById("nome").value;
  const numero = document.getElementById("numero").value;
  const email = document.getElementById("email").value;
  const frequenciaStr = document.getElementById("frequencia").value;

  // VALIDAÇÕES 
  if (nome.trim() === "" || numero.trim() === "") {
    alert("Nome e número são obrigatórios");
    return;
  }

  // Prepara o objeto para o Django 
  const dadosParaEnviar = {
    nome: nome,
    telefone: numero, 
    email: email || "",
    frequencia: frequenciaStr // 'semanal', 'quinzenal' ou 'mensal'
  };

  try {
    //  Envia para o servidor
    const resposta = await fetch('http://127.0.0.1:8000/agenda/criar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosParaEnviar)
    });

    if (resposta.ok) {
      // salvou no banco?
      
      alert("Contato salvo no banco de dados!");
      
      // Limpa campos e fecha modal
      document.getElementById("nome").value = "";
      document.getElementById("numero").value = "";
      document.getElementById("email").value = "";
      modal.style.display = "none";

      // eecarrega a lista vinda do banco 
      carregarContatos(); 
      
    } else {
      const erroDados = await resposta.json();
      alert("Erro do servidor: " + (erroDados.erro || "Falha ao salvar"));
    }
  } catch (erro) {
    console.error("Erro na requisição:", erro);
    alert("Erro de conexão. O servidor no Termux está ligado?");
  }
};

// RENDERIZAR

async function carregarContatos() {
  try {
    console.log("Tentando buscar contatos...");
    const resposta = await fetch('http://127.0.0.1:8000/agenda/');

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const contatosDoBanco = await resposta.json();
    console.log("Dados recebidos:", contatosDoBanco);

    // Chama a função de renderizar
    renderizarContatos(contatosDoBanco);

  } catch (erro) {
    console.error("Erro ao carregar contatos:", erro);
    alert("Não foi possível carregar a lista de contatos. Verifique o servidor.");
  }
}

// Função que constrói a lista na tela
function renderizarContatos(lista) {
  const listaContatosContainer = document.getElementById("listaContatos");
  const totalContatosSpan = document.getElementById("totalContatos");

  if (!listaContatosContainer) {
    console.error("Erro: O elemento #listaContatos não existe no seu HTML.");
    return;
  }

  // Atualiza o contador
  if (totalContatosSpan) {
    totalContatosSpan.textContent = `${lista.length} contatos`;
  }

  listaContatosContainer.innerHTML = "";

  // Se a lista estiver vazia, mostra uma mensagem 
  if (lista.length === 0) {
    listaContatosContainer.innerHTML = "<p>Nenhum contato encontrado no banco.</p>";
    return;
  }

  // Loop para criar o HTML de cada contato
  lista.forEach((contato) => {
    const primeiraLetra = contato.nome ? contato.nome.charAt(0).toUpperCase() : "?";

    // crio o template usando os nomes das chaves do django
    const htmlContato = `
      <div class="contato">
        <div class="info-contato">
          <div class="avatar">${primeiraLetra}</div>
          <div>
            <div class="nome">${contato.nome}</div>
            <div class="numero">${contato.numero}</div> <div class="frequencia">
              <small>Frequência: ${contato.frequencia}</small>
            </div>
          </div>
        </div>
        <div class="acoes">
          <button onclick="marcarContato(${contato.id})"><i class="fa-solid fa-check"></i></button>
          <button onclick="editarContato(${contato.id})"><i class="fa-solid fa-pen"></i></button>
          <button onclick="excluirContato(${contato.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;

    listaContatosContainer.innerHTML += htmlContato;
  });
}

// inicis tudo quando a página carregar
document.addEventListener("DOMContentLoaded", carregarContatos);


// EXCLUIR

function excluirContato(index){

  contatos.splice(index, 1);

  localStorage.setItem(
    "contatos",
    JSON.stringify(contatos)
  );

  renderizarContatos();

}

// EDITAR

function editarContato(index){

  const contato = contatos[index];

  document.getElementById("nome").value =
    contato.nome;

  document.getElementById("numero").value =
    contato.numero;

  document.getElementById("email").value =
  contato.email || "";

  contatos.splice(index, 1);

  localStorage.setItem(
    "contatos",
    JSON.stringify(contatos)
  );

  renderizarContatos();

  modal.style.display = "flex";

}

// PESQUISA

pesquisa.addEventListener("input", () => {

  const valor =
    pesquisa.value.toLowerCase();

  const filtrados = contatos.filter(contato =>

    contato.nome.toLowerCase().includes(valor)

  );

  renderizarContatos(filtrados);

});

// INICIAR

renderizarContatos();
verificarPendencias();

// ======================================
// DADOS DA CONTA
// ======================================

// EMAIL PADRÃO
const emailUsuario = "exemplo@gmail.com";

// MOSTRAR EMAIL
document.getElementById("emailConta").textContent =
  emailUsuario;

// PEGAR NOME DO EMAIL
const nomeUsuario =
  emailUsuario.split("@")[0];

// FORMATAR NOME
const nomeFormatado =
  nomeUsuario.charAt(0).toUpperCase() +
  nomeUsuario.slice(1);

// MOSTRAR SAUDAÇÃO
document.getElementById("saudacao").textContent =
  `Olá, ${nomeFormatado}!`;
// =====================================
// CONFIGURAÇÕES
// =====================================

const abrirConfig =
  document.getElementById("abrirConfig");

const configModal =
  document.getElementById("configModal");

const fecharConfig =
  document.getElementById("fecharConfig");

const salvarConfig =
  document.getElementById("salvarConfig");

// ABRIR CONFIG

abrirConfig.onclick = () => {

  configModal.style.display = "flex";

};

// FECHAR CONFIG

fecharConfig.onclick = () => {

  configModal.style.display = "none";

};

// SALVAR CONFIG

salvarConfig.onclick = () => {

  const configuracoes = {

    ordenarPor:
      document.getElementById("ordenarPor").value,

    formatoNome:
      document.getElementById("formatoNome").value,

    tema:
      document.getElementById("tema").value,

    contaPrincipal:
      document.getElementById("contaPrincipal").value,

    nomeFonetico:
      document.getElementById("nomeFonetico").value

  };

  localStorage.setItem(
    "configuracoes",
    JSON.stringify(configuracoes)
  );

  aplicarTema(configuracoes.tema);

  alert("Configurações salvas!");

  configModal.style.display = "none";

};

// CARREGAR CONFIG

const configSalva =
  JSON.parse(
    localStorage.getItem("configuracoes")
  );

if(configSalva){

  document.getElementById("ordenarPor").value =
    configSalva.ordenarPor;

  document.getElementById("formatoNome").value =
    configSalva.formatoNome;

  document.getElementById("tema").value =
    configSalva.tema;

  document.getElementById("contaPrincipal").value =
    configSalva.contaPrincipal;

  document.getElementById("nomeFonetico").value =
    configSalva.nomeFonetico;

  aplicarTema(configSalva.tema);

}

// TEMA

function aplicarTema(tema){

  // LIMPAR CLASSES
  document.body.classList.remove(
    "tema-claro",
    "tema-escuro"
  );

  // TEMA CLARO
  if(tema === "claro"){

    document.body.classList.add(
      "tema-claro"
    );

  }

  // TEMA ESCURO
  else if(tema === "escuro"){

    document.body.classList.add(
      "tema-escuro"
    );

  }

  // SISTEMA
  else{

    const escuro =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    if(escuro){

      document.body.classList.add(
        "tema-escuro"
      );

    }else{

      document.body.classList.add(
        "tema-claro"
      );

    }

  }

}
// ======================================
// CONTAS GOOGLE
// ======================================

const googleModal =
  document.getElementById("googleModal");

const fecharGoogle =
  document.getElementById("fecharGoogle");

const listaGoogle =
  document.getElementById("listaGoogle");

const adicionarContaGoogle =
  document.getElementById("adicionarContaGoogle");

const novaContaGoogle =
  document.getElementById("novaContaGoogle");

// BOTÃO GERENCIAR CONTA
const btnGoogle =
  document.querySelector(".btn-google");

// CONTAS
let contasGoogle =
  JSON.parse(localStorage.getItem("contasGoogle"))
  || [
    "exemplo@gmail.com",
    "usuario@gmail.com"
  ];

// ABRIR
btnGoogle.onclick = () => {

  googleModal.style.display = "flex";

  renderizarContasGoogle();

};

// FECHAR
fecharGoogle.onclick = () => {

  googleModal.style.display = "none";

};

// RENDERIZAR CONTAS

function renderizarContasGoogle(){

  listaGoogle.innerHTML = "";

  contasGoogle.forEach((email) => {

    listaGoogle.innerHTML += `

      <div
        class="google-conta"
        onclick="selecionarConta('${email}')"
      >

        <div class="google-info">

        <div class="google-email">
            ${email}
        </div>

        <button
             class="remover-google"
            onclick="removerContaGoogle('${email}')"
         >
          <i class="fa-solid fa-trash"></i>
  </button>

</div>

      </div>

    `;

  });

}

// SELECIONAR

function selecionarConta(email){

  // ALTERAR EMAIL
  document.getElementById("emailConta")
    .textContent = email;

  // PEGAR NOME
  const nome =
    email.split("@")[0];

  const nomeFormatado =
    nome.charAt(0).toUpperCase() +
    nome.slice(1);

  // ALTERAR TEXTO
  document.getElementById("saudacao")
    .textContent =
    `Olá, ${nomeFormatado}!`;

  // SALVAR
  localStorage.setItem(
    "contaSelecionada",
    email
  );

  googleModal.style.display = "none";

}

// ADICIONAR NOVA

adicionarContaGoogle.onclick = () => {

  const email =
    novaContaGoogle.value.trim();

  if(email === ""){
    return;
  }

  contasGoogle.push(email);

  localStorage.setItem(
    "contasGoogle",
    JSON.stringify(contasGoogle)
  );

  renderizarContasGoogle();

  novaContaGoogle.value = "";

};

// CARREGAR CONTA

const contaSalva =
  localStorage.getItem("contaSelecionada");

if(contaSalva){

  selecionarConta(contaSalva);

}
// ======================================
// SINCRONIZAÇÃO
// ======================================

function atualizarSincronizacao() {

  const elemento =
    document.getElementById("ultimaSync");

  // SE NÃO EXISTIR
  if(!elemento){
    return;
  }

  const agora = new Date();

  const hora =
    agora.getHours()
      .toString()
      .padStart(2, "0");

  const minutos =
    agora.getMinutes()
      .toString()
      .padStart(2, "0");

  elemento.textContent =
    `Última sincronização: ${hora}:${minutos}`;

}

// ESPERAR CARREGAR A PÁGINA
window.addEventListener("load", () => {

  atualizarSincronizacao();

  setInterval(() => {

    atualizarSincronizacao();

  }, 1000);

});
// ======================================
// REMOVER CONTA GOOGLE
// ======================================

function removerContaGoogle(email){

  // CONFIRMAR
  const confirmar =
    confirm(
      `Remover a conta ${email}?`
    );

  if(!confirmar){
    return;
  }

  // REMOVER
  contasGoogle =
    contasGoogle.filter(
      conta => conta !== email
    );

  // SALVAR
  localStorage.setItem(
    "contasGoogle",
    JSON.stringify(contasGoogle)
  );

  // SE REMOVEU A CONTA ATUAL
  const contaAtual =
    localStorage.getItem(
      "contaSelecionada"
    );

  if(contaAtual === email){

    localStorage.removeItem(
      "contaSelecionada"
    );

    // VOLTAR PADRÃO
    document.getElementById(
      "emailConta"
    ).textContent =
      "usuario@gmail.com";

    document.getElementById(
      "saudacao"
    ).textContent =
      "Olá!";

  }

  // ATUALIZAR LISTA
  renderizarContasGoogle();

}
// ======================================
// CLIENTES PENDENTES
// ======================================

function verificarPendencias(){

  const areaPendencias =
    document.getElementById(
      "pendencias"
    );

  if(!areaPendencias){
    return;
  }

  areaPendencias.innerHTML = "";

  const hoje = new Date();

  const pendentes =
    contatos.filter(contato => {

      const ultimaData =
        new Date(contato.ultimoContato);

      const diferenca =
        Math.floor(
          (hoje - ultimaData)
          /
          (1000 * 60 * 60 * 24)
        );

      return diferenca >= (contato.frequencia || 30);

    });

  if(pendentes.length === 0){

    areaPendencias.innerHTML = `

      <div class="sem-pendencias">
        Nenhum cliente pendente hoje ✅
      </div>

    `;

    return;

  }

  areaPendencias.innerHTML = `

    <div class="titulo-pendencias">
      Clientes Pendentes Hoje
    </div>

  `;

  pendentes.forEach(cliente => {

    areaPendencias.innerHTML += `

      <div class="card-pendencia">

        <strong>
          ${cliente.nome}
        </strong>

        <br>

        Contato pendente há mais de
        ${cliente.frequencia} dias

      </div>

    `;

  });

}
// ======================================
// MARCAR CONTATO REALIZADO
// ======================================

function marcarContato(index){

  contatos[index].ultimoContato =
    new Date().toISOString();

  localStorage.setItem(
    "contatos",
    JSON.stringify(contatos)
  );

  renderizarContatos();

  verificarPendencias();

  alert("Contato atualizado com sucesso!");

}
// ======================================
// AJUDA
// ======================================

const abrirAjuda =
  document.getElementById("abrirAjuda");

const ajudaModal =
  document.getElementById("ajudaModal");

const fecharAjuda =
  document.getElementById("fecharAjuda");

// ABRIR
abrirAjuda.onclick = () => {

  ajudaModal.style.display = "flex";

};

// FECHAR
fecharAjuda.onclick = () => {

  ajudaModal.style.display = "none";

};
// ======================================
// FEEDBACK
// ======================================

const estrelas =
  document.querySelectorAll(".estrela");

const enviarFeedback =
  document.getElementById("enviarFeedback");

let notaFeedback = 0;

// SELECIONAR ESTRELAS

estrelas.forEach(estrela => {

  estrela.onclick = () => {

    notaFeedback =
      estrela.dataset.nota;

    atualizarEstrelas();

  };

});

// ATUALIZAR VISUAL

function atualizarEstrelas(){

  estrelas.forEach(estrela => {

    const nota =
      estrela.dataset.nota;

    if(nota <= notaFeedback){

      estrela.classList.remove(
        "fa-regular"
      );

      estrela.classList.add(
        "fa-solid"
      );

    }else{

      estrela.classList.remove(
        "fa-solid"
      );

      estrela.classList.add(
        "fa-regular"
      );

    }

  });

}

// ENVIAR

enviarFeedback.onclick = () => {

  const texto =
    document.getElementById(
      "textoFeedback"
    ).value.trim();

  if(notaFeedback == 0){

    alert("Selecione uma nota");

    return;

  }

  const feedback = {

    nota: notaFeedback,

    mensagem: texto,

    data:
      new Date().toLocaleString()

  };

  // SALVAR
  let feedbacks =
    JSON.parse(
      localStorage.getItem("feedbacks")
    ) || [];

  feedbacks.push(feedback);

  localStorage.setItem(
    "feedbacks",
    JSON.stringify(feedbacks)
  );

  // LIMPAR
  notaFeedback = 0;

  atualizarEstrelas();

  document.getElementById(
    "textoFeedback"
  ).value = "";

  alert("Feedback enviado com sucesso!");

};