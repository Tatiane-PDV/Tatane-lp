# Landing Page Template

Template base para projetos de Landing Page com estrutura padronizada e instruções de design.

## Estrutura do Projeto

```
landing-page-template/
├── .claude/
│   ├── commands/          # Slash commands customizados do Claude Code
│   └── CLAUDE.md          # Instruções e padrões do projeto para o Claude
├── skills/
│   └── frontend-design/
│       └── SKILL.md       # Skill de design frontend (cole o conteúdo aqui)
├── src/
│   ├── assets/
│   │   ├── images/        # Imagens do projeto
│   │   ├── fonts/         # Fontes locais (woff2, woff)
│   │   └── icons/         # Ícones SVG
│   ├── css/               # Folhas de estilo (main.css + módulos)
│   ├── js/                # Scripts (main.js + módulos)
│   └── components/        # Componentes reutilizáveis (hero, navbar, footer…)
├── public/                # Arquivos estáticos prontos para deploy
└── README.md
```

## Como usar este template

1. Copie esta pasta para o novo projeto e renomeie conforme o cliente
2. Cole o conteúdo da skill `frontend-design` em `skills/frontend-design/SKILL.md`
3. Atualize `README.md` com as informações do projeto
4. Inicie o desenvolvimento — o Claude seguirá automaticamente as instruções em `.claude/CLAUDE.md`

## Padrões aplicados

- HTML5 semântico
- CSS com variáveis (`--color-*`, `--font-*`, `--spacing-*`)
- Mobile-first
- Animações e micro-interações obrigatórias
- Fontes com personalidade (nunca Inter, Roboto ou Arial)
- Design único e memorável
