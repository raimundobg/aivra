import { useState, useRef, useEffect } from 'react'
import { Box, Input, Stack, Text, Flex, Button } from '@chakra-ui/react'
import { COMMON_MEDICINES } from '../data/commonLists'
import { getMedicinesForDiagnosis } from '../data/medicineMap'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', border: 'rgba(95,111,82,0.15)', muted: '#7a7264', text: '#2D3319' }

interface MedicineSelectorProps {
  value: string[]
  onChange: (medicines: string[]) => void
  diagnoses?: string[]
}

export function MedicineSelector({ value, onChange, diagnoses = [] }: MedicineSelectorProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedMedicines = diagnoses.length > 0
    ? Array.from(new Set(diagnoses.flatMap(d => getMedicinesForDiagnosis(d))))
    : []

  const allMedicines = Array.from(new Set([...suggestedMedicines, ...COMMON_MEDICINES]))
  const filtered = allMedicines.filter(m =>
    m.toLowerCase().includes(search.toLowerCase()) &&
    !value.includes(m)
  )

  function addMedicine(medicine: string) {
    if (!value.includes(medicine)) {
      onChange([...value, medicine])
    }
    setSearch('')
    setOpen(false)
  }

  function addCustom() {
    if (customInput.trim() && !value.includes(customInput)) {
      onChange([...value, customInput])
      setCustomInput('')
      setSearch('')
      setOpen(false)
    }
  }

  function removeMedicine(medicine: string) {
    onChange(value.filter(m => m !== medicine))
  }

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <Box>
      {/* Selected medicines */}
      {value.length > 0 && (
        <Flex gap={2} flexWrap="wrap" mb={3}>
          {value.map(med => (
            <Box key={med} px={3} py={1.5} bg={C.greenLight} borderRadius="full" display="flex" alignItems="center" gap={2}>
              <Text fontSize="sm" color={C.text}>{med}</Text>
              <Button
                size="xs" variant="ghost" onClick={() => removeMedicine(med)}
                color={C.green} _hover={{ bg: 'rgba(95,111,82,0.1)' }} h={5} w={5} p={0}
              >
                ✕
              </Button>
            </Box>
          ))}
        </Flex>
      )}

      {/* Search input */}
      <Box position="relative" mb={2}>
        <Input
          ref={inputRef}
          placeholder="Busca o ingresa un medicamento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          borderRadius="xl"
          borderColor={C.border}
          _focus={{ borderColor: C.green, boxShadow: 'none' }}
          size="sm"
        />

        {/* Dropdown */}
        {open && (
          <Box
            position="absolute" top="100%" left={0} right={0} mt={2}
            bg="white" borderRadius="xl" borderWidth="1px" borderColor={C.border}
            zIndex={10} shadow="md" maxH="300px" overflowY="auto"
          >
            {suggestedMedicines.length > 0 && (
              <Box p={2}>
                <Text fontSize="xs" fontWeight="600" color={C.muted} mb={1}>Sugerencias (basado en diagnósticos)</Text>
                <Stack gap={1}>
                  {suggestedMedicines.filter(m => m.toLowerCase().includes(search.toLowerCase()) && !value.includes(m)).slice(0, 5).map(med => (
                    <Box
                      key={med} p={2} cursor="pointer" borderRadius="lg" _hover={{ bg: C.cream }}
                      onClick={() => addMedicine(med)}
                    >
                      <Text fontSize="sm" color={C.text}>{med}</Text>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {filtered.length > 0 && (
              <Box p={2} borderTopWidth="1px" borderColor={C.border}>
                <Text fontSize="xs" fontWeight="600" color={C.muted} mb={1}>Otros medicamentos</Text>
                <Stack gap={1}>
                  {filtered.slice(0, 8).map(med => (
                    <Box
                      key={med} p={2} cursor="pointer" borderRadius="lg" _hover={{ bg: C.cream }}
                      onClick={() => addMedicine(med)}
                    >
                      <Text fontSize="sm" color={C.text}>{med}</Text>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {customInput && (
              <Box p={2} borderTopWidth="1px" borderColor={C.border}>
                <Button
                  size="sm" variant="ghost" color={C.green} w="full" justifyContent="flex-start"
                  onClick={addCustom}
                >
                  ➕ Agregar "{customInput}"
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Custom input (always visible for typing new medicines) */}
      <Input
        placeholder="O ingresa un medicamento personalizado..."
        value={customInput}
        onChange={e => setCustomInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addCustom()}
        borderRadius="xl"
        borderColor={C.border}
        _focus={{ borderColor: C.green, boxShadow: 'none' }}
        size="sm"
        mb={customInput ? 2 : 0}
      />

      {customInput && (
        <Button
          size="sm" bg={C.green} color="white" w="full" borderRadius="lg"
          onClick={addCustom}
        >
          Agregar medicamento
        </Button>
      )}

      {!open && value.length === 0 && (
        <Text fontSize="xs" color={C.muted} mt={2}>
          Comienza a escribir para ver sugerencias basadas en tus diagnósticos
        </Text>
      )}
    </Box>
  )
}
