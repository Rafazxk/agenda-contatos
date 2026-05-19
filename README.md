## Arquitetura e Tecnologias

* **Back-end:** Django (Python), Arquitetura baseada em Controller/Service para separação de responsabilidades.
* **Front-end:** HTML5, CSS3 (variáveis de ambiente para temas dinâmicos), JavaScript (Vanilla ES6).
* **Segurança:** Autenticação customizada via JWT (Bcrypt para hashing de senhas).
* **Banco de Dados:** PostgreSQL.

## Passo a Passo para Configuração


1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Rafazxk/agenda-contatos.git
   ```

   **Entre na pasta do projeto:**
   ```bash
    cd agenda
   ```

2. **Configure o ambiente virtual(Venv):**<br>
   *Verifique se tem o Python instalado na sua máquina*

   ```bash 
   python -m venv .venv
    ./.venv/bin/activate  
   pip install -r requirements.txt
   ```

3. **Crie o Banco de Dados no PostgreSQL:**
    ```bash
      # Acesse o terminal do PostgreSQL
      psql -U postgres -h 127.0.0.1

      # Crie a base de dados (execute este comando dentro do psql)
      CREATE DATABASE agenda_db;

      # Saia do terminal do PostgreSQL
      \q
    ```

4. **Configure as variáveis de ambiente:** <br>
  *Crie um arquivo chamado .env na raiz do projeto e adicione a estrutura abaixo:*
   ```bash
   SECRET_KEY=sua_chave_secreta_django_aqui
   DEBUG=True

   DB_NAME=agenda_db
   DB_USER=postgres
   DB_PASSWORD=sua_senha_local_do_postgres
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```

5. **Prepare o banco de dados:**
    ```bash
    python manage.py migrate
    ```

6. **Inicie o servidor:**
    ```bash
    python manage.py runserver
    ```
    
