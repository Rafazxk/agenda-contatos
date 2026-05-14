from django.shortcuts import render
from .models import Contato

def lista_contatos(request):
    
    #busca todos os contatos salvos no banco
    #SELECT * FROM usuarios;
    todos_contatos = Contato.objects.all()
    
    #cria um contexto para o html
    contexto = {
        'contatos': todos_contatos
    }

    return render(request, 'contatos/lista.html', contexto)