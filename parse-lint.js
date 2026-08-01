const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('./lint-results.json', 'utf8'));
  const errorRules = new Set();
  
  data.forEach(result => {
    result.messages.forEach(msg => {
      if (msg.severity === 2) { // 2 means error
        errorRules.add(msg.ruleId || 'no-rule-id-parse-error');
      }
    });
  });
  
  console.log(Array.from(errorRules));
} catch (e) {
  console.error(e.message);
}
