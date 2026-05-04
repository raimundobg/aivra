import { Box, Flex, Text } from '@chakra-ui/react'

interface MetricCardProps {
  icon: string
  label: string
  value: string | number
  valueColor?: string
  subtitle?: string
}

export function MetricCard({ icon, label, value, valueColor = '#2D3319', subtitle }: MetricCardProps) {
  return (
    <Box bg="white" borderRadius="2xl" p={5} borderWidth="1px" borderColor="rgba(95,111,82,0.15)">
      <Flex align="center" gap={2} mb={2}>
        <Text fontSize="xl">{icon}</Text>
        <Text fontSize="xs" color="#7a7264" fontWeight="500">{label}</Text>
      </Flex>
      <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={valueColor} lineHeight="1">
        {value}
      </Text>
      {subtitle && (
        <Text fontSize="xs" color="#7a7264" mt={1}>{subtitle}</Text>
      )}
    </Box>
  )
}
