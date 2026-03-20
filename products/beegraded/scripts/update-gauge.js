/**
 * Temporary script — updates gauge() in n8n workflow JSON files
 * to make score dials clickable with detail panels.
 * Run once, then delete this file.
 */
const fs = require('fs');
const path = require('path');

const workflowDir = path.join(__dirname, '..', 'n8n-workflows');

const files = [
  { file: 'workflow-quick-evaluate.json', node: 'Build Report' },
  { file: 'workflow-evaluate.json', node: 'Build Rich Report' },
];

// --- New gauge function (generates clickable dials) ---
const newGaugeFn = `function gauge(label, score, size) {
  size = size || 90;
  var c = score >= 75 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 50 ? '#fb923c' : '#ef4444';
  var key = label.toLowerCase().replace(/\\s+/g, '-');
  var grade = score >= 75 ? 'Distinction' : score >= 60 ? 'Merit' : score >= 50 ? 'Pass' : 'At Risk';
  return '<div class="gauge-item" style="text-align:center;flex:1;min-width:120px;margin:8px;cursor:pointer;transition:transform 0.15s" onclick="toggleScoreDetail(\\'' + key + '\\')" title="Click for details">' +
    '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;margin:0 auto">' +
    '<svg viewBox="0 0 36 36" style="width:' + size + 'px;height:' + size + 'px;transform:rotate(-90deg)">' +
    '<circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" stroke-width="3"/>' +
    '<circle cx="18" cy="18" r="15.9" fill="none" stroke="' + c + '" stroke-width="3" stroke-dasharray="' + score + ' ' + (100-score) + '" stroke-linecap="round"/>' +
    '</svg>' +
    '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:18px;font-weight:700;color:' + c + '">' + score + '</div>' +
    '</div>' +
    '<div style="margin-top:6px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">' + label + '</div>' +
    '<div style="font-size:9px;color:#64748b;margin-top:2px">' + grade + '</div></div>';
}`;

// --- Detail panel HTML (inserted after gauges container in panel-1) ---
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

// --- CSS additions ---
const extraCSS =
  '.gauge-item:hover{transform:scale(1.1)}' +
  '.gauge-item:active{transform:scale(0.95)}' +
  '#score-detail-panel{animation:sdSlide 0.25s ease}' +
  '@keyframes sdSlide{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}';

// --- toggleScoreDetail JS function ---
const toggleScoreDetailFn = `function toggleScoreDetail(key){` +
  `var p=document.getElementById('score-detail-panel');if(!p)return;` +
  `if(!key||p.dataset.active===key){p.style.display='none';p.dataset.active='';return;}` +
  `var d={` +
  `'overall':['Combined score across all evaluation criteria. This represents the overall quality of your paper.','Focus on improving your weakest scoring areas to lift your overall grade. Check the other dials to find where you lost the most marks.'],` +
  `'knowledge':['Measures how well you demonstrate understanding of subject matter, key concepts, theories, and course content.','Reference specific theories and frameworks by name. Show you have read beyond the textbook by citing journal articles or case studies.'],` +
  `'critical':['Evaluates your analytical thinking, how you assess arguments, and whether you use evidence-based reasoning.','Do not just describe \\u2014 analyse WHY something matters. Compare different viewpoints, question assumptions, and weigh evidence for and against.'],` +
  `'application':['Assesses how you connect theory to practice, use relevant examples, and demonstrate real-world understanding.','Use concrete, specific examples. Show how a concept plays out in a real scenario relevant to your field or the South African context.'],` +
  `'referencing':['Checks citation format, bibliography consistency, in-text vs reference-list matching, and source attribution.','Every in-text citation must have a matching reference-list entry (and vice versa). Follow your required format (APA 7, Harvard) consistently throughout.'],` +
  `'structure':['Looks at logical flow, paragraph organisation, topic sentences, and the quality of your introduction and conclusion.','Each paragraph should have one clear main idea with a topic sentence. Your introduction should preview the argument; your conclusion should summarise it.'],` +
  `'ai-risk':['Estimates the likelihood that the content was AI-generated. A LOWER score here is better \\u2014 it means your writing appears more authentically human.','Write in your own voice. Include personal analysis, examples from your lectures or tutorials, and unique perspectives that only you would have.']` +
  `};` +
  `var info=d[key]||['',''];` +
  `var score=0;document.querySelectorAll('.gauge-item').forEach(function(g){` +
  `var oc=g.getAttribute('onclick')||'';if(oc.indexOf(\"'\"+key+\"'\")>-1){` +
  `var t=g.querySelector('div[style*=\"font-weight:700\"]');if(t)score=parseInt(t.textContent);}});` +
  `var c=score>=75?'#22c55e':score>=60?'#f59e0b':score>=50?'#fb923c':'#ef4444';` +
  `var gl=score>=75?'Distinction (75-100%)':score>=60?'Merit (60-74%)':score>=50?'Pass (50-59%)':'At Risk (0-49%)';` +
  `var nm=key.replace(/-/g,' ').replace(/\\b\\w/g,function(c){return c.toUpperCase()});` +
  `document.getElementById('sd-dot').style.background=c;` +
  `document.getElementById('sd-title').textContent=nm+' \\u2014 '+score+'%';` +
  `document.getElementById('sd-title').style.color=c;` +
  `document.getElementById('sd-grade').innerHTML='<span style=\"color:'+c+';font-weight:600\">'+gl+'</span>';` +
  `document.getElementById('sd-desc').textContent=info[0];` +
  `document.getElementById('sd-fill').style.width=score+'%';` +
  `document.getElementById('sd-fill').style.background=c;` +
  `document.getElementById('sd-tips').innerHTML='<div style=\"font-size:11px;color:#fbbf24;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px\">How to improve</div><div style=\"color:#cbd5e1;font-size:13px;line-height:1.6\">'+info[1]+'</div>';` +
  `p.style.display='block';p.dataset.active=key;` +
  `p.scrollIntoView({behavior:'smooth',block:'nearest'});}`;

for (const { file, node: nodeName } of files) {
  const filePath = path.join(workflowDir, file);
  if (!fs.existsSync(filePath)) {
    console.log('SKIP (not found):', file);
    continue;
  }

  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const reportNode = json.nodes.find(n => n.name === nodeName);
  if (!reportNode) {
    console.log('SKIP (node not found):', file, '→', nodeName);
    continue;
  }

  let code = reportNode.parameters.functionCode;

  // 1. Replace the gauge function
  const gaugeRegex = /function gauge\(label, score, size\) \{[\s\S]*?<\/div><\/div>';\n\}/;
  if (!gaugeRegex.test(code)) {
    console.log('WARNING: gauge function not matched in', file);
    continue;
  }
  code = code.replace(gaugeRegex, newGaugeFn);

  // 2. Insert detail panel after the gauges closing div in panel-1
  //    Pattern: gauge('AI Risk', ...) + '\n\'</div></div></div>\''
  //    The three </div> close: gauges, card, panel
  //    We insert the detail panel between gauges close and card close
  //    So change '</div></div></div>' to '</div>' + detailPanel + '</div></div>'
  const oldGaugesClose = "'</div></div></div>' +";
  const panelIdx = code.indexOf(oldGaugesClose);
  if (panelIdx === -1) {
    console.log('WARNING: gauges close pattern not found in', file);
  } else {
    // Make sure this is the one in panel-1 (scores), not elsewhere
    // It should come right after gauge('AI Risk', ...)
    const beforeClose = code.substring(Math.max(0, panelIdx - 100), panelIdx);
    if (beforeClose.includes('ai_risk_score') || beforeClose.includes('AI Risk')) {
      code = code.substring(0, panelIdx) +
        "'" + detailPanelHTML + "</div></div></div>' +" +
        code.substring(panelIdx + oldGaugesClose.length);
    } else {
      console.log('WARNING: gauges close found but not after AI Risk gauge in', file);
    }
  }

  // 3. Add extra CSS before </style>
  const styleClose = "'</style>";
  const styleIdx = code.indexOf(styleClose);
  if (styleIdx !== -1) {
    code = code.substring(0, styleIdx) + extraCSS + code.substring(styleIdx);
  }

  // 4. Add toggleScoreDetail to the script block
  const oldScript = "function switchTab(n)";
  const scriptIdx = code.indexOf(oldScript);
  if (scriptIdx !== -1) {
    code = code.substring(0, scriptIdx) + toggleScoreDetailFn + oldScript + code.substring(scriptIdx + oldScript.length);
  }

  reportNode.parameters.functionCode = code;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  console.log('DONE:', file);
}

console.log('\nAll workflows updated. Delete this script when verified.');
