import fs from 'node:fs';
// Shared answer dictionaries keep comparison explanations editable in one place.
// Cases and recall prompts are authored explicitly by lecture; no random text generation.
export function publish(name, groups, pools) {
  const questions=[],flashcards=[];
  for (const g of groups) {
    if(g.rows.length!==5) throw Error(`${g.id}: expected five authored objectives`);
    const references=[{title:'Lecture and supplied source presentation',url:`https://www.youtube.com/watch?v=${g.id}`},...(g.refs||[]).map(url=>({title:'Clinical reference',url}))];
    g.rows.forEach(([poolName,key,prompt,front,caseExplanation],i)=>{
      const pool=pools[poolName];
      if(!pool?.[key]) throw Error(`${g.id}: unknown answer ${poolName}/${key}`);
      const [answer,defaultExplanation]=pool[key];
      const explanation=caseExplanation||defaultExplanation;
      const wrong=Object.entries(pool).filter(([k])=>k!==key).slice(0,4).map(([,v])=>v);
      const options=[answer,...wrong.map(v=>v[0])];
      options.push(...options.splice(0,(i+g.id.charCodeAt(0))%5));
      if(prompt.split(/\s+/).length<30) throw Error(`${g.id} row ${i+1}: short case (${prompt.split(/\s+/).length})`);
      const id=`reviewed-${name}-${g.id}-${i+1}`;
      questions.push({id,lectureId:g.id,title:`${g.title}: ${i+1}`,prompt,options,answer,explanation,distractorExplanations:Object.fromEntries([[answer,explanation],...wrong.map(([a,e])=>[a,`${e} This does not best answer the specific question in this case.`])]),references,provenance:'Original educational case; not copied from a commercial examination bank.'});
      flashcards.push({id:id+'-fc',lectureId:g.id,front,back:answer,explanation,references});
    });
  }
  for(const [kind,items] of [['questions',questions],['flashcards',flashcards]]) fs.writeFileSync(`content/${kind}-reviewed-${name}.json`,JSON.stringify(items,null,2)+'\n');
  console.log(`${name}: ${groups.length} lectures, ${questions.length} questions, ${flashcards.length} flashcards`);
}
