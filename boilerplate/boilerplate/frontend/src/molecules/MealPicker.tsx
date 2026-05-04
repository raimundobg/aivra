import { useState, useEffect } from 'react'
import { Box, Input, Stack, Text, Flex, Button } from '@chakra-ui/react'
import type { Alimento, AlimentoSeleccionado } from '../types/nutrition'
import { calculateAlimentoTotals } from '../types/nutrition'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', border: 'rgba(95,111,82,0.15)', muted: '#7a7264', text: '#2D3319' }

interface MealPickerProps {
  mealName: string
  emoji: string
  value: AlimentoSeleccionado[]
  onChange: (foods: AlimentoSeleccionado[]) => void
  placeholder: string
}

export function MealPicker({ mealName, emoji, value, onChange, placeholder }: MealPickerProps) {
  const [alimentos, setAlimentos] = useState<Alimento[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Alimento[]>([])
  const [showResults, setShowResults] = useState(false)

  // Load food database on mount
  useEffect(() => {
    fetch('/alimentos.json')
      .then(r => r.json())
      .then(data => setAlimentos(data))
      .catch(console.error)
  }, [])

  // Search foods
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    const query = search.toLowerCase()
    const results = alimentos.filter(a =>
      a.alimento.toLowerCase().includes(query) ||
      a.medida_casera?.toLowerCase().includes(query)
    )
    setSearchResults(results.slice(0, 10))
    setShowResults(true)
  }, [search, alimentos])

  function addFood(food: Alimento) {
    const totals = calculateAlimentoTotals(food, 1)
    const selected: AlimentoSeleccionado = {
      ...food,
      ...totals,
    }
    onChange([...value, selected])
    setSearch('')
    setSearchResults([])
    setShowResults(false)
  }

  function updatePorciones(idx: number, porciones: number) {
    const food = value[idx]
    const totals = calculateAlimentoTotals(food, porciones)
    const updated = [...value]
    updated[idx] = {
      ...food,
      ...totals,
    }
    onChange(updated)
  }

  function removeFood(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  const totalKcal = value.reduce((sum, f) => sum + f.kcal_total, 0)

  return (
    <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={C.border} bg="white">
      <Text fontSize="sm" fontWeight="600" color={C.green} mb={3}>
        {emoji} {mealName}
      </Text>

      {/* Search box */}
      <Box position="relative" mb={4}>
        <Input
          placeholder={placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => search && setShowResults(true)}
          borderRadius="lg" size="sm"
          borderColor={C.border}
          _focus={{ borderColor: C.green, boxShadow: 'none' }}
        />

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <Box
            position="absolute" top="100%" left={0} right={0} mt={2}
            bg="white" borderRadius="lg" borderWidth="1px" borderColor={C.border}
            zIndex={50} shadow="md" maxH="250px" overflowY="auto"
          >
            {searchResults.map((food, idx) => (
              <Box
                key={idx}
                p={2.5} cursor="pointer" _hover={{ bg: C.cream }}
                onClick={() => addFood(food)} borderBottomWidth="1px" borderColor={C.border}
              >
                <Flex justify="space-between" align="start" gap={2}>
                  <Box flex={1}>
                    <Text fontSize="xs" fontWeight="600" color={C.text}>{food.alimento}</Text>
                    <Text fontSize="9px" color={C.muted}>{food.medida_casera}</Text>
                  </Box>
                  <Text fontSize="9px" fontWeight="600" color={C.green}>{food.kcal_porcion} kcal</Text>
                </Flex>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Selected foods */}
      {value.length > 0 && (
        <Stack gap={2} mb={3}>
          {value.map((food, idx) => (
            <Box key={idx} p={2.5} bg={C.cream} borderRadius="lg" borderWidth="1px" borderColor={C.border}>
              <Flex justify="space-between" align="start" mb={1.5} gap={2}>
                <Box flex={1}>
                  <Text fontSize="xs" fontWeight="600" color={C.text}>{food.alimento}</Text>
                  <Text fontSize="9px" color={C.muted}>{food.medida_casera}</Text>
                </Box>
                <Button
                  size="xs" variant="ghost" onClick={() => removeFood(idx)}
                  color={C.muted} _hover={{ color: C.green }} h={5} w={5} p={0}
                >
                  ✕
                </Button>
              </Flex>

              {/* Portion multiplier */}
              <Flex gap={2} align="center">
                <Text fontSize="xs" color={C.muted}>Porciones:</Text>
                <Flex gap={1} align="center">
                  <Button
                    size="xs" variant="outline" borderColor={C.border} color={C.green}
                    onClick={() => updatePorciones(idx, Math.max(0.5, food.porciones - 0.5))}
                    w={6} h={6} p={0} fontSize="sm"
                  >
                    −
                  </Button>
                  <Input
                    type="number" step="0.5" min="0.5" value={food.porciones}
                    onChange={e => updatePorciones(idx, parseFloat(e.target.value) || 1)}
                    w={12} h={6} textAlign="center" borderColor={C.border} borderRadius="md" size="sm"
                  />
                  <Button
                    size="xs" variant="outline" borderColor={C.border} color={C.green}
                    onClick={() => updatePorciones(idx, food.porciones + 0.5)}
                    w={6} h={6} p={0} fontSize="sm"
                  >
                    +
                  </Button>
                </Flex>
                <Text fontSize="xs" fontWeight="600" color={C.green} ml="auto">
                  {food.kcal_total.toFixed(0)} kcal
                </Text>
              </Flex>
            </Box>
          ))}
        </Stack>
      )}

      {/* Summary */}
      {value.length > 0 && (
        <Box p={2} bg={C.greenLight} borderRadius="lg">
          <Text fontSize="xs" color={C.green} fontWeight="600">
            Total: {totalKcal.toFixed(0)} kcal | P:{value.reduce((s, f) => s + f.proteinas_total, 0).toFixed(0)}g C:{value.reduce((s, f) => s + f.carbohidratos_total, 0).toFixed(0)}g F:{value.reduce((s, f) => s + f.lipidos_total, 0).toFixed(0)}g
          </Text>
        </Box>
      )}

      {value.length === 0 && !search && (
        <Text fontSize="xs" color={C.muted}>Busca alimentos para agregar a esta comida</Text>
      )}
    </Box>
  )
}
