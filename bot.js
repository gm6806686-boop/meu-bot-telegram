const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

let dados = { financas: [], tarefas: [], diario: [] };

bot.start((ctx) => ctx.reply('Olá! Sou seu assistente pessoal! 🤖\n\nComandos disponíveis:\n/ajuda - Ver todos os comandos'));

bot.help((ctx) => ctx.reply(
'📋 Comandos disponíveis:\n\n' +
'💰 FINANÇAS:\n' +
'/receita [valor] [descrição]\n' +
'/despesa [valor] [descrição]\n' +
'/saldo - Ver saldo atual\n\n' +
'✅ TAREFAS:\n' +
'/tarefa [texto] - Adicionar tarefa\n' +
'/tarefas - Ver tarefas pendentes\n\n' +
'📓 DIÁRIO:\n' +
'/diario [texto] - Salvar anotação\n\n' +
'🤖 IA:\n' +
'Qualquer mensagem - Conversar com IA'
));

bot.command('saldo', (ctx) => {
  const receitas = dados.financas.filter(t => t.tipo === 'receita').reduce((s,t) => s+t.valor, 0);
  const despesas = dados.financas.filter(t => t.tipo === 'despesa').reduce((s,t) => s+t.valor, 0);
  ctx.reply(`💰 Resumo financeiro:\n\n✅ Receitas: R$ ${receitas.toFixed(2)}\n❌ Despesas: R$ ${despesas.toFixed(2)}\n💵 Saldo: R$ ${(receitas-despesas).toFixed(2)}`);
});

bot.command('receita', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const valor = parseFloat(args[0]);
  const desc = args.slice(1).join(' ') || 'Sem descrição';
  if (isNaN(valor)) return ctx.reply('Use: /receita 100 Salário');
  dados.financas.push({ tipo: 'receita', valor, desc, data: new Date().toLocaleDateString('pt-BR') });
  ctx.reply(`✅ Receita de R$ ${valor.toFixed(2)} adicionada!\n📝 ${desc}`);
});

bot.command('despesa', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const valor = parseFloat(args[0]);
  const desc = args.slice(1).join(' ') || 'Sem descrição';
  if (isNaN(valor)) return ctx.reply('Use: /despesa 50 Mercado');
  dados.financas.push({ tipo: 'despesa', valor, desc, data: new Date().toLocaleDateString('pt-BR') });
  ctx.reply(`❌ Despesa de R$ ${valor.toFixed(2)} registrada!\n📝 ${desc}`);
});

bot.command('tarefa', (ctx) => {
  const texto = ctx.message.text.split(' ').slice(1).join(' ');
  if (!texto) return ctx.reply('Use: /tarefa Comprar pão');
  dados.tarefas.push({ texto, feito: false });
  ctx.reply(`✅ Tarefa adicionada:\n📌 ${texto}`);
});

bot.command('tarefas', (ctx) => {
  const pendentes = dados.tarefas.filter(t => !t.feito);
  if (pendentes.length === 0) return ctx.reply('🎉 Nenhuma tarefa pendente!');
  ctx.reply('📋 Tarefas pendentes:\n\n' + pendentes.map((t,i) => `${i+1}. ${t.texto}`).join('\n'));
});

bot.command('diario', (ctx) => {
  const texto = ctx.message.text.split(' ').slice(1).join(' ');
  if (!texto) return ctx.reply('Use: /diario Hoje foi um bom dia');
  dados.diario.push({ texto, data: new Date().toLocaleDateString('pt-BR') });
  ctx.reply(`📓 Anotação salva!\n\n"${texto}"`);
});

bot.on('text', async (ctx) => {
  ctx.reply('🤖 Processando...');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: ctx.message.text }] })
    });
    const data = await res.json();
    ctx.reply(data.content[0].text);
  } catch(e) {
    ctx.reply('Erro ao conectar com a IA. Tente novamente.');
  }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
