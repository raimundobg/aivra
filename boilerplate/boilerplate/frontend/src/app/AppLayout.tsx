import { Box } from '@chakra-ui/react'
import BottomNav from '../organisms/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box minH="100dvh" bg="bg.canvas" pb={{ base: '72px', md: 0 }}>
      {children}
      <BottomNav />
    </Box>
  )
}
