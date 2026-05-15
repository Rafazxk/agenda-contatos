import json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Contato

@csrf_exempt # por enquanto
  # django tem um token de segurança
  
def criar_contato_api(request):
    if request.method == 'POST':
        try:
            dados = json.loads(request.body)
            novo_contato = Contato.objects.create(
                nome=dados.get('nome'),
                telefone=dados.get('telefone'),
                frequencia=dados.get('frequencia', 'mensal')
            )
            return JsonResponse({
                "id": novo_contato.id,
                "mensagem": "Contato criado com sucesso!"
            }, status=201)
        except Exception as e:
            return JsonResponse({"erro": str(e)}, status=400)
            
            
def listar_contatos_api(request):
    contatos = Contato.objects.all()
    
    dados = []
    for contato in contatos:
        dados.append({
            "id": contato.id,
            "nome": contato.nome,
            "numero": contato.telefone, 
            # Mapeia 'telefone' do banco para 'numero' do js
            
            # get_frequencia_display() mostra o nome ('Semanal' em vez de 'semanal')
            "frequencia": contato.get_frequencia_display() 
        })
        
    return JsonResponse(dados, safe=False)
    
    