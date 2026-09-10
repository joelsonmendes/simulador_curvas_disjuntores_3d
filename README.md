# Simulador 3D — Curvas B, C e D

Protótipo educacional interativo para ensino de curvas de disparo de disjuntores termomagnéticos.

## Recursos incluídos

- Ambiente 3D com três disjuntores B, C e D.
- Câmera orbitável e zoom.
- Visão de corte com bimetal, bobina magnética, êmbolo e contatos.
- Corrente aplicada em múltiplos de In.
- Correntes nominais configuráveis.
- Cenários: normal, sobrecarga, partida de motor e curto-circuito virtual.
- Animação de aquecimento do bimetal.
- Animação de atuação magnética e abertura dos contatos.
- Gráfico tempo × corrente em escala logarítmica.
- Comparação B × C × D.
- Modo guiado e modo livre.
- Desafios com feedback e pontuação.
- Efeito sonoro discreto no disparo.
- Interface responsiva.

## Como executar

A aplicação usa módulos ES e Three.js com versão fixada (0.164) via CDN. O restante da interface continua carregando caso o motor 3D não esteja disponível. Execute em um servidor local:

### Python
```bash
python -m http.server 8080
```

Depois acesse:
`http://localhost:8080`

Execute o comando dentro da pasta `simulador_curvas_disjuntores_3d`.

### VS Code
Também pode usar a extensão Live Server.

## Estrutura

- `index.html` — interface principal
- `styles.css` — UI responsiva
- `src/data.js` — curvas, cargas, aulas e desafios configuráveis
- `src/physics.js` — modelo didático de disparo
- `src/graph.js` — gráfico logarítmico
- `src/threeScene.js` — cena e animações 3D
- `src/app.js` — integração da interface

## Observação técnica

As faixas B = 3–5 × In, C = 5–10 × In e D = 10–20 × In são apresentadas como referência didática.
O tempo térmico é um modelo simplificado criado para visualização educacional, não uma curva certificada de fabricante.

Para uso em projeto, coordenação ou seletividade reais, substitua os dados por curvas e tolerâncias do fabricante e pelos requisitos normativos aplicáveis.

## Evolução sugerida

A arquitetura permite incluir:
- curvas K e Z;
- diferentes fabricantes;
- curvas reais importadas por JSON;
- coordenação entre disjuntores;
- fusíveis;
- proteção de motores;
- relatórios do aluno;
- login/turmas;
- integração com LMS;
- versão PWA/offline.

## Atualização V1.1 — substituição do modelo 3D

Esta versão substitui os blocos simplificados do simulador por um modelo 3D mais técnico de disjuntor:
- carcaça mais próxima de um mini disjuntor real;
- aparência em corte com frente translúcida;
- terminais superiores e inferiores;
- alavanca mais realista;
- bobina magnética, bimetal, contatos fixo e móvel mais visíveis;
- animação visual mais próxima de um material didático técnico.

Arquivo principal alterado:
- `src/threeScene.js`
