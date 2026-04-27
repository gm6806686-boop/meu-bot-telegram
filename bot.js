const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.BOT_TOKEN);
const GEMINI_KEY = process.env.GEMINI_KEY;

let dados = { financas: [], tarefas: [], diario: [] };

bot.start((ctx) => ctx.reply('Olá! Sou seu assistente pessoal! 🤖\n\n/ajuda - Ver comandos'));

bot.command('ajuda', (ctx) => ctx.reply(
'📋 Comandos:\n\n💰 /receita 100 Salário\n💸 /despesa 50 Mercado\n📊 /saldo\n\n✅ /tarefa Comprar pão\n📋 /tarefas\n\n📓 /diario Hoje foi bom\n\n🤖 Qualquer texto = IA responde!'
));

bot.command('saldo', (ctx) => {
  const rec = dados.financas.filter(t=>t.tipo==='receita').reduce((s,t)=>s+t.valor,0);
  const desp = dados.financas.filter(t=>t.tipo==='despesa').reduce((s,t)=>s+t.valor,0);
  ctx.reply(`💰 Receitas: R$ ${rec.toFixed(2)}\n💸 Despesas: R$ ${desp.toFixed(2)}\n💵 Saldo: R$ ${(rec-desp).toFixed(2)}`);
});

bot.command('receita', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const valor = parseFloat(args[0]);
  const desc = args.slice(1).join(' ') || 'Sem descrição';
  if (isNaN(valor)) return ctx.reply('Use: /receita 100 Salário');
  dados.financas.push({tipo:'receita',valor,desc});
  ctx.reply(`✅ Receita de R$ ${valor.toFixed(2)} adicionada!\n📝 ${desc}`);
});

bot.command('despesa', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const valor = parseFloat(args[0]);
  const desc = args.slice(1).join(' ') || 'Sem descrição';
  if (isNaN(valor)) return ctx.reply('Use: /despesa 50 Mercado');
  dados.financas.push({tipo:'despesa',valor,desc});
  ctx.reply(`💸 Despesa de R$ ${valor.toFixed(2)} registrada!\n📝 ${desc}`);
});

bot.command('tarefa', (ctx) => {
  const texto = ctx.message.text.split(' ').slice(1).join(' ');
  if (!texto) return ctx.reply('Use: /tarefa Comprar pão');
  dados.tarefas.push({texto,feito:false});
  ctx.reply(`✅ Tarefa adicionada: ${texto}`);
});

bot.command('tarefas', (ctx) => {
  const p = dados.tarefas.filter(t=>!t.feito);
  if (!p.length) return ctx.reply('🎉 Nenhuma tarefa pendente!');
  ctx.reply('📋 Tarefas:\n\n'+p.map((t,i)=>`${i+1}. ${t.texto}`).join('\n'));
});

bot.command('diario', (ctx) => {
  const texto = ctx.message.text.split(' ').slice(1).join(' ');
  if (!texto) return ctx.reply('Use: /diario Hoje foi bom');
  dados.diario.push({texto,data:new Date().toLocaleDateString('pt-BR')});
  ctx.reply(`📓 Anotação salva!\n\n"${texto}"`);
});

bot.on('text', async (ctx) => {
  await ctx.reply('🤖 Pensando...');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{parts:[{text:ctx.message.text}]}]})
    });
    const data = await res.json();
    const resposta = data.candidates[0].content.parts[0].text;
    ctx.reply(resposta);
  } catch(e) {
    ctx.reply('Erro ao conectar com a IA. Tente novamente.');
  }
});

bot.launch();
process.once('SIGINT', ()=>bot.stop('SIGINT'));
process.once('SIGTERM', ()=>bot.stop('SIGTERM'));
