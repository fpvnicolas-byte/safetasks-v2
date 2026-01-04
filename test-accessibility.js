// Teste das funcionalidades de acessibilidade implementadas
console.log('🧪 Testando funcionalidades de acessibilidade...\n');

// Teste 1: Verificar se os hooks existem
try {
  console.log('✅ Teste 1: Verificando imports...');
  const hooks = require('./frontend/src/lib/hooks/index.ts');
  console.log('   useDesignTokens:', !!hooks.useDesignTokens);
  console.log('   useAccessibility:', !!hooks.useAccessibility);
} catch (error) {
  console.log('❌ Erro no teste 1:', error.message);
}

// Teste 2: Verificar design tokens
try {
  console.log('\n✅ Teste 2: Verificando design tokens...');
  const designTokens = require('./frontend/src/lib/design-tokens.ts');
  console.log('   colors:', !!designTokens.colors);
  console.log('   spacing:', !!designTokens.spacing);
  console.log('   typography:', !!designTokens.typography);
  console.log('   shadows:', !!designTokens.shadows);
  console.log('   borderRadius:', !!designTokens.borderRadius);
} catch (error) {
  console.log('❌ Erro no teste 2:', error.message);
}

// Teste 3: Verificar testes de acessibilidade
try {
  console.log('\n✅ Teste 3: Verificando testes de acessibilidade...');
  const accessibilityTests = require('./frontend/src/lib/accessibility-tests.ts');
  console.log('   validateContrast:', typeof accessibilityTests.validateContrast === 'function');
  console.log('   runAccessibilityAudit:', typeof accessibilityTests.runAccessibilityAudit === 'function');
  console.log('   generateAccessibilityReport:', typeof accessibilityTests.generateAccessibilityReport === 'function');
} catch (error) {
  console.log('❌ Erro no teste 3:', error.message);
}

// Teste 4: Verificar componentes
try {
  console.log('\n✅ Teste 4: Verificando componentes de acessibilidade...');
  const fs = require('fs');
  const accessibilityPanelExists = fs.existsSync('./frontend/src/components/dev/accessibility-panel.tsx');
  console.log('   AccessibilityPanel existe:', accessibilityPanelExists);
} catch (error) {
  console.log('❌ Erro no teste 4:', error.message);
}

console.log('\n🎉 Testes de acessibilidade concluídos!');
