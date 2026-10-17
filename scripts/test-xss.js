import { renderVisitorTableContent } from '../src/admin/admin-ui.js';

const maliciousVisitor = {
  id: 'attacker123',
  displayName: 'Attacker <script>alert("name")</script>',
  email: 'attacker@test.com" onfocus="alert(1)',
  photoURL: 'x" onerror="alert(1)',
  provider: '"><script>alert(1)</script>',
  loginCount: '<img src=x onerror=alert(1)>',
  createdAt: { toMillis: () => Date.now() },
  lastLoginAt: { toMillis: () => Date.now() }
};

const output = renderVisitorTableContent([maliciousVisitor]);

console.log('--- Rendered Table Output Snippet ---');
console.log(output.substring(0, 500));
console.log('...\n');

// Assertions
const errors = [];

// 1. photoURL must not render an unescaped <img> with onerror because it is not https://
if (output.includes('onerror="alert(1)"') || output.includes('onerror=')) {
  errors.push('CRITICAL: Malicious onerror handler found in output!');
}

// 2. No unescaped <script tags
if (output.includes('<script>') || output.includes('<script')) {
  errors.push('CRITICAL: Unescaped <script> tag found in output!');
}

// 3. Provider whitelist test
if (output.includes('provider-badge "><script>') || !output.includes('provider-badge email')) {
  errors.push('CRITICAL: Provider was not sanitized to whitelist!');
}

// 4. loginCount coercion test: non-finite string should fall back to 1
if (output.includes('<img src=x') || !output.includes('<span class="badge-count">1</span>')) {
  errors.push('CRITICAL: loginCount was not coerced safely to a numeric value!');
}

// 5. Check displayName escaping
if (!output.includes('Attacker &lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;')) {
  errors.push('CRITICAL: displayName was not properly HTML escaped!');
}

if (errors.length === 0) {
  console.log('✅ SUCCESS: All XSS vectors are completely mitigated and verified!');
} else {
  console.error('❌ FAILURES:', errors);
  process.exit(1);
}
