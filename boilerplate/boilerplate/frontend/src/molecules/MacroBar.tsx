import { Box, Flex, Text } from '@chakra-ui/react'

interface MacroBarProps {
  label: string
  value: number
  unit?: string
  color?: string
}

export function MacroBar({ label, value, unit = 'g', color = '#5F6F52' }: MacroBarProps) {
  return (
    <Flex align="center" justify="space-between" py={2} borderBottomWidth="1px" borderColor="rgba(95,111,82,0.1)">
      <Text fontSize="sm" color="#2D3319" fontWeight="500">{label}</Text>
      <Box px={3} py={1} borderRadius="full" bg="rgba(95,111,82,0.08)">
        <Text fontSize="sm" fontWeight="700" color={color}>{value}{unit}</Text>
      </Box>
    </Flex>
  )
}

interface MacroSummaryProps {
  calorias: number
  proteinas: number
  carbos: number
  grasas: number
}

export function MacroSummary({ calorias, proteinas, carbos, grasas }: MacroSummaryProps) {
  return (
    <Box>
      <Flex gap={4} flexWrap="wrap">
        {[
          { label: 'Kcal', value: calorias, unit: '', color: '#5F6F52' },
          { label: 'Prot', value: proteinas, unit: 'g', color: '#5F6F52' },
          { label: 'Carbos', value: carbos, unit: 'g', color: '#C6A28F' },
          { label: 'Grasas', value: grasas, unit: 'g', color: '#b88a74' },
        ].map(m => (
          <Box key={m.label} textAlign="center">
            <Text fontSize="lg" fontWeight="800" color={m.color}>{m.value}{m.unit}</Text>
            <Text fontSize="xs" color="#7a7264">{m.label}</Text>
          </Box>
        ))}
      </Flex>
    </Box>
  )
}
