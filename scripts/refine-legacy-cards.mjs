// Targeted editorial corrections; preserve IDs so existing review schedules survive.
import fs from 'node:fs';
const file='content/flashcards-clinical.json';
const cards=JSON.parse(fs.readFileSync(file,'utf8'));
const changes={
  'clinical-SpjIi-cbawo-1': ['During bedside airway assessment, what does gurgling suggest?', 'Liquid or secretions in the upper airway.', 'Blood, vomit or secretions can produce gurgling as air passes through them. Assess patency and the ability to clear or protect the airway promptly.'],
  'clinical-SpjIi-cbawo-2': ['What does inspiratory stridor suggest during an airway assessment?', 'Upper-airway narrowing or obstruction.', 'Turbulent airflow through a narrowed upper airway produces this sound. Acute stridor with distress requires urgent assessment.'],
  'clinical-eWjC_Y3rUZQ-1': ['Does an inability to speak always establish airway obstruction?', 'No. Altered consciousness or impaired language function can also prevent speech.', 'Combine speech with breathing effort, airflow, airway sounds and examination; a single observation does not establish airway patency.'],
  'clinical-eWjC_Y3rUZQ-2': ['What can crepitus in the neck or upper chest indicate during resuscitation?', 'Air in the soft tissues, potentially from pneumothorax or tracheolaryngeal injury.', 'This finding should prompt evaluation for the underlying injury rather than being treated as proof of uncomplicated airway patency.'],
};
for(const card of cards){
  if(!changes[card.id])continue;
  [card.front,card.back,card.explanation]=changes[card.id];
  card.references=[{title:'Stabilization of the acutely ill patient — SAEM',url:'https://www.saem.org/about-saem/academies-interest-groups-affiliates2/cdem/for-students/online-education/m3-curriculum/group-stabilization-of-the-acutely-ill-patient/stabilization-of-the-acutely-ill-patient'}];
}
for(const id of Object.keys(changes))if(!cards.some(c=>c.id===id))throw Error('Missing card '+id);
fs.writeFileSync(file,JSON.stringify(cards,null,2)+'\n');
console.log('Refined four duplicated legacy flashcards; existing IDs preserved.');
