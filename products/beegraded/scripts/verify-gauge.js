const fs = require('fs');

['workflow-quick-evaluate.json', 'workflow-evaluate.json'].forEach(file => {
  const json = JSON.parse(fs.readFileSync('n8n-workflows/' + file, 'utf8'));
  const node = json.nodes.find(n => n.name === 'Build Report' || n.name === 'Build Rich Report');
  const code = node.parameters.functionCode;

  console.log('\n=== ' + file + ' ===');
  console.log('Has gauge-item class:', code.includes('gauge-item'));
  console.log('Has toggleScoreDetail in onclick:', code.includes("toggleScoreDetail('"));
  console.log('Has extra CSS:', code.includes('gauge-item:hover'));
  console.log('Has toggleScoreDetail fn:', code.includes('function toggleScoreDetail'));
  console.log('Has score-detail-panel:', code.includes('score-detail-panel'));

  // Find all </div></div></div> patterns and their context
  const pattern = "'</div></div></div>'";
  let idx = code.indexOf(pattern);
  let count = 0;
  while (idx !== -1) {
    count++;
    const before = code.substring(Math.max(0, idx - 250), idx);
    const lastChars = before.substring(before.length - 100);
    console.log('\nClose #' + count + ' at index ' + idx);
    console.log('Context before:', lastChars.replace(/\n/g, '\\n'));
    idx = code.indexOf(pattern, idx + 1);
  }
});
