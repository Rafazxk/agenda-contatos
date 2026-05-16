import json
from django.test import TestCase, Client
from django.urls import reverse
from .models import Contato

class ContatoAPITestCase(TestCase):
    def setUp(self):
        # Configura o cliente de teste do Django
        self.client = Client()
        # Cria um contato inicial no banco de testes
        self.contato = Contato.objects.create(
            nome="Maria Souza", 
            telefone="21977777777", 
            frequencia="mensal"
        )

    def test_listar_contatos(self):
        url = reverse('listar_contatos_api')
        resposta = self.client.get(url)
        
        self.assertEqual(resposta.status_code, 200)
        # Verifica se o nome do contato criado no setUp está no JSON retornado
        dados = resposta.json()
        self.assertEqual(dados[0]['nome'], "Maria Souza")

    def test_editar_contato(self):
        url = reverse('editar_contatos_api', args=[self.contato.id])
        dados_atualizados = {
            "nome": "Maria Silva",
            "telefone": "21977777777"
        }
        
        # Faz a requisição PUT enviando os dados como JSON string
        resposta = self.client.put(
            url, 
            data=json.dumps(dados_atualizados), 
            content_type='application/json'
        )
        
        self.assertEqual(resposta.status_code, 200)
        # Verifica se alterou no banco de dados
        self.contato.refresh_from_db()
        self.assertEqual(self.contato.nome, "Maria Silva")

    def test_excluir_contato(self):
        url = reverse('excluir_contatos_api', args=[self.contato.id])
        resposta = self.client.delete(url)
        
        self.assertEqual(resposta.status_code, 200)
        # Verifica se o contato realmente sumiu do banco
        self.assertFalse(Contato.objects.filter(id=self.contato.id).exists())