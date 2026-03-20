const data = items[0].json;

function s(v) { const n = Number(v); return isNaN(n) ? 0 : Math.round(n); }

const cs = data.claude_scores || {};
const gs = data.gemini_scores || {};
const scoreKeys = ['overall_score', 'knowledge_score', 'critical_score', 'application_score', 'referencing_score', 'structure_score', 'ai_risk_score'];

const scores = {};
const claude_has = Object.keys(cs).length > 0;
const gemini_has = Object.keys(gs).length > 0;

for (const key of scoreKeys) {
  const cv = s(cs[key]);
  const gv = s(gs[key]);
  if (claude_has && gemini_has) {
    scores[key] = Math.round((cv + gv) / 2);
  } else if (claude_has) {
    scores[key] = cv;
  } else {
    scores[key] = gv;
  }
}

let agreement = 100;
if (claude_has && gemini_has) {
  const diffs = scoreKeys.map(k => Math.abs(s(cs[k]) - s(gs[k])));
  const avgDiff = diffs.reduce((a,b) => a+b, 0) / diffs.length;
  agreement = Math.max(0, Math.round(100 - avgDiff * 2));
}

const allIssues = [...(data.claude_issues || []), ...(data.gemini_issues || [])];
const seen = new Set();
const issues = [];
for (const issue of allIssues) {
  const key = (issue.category || '') + '|' + (issue.description || '').substring(0, 60);
  if (!seen.has(key) && issues.length < 12) {
    seen.add(key);
    issues.push(issue);
  }
}

const allStrengths = [...(data.claude_strengths || []), ...(data.gemini_strengths || [])];
const seenStr = new Set();
const strengths = [];
for (const str of allStrengths) {
  const key = (str.category || '') + '|' + (str.what_well || '').substring(0, 60);
  if (!seenStr.has(key) && strengths.length < 8) {
    seenStr.add(key);
    strengths.push(str);
  }
}

const reference_audit = (data.gemini_reference_audit || []).length >= (data.claude_reference_audit || []).length
  ? (data.gemini_reference_audit || [])
  : (data.claude_reference_audit || []);

const summary = (data.gemini_summary || '').length > (data.claude_summary || '').length
  ? (data.gemini_summary || '')
  : (data.claude_summary || '');

const subject = data.subject || 'Academic Paper';
const overall = scores.overall_score || 0;
const scoreColor = overall >= 75 ? '#22c55e' : overall >= 60 ? '#f59e0b' : overall >= 50 ? '#fb923c' : '#ef4444';
const gradeLabel = overall >= 75 ? 'DISTINCTION' : overall >= 65 ? 'MERIT' : overall >= 50 ? 'PASS' : 'AT RISK';
const modelsUsed = (claude_has && gemini_has) ? 'Claude + Gemini' : claude_has ? 'Claude' : 'Gemini';

const criticalCount = issues.filter(i => i.severity === 'critical').length;
const importantCount = issues.filter(i => i.severity === 'important').length;
const polishCount = issues.filter(i => i.severity === 'polish').length;
const refMismatches = reference_audit.filter(r => !r.matched).length;
const refTotal = reference_audit.length;

function gauge(label, score, size) {
  size = size || 90;
  var c = score >= 75 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 50 ? '#fb923c' : '#ef4444';
  var key = label.toLowerCase().replace(/\s+/g, '-');
  var grade = score >= 75 ? 'Distinction' : score >= 60 ? 'Merit' : score >= 50 ? 'Pass' : 'At Risk';
  return '<div class="gauge-item" style="text-align:center;flex:1;min-width:120px;margin:8px;cursor:pointer;transition:transform 0.15s" onclick="toggleScoreDetail(\'' + key + '\')" title="Click for details">' +
    '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;margin:0 auto">' +
    '<svg viewBox="0 0 36 36" style="width:' + size + 'px;height:' + size + 'px;transform:rotate(-90deg)">' +
    '<circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" stroke-width="3"/>' +
    '<circle cx="18" cy="18" r="15.9" fill="none" stroke="' + c + '" stroke-width="3" stroke-dasharray="' + score + ' ' + (100-score) + '" stroke-linecap="round"/>' +
    '</svg>' +
    '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:18px;font-weight:700;color:' + c + '">' + score + '</div>' +
    '</div>' +
    '<div style="margin-top:6px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">' + label + '</div>' +
    '<div style="font-size:9px;color:#64748b;margin-top:2px">' + grade + '</div></div>';
}

function badge(sev) {
  const colors = { critical: '#ef4444', important: '#f59e0b', polish: '#3b82f6' };
  return '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:white;background:' + (colors[sev] || '#64748b') + '">' + (sev || '').toUpperCase() + '</span>';
}

let issueRows = '';
for (const i of issues) {
  const desc = (i.description || i.what_issue || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const rec = (i.recommendation || i.how_to_fix || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const before = i.example_before ? '<div style="background:#1a0a0a;padding:8px;border-radius:4px;margin:4px 0;font-size:12px;color:#fca5a5;border-left:3px solid #ef4444">' + (i.example_before || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;') + '</div>' : '';
  const after = i.example_after ? '<div style="background:#0a1a0a;padding:8px;border-radius:4px;margin:4px 0;font-size:12px;color:#86efac;border-left:3px solid #22c55e">' + (i.example_after || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;') + '</div>' : '';
  issueRows += '<tr><td style="padding:10px;border-bottom:1px solid #1e293b;white-space:nowrap;vertical-align:top">' + (i.where_in_paper || '') + '</td>' +
    '<td style="padding:10px;border-bottom:1px solid #1e293b;vertical-align:top">' + badge(i.severity) + '</td>' +
    '<td style="padding:10px;border-bottom:1px solid #1e293b;vertical-align:top">' + desc + before + after + '</td>' +
    '<td style="padding:10px;border-bottom:1px solid #1e293b;vertical-align:top;color:#22d3ee">' + rec + '</td></tr>';
}

let strengthCards = '';
for (const st of strengths) {
  strengthCards += '<div style="padding:12px 16px;margin:8px 0;background:#0a1a0a;border-left:3px solid #22c55e;border-radius:6px">' +
    '<strong style="color:#22c55e">' + (st.where_in_paper || st.category || '') + '</strong>' +
    '<div style="color:#cbd5e1;margin-top:4px">' + (st.what_well || '') + '</div></div>';
}

let refRows = '';
for (const r of reference_audit) {
  const matchIcon = r.matched ? '<span style="color:#22c55e;font-weight:bold">&#10003; YES</span>' : '<span style="color:#ef4444;font-weight:bold">&#10007; NO</span>';
  const issueText = r.issue_type ? '<span style="color:#f59e0b">' + r.issue_type.replace(/_/g, ' ') + '</span>' : '<span style="color:#475569">&mdash;</span>';
  refRows += '<tr><td style="padding:8px;border-bottom:1px solid #1e293b">' + ((r.citation || '').substring(0, 80)) + '</td>' +
    '<td style="padding:8px;border-bottom:1px solid #1e293b">' + (r.source_type || '') + '</td>' +
    '<td style="padding:8px;border-bottom:1px solid #1e293b">' + matchIcon + '</td>' +
    '<td style="padding:8px;border-bottom:1px solid #1e293b">' + issueText + '</td></tr>';
}

let comparisonRows = '';
if (claude_has && gemini_has) {
  const labels = ['Overall', 'Knowledge', 'Critical', 'Application', 'Referencing', 'Structure', 'AI Risk'];
  for (let idx = 0; idx < scoreKeys.length; idx++) {
    const cv = s(cs[scoreKeys[idx]]);
    const gv = s(gs[scoreKeys[idx]]);
    const avg = scores[scoreKeys[idx]];
    const diff = Math.abs(cv - gv);
    const diffColor = diff <= 5 ? '#22c55e' : diff <= 15 ? '#f59e0b' : '#ef4444';
    comparisonRows += '<tr><td style="padding:8px;border-bottom:1px solid #1e293b;font-weight:600">' + labels[idx] + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #1e293b;text-align:center">' + cv + '%</td>' +
      '<td style="padding:8px;border-bottom:1px solid #1e293b;text-align:center">' + gv + '%</td>' +
      '<td style="padding:8px;border-bottom:1px solid #1e293b;text-align:center;font-weight:700;color:#fbbf24">' + avg + '%</td>' +
      '<td style="padding:8px;border-bottom:1px solid #1e293b;text-align:center;color:' + diffColor + '">' + diff + '</td></tr>';
  }
}

const reportHTML = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>BeeGraded Report</title>' +
var cssBlock = ['<style>',
  '*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Segoe UI",system-ui,-apple-system,sans-serif;background:#0a0e1a;color:#e2e8f0;line-height:1.6}',
  '.cover{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#312e81 70%,#4f46e5 100%);padding:50px 30px;text-align:center;position:relative;overflow:hidden}',
  '.cover::before{content:"";position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(251,191,36,0.08) 0%,transparent 50%)}',
  '.cover h1{font-size:36px;font-weight:800;background:linear-gradient(135deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}',
  '.cover .sub{font-size:16px;color:#94a3b8;margin-bottom:20px}.cover .sbadge{display:inline-block;padding:6px 20px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);border-radius:20px;color:#fbbf24;font-weight:600;font-size:14px;margin-bottom:16px}',
  '.tabs{display:flex;flex-wrap:wrap;border-bottom:2px solid #1e293b;background:#0f172a;padding:0 16px;position:sticky;top:0;z-index:10}',
  '.tab{padding:12px 20px;cursor:pointer;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.2s}',
  '.tab:hover{color:#94a3b8}.tab.active{color:#fbbf24;border-bottom-color:#fbbf24}.panel{display:none;max-width:960px;margin:0 auto;padding:24px 20px}',
  '.panel.active{display:block}.card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:16px}',
  '.gauges{display:flex;flex-wrap:wrap;justify-content:center;gap:4px}table{width:100%;border-collapse:collapse;font-size:13px}',
  'th{padding:10px 8px;text-align:left;background:#1e293b;color:#fbbf24;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}',
  'td{color:#cbd5e1}.summary{white-space:pre-wrap;color:#cbd5e1;font-size:14px;line-height:1.8}.stat-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px}',
  '.stat{flex:1;min-width:140px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;text-align:center}',
  '.stat .val{font-size:28px;font-weight:800}.stat .lbl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px}',
  '.ai-badge{display:inline-block;padding:4px 12px;background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);border-radius:6px;color:#a78bfa;font-size:12px;font-weight:600;margin-top:12px}',
  '.footer{text-align:center;padding:24px;color:#475569;font-size:11px;border-top:1px solid #1e293b;margin-top:30px}',
  '@media print{.tabs{display:none}.panel{display:block' + '!important}body{background:white;color:#1e293b}',
  '.card{border-color:#e2e8f0}.cover{background:#1e293b' + '!important}}@media(max-width:640px){.tab{padding:10px 12px;font-size:11px}',
  '.gauges>div{min-width:80px}}.gauge-item:hover{transform:scale(1.1)}.gauge-item:active{transform:scale(0.95)}',
  '#score-detail-panel{animation:sdSlide 0.25s ease}@keyframes sdSlide{from{opacity:0;transform:translateY(-10px)}',
  'to{opacity:1;transform:translateY(0)}}',
  '</style></head><body>'
].join('');

var html = cssBlock +
'<div class="cover">' +
'<div class="sbadge">' + subject + '</div>' +
'<h1>BeeGraded</h1>' +
'<div class="sub">Assessment Evaluation Report</div>' +
'<div style="display:inline-block;width:110px;height:110px;position:relative;margin-top:10px">' +
'<svg viewBox="0 0 36 36" style="width:110px;height:110px;transform:rotate(-90deg)">' +
'<circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>' +
'<circle cx="18" cy="18" r="15.9" fill="none" stroke="' + scoreColor + '" stroke-width="3" stroke-dasharray="' + overall + ' ' + (100-overall) + '" stroke-linecap="round"/>' +
'</svg>' +
'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">' +
'<div style="font-size:26px;font-weight:800;color:' + scoreColor + '">' + overall + '</div>' +
'<div style="font-size:9px;color:#94a3b8;letter-spacing:1px">' + gradeLabel + '</div></div></div>' +
'<div class="ai-badge">Evaluated by ' + modelsUsed + ' &bull; ' + agreement + '% agreement</div>' +
'</div>' +

'<div class="tabs">' +
'<div class="tab active" onclick="switchTab(0)">Overview</div>' +
'<div class="tab" onclick="switchTab(1)">Scores</div>' +
'<div class="tab" onclick="switchTab(2)">Issues (' + issues.length + ')</div>' +
'<div class="tab" onclick="switchTab(3)">Strengths</div>' +
'<div class="tab" onclick="switchTab(4)">References</div>' +
(claude_has && gemini_has ? '<div class="tab" onclick="switchTab(5)">AI Models</div>' : '') +
'</div>' +

'<div class="panel active" id="panel-0">' +
'<div class="stat-row">' +
'<div class="stat"><div class="val" style="color:' + scoreColor + '">' + overall + '%</div><div class="lbl">Overall Score</div></div>' +
'<div class="stat"><div class="val" style="color:#ef4444">' + criticalCount + '</div><div class="lbl">Critical Issues</div></div>' +
'<div class="stat"><div class="val" style="color:#f59e0b">' + importantCount + '</div><div class="lbl">Important Issues</div></div>' +
'<div class="stat"><div class="val" style="color:#3b82f6">' + refMismatches + '/' + refTotal + '</div><div class="lbl">Ref Mismatches</div></div>' +
'</div>' +
'<div class="card"><h3 style="color:#fbbf24;margin-bottom:12px;font-size:16px">Executive Summary</h3><div class="summary">' + summary + '</div></div>' +
'</div>' +

'<div class="panel" id="panel-1">' +
'<div class="card"><div class="gauges">' +
gauge('Overall', scores.overall_score) +
gauge('Knowledge', scores.knowledge_score) +
gauge('Critical', scores.critical_score) +
gauge('Application', scores.application_score) +
gauge('Referencing', scores.referencing_score) +
gauge('Structure', scores.structure_score) +
gauge('AI Risk', scores.ai_risk_score) +
'</div></div></div>' +

'<div class="panel" id="panel-2">' +
'<div class="card" style="overflow-x:auto"><table>' +
'<tr><th>Location</th><th>Severity</th><th>Issue &amp; Example</th><th>How to Fix</th></tr>' +
(issueRows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#64748b">No issues found</td></tr>') +
'</table></div></div>' +

'<div class="panel" id="panel-3">' +
'<div class="card">' +
(strengthCards || '<div style="text-align:center;padding:20px;color:#64748b">No specific strengths highlighted</div>') +
'</div></div>' +

'<div class="panel" id="panel-4">' +
'<div class="card" style="overflow-x:auto"><table>' +
'<tr><th>Citation</th><th>Type</th><th>Matched</th><th>Issue</th></tr>' +
(refRows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#64748b">No references audited</td></tr>') +
'</table></div></div>' +

(claude_has && gemini_has ? '<div class="panel" id="panel-5">' +
'<div class="card"><h3 style="color:#fbbf24;margin-bottom:12px;font-size:16px">Model Comparison &mdash; Claude vs Gemini</h3>' +
'<p style="color:#94a3b8;font-size:13px;margin-bottom:16px">Both AI models evaluated independently. Final scores are averaged. Agreement: <strong style="color:#fbbf24">' + agreement + '%</strong></p>' +
'<table><tr><th>Criterion</th><th style="text-align:center">Claude</th><th style="text-align:center">Gemini</th><th style="text-align:center">Average</th><th style="text-align:center">Diff</th></tr>' +
comparisonRows +
'</table></div></div>' : '') +

'<div class="footer">BeeGraded &mdash; Dual AI Evaluation (' + modelsUsed + ') &mdash; Generated ' + new Date().toISOString().split('T')[0] + '</div>' +

'<script>function toggleScoreDetail(key){var p=document.getElementById('score-detail-panel');if(!p)return;if(!key||p.dataset.active===key){p.style.display='none';p.dataset.active='';return;}var d={'overall':['Combined score across all evaluation criteria. This represents the overall quality of your paper.','Focus on improving your weakest scoring areas to lift your overall grade. Check the other dials to find where you lost the most marks.'],'knowledge':['Measures how well you demonstrate understanding of subject matter, key concepts, theories, and course content.','Reference specific theories and frameworks by name. Show you have read beyond the textbook by citing journal articles or case studies.'],'critical':['Evaluates your analytical thinking, how you assess arguments, and whether you use evidence-based reasoning.','Do not just describe \u2014 analyse WHY something matters. Compare different viewpoints, question assumptions, and weigh evidence for and against.'],'application':['Assesses how you connect theory to practice, use relevant examples, and demonstrate real-world understanding.','Use concrete, specific examples. Show how a concept plays out in a real scenario relevant to your field or the South African context.'],'referencing':['Checks citation format, bibliography consistency, in-text vs reference-list matching, and source attribution.','Every in-text citation must have a matching reference-list entry (and vice versa). Follow your required format (APA 7, Harvard) consistently throughout.'],'structure':['Looks at logical flow, paragraph organisation, topic sentences, and the quality of your introduction and conclusion.','Each paragraph should have one clear main idea with a topic sentence. Your introduction should preview the argument; your conclusion should summarise it.'],'ai-risk':['Estimates the likelihood that the content was AI-generated. A LOWER score here is better \u2014 it means your writing appears more authentically human.','Write in your own voice. Include personal analysis, examples from your lectures or tutorials, and unique perspectives that only you would have.']};var info=d[key]||['',''];var score=0;document.querySelectorAll('.gauge-item').forEach(function(g){var oc=g.getAttribute('onclick')||'';if(oc.indexOf("'"+key+"'")>-1){var t=g.querySelector('div[style*="font-weight:700"]');if(t)score=parseInt(t.textContent);}});var c=score>=75?'#22c55e':score>=60?'#f59e0b':score>=50?'#fb923c':'#ef4444';var gl=score>=75?'Distinction (75-100%)':score>=60?'Merit (60-74%)':score>=50?'Pass (50-59%)':'At Risk (0-49%)';var nm=key.replace(/-/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase()});document.getElementById('sd-dot').style.background=c;document.getElementById('sd-title').textContent=nm+' \u2014 '+score+'%';document.getElementById('sd-title').style.color=c;document.getElementById('sd-grade').innerHTML='<span style="color:'+c+';font-weight:600">'+gl+'</span>';document.getElementById('sd-desc').textContent=info[0];document.getElementById('sd-fill').style.width=score+'%';document.getElementById('sd-fill').style.background=c;document.getElementById('sd-tips').innerHTML='<div style="font-size:11px;color:#fbbf24;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">How to improve</div><div style="color:#cbd5e1;font-size:13px;line-height:1.6">'+info[1]+'</div>';p.style.display='block';p.dataset.active=key;p.scrollIntoView({behavior:'smooth',block:'nearest'});}function switchTab(n){document.querySelectorAll(".tab").forEach(function(t,i){t.classList.toggle("active",i===n)});document.querySelectorAll(".panel").forEach(function(p,i){p.classList.toggle("active",i===n)})}</script>' +
'</body></html>';

return [{
  json: {
    paper_id: data.paper_id,
    subject: data.subject,
    mode: data.mode,
    scores: scores,
    issues: issues,
    strengths: strengths,
    reference_audit: reference_audit,
    summary: summary,
    report_html: reportHTML,
    models_used: modelsUsed,
    agreement: agreement,
    claude_scores: cs,
    gemini_scores: gs
  }
}];