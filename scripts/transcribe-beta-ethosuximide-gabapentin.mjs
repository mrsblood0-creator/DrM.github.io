import fs from 'node:fs';const p='content/verified-slide-text.json',d=JSON.parse(fs.readFileSync(p));
function add(id,rows){d[id]={complete:false,reviewedAt:'2026-11-05',method:'Manually read the listed saved video frames. Duplicate slides and title animations omitted. Original visible wording retained; full-video coverage remains unverified.',sections:rows.map(([heading,n,seconds,paragraphs,bullets])=>({heading,seconds,sourceFrame:`video-frames/${id}-${n}.jpg`,paragraphs,...(bullets?{bullets}:{})}))};}
add('v0redm4vFVA',[
['Video contents',1,5,['Beta 2 adrenergic agonists'],['Classification','Administration','Mechanism of action','Therapeutic uses','Adverse effects']],
['Bronchodilators',7,35,[],['Beta 2 adrenergic agonists','Muscarinic receptor blockers: ipratropium','Xanthines: theophylline']],
['Beta adrenergic agonists classification',9,45,['Non selective Beta adrenergic agonists: e.g. adrenaline and ephedrine','Selective Beta 2 agonists:'],['SABA (short acting beta agonist): salbutamol, terbutaline (duration of action is around 3-6 hours)','LABA (long acting beta agonist): salmeterol and formoterol (duration of action is around 10 hours)','Ultra LABA: indacaterol (duration of action is around 24 hours)']],
['Administration',25,125,['Routes of administration for these medications: metered dosed inhalers, nebulizers, dry powder inhalers, orally, subcutaneously or intravenously; inhalation being the preferred route (less side effects)','In acute asthma: they are given by inhalation or IV infusion','In chronic asthma: they are given orally or by inhalation']],
['Mechanism of action',37,185,['They work on the respiratory system by Multiple mechanisms:'],['Activation of bronchial Beta 2 receptors, will lead to increase cAMP levels which lead to airway smooth muscle relaxation and bronchodilatation','Beta 2 agonists are thought to also work as anti-inflammatory on the airways by reducing intracellular adhesion molecule 1, reducing granulocyte-macrophage colony stimulating factors release and stabilizing the mast cells (less histamine release)']],
['Therapeutic uses',51,255,[],['In asthma diagnosis and treatment','In COPD']],
['Adverse effects',53,265,['Tachycardia and arrhythmia due to'],['Direct activation of cardiac beta 1 receptors (it is selective but not that selective)','In skeletal muscle blood vessels, same beta 2 receptors are present, when activated it would lead to vasodilatation => hypotension => reflex tachycardia','Tremors caused by skeletal muscle beta 2 receptors activation']],
['Adverse effects',69,345,['Tolerance with prolonged use (require temporary cessation of the drug)','Hypokalemia (due to shift of potassium from blood to cells) => they are used in treatment of hyperkalemia','Excessive sweating, anxiety, insomnia and agitation due to activation of sympathetic nervous system']]
]);
const classification=['First generation (Classic) drugs: Phenytoin; Carbamazepine; Valproic acid; Ethosuximide; Phenobarbital; Benzodiazepines','Second generation (newer) drugs: Vigabatrin; Lamotrigine; Topiramate; Levetiracetam; Gabapentin & pregabalin; Tiagabine'];
add('I6MQfP131AQ',[
['Antiepileptic drugs classification',1,5,classification],
['Overview',15,75,['Trade name: Zarontin','The least toxic antiepileptic drug','It is mainly used in treatment of absence seizures','Ethosuximide was first synthesized in 1957 and was a big help to children with absence seizures']],
['Mechanism of action',26,130,['Ethosuximide work by blocking the T type Ca+2 channels in thalamocortical neurons']],
['Therapeutic uses',34,170,['First line drug for treatment of absence seizures','It can be used as monotherapy for absence seizures, unless generalized tonic clonic seizures are associated with the absence seizures and in that case valproate is preferred']],
['Dosing',40,200,['In children'],['Starting dose is 10-15 mg/kg/day','Maintenance dose is 15-40 mg/kg/day','In adults: Starting dose is 250 mg/day and titrated up until response occur','Max dose is 1500 mg/day']],
['Adverse effects',47,235,['Ethosuximide is well tolerated and less toxic than other antiepileptic'],['GIT symptoms: abdominal pain, nausea and vomiting','Headache and dizziness','Euphoria','It may rarely lead to psychosis, depression and lupus']],
['Pharmacokinetics',56,280,['Ethosuximide is available as oral formulations in form of capsules and oral suspension','Absorption is almost complete with bioavailability of 90% and peak plasma levels reached within 3 hours after oral administration','Distribution: ethosuximide doesn’t bind to plasma proteins and readily crosses the BBB to exert its effects']],
['Pharmacokinetics',63,315,['80% of Ethosuximide dose is metabolized by the liver mainly by CYP3A4 to inactive metabolites','20% is excreted unchanged in the urine','Its half life is around 40 hours']],
['Drug interactions',69,345,['Valproic acid inhibit ethosuximide metabolism and decrease ethosuximide clearance leading to higher concentrations of the drug in the blood']],
['Contraindications',73,365,['Hypersensitivity reactions to the medications itself or to the succinimides family of medications']]
]);
add('An7F4fR0514',[
['Antiepileptic drugs classification',1,5,classification],
['Overview',16,80,['Famous trade name: Neurontin','Gabapentin is an analog of GABA, but it doesn’t work on the GABA receptors','It was discovered in 1975 by Satzinger & Hartenstein and got FDA approval for treatment of epilepsy in 1993']],
['Mechanism of action',30,150,['It doesn’t work at the GABA receptors','The precise mechanism is not fully understood, but it seem to be related to inhibiting the alpha 2 delta voltage gated calcium channels => that lead to decrease the excitatory neurotransmitters release into the synapse']],
['Therapeutic uses',49,245,['It is FDA approved for treatment of:'],['Postherpetic neuralgia (type of neuropathic pain)','Add on therapy for focal onset seizures','Moderate to severe restless leg syndrome','Off label uses: Other types of neuropathic pain: e.g. diabetic neuropathy and trigeminal neuralgia, it is NOT used for sciatica','Fibromyalgia, bipolar disorder, anxiety, mood disorders, depression, IBS, alcohol withdrawal, headache ...']],
['Adverse effects',66,330,['CNS: ataxia']],
['Adverse effects',74,370,['CNS: nystagmus']],
['Adverse effects',75,375,['Headache, tremor and dizziness','Fatigue and sleepiness','Most of these adverse effects occur initially in the start of the treatment and go away with time']],
['Adverse effects',79,395,['Rarely may lead to suicidal ideation, Steven Johnson syndrome, respiratory depression and rhabdomyolysis','Withdrawal symptoms occur after abrupt stopping of this medications, patient agitated, confused and disoriented followed by GI complaint and sweating, tremor tachycardia, hypertension and insomnia also occur','Dependence also occur with this medication']],
['Pharmacokinetics',92,460,['Gabapentin is absorbed via LAT2 amino acid transporter in the upper intestine, this absorption system is saturable, this lead to bioavailability of 80% if only 100 mg is given per dose and 60% bioavailability if 300mg given and so on','Gabapentin is not bound to plasma proteins, the full dose get distributed to body tissues including the brain']],
['Pharmacokinetics',105,525,['Gabapentin undergoes minimal metabolism','Eliminated renally with short Elimination half life of around 6 hours']],
['Dosing',109,545,['Initially start with 300 mg/ day and titrate up to 3 times per day of the same dose, max dose is 4800 mg/day','In renal impairment dose should be reduced']],
['Gabapentin toxicity',113,565,[],['Drowsiness','Sedation','Blurred vision','Slurred speech','Anxiety','Respiratory suppression','Coma and death']]
]);
fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');console.log('Added three source-frame transcriptions.');
