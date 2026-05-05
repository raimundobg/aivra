import { useState, useEffect } from 'react'
import { Box, Button, Flex, Grid, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { markActiveToday } from '../utils/activity'
import type { Alimento, AlimentoSeleccionado, MealKey } from '../types/nutrition'
import { MEAL_KEYS, MEAL_DISTRIBUTION, calculateAlimentoTotals } from '../types/nutrition'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', beige: '#E9DFD3', border: 'rgba(95,111,82,0.15)', text: '#2D3319', muted: '#7a7264', rose: '#C6A28F' }

export function R24Editor({ patientId, targetGet }: { patientId: string; targetGet?: number }) {
  const [alimentos, setAlimentos] = useState<Alimento[]>([])
  const [meals, setMeals] = useState<Record<MealKey, AlimentoSeleccionado[]>>({
    desayuno: [],
    colacion_am: [],
    almuerzo: [],
    colacion_pm: [],
    cena: [],
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Alimento[]>([])
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('desayuno')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load food database
  useEffect(() => {
    fetch('/alimentos.json')
      .then(r => r.json())
      .then((data: Alimento[]) => {
        setAlimentos(data)
      })
      .catch(console.error)
  }, [])

  // Load patient's R24 for today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const r24Ref = doc(db, 'users', patientId, 'r24', today)
    getDoc(r24Ref).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        setMeals(data.meals || meals)
      }
    })
  }, [patientId])

  // Search foods
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const query = searchQuery.toLowerCase()
    const results = alimentos.filter(a =>
      a.alimento.toLowerCase().includes(query) ||
      a.subgrupo?.toLowerCase().includes(query)
    )
    setSearchResults(results.slice(0, 10))
  }, [searchQuery, alimentos])

  function addFoodToMeal(food: Alimento) {
    const totals = calculateAlimentoTotals(food, 1)
    const selected: AlimentoSeleccionado = {
      ...food,
      ...totals,
    }
    setMeals(prev => ({
      ...prev,
      [selectedMeal]: [...prev[selectedMeal], selected],
    }))
    setSearchQuery('')
    setSearchResults([])
  }

  function updatePorciones(mealKey: MealKey, foodIdx: number, porciones: number) {
    setMeals(prev => {
      const newMeals = { ...prev }
      const food = newMeals[mealKey][foodIdx]
      const totals = calculateAlimentoTotals(food, porciones)
      newMeals[mealKey][foodIdx] = {
        ...food,
        ...totals,
      }
      return newMeals
    })
  }

  function removeFood(mealKey: MealKey, foodIdx: number) {
    setMeals(prev => ({
      ...prev,
      [mealKey]: prev[mealKey].filter((_, i) => i !== foodIdx),
    }))
  }

  async function saveR24() {
    setSaving(true)
    setSaved(false)
    const today = new Date().toISOString().split('T')[0]
    const r24Ref = doc(db, 'users', patientId, 'r24', today)
    try {
      await setDoc(r24Ref, { meals, savedAt: serverTimestamp() }, { merge: true })
      markActiveToday(patientId)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const mealStats = Object.entries(meals).map(([key, foods]) => {
    const mealKey = key as MealKey
    const kcal = foods.reduce((sum, f) => sum + f.kcal_total, 0)
    const protein = foods.reduce((sum, f) => sum + f.proteinas_total, 0)
    const carbs = foods.reduce((sum, f) => sum + f.carbohidratos_total, 0)
    const fat = foods.reduce((sum, f) => sum + f.lipidos_total, 0)
    const target = targetGet ? targetGet * MEAL_DISTRIBUTION[mealKey] : 0
    return { mealKey, kcal, protein, carbs, fat, target, count: foods.length }
  })

  const dailyTotals = {
    kcal: mealStats.reduce((sum, s) => sum + s.kcal, 0),
    protein: mealStats.reduce((sum, s) => sum + s.protein, 0),
    carbs: mealStats.reduce((sum, s) => sum + s.carbs, 0),
    fat: mealStats.reduce((sum, s) => sum + s.fat, 0),
  }

  return (
    <Box bg={C.cream} borderRadius="2xl" p={6} borderWidth="1px" borderColor={C.border}>
      <Heading fontFamily="heading" fontSize="lg" fontWeight="800" color={C.text} mb={4}>
        📋 Registro 24 horas
      </Heading>

      {/* Daily summary */}
      {targetGet && (
        <Grid templateColumns="repeat(4, 1fr)" gap={3} mb={6}>
          <Box bg="white" borderRadius="xl" p={3} borderWidth="1px" borderColor={C.border}>
            <Text fontSize="xs" color={C.muted} mb={1}>Kcal consumidas</Text>
            <Flex align="baseline" gap={1}>
              <Text fontFamily="heading" fontWeight="800" fontSize="lg" color={C.green}>
                {dailyTotals.kcal.toFixed(0)}
              </Text>
              <Text fontSize="xs" color={C.muted}>/ {targetGet}</Text>
            </Flex>
            <Text fontSize="9px" color={dailyTotals.kcal >= targetGet * 0.9 ? C.green : '#d97706'} fontWeight="600" mt={1}>
              {((dailyTotals.kcal / targetGet) * 100).toFixed(0)}%
            </Text>
          </Box>
          {[
            { label: 'Proteína', value: dailyTotals.protein, unit: 'g' },
            { label: 'Carbos', value: dailyTotals.carbs, unit: 'g' },
            { label: 'Grasas', value: dailyTotals.fat, unit: 'g' },
          ].map(m => (
            <Box key={m.label} bg="white" borderRadius="xl" p={3} borderWidth="1px" borderColor={C.border}>
              <Text fontSize="xs" color={C.muted} mb={1}>{m.label}</Text>
              <Text fontFamily="heading" fontWeight="800" fontSize="lg" color={C.text}>
                {m.value.toFixed(1)}{m.unit}
              </Text>
            </Box>
          ))}
        </Grid>
      )}

      {/* Meals tabs */}
      <Flex gap={2} mb={4} flexWrap="wrap">
        {Object.entries(MEAL_KEYS).map(([key, label]) => (
          <Box
            key={key}
            px={3}
            py={2}
            borderRadius="full"
            cursor="pointer"
            bg={selectedMeal === key ? C.green : 'white'}
            borderWidth="1px"
            borderColor={selectedMeal === key ? C.green : C.border}
            onClick={() => setSelectedMeal(key as MealKey)}
            transition="all 0.2s"
          >
            <Text fontSize="sm" fontWeight={selectedMeal === key ? 700 : 500}
              color={selectedMeal === key ? 'white' : C.muted}>
              {label}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* Food search */}
      <Box mb={4}>
        <Input
          placeholder="Buscar alimento..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          borderRadius="full"
          borderColor={C.border}
          _focus={{ borderColor: C.green, boxShadow: 'none' }}
          mb={searchResults.length > 0 ? 2 : 0}
        />
        {searchResults.length > 0 && (
          <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor={C.border} maxH="300px" overflowY="auto">
            <Stack gap={0}>
              {searchResults.map((food, i) => (
                <Flex
                  key={i}
                  align="center"
                  justify="space-between"
                  px={3}
                  py={2}
                  borderBottomWidth={i < searchResults.length - 1 ? '1px' : '0'}
                  borderColor={C.border}
                  cursor="pointer"
                  _hover={{ bg: C.greenLight }}
                  onClick={() => addFoodToMeal(food)}
                >
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="600" color={C.text}>{food.alimento}</Text>
                    <Text fontSize="xs" color={C.muted}>{food.medida_casera} - {food.kcal_porcion} kcal</Text>
                  </Box>
                  <Button size="xs" variant="ghost" color={C.green} borderRadius="full">+</Button>
                </Flex>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Selected meal foods */}
      <Stack gap={2} mb={4}>
        {meals[selectedMeal].length === 0 ? (
          <Text fontSize="sm" color={C.muted} textAlign="center" py={4}>
            Sin alimentos agregados. Busca para agregar.
          </Text>
        ) : (
          meals[selectedMeal].map((food, idx) => (
            <Box key={idx} bg="white" borderRadius="xl" p={3} borderWidth="1px" borderColor={C.border}>
              <Flex justify="space-between" align="flex-start" mb={2}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="600" color={C.text}>{food.alimento}</Text>
                  <Text fontSize="xs" color={C.muted}>{food.medida_casera}</Text>
                </Box>
                <Button size="xs" variant="ghost" color="#e53e3e" borderRadius="full"
                  onClick={() => removeFood(selectedMeal, idx)}>
                  ✕
                </Button>
              </Flex>
              <Flex gap={2} align="center">
                <Text fontSize="xs" color={C.muted} minW="60px">Porciones:</Text>
                <Flex align="center" gap={1}>
                  <Button size="xs" variant="outline" borderColor={C.border} color={C.green}
                    onClick={() => updatePorciones(selectedMeal, idx, Math.max(0.5, food.porciones - 0.5))}
                    w={6} h={6} p={0} fontSize="md" minW={0}>−</Button>
                  <Input
                    type="number" min="0.5" step="0.5" value={food.porciones}
                    onChange={e => updatePorciones(selectedMeal, idx, parseFloat(e.target.value) || 0.5)}
                    size="sm" borderRadius="md" w="52px" textAlign="center"
                    borderColor={C.border} _focus={{ borderColor: C.green, boxShadow: 'none' }}
                  />
                  <Button size="xs" variant="outline" borderColor={C.border} color={C.green}
                    onClick={() => updatePorciones(selectedMeal, idx, food.porciones + 0.5)}
                    w={6} h={6} p={0} fontSize="md" minW={0}>+</Button>
                </Flex>
                <Text fontSize="xs" color={C.green} fontWeight="600" ml="auto">{food.kcal_total.toFixed(0)} kcal</Text>
              </Flex>
            </Box>
          ))
        )}
      </Stack>

      {/* Meal summary */}
      {mealStats.find(s => s.mealKey === selectedMeal) && (
        <Box bg={C.greenLight} borderRadius="xl" p={3} mb={4}>
          {(() => {
            const stat = mealStats.find(s => s.mealKey === selectedMeal)!
            return (
              <Stack gap={1}>
                <Flex justify="space-between">
                  <Text fontSize="sm" fontWeight="600" color={C.green}>Calorías</Text>
                  <Text fontSize="sm" fontWeight="700" color={C.green}>{stat.kcal.toFixed(0)} kcal</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontSize="xs" color={C.muted}>P: {stat.protein.toFixed(1)}g | C: {stat.carbs.toFixed(1)}g | G: {stat.fat.toFixed(1)}g</Text>
                </Flex>
              </Stack>
            )
          })()}
        </Box>
      )}

      {saved && (
        <Box p={3} bg={C.greenLight} borderRadius="xl" textAlign="center" mb={3}>
          <Text fontSize="sm" fontWeight="700" color={C.green}>✓ Registro guardado correctamente</Text>
        </Box>
      )}

      {/* Save button */}
      <Button
        w="full"
        bg={C.green}
        color="white"
        borderRadius="full"
        fontWeight="700"
        _hover={{ opacity: 0.9 }}
        onClick={saveR24}
        loading={saving}
      >
        💾 Guardar Registro 24h
      </Button>
    </Box>
  )
}
