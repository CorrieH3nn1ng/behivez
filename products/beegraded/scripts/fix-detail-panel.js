const fs = require('fs');

const detailPanelHTML =
  '<div id="score-detail-panel" style="display:none;margin-top:16px;background:linear-gradient(135deg,#0f172a,#1e1b4b);border:1px solid #334155;border-radius:12px;padding:20px;position:relative">' +
  '<div style="display:flex;align-items:center;margin-bottom:12px">' +
  '<div id="sd-dot" style="width:10px;height:10px;border-radius:50%;margin-right:12px"></div>' +
  '<div style="flex:1"><div id="sd-title" style="font-size:16px;font-weight:700"></div>' +
  '<div id="sd-grade" style="font-size:12px;margin-top:2px"></div></div>' +
  '<div style="cursor:pointer;color:#64748b;font-size:20px;padding:4px 8px" onclick="toggleScoreDetail(null)">&times;</div></div>' +
  '<div id="sd-desc" style="color:#cbd5e1;font-size:13px;line-height:1.7;margin-bottom:14px"></div>' +
  '<div id="sd-bar" style="height:6px;border-radius:3px;background:#1e293b;margin-bottom:14px;position:relative;overflow:hidden">' +
  '<div id="sd-fill" style="height:100%;border-radius:3px;transition:width 0.5s ease"></div></div>' +
  '<div id="sd-tips" style="background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.15);border-radius:8px;padding:14px"></div></div>';

['workflow-quick-evaluate.json', 'workflow-evaluate.json'].forEach(file => {
  const filePath = 'n8n-workflows/' + file;
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const node = json.nodes.find(n => n.name === 'Build Report' || n.name === 'Build Rich Report');
  let code = node.parameters.functionCode;

  // Find the closing divs that come right after gauge('AI Risk', ...)
  // We need the SECOND occurrence — the one in the scores panel
  const pattern = "'</div></div></div>'";
  let idx = code.indexOf(pattern);
  let targetIdx = -1;

  while (idx !== -1) {
    const before = code.substring(Math.max(0, idx - 300), idx);
    if (before.includes('ai_risk_score')) {
      targetIdx = idx;
      break;
    }
    idx = code.indexOf(pattern, idx + 1);
  }

  if (targetIdx === -1) {
    console.log('ERROR: Could not find scores panel close in', file);
    return;
  }

  // Check if detail panel already inserted
  if (code.includes('<div id="score-detail-panel"')) {
    console.log('SKIP (detail panel already exists):', file);
    return;
  }

  // Replace '</div></div></div>' with '</div>[DETAIL_PANEL]</div></div>'
  // The three </div>s close: gauges, card, panel
  // We insert between gauges close and card close
  const replacement = "'</div>" + detailPanelHTML + "</div></div>'";
  code = code.substring(0, targetIdx) + replacement + code.substring(targetIdx + pattern.length);

  node.parameters.functionCode = code;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log('DONE: Detail panel inserted in', file);
});
