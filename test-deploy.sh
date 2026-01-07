#!/bin/bash

echo "🚀 Testes de deploy SafeTasks V2"
echo "================================="

# Teste 1: Sintaxe Python
echo ""
echo "1️⃣ Testando sintaxe Python..."
cd backend
if poetry run python -c "import ast; [ast.parse(open(f).read()) for f in ['app/main.py', 'app/services/billing_service.py', 'app/api/deps.py']]; print('✅ Sintaxe Python OK!')"; then
    echo "✅ Sintaxe Python: PASSOU"
else
    echo "❌ Sintaxe Python: FALHOU"
    exit 1
fi

# Teste 2: Imports básicos
echo ""
echo "2️⃣ Testando imports básicos..."
if DATABASE_URL="sqlite:///./test.db" SECRET_KEY="test-key" poetry run python -c "from app.core.config import settings; print('✅ Imports OK!')"; then
    echo "✅ Imports básicos: PASSOU"
else
    echo "❌ Imports básicos: FALHOU"
    exit 1
fi

# Teste 3: Build Docker (opcional)
echo ""
echo "3️⃣ Testando build Docker..."
cd ..
if docker build -t safetasks-test . --quiet; then
    echo "✅ Docker build: PASSOU"
else
    echo "❌ Docker build: FALHOU (mas isso pode ser ignorado se não tiver Docker)"
fi

echo ""
echo "🎉 Todos os testes básicos passaram!"
echo "Agora você pode fazer deploy no Railway com mais confiança."
