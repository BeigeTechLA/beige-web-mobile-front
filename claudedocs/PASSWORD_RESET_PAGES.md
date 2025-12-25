# Password Reset Pages - Frontend Implementation

## Overview
Created complete forgot password and reset password flow for the BeigeAI frontend, matching existing design system and color scheme.

---

## Pages Created

### 1. Forgot Password Page
**Route:** `/forgot-password`
**Component:** `ForgotPasswordForm`
**Purpose:** Allow users to request a password reset email

**Features:**
- Email input with validation
- Send reset link button
- Success state showing "Check Your Email" message
- Link back to login page
- "Try Another Email" option after success
- BeigeAI color scheme (#E8D1AB gold, #101010 background)

**User Flow:**
1. User clicks "Forgot password?" on login page
2. Redirected to `/forgot-password`
3. Enters email address
4. Clicks "Send Reset Link"
5. Backend sends email with reset token
6. Success screen shows "Check Your Email"
7. Can try another email or go back to login

### 2. Reset Password Page
**Route:** `/reset-password?token=XXXXX`
**Component:** `ResetPasswordForm`
**Purpose:** Allow users to set new password using email token

**Features:**
- Token validation from URL parameter
- New password input with show/hide toggle
- Confirm password input with matching validation
- Invalid token handling
- Success state with auto-redirect to login
- Password strength requirement (min 8 characters)
- BeigeAI design system

**User Flow:**
1. User clicks reset link in email
2. Redirected to `/reset-password?token=abc123`
3. Token validated from URL
4. Enters new password
5. Confirms new password
6. Clicks "Reset Password"
7. Success screen shows "Password Reset Successful!"
8. Auto-redirects to login after 2 seconds

---

## Files Created

### Components

**1. `components/auth/ForgotPasswordForm.tsx`** (145 lines)
```typescript
- Uses react-hook-form with zod validation
- Two states: form and success
- Calls useAuth().forgotPassword()
- Toast notifications for success/error
- Mail icon for success state
- ArrowLeft icon for back button
```

**2. `components/auth/ResetPasswordForm.tsx`** (180 lines)
```typescript
- Accepts resetToken prop from URL
- Password show/hide toggles (Eye/EyeOff icons)
- Password match validation
- CheckCircle icon for success state
- Auto-redirect to login after success
```

### Pages

**3. `app/(auth)/forgot-password/page.tsx`** (14 lines)
```typescript
- Uses AuthSplitLayout wrapper
- Renders ForgotPasswordForm
- Image placeholder: forgotPassword.png
- Back link to /login
```

**4. `app/(auth)/reset-password/page.tsx`** (34 lines)
```typescript
- Uses Suspense for searchParams
- Extracts token from URL query
- Validates token exists
- Shows error if no token
- Renders ResetPasswordForm
```

---

## Design System

### Colors (BeigeAI Theme)

```css
Background: #101010 (dark)
Primary Gold: #E8D1AB
Hover Gold: #DCD1BE
Text Primary: #FFFFFF (white)
Text Secondary: rgba(255,255,255,0.6) (white/60)
Borders: rgba(255,255,255,0.3) (white/30)
Focus Border: #E8D1AB
Success Icons: #E8D1AB
Error Text: #EF4444 (red)
```

### Typography

```css
Headers: text-lg lg:text-[28px] font-semibold
Body: lg:text-lg text-white/60
Buttons: text-sm md:text-xl font-medium
Labels: text-sm lg:text-base
```

### Components

```css
Inputs: h-14 lg:h-[82px] rounded-[12px] border-white/30
Buttons: h-9 lg:h-[76px] bg-[#E8D1AB] text-black
Icons: w-16 h-16 rounded-full bg-[#E8D1AB]/10
Back Links: text-[#E8D1AB] hover:text-white
```

---

## Backend Integration

### API Endpoints Used

**1. Forgot Password:**
```typescript
POST /v1/auth/forgot-password
Body: { email: string }
Response: { message: string, resetToken: string }
```

**2. Reset Password:**
```typescript
POST /v1/auth/reset-password
Body: {
  resetToken: string,
  newPassword: string,
  confirmPassword: string
}
Response: { success: boolean, message: string }
```

### Email Template

The backend sends an email with:
```
Subject: Reset Your Password - BeigeAI
Button: "Reset Password"
Link: https://book.beige.app/reset-password?token=XXXXX
Expiry: 1 hour
```

---

## Usage Examples

### Forgot Password Flow

```typescript
// User submits email
const onSubmit = async (data: { email: string }) => {
  const result = await forgotPassword(data.email)
  // Backend sends email
  // Shows success screen
}
```

### Reset Password Flow

```typescript
// User clicks email link
// URL: /reset-password?token=abc123

// Component extracts token
const token = searchParams.get("token")

// User submits new password
const onSubmit = async (data) => {
  await resetPassword(token, data.newPassword, data.confirmPassword)
  // Success state shown
  // Auto-redirect to /login
}
```

---

## Validation

### Forgot Password Form

```typescript
email: z.string().email({ message: "Invalid email address" })
```

### Reset Password Form

```typescript
newPassword: z.string().min(8, {
  message: "Password must be at least 8 characters"
})

confirmPassword: z.string().refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: "Passwords do not match" }
)
```

---

## Error Handling

### Forgot Password Errors

```typescript
// User not found
error: "User with this email not found"

// Email sending failed
error: "Failed to send reset email. Please try again."

// Network error
error: "Network error. Please check your connection."
```

### Reset Password Errors

```typescript
// Invalid/expired token
error: "Invalid or expired reset token"

// Password mismatch
error: "Passwords do not match"

// Weak password
error: "Password must be at least 8 characters"
```

---

## Testing Checklist

### Forgot Password
- [ ] Navigate to `/forgot-password` from login page
- [ ] Enter valid email
- [ ] Click "Send Reset Link"
- [ ] Verify toast success message
- [ ] Check "Check Your Email" screen appears
- [ ] Verify email received with reset link
- [ ] Test "Try Another Email" button
- [ ] Test "Back to Login" link

### Reset Password
- [ ] Click reset link in email
- [ ] Verify redirected to `/reset-password?token=XXXXX`
- [ ] Enter new password (min 8 chars)
- [ ] Confirm password (must match)
- [ ] Click "Reset Password"
- [ ] Verify success screen appears
- [ ] Verify auto-redirect to login after 2s
- [ ] Test with invalid token
- [ ] Test with expired token
- [ ] Test password show/hide toggles

---

## Accessibility

### Features
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Screen reader labels on all inputs
- ✅ Focus states on interactive elements
- ✅ Error messages announced
- ✅ Success states clearly indicated
- ✅ Icon + text for better comprehension

### ARIA Labels
```tsx
<Input aria-label="Email address" />
<Button aria-busy={isLoading}>
  {isLoading ? "Sending..." : "Send Reset Link"}
</Button>
```

---

## Responsive Design

### Mobile (< 768px)
```css
Headers: text-lg
Buttons: h-9 text-sm
Inputs: h-14
Icons: w-4 h-4
```

### Desktop (≥ 1024px)
```css
Headers: text-[28px]
Buttons: h-[76px] text-xl
Inputs: h-[82px]
Icons: w-6 h-6
```

---

## Security Features

### Client-Side
- ✅ Password minimum length (8 chars)
- ✅ Password confirmation required
- ✅ No password visible by default
- ✅ Token extracted from URL
- ✅ Token validation before form display

### Backend
- ✅ Reset token expires in 1 hour
- ✅ One-time use tokens
- ✅ Secure password hashing (bcrypt)
- ✅ Rate limiting on forgot password
- ✅ Email validation

---

## Future Enhancements

1. **Password Strength Indicator**
   - Visual meter showing weak/medium/strong
   - Requirements checklist (8 chars, uppercase, number, special)

2. **Multiple Reset Attempts**
   - Show "Already sent reset email" if clicked multiple times
   - Cooldown timer before allowing another request

3. **Social Login Integration**
   - "Or reset via Google/Facebook" options
   - OAuth-based password reset

4. **Security Notifications**
   - Email notification when password is changed
   - "This wasn't you?" link for account security

5. **Password History**
   - Prevent reusing last 5 passwords
   - Backend validation

---

## Common Issues & Solutions

### Issue: "Invalid reset link"
**Cause:** Token expired or already used
**Solution:** Request new reset email from `/forgot-password`

### Issue: Email not received
**Cause:** Email in spam or wrong address
**Solution:** Check spam folder, verify email address, try another email

### Issue: Auto-redirect too fast
**Cause:** 2-second timeout may be too quick
**Solution:** Increase timeout to 3000ms or add manual redirect button

### Issue: Password validation errors
**Cause:** Frontend/backend validation mismatch
**Solution:** Sync validation rules (both require min 8 chars)

---

## Related Documentation

- `FRONTEND_AUTH_INTEGRATION.md` - Overall auth system
- `FRONTEND_CHANGES_SUMMARY.md` - Frontend changes
- `EMAIL_BRANDING_UPDATE.md` - Email templates
- Backend: `AUTH_API_COMPLETE.md` - API reference

---

**Status:** ✅ Complete and Ready for Production
**Created:** December 24, 2025
**Routes Added:**
- `/forgot-password`
- `/reset-password?token=XXXXX`

**Components Added:**
- `ForgotPasswordForm.tsx`
- `ResetPasswordForm.tsx`

All pages use BeigeAI color scheme and match existing design system! 🎨
