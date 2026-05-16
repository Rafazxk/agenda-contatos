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
    
@csrf_exempt
def editar_contatos_api(request, id):
   
    if request.method == 'PUT':
        try:
            contato = Contato.objects.get(id=id)
            dados = json.loads(request.body)
            
            contato.nome = dados.get('nome', contato.nome)
            contato.telefone = dados.get('telefone', contato.telefone)
            contato.frequencia = dados.get('frequencia', contato.frequencia)
          
            contato.save()
            
            return JsonResponse({
                "id": contato.id,
                "mensagem": "Contato atualizado com sucesso!"
            }, status=200)
            
        except Contato.DoesNotExist:
            return JsonResponse({"erro": "Contato não encontrado."}, status=404)
        except Exception as e:
            return JsonResponse({"erro": str(e)}, status=400)
            
    return JsonResponse({"erro": "Método não permitido."}, status=405)  


@csrf_exempt
def excluir_contatos_api(request, id):
    
    if request.method == 'DELETE':
        try:
            contato = Contato.objects.get(id=id)
            contato.delete()
            
            return JsonResponse({
                "mensagem": f"Contato {id} excluído com sucesso!"
            }, status=200)
            
        except Contato.DoesNotExist:
            return JsonResponse({"erro": "Contato não encontrado."}, status=404)
        except Exception as e:
            return JsonResponse({"erro": str(e)}, status=400)
            
    return JsonResponse({"erro": "Método não permitido."}, status=405)