# Instruções do Projeto — Landing Page

## Skill Obrigatória

Antes de criar qualquer interface, componente ou layout, leia e aplique as diretrizes em:

```
skills/frontend-design/SKILL.md
```

Nunca comece a implementar uma UI sem consultar esse arquivo primeiro.

## Padrão de Código

- **HTML**: Semântico (HTML5) — use `<section>`, `<article>`, `<header>`, `<main>`, `<footer>` corretamente
- **CSS**: Variáveis CSS obrigatórias (`--color-*`, `--font-*`, `--spacing-*`), mobile-first
- **JS**: Vanilla por padrão; React apenas quando o projeto exigir reatividade complexa
- **Nenhum framework CSS genérico** (sem Bootstrap, Bulma etc.) — escreva o CSS próprio do projeto

## Design

- Designs devem ser **únicos, memoráveis e profissionais** — nunca genéricos ou "template-like"
- **Fontes proibidas**: Inter, Roboto, Arial, Helvetica, Open Sans — escolha fontes com personalidade
- **Animações e micro-interações são obrigatórias**: hovers, scroll reveals, transições suaves
- Paleta de cores definida por variáveis, com contraste acessível (WCAG AA mínimo)
- Hierarquia visual clara: tipografia expressiva + espaçamento generoso

## Estrutura de Arquivos

```
src/
  assets/     → imagens, fontes locais, ícones SVG
  css/        → estilos (main.css + módulos por seção)
  js/         → scripts (main.js + módulos)
  components/ → partes reutilizáveis (hero, navbar, footer…)
public/       → arquivos estáticos prontos para deploy
```

## Checklist antes de entregar

- [ ] Skill frontend-design aplicada
- [ ] Design único (não genérico)
- [ ] Fonte distintiva carregada
- [ ] Animações implementadas
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Variáveis CSS usadas
- [ ] HTML semântico

---

## Screenshot Workflow — Visual Validation

### Objective
After every significant UI change, Claude Code must take a screenshot of the current result
and save it to the screenshots folder for visual comparison against reference sites.

### Screenshots Folder
Create and use this folder for all screenshots:

screenshots/

Subfolders:
screenshots/progress/     → screenshots taken during development
screenshots/reference/    → reference images provided by the user

### Fresh Start on Every New Task
At the beginning of every new task or demand, Claude Code must:
1. Delete all files inside screenshots/progress/ before taking any new screenshots
2. This keeps the folder clean and relevant to the current task only
3. Never mix screenshots from different tasks or sessions
4. Run this command to clean the folder:
   ```bash
   find screenshots/progress -type f -name "*.png" -delete && echo "Screenshots cleared."
   ```
5. After clearing, confirm to the user: "Progress screenshots cleared. Starting fresh capture."

This benefits Claude Code by:
- Avoiding confusion between old and new visual states
- Keeping comparison accurate and focused on the current task
- Reducing noise when analyzing what changed
- Making the Todo workflow more reliable since screenshots always reflect current work

### When to Take Screenshots
Claude Code must take a screenshot after completing each of these:
- Navbar implementation or update
- Hero section implementation or update
- Any section added or modified
- Any bug fix that affects visual output
- Final delivery of a section or full page

### How to Take Screenshots
Use this bash command to take a screenshot of the local server:

npx playwright screenshot http://127.0.0.1:5500/landing-page-template/index.html screenshots/progress/[section-name]-[timestamp].png --viewport-size="1440,900" --full-page

If playwright is not installed, run first:
npx playwright install chromium

Alternative using pageres:
npx pageres http://127.0.0.1:5500/landing-page-template/index.html 1440x900 --filename=screenshots/progress/[section-name]

### Naming Convention
Screenshots must follow this pattern:
screenshots/progress/01-navbar.png
screenshots/progress/02-hero.png
screenshots/progress/03-especialidades.png
screenshots/progress/04-sobre.png
screenshots/progress/05-full-page.png

### Comparison Report
After taking screenshots, Claude Code must:
1. Display the screenshot path so the user can view it
2. List what matches the reference visually
3. List what still needs improvement
4. Suggest the next prompt to get closer to the reference

#### Typography Analysis
Compare these elements specifically:

**HEADINGS:**
- Font family: serif vs sans-serif vs display
- Font weight: thin (100) / light (300) / regular (400) / medium (500) / bold (700) / black (900)
- Font size: exact px or rem value
- Letter spacing: tight / normal / wide / very wide
- Line height: compressed / normal / relaxed
- Text transform: none / uppercase / lowercase / capitalize
- Color: exact token or hex value

**BODY TEXT:**
- Font family: must differ from heading font
- Font size: 14px / 16px / 18px
- Line height: ideally 1.6 to 1.8 for readability
- Color: primary text vs muted text (opacity or lighter tone)
- Paragraph spacing

**LABELS & BADGES:**
- Font size: usually 10px-12px
- Letter spacing: usually very wide (0.15em to 0.25em)
- Text transform: usually uppercase
- Font weight: usually medium (500)

**BUTTONS:**
- Font family: same as body or different
- Font size: 13px-16px
- Font weight: medium or semibold
- Letter spacing: slight tracking

**REPORT FORMAT FOR TYPOGRAPHY:**
Always include this block in the Comparison Report:

```
TYPOGRAPHY:
  Heading font: [current] vs [reference] → [match ✅ or fix needed ❌]
  Heading weight: [current] vs [reference] → [match ✅ or fix needed ❌]
  Heading size: [current] vs [reference] → [match ✅ or fix needed ❌]
  Letter spacing: [current] vs [reference] → [match ✅ or fix needed ❌]
  Body font: [current] vs [reference] → [match ✅ or fix needed ❌]
  Body size: [current] vs [reference] → [match ✅ or fix needed ❌]
  Label style: [current] vs [reference] → [match ✅ or fix needed ❌]
  Button font: [current] vs [reference] → [match ✅ or fix needed ❌]
```

> **TYPOGRAPHY RULE:**
> Never use Inter, Roboto, Arial or system-ui.
> If the reference uses Archivo, use Archivo.
> If the reference uses Cormorant, use Cormorant.
> Always load the exact font from Google Fonts or CDN before implementing.

### Reference Screenshots — Auto Capture from URL
When the user provides a reference URL, Claude Code must automatically
capture screenshots of that site and save them to screenshots/reference/

Steps to capture reference site:
1. Receive the URL from the user
2. Run this command to capture the reference:

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('REFERENCE_URL', { waitUntil: 'networkidle' });
  await page.screenshot({ 
    path: 'screenshots/reference/reference-full.png', 
    fullPage: true 
  });
  await page.screenshot({ 
    path: 'screenshots/reference/reference-viewport.png', 
    fullPage: false 
  });
  await browser.close();
  console.log('Reference captured!');
})();
"
```

3. Also capture specific sections by scrolling:
   - screenshots/reference/reference-hero.png (top of page)
   - screenshots/reference/reference-mid.png (middle of page)
   - screenshots/reference/reference-footer.png (bottom of page)

4. Confirm to user: "Reference captured from [URL]. Saved to screenshots/reference/"

5. Immediately compare reference vs current progress screenshots and report:
   - What already matches
   - What needs to be built or fixed
   - Priority order of fixes

### Reference Folder Structure
```
screenshots/
  reference/
    reference-full.png        → full page capture
    reference-viewport.png    → above the fold only
    reference-hero.png        → hero section
    reference-mid.png         → middle sections
    reference-footer.png      → footer area
  progress/
    01-navbar.png
    02-hero.png
    03-full-page.png
```

---

## Todo Workflow — Task Tracking

### Objective
For every new landing page project, Claude Code must create and maintain
a Todo list to track progress step by step, comparing against the reference
and iterating until the result matches.

### Standard Todo List for a New LP
When starting a new landing page, always create this Todo list:

- [ ] Read skills/frontend-design/SKILL.md
- [ ] Read .claude/CLAUDE.md
- [ ] Write index.html — full page clone/build
- [ ] Write screenshot.mjs — screenshot script
- [ ] Start server and take screenshots
- [ ] Compare vs reference — fix mismatches (round 1)
- [ ] Compare vs reference — fix mismatches (round 2)
- [ ] Compare vs reference — fix mismatches (round 3)
- [ ] Final screenshot — full page delivery

### Rules
- Mark each task as done [x] before moving to the next
- After each screenshot round, list what matches and what still differs
- Never skip the screenshot comparison steps
- Keep iterating comparison rounds until the result is visually close to the reference
- Share the screenshot path after each round so the user can review

### screenshot.mjs Template
Always create this file at the project root:

```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:5500/index.html');
await page.screenshot({ 
  path: 'src/assets/screenshots/progress/full-page.png', 
  fullPage: true 
});
await browser.close();
console.log('Screenshot saved!');
```

---

# Padrão de Landing Pages — Clínicas & Saúde & Beleza

## Estilo de Referência
Sites como Epidermis (epidermis.framer.website) e Klinik (klinik-template.framer.website).

## DNA Visual Obrigatório
- **Tom**: Luxury refinado. Minimalismo sofisticado. Clean mas com personalidade.
- **Paleta**: Tons neutros quentes (bege, off-white, creme, areia) + um acento escuro (preto, verde-musgo ou bordô). NUNCA cores vibrantes ou gradientes purple/blue.
- **Tipografia**: Serif elegante para headings (ex: Playfair Display, Cormorant, DM Serif Display). Sans-serif limpo para corpo (ex: DM Sans, Sora, Outfit). NUNCA Inter, Roboto ou Arial.
- **Fotos**: Placeholders com aspect-ratio fixo. Sempre descrever alt-text realista para o cliente substituir.
- **Espaçamento**: Generoso. Muito espaço em branco. Seções bem respiradas.

## Seções Padrão de uma LP de Clínica/Saúde/Beleza
1. **Navbar** — Logo + links de navegação + CTA button ("Agendar" / "Book Now")
2. **Hero** — Headline impactante + subtítulo suave + 2 CTAs + imagem/foto principal
3. **About/Founder** — Foto da especialista + mensagem pessoal + credenciais
4. **Services/Tratamentos** — Cards com nome, descrição curta, duração, preço inicial
5. **Por que nos escolher** — 4 diferenciais numerados com ícone ou número
6. **Resultados Reais** — Carrossel de before/after ou fotos de resultados
7. **Depoimentos** — Cards com foto, nome, serviço usado, avaliação em estrelas
8. **FAQ** — Accordion com 4-6 perguntas frequentes
9. **Stats/Números** — Ex: "10 anos de experiência", "500+ clientes", "4.9 estrelas"
10. **CTA Final** — Faixa escura com headline + botão de agendamento
11. **Instagram Feed** — Grid 4-6 fotos + link para perfil
12. **Footer** — Logo + links + redes sociais + horários + endereço

## Regras de Código
- HTML5 semântico com CSS custom properties (variáveis)
- Animações de entrada suaves: fade-up com `animation-delay` escalonado
- Hover states elegantes em todos os cards e botões
- Totalmente responsivo (mobile-first)
- Botões com bordas arredondadas suaves (border-radius: 4-6px), nunca pill shape exagerado
- Sempre ler a skill em `skills/frontend-design/SKILL.md` antes de escrever qualquer código

## O que NUNCA fazer
- Gradientes coloridos no hero
- Fontes genéricas (Inter, Arial, Roboto, system-ui)
- Cores vibrantes ou neon
- Sombras exageradas
- Layouts simétricos demais (sem personalidade)
- Botões com border-radius > 8px