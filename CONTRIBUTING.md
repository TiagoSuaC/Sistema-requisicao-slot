# Guia de Contribuição

Obrigado por considerar contribuir para o Sistema de Gestão de Macro Períodos! 🎉

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Posso Contribuir?](#como-posso-contribuir)
3. [Configurando o Ambiente](#configurando-o-ambiente)
4. [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
5. [Padrões de Código](#padrões-de-código)
6. [Testes](#testes)
7. [Commits e Pull Requests](#commits-e-pull-requests)
8. [Revisão de Código](#revisão-de-código)

---

## Código de Conduta

Este projeto adere a um código de conduta. Ao participar, espera-se que você o cumpra:
- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

---

## Como Posso Contribuir?

### Reportando Bugs

Antes de criar um issue:
1. Verifique se o bug já foi reportado
2. Certifique-se de estar na versão mais recente
3. Tente reproduzir em ambiente isolado

Ao criar um issue, inclua:
- **Título descritivo**
- **Passos para reproduzir**
- **Comportamento esperado vs atual**
- **Screenshots** (se aplicável)
- **Ambiente** (OS, versões, navegador)

### Sugerindo Melhorias

Para sugestões de features:
1. Crie um issue com label `enhancement`
2. Descreva o problema que a feature resolve
3. Proponha uma solução
4. Liste alternativas consideradas

### Pull Requests

Sempre bem-vindos! Veja seção [Workflow de Desenvolvimento](#workflow-de-desenvolvimento).

---

## Configurando o Ambiente

### Requisitos

- Docker Desktop 4.0+
- Git 2.30+
- Node.js 20+ (para desenvolvimento frontend local)
- Python 3.12+ (para desenvolvimento backend local)

### Setup Inicial

```bash
# 1. Clone o repositório
git clone https://github.com/TiagoSuaC/Sistema-requisicao-slot.git
cd Sistema-requisicao-slot

# 2. Copie o .env
cp .env.example .env

# 3. Suba os containers
docker compose up --build

# 4. Acesse
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Desenvolvimento Local (sem Docker)

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python seed_data.py
uvicorn app.main:app --reload
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## Workflow de Desenvolvimento

### 1. Crie uma Branch

```bash
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

**Convenção de Branches**:
- `feature/` - Nova funcionalidade
- `fix/` - Correção de bug
- `docs/` - Apenas documentação
- `refactor/` - Refatoração
- `test/` - Adição de testes
- `chore/` - Tarefas de manutenção

### 2. Faça suas Alterações

- **Um conceito por commit**
- **Teste localmente**
- **Siga os padrões de código**
- **Atualize documentação se necessário**

### 3. Commit

```bash
git add .
git commit -m "feat: adicionar validação de conflitos"
```

Veja [Commits](#commits-e-pull-requests) para convenções.

### 4. Push e PR

```bash
git push origin feature/nome-da-feature
```

No GitHub:
1. Abra Pull Request
2. Preencha o template
3. Aguarde revisão

---

## Padrões de Código

### Backend (Python)

**Style Guide**: PEP 8

```python
# Bom
def calculate_total_days(start_date: date, end_date: date) -> int:
    """
    Calculate total days between two dates.

    Args:
        start_date: Starting date
        end_date: Ending date

    Returns:
        Number of days

    Raises:
        ValueError: If end_date < start_date
    """
    if end_date < start_date:
        raise ValueError("End date must be after start date")

    return (end_date - start_date).days + 1
```

**Princípios**:
- Type hints sempre
- Docstrings em funções públicas
- snake_case para variáveis/funções
- PascalCase para classes
- Máximo 100 caracteres por linha

### Frontend (TypeScript)

**Style Guide**: ESLint + Prettier

```typescript
// Bom
interface MacroPeriod {
  id: number;
  doctorName: string;
  startDate: string;
  endDate: string;
}

async function fetchMacroPeriod(id: number): Promise<MacroPeriod> {
  try {
    const response = await api.get(`/macro-periods/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    throw error;
  }
}
```

**Princípios**:
- camelCase para variáveis/funções
- PascalCase para componentes/interfaces
- Functional components com hooks
- Props sempre tipadas
- Handlers começam com `handle`

---

## Testes

### Backend

```bash
# Instalar pytest
pip install pytest pytest-asyncio pytest-cov

# Rodar testes
pytest

# Com coverage
pytest --cov=app tests/
```

**Estrutura**:
```python
# tests/test_macro_periods.py
import pytest
from fastapi.testclient import TestClient

def test_create_macro_period(client: TestClient):
    response = client.post("/macro-periods", json={
        "doctor_id": 1,
        "start_date": "2026-01-01",
        "end_date": "2026-01-31"
    })
    assert response.status_code == 201
    assert "public_token" in response.json()
```

### Frontend

```bash
# Instalar Jest
npm install --save-dev jest @testing-library/react

# Rodar testes
npm test
```

**Estrutura**:
```typescript
// __tests__/MacroPeriodList.test.tsx
import { render, screen } from '@testing-library/react';
import MacroPeriodList from './MacroPeriodList';

describe('MacroPeriodList', () => {
  it('renders list of macro periods', () => {
    const periods = [{ id: 1, doctorName: 'Dr. Silva' }];
    render(<MacroPeriodList periods={periods} />);
    expect(screen.getByText('Dr. Silva')).toBeInTheDocument();
  });
});
```

---

## Commits e Pull Requests

### Mensagens de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Apenas documentação
- `style`: Formatação (sem mudança de lógica)
- `refactor`: Refatoração
- `test`: Adicionar testes
- `chore`: Manutenção

**Exemplos**:
```bash
feat(calendar): adicionar exportação para Google Calendar
fix(validation): corrigir validação de conflitos de horário
docs(readme): atualizar instruções de instalação
refactor(api): simplificar endpoint de macro periods
```

### Pull Request Template

```markdown
## Descrição
<!-- O que este PR faz? Por quê? -->

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Adicionei testes
- [ ] Todos os testes passam
- [ ] Atualizei a documentação
- [ ] Testei localmente

## Screenshots
<!-- Se aplicável -->

## Issues Relacionadas
Closes #123
```

---

## Revisão de Código

### Como Revisor

- **Seja construtivo**: Critique o código, não a pessoa
- **Explique o porquê**: Não apenas "está errado", mas "porque X, sugiro Y"
- **Aprove com comentários**: OK aprovar PR com small nitpicks
- **Responda rápido**: Máximo 24h

### Como Autor

- **Responda todos os comentários**: Mesmo que seja "Done"
- **Não leve para o pessoal**: Feedback é sobre o código
- **Explique decisões**: Se discordar, justifique
- **Seja paciente**: Múltiplas iterações são normais

### Checklist de Review

- [ ] Código faz o que promete
- [ ] Testes adequados
- [ ] Sem código comentado
- [ ] Sem TODOs sem issue
- [ ] Performance OK
- [ ] Segurança OK
- [ ] Documentação atualizada

---

## Documentação

Ao adicionar features, atualize:
- [ ] README.md (se necessário)
- [ ] CHANGELOG.md (sempre)
- [ ] Docstrings/JSDoc
- [ ] API.md (se novo endpoint)
- [ ] PRD.md (se mudança de requisito)

---

## Dúvidas?

- Abra um issue com label `question`
- Entre em contato com a equipe
- Consulte a documentação:
  - [README.md](README.md)
  - [ARCHITECTURE.md](ARCHITECTURE.md)
  - [API.md](API.md)

---

**Obrigado por contribuir! 🚀**
