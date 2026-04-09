# Pending Tasks - April 2026

## Restrictions / Alerts
- [ ] If user types restricted food (e.g. "higado") in any text field, IA alert should block/warn
- [ ] IA alerts should also analyze manual text inputs (not just structured fields)

## Antropometria
- [ ] Pliegues Cutaneos + Perimetros + Diametros should be CONDITIONAL on "Metodo de Medicion" selection:
  - InBody → only show fields relevant to InBody
  - Bicompartimental → only pliegues + perimetros
  - Tetra/Penta → all fields
  - Medidas (Pliegues) → only pliegues
- [ ] Currently shows all fields regardless of method

## Spelling
- [ ] "Detalle Sueno y Estres" → "Detalle Sueño y Estrés" (review all spelling)

## Comidas/dia → Dynamic Horarios
- [ ] If user enters comidas_al_dia=5, show 5 time slots in "Horarios de Comidas"
- [ ] Each slot is a window: tipo de comida (desayuno/snack/almuerzo/etc) + hora
- [ ] Allow multiple desayunos, multiple snacks
- [ ] R24h auto-creates rows matching the configured slots

## R24h
- [ ] Yellow box "Horarios" → marking meal types adds them to R24h green section
- [ ] Each nutritionist can add personal favorite foods (per-user, not master DB)

## Requerimientos
- [ ] Harris-Benedict: allow free peso input (current peso)
- [ ] Composicion Corporal: add peso_objetivo field
- [ ] Use peso_objetivo in calculations when available

## Frecuencia Consumo
- [ ] Review and improve EFC display logic

## Seguimiento
- [ ] Notas de Seguimiento: add automatic recurring contact reminder
  - "Contactar cada X dias" → cron-like reminder

## Workflow
- [ ] Patient referral system (derivar a otro nutricionista/profesional)
