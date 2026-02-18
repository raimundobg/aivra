# BiteTrack - Control de Versiones

## Como usar este archivo

Cada vez que hagamos cambios importantes, se documenta aqui:
- **Que se cambio** y por que
- **Commit de referencia** para poder volver atras si algo falla
- **Archivos afectados**

### Comandos utiles de git

```bash
# Ver historial de commits
git log --oneline -20

# Ver que cambio en un commit especifico
git show <commit_hash>

# Volver a una version anterior (SIN perder cambios, solo para ver)
git stash
git checkout <commit_hash>
# Para volver al presente:
git checkout main
git stash pop

# Revertir un commit especifico (crea un commit nuevo que deshace los cambios)
git revert <commit_hash>

# Ver diferencias entre dos commits
git diff <commit_viejo> <commit_nuevo>

# Ver diferencias de un archivo especifico
git diff <commit_viejo> <commit_nuevo> -- templates/patient_public_intake.html
```

---

## Versiones

### v3.2 - Simplificacion formulario publico + Resend domain
**Fecha:** 2026-02-18
**Commit:** `06bdd26`
**Commit anterior (para revertir):** `e1b51d5`

**Cambios:**

1. **Email Resend** - Dominio `fresherb.io` verificado en Resend
   - Antes: `RESEND_FROM=BiteTrack <onboarding@resend.dev>` (solo enviaba al dueño de la cuenta)
   - Ahora: `RESEND_FROM=BiteTrack <noreply@fresherb.io>` (envia a cualquier email)

2. **Formulario publico (patient_public_intake.html)** - Simplificado de 6 a 5 pasos:

   | Campo | Antes | Ahora |
   |-------|-------|-------|
   | Peso / Estatura | Obligatorio en Step 1 | ELIMINADO (se toma en consulta) |
   | Antecedentes medicos | 8 opciones | 17 opciones + campo libre "otros" |
   | Antecedentes familiares | 5 opciones | 8 opciones |
   | Horarios de comida | 3 inputs de hora (desayuno/almuerzo/cena) | Dropdown "cuantas comidas al dia" |
   | Habitos al comer | 3 checkboxes visibles | COMENTADO (se evalua en consulta) |
   | Registro 24h (R24) | Step 5 completo con selector de alimentos | COMENTADO (se hace en consulta) |
   | Pasos totales | 6 | 5 |

   **Antecedentes medicos agregados:**
   - Resistencia a la insulina
   - Hipertiroidismo (antes solo hipotiroidismo)
   - Enfermedad celiaca
   - Obesidad
   - SOP (Sindrome ovario poliquistico)
   - Higado graso
   - Enfermedad renal
   - Depresion/Ansiedad
   - Trastorno conducta alimentaria (TCA)
   - Campo libre: "Otro diagnostico no listado"

   **Antecedentes familiares agregados:**
   - Colesterol/Trigliceridos
   - Tiroides
   - Enfermedad renal

3. **Backend (app.py + models.py):**
   - Nuevos campos en DB: `otros_diagnosticos` (TEXT), `comidas_al_dia` (VARCHAR)
   - Migracion automatica incluida

**Archivos modificados:**
- `templates/patient_public_intake.html`
- `app.py`
- `models.py`
- `.env` (RESEND_FROM actualizado)

**Como revertir:**
```bash
# Revertir SOLO el formulario a la version anterior:
git checkout e1b51d5 -- templates/patient_public_intake.html

# Revertir TODO a la version anterior:
git revert 06bdd26
```

---

### v3.1 - Dummy data + fixes pauta
**Fecha:** 2026-02 (anterior)
**Commit:** `e1b51d5`

- Boton "Llenar Dummy Data" visible dentro del formulario
- Fix formato porciones en pauta nutricional

---

### v3.0 - Resend HTTP API + Railway fixes
**Commit:** `651ccbb`

- Migracion de SMTP a Resend HTTP API (Railway bloquea SMTP)
- load_dotenv con override=False para que Railway env vars tengan prioridad
- Print logs en email service para debugging en Railway

---

### Notas importantes

- **Railway:** Cada push a `main` trigerea un deploy automatico
- **Migraciones DB:** Los nuevos campos se agregan automaticamente via `/api/migrate`
- **Variables de entorno:** Actualizar en Railway dashboard (Variables) cuando se agreguen nuevas
- **Resend:** Domain `fresherb.io` verificado en region Sao Paulo (sa-east-1)
