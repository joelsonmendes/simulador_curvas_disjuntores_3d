export const CURVES = {
  B: { label:"Curva B", magMin:3, magMax:5, color:"#42b2ff",
    summary:"Indicada didaticamente para cargas com baixa corrente de partida." },
  C: { label:"Curva C", magMin:5, magMax:10, color:"#ff8a2a",
    summary:"Uso geral e cargas com corrente de partida moderada, como pequenos motores." },
  D: { label:"Curva D", magMin:10, magMax:20, color:"#d373ff",
    summary:"Tolera correntes de partida elevadas antes da atuação magnética." }
};

export const LOADS = {
  lamp: { label:"Iluminação", suggested:"B", normalMultiple:.72, startMultiple:1.1 },
  outlet: { label:"Tomadas", suggested:"C", normalMultiple:.65, startMultiple:2.0 },
  heater: { label:"Aquecedor resistivo", suggested:"B", normalMultiple:.95, startMultiple:1.05 },
  motor: { label:"Motor", suggested:"C", normalMultiple:.82, startMultiple:6.0 }
};

export const LESSONS = [
  {
    title:"Passo 1 — O que o disjuntor protege?",
    body:`<p>O disjuntor termomagnético interrompe o circuito quando a corrente ultrapassa condições aceitáveis.</p>
    <div class="callout"><strong>Duas proteções no mesmo dispositivo:</strong> a parte térmica responde ao aquecimento causado por sobrecorrente prolongada; a parte magnética responde muito rapidamente a correntes elevadas.</div>`
  },
  {
    title:"Passo 2 — Entenda a corrente nominal In",
    body:`<p><strong>In</strong> é a corrente nominal usada como referência. Se In = 16 A, então 5 × In = 80 A.</p>
    <p>Use o controle deslizante para observar como a mesma corrente relativa provoca respostas diferentes nas curvas B, C e D.</p>`
  },
  {
    title:"Passo 3 — Região térmica",
    body:`<p>Entre aproximadamente 1,13 e alguns múltiplos de In, o comportamento é dominado pelo <strong>bimetal</strong>.</p>
    <p>Quanto maior a corrente, maior o aquecimento e menor o tempo para o disparo. A curva é inversa no tempo.</p>`
  },
  {
    title:"Passo 4 — Região magnética",
    body:`<p>No simulador, a atuação magnética é representada por faixas ilustrativas: <strong>B = 3–5× In</strong>, <strong>C = 5–10× In</strong> e <strong>D = 10–20× In</strong>.</p>
    <div class="callout">Essas faixas ajudam a comparar o comportamento. Em projeto real, consulte norma, catálogo e curva tempo-corrente do fabricante.</div>`
  },
  {
    title:"Passo 5 — Compare antes de escolher",
    body:`<p>Uma carga com pico de partida pode provocar disparo indesejado se a curva for muito sensível ao pico.</p>
    <p>Por outro lado, a curva não deve ser escolhida apenas para “não desarmar”. A proteção depende da seção dos condutores, corrente de projeto, curto-circuito presumido e coordenação do sistema.</p>`
  }
];

export const CHALLENGES = [
  {
    text:"Uma carga resistiva praticamente não apresenta pico de partida. Qual curva, em um exemplo didático simples, tende a ser mais sensível a correntes elevadas?",
    answer:"B",
    why:"A curva B possui a faixa magnética ilustrativa mais baixa, de 3 a 5 × In."
  },
  {
    text:"Um motor apresenta pico de partida de aproximadamente 7 × In por um curto intervalo. Qual curva tende a ser menos suscetível a disparo magnético durante esse pico do que a curva B?",
    answer:"C",
    why:"A curva C tem faixa magnética ilustrativa de 5 a 10 × In e, em comparação didática, lida melhor com picos moderados."
  },
  {
    text:"Qual curva apresenta, no simulador, a maior faixa de disparo magnético instantâneo?",
    answer:"D",
    why:"A curva D é representada com disparo magnético entre 10 e 20 × In."
  },
  {
    text:"Em 2 × In, qual mecanismo tende a dominar o disparo de um disjuntor termomagnético?",
    answer:"T",
    why:"Nessa faixa, a atuação costuma ser associada ao aquecimento do elemento bimetálico, portanto é térmica e temporizada."
  }
];
