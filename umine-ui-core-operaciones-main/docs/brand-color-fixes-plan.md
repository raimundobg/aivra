# Plan: Fixing Remaining Brand Color Issues

## Problems Identified (from screenshots)

### Image 1 - Foregrounds (Text) Section in /colors
**Issue**: Colors are NOT updating with brand theme
- `fg.default` - Shows dark slate (should use brand primary.800)
- `fg.muted` - Shows gray slate (should use brand primary.500)
- `fg.accent` - Shows cyan (should use brand accent)
- `fg.inverted` - Shows white (correct, but should adapt to brand)
- `fg.brand` - Shows green (should use brand primary)

**Root Cause**: The Lambda is generating semantic tokens with **references** like `"primary.800"` but these are NOT being resolved properly by ScopedThemeProvider.

### Image 2 - System Buttons Section in /colors
**Issue**: Buttons are showing Umine green, NOT brand colors
- Primary button shows green (#10b981 approx) instead of brand primary
- Hover button shows lighter green instead of brand primary.600

**Root Cause**: Same as above - semantic token references not resolving.

### Image 3 - Preview Section in /brand-builder
**Issue**: Only the PREVIEW badge changed to red, everything else is still default
- Title "Identity: Santander" - Should use brand colors
- Description text - Should use brand secondary or muted
- Export buttons - Changed correctly (red/blue borders) ✅
- View toggle buttons - Primary button is green, should be brand primary
- System Buttons card - Buttons are green, should be brand colors
- Brand Metrics card - Chart is purple, should use brand colors

**Root Cause**: 
1. Typography components not using brand colors
2. ChartCard component not using brand colors
3. View toggle buttons partially working but not fully

---

## Solution Strategy

### Phase 1: Fix Lambda Semantic Token Generation
**Problem**: Lambda generates references like `"primary.800"` but should generate actual hex values

**Current Lambda Output**:
```json
"fg": {
  "default": { "value": { "_light": "primary.800", "_dark": "neutrals[0]" } }
}
```

**Should Be**:
```json
"fg": {
  "default": { "value": { "_light": "#actual_hex_from_primary_800", "_dark": "#actual_hex_from_neutrals_0" } }
}
```

**Action**: Update Lambda to **resolve references to actual hex values** before returning JSON.

---

### Phase 2: Enhance ScopedThemeProvider Token Resolution
**Backup Plan**: If Lambda can't resolve, ScopedThemeProvider should resolve references

**Action**: Add reference resolution logic:
```typescript
// Resolve "primary.800" to actual hex from palette.scales.primary["800"]
// Resolve "neutrals[0]" to actual hex from palette.neutrals[0]
```

---

### Phase 3: Fix Preview Section Components

#### 3.1 Typography Component (Title & Description)
**File**: `BrandPreviewSandbox.tsx`

**Current**:
```tsx
<Heading size="5xl">Identity: {overlay.brandId}</Heading>
<Text fontSize="lg" color="fg.muted">Summary of base component adaptation.</Text>
```

**Should Be**:
```tsx
<Heading size="5xl" color="brand.primary">Identity: {overlay.brandId}</Heading>
<Text fontSize="lg" color="brand.secondary">Summary of base component adaptation.</Text>
```

#### 3.2 ChartCard Component
**File**: `ChartCard.tsx` (needs investigation)

**Action**: Update chart colors to use brand palette

#### 3.3 Add Brand Indicator Tag to Typography Section
**New Requirement**: Add a tag showing which brand is active in the typography/foregrounds section

**Implementation**:
```tsx
<Heading>
  Foregrounds (Text) 
  {overlayTheme && (
    <Badge ml="4" bg="brand.primary" color="button.primary.fg">
      {overlayTheme.brandId}
    </Badge>
  )}
</Heading>
```

---

## Implementation Checklist

### Phase 1: Lambda Fix
- [ ] Update Lambda to resolve semantic token references to actual hex values
- [ ] Test Lambda output to ensure all tokens have hex values, not references
- [ ] Verify fg.default, fg.muted, fg.accent use actual brand colors

### Phase 2: ScopedThemeProvider Enhancement (Backup)
- [ ] Add reference resolution logic for "primary.XXX" patterns
- [ ] Add reference resolution logic for "neutrals[X]" patterns
- [ ] Test theme switching to ensure all tokens resolve correctly

### Phase 3: Preview Section Fixes
- [ ] Update BrandPreviewSandbox title to use brand.primary
- [ ] Update BrandPreviewSandbox description to use brand.secondary
- [ ] Investigate ChartCard component and update to use brand colors
- [ ] Add brand indicator tag to Foregrounds section in ColorsPage
- [ ] Add brand indicator tag to System Buttons section in ColorsPage

### Phase 4: Verification
- [ ] Generate new brand with AI
- [ ] Verify /colors Foregrounds section shows brand colors
- [ ] Verify /colors System Buttons section shows brand colors
- [ ] Verify /brand-builder Preview section uses brand colors throughout
- [ ] Verify brand indicator tags appear in ColorsPage sections

---

## Priority Order

1. **CRITICAL**: Fix Lambda semantic token generation (Phase 1)
2. **HIGH**: Fix Preview section typography (Phase 3.1)
3. **HIGH**: Add brand indicator tags (Phase 3.3)
4. **MEDIUM**: Fix ChartCard colors (Phase 3.2)
5. **LOW**: ScopedThemeProvider backup resolution (Phase 2)

---

## Expected Results

After implementation:
- ✅ `/colors` Foregrounds section shows brand-specific colors
- ✅ `/colors` System Buttons section shows brand-specific colors
- ✅ `/brand-builder` Preview title uses brand primary
- ✅ `/brand-builder` Preview description uses brand secondary
- ✅ `/brand-builder` Preview buttons use brand colors
- ✅ `/brand-builder` Preview chart uses brand colors
- ✅ Brand indicator tags appear in ColorsPage sections
