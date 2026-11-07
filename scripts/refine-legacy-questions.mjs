import fs from 'node:fs';
const file='content/questions-pharmacology.json';
const questions=JSON.parse(fs.readFileSync(file,'utf8'));
const updates={
 'pharm-vignette-05': {
  title:'Abdominal distension during clozapine treatment',
  prompt:'A 43-year-old man with treatment-resistant schizophrenia develops progressive abdominal distension, vomiting and several days without a bowel movement after his clozapine dose is increased. He has no previous abdominal surgery. Imaging shows diffuse bowel dilatation without a focal transition point. Which process most directly explains these findings?',
  answer:'Drug-induced suppression of intestinal motility',
  rationale:{
   'Drug-induced suppression of intestinal motility':'Clozapine-associated gastrointestinal hypomotility can progress to ileus and other dangerous bowel complications. The diffuse dilatation and absence of a transition point support impaired propulsion.',
   'Mechanical obstruction from postoperative adhesions':'There is no operative history, and the imaging does not show a focal transition point expected in mechanical obstruction.',
   'Increased intestinal chloride and water secretion':'This mechanism causes secretory diarrhea rather than constipation with impaired transit.',
   'Excessive cholinergic stimulation of intestinal smooth muscle':'Increased cholinergic activity generally increases motility; the clinical pattern suggests suppression of motility.',
   'Acute inflammatory destruction of colonic mucosa':'Inflammatory colitis more often produces diarrhea and inflammatory findings; the timing and imaging instead favor drug-associated hypomotility.'
  }
 },
 'pharm-vignette-17': {
  title:'Recurrent hypoventilation after opioid reversal',
  prompt:'A patient is brought to the emergency department after taking an excessive dose of a long-acting opioid. Intravenous naloxone rapidly improves consciousness and ventilation. During monitored observation, without further drug exposure, the respiratory rate falls again. Which pharmacologic relationship best explains this recurrence?',
  answer:'The opioid effect persists after the antagonist effect wanes',
  rationale:{
   'The opioid effect persists after the antagonist effect wanes':'Naloxone can act for less time than the opioid; respiratory depression can return, requiring ongoing monitoring and further treatment.',
   'The antagonist persists after the opioid has been eliminated':'Persistent antagonism after opioid clearance would not explain renewed opioid-induced respiratory depression.',
   'The antagonist forms an irreversible receptor complex':'Naloxone antagonism is competitive; irreversible receptor blockade would not explain this transient reversal.',
   'The antagonist is converted into an active opioid agonist':'Naloxone has no clinically relevant opioid agonist action producing this recurrence.',
   'The antagonist rapidly increases opioid-receptor expression':'Rapid receptor upregulation is not the explanation for recurrent toxicity as naloxone wears off.'
  }
 }
};
for(const [id,update] of Object.entries(updates)){
 const q=questions.find(q=>q.id===id);if(!q)throw Error(id);
 q.title=update.title;q.prompt=update.prompt;q.answer=update.answer;
 q.options=Object.keys(update.rationale);q.distractorExplanations=update.rationale;
 q.explanation=update.rationale[update.answer];
}
fs.writeFileSync(file,JSON.stringify(questions,null,2)+'\n');
console.log('Improved two legacy clinical vignettes and their alternatives.');
