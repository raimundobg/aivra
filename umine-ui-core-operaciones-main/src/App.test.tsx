import { render, screen } from '@testing-library/react'
import { AppShell } from '../src/app/AppShell'
import { expect, test } from 'vitest'

test('renders UMINE landing page', () => {
    render(<AppShell />)
    // Check for the main heading specifically
    const headings = screen.getAllByText(/UMINE/i)
    expect(headings.length).toBeGreaterThan(0)
    expect(headings[0]).toBeInTheDocument()
})
