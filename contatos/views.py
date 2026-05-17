import json
import jwt
import datetime
from django.conf import settings  
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Contato
from functools import wraps
from django.contrib.auth.models import User

# decorador de autenticacao jwt

def jwt_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'erro': 'Token de autenticação ausente ou malformatado.'}, status=401)
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            request.user = User.objects.get(id=payload['user_id'])
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({'erro': 'O Token expirou.'}, status=401)
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return JsonResponse({'erro': 'Token inválido.'}, status=401)
            
        return view_func(request, *args, **kwargs)
    return _wrapped_view


# funcao auxiliar de validacao

def validar_dados_contato(dados):
    erros = {}
    
    nome = dados.get('nome')
    if not nome:
        erros['nome'] = 'O campo nome é obrigatório.'
    elif len(str(nome).strip()) < 3:
        erros['nome'] = 'O nome deve ter pelo menos 3 caracteres.'
        
    telefone = dados.get('telefone')
    if not telefone:
        erros['telefone'] = 'O campo telefone é obrigatório.'
    elif len(str(telefone).replace(" ", "").replace("-", "")) < 8:
        erros['telefone'] = 'Insira um telefone válido (mínimo 8 dígitos).'
        
    frequencia = dados.get('frequencia')
  
    frequencias_validas = ['semanal', 'quinzenal', 'mensal']
    if frequencia and frequencia not in frequencias_validas:
        erros['frequencia'] = f'Frequência inválida. Escolha entre: {", ".join(frequencias_validas)}.'
        
    return erros



#  endpoints da api (crud + login)

@csrf_exempt
@jwt_required  
def criar_contato_api(request):
    if request.method == 'POST':
        try:
            dados = json.loads(request.body)
            
          
            erros = validar_dados_contato(dados)
            if erros:
                return JsonResponse({"erros": erros}, status=400)
            
            novo_contato = Contato.objects.create(
                nome=dados.get('nome').strip(),
                telefone=dados.get('telefone'),
                frequencia=dados.get('frequencia', 'mensal')
            )
            return JsonResponse({
                "id": novo_contato.id,
                "mensagem": "Contato criado com sucesso!"
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"erro": "JSON malformatado enviado no corpo da requisição."}, status=400)
        except Exception as e:
            return JsonResponse({"erro": str(e)}, status=400)


@jwt_required 

def listar_contatos_api(request):
    contatos = Contato.objects.all()
    
    dados = []
    for contato in contatos:
        dados.append({
            "id": contato.id,
            "nome": contato.nome,
            "numero": contato.telefone, 
            "frequencia": contato.get_frequencia_display() 
        })
        
    return JsonResponse(dados, safe=False)


@csrf_exempt
@jwt_required  
def editar_contatos_api(request, id):
    if request.method == 'PUT':
        try:
            contato = Contato.objects.get(id=id)
            dados = json.loads(request.body)
            
           
            dados_finais = {
                'nome': dados.get('nome', contato.nome),
                'telefone': dados.get('telefone', contato.telefone),
                'frequencia': dados.get('frequencia', contato.frequencia)
            }
            
            erros = validar_dados_contato(dados_finais)
            if erros:
                return JsonResponse({"erros": erros}, status=400)
            
            contato.nome = dados_finais['nome'].strip()
            contato.telefone = dados_finais['telefone']
            contato.frequencia = dados_finais['frequencia']
            contato.save()
            
            return JsonResponse({
                "id": contato.id,
                "mensagem": "Contato atualizado com sucesso!"
            }, status=200)
            
        except Contato.DoesNotExist:
            return JsonResponse({"erro": "Contato não encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"erro": "JSON malformatado enviado no corpo da requisição."}, status=400)
        except Exception as e:
            return JsonResponse({"erro": str(e)}, status=400)
            
    return JsonResponse({"erro": "Método não permitido."}, status=405)  


@csrf_exempt
@jwt_required  # Protegendo a rota
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

#cadastro do usuario 

@csrf_exempt 
def cadastro_usuario_api(request):
    if request.method == 'POST':
        try:
            dados = json.loads(request.body)
            username = dados.get('username')
            email = dados.get('email')
            password = dados.get('password')
            
            # --- VALIDAÇÃO DOS CAMPOS DE CADASTRO ---
            erros = {}
            
            if not username:
                erros['username'] = 'O campo username é obrigatório.'
            elif len(str(username).strip()) < 3:
                erros['username'] = 'O username deve ter pelo menos 3 caracteres.'
            # Verifica se o username já existe no banco
            elif User.objects.filter(username=username).exists():
                erros['username'] = 'Este nome de usuário já está em uso.'
                
            if not email:
                erros['email'] = 'O campo email é obrigatório.'
            # Validação simples de email e verificação de duplicidade
            elif User.objects.filter(email=email).exists():
                erros['email'] = 'Este e-mail já está cadastrado.'
                
            if not password:
                erros['password'] = 'O campo password é obrigatório.'
            elif len(str(password)) < 6:
                erros['password'] = 'A senha deve ter pelo menos 6 caracteres.'
                
            # Se houver qualquer erro de validação, barra aqui
            if erros:
                return JsonResponse({"erros": erros}, status=400)
            # ----------------------------------------
            
            # Criando o usuário com a senha criptografada de forma segura
            novo_usuario = User.objects.create_user(
                username=username.strip(),
                email=email.strip(),
                password=password
            )
            
            return JsonResponse({
                "id": novo_usuario.id,
                "mensagem": "Usuário cadastrado com sucesso!"
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({"erro": "JSON malformatado enviado no corpo da requisição."}, status=400)
        except Exception as e:
            return JsonResponse({"erro": str(e)}, status=400)
            
    return JsonResponse({"erro": "Método não permitido."}, status=405)



# login do usuario
@csrf_exempt  
def login_usuario_api(request):
    if request.method == 'POST':
        try:
            dados = json.loads(request.body)
            username = dados.get('username')
            password = dados.get('password')
            
            user = authenticate(username=username, password=password)
            
            if user is not None:
                payload = {
                    'user_id': user.id,
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2),
                    'iat': datetime.datetime.utcnow()
                }
                token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
                
                return JsonResponse({'token': token}, status=200)
            else:
                return JsonResponse({'erro': 'Credenciais inválidas.'}, status=401)
                
        except Exception as e:
            return JsonResponse({'erro': str(e)}, status=400)
            
    return JsonResponse({'erro': 'Método não permitido.'}, status=405)