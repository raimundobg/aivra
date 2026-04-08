# Feedback Testing - 08 Abril 2026

## REGISTRO Y AUTH
- [ ] Ocultar tipo "Empresa" del registro (comment out)
- [ ] Contraseña incorrecta: texto mas visible (rojo) + popup "Contraseña incorrecta"
- [ ] Boton guardar horario: mensaje de exito al guardar
- [ ] Horarios: permitir submodulos por dia (ej: viernes 09:30-12:00 Y 15:00-20:00 como nested)
- [ ] Especialidades: buscador de keywords + signo "+" para desplegar mas opciones (UX mobile-friendly)
- [ ] Reset password para nutricionistas y pacientes (desde mini-settings)

## FICHA PACIENTE - UX GENERAL
- [ ] Invitar paciente: colores morados -> verde para contraste
- [ ] Modo editar vs visualizar: popup "Estas en modo visualizar, apreta Editar" al intentar click
- [ ] Info button en cada seccion explicando que se hace y como
- [ ] Alertas IA: popup mas imponente, descargables, incluir en ficha paciente
- [ ] Alertas IA: mostrar arriba del paciente en vista lista (horizontal, responsive)
- [ ] Barra de navegacion: hover over en botones (especialmente mobile)

## REGISTRO 24 HORAS
- [ ] Buscador poco intuitivo: dropdown debe expandirse con todos los campos
- [ ] Buscador debe tener filtro dentro del dropdown + buscar por grupo no solo alimento
- [ ] "apio" no aparece al buscar -> revisar base de datos alimentos
- [ ] Buscador funciona solo en desayuno, no en colacion/almuerzo/cena
- [ ] Barra de busqueda alejada: reemplazar por buscador POR CADA seccion de comida
- [ ] Si escribo texto libre (no de DB) que igual se guarde

## ANTROPOMETRIA
- [ ] Revisar si % grasa corporal considera pliegues cutaneos (consultar nutris)
- [ ] Ciclo menstrual/anticonceptivos: solo si sexo=Femenino (ya implementado, verificar)

## REQUERIMIENTOS NUTRICIONALES
- [ ] GET kcal se ve bien (OK)
- [ ] Metodo calculo: hover over mostrando que existen mas opciones
- [ ] Metodo factorial: no se ejecuta ni calcula GET al apretar recalcular
- [ ] Ajuste (kcal): no se entiende para que es -> agregar tooltip/explicacion
- [ ] Distribucion macronutrientes: layout horizontal, 4 en misma linea (fibra pasa a 2da linea)
- [ ] Si macros no suman 100%: mostrar porcentaje faltante visible

## RADAR DE HABITOS
- [ ] No muestra data (verificar fix anterior)

## BITEBOT ASISTENTE IA
- [ ] No esta conectado (arroja error)
- [ ] Faltas de ortografia

## PAUTA MANUAL
- [ ] Buscar alimentos dentro de DB + texto libre, integrados
- [ ] No muestra lo guardado despues de guardar
- [ ] Contraste verdoso + texto blanco (estandarizar con ficha)
- [ ] Output de pauta manual debe guardarse en R24 como seccion adicional "Pauta Manual"
- [ ] Proyectar con IA: mantener deshabilitado por ahora

## GENERADOR PAUTA IA
- [ ] ERROR 500: 'AlimentoSeleccionado' object has no attribute 'grupo_normalizado'
- [ ] Restriccion lactosa elegida pero pauta incluye lacteos -> NO respetar restricciones

## IMPRESION PDF
- [ ] No agarra todos los fields
- [ ] Layout cortado entre secciones
- [ ] Debe verse profesional como informe medico

## DASHBOARD NUTRICIONISTA
- [ ] Boton "Pauta de Alimentacion" sobra del dashboard principal
- [ ] Modo oscuro: texto "pre consulta" en boton invitar no se ve en modo claro
- [ ] Generar Pauta Alimentaria (menu lateral): diseño en cuadrados -> cambiar a lista con buscador
- [ ] "Lista Pacientes" vs "Abrir Ficha Paciente": estandarizar nombre
- [ ] Boton modo claro/oscuro: cambiar icono (parece settings), agregar hover over

## VISTA LISTA PACIENTES
- [ ] Alertas IA arriba de cada paciente (horizontal, responsive)
- [ ] Boton generar pauta: no funciona + no se entiende -> hacer mas explicito
- [ ] Boton ver: agregar hover over
- [ ] Logo modo oscuro: cambiar icono + hover over
