import { useState, useRef, useEffect } from 'react'
import { Box, Input, Stack, Text, Flex, Button } from '@chakra-ui/react'

const C = { green: '#5F6F52', greenLight: '#eef2ea', cream: '#F9F4EF', border: 'rgba(95,111,82,0.15)', muted: '#7a7264', text: '#2D3319' }

interface MultiSelectDropdownProps {
  value: string[]
  onChange: (items: string[]) => void
  options: string[]
  placeholder?: string
  allowCustom?: boolean
  label?: string
}

export function MultiSelectDropdown({
  value,
  onChange,
  options,
  placeholder = 'Busca y selecciona...',
  allowCustom = false,
  label,
}: MultiSelectDropdownProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase()) &&
    !value.includes(opt)
  )

  function addItem(item: string) {
    if (!value.includes(item)) {
      onChange([...value, item])
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

  function removeItem(item: string) {
    onChange(value.filter(v => v !== item))
  }

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <Box>
      {/* Selected items */}
      {value.length > 0 && (
        <Flex gap={2} flexWrap="wrap" mb={3}>
          {value.map(item => (
            <Box key={item} px={3} py={1.5} bg={C.greenLight} borderRadius="full" display="flex" alignItems="center" gap={2}>
              <Text fontSize="sm" color={C.text}>{item}</Text>
              <Button
                size="xs" variant="ghost" onClick={() => removeItem(item)}
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
          placeholder={placeholder}
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
            {filtered.length > 0 ? (
              <Stack gap={0}>
                {filtered.slice(0, 15).map(opt => (
                  <Box
                    key={opt} p={2.5} cursor="pointer" _hover={{ bg: C.cream }} borderBottomWidth="1px" borderColor={C.border}
                    onClick={() => addItem(opt)}
                  >
                    <Text fontSize="sm" color={C.text}>{opt}</Text>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box p={3}>
                <Text fontSize="sm" color={C.muted}>Sin resultados</Text>
              </Box>
            )}

            {allowCustom && customInput && (
              <Box p={2} borderTopWidth="1px" borderColor={C.border} bg={C.cream}>
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

      {/* Custom input */}
      {allowCustom && (
        <>
          <Input
            placeholder="O ingresa algo personalizado..."
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
              Agregar
            </Button>
          )}
        </>
      )}

      {!open && value.length === 0 && (
        <Text fontSize="xs" color={C.muted} mt={2}>
          {label || 'Comienza a escribir para ver opciones'}
        </Text>
      )}
    </Box>
  )
}
