import fs from 'node:fs';
const path='content/verified-slide-text.json', data=JSON.parse(fs.readFileSync(path));
const classification=['First generation (Classic) drugs: Phenytoin; Carbamazepine; Valproic acid; Ethosuximide; Phenobarbital; Benzodiazepines','Second generation (newer) drugs: Vigabatrin; Lamotrigine; Topiramate; Levetiracetam; Gabapentin & pregabalin; Tiagabine'];
function add(id,rows){data[id]={complete:false,reviewedAt:'2026-11-05',method:'Manually read the listed saved video frames. Duplicate slides and title animations omitted. Original visible wording retained; full-video coverage remains unverified.',sections:rows.map(([heading,n,seconds,paragraphs])=>({heading,seconds,sourceFrame:`video-frames/${id}-${n}.jpg`,paragraphs}))};}
add('vcWNw51yG8k',[
['Antiepileptic drugs classification',1,5,classification],
['Overview',15,75,['Famous trade name: Keppra','Broad spectrum antiepileptic and one of the most commonly prescribed antiepileptics because it has less adverse effects','Levetiracetam was first approved for medical use in 1999 in US for treatment of epilepsy']],
['Mechanism of action',25,125,['Levetiracetam binds to SV2A protein and inhibits it','SV2A is a synaptic vesicle membrane proteins, SV2A function is to help in the process of exocytosis of the excitatory neurotransmitters into the synapse','Inhibiting SV2A by the levetiracetam lead to less excitatory neurotransmitters released to the synapse']],
['Therapeutic uses',61,305,['Broad spectrum antiepileptic activity','Can be used as monotherapy or as an add on','It’s FDA approved for: Focal seizures in adults and children; Idiopathic generalized onset tonic clonic seizures; Myoclonic seizures of juvenile myoclonic epilepsy in adolescents older than 12']],
['Off-label uses',69,345,['It is used off label for: Status epilepticus; For prophylaxis against seizures in subarachnoid hemorrhage, traumatic brain injury, palliative care']],
['Adverse effects — ataxia',75,375,['CNS: ataxia']],
['Adverse effects',83,415,['Dizziness','Lack of energy','It also lead to leukopenia, eosinophilia and rarely pancytopenia']],
['Behavioral and hypersensitivity effects',87,435,['Less commonly may lead to behavioral and mood changes such as irritability, aggression, agitation, anger, psychosis, anxiety, depression and emotional liability','Rarely lead to hypersensitivity reactions in form of spreading rash progressing to SJS and TEN']],
['Pharmacokinetics',95,475,['Available as oral and intravenous formulations','Rapidly absorbed from the GI tract with 95% bioavailability, food slows absorption but doesn’t affect amount absorbed','Distribution: the drug is protein bound by 10%, the rest is distributed to body tissues']],
['Metabolism and elimination',102,510,['30% of the drug is metabolized by enzymatic hydrolysis of acetamide group in the blood (the liver has minimal role) and the rest excreted unchanged in urine','Plasma half life is around 7 hours']],
['Dosing',109,545,['IV is the same as oral dose','There is no loading dose','Adult dosing: start with 500 mg twice daily and titrate up until response occur, titration every two weeks by 250-500 mg and max dose is 3000 mg']],
['Pediatric dosing',118,590,['Pediatrics: used in children older than 5 years, start with 20 mg/kg per divided into 2 doses and titrate up by 20 mg/kg every 2 weeks, max dose is 60 mg/kg']],
['Drug interactions',123,615,['Minimal drug interactions']]
]);
add('dM8s0FL7Tlc',[
['Antiepileptic drugs classification',1,5,classification],
['Overview',15,75,['Trade name: Lamictal','It is one of the most widely prescribed antiepileptics in treatment of focal seizures','It was first used in 1990 in Ireland to treat epilepsy']],
['Mechanism of action',22,110,['It blocks voltage gated sodium channels (similar to most of the first Gen antiepileptics)','It also inhibit the presynaptic release of glutamate and aspartate']],
['Therapeutic uses',37,185,['It is effective in treatment of focal seizures (same with the carbamazepine)','It is also effective against idiopathic generalized onset tonic clonic seizures and Lennox Gastaut syndrome']],
['Other therapeutic uses',42,210,['It is also effective in treatment of Absence seizures (but not as effective as ethosuximide or valproate)','Preferred in pregnancy due to low teratogenic potential','It used off label in treatment of bipolar disorder, fibromyalgia, schizophrenia and depression']],
['Adverse effects',53,265,['Lamotrigine is generally well tolerated but it may lead to:','Headache','Nausea and vomiting']],
['Adverse effects — diplopia',55,275,['CNS: diplopia']],
['Rash and insomnia',58,290,['Skin rash (allergic) and rarely progresses to SJS (higher risk if combined with valproic acid)','Insomnia (most antiepileptics cause sedation instead)']],
['Pharmacokinetics',67,335,['Lamotrigine is well absorbed with bioavailability of 98%','Distribution: binds to proteins by 55%, the rest is distributed to the tissues especially the brain where it exert its effects, Vd is 1.2']],
['Metabolism and elimination',75,375,['It is metabolized by glucuronidation in the liver and excreted in urine','Eliminated by first order kinetics and Half life is around 24 hours']],
['Drug interactions',79,395,['Lamotrigine is commonly combined with valproate, valproate inhibits lamotrigine metabolism leading to increase of its drug levels and half life','So lamotrigine dose should be reduced if combined with valproate']]
]);
fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
console.log('Saved 24 manually checked slide sections across two lectures.');
